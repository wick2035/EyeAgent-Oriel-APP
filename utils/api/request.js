/**
 * 请求封装 - 统一处理请求拦截、响应拦截、错误处理
 */
import config from '../config.js'

// 生成唯一会话ID
export function generateSessionId() {
	return 'sess-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

// 获取存储的会话ID，没有则创建
export function getSessionId() {
	let sessionId = uni.getStorageSync(config.storageKeys.sessionId)
	if (!sessionId) {
		sessionId = generateSessionId()
		uni.setStorageSync(config.storageKeys.sessionId, sessionId)
	}
	return sessionId
}

// 获取患者ID
export function getPatientId() {
	return uni.getStorageSync(config.storageKeys.patientId) || null
}

// 设置患者ID
export function setPatientId(id) {
	uni.setStorageSync(config.storageKeys.patientId, id)
}

/**
 * 统一请求方法
 * @param {Object} options 请求配置
 * @returns {Promise}
 */
export function request(options) {
	return new Promise((resolve, reject) => {
		// 获取token
		const token = uni.getStorageSync(config.storageKeys.token)

		// 合并请求头
		const header = {
			...config.headers,
			...options.header
		}

		// 添加认证头 (Sa-Token)
		if (token) {
			header['satoken'] = token
		}

		// 发起请求
		uni.request({
			url: options.url.startsWith('http') ? options.url : config.baseUrl + options.url,
			method: options.method || 'GET',
			data: options.data,
			header,
			timeout: options.timeout || config.timeout,
			success: (res) => {
				const { statusCode, data } = res

				// 请求成功
				if (statusCode >= 200 && statusCode < 300) {
					resolve(data)
				}
				// 未授权
				else if (statusCode === 401) {
					uni.removeStorageSync(config.storageKeys.token)
					uni.showToast({
						title: '登录已过期，请重新登录',
						icon: 'none'
					})
					reject({ code: 401, message: '未授权' })
				}
				// 其他错误
				else {
					const errorMsg = data?.message || `请求失败 (${statusCode})`
					uni.showToast({
						title: errorMsg,
						icon: 'none'
					})
					reject({ code: statusCode, message: errorMsg, data })
				}
			},
			fail: (err) => {
				console.error('请求失败:', err)
				uni.showToast({
					title: '网络连接失败，请检查网络',
					icon: 'none'
				})
				reject({ code: -1, message: '网络错误', error: err })
			}
		})
	})
}

/**
 * GET请求
 */
export function get(url, params = {}, options = {}) {
	return request({
		url,
		method: 'GET',
		data: params,
		...options
	})
}

/**
 * POST请求
 */
export function post(url, data = {}, options = {}) {
	return request({
		url,
		method: 'POST',
		data,
		...options
	})
}

/**
 * PUT请求
 */
export function put(url, data = {}, options = {}) {
	return request({
		url,
		method: 'PUT',
		data,
		...options
	})
}

/**
 * DELETE请求
 */
export function del(url, data = {}, options = {}) {
	return request({
		url,
		method: 'DELETE',
		data,
		...options
	})
}

export default {
	request,
	get,
	post,
	put,
	del,
	getSessionId,
	getPatientId,
	setPatientId,
	generateSessionId
}
