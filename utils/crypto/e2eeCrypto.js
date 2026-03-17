/**
 * E2EE 加密模块
 * 基于 elliptic (ECDH P-256) + node-forge (AES-GCM / HKDF)
 * 实现端到端加密的密钥生成、协商、消息加解密
 */

import './cryptoPolyfill.js'
import EC from 'elliptic/lib/elliptic/ec'
import forge from 'node-forge'
import { savePrivateKey, loadPrivateKey, getKeyVersion, setKeyVersion, clearPrivateKey } from './keyStorage.js'
import { uploadPublicKey, getPublicKey, rotateKey, uploadKeyEscrow } from '@/utils/api/e2eeChat.js'
import { getUserInfo } from '@/store/user.js'

// P-256 曲线实例
const ec = new EC('p256')

// Session key 内存缓存: Map<sessionId, Uint8Array(32)>
const sessionKeyCache = new Map()

// 当前用户的私钥（内存中，Uint8Array）
let currentPrivateKey = null
// 当前用户的公钥 hex（内存中）
let currentPublicKeyHex = null

// 对方公钥缓存: Map<`${userType}:${userId}`, { publicKey, keyVersion }>
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

/**
 * 获取或派生会话密钥（带缓存）
 * @param {string} sessionId - 会话ID
 * @param {string} peerUserType - 对方用户类型 DOCTOR/PATIENT
 * @param {string} peerUserId - 对方用户ID
 * @returns {Promise<Uint8Array>} 会话密钥
 */
export async function getOrDeriveSessionKey(sessionId, peerUserType, peerUserId) {
	// 检查缓存
	if (sessionKeyCache.has(sessionId)) {
		return sessionKeyCache.get(sessionId)
	}

	// 确保本地私钥已加载
	if (!currentPrivateKey) {
		throw new Error('私钥未加载，请先调用 ensureE2EEReady()')
	}

	// 获取对方公钥
	const peerKeyData = await fetchPeerPublicKey(peerUserType, peerUserId)

	// ECDH + HKDF 派生
	const sessionKey = deriveSessionKey(currentPrivateKey, peerKeyData.publicKey, sessionId)

	// 缓存
	sessionKeyCache.set(sessionId, sessionKey)
	return sessionKey
}

/**
 * 获取对方公钥（带缓存）
 */
async function fetchPeerPublicKey(userType, userId) {
	const cacheKey = `${userType}:${userId}`
	if (peerKeyCache.has(cacheKey)) {
		return peerKeyCache.get(cacheKey)
	}

	const res = await getPublicKey(userType, userId)
	const keyData = {
		publicKey: res.data.publicKey,
		keyVersion: res.data.keyVersion
	}
	peerKeyCache.set(cacheKey, keyData)
	return keyData
}

/**
 * 使指定用户的 session key 缓存失效（密钥轮换时使用）
 */
export function invalidateSessionKey(userId) {
	// 清除所有涉及该用户的 session key
	for (const [sessionId] of sessionKeyCache) {
		sessionKeyCache.delete(sessionId)
	}
	// 清除该用户的公钥缓存
	for (const [key] of peerKeyCache) {
		if (key.includes(userId)) {
			peerKeyCache.delete(key)
		}
	}
}

/**
 * 清除所有缓存（登出时调用）
 */
export function clearAllKeys() {
	sessionKeyCache.clear()
	peerKeyCache.clear()
	currentPrivateKey = null
	currentPublicKeyHex = null
}

// ======================== E2EE 初始化 ========================

/**
 * 确保 E2EE 就绪（密钥对已生成并上传）
 * @returns {Promise<{ keyVersion: number }>}
 */
export async function ensureE2EEReady() {
	const userInfo = getUserInfo()
	if (!userInfo || !userInfo.id) {
		throw new Error('用户未登录')
	}

	// 尝试从本地加载私钥
	if (!currentPrivateKey) {
		const stored = loadPrivateKey(userInfo.id)
		if (stored) {
			currentPrivateKey = stored.privateKeyHex
			currentPublicKeyHex = stored.publicKeyHex
			const version = getKeyVersion()
			return { keyVersion: version }
		}
	} else {
		return { keyVersion: getKeyVersion() }
	}

	// 本地无私钥，需要生成新密钥对
	console.log('E2EE: 生成新密钥对...')
	const keyPair = generateKeyPair()

	// 尝试上传公钥
	const res = await uploadPublicKey(keyPair.publicKeyBase64)

	// 后端以 HTTP 200 返回业务错误码（如 40902 已有公钥），request.js 不会 reject
	if (res.code === 40902) {
		console.log('E2EE: 服务端已有公钥，执行密钥轮换...')
		const rotateRes = await rotateKey(keyPair.publicKeyBase64)
		const version = (rotateRes.data && rotateRes.data.keyVersion) || 1

		savePrivateKey(keyPair.privateKeyHex, keyPair.publicKeyHex, userInfo.id)
		setKeyVersion(version)

		currentPrivateKey = keyPair.privateKeyHex
		currentPublicKeyHex = keyPair.publicKeyHex

		return { keyVersion: version }
	}

	if (res.code !== 200 || !res.data) {
		throw { code: res.code || -1, message: res.msg || '公钥上传失败' }
	}

	const version = res.data.keyVersion

	// 保存私钥到本地
	savePrivateKey(keyPair.privateKeyHex, keyPair.publicKeyHex, userInfo.id)
	setKeyVersion(version)

	currentPrivateKey = keyPair.privateKeyHex
	currentPublicKeyHex = keyPair.publicKeyHex

	// 密钥托管（可选，静默失败）
	try {
		await performKeyEscrow(keyPair.privateKeyHex, version)
	} catch (e) {
		console.warn('E2EE: 密钥托管失败（非致命）:', e)
	}

	return { keyVersion: version }
}

/**
 * 密钥托管
 */
async function performKeyEscrow(privateKeyHex, keyVersion) {
	// 简化实现：用固定托管方标识上传加密私钥
	// 实际应用中应用托管方 RSA 公钥加密
	const escrowData = {
		encryptedPrivateKey: forge.util.encode64(privateKeyHex),
		escrowPublicKeyId: 'hospital-escrow-key-001',
		keyVersion: keyVersion
	}
	await uploadKeyEscrow(escrowData)
}

/**
 * 获取当前公钥版本号
 */
export function getCurrentKeyVersion() {
	return getKeyVersion()
}

/**
 * 检查是否需要重新协商密钥（senderKeyVersion 不匹配时）
 */
export async function refreshPeerKey(userType, userId) {
	const cacheKey = `${userType}:${userId}`
	peerKeyCache.delete(cacheKey)
	return await fetchPeerPublicKey(userType, userId)
}

export default {
	generateKeyPair,
	deriveSessionKey,
	encryptMessage,
	decryptMessage,
	getOrDeriveSessionKey,
	invalidateSessionKey,
	clearAllKeys,
	ensureE2EEReady,
	getCurrentKeyVersion,
	refreshPeerKey
}
