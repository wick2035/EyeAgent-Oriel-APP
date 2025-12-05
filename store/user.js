/**
 * 用户状态管理
 * AI医问通 - 用户认证与信息存储
 */

import { reactive } from 'vue'
import config from '@/utils/config.js'
import { disconnect as disconnectWebSocket } from '@/utils/websocket.js'
import { clearNotificationState } from '@/store/notification.js'

// 用户状态
const userState = reactive({
	isLoggedIn: false,
	token: '',
	userInfo: {
		id: '',
		name: '',
		avatar: '',
		phone: '',
		openid: ''
	}
})

/**
 * 初始化用户状态（从本地存储恢复）
 */
export function initUserState() {
	try {
		const token = uni.getStorageSync(config.storageKeys.token)
		const userInfo = uni.getStorageSync(config.storageKeys.userInfo)

		if (token) {
			userState.token = token
			userState.isLoggedIn = true

			if (userInfo) {
				Object.assign(userState.userInfo, JSON.parse(userInfo))
			}
		}
	} catch (e) {
		console.error('初始化用户状态失败:', e)
	}
}

/**
 * 设置登录状态
 * @param {string} token - 认证令牌
 * @param {object} userInfo - 用户信息
 */
export function setLoginState(token, userInfo) {
	userState.token = token
	userState.isLoggedIn = true
	Object.assign(userState.userInfo, userInfo)

	// 持久化存储
	try {
		uni.setStorageSync(config.storageKeys.token, token)
		uni.setStorageSync(config.storageKeys.userInfo, JSON.stringify(userInfo))

		// 同步设置 patientId
		if (userInfo.id) {
			uni.setStorageSync(config.storageKeys.patientId, userInfo.id)
		}
	} catch (e) {
		console.error('存储用户信息失败:', e)
	}
}

/**
 * 清除登录状态（登出）
 */
export function clearLoginState() {
	// 断开WebSocket连接
	disconnectWebSocket()

	// 清除通知状态
	clearNotificationState()

	userState.token = ''
	userState.isLoggedIn = false
	userState.userInfo = {
		id: '',
		name: '',
		avatar: '',
		phone: '',
		openid: ''
	}

	// 清除本地存储
	try {
		uni.removeStorageSync(config.storageKeys.token)
		uni.removeStorageSync(config.storageKeys.userInfo)
		uni.removeStorageSync(config.storageKeys.patientId)
		uni.removeStorageSync(config.storageKeys.sessionId)
	} catch (e) {
		console.error('清除用户信息失败:', e)
	}
}

/**
 * 检查是否已登录
 * @returns {boolean}
 */
export function isLoggedIn() {
	return userState.isLoggedIn
}

/**
 * 获取当前用户信息
 * @returns {object}
 */
export function getUserInfo() {
	return userState.userInfo
}

/**
 * 获取当前Token
 * @returns {string}
 */
export function getToken() {
	return userState.token
}

/**
 * 更新用户信息
 * @param {object} info - 要更新的用户信息字段
 */
export function updateUserInfo(info) {
	Object.assign(userState.userInfo, info)

	try {
		uni.setStorageSync(config.storageKeys.userInfo, JSON.stringify(userState.userInfo))
	} catch (e) {
		console.error('更新用户信息失败:', e)
	}
}

// 导出状态供组件使用
export { userState }
