/**
 * 请求麦克风运行时权限（Android 使用 5+ API，iOS 由系统自动处理）
 * @returns {Promise<boolean>} 是否获得权限
 */
export function requestMicrophonePermission() {
	return new Promise((resolve) => {
		// #ifdef APP-PLUS
		if (plus.os.name === 'Android') {
			plus.android.requestPermissions(
				['android.permission.RECORD_AUDIO'],
				(result) => {
					if (result.deniedAlways && result.deniedAlways.length > 0) {
						uni.showModal({
							title: '需要麦克风权限',
							content: '语音功能需要麦克风权限，请前往系统设置中手动开启。',
							confirmText: '去设置',
							cancelText: '取消',
							success: (res) => {
								if (res.confirm) {
									plus.runtime.openURL('app-settings:')
								}
							}
						})
						resolve(false)
					} else if (result.denied && result.denied.length > 0) {
						uni.showToast({ title: '麦克风权限被拒绝', icon: 'none' })
						resolve(false)
					} else {
						resolve(true)
					}
				},
				(err) => {
					console.error('[Permission] requestPermissions error:', err)
					resolve(false)
				}
			)
		} else {
			// iOS: WKWebView 会在 getUserMedia 时自动弹系统权限对话框
			resolve(true)
		}
		// #endif

		// #ifndef APP-PLUS
		resolve(true)
		// #endif
	})
}
