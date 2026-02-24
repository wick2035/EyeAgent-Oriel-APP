<template>
	<view class="page" :class="{ 'page--dark': isDark }">
		<!-- 固定头部 -->
		<view class="fixed-header">
			<view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
			<view class="navbar">
				<view class="navbar__back" @click="goBack">
					<view class="back-icon"></view>
				</view>
				<text class="navbar__title">手术进度</text>
				<view class="navbar__placeholder"></view>
			</view>
		</view>

		<!-- 头部占位 -->
		<view class="header-placeholder" :style="{ height: (statusBarHeight + 44) + 'px' }"></view>

		<!-- 加载状态 -->
		<view v-if="loading && !initialized" class="loading-container">
			<view class="loading-spinner"></view>
			<text class="loading-text">加载中...</text>
		</view>

		<!-- 空状态 -->
		<view v-else-if="surgeries.length === 0" class="empty-state">
			<view class="empty-icon">
				<view class="empty-eye">
					<view class="empty-eye__pupil"></view>
					<view class="empty-eye__highlight"></view>
				</view>
			</view>
			<text class="empty-title">暂无手术记录</text>
			<text class="empty-desc">您目前没有安排的手术</text>
		</view>

		<!-- 手术列表 -->
		<scroll-view v-else class="surgery-list" scroll-y>
			<view v-for="(group, groupIndex) in groupedSurgeries" :key="group.key" class="surgery-group">
				<view class="group-header">
					<text class="group-title">{{ group.label }}</text>
					<view class="group-count">{{ group.items.length }}</view>
				</view>

				<view v-for="(surgery, index) in group.items"
				      :key="surgery.id"
				      class="surgery-card"
				      :class="[`surgery-card--${surgery.status.toLowerCase()}`]"
				      :style="{ animationDelay: (groupIndex * 0.1 + index * 0.08) + 's' }"
				      @click="goToDetail(surgery)">
					<!-- 卡片内容 -->
					<view class="card-content">
						<!-- 头部：标题 + 状态灯 -->
						<view class="card-header">
							<text class="surgery-name">{{ surgery.surgeryName }}</text>
							<view class="status-light"
							      :class="{ 'status-light--pulse': isActiveStatus(surgery.status) }"
							      :style="{ background: getStatusColor(surgery.status).primary }">
							</view>
						</view>

						<!-- 医院和医生信息 -->
						<view class="card-meta">
							<text class="hospital-name">{{ surgery.hospitalName }}</text>
							<text class="doctor-name">{{ surgery.doctorName }}</text>
						</view>

						<!-- 当前阶段 -->
						<view class="card-phase">
							<view class="phase-tag" :style="{ background: getStatusColor(surgery.status).bg, color: getStatusColor(surgery.status).primary }">
								{{ getCurrentPhaseName(surgery) }}
							</view>
							<text class="surgery-date">{{ formatSurgeryDate(surgery.scheduledDate) }}</text>
						</view>

						<!-- 进度条 -->
						<view class="progress-track">
							<view class="progress-fill" :style="{ width: surgery.overallProgress + '%', background: getStatusColor(surgery.status).primary }">
								<view v-if="isActiveStatus(surgery.status)" class="progress-shimmer"></view>
							</view>
						</view>

						<!-- 下次事件 -->
						<view class="next-event" v-if="getNextEventText(surgery)">
							<view class="event-dot" :style="{ background: getStatusColor(surgery.status).primary }"></view>
							<text class="event-text">{{ getNextEventText(surgery) }}</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 底部安全区 -->
			<view class="safe-area-bottom"></view>
		</scroll-view>
	</view>
</template>

<script>
import { isDarkMode } from '@/store/theme.js'
import {
	getSurgeryState,
	fetchSurgeryList,
	getGroupedSurgeries,
	getStatusText,
	formatDate,
	getDaysUntilSurgery,
	getNextEvent,
	STATUS_COLORS
} from '@/store/surgery.js'

export default {
	data() {
		return {
			statusBarHeight: 44
		}
	},
	computed: {
		isDark() {
			return isDarkMode()
		},
		surgeryState() {
			return getSurgeryState()
		},
		loading() {
			return this.surgeryState.loading
		},
		initialized() {
			return this.surgeryState.initialized
		},
		surgeries() {
			return this.surgeryState.surgeries
		},
		groupedSurgeries() {
			return getGroupedSurgeries()
		}
	},
	onLoad() {
		this.getStatusBarHeight()
		this.loadData()
	},
	methods: {
		getStatusBarHeight() {
			const sysInfo = uni.getSystemInfoSync()
			this.statusBarHeight = sysInfo.statusBarHeight || 44
		},
		async loadData() {
			await fetchSurgeryList()
		},
		goBack() {
			uni.navigateBack()
		},
		goToDetail(surgery) {
			uni.setStorageSync('currentSurgeryId', surgery.id)
			uni.navigateTo({
				url: '/pages/surgery/surgery-detail?id=' + surgery.id
			})
		},
		getStatusColor(status) {
			return STATUS_COLORS[status] || STATUS_COLORS.PRE_OP
		},
		isActiveStatus(status) {
			return ['PRE_OP', 'IN_OPERATION', 'POST_OP'].includes(status)
		},
		getCurrentPhaseName(surgery) {
			if (surgery.phases && surgery.phases.length > 0) {
				const currentPhase = surgery.phases.find(p => p.status === 'IN_PROGRESS')
				if (currentPhase) return currentPhase.name
			}
			return getStatusText(surgery.status)
		},
		formatSurgeryDate(dateStr) {
			const daysInfo = getDaysUntilSurgery(dateStr)
			if (!daysInfo) return formatDate(dateStr, 'date')

			if (daysInfo.isPast) {
				return formatDate(dateStr, 'date')
			}
			return daysInfo.text
		},
		getNextEventText(surgery) {
			const event = getNextEvent(surgery)
			if (!event) {
				// 如果已完成，显示完成日期
				if (surgery.status === 'COMPLETED') {
					return '已完成'
				}
				return null
			}

			if (event.type === 'surgery') {
				const daysInfo = getDaysUntilSurgery(event.date)
				if (daysInfo) {
					return `手术 ${daysInfo.text}`
				}
			}

			return `下一步: ${event.name}`
		}
	}
}
</script>

<style lang="scss" scoped>
.page {
	min-height: 100vh;
	background: $bg-base;

	&--dark {
		background: $dark-bg-base;
	}
}

.fixed-header {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	z-index: 100;
	background: $bg-base;

	.page--dark & {
		background: $dark-bg-base;
	}
}

.status-bar {
	width: 100%;
}

.navbar {
	display: flex;
	align-items: center;
	height: 88rpx;
	padding: 0 $spacing-md;

	&__back {
		width: 72rpx;
		height: 72rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	&__title {
		flex: 1;
		text-align: center;
		font-size: $font-size-lg;
		font-weight: $font-weight-semibold;
		color: $text-primary;

		.page--dark & {
			color: $dark-text-primary;
		}
	}

	&__placeholder {
		width: 72rpx;
	}
}

.back-icon {
	width: 20rpx;
	height: 20rpx;
	border-left: 4rpx solid $text-primary;
	border-bottom: 4rpx solid $text-primary;
	transform: rotate(45deg);

	.page--dark & {
		border-color: $dark-text-primary;
	}
}

.header-placeholder {
	width: 100%;
}

// 加载状态
.loading-container {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding-top: 200rpx;
}

.loading-spinner {
	width: 64rpx;
	height: 64rpx;
	border: 4rpx solid rgba(102, 126, 234, 0.2);
	border-top-color: #667EEA;
	border-radius: 50%;
	animation: spin 0.8s linear infinite;
}

.loading-text {
	margin-top: $spacing-md;
	font-size: $font-size-sm;
	color: $text-muted;
}

// 空状态
.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding-top: 200rpx;
}

.empty-icon {
	width: 160rpx;
	height: 160rpx;
	background: rgba(102, 126, 234, 0.08);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: $spacing-lg;
}

.empty-eye {
	width: 80rpx;
	height: 44rpx;
	border: 4rpx solid #667EEA;
	border-radius: 70% 70% 70% 70% / 100% 100% 100% 100%;
	position: relative;

	&__pupil {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 24rpx;
		height: 24rpx;
		background: #667EEA;
		border-radius: 50%;
		opacity: 0.5;
	}

	&__highlight {
		position: absolute;
		top: 30%;
		left: 55%;
		width: 8rpx;
		height: 8rpx;
		background: #fff;
		border-radius: 50%;
	}
}

.empty-title {
	font-size: $font-size-lg;
	font-weight: $font-weight-semibold;
	color: $text-primary;
	margin-bottom: $spacing-xs;

	.page--dark & {
		color: $dark-text-primary;
	}
}

.empty-desc {
	font-size: $font-size-sm;
	color: $text-muted;

	.page--dark & {
		color: $dark-text-muted;
	}
}

// 手术列表
.surgery-list {
	height: calc(100vh - var(--header-height, 132rpx));
}

.surgery-group {
	margin-bottom: $spacing-lg;
}

.group-header {
	display: flex;
	align-items: center;
	margin-bottom: $spacing-sm;
	padding: $spacing-md $spacing-lg;
}

.group-title {
	font-size: $font-size-sm;
	font-weight: $font-weight-medium;
	color: $text-secondary;

	.page--dark & {
		color: $dark-text-secondary;
	}
}

.group-count {
	margin-left: $spacing-xs;
	padding: 2rpx 12rpx;
	background: rgba(102, 126, 234, 0.1);
	border-radius: $radius-full;
	font-size: $font-size-xs;
	color: #667EEA;
}

// 手术卡片
.surgery-card {
	margin: 0 $spacing-lg $spacing-md;
	background: $bg-card;
	border-radius: $radius-lg;
	box-shadow: $shadow-sm;
	overflow: hidden;
	animation: cardFadeIn 0.5s ease-out backwards;

	.page--dark & {
		background: $dark-bg-card;
	}
}

@keyframes cardFadeIn {
	from {
		opacity: 0;
		transform: translateY(20rpx);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

.card-content {
	padding: $spacing-md;
}

.card-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: $spacing-xs;
}

.surgery-name {
	font-size: $font-size-lg;
	font-weight: $font-weight-semibold;
	color: $text-primary;
	flex: 1;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;

	.page--dark & {
		color: $dark-text-primary;
	}
}

.status-light {
	width: 16rpx;
	height: 16rpx;
	border-radius: 50%;
	margin-left: $spacing-sm;
	flex-shrink: 0;

	&--pulse {
		animation: statusPulse 2s ease-in-out infinite;
	}
}

@keyframes statusPulse {
	0%, 100% {
		opacity: 1;
		transform: scale(1);
		box-shadow: 0 0 0 0 currentColor;
	}
	50% {
		opacity: 0.7;
		transform: scale(1.1);
		box-shadow: 0 0 0 8rpx transparent;
	}
}

.card-meta {
	display: flex;
	align-items: center;
	margin-bottom: $spacing-sm;
	overflow: hidden;
}

.hospital-name {
	font-size: $font-size-sm;
	color: $text-secondary;
	margin-right: $spacing-md;
	flex-shrink: 0;
	max-width: 50%;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;

	.page--dark & {
		color: $dark-text-secondary;
	}
}

.doctor-name {
	font-size: $font-size-xs;
	color: $text-muted;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;

	.page--dark & {
		color: $dark-text-muted;
	}
}

.card-phase {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: $spacing-sm;
}

.phase-tag {
	padding: 4rpx 16rpx;
	border-radius: $radius-sm;
	font-size: $font-size-xs;
	font-weight: $font-weight-medium;
}

.surgery-date {
	font-size: $font-size-xs;
	color: $text-muted;

	.page--dark & {
		color: $dark-text-muted;
	}
}

// 进度条
.progress-track {
	height: 8rpx;
	background: rgba(0, 0, 0, 0.05);
	border-radius: $radius-full;
	overflow: hidden;
	margin-bottom: $spacing-sm;

	.page--dark & {
		background: rgba(255, 255, 255, 0.08);
	}
}

.progress-fill {
	height: 100%;
	border-radius: $radius-full;
	transition: width 0.5s ease, background 0.3s ease;
	position: relative;
	overflow: hidden;
}

.progress-shimmer {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: linear-gradient(
		90deg,
		transparent,
		rgba(255, 255, 255, 0.4),
		transparent
	);
	animation: shimmer 2s infinite;
}

@keyframes shimmer {
	0% {
		transform: translateX(-100%);
	}
	100% {
		transform: translateX(100%);
	}
}

// 下次事件
.next-event {
	display: flex;
	align-items: center;
}

.event-dot {
	width: 8rpx;
	height: 8rpx;
	border-radius: 50%;
	margin-right: $spacing-xs;
}

.event-text {
	font-size: $font-size-xs;
	color: $text-secondary;

	.page--dark & {
		color: $dark-text-secondary;
	}
}


// 底部安全区
.safe-area-bottom {
	height: calc(40rpx + env(safe-area-inset-bottom));
}

// 动画
@keyframes spin {
	to {
		transform: rotate(360deg);
	}
}
</style>
