/**
 * 用户认证 API
 * AI医问通 - 登录/注册/用户信息接口
 */

import { post, get, put } from './request.js'
import { setLoginState, clearLoginState } from '@/store/user.js'

// 测试模式开关（设为 true 时，任意账号密码都可登录）
const MOCK_MODE = false

/**
 * 生成模拟Token
 */
function generateMockToken() {
	return `mock_token_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
}

/**
 * 模拟用户数据
 */
const mockUser = {
	id: 'test_user_001',
	name: '测试用户',
	avatar: '',
	phone: '138****8888'
}

/**
 * 账号密码登录
 * @param {string} username - 用户名/手机号
 * @param {string} password - 密码
 * @returns {Promise<object>}
 */
export async function login(username, password) {
	// 测试模式：任意非空输入即可登录
	if (MOCK_MODE) {
		return new Promise((resolve) => {
			setTimeout(() => {
				const token = generateMockToken()
				const user = { ...mockUser, name: username || '测试用户' }

				// 自动设置登录状态
				setLoginState(token, user)

				resolve({
					success: true,
					token,
					user
				})
			}, 800) // 模拟网络延迟
		})
	}

	// 正式模式：调用后端接口
	try {
		const response = await post('/api/app/base/login', {
			phone: username,
			password
		})

		// 适配后端响应格式: { code, msg, data: { token, patientId, patientName, phone } }
		if (response.code === 200 && response.data) {
			const { token, patientId, patientName, phone } = response.data
			const user = {
				id: patientId,
				name: patientName,
				phone: phone
			}
			setLoginState(token, user)
			return {
				success: true,
				token,
				user
			}
		}

		return {
			success: false,
			message: '账号或密码错误'
		}
	} catch (error) {
		return {
			success: false,
			message: error.message || '登录失败，请稍后重试'
		}
	}
}

/**
 * 微信登录
 * @param {string} code - 微信授权code
 * @returns {Promise<object>}
 */
export async function wxLogin(code) {
	// 测试模式
	if (MOCK_MODE) {
		return new Promise((resolve) => {
			setTimeout(() => {
				const token = generateMockToken()
				const user = {
					...mockUser,
					name: '微信用户',
					openid: 'mock_openid_' + Date.now()
				}

				setLoginState(token, user)

				resolve({
					success: true,
					token,
					user
				})
			}, 1000)
		})
	}

	// 正式模式
	try {
		const response = await post('/api/auth/wx-login', { code })

		if (response.token && response.user) {
			setLoginState(response.token, response.user)
		}

		return {
			success: true,
			...response
		}
	} catch (error) {
		return {
			success: false,
			message: error.message || '微信登录失败'
		}
	}
}

/**
 * 获取微信登录code
 * @returns {Promise<string>}
 */
export function getWxLoginCode() {
	return new Promise((resolve, reject) => {
		// #ifdef MP-WEIXIN
		uni.login({
			provider: 'weixin',
			success: (res) => {
				if (res.code) {
					resolve(res.code)
				} else {
					reject(new Error('获取微信授权码失败'))
				}
			},
			fail: (err) => {
				reject(new Error(err.errMsg || '微信登录失败'))
			}
		})
		// #endif

		// #ifndef MP-WEIXIN
		// 非微信小程序环境，使用模拟code
		if (MOCK_MODE) {
			resolve('mock_wx_code_' + Date.now())
		} else {
			reject(new Error('当前环境不支持微信登录'))
		}
		// #endif
	})
}

/**
 * 获取用户信息
 * @returns {Promise<object>}
 */
export async function fetchUserInfo() {
	if (MOCK_MODE) {
		return Promise.resolve({
			success: true,
			user: mockUser
		})
	}

	try {
		const response = await get('/api/user/info')
		return {
			success: true,
			user: response
		}
	} catch (error) {
		return {
			success: false,
			message: error.message || '获取用户信息失败'
		}
	}
}

/**
 * 登出
 * @returns {Promise<object>}
 */
export async function logout() {
	if (MOCK_MODE) {
		clearLoginState()
		return Promise.resolve({ success: true })
	}

	try {
		await post('/api/app/base/logout')
		clearLoginState()
		return { success: true }
	} catch (error) {
		// 即使接口失败，也清除本地状态
		clearLoginState()
		return { success: true }
	}
}

/**
 * 检查Token有效性
 * @returns {Promise<boolean>}
 */
export async function checkTokenValid() {
	if (MOCK_MODE) {
		return Promise.resolve(true)
	}

	try {
		await get('/api/auth/check')
		return true
	} catch (error) {
		if (error.code === 401) {
			clearLoginState()
		}
		return false
	}
}

/**
 * 更新用户资料
 * @param {object} data - 用户资料 { name, avatar, gender, birthday }
 * @returns {Promise<object>}
 */
export async function updateProfile(data) {
	if (MOCK_MODE) {
		return new Promise((resolve) => {
			setTimeout(() => {
				resolve({
					success: true,
					user: { ...mockUser, ...data }
				})
			}, 500)
		})
	}

	try {
		const response = await put('/api/user/profile', data)
		return {
			success: true,
			user: response
		}
	} catch (error) {
		return {
			success: false,
			message: error.message || '更新失败'
		}
	}
}

/**
 * 修改密码
 * @param {string} oldPassword - 旧密码
 * @param {string} newPassword - 新密码
 * @returns {Promise<object>}
 */
export async function changePassword(oldPassword, newPassword) {
	if (MOCK_MODE) {
		return new Promise((resolve) => {
			setTimeout(() => {
				resolve({ success: true })
			}, 500)
		})
	}

	try {
		const response = await post('/api/app/base/change-password', { oldPassword, newPassword })
		if (response.code === 200) {
			return { success: true }
		}
		return {
			success: false,
			message: response.msg || '修改密码失败'
		}
	} catch (error) {
		return {
			success: false,
			message: error.message || '修改密码失败'
		}
	}
}

/**
 * 发送短信验证码
 * @param {string} phone - 手机号
 * @returns {Promise<object>}
 */
export async function sendSms(phone) {
	if (MOCK_MODE) {
		return new Promise((resolve) => {
			setTimeout(() => {
				resolve({ success: true })
			}, 500)
		})
	}

	try {
		const response = await post('/patient/sendSms', { phone })
		if (response.code === 200) {
			return { success: true }
		}
		return {
			success: false,
			message: response.msg || '发送失败'
		}
	} catch (error) {
		return {
			success: false,
			message: error.message || '发送失败'
		}
	}
}

/**
 * 发送邮箱验证码
 * @param {string} email - 邮箱地址
 * @returns {Promise<object>}
 */
export async function sendEmailCode(email) {
	if (MOCK_MODE) {
		return new Promise((resolve) => {
			setTimeout(() => {
				resolve({ success: true })
			}, 500)
		})
	}

	try {
		const response = await post('/api/app/base/send-email-code', { email })
		if (response.code === 200) {
			return { success: true }
		}
		return {
			success: false,
			message: response.msg || '发送失败'
		}
	} catch (error) {
		return {
			success: false,
			message: error.message || '发送失败'
		}
	}
}

/**
 * 患者注册
 * @param {object} data - 注册信息
 * @param {string} data.patientName - 患者姓名
 * @param {string} data.gender - 性别 male/female
 * @param {number} data.age - 年龄
 * @param {string} data.phone - 手机号
 * @param {string} data.idNumber - 身份证号
 * @param {string} data.password - 密码
 * @param {string} data.email - 邮箱
 * @param {string} data.emailCode - 邮箱验证码
 * @param {string} [data.dateOfBirth] - 出生日期，ISO 8601 格式（从身份证解析）
 * @returns {Promise<object>}
 */
export async function register(data) {
	if (MOCK_MODE) {
		return new Promise((resolve) => {
			setTimeout(() => {
				const token = generateMockToken()
				const user = {
					id: 'test_patient_001',
					name: data.patientName,
					phone: data.phone
				}
				setLoginState(token, user)
				resolve({
					success: true,
					token,
					user
				})
			}, 800)
		})
	}

	try {
		const requestData = {
			patientName: data.patientName,
			gender: data.gender,
			age: data.age,
			phone: data.phone,
			idNumber: data.idNumber,
			password: data.password,
			email: data.email,
			emailCode: data.emailCode,
			dateOfBirth: data.dateOfBirth,
		}

		const response = await post('/api/app/base/register', requestData)

		if (response.code === 200 && response.data) {
			// 注册成功，自动登录
			const { token, patientId, patientName, phone } = response.data
			const user = {
				id: patientId,
				name: patientName,
				phone: phone
			}
			setLoginState(token, user)
			return {
				success: true,
				token,
				user
			}
		}

		return {
			success: false,
			message: response.msg || '注册失败'
		}
	} catch (error) {
		return {
			success: false,
			message: error.message || '注册失败，请稍后重试'
		}
	}
}

/**
 * 获取App版本信息（无需登录）
 * @returns {Promise<object>} { latestVersion, minVersion, updateUrl, updateDescription, forceUpdate }
 */
export async function getAppVersion() {
	try {
		const response = await get('/api/app/base/get-app-version')
		if (response.code === 200 && response.data) {
			return response.data
		}
		throw new Error(response.msg || '获取版本信息失败')
	} catch (error) {
		throw error
	}
}

/**
 * 上传头像
 * @param {string} filePath - 本地文件路径
 * @returns {Promise<object>}
 */
export async function uploadAvatar(filePath) {
	if (MOCK_MODE) {
		return new Promise((resolve) => {
			setTimeout(() => {
				resolve({
					success: true,
					avatar: filePath // 测试模式直接返回本地路径
				})
			}, 800)
		})
	}

	return new Promise((resolve, reject) => {
		uni.uploadFile({
			url: '/api/user/avatar',
			filePath: filePath,
			name: 'file',
			success: (res) => {
				try {
					const data = JSON.parse(res.data)
					resolve({
						success: true,
						avatar: data.avatar
					})
				} catch (e) {
					resolve({
						success: false,
						message: '上传失败'
					})
				}
			},
			fail: () => {
				resolve({
					success: false,
					message: '上传失败'
				})
			}
		})
	})
}
