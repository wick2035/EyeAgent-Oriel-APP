/**
 * WebSocket通知服务
 * 处理实时通知推送、心跳保活、断线重连
 */

import config from './config.js'
import { addNotification } from '@/store/notification.js'

// WebSocket连接状态
const WS_STATUS = {
	CLOSED: 'CLOSED',
	CONNECTING: 'CONNECTING',
	CONNECTED: 'CONNECTED',
	AUTHENTICATED: 'AUTHENTICATED'
}

// WebSocket实例
let socketTask = null
// 心跳定时器
let heartbeatTimer = null
// 重连定时器
let reconnectTimer = null
// 重连次数
let reconnectCount = 0
// 最大重连次数
const MAX_RECONNECT = 3
// 重连间隔（递增）
const RECONNECT_INTERVALS = [3000, 5000, 10000]
// 心跳间隔
const HEARTBEAT_INTERVAL = 30000
// 当前状态
let currentStatus = WS_STATUS.CLOSED
// 是否主动断开
let isManualDisconnect = false
// 音频上下文
let audioContext = null
// 是否静音
let isMuted = false

/**
 * 获取WebSocket连接地址
 */
function getWebSocketUrl() {
	const baseUrl = config.baseUrl
	// 将http转换为ws
	const wsUrl = baseUrl.replace(/^http/, 'ws')
	return `${wsUrl}/ws/app/notify`
}

/**
 * 初始化提示音
 */
function initAudio() {
	if (audioContext) return

	audioContext = uni.createInnerAudioContext()
	audioContext.src = '/static/audio/notification.mp3'
	audioContext.volume = 1
}

/**
 * 播放提示音
 */
function playNotificationSound() {
	if (isMuted) return

	try {
		if (!audioContext) {
			initAudio()
		}
		audioContext.stop()
		audioContext.play()
	} catch (err) {
		console.error('播放提示音失败:', err)
	}
}

/**
 * 设置静音状态
 */
export function setMuted(muted) {
	isMuted = muted
	uni.setStorageSync('notification_muted', muted)
}

/**
 * 获取静音状态
 */
export function getMuted() {
	return uni.getStorageSync('notification_muted') || false
}

/**
 * 建立WebSocket连接
 */
export function connect() {
	// 已连接则不重复连接
	if (socketTask && currentStatus !== WS_STATUS.CLOSED) {
		console.log('WebSocket已连接或正在连接中')
		return
	}

	// 获取token
	const token = uni.getStorageSync(config.storageKeys.token)
	if (!token) {
		console.log('未登录，不建立WebSocket连接')
		return
	}

	isManualDisconnect = false
	currentStatus = WS_STATUS.CONNECTING
	isMuted = getMuted()

	const url = getWebSocketUrl()
	console.log('正在连接WebSocket:', url)

	socketTask = uni.connectSocket({
		url: url,
		success: () => {
			console.log('WebSocket连接请求已发送')
		},
		fail: (err) => {
			console.error('WebSocket连接请求失败:', err)
			currentStatus = WS_STATUS.CLOSED
			scheduleReconnect()
		}
	})

	// 连接成功
	socketTask.onOpen(() => {
		console.log('WebSocket连接已建立')
		currentStatus = WS_STATUS.CONNECTED
		reconnectCount = 0

		// 发送认证
		sendAuth(token)
	})

	// 接收消息
	socketTask.onMessage((res) => {
		handleMessage(res.data)
	})

	// 连接关闭
	socketTask.onClose((res) => {
		console.log('WebSocket连接已关闭:', res)
		currentStatus = WS_STATUS.CLOSED
		stopHeartbeat()

		// 非主动断开则尝试重连
		if (!isManualDisconnect) {
			scheduleReconnect()
		}
	})

	// 连接错误
	socketTask.onError((err) => {
		console.error('WebSocket连接错误:', err)
		currentStatus = WS_STATUS.CLOSED
		stopHeartbeat()

		if (!isManualDisconnect) {
			scheduleReconnect()
		}
	})
}

/**
 * 发送认证消息
 */
function sendAuth(token) {
	if (!socketTask || currentStatus !== WS_STATUS.CONNECTED) return

	const authMsg = JSON.stringify({
		type: 'AUTH',
		satoken: token
	})

	socketTask.send({
		data: authMsg,
		success: () => {
			console.log('认证消息已发送')
		},
		fail: (err) => {
			console.error('发送认证消息失败:', err)
		}
	})
}

/**
 * 处理接收到的消息
 */
function handleMessage(data) {
	try {
		const message = JSON.parse(data)
		console.log('收到WebSocket消息:', message.type)

		switch (message.type) {
			case 'AUTH_OK':
				console.log('WebSocket认证成功')
				currentStatus = WS_STATUS.AUTHENTICATED
				startHeartbeat()
				break

			case 'AUTH_FAIL':
				console.error('WebSocket认证失败:', message.msg)
				disconnect()
				break

			case 'PONG':
				// 心跳响应
				break

			case 'NOTIFICATION':
				// 收到新通知
				handleNotification(message.data)
				break

			default:
				console.log('未知消息类型:', message.type)
		}
	} catch (err) {
		console.error('解析WebSocket消息失败:', err)
	}
}

/**
 * 处理新通知
 */
function handleNotification(notification) {
	console.log('收到新通知:', notification)

	// 添加到store
	addNotification(notification)

	// 播放提示音
	playNotificationSound()

	// 显示系统通知（可选）
	showSystemNotification(notification)
}

/**
 * 显示系统级通知
 */
function showSystemNotification(notification) {
	// #ifdef APP-PLUS
	// App端可以使用本地推送
	uni.createPushMessage({
		title: notification.reminderTitle,
		content: notification.reminderContent,
		payload: JSON.stringify(notification)
	})
	// #endif

	// #ifndef APP-PLUS
	// 其他端显示Toast提示
	uni.showToast({
		title: notification.reminderTitle,
		icon: 'none',
		duration: 2000
	})
	// #endif
}

/**
 * 开始心跳
 */
function startHeartbeat() {
	stopHeartbeat()

	heartbeatTimer = setInterval(() => {
		if (socketTask && currentStatus === WS_STATUS.AUTHENTICATED) {
			socketTask.send({
				data: JSON.stringify({ type: 'PING' }),
				fail: (err) => {
					console.error('发送心跳失败:', err)
				}
			})
		}
	}, HEARTBEAT_INTERVAL)
}

/**
 * 停止心跳
 */
function stopHeartbeat() {
	if (heartbeatTimer) {
		clearInterval(heartbeatTimer)
		heartbeatTimer = null
	}
}

/**
 * 安排重连
 */
function scheduleReconnect() {
	if (isManualDisconnect) return
	if (reconnectCount >= MAX_RECONNECT) {
		console.log('已达最大重连次数，停止重连')
		return
	}

	// 清除之前的重连定时器
	if (reconnectTimer) {
		clearTimeout(reconnectTimer)
	}

	const interval = RECONNECT_INTERVALS[reconnectCount] || RECONNECT_INTERVALS[RECONNECT_INTERVALS.length - 1]
	console.log(`将在 ${interval / 1000} 秒后尝试第 ${reconnectCount + 1} 次重连`)

	reconnectTimer = setTimeout(() => {
		reconnectCount++
		connect()
	}, interval)
}

/**
 * 主动断开连接
 */
export function disconnect() {
	console.log('主动断开WebSocket连接')
	isManualDisconnect = true

	// 清除定时器
	stopHeartbeat()
	if (reconnectTimer) {
		clearTimeout(reconnectTimer)
		reconnectTimer = null
	}

	// 关闭连接
	if (socketTask) {
		socketTask.close({
			success: () => {
				console.log('WebSocket已关闭')
			}
		})
		socketTask = null
	}

	currentStatus = WS_STATUS.CLOSED
	reconnectCount = 0
}

/**
 * 重新连接
 */
export function reconnect() {
	disconnect()
	isManualDisconnect = false
	reconnectCount = 0
	connect()
}

/**
 * 获取当前连接状态
 */
export function getStatus() {
	return currentStatus
}

/**
 * 是否已认证连接
 */
export function isAuthenticated() {
	return currentStatus === WS_STATUS.AUTHENTICATED
}

/**
 * 销毁资源
 */
export function destroy() {
	disconnect()
	if (audioContext) {
		audioContext.destroy()
		audioContext = null
	}
}

export default {
	connect,
	disconnect,
	reconnect,
	getStatus,
	isAuthenticated,
	setMuted,
	getMuted,
	destroy,
	WS_STATUS
}
