/**
 * 版本检查工具
 * 版本比较、更新检查、APK下载安装
 */
import { getAppVersion } from './api/user.js'
import config from './config.js'

/**
 * 比较两个版本号
 * @param {string} v1 - 版本号1 (如 "1.0.1")
 * @param {string} v2 - 版本号2 (如 "1.0.0")
 * @returns {number} -1: v1<v2, 0: v1==v2, 1: v1>v2
 */
export function compareVersion(v1, v2) {
	const parts1 = v1.split('.').map(Number)
	const parts2 = v2.split('.').map(Number)
	const len = Math.max(parts1.length, parts2.length)

	for (let i = 0; i < len; i++) {
		const num1 = parts1[i] || 0
		const num2 = parts2[i] || 0
		if (num1 > num2) return 1
		if (num1 < num2) return -1
	}
	return 0
}

/**
 * 获取当前App版本号
 * @returns {string}
 */
export function getCurrentVersion() {
	try {
		const sysInfo = uni.getSystemInfoSync()
		if (sysInfo.appVersion) {
			return sysInfo.appVersion
		}
	} catch (e) {
		console.log('获取本地版本号失败', e)
	}
	// 兜底版本号，与 manifest.json 保持一致
	return '1.0.1'
}

/**
 * 检查是否有更新
 * @returns {Promise<object>} { type: 'force'|'optional'|'none', version, description, updateUrl, forceUpdate }
 */
export async function checkForUpdate() {
	const remoteData = await getAppVersion()
	const localVersion = getCurrentVersion()

	const { latestVersion, minVersion, updateUrl, updateDescription, forceUpdate } = remoteData

	// 低于最低支持版本 → 强制更新
	if (compareVersion(localVersion, minVersion) < 0) {
		return {
			type: 'force',
			version: latestVersion,
			description: updateDescription,
			updateUrl,
			forceUpdate: true
		}
	}

	// 低于最新版本
	if (compareVersion(localVersion, latestVersion) < 0) {
		return {
			type: forceUpdate ? 'force' : 'optional',
			version: latestVersion,
			description: updateDescription,
			updateUrl,
			forceUpdate
		}
	}

	// 已是最新
	return { type: 'none' }
}

/**
 * 检查用户是否已跳过该版本的更新
 * @param {string} version - 版本号
 * @returns {boolean}
 */
export function isUpdateDismissed(version) {
	const dismissed = uni.getStorageSync(config.storageKeys.dismissedUpdateVersion)
	return dismissed === version
}

/**
 * 记录用户跳过的版本
 * @param {string} version - 版本号
 */
export function dismissUpdate(version) {
	uni.setStorageSync(config.storageKeys.dismissedUpdateVersion, version)
}

// #ifdef APP-PLUS
/**
 * 安装APK
 * @param {string} filePath - APK本地文件路径
 */
export function installApk(filePath) {
	plus.runtime.install(filePath, {
		force: true
	}, () => {
		console.log('安装成功')
		plus.runtime.restart()
	}, (err) => {
		console.error('安装失败:', err)
		uni.showToast({
			title: '安装失败，请重试',
			icon: 'none'
		})
	})
}

/**
 * 下载并安装APK
 * @param {string} url - 下载地址
 * @param {Function} onProgress - 进度回调 (progress: number 0-100)
 * @returns {Promise<void>}
 */
export function downloadAndInstall(url, onProgress) {
	return new Promise((resolve, reject) => {
		const task = plus.downloader.createDownload(url, {
			filename: '_downloads/update.apk'
		}, (download, status) => {
			if (status === 200) {
				const filePath = download.filename
				installApk(filePath)
				resolve()
			} else {
				reject(new Error(`下载失败，状态码: ${status}`))
			}
		})

		task.addEventListener('statechanged', (download) => {
			if (download.downloadedSize > 0 && download.totalSize > 0) {
				const progress = Math.round((download.downloadedSize / download.totalSize) * 100)
				if (onProgress) {
					onProgress(progress)
				}
			}
		})

		task.start()
	})
}
// #endif
