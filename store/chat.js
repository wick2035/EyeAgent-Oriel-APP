/**
 * 聊天状态管理
 * E2EE 加密医患聊天 - 会话、消息、输入状态、未读数
 */

import { reactive } from 'vue'
import {
	getSessions,
	sendEncryptedMessage,
	getMessages,
	markRead,
	uploadChatFile
} from '@/utils/api/e2eeChat.js'
import {
	encryptMessage,
	decryptMessage,
	getOrDeriveSessionKey,
	sendingKeyContext,
	getCurrentKeyVersion,
	ensureE2EEReady,
	clearAllKeys,
	invalidateSessionKey,
	refreshPeerKey,
	KEY_UNAVAILABLE,
	PEER_KEY_UNAVAILABLE
} from '@/utils/crypto/e2eeCrypto.js'
import { clearAllLocalKeys } from '@/utils/crypto/keyStorage.js'
import { getUserInfo } from '@/store/user.js'

// ======================== 响应式状态 ========================

const chatState = reactive({
	// 会话列表
	sessions: {},        // { [sessionId]: sessionObject }
	sessionOrder: [],    // sessionId[] 按 lastMessageAt 降序

	// 消息列表
	messages: {},        // { [sessionId]: messageArray }

	// 分页状态
	pagination: {},      // { [sessionId]: { page, totalPages, hasMore, loading } }

	// 输入状态
	typing: {},          // { [sessionId]: { isTyping, userId, timeoutId } }

	// 加载状态
	sessionsLoading: false,

	// E2EE 状态
	e2eeReady: false,
	keyVersion: 0,

	// 当前打开的聊天会话ID（用于判断是否需要自动标记已读）
	activeSessionId: null
})

// ======================== 会话管理 ========================

/**
 * 获取会话列表
 */
export async function fetchSessions() {
	chatState.sessionsLoading = true
	try {
		const res = await getSessions()
		const sessions = res.data || []

		chatState.sessions = {}
		chatState.sessionOrder = []

		sessions.forEach(session => {
			chatState.sessions[session.id] = {
				...session,
				lastDecryptedPreview: null
			}
			chatState.sessionOrder.push(session.id)
		})

		// 按 lastMessageAt 降序排列
		chatState.sessionOrder.sort((a, b) => {
			const timeA = chatState.sessions[a].lastMessageAt || ''
			const timeB = chatState.sessions[b].lastMessageAt || ''
			return timeB.localeCompare(timeA)
		})

		// 后台解密每个会话的最新消息作为预览（不阻塞）
		refreshSessionPreviews()

		return sessions
	} catch (err) {
		console.error('获取会话列表失败:', err)
		throw err
	} finally {
		chatState.sessionsLoading = false
	}
}

/**
 * 后台刷新所有会话的消息预览（解密最新一条）
 */
async function refreshSessionPreviews() {
	for (const sessionId of chatState.sessionOrder) {
		try {
			const session = chatState.sessions[sessionId]
			if (!session || !session.lastMessageAt) continue

			const userInfo = getUserInfo()
			let peerUserType, peerUserId
			if (session.doctorId && session.doctorId !== userInfo.id) {
				peerUserType = 'DOCTOR'
				peerUserId = session.doctorId
			} else {
				peerUserType = 'PATIENT'
				peerUserId = session.patientId
			}

			const res = await getMessages(sessionId, 1, 1)
			const records = (res.data && res.data.records) || []
			if (records.length === 0) continue

			const msg = records[0]
			let preview = '[加密消息]'
			if (msg.encryptedContent && msg.iv) {
				try {
					const opts = (msg.senderKeyVersion && msg.receiverKeyVersion)
						? { senderKeyVersion: msg.senderKeyVersion, receiverKeyVersion: msg.receiverKeyVersion }
						: undefined
					const { sessionKey } = await getOrDeriveSessionKey(sessionId, peerUserType, peerUserId, opts)
					const text = decryptMessage(sessionKey, msg.encryptedContent, msg.iv)
					if (msg.messageType === 'IMAGE') {
						preview = '[图片]'
					} else {
						preview = text || '[加密消息]'
					}
				} catch (e) {
					// 解密失败，保持默认
				}
			}

			updateSession(sessionId, { lastDecryptedPreview: preview })
		} catch (e) {
			// 单个会话失败不影响其他
		}
	}
	// 通知 UI 更新
	uni.$emit('chat-sessions-updated')
}

/**
 * 获取排序后的会话列表（供 UI 渲染）
 */
export function getSessionList() {
	return chatState.sessionOrder.map(id => chatState.sessions[id]).filter(Boolean)
}

/**
 * 获取所有会话未读数总和
 */
export function getTotalUnreadCount() {
	let total = 0
	for (const id of chatState.sessionOrder) {
		const session = chatState.sessions[id]
		if (session) {
			total += session.unreadCount || 0
		}
	}
	return total
}

/**
 * 更新会话信息（局部更新）
 */
function updateSession(sessionId, updates) {
	if (chatState.sessions[sessionId]) {
		Object.assign(chatState.sessions[sessionId], updates)
	}
}

/**
 * 设置当前活跃的会话ID
 */
export function setActiveSession(sessionId) {
	chatState.activeSessionId = sessionId
}

/**
 * 清除当前活跃的会话ID
 */
export function clearActiveSession() {
	chatState.activeSessionId = null
}

// ======================== 消息管理 ========================

/**
 * 获取历史消息（分页 + 解密）
 * @param {string} sessionId
 * @param {number} page
 */
export async function fetchMessages(sessionId, page = 1) {
	// 初始化分页状态
	if (!chatState.pagination[sessionId]) {
		chatState.pagination[sessionId] = { page: 0, totalPages: 1, hasMore: true, loading: false }
	}

	const pag = chatState.pagination[sessionId]
	if (pag.loading || (!pag.hasMore && page > 1)) return

	pag.loading = true
	try {
		const res = await getMessages(sessionId, page, 20)
		const data = res.data || {}
		const records = data.records || []

		// 获取会话信息以确定对方身份
		const session = chatState.sessions[sessionId]
		const userInfo = getUserInfo()

		// 确定对方用户类型和ID
		let peerUserType, peerUserId
		if (session) {
			if (session.doctorId && session.doctorId !== userInfo.id) {
				peerUserType = 'DOCTOR'
				peerUserId = session.doctorId
			} else {
				peerUserType = 'PATIENT'
				peerUserId = session.patientId
			}
		}

		// 解密消息
		const decryptedMessages = []
		for (const msg of records) {
			const decrypted = await decryptSingleMessage(sessionId, msg, peerUserType, peerUserId)
			decryptedMessages.push(decrypted)
		}

		// API 返回降序（最新在前），翻转为升序（最旧在前）
		decryptedMessages.reverse()

		// 初始化消息数组
		if (!chatState.messages[sessionId]) {
			chatState.messages[sessionId] = []
		}

		if (page === 1) {
			chatState.messages[sessionId] = decryptedMessages
		} else {
			// 加载更多：将旧消息插入到头部
			chatState.messages[sessionId] = [...decryptedMessages, ...chatState.messages[sessionId]]
		}

		// 更新分页状态
		pag.page = data.current || page
		pag.totalPages = data.pages || 1
		pag.hasMore = pag.page < pag.totalPages

		return decryptedMessages
	} catch (err) {
		console.error('获取消息失败:', err)
		throw err
	} finally {
		pag.loading = false
	}
}

/**
 * 解密单条消息
 */
async function decryptSingleMessage(sessionId, msg, peerUserType, peerUserId) {
	const result = {
		id: msg.id,
		sessionId: msg.sessionId || sessionId,
		senderType: msg.senderType,
		senderId: msg.senderId,
		messageType: msg.messageType || 'TEXT',
		encryptedContent: msg.encryptedContent,
		iv: msg.iv,
		senderKeyVersion: msg.senderKeyVersion,
		receiverKeyVersion: msg.receiverKeyVersion,
		fileUrl: msg.fileUrl,
		readStatus: msg.readStatus,
		createTime: msg.createTime,
		decryptedContent: null,
		decryptFailed: false,
		status: 'sent'
	}

	if (!msg.encryptedContent || !msg.iv) return result

	const opts = (msg.senderKeyVersion && msg.receiverKeyVersion)
		? { senderKeyVersion: msg.senderKeyVersion, receiverKeyVersion: msg.receiverKeyVersion }
		: undefined

	try {
		const { sessionKey } = await getOrDeriveSessionKey(sessionId, peerUserType, peerUserId, opts)
		result.decryptedContent = decryptMessage(sessionKey, msg.encryptedContent, msg.iv)
		return result
	} catch (e) {
		// 永久性错误：本地私钥缺失 / 对方公钥不可得 / 后端 40401 → 不重试
		if (e.code === KEY_UNAVAILABLE || e.code === PEER_KEY_UNAVAILABLE || e.code === 40401) {
			console.warn('消息无法解密（密钥不可得）:', msg.id, e.code)
			result.decryptFailed = true
			return result
		}
		console.warn('消息解密失败，尝试刷新对方公钥重试:', msg.id, e.message)
		try {
			await refreshPeerKey(peerUserType, peerUserId, msg.senderKeyVersion)
			const { sessionKey } = await getOrDeriveSessionKey(sessionId, peerUserType, peerUserId, opts)
			result.decryptedContent = decryptMessage(sessionKey, msg.encryptedContent, msg.iv)
			return result
		} catch (retryErr) {
			result.decryptFailed = true
			return result
		}
	}
}

/**
 * 加密 + 发送，遇到 40903（密钥版本不一致）自动对账并重试一次
 * @returns {{ encryptedContent, iv, res, senderKeyVersion, receiverKeyVersion }}
 */
async function encryptAndSendWithRetry(sessionId, peerUserType, peerUserId, plaintext, extra) {
	const attempt = async () => {
		const ctx = await sendingKeyContext(sessionId, peerUserType, peerUserId)
		const { encryptedContent, iv } = encryptMessage(ctx.sessionKey, plaintext)
		const res = await sendEncryptedMessage(sessionId, {
			encryptedContent,
			iv,
			senderKeyVersion: ctx.senderKeyVersion,
			receiverKeyVersion: ctx.receiverKeyVersion,
			...extra
		})
		return { encryptedContent, iv, res, senderKeyVersion: ctx.senderKeyVersion, receiverKeyVersion: ctx.receiverKeyVersion }
	}

	const first = await attempt()
	if (first.res && first.res.code === 40903) {
		console.warn('E2EE: 40903 密钥版本不一致，对账后重试')
		// 对账本地（落后则强制 rotate）
		try { await ensureE2EEReady() } catch (e) { console.warn('ensureE2EEReady 失败:', e) }
		// 强制刷新对方缓存
		invalidateSessionKey(peerUserId)
		const second = await attempt()
		if (second.res && second.res.code === 40903) {
			throw { code: 40903, message: '密钥版本不一致，请稍后重试' }
		}
		if (second.res && second.res.code !== 200) {
			throw { code: second.res.code, message: second.res.msg || '发送失败' }
		}
		return second
	}
	if (first.res && first.res.code !== 200) {
		throw { code: first.res.code, message: first.res.msg || '发送失败' }
	}
	return first
}

/**
 * 发送文本消息
 * @param {string} sessionId
 * @param {string} plaintext
 * @returns {Promise<Object>} 发送的消息对象
 */
export async function sendTextMessage(sessionId, plaintext) {
	const userInfo = getUserInfo()
	const session = chatState.sessions[sessionId]

	// 确定对方身份
	let peerUserType, peerUserId
	if (session) {
		if (session.doctorId && session.doctorId !== userInfo.id) {
			peerUserType = 'DOCTOR'
			peerUserId = session.doctorId
		} else {
			peerUserType = 'PATIENT'
			peerUserId = session.patientId
		}
	}

	// 生成临时消息ID（乐观UI）
	const tempId = 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6)
	const now = new Date().toISOString().replace('Z', '')

	const optimisticMsg = {
		id: tempId,
		sessionId,
		senderType: 'PATIENT',
		senderId: userInfo.id,
		messageType: 'TEXT',
		decryptedContent: plaintext,
		encryptedContent: null,
		iv: null,
		senderKeyVersion: getCurrentKeyVersion(),
		receiverKeyVersion: null,
		fileUrl: null,
		readStatus: 0,
		createTime: now,
		status: 'sending',
		decryptFailed: false
	}

	// 乐观插入
	if (!chatState.messages[sessionId]) {
		chatState.messages[sessionId] = []
	}
	chatState.messages[sessionId].push(optimisticMsg)

	try {
		const { encryptedContent, iv, res, senderKeyVersion, receiverKeyVersion } =
			await encryptAndSendWithRetry(sessionId, peerUserType, peerUserId, plaintext, {
				messageType: 'TEXT', fileUrl: null
			})

		// 更新乐观消息
		const msgIndex = chatState.messages[sessionId].findIndex(m => m.id === tempId)
		if (msgIndex !== -1) {
			chatState.messages[sessionId][msgIndex].id = res.data.messageId
			chatState.messages[sessionId][msgIndex].createTime = res.data.createdAt
			chatState.messages[sessionId][msgIndex].encryptedContent = encryptedContent
			chatState.messages[sessionId][msgIndex].iv = iv
			chatState.messages[sessionId][msgIndex].senderKeyVersion = senderKeyVersion
			chatState.messages[sessionId][msgIndex].receiverKeyVersion = receiverKeyVersion
			chatState.messages[sessionId][msgIndex].status = 'sent'
		}

		// 更新会话摘要
		updateSession(sessionId, {
			lastMessageAt: res.data.createdAt,
			lastDecryptedPreview: plaintext
		})

		// 重排会话顺序
		sortSessionOrder()

		// 通知消息页刷新
		uni.$emit('chat-sessions-updated')

		return chatState.messages[sessionId][msgIndex]
	} catch (err) {
		// 标记发送失败
		const msgIndex = chatState.messages[sessionId].findIndex(m => m.id === tempId)
		if (msgIndex !== -1) {
			chatState.messages[sessionId][msgIndex].status = 'failed'
		}
		console.error('发送消息失败:', err)
		throw err
	}
}

/**
 * 发送图片消息
 * @param {string} sessionId
 * @param {string} filePath - 本地图片路径
 */
export async function sendImageMessage(sessionId, filePath) {
	const userInfo = getUserInfo()
	const session = chatState.sessions[sessionId]

	let peerUserType, peerUserId
	if (session) {
		if (session.doctorId && session.doctorId !== userInfo.id) {
			peerUserType = 'DOCTOR'
			peerUserId = session.doctorId
		} else {
			peerUserType = 'PATIENT'
			peerUserId = session.patientId
		}
	}

	const tempId = 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6)
	const now = new Date().toISOString().replace('Z', '')

	const optimisticMsg = {
		id: tempId,
		sessionId,
		senderType: 'PATIENT',
		senderId: userInfo.id,
		messageType: 'IMAGE',
		decryptedContent: '[图片]',
		encryptedContent: null,
		iv: null,
		senderKeyVersion: getCurrentKeyVersion(),
		receiverKeyVersion: null,
		fileUrl: filePath, // 临时用本地路径
		readStatus: 0,
		createTime: now,
		status: 'sending',
		decryptFailed: false
	}

	if (!chatState.messages[sessionId]) {
		chatState.messages[sessionId] = []
	}
	chatState.messages[sessionId].push(optimisticMsg)

	try {
		// 上传图片
		const fileUrl = await uploadChatFile(filePath)
		const fileName = filePath.split('/').pop() || 'image.jpg'

		const { encryptedContent, iv, res, senderKeyVersion, receiverKeyVersion } =
			await encryptAndSendWithRetry(sessionId, peerUserType, peerUserId, fileName, {
				messageType: 'IMAGE', fileUrl
			})

		// 更新乐观消息
		const msgIndex = chatState.messages[sessionId].findIndex(m => m.id === tempId)
		if (msgIndex !== -1) {
			chatState.messages[sessionId][msgIndex].id = res.data.messageId
			chatState.messages[sessionId][msgIndex].createTime = res.data.createdAt
			chatState.messages[sessionId][msgIndex].encryptedContent = encryptedContent
			chatState.messages[sessionId][msgIndex].iv = iv
			chatState.messages[sessionId][msgIndex].senderKeyVersion = senderKeyVersion
			chatState.messages[sessionId][msgIndex].receiverKeyVersion = receiverKeyVersion
			chatState.messages[sessionId][msgIndex].fileUrl = fileUrl
			chatState.messages[sessionId][msgIndex].status = 'sent'
		}

		updateSession(sessionId, {
			lastMessageAt: res.data.createdAt,
			lastDecryptedPreview: '[图片]'
		})
		sortSessionOrder()
		uni.$emit('chat-sessions-updated')

		return chatState.messages[sessionId][msgIndex]
	} catch (err) {
		const msgIndex = chatState.messages[sessionId].findIndex(m => m.id === tempId)
		if (msgIndex !== -1) {
			chatState.messages[sessionId][msgIndex].status = 'failed'
		}
		console.error('发送图片失败:', err)
		throw err
	}
}

/**
 * 重试发送失败的消息
 * @param {string} sessionId
 * @param {string} messageId - 临时消息ID
 */
export async function retryMessage(sessionId, messageId) {
	const messages = chatState.messages[sessionId]
	if (!messages) return

	const msg = messages.find(m => m.id === messageId)
	if (!msg || msg.status !== 'failed') return

	// 移除失败的消息
	const index = messages.indexOf(msg)
	messages.splice(index, 1)

	// 重新发送
	if (msg.messageType === 'IMAGE' && msg.fileUrl) {
		return await sendImageMessage(sessionId, msg.fileUrl)
	} else {
		return await sendTextMessage(sessionId, msg.decryptedContent)
	}
}

// ======================== 实时消息处理 ========================

/**
 * 处理 WebSocket 推送的新消息
 * @param {string} sessionId
 * @param {Object} wsMessage - WebSocket CHAT_MESSAGE 数据
 */
export async function addIncomingMessage(sessionId, wsMessage) {
	const session = chatState.sessions[sessionId]
	const userInfo = getUserInfo()

	// 确定对方身份
	let peerUserType = wsMessage.senderType
	let peerUserId = wsMessage.senderId

	// 解密消息（按消息携带的版本号选择本地私钥 + 对方公钥）
	let decryptedContent = null
	let decryptFailed = false
	const opts = (wsMessage.senderKeyVersion && wsMessage.receiverKeyVersion)
		? { senderKeyVersion: wsMessage.senderKeyVersion, receiverKeyVersion: wsMessage.receiverKeyVersion }
		: undefined
	try {
		const { sessionKey } = await getOrDeriveSessionKey(sessionId, peerUserType, peerUserId, opts)
		decryptedContent = decryptMessage(sessionKey, wsMessage.encryptedContent, wsMessage.iv)
	} catch (e) {
		if (e.code === KEY_UNAVAILABLE || e.code === PEER_KEY_UNAVAILABLE || e.code === 40401) {
			console.warn('实时消息无法解密（密钥不可得）:', e.code)
		} else {
			console.warn('实时消息解密失败:', e.message)
		}
		decryptFailed = true
	}

	const newMsg = {
		id: wsMessage.messageId,
		sessionId,
		senderType: wsMessage.senderType,
		senderId: wsMessage.senderId,
		messageType: wsMessage.messageType || 'TEXT',
		decryptedContent,
		encryptedContent: wsMessage.encryptedContent,
		iv: wsMessage.iv,
		senderKeyVersion: wsMessage.senderKeyVersion,
		receiverKeyVersion: wsMessage.receiverKeyVersion,
		fileUrl: wsMessage.fileUrl,
		readStatus: 0,
		createTime: wsMessage.createdAt,
		status: 'sent',
		decryptFailed
	}

	// 检查是否已存在（防重复）
	if (!chatState.messages[sessionId]) {
		chatState.messages[sessionId] = []
	}
	const exists = chatState.messages[sessionId].some(m => m.id === wsMessage.messageId)
	if (!exists) {
		chatState.messages[sessionId].push(newMsg)
	}

	// 更新会话信息
	if (session) {
		const preview = decryptFailed ? '[加密消息]'
			: (wsMessage.messageType === 'IMAGE' ? '[图片]'
			: (decryptedContent || '[加密消息]'))

		updateSession(sessionId, {
			lastMessageAt: wsMessage.createdAt,
			lastDecryptedPreview: preview
		})

		// 如果当前不在这个会话页面，增加未读数
		if (chatState.activeSessionId !== sessionId) {
			updateSession(sessionId, {
				unreadCount: (session.unreadCount || 0) + 1
			})
		}
	} else {
		// 会话不在列表中，刷新列表
		try {
			await fetchSessions()
		} catch (e) {
			console.warn('刷新会话列表失败:', e)
		}
	}

	sortSessionOrder()

	// 通知 UI 更新
	uni.$emit('chat-sessions-updated')
	uni.$emit(`chat-new-message-${sessionId}`, newMsg)

	// 如果不在当前会话，播放通知
	if (chatState.activeSessionId !== sessionId) {
		uni.$emit('chat-notification', {
			sessionId,
			senderName: session ? session.doctorName : '医生',
			preview: newMsg.decryptedContent || '[加密消息]'
		})
	}
}

// ======================== 输入状态 ========================

/**
 * 更新输入状态
 */
export function updateTyping(sessionId, isTyping, userId) {
	// 清除之前的超时
	if (chatState.typing[sessionId] && chatState.typing[sessionId].timeoutId) {
		clearTimeout(chatState.typing[sessionId].timeoutId)
	}

	if (isTyping) {
		const timeoutId = setTimeout(() => {
			if (chatState.typing[sessionId]) {
				chatState.typing[sessionId].isTyping = false
			}
		}, 5000) // 5秒无更新自动隐藏

		chatState.typing[sessionId] = { isTyping: true, userId, timeoutId }
	} else {
		chatState.typing[sessionId] = { isTyping: false, userId: null, timeoutId: null }
	}
}

/**
 * 获取指定会话的输入状态
 */
export function getTypingState(sessionId) {
	return chatState.typing[sessionId] || { isTyping: false }
}

// ======================== 已读管理 ========================

/**
 * 标记会话已读（REST API + 本地更新）
 */
export async function markSessionRead(sessionId) {
	try {
		await markRead(sessionId)
		updateSession(sessionId, { unreadCount: 0 })
		uni.$emit('chat-sessions-updated')
	} catch (err) {
		// 40301: 会话已关闭，忽略
		if (err.code !== 40301 && !(err.data && err.data.code === 40301)) {
			console.error('标记已读失败:', err)
		}
	}
}

/**
 * 处理已读回执（对方已读）
 */
export function handleReadReceipt(sessionId, readBy) {
	const messages = chatState.messages[sessionId]
	if (!messages) return

	const userInfo = getUserInfo()
	// 将我发送的消息标记为已读
	messages.forEach(msg => {
		if (msg.senderId === userInfo.id && msg.readStatus === 0) {
			msg.readStatus = 1
		}
	})

	uni.$emit(`chat-read-receipt-${sessionId}`)
}

// ======================== 密钥更新 ========================

/**
 * 处理对方密钥更新通知
 */
export function handleKeyUpdated(userId, newKeyVersion) {
	// session key 缓存已由 e2eeCrypto 模块清除
	// 此处仅通知 UI
	uni.$emit('chat-key-updated', { userId, newKeyVersion })
}

// ======================== 辅助方法 ========================

/**
 * 排序会话列表
 */
function sortSessionOrder() {
	chatState.sessionOrder.sort((a, b) => {
		const timeA = chatState.sessions[a]?.lastMessageAt || ''
		const timeB = chatState.sessions[b]?.lastMessageAt || ''
		return timeB.localeCompare(timeA)
	})
}

/**
 * 获取指定会话的消息列表
 */
export function getSessionMessages(sessionId) {
	return chatState.messages[sessionId] || []
}

/**
 * 获取指定会话的分页状态
 */
export function getPaginationState(sessionId) {
	return chatState.pagination[sessionId] || { page: 0, totalPages: 1, hasMore: true, loading: false }
}

/**
 * 清除所有聊天状态（登出时调用）
 */
export function clearChatState() {
	chatState.sessions = {}
	chatState.sessionOrder = []
	chatState.messages = {}
	chatState.pagination = {}
	chatState.typing = {}
	chatState.sessionsLoading = false
	chatState.e2eeReady = false
	chatState.keyVersion = 0
	chatState.activeSessionId = null

	// 清除加密密钥
	clearAllKeys()
	clearAllLocalKeys()
}

// 导出状态
export { chatState }

export default {
	chatState,
	fetchSessions,
	getSessionList,
	getTotalUnreadCount,
	setActiveSession,
	clearActiveSession,
	fetchMessages,
	sendTextMessage,
	sendImageMessage,
	retryMessage,
	addIncomingMessage,
	updateTyping,
	getTypingState,
	markSessionRead,
	handleReadReceipt,
	handleKeyUpdated,
	getSessionMessages,
	getPaginationState,
	clearChatState
}
