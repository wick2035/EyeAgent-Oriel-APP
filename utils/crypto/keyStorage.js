/**
 * E2EE 私钥安全存储模块（v2 多版本结构）
 *
 * 存储布局：
 *   e2ee_keys_v2            → { [keyVersion]: { privateKeyCipher, publicKeyHex, status, createdAt } }
 *   e2ee_keys_active_version→ 当前 ACTIVE 版本号
 *   e2ee_keys_migrated      → 1 表示已从旧单键结构迁移完成
 *
 * 旧键（迁移完成后删除）：e2ee_private_key / e2ee_public_key / e2ee_key_version
 */

import './cryptoPolyfill.js'
import forge from 'node-forge'

const STORAGE_KEY_MAP = 'e2ee_keys_v2'
const STORAGE_KEY_ACTIVE = 'e2ee_keys_active_version'
const STORAGE_KEY_MIGRATED = 'e2ee_keys_migrated'

// 旧存储键（仅用于迁移读取）
const LEGACY_KEY_PRIVATE = 'e2ee_private_key'
const LEGACY_KEY_PUBLIC = 'e2ee_public_key'
const LEGACY_KEY_VERSION = 'e2ee_key_version'

const ENCRYPTION_SALT = 'eye2-e2ee-key-storage-salt-v1'

function deriveStorageKey(userId) {
	const salt = forge.util.encodeUtf8(ENCRYPTION_SALT)
	return forge.pkcs5.pbkdf2(userId, salt, 10000, 32, 'sha256')
}

function encryptPrivateKey(privateKeyHex, userId) {
	const storageKey = deriveStorageKey(userId)
	const iv = forge.random.getBytesSync(12)
	const cipher = forge.cipher.createCipher('AES-GCM', storageKey)
	cipher.start({ iv, tagLength: 128 })
	cipher.update(forge.util.createBuffer(forge.util.encodeUtf8(privateKeyHex)))
	cipher.finish()
	const encrypted = cipher.output.getBytes()
	const tag = cipher.mode.tag.getBytes()
	return forge.util.encode64(iv + tag + encrypted)
}

function decryptPrivateKey(cipherBase64, userId) {
	const combined = forge.util.decode64(cipherBase64)
	const iv = combined.slice(0, 12)
	const tag = combined.slice(12, 28)
	const encrypted = combined.slice(28)
	const storageKey = deriveStorageKey(userId)
	const decipher = forge.cipher.createDecipher('AES-GCM', storageKey)
	decipher.start({ iv, tagLength: 128, tag: forge.util.createBuffer(tag) })
	decipher.update(forge.util.createBuffer(encrypted))
	if (!decipher.finish()) return null
	return forge.util.decodeUtf8(decipher.output.getBytes())
}

function readMap() {
	const raw = uni.getStorageSync(STORAGE_KEY_MAP)
	if (!raw) return {}
	if (typeof raw === 'object') return raw
	try { return JSON.parse(raw) } catch (e) { return {} }
}

function writeMap(map) {
	uni.setStorageSync(STORAGE_KEY_MAP, map)
}

/**
 * 写入/更新指定版本的私钥
 */
export function savePrivateKeyForVersion(privateKeyHex, publicKeyHex, keyVersion, status, userId) {
	const map = readMap()
	const existing = map[keyVersion] || {}
	map[keyVersion] = {
		privateKeyCipher: encryptPrivateKey(privateKeyHex, userId),
		publicKeyHex,
		status: status || 'ACTIVE',
		createdAt: existing.createdAt || new Date().toISOString()
	}
	writeMap(map)
	if (status === 'ACTIVE') {
		uni.setStorageSync(STORAGE_KEY_ACTIVE, keyVersion)
	}
}

/**
 * 加载指定版本的私钥
 * @returns {{ privateKeyHex, publicKeyHex, status, createdAt } | null}
 */
export function loadPrivateKeyForVersion(keyVersion, userId) {
	const map = readMap()
	const entry = map[keyVersion]
	if (!entry) return null
	const privateKeyHex = decryptPrivateKey(entry.privateKeyCipher, userId)
	if (!privateKeyHex) {
		console.error('E2EE: 私钥解密失败，版本:', keyVersion)
		return null
	}
	return {
		privateKeyHex,
		publicKeyHex: entry.publicKeyHex,
		status: entry.status,
		createdAt: entry.createdAt
	}
}

/**
 * 加载当前 ACTIVE 版本的私钥
 */
export function loadActivePrivateKey(userId) {
	const active = getActiveKeyVersion()
	if (!active) return null
	return loadPrivateKeyForVersion(active, userId)
}

/**
 * 列出本地所有存储的密钥版本元信息（不解密）
 */
export function listLocalKeyVersions() {
	const map = readMap()
	return Object.keys(map).map(v => ({
		keyVersion: Number(v),
		status: map[v].status,
		createdAt: map[v].createdAt,
		publicKeyHex: map[v].publicKeyHex
	})).sort((a, b) => a.keyVersion - b.keyVersion)
}

/**
 * 修改指定版本的状态（如 rotate 后把旧版本标 REVOKED）
 */
export function setKeyStatus(keyVersion, status) {
	const map = readMap()
	if (map[keyVersion]) {
		map[keyVersion].status = status
		writeMap(map)
	}
}

export function setActiveKeyVersion(keyVersion) {
	uni.setStorageSync(STORAGE_KEY_ACTIVE, keyVersion)
}

export function getActiveKeyVersion() {
	return uni.getStorageSync(STORAGE_KEY_ACTIVE) || 0
}

/**
 * 是否有可用的 ACTIVE 私钥
 */
export function hasStoredKey() {
	const active = getActiveKeyVersion()
	if (!active) return false
	const map = readMap()
	return !!(map[active] && map[active].privateKeyCipher)
}

/**
 * 清除所有本地密钥（登出使用）
 */
export function clearAllLocalKeys() {
	try {
		uni.removeStorageSync(STORAGE_KEY_MAP)
		uni.removeStorageSync(STORAGE_KEY_ACTIVE)
		uni.removeStorageSync(STORAGE_KEY_MIGRATED)
		uni.removeStorageSync(LEGACY_KEY_PRIVATE)
		uni.removeStorageSync(LEGACY_KEY_PUBLIC)
		uni.removeStorageSync(LEGACY_KEY_VERSION)
	} catch (e) {
		console.error('E2EE: 清除本地密钥失败:', e)
	}
}

/**
 * 旧单键结构 → 新 map 结构一次性迁移。
 * 旧私钥迁移后标记为 REVOKED（随后 ensureE2EEReady 会强制 rotate 生成新 ACTIVE）。
 */
export function migrateLegacyStorage(userId) {
	if (uni.getStorageSync(STORAGE_KEY_MIGRATED)) return false
	try {
		const encoded = uni.getStorageSync(LEGACY_KEY_PRIVATE)
		const publicKeyHex = uni.getStorageSync(LEGACY_KEY_PUBLIC)
		const legacyVersion = uni.getStorageSync(LEGACY_KEY_VERSION)

		if (encoded && publicKeyHex && legacyVersion) {
			const combined = forge.util.decode64(encoded)
			const iv = combined.slice(0, 12)
			const tag = combined.slice(12, 28)
			const encrypted = combined.slice(28)
			const storageKey = deriveStorageKey(userId)
			const decipher = forge.cipher.createDecipher('AES-GCM', storageKey)
			decipher.start({ iv, tagLength: 128, tag: forge.util.createBuffer(tag) })
			decipher.update(forge.util.createBuffer(encrypted))
			if (decipher.finish()) {
				const privateKeyHex = forge.util.decodeUtf8(decipher.output.getBytes())
				const map = readMap()
				if (!map[legacyVersion]) {
					map[legacyVersion] = {
						privateKeyCipher: encryptPrivateKey(privateKeyHex, userId),
						publicKeyHex,
						status: 'REVOKED',
						createdAt: new Date().toISOString()
					}
					writeMap(map)
				}
				console.log('E2EE: 迁移旧私钥成功，版本:', legacyVersion)
			} else {
				console.warn('E2EE: 旧私钥解密失败，放弃迁移')
			}
		}

		uni.removeStorageSync(LEGACY_KEY_PRIVATE)
		uni.removeStorageSync(LEGACY_KEY_PUBLIC)
		uni.removeStorageSync(LEGACY_KEY_VERSION)
		uni.setStorageSync(STORAGE_KEY_MIGRATED, 1)
		return true
	} catch (e) {
		console.error('E2EE: 迁移旧存储失败:', e)
		uni.setStorageSync(STORAGE_KEY_MIGRATED, 1)
		return false
	}
}

// ======================== 向后兼容别名 ========================
export const clearPrivateKey = clearAllLocalKeys
export const getKeyVersion = getActiveKeyVersion
export const setKeyVersion = setActiveKeyVersion
export function loadPrivateKey(userId) { return loadActivePrivateKey(userId) }
export function savePrivateKey(privateKeyHex, publicKeyHex, userId) {
	const version = getActiveKeyVersion() || 1
	savePrivateKeyForVersion(privateKeyHex, publicKeyHex, version, 'ACTIVE', userId)
}

export default {
	savePrivateKeyForVersion,
	loadPrivateKeyForVersion,
	loadActivePrivateKey,
	listLocalKeyVersions,
	setKeyStatus,
	setActiveKeyVersion,
	getActiveKeyVersion,
	hasStoredKey,
	clearAllLocalKeys,
	migrateLegacyStorage,
	// aliases
	clearPrivateKey,
	getKeyVersion,
	setKeyVersion,
	loadPrivateKey,
	savePrivateKey
}
