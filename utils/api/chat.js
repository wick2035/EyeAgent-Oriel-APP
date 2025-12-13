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

// 眼科相关提示词库
const eyePrompts = [
	{ id: 1, text: '眼睛干涩疲劳怎么缓解？', icon: 'eye' },
	{ id: 2, text: '长时间看手机眼睛酸痛怎么办？', icon: 'eye' },
	{ id: 3, text: '近视度数加深太快怎么控制？', icon: 'eye' },
	{ id: 4, text: '可以帮我预约医生吗？', icon: 'eye' },
	{ id: 5, text: '眼睛经常流泪是什么原因？', icon: 'eye' },
	{ id: 6, text: '眼睛红血丝多是怎么回事？', icon: 'eye' },
	{ id: 7, text: '飞蚊症需要治疗吗？', icon: 'eye' },
	{ id: 8, text: '眼睛痒是过敏还是感染？', icon: 'eye' },
	{ id: 9, text: '青光眼有哪些早期症状？', icon: 'eye' },
	{ id: 10, text: '白内障什么时候需要手术？', icon: 'eye' },
	{ id: 11, text: '干眼症怎么治疗效果好？', icon: 'eye' },
	{ id: 12, text: '眼压高会导致什么问题？', icon: 'eye' },
	{ id: 13, text: '散光和近视有什么区别？', icon: 'eye' },
	{ id: 14, text: '隐形眼镜戴久了眼睛不舒服？', icon: 'eye' },
	{ id: 15, text: '眼底检查能查出什么问题？', icon: 'eye' },
	{ id: 16, text: '糖尿病会影响眼睛吗？', icon: 'eye' },
	{ id: 17, text: '麦粒肿反复发作怎么办？', icon: 'eye' },
	{ id: 18, text: '激光近视手术安全吗？', icon: 'eye' },
	{ id: 19, text: '老花眼能预防吗？', icon: 'eye' },
	{ id: 20, text: '眼睛模糊看不清是什么原因？', icon: 'eye' }
]

/**
 * 获取快捷提示词列表
 * @returns {Promise<Array>}
 */
export function getQuickPrompts() {
	// 返回前5条
	return Promise.resolve(eyePrompts.slice(0, 5))
}

/**
 * 刷新快捷提示词（换一批）
 * @returns {Promise<Array>}
 */
export function refreshQuickPrompts() {
	// 随机打乱并返回5个
	const shuffled = [...eyePrompts].sort(() => Math.random() - 0.5)
	return Promise.resolve(shuffled.slice(0, 5))
}

export default {
	sendMessage,
	getConversations,
	pageConversations,
	getMessages,
	getQuickPrompts,
	refreshQuickPrompts
}
