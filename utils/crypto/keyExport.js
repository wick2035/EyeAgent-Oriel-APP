/**
 * E2EE 密钥导出/导入模块
 * 用于聊天数据迁移：将私钥加密导出为备份文件，或从备份文件恢复私钥
 */

import './cryptoPolyfill.js'
import forge from 'node-forge'
import { loadPrivateKey, savePrivateKey, getKeyVersion, setKeyVersion, hasStoredKey } from './keyStorage.js'

const EXPORT_FORMAT = 'eye2-e2ee-backup-v1'
const EXPORT_KDF_ITERATIONS = 100000

/**
 * 导出密钥包
 * 读取本地私钥，用用户密码加密后返回 JSON 对象
 * @param {string} userId - 当前用户ID
 * @param {string} userPassword - 用户设置的导出密码
 * @returns {object} 加密的备份 JSON 对象
 */
export function exportKeyBundle(userId, userPassword) {
	const stored = loadPrivateKey(userId)
	if (!stored) {
		throw new Error('NO_KEY')
	}

	// 生成随机 salt(32字节) 和 IV(12字节)
	const salt = forge.random.getBytesSync(32)
	const iv = forge.random.getBytesSync(12)

	// PBKDF2 派生加密密钥
	const key = forge.pkcs5.pbkdf2(userPassword, salt, EXPORT_KDF_ITERATIONS, 32, 'sha256')

	// AES-256-GCM 加密私钥
	const cipher = forge.cipher.createCipher('AES-GCM', key)
	cipher.start({ iv, tagLength: 128 })
	cipher.update(forge.util.createBuffer(forge.util.encodeUtf8(stored.privateKeyHex)))
	cipher.finish()

	const ciphertext = cipher.output.getBytes()
	const tag = cipher.mode.tag.getBytes()

	// 对 userId 取哈希，用于导入时校验身份
	const md = forge.md.sha256.create()
	md.update(userId)
	const userIdHash = md.digest().toHex()

	return {
		format: EXPORT_FORMAT,
		version: 1,
		createdAt: new Date().toISOString(),
		userId: userIdHash,
		keyVersion: getKeyVersion(),
		encryption: {
			algorithm: 'AES-256-GCM',
			kdf: 'PBKDF2-SHA256',
			iterations: EXPORT_KDF_ITERATIONS,
			salt: forge.util.encode64(salt),
			iv: forge.util.encode64(iv),
			tag: forge.util.encode64(tag),
			ciphertext: forge.util.encode64(ciphertext)
		},
		publicKeyHex: stored.publicKeyHex
	}
}

/**
 * 导入密钥包
 * 用密码解密备份文件，验证后存入本地存储
 * @param {object} bundle - 备份 JSON 对象
 * @param {string} userPassword - 导出时设置的密码
 * @param {string} userId - 当前用户ID
 * @returns {{ success: boolean, keyVersion: number }}
 */
export function importKeyBundle(bundle, userPassword, userId) {
	// 校验格式
	if (!bundle || bundle.format !== EXPORT_FORMAT) {
		throw new Error('INVALID_FORMAT')
	}

	// 校验用户身份
	const md = forge.md.sha256.create()
	md.update(userId)
	const userIdHash = md.digest().toHex()
	if (bundle.userId !== userIdHash) {
		throw new Error('USER_MISMATCH')
	}

	// 解密
	const enc = bundle.encryption
	if (!enc || !enc.salt || !enc.iv || !enc.tag || !enc.ciphertext) {
		throw new Error('INVALID_FORMAT')
	}

	const salt = forge.util.decode64(enc.salt)
	const iv = forge.util.decode64(enc.iv)
	const tag = forge.util.decode64(enc.tag)
	const ciphertext = forge.util.decode64(enc.ciphertext)
	const iterations = enc.iterations || EXPORT_KDF_ITERATIONS

	const key = forge.pkcs5.pbkdf2(userPassword, salt, iterations, 32, 'sha256')

	const decipher = forge.cipher.createDecipher('AES-GCM', key)
	decipher.start({
		iv,
		tagLength: 128,
		tag: forge.util.createBuffer(tag)
	})
	decipher.update(forge.util.createBuffer(ciphertext))
	const pass = decipher.finish()

	if (!pass) {
		throw new Error('WRONG_PASSWORD')
	}

	const privateKeyHex = forge.util.decodeUtf8(decipher.output.getBytes())

	// 基本校验私钥格式（P-256 私钥为 48~66 位 hex）
	if (!/^[0-9a-f]{48,66}$/i.test(privateKeyHex)) {
		throw new Error('INVALID_KEY_DATA')
	}

	// 校验公钥存在
	if (!bundle.publicKeyHex || !/^[0-9a-f]+$/i.test(bundle.publicKeyHex)) {
		throw new Error('INVALID_KEY_DATA')
	}

	// 写入本地存储
	savePrivateKey(privateKeyHex, bundle.publicKeyHex, userId)
	setKeyVersion(bundle.keyVersion || 0)

	return { success: true, keyVersion: bundle.keyVersion }
}

/**
 * 验证备份文件格式（不解密）
 * @param {object} bundle - 待验证的 JSON 对象
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateBundle(bundle) {
	if (!bundle || typeof bundle !== 'object') {
		return { valid: false, error: '不是有效的 JSON 对象' }
	}
	if (bundle.format !== EXPORT_FORMAT) {
		return { valid: false, error: '文件格式不匹配' }
	}
	if (!bundle.encryption || !bundle.encryption.ciphertext) {
		return { valid: false, error: '缺少加密数据' }
	}
	if (!bundle.publicKeyHex) {
		return { valid: false, error: '缺少公钥数据' }
	}
	return { valid: true }
}

/**
 * 检查是否有可导出的密钥
 * @returns {boolean}
 */
export function hasExportableKey() {
	return hasStoredKey()
}

export default {
	exportKeyBundle,
	importKeyBundle,
	validateBundle,
	hasExportableKey
}
