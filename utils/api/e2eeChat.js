/**
 * E2EE 加密聊天 API 模块
 * 封装所有 /api/app/chat/* 接口
 */

import { get, post, put } from './request.js'
import config from '../config.js'

const BASE = '/api/app/chat'

// ======================== 密钥管理 ========================

/**
 * 上传公钥
 * @param {string} publicKey - Base64 编码的 ECDH P-256 公钥 (SPKI 格式)
 */
export function uploadPublicKey(publicKey) {
	return post(`${BASE}/keys/upload`, { publicKey })
}

/**
 * 获取对方公钥
 * @param {string} userType - DOCTOR 或 PATIENT
 * @param {string} userId - 对方用户 ID
 * @param {number} [keyVersion] - v1.2+：指定版本号可查 REVOKED 历史版本，用于解密历史消息
 */
export function getPublicKey(userType, userId, keyVersion) {
	const query = keyVersion != null ? { keyVersion } : undefined
	return get(`${BASE}/keys/${userType}/${userId}`, query)
}

/**
 * 诊断当前用户的所有密钥版本（v1.2+）
 * 启动时调用，用于对账本地 keyVersion 计数器
 * @returns {Promise<{ data: { userType, userId, keys: Array<{keyVersion, status, createTime}> } }>}
 */
export function getKeyDiag() {
	return get(`${BASE}/keys/self/diag`)
}

/**
 * 上传密钥托管
 * @param {Object} data - { encryptedPrivateKey, escrowPublicKeyId, keyVersion }
 */
export function uploadKeyEscrow(data) {
	return post(`${BASE}/keys/escrow`, data)
}

/**
 * 密钥轮换
 * @param {string} publicKey - 新公钥 Base64
 */
export function rotateKey(publicKey) {
	return post(`${BASE}/keys/rotate`, { publicKey })
}

// ======================== 会话管理 ========================

/**
 * 创建会话
 * @param {string} targetUserId - 对方用户 ID
 * @param {string} targetUserType - DOCTOR 或 PATIENT
 */
export function createSession(targetUserId, targetUserType) {
	return post(`${BASE}/sessions`, { targetUserId, targetUserType })
}

/**
 * 获取会话列表
 */
export function getSessions() {
	return get(`${BASE}/sessions`)
}

/**
 * 获取会话详情
 * @param {string} sessionId
 */
export function getSessionDetail(sessionId) {
	return get(`${BASE}/sessions/${sessionId}`)
}

/**
 * 关闭会话
 * @param {string} sessionId
 */
export function closeSession(sessionId) {
	return put(`${BASE}/sessions/${sessionId}/close`)
}

// ======================== 消息 ========================

/**
 * 发送加密消息
 * @param {string} sessionId
 * @param {Object} data - { encryptedContent, iv, senderKeyVersion, receiverKeyVersion, messageType, fileUrl }
 *   v1.2+：receiverKeyVersion 为必填，对应 ECDH 加密时使用的对方公钥版本号
 */
export function sendEncryptedMessage(sessionId, data) {
	return post(`${BASE}/sessions/${sessionId}/messages`, data)
}

/**
 * 分页查询历史消息
 * @param {string} sessionId
 * @param {number} page - 页码（从 1 开始）
 * @param {number} size - 每页条数
 */
export function getMessages(sessionId, page = 1, size = 20) {
	return get(`${BASE}/sessions/${sessionId}/messages`, { page, size })
}

/**
 * 标记已读
 * @param {string} sessionId
 */
export function markRead(sessionId) {
	return post(`${BASE}/sessions/${sessionId}/messages/read`)
}

// ======================== 文件上传 ========================

/**
 * 上传聊天文件（图片/文档）
 * @param {string} filePath - 本地文件路径
 * @returns {Promise<string>} 文件的公开访问 URL
 */
export function uploadChatFile(filePath) {
	return new Promise((resolve, reject) => {
		const token = uni.getStorageSync(config.storageKeys.token)
		uni.uploadFile({
			url: config.baseUrl + `${BASE}/upload`,
			filePath,
			name: 'file',
			header: {
				'satoken': token
			},
			success: (res) => {
				try {
					const data = JSON.parse(res.data)
					if (data.code === 200) {
						resolve(data.data) // fileUrl 字符串
					} else {
						reject({ code: data.code, message: data.msg || '上传失败' })
					}
				} catch (e) {
					reject({ code: -1, message: '解析上传响应失败' })
				}
			},
			fail: (err) => {
				reject({ code: -1, message: '文件上传失败', error: err })
			}
		})
	})
}

// ======================== 医生列表 ========================

/**
 * 获取 E2EE 已启用医生列表
 */
export function getE2EEDoctors(page = 1, size = 10) {
	return get(`${BASE}/keys/e2ee-doctors`, { page, size })
}

// ======================== 辅助方法 ========================

/**
 * 创建或获取已有会话
 * 如果会话已存在（40901），获取会话列表中匹配的会话
 * @param {string} targetUserId
 * @param {string} targetUserType
 * @returns {Promise<Object>} 会话对象
 */
export async function createOrGetSession(targetUserId, targetUserType) {
	const res = await createSession(targetUserId, targetUserType)

	// HTTP 200 + 业务成功：新会话创建
	if (res.code === 200 && res.data) {
		return { ...res.data, _isNew: true }
	}

	// HTTP 200 + 40901：会话已存在，获取已有会话
	if (res.code === 40901) {
		const listRes = await getSessions()
		const sessions = listRes.data || []
		const existing = sessions.find(s =>
			targetUserType === 'DOCTOR' ? s.doctorId === targetUserId : s.patientId === targetUserId
		)
		if (existing) {
			return { ...existing, _isNew: false }
		}
	}

	// 其他业务错误
	throw { code: res.code, message: res.msg || '创建会话失败' }
}

export default {
	uploadPublicKey,
	getPublicKey,
	getKeyDiag,
	uploadKeyEscrow,
	rotateKey,
	createSession,
	getSessions,
	getSessionDetail,
	closeSession,
	sendEncryptedMessage,
	getMessages,
	markRead,
	uploadChatFile,
	getE2EEDoctors,
	createOrGetSession
}
