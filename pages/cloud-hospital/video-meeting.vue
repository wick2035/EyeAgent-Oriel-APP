<template>
	<view class="vm-page">

		<!-- Jitsi 视频（全屏原生 WebView） -->
		<web-view v-if="joinUrl" :src="joinUrl" class="vm-webview"></web-view>

		<!-- 连接中占位 -->
		<view v-else class="vm-loading">
			<view class="vm-loading__spinner"></view>
			<text class="vm-loading__text">正在连接诊室...</text>
		</view>

		<!-- ── 顶栏 cover-view（悬浮于 WebView 之上）── -->
		<cover-view class="vm-navbar">
			<!-- 状态栏占位 -->
			<cover-view :style="{ height: statusBarHeight + 'px' }"></cover-view>
			<!-- 内容行 -->
			<cover-view class="vm-navbar-row">

				<!-- 左：退出诊室胶囊 -->
				<cover-view class="vm-exit-btn" @click="confirmExit">
					<cover-view class="vm-exit-btn__text">退出诊室</cover-view>
				</cover-view>

				<!-- 中：远程就诊 · 医生姓名 -->
				<cover-view class="vm-center">
					<cover-view class="vm-center__label">远程就诊 · {{ doctorName }}</cover-view>
				</cover-view>

				<!-- 右：倒计时胶囊（与左侧等高等间距） -->
				<cover-view class="vm-timer-chip" :class="timerColorClass">
					<cover-view class="vm-timer-chip__text">{{ formattedRemaining }}</cover-view>
				</cover-view>

			</cover-view>
		</cover-view>

		<!-- ── 会议结束全屏白色页（time up / 医生手动结束）── -->
		<cover-view v-if="meetingEnded" class="vm-end-overlay">
			<cover-view class="vm-end-inner">
				<cover-view class="vm-end-check">✓</cover-view>
				<cover-view class="vm-end-title">本次复诊已结束</cover-view>
				<cover-view class="vm-end-sub">感谢您使用远程就诊服务</cover-view>
				<cover-view class="vm-end-countdown">{{ exitCountdown }} 秒后自动返回...</cover-view>
				<cover-view class="vm-end-btn" @click="doExit">退出诊室</cover-view>
			</cover-view>
		</cover-view>

    <TopNotificationBar />
	</view>
</template>

<script>
import { getMeetingDetail } from '@/utils/api/followup.js'

function pad(n) {
	return String(n).padStart(2, '0')
}

export default {
	data() {
		return {
			statusBarHeight: 44,
			navbarHeightPx: 88,  // 状态栏 + 导航行高度（px），onLoad 精确计算
			meetingId: '',
			joinUrl: '',
			doctorName: '主治医生',
			endTimeMs: 0,
			maxDurationMinutes: 30,
			remainingSeconds: 0,
			warningShown: false,
			meetingEnded: false,
			exitCountdown: 8,
			countdownTimer: null,
			pollTimer: null,
			exitTimer: null,
			exitTickTimer: null
		}
	},
	computed: {
		formattedRemaining() {
			if (this.endTimeMs === 0) return '等待医生'
			if (this.remainingSeconds <= 0) return '00:00'
			const s = this.remainingSeconds
			const m = Math.floor(s / 60)
			const h = Math.floor(m / 60)
			if (h > 0) return `${h}:${pad(m % 60)}:${pad(s % 60)}`
			return `${pad(m)}:${pad(s % 60)}`
		},
		timerColorClass() {
			if (this.endTimeMs === 0) return 'vm-timer-waiting'
			if (this.remainingSeconds > 600) return 'vm-timer-green'
			if (this.remainingSeconds > 300) return 'vm-timer-amber'
			return 'vm-timer-red'
		}
	},
	onLoad(options) {
		// Android 必须在 WebView 加载前显式申请运行时权限，
		// 否则 WebView 的 getUserMedia 经 WebChromeClient.onPermissionRequest 时会因无运行时授权而被拒
		this.requestMediaPermissions()

		const sysInfo = uni.getSystemInfoSync()
		this.statusBarHeight = sysInfo.statusBarHeight || 44
		// 精确计算顶栏高度（px）：状态栏 + 导航行 88rpx
		this.navbarHeightPx = this.statusBarHeight + Math.round(sysInfo.windowWidth / 750 * 88)

		this.meetingId          = decodeURIComponent(options.meetingId || '')
		this.joinUrl            = decodeURIComponent(options.joinUrl || '')
		this.endTimeMs          = parseInt(options.endTimeMs) || 0
		this.doctorName         = decodeURIComponent(options.doctorName || '主治医生')
		this.maxDurationMinutes = parseInt(options.maxDurationMinutes) || 30

		// Jitsi URL fragment 配置：禁用挂断、聊天、性能设置、参会者统计；禁止胶片条折叠
		if (this.joinUrl && !this.joinUrl.includes('#')) {
			const btns = JSON.stringify([
				'microphone', 'camera', 'desktop',
				'raisehand', 'tileview', 'fullscreen',
				'select-background', 'noisesuppression',
				'shortcuts', 'filmstrip'
				// 已禁用：hangup、chat、videoquality、stats、participants-pane
			])
			this.joinUrl += '#config.toolbarButtons=' + btns
				+ '&config.filmstrip.disableResizable=true'
				+ '&config.disableFilmstripAutohiding=true'
		}

		if (this.endTimeMs > 0) {
			this.remainingSeconds = Math.max(0, Math.floor((this.endTimeMs - Date.now()) / 1000))
			this.startCountdown()
		} else {
			this.startPolling()
		}

		uni.$on('notification-received', this.handleNotification)
	},
	mounted() {
		// WebView 加载后将其顶部下移到导航栏下方，避免视频内容被顶栏遮挡
		if (this.joinUrl) {
			this.adjustWebview(1500)
			this.adjustWebview(4000) // Jitsi 完全渲染后二次校正
		}
	},
	onUnload() {
		this.stopCountdown()
		this.stopPolling()
		if (this.exitTimer) clearTimeout(this.exitTimer)
		if (this.exitTickTimer) clearInterval(this.exitTickTimer)
		uni.$off('notification-received', this.handleNotification)
	},
	methods: {
		startCountdown() {
			this.stopCountdown()
			this.countdownTimer = setInterval(() => {
				const rem = Math.max(0, Math.floor((this.endTimeMs - Date.now()) / 1000))
				this.remainingSeconds = rem

				// 5 分钟警告（uni.showModal 是原生弹窗，层级最高）
				if (rem <= 300 && rem > 0 && !this.warningShown) {
					this.warningShown = true
					uni.showModal({
						title: '诊疗时间提醒',
						content: '本次远程复诊还剩 5 分钟\n请及时与医生完成本次诊疗',
						showCancel: false,
						confirmText: '我知道了',
						confirmColor: '#F59E0B'
					})
				}

				// 时间结束 → 显示结束卡片
				if (rem === 0) {
					this.stopCountdown()
					this.endMeeting()
				}
			}, 1000)
		},
		stopCountdown() {
			if (this.countdownTimer) {
				clearInterval(this.countdownTimer)
				this.countdownTimer = null
			}
		},
		startPolling() {
			this.stopPolling()
			this.checkMeetingStatus()
			this.pollTimer = setInterval(() => this.checkMeetingStatus(), 30000)
		},
		stopPolling() {
			if (this.pollTimer) {
				clearInterval(this.pollTimer)
				this.pollTimer = null
			}
		},
		async checkMeetingStatus() {
			if (!this.meetingId) return
			const res = await getMeetingDetail(this.meetingId)
			if (res.code !== 200 || !res.data) return
			const detail = res.data
			if (detail.status === 'IN_PROGRESS' && detail.startedAt) {
				this.stopPolling()
				const maxMin = detail.maxDurationMinutes || this.maxDurationMinutes
				this.endTimeMs = new Date(detail.startedAt).getTime() + maxMin * 60000
				this.remainingSeconds = Math.max(0, Math.floor((this.endTimeMs - Date.now()) / 1000))
				this.startCountdown()
			} else if (detail.status === 'COMPLETED' || detail.status === 'CANCELLED') {
				this.stopPolling()
				this.endMeeting()
			}
		},
		// 会议结束：停止计时、显示全屏结束页、8 秒后自动返回
		endMeeting() {
			this.stopCountdown()
			this.stopPolling()
			this.meetingEnded = true
			this.exitCountdown = 8

			// 逐秒更新倒计时显示
			this.exitTickTimer = setInterval(() => {
				this.exitCountdown = Math.max(0, this.exitCountdown - 1)
				if (this.exitCountdown === 0) {
					clearInterval(this.exitTickTimer)
					this.exitTickTimer = null
				}
			}, 1000)

			this.exitTimer = setTimeout(() => uni.navigateBack(), 8000)
		},
		doExit() {
			if (this.exitTimer) clearTimeout(this.exitTimer)
			if (this.exitTickTimer) clearInterval(this.exitTickTimer)
			uni.navigateBack()
		},
		handleNotification() {
			if (this.endTimeMs > 0 && this.remainingSeconds > 0 && this.remainingSeconds <= 300 && !this.warningShown) {
				this.warningShown = true
				uni.showModal({
					title: '诊疗时间提醒',
					content: '本次远程复诊还剩 5 分钟\n请及时与医生完成本次诊疗',
					showCancel: false,
					confirmText: '我知道了',
					confirmColor: '#F59E0B'
				})
			}
		},
		confirmExit() {
			uni.showModal({
				title: '退出诊室',
				content: '确认退出视频诊室？\n会议将继续，您可以重新进入。',
				confirmText: '退出',
				confirmColor: '#EF4444',
				cancelText: '取消',
				success: (res) => {
					if (res.confirm) this.doExit()
				}
			})
		},

		/**
		 * 在 Android 上显式申请麦克风 + 摄像头运行时权限。
		 * 背景：WebView 的 getUserMedia 在触发 WebChromeClient.onPermissionRequest 时，
		 *       UniApp 会检查 App 是否已获得对应运行时权限——若未申请过则直接拒绝，
		 *       导致 Jitsi 报"无法使用麦克风"错误。
		 * iOS：WKWebView 会在首次 getUserMedia 时由系统自动弹权限对话框，无需额外处理。
		 */
		requestMediaPermissions() {
			// #ifdef APP-PLUS
			if (plus.os.name !== 'Android') return
			plus.android.requestPermissions(
				['android.permission.RECORD_AUDIO', 'android.permission.CAMERA'],
				(result) => {
					if (result.deniedAlways.length > 0) {
						// 用户选择"不再询问"——无法弹窗，引导前往系统设置
						uni.showModal({
							title: '麦克风 / 摄像头权限已拒绝',
							content: '视频就诊需要麦克风和摄像头权限，请前往系统设置中手动开启。',
							confirmText: '去设置',
							cancelText: '取消',
							success: (res) => {
								if (res.confirm) plus.runtime.openURL('app-settings:')
							}
						})
					}
				},
				() => {} // 申请过程出错时静默处理，Jitsi 自身会再次提示
			)
			// #endif
		},

		/**
		 * 将 Jitsi 子 WebView 的顶部下移到导航栏下方，使医生视频不被顶栏遮挡。
		 * 同时注入 CSS 隐藏胶片条折叠按钮。
		 * 使用 plus.webview 原生 API（仅 APP-PLUS 生效）。
		 */
		adjustWebview(delay = 1500) {
			setTimeout(() => {
				// #ifdef APP-PLUS
				try {
					const wv = plus.webview.currentWebview()
					const children = wv.children()
					if (!children || !children.length) return
					const jitsiWv = children[0]
					const sysInfo = uni.getSystemInfoSync()
					const top = this.navbarHeightPx
					const height = sysInfo.screenHeight - top

					// 重定位 Jitsi WebView：从导航栏下方开始，延伸到屏幕底部
					jitsiWv.setStyle({ top: top + 'px', height: height + 'px' })

					// 注入 CSS：隐藏胶片条折叠/展开按钮，防止用户收缩视频区域
					jitsiWv.evalJS(`(function(){
						if(document.getElementById('__eye2_style__'))return;
						var s=document.createElement('style');
						s.id='__eye2_style__';
						s.textContent='.filmstrip .filmstrip__toolbar,.filmstrip__toolbar{display:none!important}';
						document.head.appendChild(s);
					})()`)
				} catch(e) {}
				// #endif
			}, delay)
		}
	}
}
</script>

<!--
  ⚠️  重要：此处 style 故意不加 scoped
  原因：UniApp app-plus 中 cover-view 是原生组件，不含 Vue 注入的 data-v-xxxxx 属性，
        若加 scoped，编译后选择器变为 .vm-navbar[data-v-xxxxx]，永远无法匹配原生组件，
        导致 background-color 等样式全部失效（表现为透明背景）。
        所有类名加 vm- 前缀，避免污染全局其他页面的样式。
-->
<style lang="scss">
// ── 页面容器 ─────────────────────────────────────────
.vm-page {
	width: 100%;
	height: 100vh;
	background: #000;
	position: relative;
}

.vm-webview {
	width: 100%;
	height: 100%;
}

// ── 顶栏（cover-view，悬浮于 WebView 上方）─────────
.vm-navbar {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	background-color: #ffffff;
	border-bottom: 2rpx solid rgba(0, 0, 0, 0.08);
}

.vm-navbar-row {
	height: 88rpx;
	display: flex;
	flex-direction: row;
	align-items: center;
	padding: 0 24rpx;
	gap: 16rpx;
}

// 退出诊室胶囊 & 倒计时胶囊（统一尺寸）
.vm-exit-btn,
.vm-timer-chip {
	height: 56rpx;
	padding: 0 24rpx;
	border-radius: 28rpx;
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
}

.vm-exit-btn {
	background-color: rgba(239, 68, 68, 0.08);
}

.vm-exit-btn__text {
	font-size: 26rpx;
	font-weight: 600;
	color: #EF4444;
}

// 中间标题
.vm-center {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
}

.vm-center__label {
	font-size: 28rpx;
	font-weight: 600;
	color: #1E293B;
}

// 倒计时胶囊颜色状态
.vm-timer-green  { background-color: rgba(16, 185, 129, 0.12); }
.vm-timer-amber  { background-color: rgba(245, 158, 11, 0.12); }
.vm-timer-red    { background-color: rgba(239, 68, 68, 0.12); }
.vm-timer-waiting { background-color: rgba(0, 0, 0, 0.06); }

.vm-timer-chip__text {
	font-size: 26rpx;
	font-weight: 700;
}

.vm-timer-green  .vm-timer-chip__text { color: #10B981; }
.vm-timer-amber  .vm-timer-chip__text { color: #F59E0B; }
.vm-timer-red    .vm-timer-chip__text { color: #EF4444; }
.vm-timer-waiting .vm-timer-chip__text { color: #94A3B8; }

// ── 复诊结束全屏白色页 ───────────────────────────────
.vm-end-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: #FFFFFF;
	display: flex;
	align-items: center;
	justify-content: center;
}

.vm-end-inner {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 0 80rpx;
	width: 100%;
	text-align: center;
}

.vm-end-check {
	width: 120rpx;
	height: 120rpx;
	border-radius: 60rpx;
	background-color: #10B981;
	color: #ffffff;
	font-size: 56rpx;
	font-weight: 700;
	display: flex;
	align-items: center;
	justify-content: center;
	text-align: center;
	line-height: 120rpx;
	margin-bottom: 48rpx;
}

.vm-end-title {
	font-size: 40rpx;
	font-weight: 700;
	color: #1E293B;
	margin-bottom: 16rpx;
	text-align: center;
}

.vm-end-sub {
	font-size: 28rpx;
	color: #64748B;
	margin-bottom: 24rpx;
	text-align: center;
}

.vm-end-countdown {
	font-size: 26rpx;
	color: #94A3B8;
	margin-bottom: 64rpx;
	text-align: center;
}

.vm-end-btn {
	width: 100%;
	height: 96rpx;
	border-radius: 48rpx;
	background-color: #3B82F6;
	color: #ffffff;
	font-size: 32rpx;
	font-weight: 600;
	display: flex;
	align-items: center;
	justify-content: center;
	text-align: center;
	line-height: 96rpx;
}

// ── 连接中占位 ──────────────────────────────────────
.vm-loading {
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	background: #111;
}

.vm-loading__spinner {
	width: 80rpx;
	height: 80rpx;
	border: 6rpx solid rgba(255, 255, 255, 0.15);
	border-top-color: #3388FF;
	border-radius: 50%;
	animation: vm-spin 0.9s linear infinite;
}

.vm-loading__text {
	margin-top: 32rpx;
	font-size: 26rpx;
	color: rgba(255, 255, 255, 0.5);
}

@keyframes vm-spin {
	to { transform: rotate(360deg); }
}
</style>
