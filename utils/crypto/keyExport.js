/**
 * E2EE 密钥导出/导入模块（v2 多版本）
 * 用于聊天数据迁移：将所有历史版本私钥加密导出为备份文件，或从备份文件批量恢复
 *
 * 向后兼容：可识别并导入 v1 格式（作为单个 REVOKED 版本导入）
 */

import './cryptoPolyfill.js'
import forge from 'node-forge'
import {
	loadPrivateKeyForVersion,
	savePrivateKeyForVersion,
	listLocalKeyVersions,
	getActiveKeyVersion,
	setActiveKeyVersion,
	hasStoredKey
} from './keyStorage.js'

const EXPORT_FORMAT_V2 = 'eye2-e2ee-backup-v2'
const EXPORT_FORMAT_V1 = 'eye2-e2ee-backup-v1'
const EXPORT_KDF_ITERATIONS = 100000

function encryptWithPassword(plaintextHex, userPassword) {
	const salt = forge.random.getBytesSync(32)
	const iv = forge.random.getBytesSync(12)
	const key = forge.pkcs5.pbkdf2(userPassword, salt, EXPORT_KDF_ITERATIONS, 32, 'sha256')
	const cipher = forge.cipher.createCipher('AES-GCM', key)
	cipher.start({ iv, tagLength: 128 })
	cipher.update(forge.util.createBuffer(forge.util.encodeUtf8(plaintextHex)))
	cipher.finish()
	return {
		algorithm: 'AES-256-GCM',
		kdf: 'PBKDF2-SHA256',
		iterations: EXPORT_KDF_ITERATIONS,
		salt: forge.util.encode64(salt),
		iv: forge.util.encode64(iv),
		tag: forge.util.encode64(cipher.mode.tag.getBytes()),
		ciphertext: forge.util.encode64(cipher.output.getBytes())
	}
}

function decryptWithPassword(enc, userPassword) {
	const salt = forge.util.decode64(enc.salt)
	const iv = forge.util.decode64(enc.iv)
	const tag = forge.util.decode64(enc.tag)
	const ciphertext = forge.util.decode64(enc.ciphertext)
	const iterations = enc.iterations || EXPORT_KDF_ITERATIONS
	const key = forge.pkcs5.pbkdf2(userPassword, salt, iterations, 32, 'sha256')
	const decipher = forge.cipher.createDecipher('AES-GCM', key)
	decipher.start({ iv, tagLength: 128, tag: forge.util.createBuffer(tag) })
	decipher.update(forge.util.createBuffer(ciphertext))
	if (!decipher.finish()) return null
	return forge.util.decodeUtf8(decipher.output.getBytes())
}

function hashUserId(userId) {
	const md = forge.md.sha256.create()
	md.update(userId)
	return md.digest().toHex()
}

/**
 * 导出密钥包（包含所有本地保存的版本）
 * @param {string} userId
 * @param {string} userPassword
 * @returns {object} v2 备份 JSON
 */
export function exportKeyBundle(userId, userPassword) {
	const versions = listLocalKeyVersions()
	if (!versions.length) throw new Error('NO_KEY')

	const keys = versions.map(v => {
		const entry = loadPrivateKeyForVersion(v.keyVersion, userId)
		if (!entry) return null
		return {
			keyVersion: v.keyVersion,
			status: v.status,
			createdAt: v.createdAt,
			publicKeyHex: entry.publicKeyHex,
			encryption: encryptWithPassword(entry.privateKeyHex, userPassword)
		}
	}).filter(Boolean)

	if (!keys.length) throw new Error('NO_KEY')

	return {
		format: EXPORT_FORMAT_V2,
		version: 2,
		createdAt: new Date().toISOString(),
		userId: hashUserId(userId),
		activeKeyVersion: getActiveKeyVersion(),
		keys
	}
}

/**
 * 导入密钥包（支持 v2；v1 作为单个 REVOKED 版本兼容导入）
 * @param {object} bundle
 * @param {string} userPassword
 * @param {string} userId
 * @returns {{ success: boolean, imported: number, activeKeyVersion: number }}
 */
export function importKeyBundle(bundle, userPassword, userId) {
	if (!bundle || !bundle.format) throw new Error('INVALID_FORMAT')

	if (bundle.format === EXPORT_FORMAT_V2) {
		return importV2(bundle, userPassword, userId)
	}
	if (bundle.format === EXPORT_FORMAT_V1) {
		return importV1(bundle, userPassword, userId)
	}
	throw new Error('INVALID_FORMAT')
}

function importV2(bundle, userPassword, userId) {
	if (bundle.userId !== hashUserId(userId)) throw new Error('USER_MISMATCH')
	if (!Array.isArray(bundle.keys) || !bundle.keys.length) throw new Error('INVALID_FORMAT')

	let imported = 0
	for (const k of bundle.keys) {
		if (!k.encryption || !k.publicKeyHex || !k.keyVersion) continue
		const privateKeyHex = decryptWithPassword(k.encryption, userPassword)
		if (privateKeyHex === null) throw new Error('WRONG_PASSWORD')
		if (!/^[0-9a-f]{48,66}$/i.test(privateKeyHex)) throw new Error('INVALID_KEY_DATA')
		if (!/^[0-9a-f]+$/i.test(k.publicKeyHex)) throw new Error('INVALID_KEY_DATA')

		savePrivateKeyForVersion(privateKeyHex, k.publicKeyHex, k.keyVersion, k.status || 'REVOKED', userId)
		imported++
	}

	const activeKeyVersion = bundle.activeKeyVersion || 0
	if (activeKeyVersion) setActiveKeyVersion(activeKeyVersion)

	return { success: true, imported, activeKeyVersion }
}

function importV1(bundle, userPassword, userId) {
	if (bundle.userId !== hashUserId(userId)) throw new Error('USER_MISMATCH')
	const enc = bundle.encryption
	if (!enc || !enc.salt || !enc.iv || !enc.tag || !enc.ciphertext) throw new Error('INVALID_FORMAT')

	const privateKeyHex = decryptWithPassword(enc, userPassword)
	if (privateKeyHex === null) throw new Error('WRONG_PASSWORD')
	if (!/^[0-9a-f]{48,66}$/i.test(privateKeyHex)) throw new Error('INVALID_KEY_DATA')
	if (!bundle.publicKeyHex || !/^[0-9a-f]+$/i.test(bundle.publicKeyHex)) throw new Error('INVALID_KEY_DATA')

	// v1 备份不知道该版本在服务端是否 ACTIVE — 保守按 REVOKED 导入
	const keyVersion = bundle.keyVersion || 1
	savePrivateKeyForVersion(privateKeyHex, bundle.publicKeyHex, keyVersion, 'REVOKED', userId)

	return { success: true, imported: 1, activeKeyVersion: 0 }
}

/**
 * 验证备份文件格式（不解密）
 */
export function validateBundle(bundle) {
	if (!bundle || typeof bundle !== 'object') {
		return { valid: false, error: '不是有效的 JSON 对象' }
	}
	if (bundle.format === EXPORT_FORMAT_V2) {
		if (!Array.isArray(bundle.keys) || !bundle.keys.length) {
			return { valid: false, error: '备份不包含任何密钥' }
		}
		return { valid: true, format: 'v2' }
	}
	if (bundle.format === EXPORT_FORMAT_V1) {
		if (!bundle.encryption || !bundle.encryption.ciphertext) {
			return { valid: false, error: '缺少加密数据' }
		}
		if (!bundle.publicKeyHex) {
			return { valid: false, error: '缺少公钥数据' }
		}
		return { valid: true, format: 'v1' }
	}
	return { valid: false, error: '文件格式不匹配' }
}

export function hasExportableKey() {
	return hasStoredKey() || listLocalKeyVersions().length > 0
}

export default {
	exportKeyBundle,
	importKeyBundle,
	validateBundle,
	hasExportableKey
}
