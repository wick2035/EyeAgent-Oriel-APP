/**
 * 聊天 WebSocket 桥接模块
 * 注册 CHAT_* 事件处理器，桥接到 chat store
 */

import { registerHandler, send } from './websocket.js'
import {
	addIncomingMessage,
	updateTyping,
	handleReadReceipt,
	handleKeyUpdated
} from '@/store/chat.js'
import { invalidateSessionKey } from './crypto/e2eeCrypto.js'

// 输入状态防抖定时器
let typingTimeouts = {}

/**
 * 初始化聊天 WebSocket 事件处理
 * 在 App 启动后调用一次
 */
export function initChatWebSocket() {
	console.log('初始化聊天 WebSocket 事件处理器')

	// 新消息
	registerHandler('CHAT_MESSAGE', (message) => {
		console.log('收到聊天消息:', message.messageId)
		addIncomingMessage(message.sessionId, message)
	})

	// 正在输入
	registerHandler('CHAT_TYPING', (message) => {
		updateTyping(message.sessionId, message.isTyping, message.userId)
	})

	// 已读回执
	registerHandler('CHAT_READ_RECEIPT', (message) => {
		handleReadReceipt(message.sessionId, message.readBy)
	})

	// 密钥更新
	registerHandler('CHAT_KEY_UPDATED', (message) => {
		console.log('对方密钥已更新:', message.userId, '新版本:', message.newKeyVersion)
		invalidateSessionKey(message.userId)
		handleKeyUpdated(message.userId, message.newKeyVersion)
	})
}

/**
 * 发送输入状态（带防抖）
 * @param {string} sessionId
 * @param {boolean} isTyping
 */
export function sendTyping(sessionId, isTyping) {
	send({
		type: 'CHAT_TYPING',
		sessionId,
		isTyping
	})

	// 自动在 3 秒后发送停止输入
	if (isTyping) {
		if (typingTimeouts[sessionId]) {
			clearTimeout(typingTimeouts[sessionId])
		}
		typingTimeouts[sessionId] = setTimeout(() => {
			send({
				type: 'CHAT_TYPING',
				sessionId,
				isTyping: false
			})
			delete typingTimeouts[sessionId]
		}, 3000)
	} else {
		if (typingTimeouts[sessionId]) {
			clearTimeout(typingTimeouts[sessionId])
			delete typingTimeouts[sessionId]
		}
	}
}

/**
 * 通过 WebSocket 发送已读回执（即时 UI 反馈通道）
 * @param {string} sessionId
 */
export function sendReadReceipt(sessionId) {
	send({
		type: 'CHAT_READ_RECEIPT',
		sessionId
	})
}

/**
 * 清除所有输入状态定时器
 */
export function clearTypingTimeouts() {
	Object.keys(typingTimeouts).forEach(key => {
		clearTimeout(typingTimeouts[key])
	})
	typingTimeouts = {}
}

export default {
	initChatWebSocket,
	sendTyping,
	sendReadReceipt,
	clearTypingTimeouts
}
