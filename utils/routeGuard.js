/**
 * 路由守卫 - 全局页面跳转拦截
 * 功能：在页面跳转前检查登录状态，未登录则跳转到登录页
 */

import config from '@/utils/config.js'

// 白名单：不需要登录验证的页面
const whiteList = [
	'/pages/login/login',
	'/pages/login/register',
	'/pages/settings/privacy-policy',
	'/pages/settings/user-agreement',
	'/pages/settings/about',
	'/pages/settings/help-center'
]

/**
 * 检查是否为白名单页面
 * @param {string} url - 页面路径
 * @returns {boolean}
 */
function isWhiteList(url) {
	// 去除查询参数
	const path = url.split('?')[0]
	return whiteList.some(item => path === item || path.includes(item))
}

/**
 * 检查本地token是否存在
 * @returns {boolean}
 */
function hasToken() {
	try {
		const token = uni.getStorageSync(config.storageKeys.token)
		return !!token
	} catch (e) {
		console.error('读取token失败:', e)
		return false
	}
}

/**
 * 跳转到登录页
 * @param {string} redirectUrl - 登录后要跳转的页面
 */
function redirectToLogin(redirectUrl) {
	// 记录原始URL，登录后可跳转回去（可选功能）
	let loginUrl = '/pages/login/login'
	if (redirectUrl) {
		loginUrl += `?redirect=${encodeURIComponent(redirectUrl)}`
	}
	
	uni.reLaunch({
		url: loginUrl
	})
}

/**
 * 初始化路由守卫
 * 拦截 navigateTo、redirectTo、reLaunch、switchTab 等路由方法
 */
export function initRouteGuard() {
	// 保存原始方法
	const originalNavigateTo = uni.navigateTo
	const originalRedirectTo = uni.redirectTo
	const originalReLaunch = uni.reLaunch
	const originalSwitchTab = uni.switchTab

	// 拦截 navigateTo
	uni.addInterceptor('navigateTo', {
		invoke(args) {
			const url = args.url
			
			// 白名单页面直接放行
			if (isWhiteList(url)) {
				return true
			}
			
			// 检查token
			if (!hasToken()) {
				console.log('路由守卫：未登录，拦截跳转到', url)
				redirectToLogin(url)
				return false
			}
			
			return true
		},
		fail(err) {
			console.error('navigateTo失败:', err)
		}
	})

	// 拦截 redirectTo
	uni.addInterceptor('redirectTo', {
		invoke(args) {
			const url = args.url
			
			// 白名单页面直接放行
			if (isWhiteList(url)) {
				return true
			}
			
			// 检查token
			if (!hasToken()) {
				console.log('路由守卫：未登录，拦截跳转到', url)
				redirectToLogin(url)
				return false
			}
			
			return true
		},
		fail(err) {
			console.error('redirectTo失败:', err)
		}
	})

	// 拦截 reLaunch
	uni.addInterceptor('reLaunch', {
		invoke(args) {
			const url = args.url
			
			// 白名单页面直接放行
			if (isWhiteList(url)) {
				return true
			}
			
			// 检查token
			if (!hasToken()) {
				console.log('路由守卫：未登录，拦截跳转到', url)
				// reLaunch 不记录 redirect，直接跳转登录页
				args.url = '/pages/login/login'
			}
			
			return true
		},
		fail(err) {
			console.error('reLaunch失败:', err)
		}
	})

	// 拦截 switchTab
	uni.addInterceptor('switchTab', {
		invoke(args) {
			const url = args.url
			
			// 白名单页面直接放行
			if (isWhiteList(url)) {
				return true
			}
			
			// 检查token
			if (!hasToken()) {
				console.log('路由守卫：未登录，拦截跳转到', url)
				// switchTab 跳转到登录页需要用 reLaunch
				uni.reLaunch({
					url: '/pages/login/login'
				})
				return false
			}
			
			return true
		},
		fail(err) {
			console.error('switchTab失败:', err)
		}
	})

	console.log('路由守卫已初始化')
}

/**
 * 移除路由守卫（用于调试）
 */
export function removeRouteGuard() {
	uni.removeInterceptor('navigateTo')
	uni.removeInterceptor('redirectTo')
	uni.removeInterceptor('reLaunch')
	uni.removeInterceptor('switchTab')
	console.log('路由守卫已移除')
}
