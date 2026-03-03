<template>
	<view class="page" :class="{ 'page--dark': isDark }">
		<!-- 状态栏占位 -->
		<view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>

		<!-- 导航栏 -->
		<view class="navbar">
			<view class="navbar__back" @click="goBack">
				<view class="navbar__back-icon"></view>
			</view>
			<text class="navbar__title">预约详情</text>
			<view class="navbar__placeholder"></view>
		</view>

		<!-- 内容区域 -->
		<scroll-view class="content" scroll-y>
			<!-- 状态区域 -->
			<view class="status-section" :class="statusSectionClass">
				<!-- 状态图标 -->
				<view class="status-icon" :class="statusIconClass">
					<view v-if="isPending || isInProgress" class="check-icon"></view>
					<view v-else class="inactive-icon"></view>
				</view>

				<!-- 状态文字 -->
				<text class="status-text">{{ statusText }}</text>

				<!-- 二维码区域 -->
				<view class="qrcode-card" :class="{ 'qrcode-card--expired': !isPending }">
					<view class="qrcode-inner">
						<image
							v-if="qrcodeUrl"
							class="qrcode-image"
							:src="qrcodeUrl"
							mode="aspectFit"
						/>
						<view v-else class="qrcode-placeholder">
							<text>加载中...</text>
						</view>
					</view>
					<!-- 失效遮罩 -->
					<view v-if="!isPending" class="qrcode-expired-mask">
						<text class="qrcode-expired-text">已失效</text>
					</view>
				</view>

				<!-- 二维码提示 -->
				<text class="qrcode-tip">{{ isPending ? '请出示此码签到' : '此二维码已失效' }}</text>

				<!-- 就诊时间和科室 -->
				<view class="appointment-brief">
					<text class="brief-date">{{ formattedDate }}</text>
					<text class="brief-dept">{{ appointment.department || '-' }}</text>
				</view>
			</view>

			<!-- 详情卡片 -->
			<view class="detail-card">
				<view class="detail-item" v-for="item in detailItems" :key="item.label" @click="handleDetailClick(item)">
					<text class="detail-label">{{ item.label }}</text>
					<text class="detail-value" :class="{ 'detail-value--highlight': item.highlight, 'detail-value--clickable': item.clickable }">
						{{ item.value }}
					</text>
				</view>
			</view>

			<!-- 温馨提示 -->
			<view class="tips-card">
				<view class="tips-header">
					<view class="tips-icon"></view>
					<text class="tips-title">温馨提示</text>
				</view>
				<view class="tips-list">
					<view class="tips-item">
						<text class="tips-dot">•</text>
						<text class="tips-text">请提前15分钟到达医院签到</text>
					</view>
					<view class="tips-item">
						<text class="tips-dot">•</text>
						<text class="tips-text">请携带有效身份证件</text>
					</view>
					<view class="tips-item">
						<text class="tips-dot">•</text>
						<text class="tips-text">如需取消请提前2小时操作</text>
					</view>
				</view>
			</view>

			<!-- 底部占位 -->
			<view class="bottom-placeholder"></view>
		</scroll-view>

		<!-- 底部操作栏 -->
		<view class="bottom-bar">
			<template v-if="isPending">
				<view class="btn-secondary" @click="handleCancel">
					<text>取消预约</text>
				</view>
				<view class="btn-primary" @click="handleNavigate">
					<view class="nav-icon"></view>
					<text>导航到医院</text>
				</view>
			</template>
			<template v-else-if="isInProgress">
				<view class="btn-primary btn-primary--full" @click="handleNavigate">
					<view class="nav-icon"></view>
					<text>导航到医院</text>
				</view>
			</template>
			<template v-else>
				<view class="btn-primary btn-primary--full" @click="handleRebook">
					<text>{{ isCompleted ? '再次预约' : '重新预约' }}</text>
				</view>
			</template>
		</view>

		<!-- 取消确认弹窗 -->
		<view v-if="showCancelDialog" class="dialog-mask" @click="closeCancelDialog">
			<view class="dialog" @click.stop>
				<view class="dialog__icon dialog__icon--warning">
					<view class="warning-icon"></view>
				</view>
				<text class="dialog__title">确认取消预约？</text>
				<text class="dialog__content">取消后需要重新预约，确定要取消吗？</text>
				<view class="dialog__buttons">
					<view class="dialog__btn dialog__btn--cancel" @click="closeCancelDialog">
						<text>再想想</text>
					</view>
					<view class="dialog__btn dialog__btn--confirm" @click="confirmCancel">
						<text>确认取消</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 顶部通知栏 -->
		<TopNotificationBar />

		<!-- 隐藏的canvas用于生成二维码 -->
		<canvas
			v-if="appointment.reserveId"
			canvas-id="qrcode-canvas"
			class="qrcode-canvas"
			:style="{ width: '300px', height: '300px' }"
		/>
	</view>
</template>

<script>
import { isDarkMode } from '@/store/theme.js'
import { cancelAppointment } from '@/utils/api/appointment.js'
import { getAppointmentList } from '@/utils/api/medical.js'
import TopNotificationBar from '@/components/TopNotificationBar.vue'
import uQRCode from '@/uni_modules/cc-defineNewQRCode/components/cc-defineNewQRCode/common/uqrcode.js'

export default {
	components: {
		TopNotificationBar
	},
	data() {
		return {
			statusBarHeight: 44,
			appointmentId: '',  // 从URL参数获取的预约ID
			appointment: {},
			showCancelDialog: false,
			canceling: false,
			qrcodeUrl: '',  // 离线生成的二维码图片路径
			showFullReserveId: false  // 控制是否显示完整就诊码
		}
	},
	computed: {
		isDark() {
			return isDarkMode()
		},
		// 预约状态判断
		isPending() {
			return this.appointment.status === 'PENDING' || this.appointment.status === 'pending'
		},
		isInProgress() {
			return this.appointment.status === 'IN_PROGRESS' || this.appointment.status === 'in_progress'
		},
		isCompleted() {
			return this.appointment.status === 'COMPLETED' || this.appointment.status === 'completed'
		},
		isExpired() {
			return this.appointment.status === 'EXPIRED' || this.appointment.status === 'expired'
		},
		isCancelled() {
			return this.appointment.status === 'cancelled' || this.appointment.status === 'CANCELLED' || this.appointment.status === 'canceled' || this.appointment.status === 'CANCELED'
		},
		// 状态区域样式
		statusSectionClass() {
			return (this.isPending || this.isInProgress) ? 'status-section--pending' : 'status-section--inactive'
		},
		statusIconClass() {
			return (this.isPending || this.isInProgress) ? 'status-icon--success' : 'status-icon--inactive'
		},
		// 状态文字
		statusText() {
			if (this.isPending) return '预约成功'
			if (this.isInProgress) return '正在诊断'
			if (this.isCompleted) return '完成诊断'
			if (this.isExpired) return '已过期'
			return '已取消'
		},
		// 格式化日期
		formattedDate() {
			if (!this.appointment.startTime) return '-'
			const date = new Date(this.appointment.startTime)
			const year = date.getFullYear()
			const month = date.getMonth() + 1
			const day = date.getDate()
			const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
			const weekDay = weekDays[date.getDay()]
			const hours = String(date.getHours()).padStart(2, '0')
			const minutes = String(date.getMinutes()).padStart(2, '0')
			const period = date.getHours() < 12 ? '上午' : (date.getHours() < 18 ? '下午' : '晚上')
			return `${year}年${month}月${day}日 ${weekDay} ${period} ${hours}:${minutes}`
		},
		// 格式化时间范围
		formattedTimeRange() {
			if (!this.appointment.startTime || !this.appointment.endTime) return '-'
			const start = new Date(this.appointment.startTime)
			const end = new Date(this.appointment.endTime)
			const startTime = `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`
			const endTime = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`
			return `${startTime}~${endTime}`
		},
		// 详情列表项
		detailItems() {
			const apt = this.appointment
			const queueNum = apt.queuePosition || apt.queueNumber
			return [
				{ label: '就诊医院', value: apt.hospitalName || '-' },
				{ label: '就诊时间', value: this.formattedTimeRange },
				{ label: '就诊医生', value: apt.doctorName && apt.doctorTitle ? `${apt.doctorName} ${apt.doctorTitle}` : (apt.doctorName || '-') },
				{ label: '就诊科室', value: apt.department || '-' },
				{ label: '就诊人', value: apt.patientName || '-' },
				{ label: '就诊码', value: apt.reserveId ? (this.showFullReserveId ? apt.reserveId : apt.reserveId.substring(0, 8) + '...') : '-', highlight: true, clickable: !!apt.reserveId, key: 'reserveId' },
				{ label: '就诊序号', value: queueNum ? `第${queueNum}号` : '-', highlight: true },
				{ label: '就诊地址', value: apt.consultationRoom || '请以现场指引为准' }
			]
		}
	},
	onLoad(options) {
		this.getStatusBarHeight()
		if (options.id) {
			this.appointmentId = options.id
		}
		this.loadAppointmentData()
	},
	methods: {
		getStatusBarHeight() {
			const sysInfo = uni.getSystemInfoSync()
			this.statusBarHeight = sysInfo.statusBarHeight || 44
		},
		// 加载预约数据
		async loadAppointmentData() {
			try {
				// 优先从缓存加载（从就诊记录列表进入时）
				const cached = uni.getStorageSync('tempAppointmentDetail')
				if (cached) {
					this.appointment = JSON.parse(cached)
					uni.removeStorageSync('tempAppointmentDetail')
					this.$nextTick(() => {
						this.generateQRCode()
					})
					return
				}

				// 缓存不存在时，通过API按ID加载（从通知跳转时）
				if (this.appointmentId) {
					const res = await getAppointmentList()
					if (res.code === 200) {
						const list = res.data.list || []
						const found = list.find(item => item.id === this.appointmentId || item.reserveId === this.appointmentId)
						if (found) {
							this.appointment = found
							this.$nextTick(() => {
								this.generateQRCode()
							})
							return
						}
					}
					uni.showToast({ title: '未找到预约记录', icon: 'none' })
				}
			} catch (e) {
				console.error('加载预约数据失败:', e)
				uni.showToast({ title: '数据加载失败', icon: 'none' })
			}
		},
		// 生成二维码（离线方式）
		generateQRCode() {
			if (!this.appointment.reserveId) return

			uQRCode.make({
				canvasId: 'qrcode-canvas',
				componentInstance: this,
				text: this.appointment.reserveId,
				size: 300,
				margin: 12,
				backgroundColor: '#ffffff',
				foregroundColor: '#1E3A5F',
				success: (tempFilePath) => {
					this.qrcodeUrl = tempFilePath
				},
				fail: (err) => {
					console.error('二维码生成失败:', err)
					this.qrcodeUrl = ''
				}
			})
		},
		// 返回
		goBack() {
			uni.navigateBack()
		},
		// 处理详情项点击
		handleDetailClick(item) {
			if (item.key === 'reserveId' && item.clickable) {
				this.showFullReserveId = !this.showFullReserveId
			}
		},
		// 取消预约
		handleCancel() {
			this.showCancelDialog = true
		},
		closeCancelDialog() {
			this.showCancelDialog = false
		},
		async confirmCancel() {
			if (this.canceling) return
			this.canceling = true

			try {
				const res = await cancelAppointment(this.appointment.reserveId)
				if (res.code === 200) {
					uni.showToast({ title: '取消成功', icon: 'success' })
					this.showCancelDialog = false
					// 返回上一页并刷新
					setTimeout(() => {
						uni.navigateBack()
					}, 1500)
				} else {
					uni.showToast({ title: res.msg || '取消失败', icon: 'none' })
				}
			} catch (e) {
				console.error('取消预约失败:', e)
				uni.showToast({ title: '网络错误', icon: 'none' })
			} finally {
				this.canceling = false
			}
		},
		// 导航到医院
		handleNavigate() {
			const apt = this.appointment
			if (!apt.hospitalAddress && !apt.hospitalName) {
				uni.showToast({ title: '暂无医院地址信息', icon: 'none' })
				return
			}

			// 使用地图打开导航
			uni.openLocation({
				name: apt.hospitalName || '医院',
				address: apt.hospitalAddress || apt.hospitalName,
				latitude: 0,
				longitude: 0,
				fail: () => {
					// 如果打开失败，复制地址
					uni.setClipboardData({
						data: apt.hospitalAddress || apt.hospitalName,
						success: () => {
							uni.showToast({ title: '地址已复制', icon: 'success' })
						}
					})
				}
			})
		},
		// 再次/重新预约
		handleRebook() {
			const apt = this.appointment
			if (apt.doctorId && apt.hospitalId) {
				uni.navigateTo({
					url: `/pages/appointment/doctor-detail?doctorId=${apt.doctorId}&hospitalId=${apt.hospitalId}`
				})
			} else if (apt.doctorId) {
				uni.navigateTo({
					url: `/pages/appointment/doctor-detail?doctorId=${apt.doctorId}`
				})
			} else {
				// 没有医生信息，跳转到预约首页
				uni.switchTab({
					url: '/pages/appointment/appointment'
				})
			}
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
}

// 隐藏的canvas（仅用于生成二维码图片）
.qrcode-canvas {
	position: fixed;
	left: -9999px;
	top: -9999px;
}

// 状态栏
.status-bar {
	flex-shrink: 0;
}

// 导航栏
.navbar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	height: 88rpx;
	padding: 0 $spacing-md;
	flex-shrink: 0;

	&__back {
		width: 72rpx;
		height: 72rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	&__back-icon {
		width: 20rpx;
		height: 20rpx;
		border-left: 4rpx solid $text-primary;
		border-bottom: 4rpx solid $text-primary;
		transform: rotate(45deg);
	}

	&__title {
		flex: 1;
		text-align: center;
		font-size: $font-size-lg;
		font-weight: $font-weight-semibold;
		color: $text-primary;
	}

	&__placeholder {
		width: 72rpx;
	}
}

// 内容区
.content {
	flex: 1;
	overflow: hidden;
}

// 状态区域
.status-section {
	padding: $spacing-xl $spacing-lg calc(#{$spacing-2xl} + 48rpx);
	display: flex;
	flex-direction: column;
	align-items: center;
	border-radius: 0 0 48rpx 48rpx;
	position: relative;

	&--pending {
		background: linear-gradient(180deg, #10B981 0%, #34D399 50%, #6EE7B7 100%);
		box-shadow: 0 16rpx 48rpx rgba(16, 185, 129, 0.3);
	}

	&--inactive {
		background: linear-gradient(180deg, #6B7280 0%, #9CA3AF 50%, #D1D5DB 100%);
		box-shadow: 0 16rpx 48rpx rgba(107, 114, 128, 0.2);
	}
}

// 状态图标
.status-icon {
	width: 100rpx;
	height: 100rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: $spacing-sm;

	&--success {
		background: rgba(255, 255, 255, 0.2);
		border: 4rpx solid rgba(255, 255, 255, 0.5);
	}

	&--inactive {
		background: rgba(255, 255, 255, 0.15);
		border: 4rpx solid rgba(255, 255, 255, 0.3);
	}
}

.check-icon {
	width: 28rpx;
	height: 48rpx;
	border: 6rpx solid #fff;
	border-top: none;
	border-left: none;
	transform: rotate(45deg) translateY(-6rpx);
}

.inactive-icon {
	width: 36rpx;
	height: 36rpx;
	position: relative;

	&::before,
	&::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 0;
		width: 100%;
		height: 4rpx;
		background: rgba(255, 255, 255, 0.7);
		border-radius: 2rpx;
	}

	&::before {
		transform: translateY(-50%) rotate(45deg);
	}

	&::after {
		transform: translateY(-50%) rotate(-45deg);
	}
}

// 状态文字
.status-text {
	font-size: $font-size-2xl;
	font-weight: $font-weight-bold;
	color: #fff;
	margin-bottom: $spacing-lg;
	text-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
	letter-spacing: 4rpx;
}

// 二维码卡片
.qrcode-card {
	background: rgba(255, 255, 255, 0.98);
	border-radius: 32rpx;
	padding: 32rpx;
	box-shadow:
		0 4rpx 16rpx rgba(0, 0, 0, 0.06),
		0 12rpx 40rpx rgba(0, 0, 0, 0.08);
	margin-bottom: $spacing-md;
	position: relative;
	overflow: hidden;

	// 呼吸动画
	animation: qrPulse 2.5s ease-in-out infinite;

	&--expired {
		animation: none;
	}
}

@keyframes qrPulse {
	0%, 100% {
		box-shadow:
			0 4rpx 16rpx rgba(0, 0, 0, 0.06),
			0 12rpx 40rpx rgba(0, 0, 0, 0.08),
			0 0 0 0 rgba(255, 255, 255, 0.4);
	}
	50% {
		box-shadow:
			0 4rpx 16rpx rgba(0, 0, 0, 0.06),
			0 12rpx 40rpx rgba(0, 0, 0, 0.08),
			0 0 0 16rpx rgba(255, 255, 255, 0);
	}
}

.qrcode-inner {
	width: 316rpx;
	height: 316rpx;
	background: #fff;
	border-radius: 16rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	overflow: hidden;
}

.qrcode-image {
	width: 300rpx;
	height: 300rpx;
}

.qrcode-placeholder {
	color: $text-muted;
	font-size: $font-size-sm;
}

// 失效遮罩
.qrcode-expired-mask {
	position: absolute;
	inset: 0;
	background: rgba(255, 255, 255, 0.85);
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 32rpx;
	backdrop-filter: blur(4px);
}

.qrcode-expired-text {
	font-size: 36rpx;
	color: $text-muted;
	font-weight: $font-weight-semibold;
}

.qrcode-card--expired .qrcode-image {
	filter: grayscale(100%) opacity(0.4);
}

// 二维码提示
.qrcode-tip {
	font-size: $font-size-sm;
	color: rgba(255, 255, 255, 0.85);
	margin-bottom: $spacing-md;
}

// 预约简要信息
.appointment-brief {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: $spacing-xs;
}

.brief-date {
	font-size: $font-size-base;
	color: #fff;
	font-weight: $font-weight-medium;
}

.brief-dept {
	font-size: $font-size-lg;
	color: #fff;
	font-weight: $font-weight-semibold;
	background: rgba(255, 255, 255, 0.2);
	padding: 8rpx 24rpx;
	border-radius: $radius-full;
}

// 详情卡片
.detail-card {
	background: $bg-card;
	border-radius: $radius-lg;
	margin: -48rpx $spacing-lg $spacing-md;
	padding: $spacing-md $spacing-lg;
	box-shadow:
		0 4rpx 12rpx rgba(30, 58, 95, 0.04),
		0 8rpx 24rpx rgba(30, 58, 95, 0.08);
	position: relative;
	z-index: 10;
	animation: slideUpFade 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes slideUpFade {
	from {
		opacity: 0;
		transform: translateY(40rpx);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

.detail-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: $spacing-md 0;
	border-bottom: 2rpx solid $border-color-light;

	&:last-child {
		border-bottom: none;
	}
}

.detail-label {
	font-size: $font-size-base;
	color: $text-muted;
	flex-shrink: 0;
}

.detail-value {
	font-size: $font-size-base;
	color: $text-primary;
	font-weight: $font-weight-medium;
	text-align: right;
	flex: 1;
	margin-left: $spacing-md;
	word-break: break-all;

	&--highlight {
		color: $color-primary;
	}
}

// 温馨提示卡片
.tips-card {
	background: $bg-elevated;
	border-radius: $radius-lg;
	margin: 0 $spacing-lg $spacing-md;
	padding: $spacing-lg;
	animation: slideUpFade 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s backwards;
}

.tips-header {
	display: flex;
	align-items: center;
	margin-bottom: $spacing-md;
}

.tips-icon {
	width: 36rpx;
	height: 36rpx;
	background: linear-gradient(135deg, $color-warning 0%, #FBBF24 100%);
	border-radius: 50%;
	margin-right: $spacing-sm;
	position: relative;

	&::before {
		content: '!';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		color: #fff;
		font-size: 24rpx;
		font-weight: bold;
	}
}

.tips-title {
	font-size: $font-size-base;
	font-weight: $font-weight-semibold;
	color: $text-primary;
}

.tips-list {
	display: flex;
	flex-direction: column;
	gap: $spacing-sm;
}

.tips-item {
	display: flex;
	align-items: flex-start;
}

.tips-dot {
	color: $text-muted;
	margin-right: $spacing-xs;
	line-height: 1.6;
}

.tips-text {
	font-size: $font-size-sm;
	color: $text-secondary;
	line-height: 1.6;
}

// 底部占位
.bottom-placeholder {
	height: calc(140rpx + env(safe-area-inset-bottom));
}

// 底部操作栏
.bottom-bar {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	display: flex;
	gap: $spacing-md;
	padding: $spacing-md $spacing-lg;
	padding-bottom: calc(#{$spacing-md} + env(safe-area-inset-bottom));
	background: rgba(255, 255, 255, 0.95);
	backdrop-filter: blur(20px) saturate(180%);
	border-top: 1rpx solid rgba(0, 0, 0, 0.05);
	z-index: 100;
}

.btn-secondary {
	flex: 1;
	height: 88rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: transparent;
	border: 2rpx solid $border-color;
	border-radius: $radius-lg;
	color: $text-secondary;
	font-size: $font-size-lg;
	transition: all 0.25s ease;

	&:active {
		background: $bg-elevated;
		transform: scale(0.98);
	}
}

.btn-primary {
	flex: 1;
	height: 88rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: $spacing-xs;
	background: linear-gradient(135deg, $color-primary 0%, $color-primary-light 100%);
	border-radius: $radius-lg;
	color: #fff;
	font-size: $font-size-lg;
	font-weight: $font-weight-semibold;
	box-shadow: 0 8rpx 24rpx rgba(30, 58, 95, 0.25);
	position: relative;
	overflow: hidden;
	transition: all 0.25s ease;

	&:active {
		transform: scale(0.98);
	}

	&--full {
		flex: 1;
	}
}

.nav-icon {
	width: 32rpx;
	height: 32rpx;
	position: relative;

	&::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%) rotate(-45deg);
		width: 0;
		height: 0;
		border-left: 10rpx solid transparent;
		border-right: 10rpx solid transparent;
		border-bottom: 16rpx solid #fff;
	}

	&::after {
		content: '';
		position: absolute;
		bottom: 2rpx;
		left: 50%;
		transform: translateX(-50%);
		width: 4rpx;
		height: 12rpx;
		background: #fff;
		border-radius: 2rpx;
	}
}

// 弹窗
.dialog-mask {
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
	animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
	from { opacity: 0; }
	to { opacity: 1; }
}

.dialog {
	width: 560rpx;
	background: $bg-card;
	border-radius: $radius-xl;
	padding: $spacing-xl $spacing-lg $spacing-lg;
	display: flex;
	flex-direction: column;
	align-items: center;
	animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes scaleIn {
	from {
		opacity: 0;
		transform: scale(0.8);
	}
	to {
		opacity: 1;
		transform: scale(1);
	}
}

.dialog__icon {
	width: 80rpx;
	height: 80rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: $spacing-md;

	&--warning {
		background: linear-gradient(135deg, $color-warning 0%, #FBBF24 100%);
	}
}

.warning-icon {
	position: relative;
	width: 8rpx;
	height: 32rpx;
	background: #fff;
	border-radius: 4rpx;

	&::after {
		content: '';
		position: absolute;
		bottom: -14rpx;
		left: 50%;
		transform: translateX(-50%);
		width: 8rpx;
		height: 8rpx;
		background: #fff;
		border-radius: 50%;
	}
}

.dialog__title {
	font-size: $font-size-lg;
	font-weight: $font-weight-semibold;
	color: $text-primary;
	margin-bottom: $spacing-sm;
}

.dialog__content {
	font-size: $font-size-base;
	color: $text-secondary;
	text-align: center;
	margin-bottom: $spacing-xl;
}

.dialog__buttons {
	display: flex;
	gap: $spacing-md;
	width: 100%;
}

.dialog__btn {
	flex: 1;
	height: 80rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: $radius-md;
	font-size: $font-size-base;
	font-weight: $font-weight-medium;
	transition: all 0.25s ease;

	&--cancel {
		background: $bg-elevated;
		color: $text-secondary;
	}

	&--confirm {
		background: linear-gradient(135deg, $color-error 0%, #F87171 100%);
		color: #fff;
	}

	&:active {
		transform: scale(0.98);
	}
}

// ========== 深色模式 ==========
.page--dark {
	background: $dark-bg-base;

	.navbar {
		&__back-icon {
			border-color: $dark-text-primary;
		}

		&__title {
			color: $dark-text-primary;
		}
	}

	.status-section--pending {
		background: linear-gradient(180deg, #059669 0%, #10B981 100%);
	}

	.status-section--inactive {
		background: linear-gradient(180deg, #4B5563 0%, #6B7280 100%);
	}

	.qrcode-card {
		background: $dark-bg-card;
	}

	.qrcode-inner {
		background: #fff; // 保持白色确保二维码可识别
	}

	.qrcode-expired-mask {
		background: rgba(22, 27, 34, 0.85);
	}

	.qrcode-expired-text {
		color: $dark-text-muted;
	}

	.detail-card {
		background: $dark-bg-card;
		box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.3);
	}

	.detail-item {
		border-bottom-color: $dark-border-color;
	}

	.detail-label {
		color: $dark-text-muted;
	}

	.detail-value {
		color: $dark-text-primary;

		&--highlight {
			color: $dark-color-primary;
		}
	}

	.tips-card {
		background: $dark-bg-elevated;
	}

	.tips-title {
		color: $dark-text-primary;
	}

	.tips-dot {
		color: $dark-text-muted;
	}

	.tips-text {
		color: $dark-text-secondary;
	}

	.bottom-bar {
		background: rgba(22, 27, 34, 0.95);
		border-top-color: $dark-border-color;
	}

	.btn-secondary {
		border-color: $dark-border-color;
		color: $dark-text-secondary;

		&:active {
			background: $dark-bg-elevated;
		}
	}

	.btn-primary {
		background: linear-gradient(135deg, $dark-color-primary 0%, lighten($dark-color-primary, 10%) 100%);
	}

	.dialog {
		background: $dark-bg-card;
	}

	.dialog__title {
		color: $dark-text-primary;
	}

	.dialog__content {
		color: $dark-text-secondary;
	}

	.dialog__btn--cancel {
		background: $dark-bg-elevated;
		color: $dark-text-secondary;
	}
}
</style>
