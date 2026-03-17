/**
 * E2EE 私钥安全存储模块
 * 使用 userId 派生的密钥对私钥进行 AES 加密后存入 localStorage
 */

import './cryptoPolyfill.js'
import forge from 'node-forge'
import config from '@/utils/config.js'

const STORAGE_KEY_PRIVATE = 'e2ee_private_key'
const STORAGE_KEY_PUBLIC = 'e2ee_public_key'
const STORAGE_KEY_VERSION = 'e2ee_key_version'
const ENCRYPTION_SALT = 'eye2-e2ee-key-storage-salt-v1'

/**
 * 从 userId 派生存储加密密钥（PBKDF2）
 * @param {string} userId
 * @returns {string} 32字节密钥（binary string）
 */
function deriveStorageKey(userId) {
	const salt = forge.util.encodeUtf8(ENCRYPTION_SALT)
	return forge.pkcs5.pbkdf2(userId, salt, 10000, 32, 'sha256')
}

/**
 * 加密并保存私钥
 * @param {string} privateKeyHex - 私钥 hex 字符串
 * @param {string} publicKeyHex - 公钥 hex 字符串
 * @param {string} userId - 用户ID（用于派生加密密钥）
 */
export function savePrivateKey(privateKeyHex, publicKeyHex, userId) {
	try {
		const storageKey = deriveStorageKey(userId)
		const iv = forge.random.getBytesSync(12)

		// AES-GCM 加密私钥
		const cipher = forge.cipher.createCipher('AES-GCM', storageKey)
		cipher.start({ iv, tagLength: 128 })
		cipher.update(forge.util.createBuffer(forge.util.encodeUtf8(privateKeyHex)))
		cipher.finish()

		const encrypted = cipher.output.getBytes()
		const tag = cipher.mode.tag.getBytes()

		// 存储格式: iv(12) + tag(16) + ciphertext (全部 base64)
		const combined = iv + tag + encrypted
		const encoded = forge.util.encode64(combined)

		uni.setStorageSync(STORAGE_KEY_PRIVATE, encoded)
		uni.setStorageSync(STORAGE_KEY_PUBLIC, publicKeyHex)

		console.log('E2EE: 私钥已安全存储')
	} catch (e) {
		console.error('E2EE: 保存私钥失败:', e)
		throw e
	}
}

/**
 * 加载并解密私钥
 * @param {string} userId - 用户ID
 * @returns {{ privateKeyHex: string, publicKeyHex: string } | null}
 */
export function loadPrivateKey(userId) {
	try {
		const encoded = uni.getStorageSync(STORAGE_KEY_PRIVATE)
		const publicKeyHex = uni.getStorageSync(STORAGE_KEY_PUBLIC)

		if (!encoded || !publicKeyHex) {
			return null
		}

		const combined = forge.util.decode64(encoded)
		const iv = combined.slice(0, 12)
		const tag = combined.slice(12, 28)
		const encrypted = combined.slice(28)

		const storageKey = deriveStorageKey(userId)

		// AES-GCM 解密
		const decipher = forge.cipher.createDecipher('AES-GCM', storageKey)
		decipher.start({
			iv,
			tagLength: 128,
			tag: forge.util.createBuffer(tag)
		})
		decipher.update(forge.util.createBuffer(encrypted))
		const pass = decipher.finish()

		if (!pass) {
			console.error('E2EE: 私钥解密失败（认证标签不匹配）')
			return null
		}

		const privateKeyHex = forge.util.decodeUtf8(decipher.output.getBytes())
		console.log('E2EE: 私钥加载成功')

		return { privateKeyHex, publicKeyHex }
	} catch (e) {
		console.error('E2EE: 加载私钥失败:', e)
		return null
	}
}

/**
 * 清除存储的私钥
 */
export function clearPrivateKey() {
	try {
		uni.removeStorageSync(STORAGE_KEY_PRIVATE)
		uni.removeStorageSync(STORAGE_KEY_PUBLIC)
		uni.removeStorageSync(STORAGE_KEY_VERSION)
		console.log('E2EE: 私钥已清除')
	} catch (e) {
		console.error('E2EE: 清除私钥失败:', e)
	}
}

/**
 * 获取当前公钥版本号
 * @returns {number}
 */
export function getKeyVersion() {
	return uni.getStorageSync(STORAGE_KEY_VERSION) || 0
}

/**
 * 设置公钥版本号
 * @param {number} version
 */
export function setKeyVersion(version) {
	uni.setStorageSync(STORAGE_KEY_VERSION, version)
}

/**
 * 检查是否有本地存储的私钥
 * @returns {boolean}
 */
export function hasStoredKey() {
	return !!uni.getStorageSync(STORAGE_KEY_PRIVATE)
}

export default {
	savePrivateKey,
	loadPrivateKey,
	clearPrivateKey,
	getKeyVersion,
	setKeyVersion,
	hasStoredKey
}
