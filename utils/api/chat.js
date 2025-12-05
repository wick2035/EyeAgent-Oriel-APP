/**
 * 聊天对话API接口
 * 对接AI问诊功能
 */
import { post, get, getSessionId } from './request.js'

/**
 * 发送消息 - 与Agent进行对话交互
 * @param {Object} data 消息数据
 * @param {string} data.message - 用户消息内容
 * @param {string} [data.conversation_id] - 会话ID，续聊时传入
 * @param {string} [data.agent_type] - Agent类型，默认 'health'
 * @returns {Promise<Object>} 响应数据
 *
 * 响应结构:
 * {
 *   response: "您好！我是小Eye...",
 *   session_id: "sess-abc123",
 *   conversation_id: "660e8400-...",
 *   is_completed: false,
 *   stage: "health_consultation",
 *   agent_type: "health",
 *   metadata: { patient_id, message_count, role }
 * }
 */
export async function sendMessage(data) {
	const sessionId = getSessionId()

	const response = await post('/api/app/agent/chat', {
		message: data.message,
		sessionId: sessionId,
		agentType: data.agentType || 'health',
		role: data.role || 'patient',
		conversationId: data.conversationId || null
	})

	// 适配后端响应格式: { code, msg, data: { response, conversationId, ... } }
	if (response.code === 200 && response.data) {
		return response.data
	}

	throw new Error(response.msg || '请求失败')
}

/**
 * 获取历史会话列表
 * @returns {Promise<Array>} 会话列表
 *
 * 响应结构:
 * [{
 *   id: "会话ID",
 *   hostId: "用户ID",
 *   userType: "patient",
 *   title: "会话标题",
 *   summary: "会话摘要",
 *   totalMessages: 6,
 *   createTime: "2025-12-03 10:30:00",
 *   updateTime: "2025-12-03 11:15:00"
 * }]
 */
export async function getConversations() {
	const response = await get('/api/app/agent/get-conversation')
	if (response.code === 200) {
		return response.data || []
	}
	throw new Error(response.msg || '获取会话列表失败')
}

/**
 * 分页查询会话列表
 * @param {Object} params 查询参数
 * @param {string} [params.searchKey] - 搜索关键词
 * @param {number} [params.pageNum] - 页码，从1开始
 * @param {number} [params.pageSize] - 每页数量，默认10
 * @returns {Promise<Object>} { list, pageNum, total, pages }
 */
export async function pageConversations(params = {}) {
	const response = await get('/api/app/agent/page-conversation', {
		searchKey: params.searchKey || '',
		pageNum: params.pageNum || 1,
		pageSize: params.pageSize || 10
	})
	if (response.code === 200) {
		return {
			list: response.data || [],
			pageNum: response.pageNum,
			total: response.total,
			pages: response.pages
		}
	}
	throw new Error(response.msg || '查询会话失败')
}

/**
 * 获取会话消息列表
 * @param {string} conversationId 会话ID
 * @returns {Promise<Object>} { messages, conversation }
 *
 * messages 结构:
 * [{
 *   id: "消息ID",
 *   chatId: "会话ID",
 *   messageOrder: 1,
 *   messageContent: "消息内容",
 *   messageType: "user" | "assistant",
 *   senderId: "发送者ID",
 *   createTime: "2025-12-03 10:30:00"
 * }]
 */
export async function getMessages(conversationId) {
	const response = await get('/api/app/agent/get-messages', {
		chatConversationId: conversationId
	})
	if (response.code === 200) {
		return {
			messages: response.data || [],
			conversation: response.conversation
		}
	}
	throw new Error(response.msg || '获取消息失败')
}

/**
 * 获取快捷提示词列表
 * @returns {Promise<Array>}
 */
export function getQuickPrompts() {
	// 暂时返回本地数据，后续可对接API
	return Promise.resolve([
		{ id: 1, text: '最近总是头痛是怎么回事？', icon: 'headache' },
		{ id: 2, text: '体检报告中的指标异常怎么看？', icon: 'report' },
		{ id: 3, text: '感冒了应该吃什么药？', icon: 'medicine' },
		{ id: 4, text: '如何改善睡眠质量？', icon: 'sleep' },
		{ id: 5, text: '眼睛干涩疲劳怎么缓解？', icon: 'eye' },
		{ id: 6, text: '血压偏高需要注意什么？', icon: 'heart' }
	])
}

/**
 * 刷新快捷提示词（换一批）
 * @returns {Promise<Array>}
 */
export function refreshQuickPrompts() {
	// 暂时返回本地数据，后续可对接API
	const allPrompts = [
		{ id: 1, text: '最近总是头痛是怎么回事？', icon: 'headache' },
		{ id: 2, text: '体检报告中的指标异常怎么看？', icon: 'report' },
		{ id: 3, text: '感冒了应该吃什么药？', icon: 'medicine' },
		{ id: 4, text: '如何改善睡眠质量？', icon: 'sleep' },
		{ id: 5, text: '眼睛干涩疲劳怎么缓解？', icon: 'eye' },
		{ id: 6, text: '血压偏高需要注意什么？', icon: 'heart' },
		{ id: 7, text: '腰酸背痛是什么原因？', icon: 'back' },
		{ id: 8, text: '胃不舒服应该怎么调理？', icon: 'stomach' },
		{ id: 9, text: '皮肤过敏了怎么处理？', icon: 'skin' },
		{ id: 10, text: '最近容易疲劳是怎么回事？', icon: 'fatigue' }
	]

	// 随机打乱并返回4个
	const shuffled = allPrompts.sort(() => Math.random() - 0.5)
	return Promise.resolve(shuffled.slice(0, 4))
}

export default {
	sendMessage,
	getConversations,
	pageConversations,
	getMessages,
	getQuickPrompts,
	refreshQuickPrompts
}
