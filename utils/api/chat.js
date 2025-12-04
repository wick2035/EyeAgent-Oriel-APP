/**
 * 聊天对话API接口
 * 对接AI问诊功能
 */
import { post, get, del, getSessionId } from './request.js'

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
 * @param {Object} params 查询参数
 * @param {number} [params.page] - 页码
 * @param {number} [params.pageSize] - 每页数量
 * @returns {Promise<Object>}
 */
export function getConversations(params = {}) {
	const patientId = getPatientId()
	return get('/api/conversations', {
		patient_id: patientId,
		page: params.page || 1,
		page_size: params.pageSize || 20
	})
}

/**
 * 获取单个会话详情（包含历史消息）
 * @param {string} conversationId 会话ID
 * @returns {Promise<Object>}
 */
export function getConversationDetail(conversationId) {
	return get(`/api/conversations/${conversationId}`)
}

/**
 * 删除会话
 * @param {string} conversationId 会话ID
 * @returns {Promise<Object>}
 */
export function deleteConversation(conversationId) {
	return del(`/api/conversations/${conversationId}`)
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
	getConversationDetail,
	deleteConversation,
	getQuickPrompts,
	refreshQuickPrompts
}
