/**
 * 主题状态管理
 * 支持浅色/深色模式切换
 */
import { reactive } from 'vue'
import config from '../utils/config.js'

// 主题类型
export const THEME_LIGHT = 'light'
export const THEME_DARK = 'dark'
export const THEME_SYSTEM = 'system'

// 主题状态
export const themeState = reactive({
	// 用户设置的主题（light/dark/system）
	setting: THEME_LIGHT,
	// 实际应用的主题（light/dark）
	current: THEME_LIGHT,
	// 气泡主题（colorful/simple）
	bubbleTheme: 'colorful'
})

/**
 * 获取系统主题
 */
export function getSystemTheme() {
	try {
		const res = uni.getSystemInfoSync()
		return res.theme || THEME_LIGHT
	} catch (e) {
		return THEME_LIGHT
	}
}

/**
 * 初始化气泡主题
 */
export function initBubbleTheme() {
	const saved = uni.getStorageSync(config.storageKeys.bubbleTheme)
	if (saved === 'simple' || saved === 'colorful') {
		themeState.bubbleTheme = saved
	}
}

/**
 * 设置气泡主题
 * @param {string} theme - 'colorful' | 'simple'
 */
export function setBubbleTheme(theme) {
	themeState.bubbleTheme = theme
	uni.setStorageSync(config.storageKeys.bubbleTheme, theme)
}

/**
 * 获取当前气泡主题
 */
export function getBubbleTheme() {
	return themeState.bubbleTheme
}

/**
 * 初始化主题
 */
export function initTheme() {
	// 读取存储的主题设置
	const savedTheme = uni.getStorageSync(config.storageKeys.theme)
	if (savedTheme) {
		themeState.setting = savedTheme
	}

	// 应用主题
	applyTheme()

	// 初始化气泡主题
	initBubbleTheme()

	// 监听系统主题变化
	uni.onThemeChange && uni.onThemeChange((res) => {
		if (themeState.setting === THEME_SYSTEM) {
			themeState.current = res.theme
			updateStatusBar()
		}
	})
}

/**
 * 应用主题
 */
export function applyTheme() {
	if (themeState.setting === THEME_SYSTEM) {
		themeState.current = getSystemTheme()
	} else {
		themeState.current = themeState.setting
	}
	updateStatusBar()
}

/**
 * 切换主题
 * @param {string} theme - 主题类型
 */
export function setTheme(theme) {
	themeState.setting = theme
	uni.setStorageSync(config.storageKeys.theme, theme)
	applyTheme()
}

/**
 * 更新状态栏样式
 */
export function updateStatusBar() {
	const isDark = themeState.current === THEME_DARK

	// #ifdef APP-PLUS
	plus.navigator.setStatusBarStyle(isDark ? 'light' : 'dark')
	// #endif

	// #ifdef H5
	// H5环境下可通过meta标签控制
	// #endif
}

/**
 * 判断当前是否深色模式
 */
export function isDarkMode() {
	return themeState.current === THEME_DARK
}

export default {
	themeState,
	THEME_LIGHT,
	THEME_DARK,
	THEME_SYSTEM,
	initTheme,
	setTheme,
	isDarkMode,
	getSystemTheme,
	initBubbleTheme,
	setBubbleTheme,
	getBubbleTheme
}
