/**
 * 用药提醒状态管理
 */
import { reactive } from 'vue'
import * as medicationApi from '@/utils/api/medication.js'

// 用药提醒状态
const medicationState = reactive({
	// 提醒列表
	reminders: [],
	// 今日统计
	todayStats: {
		total: 0,
		completed: 0,
		nextReminder: null
	},
	// 加载状态
	loading: false,
	// 当前编辑的提醒
	editingReminder: null,
	// 是否已初始化
	initialized: false
})

/**
 * 获取状态
 */
export function getMedicationState() {
	return medicationState
}

/**
 * 获取今日完成率
 */
export function getCompletionRate() {
	const { total, completed } = medicationState.todayStats
	if (total === 0) return 100
	return Math.round((completed / total) * 100)
}

/**
 * 获取按时间分组的提醒列表
 */
export function getGroupedReminders() {
	const groups = [
		{ key: 'morning', label: '早晨', time: '06:00-12:00', icon: 'morning', items: [] },
		{ key: 'noon', label: '中午', time: '12:00-14:00', icon: 'noon', items: [] },
		{ key: 'evening', label: '傍晚', time: '14:00-19:00', icon: 'evening', items: [] },
		{ key: 'night', label: '夜间', time: '19:00-06:00', icon: 'night', items: [] }
	]

	medicationState.reminders.forEach(reminder => {
		const hour = parseInt(reminder.scheduledTime.substring(11, 13))
		if (hour >= 6 && hour < 12) {
			groups[0].items.push(reminder)
		} else if (hour >= 12 && hour < 14) {
			groups[1].items.push(reminder)
		} else if (hour >= 14 && hour < 19) {
			groups[2].items.push(reminder)
		} else {
			groups[3].items.push(reminder)
		}
	})

	return groups.filter(g => g.items.length > 0)
}

/**
 * 更新今日统计
 */
function updateTodayStats() {
	const today = new Date().toISOString().split('T')[0]
	const todayReminders = medicationState.reminders.filter(r =>
		r.scheduledTime.startsWith(today) && r.enabled
	)

	medicationState.todayStats.total = todayReminders.length
	medicationState.todayStats.completed = todayReminders.filter(r =>
		r.status === 'READ'
	).length

	// 找下一个待服药提醒
	const now = new Date().toISOString()
	const upcoming = todayReminders
		.filter(r => r.status !== 'READ' && r.scheduledTime > now)
		.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime))

	medicationState.todayStats.nextReminder = upcoming[0] || null
}

/**
 * 加载提醒列表
 */
export async function fetchReminders(date = null) {
	if (medicationState.loading) return

	medicationState.loading = true
	try {
		const res = await medicationApi.getReminderList(date)
		if (res.code === 200 && res.data) {
			medicationState.reminders = res.data.list || []
			updateTodayStats()
			medicationState.initialized = true
		}
	} catch (err) {
		console.error('获取用药提醒失败:', err)
	} finally {
		medicationState.loading = false
	}
}

/**
 * 创建提醒
 */
export async function createReminder(data) {
	try {
		const res = await medicationApi.createReminder(data)
		if (res.code === 200) {
			await fetchReminders()
			return { success: true, id: res.data?.id }
		}
		return { success: false }
	} catch (err) {
		console.error('创建用药提醒失败:', err)
		return { success: false, error: err }
	}
}

/**
 * 更新提醒
 */
export async function updateReminder(id, data) {
	try {
		const res = await medicationApi.updateReminder(id, data)
		if (res.code === 200) {
			await fetchReminders()
			return { success: true }
		}
		return { success: false }
	} catch (err) {
		console.error('更新用药提醒失败:', err)
		return { success: false, error: err }
	}
}

/**
 * 删除提醒
 */
export async function deleteReminder(id) {
	try {
		const res = await medicationApi.deleteReminder(id)
		if (res.code === 200) {
			medicationState.reminders = medicationState.reminders.filter(r => r.id !== id)
			updateTodayStats()
			return { success: true }
		}
		return { success: false }
	} catch (err) {
		console.error('删除用药提醒失败:', err)
		return { success: false, error: err }
	}
}

/**
 * 标记完成
 */
export async function markAsCompleted(id) {
	try {
		const res = await medicationApi.markAsCompleted(id)
		if (res.code === 200) {
			const index = medicationState.reminders.findIndex(r => r.id === id)
			if (index !== -1) {
				// 创建新对象触发响应式更新
				medicationState.reminders[index] = { ...medicationState.reminders[index], status: 'READ' }
				updateTodayStats()
			}
			return { success: true }
		}
		return { success: false }
	} catch (err) {
		console.error('标记完成失败:', err)
		return { success: false, error: err }
	}
}

/**
 * 取消完成
 */
export async function unmarkCompleted(id) {
	try {
		const res = await medicationApi.unmarkCompleted(id)
		if (res.code === 200) {
			const index = medicationState.reminders.findIndex(r => r.id === id)
			if (index !== -1) {
				// 创建新对象触发响应式更新
				medicationState.reminders[index] = { ...medicationState.reminders[index], status: 'SCHEDULED' }
				updateTodayStats()
			}
			return { success: true }
		}
		return { success: false }
	} catch (err) {
		console.error('取消完成失败:', err)
		return { success: false, error: err }
	}
}

/**
 * 切换提醒开关
 */
export async function toggleReminder(id, enabled) {
	try {
		const res = await medicationApi.toggleReminder(id, enabled)
		if (res.code === 200) {
			const reminder = medicationState.reminders.find(r => r.id === id)
			if (reminder) {
				reminder.enabled = enabled
				updateTodayStats()
			}
			return { success: true }
		}
		return { success: false }
	} catch (err) {
		console.error('切换提醒开关失败:', err)
		return { success: false, error: err }
	}
}

/**
 * 设置当前编辑的提醒
 */
export function setEditingReminder(reminder) {
	medicationState.editingReminder = reminder ? { ...reminder } : null
}

/**
 * 清除编辑状态
 */
export function clearEditingReminder() {
	medicationState.editingReminder = null
}

/**
 * 与通知系统同步
 * 当收到用药提醒类型的通知时更新状态
 */
export function syncWithNotification(notification) {
	if (notification.reminderType === 'MEDICATION') {
		// 刷新列表以获取最新状态
		fetchReminders()
	}
}

/**
 * 格式化时间显示
 */
export function formatTime(scheduledTime) {
	if (!scheduledTime) return ''
	return scheduledTime.substring(11, 16) // HH:mm
}

/**
 * 获取下一个提醒的倒计时文本
 */
export function getNextReminderCountdown() {
	const next = medicationState.todayStats.nextReminder
	if (!next) return null

	const now = new Date()
	const scheduled = new Date(next.scheduledTime)
	const diff = scheduled - now

	if (diff <= 0) return '即刻'

	const hours = Math.floor(diff / (1000 * 60 * 60))
	const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

	if (hours > 0) {
		return `${hours}小时${minutes}分钟`
	}
	return `${minutes}分钟`
}

export default {
	medicationState,
	getMedicationState,
	getCompletionRate,
	getGroupedReminders,
	fetchReminders,
	createReminder,
	updateReminder,
	deleteReminder,
	markAsCompleted,
	unmarkCompleted,
	toggleReminder,
	setEditingReminder,
	clearEditingReminder,
	syncWithNotification,
	formatTime,
	getNextReminderCountdown
}
