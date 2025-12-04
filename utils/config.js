/**
 * API配置文件
 */

// API基础地址 - 根据环境切换
const ENV = {
	development: {
		baseUrl: 'http://1.117.233.43:8081'
	},
	production: {
		baseUrl: 'http://1.117.233.43:8081'
	}
}

// 当前环境
const currentEnv = process.env.NODE_ENV || 'development'

export default {
	// API基础地址
	baseUrl: ENV[currentEnv]?.baseUrl || ENV.development.baseUrl,

	// 请求超时时间(ms)
	timeout: 30000,

	// 默认请求头
	headers: {
		'Content-Type': 'application/json'
	},

	// 存储键名
	storageKeys: {
		token: 'satoken',
		userInfo: 'user_info',
		patientId: 'patient_id',
		sessionId: 'session_id',
		theme: 'app_theme'
	}
}
