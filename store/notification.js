/**
 * 通知状态管理
 * 管理未读通知列表、未读数量统计
 */

import { reactive, computed } from 'vue'
import * as notificationApi from '@/utils/api/notification.js'

// 通知状态
const notificationState = reactive({
	// 未读通知（按类型分组）
	unread: {
		system: [],
		reserve: [],
		medication: []
	},
	// 加载状态
	loading: false,
	// 最后更新时间
	lastUpdateTime: null
})

/**
 * 获取未读通知总数
 */
export function getUnreadCount() {
	const { system, reserve, medication } = notificationState.unread
	return system.length + reserve.length + medication.length
}

/**
 * 获取各类型未读数量
 */
export function getUnreadCountByType(type) {
	const typeMap = {
		'SYSTEM': 'system',
		'RESERVE': 'reserve',
		'MEDICATION': 'medication'
	}
	const key = typeMap[type] || type
	return notificationState.unread[key]?.length || 0
}

/**
 * 获取所有未读通知（扁平化列表）
 */
export function getAllUnreadNotifications() {
	const { system, reserve, medication } = notificationState.unread
	return [...system, ...reserve, ...medication].sort((a, b) => {
		return new Date(b.sentTime) - new Date(a.sentTime)
	})
}

/**
 * 获取指定类型的未读通知
 */
export function getUnreadByType(type) {
	const typeMap = {
		'SYSTEM': 'system',
		'RESERVE': 'reserve',
		'MEDICATION': 'medication'
	}
	const key = typeMap[type] || type
	return notificationState.unread[key] || []
}

/**
 * 从服务器加载未读通知
 */
export async function fetchUnreadNotifications() {
	if (notificationState.loading) return

	notificationState.loading = true
	try {
		const res = await notificationApi.getUnreadNotifications()
		if (res.code === 200 && res.data) {
			notificationState.unread.system = res.data.system || []
			notificationState.unread.reserve = res.data.reserve || []
			notificationState.unread.medication = res.data.medication || []
			notificationState.lastUpdateTime = new Date()
		}
	} catch (err) {
		console.error('获取未读通知失败:', err)
	} finally {
		notificationState.loading = false
	}
}

/**
 * 添加新通知（来自WebSocket推送）
 */
export function addNotification(notification) {
	const typeMap = {
		'SYSTEM': 'system',
		'RESERVE': 'reserve',
		'MEDICATION': 'medication'
	}
	const key = typeMap[notification.reminderType]
	if (key && notificationState.unread[key]) {
		// 检查是否已存在
		const exists = notificationState.unread[key].some(n => n.id === notification.id)
		if (!exists) {
			notificationState.unread[key].unshift(notification)
		}
	}
}

/**
 * 标记单条通知为已读
 */
export async function markAsRead(reminderId) {
	try {
		const res = await notificationApi.markAsRead(reminderId)
		if (res.code === 200) {
			// 从未读列表中移除
			removeFromUnread(reminderId)
			return true
		}
	} catch (err) {
		console.error('标记已读失败:', err)
	}
	return false
}

/**
 * 标记全部为已读
 */
export async function markAllAsRead() {
	try {
		const res = await notificationApi.markAllAsRead()
		if (res.code === 200) {
			// 清空未读列表
			notificationState.unread.system = []
			notificationState.unread.reserve = []
			notificationState.unread.medication = []
			return true
		}
	} catch (err) {
		console.error('标记全部已读失败:', err)
	}
	return false
}

/**
 * 从未读列表中移除指定通知
 */
function removeFromUnread(reminderId) {
	for (const key of ['system', 'reserve', 'medication']) {
		const index = notificationState.unread[key].findIndex(n => n.id === reminderId)
		if (index !== -1) {
			notificationState.unread[key].splice(index, 1)
			break
		}
	}
}

/**
 * 清空所有通知状态
 */
export function clearNotificationState() {
	notificationState.unread.system = []
	notificationState.unread.reserve = []
	notificationState.unread.medication = []
	notificationState.lastUpdateTime = null
}

/**
 * 获取加载状态
 */
export function isLoading() {
	return notificationState.loading
}

// 导出状态供组件使用
export { notificationState }

export default {
	notificationState,
	getUnreadCount,
	getUnreadCountByType,
	getAllUnreadNotifications,
	getUnreadByType,
	fetchUnreadNotifications,
	addNotification,
	markAsRead,
	markAllAsRead,
	clearNotificationState,
	isLoading
}
