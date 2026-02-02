/**
 * 健康资讯状态管理
 * 管理收藏列表、阅读历史等数据
 */

import config from '@/utils/config.js'

const STORAGE_KEYS = {
	FAVORITES: 'news_favorites', // 收藏列表
	HISTORY: 'news_history', // 阅读历史
	CACHE: 'news_cache' // 数据缓存
}

// 收藏列表（存储新闻ID）
let favorites = []

// 阅读历史（存储新闻ID和时间）
let history = []

/**
 * 初始化数据（从本地存储加载）
 */
function initData() {
	try {
		// 加载收藏列表
		const favoritesData = uni.getStorageSync(STORAGE_KEYS.FAVORITES)
		if (favoritesData) {
			favorites = JSON.parse(favoritesData)
		}
		
		// 加载阅读历史
		const historyData = uni.getStorageSync(STORAGE_KEYS.HISTORY)
		if (historyData) {
			history = JSON.parse(historyData)
		}
	} catch (error) {
		console.error('加载新闻数据失败:', error)
	}
}

/**
 * 保存收藏列表到本地存储
 */
function saveFavorites() {
	try {
		uni.setStorageSync(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites))
	} catch (error) {
		console.error('保存收藏列表失败:', error)
	}
}

/**
 * 保存阅读历史到本地存储
 */
function saveHistory() {
	try {
		uni.setStorageSync(STORAGE_KEYS.HISTORY, JSON.stringify(history))
	} catch (error) {
		console.error('保存阅读历史失败:', error)
	}
}

/**
 * 检查是否已收藏
 * @param {Number} newsId - 新闻ID
 * @returns {Boolean}
 */
export function isFavorite(newsId) {
	if (!favorites.length) {
		initData()
	}
	return favorites.includes(newsId)
}

/**
 * 添加收藏
 * @param {Number} newsId - 新闻ID
 * @returns {Boolean} 操作是否成功
 */
export function addFavorite(newsId) {
	if (!favorites.length) {
		initData()
	}
	
	if (!favorites.includes(newsId)) {
		favorites.unshift(newsId) // 添加到开头
		saveFavorites()
		return true
	}
	return false
}

/**
 * 取消收藏
 * @param {Number} newsId - 新闻ID
 * @returns {Boolean} 操作是否成功
 */
export function removeFavorite(newsId) {
	if (!favorites.length) {
		initData()
	}
	
	const index = favorites.indexOf(newsId)
	if (index > -1) {
		favorites.splice(index, 1)
		saveFavorites()
		return true
	}
	return false
}

/**
 * 切换收藏状态
 * @param {Number} newsId - 新闻ID
 * @returns {Boolean} 当前收藏状态
 */
export function toggleFavorite(newsId) {
	if (!favorites.length) {
		initData()
	}
	
	if (favorites.includes(newsId)) {
		removeFavorite(newsId)
		return false
	} else {
		addFavorite(newsId)
		return true
	}
}

/**
 * 获取收藏列表
 * @returns {Array} 收藏的新闻ID列表
 */
export function getFavorites() {
	if (!favorites.length) {
		initData()
	}
	return [...favorites]
}

/**
 * 获取收藏数量
 * @returns {Number}
 */
export function getFavoriteCount() {
	if (!favorites.length) {
		initData()
	}
	return favorites.length
}

/**
 * 清空收藏列表
 */
export function clearFavorites() {
	favorites = []
	saveFavorites()
}

/**
 * 添加阅读历史
 * @param {Number} newsId - 新闻ID
 * @param {String} title - 新闻标题（可选）
 */
export function addHistory(newsId, title = '') {
	if (!history.length) {
		initData()
	}
	
	// 移除旧记录（如果存在）
	const index = history.findIndex(item => item.id === newsId)
	if (index > -1) {
		history.splice(index, 1)
	}
	
	// 添加新记录到开头
	history.unshift({
		id: newsId,
		title,
		time: Date.now()
	})
	
	// 限制历史记录数量（最多保存100条）
	if (history.length > 100) {
		history = history.slice(0, 100)
	}
	
	saveHistory()
}

/**
 * 获取阅读历史
 * @param {Number} limit - 返回数量限制（可选）
 * @returns {Array} 阅读历史列表
 */
export function getHistory(limit = 0) {
	if (!history.length) {
		initData()
	}
	
	if (limit > 0) {
		return history.slice(0, limit)
	}
	return [...history]
}

/**
 * 清空阅读历史
 */
export function clearHistory() {
	history = []
	saveHistory()
}

/**
 * 删除单条阅读历史
 * @param {Number} newsId - 新闻ID
 */
export function removeHistory(newsId) {
	if (!history.length) {
		initData()
	}
	
	const index = history.findIndex(item => item.id === newsId)
	if (index > -1) {
		history.splice(index, 1)
		saveHistory()
	}
}

/**
 * 缓存新闻数据
 * @param {String} key - 缓存键名
 * @param {Any} data - 要缓存的数据
 * @param {Number} expire - 过期时间（毫秒），默认5分钟
 */
export function setCacheData(key, data, expire = 5 * 60 * 1000) {
	try {
		const cacheData = {
			data,
			time: Date.now(),
			expire
		}
		uni.setStorageSync(`${STORAGE_KEYS.CACHE}_${key}`, JSON.stringify(cacheData))
	} catch (error) {
		console.error('缓存数据失败:', error)
	}
}

/**
 * 获取缓存数据
 * @param {String} key - 缓存键名
 * @returns {Any} 缓存的数据，如果过期或不存在则返回null
 */
export function getCacheData(key) {
	try {
		const cacheStr = uni.getStorageSync(`${STORAGE_KEYS.CACHE}_${key}`)
		if (!cacheStr) {
			return null
		}
		
		const cache = JSON.parse(cacheStr)
		const now = Date.now()
		
		// 检查是否过期
		if (now - cache.time > cache.expire) {
			// 删除过期缓存
			uni.removeStorageSync(`${STORAGE_KEYS.CACHE}_${key}`)
			return null
		}
		
		return cache.data
	} catch (error) {
		console.error('获取缓存数据失败:', error)
		return null
	}
}

/**
 * 清除指定缓存
 * @param {String} key - 缓存键名
 */
export function clearCacheData(key) {
	try {
		uni.removeStorageSync(`${STORAGE_KEYS.CACHE}_${key}`)
	} catch (error) {
		console.error('清除缓存失败:', error)
	}
}

/**
 * 清除所有新闻缓存
 */
export function clearAllCache() {
	try {
		const keys = uni.getStorageInfoSync().keys
		keys.forEach(key => {
			if (key.startsWith(STORAGE_KEYS.CACHE)) {
				uni.removeStorageSync(key)
			}
		})
	} catch (error) {
		console.error('清除所有缓存失败:', error)
	}
}

// 自动初始化
initData()

// 导出默认对象（兼容旧的使用方式）
export default {
	isFavorite,
	addFavorite,
	removeFavorite,
	toggleFavorite,
	getFavorites,
	getFavoriteCount,
	clearFavorites,
	addHistory,
	getHistory,
	clearHistory,
	removeHistory,
	setCacheData,
	getCacheData,
	clearCacheData,
	clearAllCache
}
