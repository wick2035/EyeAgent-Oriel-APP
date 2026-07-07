/**
 * E2EE 加密模块
 * 基于 elliptic (ECDH P-256) + node-forge (AES-GCM / HKDF)
 * 实现端到端加密的密钥生成、协商、消息加解密
 */

import './cryptoPolyfill.js'
import EC from 'elliptic/lib/elliptic/ec'
import forge from 'node-forge'
import {
	savePrivateKeyForVersion,
	loadPrivateKeyForVersion,
	loadActivePrivateKey,
	listLocalKeyVersions,
	setKeyStatus,
	setActiveKeyVersion,
	getActiveKeyVersion,
	migrateLegacyStorage,
	clearAllLocalKeys
} from './keyStorage.js'
import { uploadPublicKey, getPublicKey, getKeyDiag, rotateKey, uploadKeyEscrow } from '@/utils/api/e2eeChat.js'
import { getUserInfo } from '@/store/user.js'

// P-256 曲线实例
const ec = new EC('p256')

// Session key 内存缓存: Map<`${sessionId}:${receiverKeyVersion}:${senderKeyVersion}`, Uint8Array(32)>
const sessionKeyCache = new Map()

// 本地私钥内存缓存: Map<keyVersion, privateKeyHex>
const privateKeyCache = new Map()
// 当前 ACTIVE 版本号
let activeKeyVersion = 0

// 对方公钥缓存:
//   Map<`${userType}:${userId}`, { publicKey, keyVersion }>          当前 ACTIVE
//   Map<`${userType}:${userId}:${keyVersion}`, { publicKey, keyVersion }> 指定历史版本
const peerKeyCache = new Map()

// ======================== SPKI 格式转换 ========================

/**
 * P-256 SPKI ASN.1 结构的固定头部（DER 编码）
 * AlgorithmIdentifier: OID 1.2.840.10045.2.1 (EC) + OID 1.2.840.10045.3.1.7 (P-256)
 */
const SPKI_HEADER = new Uint8Array([
	0x30, 0x59, // SEQUENCE, 89 bytes
	0x30, 0x13, // SEQUENCE, 19 bytes (AlgorithmIdentifier)
	0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01, // OID ecPublicKey
	0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07, // OID P-256
	0x03, 0x42, 0x00 // BIT STRING, 66 bytes, 0 unused bits
])

/**
 * 将原始公钥点（65字节，04||x||y）包装为 SPKI DER 格式并 Base64 编码
 */
function wrapInSPKI(rawPublicKeyBytes) {
	const spki = new Uint8Array(SPKI_HEADER.length + rawPublicKeyBytes.length)
	spki.set(SPKI_HEADER, 0)
	spki.set(rawPublicKeyBytes, SPKI_HEADER.length)
	return uint8ArrayToBase64(spki)
}

/**
 * 从 SPKI Base64 中提取原始公钥点（65字节）
 */
function unwrapSPKI(base64String) {
	const der = base64ToUint8Array(base64String)
	// SPKI header 是 26 字节，公钥从偏移 26 开始
	if (der.length !== 91) {
		throw new Error('无效的 SPKI 公钥长度: ' + der.length)
	}
	return der.slice(SPKI_HEADER.length)
}

// ======================== Base64 工具 ========================

function uint8ArrayToBase64(bytes) {
	let binary = ''
	for (let i = 0; i < bytes.length; i++) {
		binary += String.fromCharCode(bytes[i])
	}
	return forge.util.encode64(binary)
}

function base64ToUint8Array(base64) {
	const binary = forge.util.decode64(base64)
	const bytes = new Uint8Array(binary.length)
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i)
	}
	return bytes
}

function hexToUint8Array(hex) {
	const bytes = new Uint8Array(hex.length / 2)
	for (let i = 0; i < hex.length; i += 2) {
		bytes[i / 2] = parseInt(hex.substr(i, 2), 16)
	}
	return bytes
}

function uint8ArrayToHex(bytes) {
	return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

function uint8ArrayToBinaryString(bytes) {
	let str = ''
	for (let i = 0; i < bytes.length; i++) {
		str += String.fromCharCode(bytes[i])
	}
	return str
}

function binaryStringToUint8Array(str) {
	const bytes = new Uint8Array(str.length)
	for (let i = 0; i < str.length; i++) {
		bytes[i] = str.charCodeAt(i)
	}
	return bytes
}

// ======================== 密钥生成 ========================

/**
 * 生成 ECDH P-256 密钥对
 * @returns {{ publicKeyBase64: string, privateKeyHex: string, publicKeyHex: string }}
 */
export function generateKeyPair() {
	const keyPair = ec.genKeyPair()
	const publicKeyRaw = hexToUint8Array(keyPair.getPublic('hex'))
	const privateKeyHex = keyPair.getPrivate('hex')
	const publicKeyBase64 = wrapInSPKI(publicKeyRaw)

	return {
		publicKeyBase64,
		privateKeyHex,
		publicKeyHex: keyPair.getPublic('hex')
	}
}

// ======================== ECDH 密钥协商 ========================

/**
 * ECDH 共享密钥派生
 * @param {string} myPrivateKeyHex - 己方私钥 hex
 * @param {string} peerPublicKeyBase64 - 对方公钥 SPKI Base64
 * @returns {Uint8Array} 32字节共享密钥
 */
function ecdhDeriveBits(myPrivateKeyHex, peerPublicKeyBase64) {
	const myKey = ec.keyFromPrivate(myPrivateKeyHex, 'hex')
	const peerRaw = unwrapSPKI(peerPublicKeyBase64)
	const peerKey = ec.keyFromPublic(uint8ArrayToHex(peerRaw), 'hex')
	const shared = myKey.derive(peerKey.getPublic())
	// 转为 32 字节，左侧填充0
	const sharedHex = shared.toString(16).padStart(64, '0')
	return hexToUint8Array(sharedHex)
}

/**
 * HKDF-SHA256 派生会话密钥
 * @param {Uint8Array} sharedBits - ECDH 共享密钥
 * @param {string} sessionId - 会话ID（用作 salt）
 * @returns {Uint8Array} 32字节 AES-256 密钥
 */
function hkdfDeriveKey(sharedBits, sessionId) {
	const hmac = forge.hmac.create()

	// HKDF Extract: PRK = HMAC-SHA256(salt, IKM)
	const salt = forge.util.encodeUtf8(sessionId)
	hmac.start('sha256', salt)
	hmac.update(uint8ArrayToBinaryString(sharedBits))
	const prk = hmac.digest().getBytes()

	// HKDF Expand: OKM = HMAC-SHA256(PRK, info || 0x01)
	const info = forge.util.encodeUtf8('chat-session')
	const hmac2 = forge.hmac.create()
	hmac2.start('sha256', prk)
	hmac2.update(info)
	hmac2.update(String.fromCharCode(0x01))
	const okm = hmac2.digest().getBytes()

	return binaryStringToUint8Array(okm)
}

/**
 * 派生会话密钥（完整流程）
 * @param {string} myPrivateKeyHex - 己方私钥
 * @param {string} peerPublicKeyBase64 - 对方公钥 SPKI Base64
 * @param {string} sessionId - 会话ID
 * @returns {Uint8Array} 32字节 AES-256-GCM 密钥
 */
export function deriveSessionKey(myPrivateKeyHex, peerPublicKeyBase64, sessionId) {
	const sharedBits = ecdhDeriveBits(myPrivateKeyHex, peerPublicKeyBase64)
	return hkdfDeriveKey(sharedBits, sessionId)
}

// ======================== AES-GCM 加解密 ========================

/**
 * AES-256-GCM 加密
 * @param {Uint8Array} sessionKey - 32字节密钥
 * @param {string} plaintext - 明文
 * @returns {{ encryptedContent: string, iv: string }} Base64 编码的密文和 IV
 */
export function encryptMessage(sessionKey, plaintext) {
	// 生成 12 字节随机 IV
	const ivBytes = forge.random.getBytesSync(12)
	const iv = binaryStringToUint8Array(ivBytes)

	// AES-GCM 加密
	const cipher = forge.cipher.createCipher('AES-GCM', uint8ArrayToBinaryString(sessionKey))
	cipher.start({ iv: ivBytes, tagLength: 128 })
	cipher.update(forge.util.createBuffer(forge.util.encodeUtf8(plaintext)))
	cipher.finish()

	// 密文 + AuthTag 拼接
	const encrypted = cipher.output.getBytes()
	const tag = cipher.mode.tag.getBytes()
	const combined = encrypted + tag

	return {
		encryptedContent: forge.util.encode64(combined),
		iv: uint8ArrayToBase64(iv)
	}
}

/**
 * AES-256-GCM 解密
 * @param {Uint8Array} sessionKey - 32字节密钥
 * @param {string} encryptedContentBase64 - Base64 密文（含 AuthTag）
 * @param {string} ivBase64 - Base64 IV
 * @returns {string} 解密后的明文
 */
export function decryptMessage(sessionKey, encryptedContentBase64, ivBase64) {
	const combined = forge.util.decode64(encryptedContentBase64)
	const ivBytes = forge.util.decode64(ivBase64)

	// 分离密文和 AuthTag（最后 16 字节是 tag）
	const encrypted = combined.slice(0, combined.length - 16)
	const tag = combined.slice(combined.length - 16)

	const decipher = forge.cipher.createDecipher('AES-GCM', uint8ArrayToBinaryString(sessionKey))
	decipher.start({
		iv: ivBytes,
		tagLength: 128,
		tag: forge.util.createBuffer(tag)
	})
	decipher.update(forge.util.createBuffer(encrypted))
	const pass = decipher.finish()

	if (!pass) {
		throw new Error('AES-GCM 解密失败：认证标签不匹配')
	}

	return forge.util.decodeUtf8(decipher.output.getBytes())
}

// ======================== Session Key 管理 ========================

export const KEY_UNAVAILABLE = 'KEY_UNAVAILABLE'
export const PEER_KEY_UNAVAILABLE = 'PEER_KEY_UNAVAILABLE'

function loadPrivateKeyVersion(keyVersion, userId) {
	if (privateKeyCache.has(keyVersion)) return privateKeyCache.get(keyVersion)
	const stored = loadPrivateKeyForVersion(keyVersion, userId)
	if (!stored) return null
	privateKeyCache.set(keyVersion, stored.privateKeyHex)
	return stored.privateKeyHex
}

/**
 * 获取或派生会话密钥（按 (sessionId, receiverKeyVersion, senderKeyVersion) 缓存）
 *
 * @param {string} sessionId
 * @param {string} peerUserType - DOCTOR 或 PATIENT
 * @param {string} peerUserId
 * @param {Object} [opts] - 解密历史消息时必传；发送新消息时不传（自动用 ACTIVE 版本）
 * @param {number} [opts.receiverKeyVersion] - 对应加密用的己方私钥版本
 * @param {number} [opts.senderKeyVersion]   - 对应加密用的对方公钥版本
 * @returns {Promise<{ sessionKey: Uint8Array, senderKeyVersion: number, receiverKeyVersion: number }>}
 */
export async function getOrDeriveSessionKey(sessionId, peerUserType, peerUserId, opts) {
	const userInfo = getUserInfo()
	if (!userInfo || !userInfo.id) throw new Error('用户未登录')

	// 解析目标版本
	let receiverKeyVersion = opts && opts.receiverKeyVersion
	let senderKeyVersion = opts && opts.senderKeyVersion

	if (!receiverKeyVersion) {
		if (!activeKeyVersion) throw new Error('私钥未加载，请先调用 ensureE2EEReady()')
		receiverKeyVersion = activeKeyVersion
	}

	// 加载对应版本的己方私钥
	const myPrivateKeyHex = loadPrivateKeyVersion(receiverKeyVersion, userInfo.id)
	if (!myPrivateKeyHex) {
		const err = new Error('本地缺少对应版本的私钥，无法解密')
		err.code = KEY_UNAVAILABLE
		err.receiverKeyVersion = receiverKeyVersion
		throw err
	}

	// 拉取对方公钥
	let peerKeyData
	try {
		peerKeyData = await fetchPeerPublicKey(peerUserType, peerUserId, senderKeyVersion)
	} catch (e) {
		const err = new Error('无法获取对方公钥')
		err.code = PEER_KEY_UNAVAILABLE
		err.cause = e
		throw err
	}
	if (!senderKeyVersion) senderKeyVersion = peerKeyData.keyVersion

	// 缓存 key（区分版本对）
	const cacheKey = `${sessionId}:${receiverKeyVersion}:${senderKeyVersion}`
	if (sessionKeyCache.has(cacheKey)) {
		return {
			sessionKey: sessionKeyCache.get(cacheKey),
			senderKeyVersion,
			receiverKeyVersion
		}
	}

	const sessionKey = deriveSessionKey(myPrivateKeyHex, peerKeyData.publicKey, sessionId)
	sessionKeyCache.set(cacheKey, sessionKey)
	return { sessionKey, senderKeyVersion, receiverKeyVersion }
}

/**
 * 发送新消息前的便捷封装 — 一次性拿到 sessionKey + 两端最新版本号
 */
export async function sendingKeyContext(sessionId, peerUserType, peerUserId) {
	return getOrDeriveSessionKey(sessionId, peerUserType, peerUserId)
}

/**
 * 获取对方公钥（带缓存；可指定历史版本）
 */
async function fetchPeerPublicKey(userType, userId, keyVersion) {
	const cacheKey = keyVersion ? `${userType}:${userId}:${keyVersion}` : `${userType}:${userId}`
	if (peerKeyCache.has(cacheKey)) return peerKeyCache.get(cacheKey)

	const res = await getPublicKey(userType, userId, keyVersion)
	if (!res || res.code !== 200 || !res.data) {
		throw { code: (res && res.code) || -1, message: (res && res.msg) || '获取对方公钥失败' }
	}
	const keyData = {
		publicKey: res.data.publicKey,
		keyVersion: res.data.keyVersion,
		status: res.data.status
	}
	peerKeyCache.set(cacheKey, keyData)
	return keyData
}

/**
 * 使指定用户的 session key / 公钥缓存失效（对方密钥轮换时使用）
 */
export function invalidateSessionKey(userId) {
	for (const [key] of sessionKeyCache) sessionKeyCache.delete(key)
	for (const [key] of peerKeyCache) {
		if (key.includes(userId)) peerKeyCache.delete(key)
	}
}

/**
 * 清除所有内存缓存（登出时调用；不清磁盘，磁盘用 clearAllLocalKeys）
 */
export function clearAllKeys() {
	sessionKeyCache.clear()
	peerKeyCache.clear()
	privateKeyCache.clear()
	activeKeyVersion = 0
}

// ======================== E2EE 初始化 ========================

/**
 * 启动时确保 E2EE 就绪（v1.2）：
 *   1. 迁移旧存储
 *   2. 用 /keys/self/diag 与服务端对账
 *   3. 若本地无对应 ACTIVE 私钥 → 强制 rotate（旧版本保留为 REVOKED 供历史解密）
 *   4. 同步服务端 REVOKED 状态到本地
 *
 * @returns {Promise<{ keyVersion: number }>}
 */
export async function ensureE2EEReady() {
	const userInfo = getUserInfo()
	if (!userInfo || !userInfo.id) throw new Error('用户未登录')

	migrateLegacyStorage(userInfo.id)

	// 查询服务端状态
	let diagRes
	try {
		diagRes = await getKeyDiag()
	} catch (e) {
		console.warn('E2EE: /keys/self/diag 请求失败:', e)
		diagRes = null
	}

	const serverKeys = (diagRes && diagRes.code === 200 && diagRes.data && diagRes.data.keys) || []
	const serverActive = serverKeys.find(k => k.status === 'ACTIVE')

	// 情况 A：服务端没有任何 ACTIVE（新用户 / 服务端数据清空）
	if (!serverActive) {
		return await bootstrapFreshKey(userInfo.id)
	}

	// 情况 B：服务端有 ACTIVE → 检查本地是否持有该版本的私钥
	const localEntry = loadPrivateKeyForVersion(serverActive.keyVersion, userInfo.id)
	if (localEntry && localEntry.status !== 'REVOKED') {
		privateKeyCache.set(serverActive.keyVersion, localEntry.privateKeyHex)
		activeKeyVersion = serverActive.keyVersion
		setActiveKeyVersion(serverActive.keyVersion)
		syncRevokedStatusFromServer(serverKeys)
		return { keyVersion: activeKeyVersion }
	}

	// 情况 C：服务端 ACTIVE 本地没有（首次升级 / 跨设备 / 私钥丢失）→ 强制 rotate
	console.log('E2EE: 检测到本地无 ACTIVE 密钥，执行 rotate')
	const result = await rotateAndPersist(userInfo.id)
	syncRevokedStatusFromServer(serverKeys)
	return result
}

/**
 * 全新用户或服务端无 ACTIVE 时的首次上传流程
 */
async function bootstrapFreshKey(userId) {
	const keyPair = generateKeyPair()
	const res = await uploadPublicKey(keyPair.publicKeyBase64)

	// 40902：服务端声称已有公钥但 diag 没返 ACTIVE（极罕见的竞态）→ 走 rotate
	if (res.code === 40902) {
		return await rotateAndPersist(userId, keyPair)
	}
	if (res.code !== 200 || !res.data) {
		throw { code: res.code || -1, message: res.msg || '公钥上传失败' }
	}

	const version = res.data.keyVersion
	savePrivateKeyForVersion(keyPair.privateKeyHex, keyPair.publicKeyHex, version, 'ACTIVE', userId)
	setActiveKeyVersion(version)
	privateKeyCache.set(version, keyPair.privateKeyHex)
	activeKeyVersion = version

	// 托管（非致命）
	try { await performKeyEscrow(keyPair.privateKeyHex, version) }
	catch (e) { console.warn('E2EE: 密钥托管失败（非致命）:', e) }

	return { keyVersion: version }
}

/**
 * rotate：生成新密钥对 + POST /keys/rotate；旧本地版本统一标 REVOKED
 */
async function rotateAndPersist(userId, existingKeyPair) {
	const keyPair = existingKeyPair || generateKeyPair()
	const rotateRes = await rotateKey(keyPair.publicKeyBase64)
	if (rotateRes.code !== 200 || !rotateRes.data) {
		throw { code: rotateRes.code || -1, message: rotateRes.msg || '密钥轮换失败' }
	}
	const version = rotateRes.data.keyVersion

	// 旧本地版本全部标记 REVOKED
	const locals = listLocalKeyVersions()
	for (const k of locals) {
		if (k.keyVersion !== version && k.status !== 'REVOKED') {
			setKeyStatus(k.keyVersion, 'REVOKED')
		}
	}

	savePrivateKeyForVersion(keyPair.privateKeyHex, keyPair.publicKeyHex, version, 'ACTIVE', userId)
	setActiveKeyVersion(version)
	privateKeyCache.clear()
	privateKeyCache.set(version, keyPair.privateKeyHex)
	activeKeyVersion = version

	try { await performKeyEscrow(keyPair.privateKeyHex, version) }
	catch (e) { console.warn('E2EE: 密钥托管失败（非致命）:', e) }

	return { keyVersion: version }
}

/**
 * 把服务端 diag 中的 REVOKED 状态同步到本地元信息
 */
function syncRevokedStatusFromServer(serverKeys) {
	const locals = listLocalKeyVersions()
	const localMap = {}
	locals.forEach(k => { localMap[k.keyVersion] = k.status })
	serverKeys.forEach(sk => {
		if (sk.status === 'REVOKED' && localMap[sk.keyVersion] === 'ACTIVE') {
			setKeyStatus(sk.keyVersion, 'REVOKED')
		}
	})
}

/**
 * 密钥托管（简化实现：用固定标识上传 base64 编码的私钥）
 */
async function performKeyEscrow(privateKeyHex, keyVersion) {
	const escrowData = {
		encryptedPrivateKey: forge.util.encode64(privateKeyHex),
		escrowPublicKeyId: 'hospital-escrow-key-001',
		keyVersion: keyVersion
	}
	await uploadKeyEscrow(escrowData)
}

export function getCurrentKeyVersion() {
	return activeKeyVersion || getActiveKeyVersion()
}

/**
 * 强制刷新某用户的对方公钥缓存（收到 40903 / decrypt 失败时）
 */
export async function refreshPeerKey(userType, userId, keyVersion) {
	const cacheKey = keyVersion ? `${userType}:${userId}:${keyVersion}` : `${userType}:${userId}`
	peerKeyCache.delete(cacheKey)
	return await fetchPeerPublicKey(userType, userId, keyVersion)
}

export default {
	generateKeyPair,
	deriveSessionKey,
	encryptMessage,
	decryptMessage,
	getOrDeriveSessionKey,
	sendingKeyContext,
	invalidateSessionKey,
	clearAllKeys,
	ensureE2EEReady,
	getCurrentKeyVersion,
	refreshPeerKey,
	KEY_UNAVAILABLE,
	PEER_KEY_UNAVAILABLE
}
