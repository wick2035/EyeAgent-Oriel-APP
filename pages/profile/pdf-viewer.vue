<template>
	<view class="page" :class="{ 'page--dark': isDark }">
		<!-- 状态栏占位 -->
		<view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>

		<!-- 自定义导航栏 -->
		<view class="navbar">
			<view class="navbar__left" @click="goBack">
				<view class="navbar__back"></view>
			</view>
			<view class="navbar__title">
				<text class="navbar__title-text">{{ title }}</text>
				<text v-if="docType" class="navbar__subtitle">{{ docTypeLabel }}</text>
			</view>
			<view class="navbar__right">
				<view class="navbar__action" @click="handleShare">
					<view class="share-icon"></view>
				</view>
			</view>
		</view>

		<!-- 加载状态 -->
		<view v-if="loading" class="loading-container">
			<view class="loading-spinner"></view>
			<text class="loading-text">文档加载中...</text>
		</view>

		<!-- PDF查看区域占位 -->
		<view v-if="pdfReady && !loading && !loadError" class="pdf-container">
			<!-- PDF通过plus.webview显示在此区域 -->
		</view>

		<!-- 加载失败 -->
		<view v-if="loadError" class="error-container">
			<view class="error-icon"></view>
			<text class="error-title">文档加载失败</text>
			<text class="error-desc">{{ errorMessage }}</text>
			<view class="error-actions">
				<view class="btn btn--outline" @click="retryLoad">
					<text class="btn__text">重新加载</text>
				</view>
				<view class="btn btn--primary" @click="openInBrowser">
					<text class="btn__text">浏览器打开</text>
				</view>
			</view>
		</view>

		<!-- 底部操作栏 -->
		<view v-if="!loading && !loadError" class="bottom-bar">
			<view class="bottom-bar__item" @click="handleDownload">
				<image class="bottom-bar__icon" src="/static/download.svg" mode="aspectFit"></image>
				<text class="bottom-bar__text">下载</text>
			</view>
			<view class="bottom-bar__divider"></view>
			<view class="bottom-bar__item" @click="handleShare">
				<image class="bottom-bar__icon" src="/static/share.svg" mode="aspectFit"></image>
				<text class="bottom-bar__text">分享</text>
			</view>
		</view>

		<!-- 顶部通知栏 -->
    <TopNotificationBar />
	</view>
</template>

<script>
import { isDarkMode } from '@/store/theme.js'
import { getFileDownloadUrl } from '@/utils/api/medical.js'
import config from '@/utils/config.js'

export default {
	components: {
	},
	data() {
		return {
			statusBarHeight: 44,
			navbarHeight: 44, // 导航栏高度
			bottomBarHeight: 50, // 底部栏高度
			title: '查看文档',
			pdfUrl: '',
			pdfReady: false, // PDF是否准备好显示
			pdfWebview: null, // PDF子webview实例
			fileId: '', // 文件ID，用于获取下载链接
			docType: '', // record/prescription/diagnosis
			loading: true,
			loadError: false,
			errorMessage: ''
		}
	},
	computed: {
		isDark() {
			return isDarkMode()
		},
		docTypeLabel() {
			const labels = {
				record: '病历报告',
				prescription: '处方记录',
				diagnosis: '诊断报告'
			}
			return labels[this.docType] || ''
		}
	},
	onLoad(options) {
		this.getStatusBarHeight()

		if (options.title) {
			this.title = decodeURIComponent(options.title)
		}
		if (options.type) {
			this.docType = options.type
		}

		// 优先使用 fileId 获取下载链接
		if (options.fileId) {
			this.fileId = options.fileId
			this.fetchPdfUrl()
		} else if (options.url) {
			// 兼容旧的直接传递URL的方式
			this.pdfUrl = decodeURIComponent(options.url)
			this.downloadAndOpen()
		} else {
			this.loading = false
			this.loadError = true
			this.errorMessage = '未提供文件信息'
		}
	},
	onUnload() {
		// 页面卸载时销毁PDF webview
		this.destroyPdfWebview()
	},
	methods: {
		getStatusBarHeight() {
			const sysInfo = uni.getSystemInfoSync()
			this.statusBarHeight = sysInfo.statusBarHeight || 44
		},
		// 通过fileId获取PDF下载链接
		async fetchPdfUrl() {
			try {
				const res = await getFileDownloadUrl(this.fileId)
				console.log('获取PDF链接响应:', res)
				if (res.code === 200 && res.data) {
					// 修正后端 MinIO 返回 localhost 的问题：将 localhost 替换为实际服务器 IP
					const serverHost = config.baseUrl.replace(/^https?:\/\//, '').split(':')[0]
					this.pdfUrl = res.data.replace('localhost', serverHost)
					console.log('pdfUrl:', this.pdfUrl)
					// 下载并使用PDF.js查看器打开
					this.downloadAndOpen()
				} else {
					this.loading = false
					this.loadError = true
					this.errorMessage = res.msg || '获取文档链接失败'
				}
			} catch (e) {
				console.error('获取PDF链接失败:', e)
				this.loading = false
				this.loadError = true
				this.errorMessage = '网络错误，请稍后重试'
			}
		},
		// 下载PDF并使用PDF.js查看器打开
		downloadAndOpen() {
			console.log('开始下载PDF:', this.pdfUrl)

			// #ifdef APP-PLUS
			// 使用 plus.downloader 进行下载
			const dtask = plus.downloader.createDownload(
				this.pdfUrl,
				{
					filename: '_doc/pdf_temp_' + Date.now() + '.pdf',
					timeout: 60
				},
				(d, status) => {
					console.log('plus下载完成, status:', status)
					if (status === 200) {
						const filePath = d.filename
						console.log('PDF已下载到:', filePath)

						// iOS: WKWebView 沙盒限制，无法跨目录访问 _doc 下的 file:// 文件
						// 改用系统原生 PDF 查看器（Quick Look）
						if (uni.getSystemInfoSync().platform === 'ios') {
							this.loading = false
							uni.openDocument({
								filePath: filePath,
								fileType: 'pdf',
								fail: (err) => {
									console.error('openDocument 失败:', err)
									this.loadError = true
									this.errorMessage = '无法打开文档: ' + (err.errMsg || '')
								}
							})
							return
						}

						// Android: 转换为本地文件URL，使用 PDF.js 子 webview 渲染
						const localUrl = plus.io.convertLocalFileSystemURL(filePath)
						console.log('本地文件URL:', localUrl)
						this.createPdfWebview(localUrl)
					} else {
						console.error('下载状态码异常:', status)
						this.loading = false
						this.loadError = true
						this.errorMessage = '下载失败，状态码: ' + status
					}
				}
			)
			dtask.addEventListener('statechanged', (task, status) => {
				console.log('下载状态:', task.state, '已下载:', task.downloadedSize, '总大小:', task.totalSize)
				// state: -1失败, 0初始, 1开始, 2连接, 3接收数据, 4完成
				if (task.state === -1) {
					console.error('下载失败, 状态-1')
					this.loading = false
					this.loadError = true
					this.errorMessage = '下载失败'
				}
			})
			// 监听错误事件
			dtask.addEventListener('error', (task, err) => {
				console.error('下载错误:', err)
				this.loading = false
				this.loadError = true
				this.errorMessage = '下载出错: ' + (err || '未知错误')
			})
			dtask.start()
			// #endif

			// #ifndef APP-PLUS
			// 非APP环境暂不支持内嵌预览，使用外部打开
			uni.showToast({ title: '请在APP中查看', icon: 'none' })
			this.loading = false
			this.loadError = true
			this.errorMessage = '当前环境不支持PDF预览'
			// #endif
		},
		// 创建PDF子webview
		createPdfWebview(localPdfUrl) {
			// #ifdef APP-PLUS
			const currentWebview = this.$scope.$getAppWebview()
			const sysInfo = uni.getSystemInfoSync()

			// 计算webview的位置和大小
			const topOffset = this.statusBarHeight + this.navbarHeight
			const bottomOffset = this.bottomBarHeight + (sysInfo.safeAreaInsets?.bottom || 0)
			const height = sysInfo.windowHeight - topOffset - bottomOffset

			console.log('创建PDF webview, top:', topOffset, 'height:', height)

			// 构建viewer URL
			const viewerUrl = `/static/pdfjs/viewer.html?file=${encodeURIComponent(localPdfUrl)}`

			// 创建子webview
			this.pdfWebview = plus.webview.create(viewerUrl, 'pdf-child', {
				top: topOffset + 'px',
				left: '0px',
				width: '100%',
				height: height + 'px',
				background: 'transparent'
			})

			// 添加到当前页面
			currentWebview.append(this.pdfWebview)

			this.loading = false
			this.pdfReady = true
			// #endif
		},
		// 销毁PDF子webview
		destroyPdfWebview() {
			// #ifdef APP-PLUS
			if (this.pdfWebview) {
				console.log('销毁PDF webview')
				this.pdfWebview.close()
				this.pdfWebview = null
			}
			// #endif
		},
		isWechat() {
			// #ifdef MP-WEIXIN
			return true
			// #endif
			return false
		},
		isAppPlus() {
			// #ifdef APP-PLUS
			return true
			// #endif
			return false
		},
		goBack() {
			this.destroyPdfWebview()
			uni.navigateBack()
		},
		onWebViewLoad() {
			this.loading = false
			this.loadError = false
		},
		onWebViewError(e) {
			this.loading = false
			this.loadError = true
			this.errorMessage = '无法加载文档，请检查网络连接'
			console.error('WebView加载失败:', e)
		},
		retryLoad() {
			this.loading = true
			this.loadError = false
			this.pdfReady = false
			// 销毁旧的webview
			this.destroyPdfWebview()
			// 如果有fileId，重新获取下载链接
			if (this.fileId) {
				this.fetchPdfUrl()
			} else if (this.pdfUrl) {
				// 重新下载并打开
				this.downloadAndOpen()
			}
		},
		openInBrowser() {
			// #ifdef H5
			window.open(this.pdfUrl, '_blank')
			// #endif
			// #ifdef MP-WEIXIN
			uni.showToast({ title: '请使用下载功能', icon: 'none' })
			// #endif
		},
		handleDownload() {
			uni.showLoading({ title: '准备下载...' })

			// #ifdef MP-WEIXIN
			uni.downloadFile({
				url: this.pdfUrl,
				success: (res) => {
					uni.hideLoading()
					if (res.statusCode === 200) {
						uni.openDocument({
							filePath: res.tempFilePath,
							showMenu: true,
							success: () => {
								console.log('打开文档成功')
							},
							fail: (err) => {
								uni.showToast({ title: '打开文档失败', icon: 'none' })
								console.error('打开文档失败:', err)
							}
						})
					} else {
						uni.showToast({ title: '下载失败', icon: 'none' })
					}
				},
				fail: (err) => {
					uni.hideLoading()
					uni.showToast({ title: '下载失败', icon: 'none' })
					console.error('下载失败:', err)
				}
			})
			// #endif

			// #ifdef H5
			setTimeout(() => {
				uni.hideLoading()
				// H5直接打开新窗口下载
				const a = document.createElement('a')
				a.href = this.pdfUrl
				a.download = this.title + '.pdf'
				a.target = '_blank'
				a.click()
			}, 500)
			// #endif
		},
		handleShare() {
			// #ifdef MP-WEIXIN
			uni.showShareMenu({
				withShareTicket: true,
				menus: ['shareAppMessage', 'shareTimeline']
			})
			// #endif

			// #ifdef H5
			if (navigator.share) {
				navigator.share({
					title: this.title,
					url: this.pdfUrl
				}).catch(err => console.log('分享取消', err))
			} else {
				uni.setClipboardData({
					data: this.pdfUrl,
					success: () => {
						uni.showToast({ title: '链接已复制', icon: 'success' })
					}
				})
			}
			// #endif
		}
	},
	// 小程序分享
	onShareAppMessage() {
		return {
			title: this.title,
			path: `/pages/profile/pdf-viewer?url=${encodeURIComponent(this.pdfUrl)}&title=${encodeURIComponent(this.title)}&type=${this.docType}`
		}
	}
}
</script>

<style lang="scss" scoped>
.page {
	min-height: 100vh;
	background: $bg-base;
	display: flex;
	flex-direction: column;

	&--dark {
		background: $dark-bg-base;
	}
}

.status-bar {
	background: $bg-card;

	.page--dark & {
		background: $dark-bg-card;
	}
}

.navbar {
	display: flex;
	align-items: center;
	height: 88rpx;
	padding: 0 $spacing-md;
	background: $bg-card;
	border-bottom: 1rpx solid $border-color-light;

	&__left {
		width: 88rpx;
		height: 88rpx;
		display: flex;
		align-items: center;
		justify-content: flex-start;
	}

	&__back {
		width: 20rpx;
		height: 20rpx;
		border-left: 4rpx solid $text-primary;
		border-bottom: 4rpx solid $text-primary;
		transform: rotate(45deg);
	}

	&__title {
		flex: 1;
		text-align: center;
		overflow: hidden;
	}

	&__title-text {
		display: block;
		font-size: $font-size-lg;
		font-weight: $font-weight-semibold;
		color: $text-primary;
		white-space: nowrap;
		text-overflow: ellipsis;
		overflow: hidden;
	}

	&__subtitle {
		display: block;
		font-size: $font-size-xs;
		color: $text-muted;
		margin-top: 2rpx;
	}

	&__right {
		width: 88rpx;
		display: flex;
		align-items: center;
		justify-content: flex-end;
	}

	&__action {
		width: 64rpx;
		height: 64rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.page--dark & {
		background: $dark-bg-card;
		border-bottom-color: $dark-border-color;

		.navbar__back {
			border-color: $dark-text-primary;
		}
		.navbar__title-text {
			color: $dark-text-primary;
		}
		.navbar__subtitle {
			color: $dark-text-muted;
		}
	}
}

.share-icon {
	width: 36rpx;
	height: 36rpx;
	position: relative;

	&::before {
		content: '';
		position: absolute;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 28rpx;
		height: 20rpx;
		border: 3rpx solid #fff;
		border-top: none;
		border-radius: 0 0 6rpx 6rpx;
	}

	&::after {
		content: '';
		position: absolute;
		top: 4rpx;
		left: 50%;
		transform: translateX(-50%);
		width: 4rpx;
		height: 16rpx;
		background: #fff;
	}

	&--dark {
		&::before {
			border-color: $text-secondary;
		}
		&::after {
			background: $text-secondary;
		}
	}
}

.loading-container {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
}

.loading-spinner {
	width: 64rpx;
	height: 64rpx;
	border: 4rpx solid rgba($color-primary, 0.2);
	border-top-color: $color-primary;
	border-radius: 50%;
	animation: spin 0.8s linear infinite;
}

@keyframes spin {
	to { transform: rotate(360deg); }
}

.loading-text {
	margin-top: $spacing-md;
	font-size: $font-size-base;
	color: $text-secondary;

	.page--dark & {
		color: $dark-text-secondary;
	}
}

.pdf-container {
	flex: 1;
	background: #404040;
}

.error-container {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: $spacing-2xl;
}

.error-icon {
	width: 120rpx;
	height: 120rpx;
	border: 6rpx solid $color-error;
	border-radius: 50%;
	position: relative;
	margin-bottom: $spacing-lg;

	&::before,
	&::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		width: 50rpx;
		height: 6rpx;
		background: $color-error;
		border-radius: 3rpx;
	}

	&::before {
		transform: translate(-50%, -50%) rotate(45deg);
	}

	&::after {
		transform: translate(-50%, -50%) rotate(-45deg);
	}
}

.error-title {
	font-size: $font-size-lg;
	font-weight: $font-weight-semibold;
	color: $text-primary;
	margin-bottom: $spacing-sm;

	.page--dark & {
		color: $dark-text-primary;
	}
}

.error-desc {
	font-size: $font-size-base;
	color: $text-secondary;
	margin-bottom: $spacing-xl;

	.page--dark & {
		color: $dark-text-secondary;
	}
}

.error-actions {
	display: flex;
	gap: $spacing-md;
}

.btn {
	padding: $spacing-sm $spacing-lg;
	border-radius: $radius-lg;

	&__text {
		font-size: $font-size-base;
	}

	&--outline {
		border: 2rpx solid $color-primary;
		background: transparent;

		.btn__text {
			color: $color-primary;
		}
	}

	&--primary {
		background: linear-gradient(135deg, $color-primary 0%, $color-primary-light 100%);

		.btn__text {
			color: #fff;
		}
	}
}

.bottom-bar {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 100rpx;
	background: $bg-card;
	border-top: 1rpx solid $border-color-light;
	padding-bottom: env(safe-area-inset-bottom);

	&__item {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: $spacing-sm;
	}

	&__icon {
		width: 36rpx;
		height: 36rpx;
	}

	&__text {
		font-size: $font-size-base;
		color: $text-secondary;
	}

	&__divider {
		width: 1rpx;
		height: 40rpx;
		background: $border-color-light;
	}

	.page--dark & {
		background: $dark-bg-card;
		border-top-color: $dark-border-color;

		.bottom-bar__text {
			color: $dark-text-secondary;
		}
		.bottom-bar__divider {
			background: $dark-border-color;
		}
	}
}

.download-icon {
	width: 32rpx;
	height: 32rpx;
	position: relative;

	&::before {
		content: '';
		position: absolute;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 28rpx;
		height: 4rpx;
		background: $text-secondary;
		border-radius: 2rpx;
	}

	&::after {
		content: '';
		position: absolute;
		top: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 4rpx;
		height: 20rpx;
		background: $text-secondary;
	}

	.page--dark & {
		&::before,
		&::after {
			background: $dark-text-secondary;
		}
	}
}
</style>
