/**
 * 通知API模块
 * 处理通知相关的HTTP请求和小程序订阅消息
 */
import { get, post } from './request.js'

/**
 * 获取未读通知（按类型分组）
 * @returns {Promise} { system: [], reserve: [], medication: [] }
 */
export function getUnreadNotifications() {
	return get('/api/app/base/get-unread-notification')
}

/**
 * 获取已读通知（分页）
 * @param {string} reminderType - 通知类型：SYSTEM / RESERVE / MEDICATION
 * @param {number} pageNum - 页码，默认1
 * @param {number} pageSize - 每页数量，默认10
 * @returns {Promise}
 */
export function getReadNotifications(reminderType, pageNum = 1, pageSize = 10) {
	return get('/api/app/base/get-read-notification', {
		reminderType,
		pageNum,
		pageSize
	})
}

/**
 * 标记单条通知为已读
 * @param {string} reminderId - 通知ID
 * @returns {Promise}
 */
export function markAsRead(reminderId) {
	return post('/api/app/base/mark-notification-as-read', null, {
		url: `/api/app/base/mark-notification-as-read?reminderId=${reminderId}`
	})
}

/**
 * 标记全部通知为已读
 * @returns {Promise}
 */
export function markAllAsRead() {
	return post('/api/app/base/mark-all-notification-as-read')
}

/**
 * 请求小程序订阅消息权限
 * @param {Array<string>} tmplIds - 模板ID数组
 * @returns {Promise}
 */
export function requestSubscribeMessage(tmplIds) {
	return new Promise((resolve, reject) => {
		// #ifdef MP-WEIXIN
		uni.requestSubscribeMessage({
			tmplIds: tmplIds,
			success: (res) => {
				console.log('订阅消息结果:', res)
				resolve(res)
			},
			fail: (err) => {
				console.error('订阅消息失败:', err)
				reject(err)
			}
		})
		// #endif

		// #ifndef MP-WEIXIN
		// 非微信小程序环境，直接返回成功
		resolve({ errMsg: 'requestSubscribeMessage:ok' })
		// #endif
	})
}

/**
 * 预约提醒订阅模板ID（需要在微信公众平台配置）
 */
export const SUBSCRIBE_TEMPLATE_IDS = {
	// 预约提醒
	RESERVE: '',
	// 用药提醒
	MEDICATION: '',
	// 系统通知
	SYSTEM: ''
}

export default {
	getUnreadNotifications,
	getReadNotifications,
	markAsRead,
	markAllAsRead,
	requestSubscribeMessage,
	SUBSCRIBE_TEMPLATE_IDS
}
