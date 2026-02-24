<template>
	<view class="page" :class="{ 'page--dark': isDark }">
		<!-- 固定头部 -->
		<view class="fixed-header">
			<view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
			<view class="navbar">
				<view class="navbar__back" @click="goBack">
					<view class="back-icon"></view>
				</view>
				<text class="navbar__title">{{ surgery ? surgery.surgeryName : '手术详情' }}</text>
				<view class="navbar__placeholder"></view>
			</view>
		</view>

		<!-- 头部占位 -->
		<view class="header-placeholder" :style="{ height: (statusBarHeight + 44) + 'px' }"></view>

		<!-- 加载状态 -->
		<view v-if="loading" class="loading-container">
			<view class="loading-spinner"></view>
		</view>

		<!-- 详情内容 -->
		<scroll-view v-else-if="surgery" class="content" scroll-y>
			<!-- 顶部信息区 -->
			<view class="surgery-info-header">
				<!-- 计划时间 -->
				<view class="info-row">
					<text class="info-label">计划时间</text>
					<text class="info-value">{{ formatScheduledTime(surgery.scheduledDate) }}</text>
				</view>

				<!-- 手术台次 -->
				<view class="info-row">
					<text class="info-label">手术台次</text>
					<text class="info-value">{{ surgery.operatingRoom || '--' }}</text>
				</view>

				<!-- 主刀医生 -->
				<view class="info-row">
					<text class="info-label">主刀医生</text>
					<text class="info-value info-value--doctor">{{ surgery.doctorName || '--' }}{{ surgery.hospitalName ? ' · ' + surgery.hospitalName : '' }}</text>
				</view>

				<!-- 手术总用时 -->
				<view class="info-row info-row--last">
					<text class="info-label">手术总用时</text>
					<text class="info-value">{{ formatDuration(surgery) }}</text>
				</view>
			</view>

			<!-- 滚动提示 -->
			<view class="scroll-notice" :style="noticeStyle">
				<view class="scroll-notice__icon">
					<image
						class="notice-icon-img"
						src="@/static/tips.svg"
						mode="aspectFit"
						:style="{ filter: iconColorFilter }"
					/>
				</view>
				<view class="scroll-notice__wrapper">
					<view class="scroll-notice__content"
					      :class="{ 'no-transition': noTransition }"
					      :style="{ transform: `translateY(-${currentNoticeIndex * 40}rpx)` }">
						<text v-for="(text, idx) in loopNotices" :key="idx"
						      class="scroll-notice__text" :style="{ color: noticeColor }">
							{{ text }}
						</text>
					</view>
				</view>
			</view>

			<!-- 手术阶段时间线 -->
			<view class="timeline-section">
				<view class="section-header">
					<text class="section-title">手术阶段</text>
				</view>

				<view class="simple-timeline">
					<view v-for="(phase, index) in surgery.phases"
					      :key="phase.id"
					      class="timeline-step"
					      :class="`timeline-step--${phase.status.toLowerCase()}`">
						<!-- 连接线 -->
						<view v-if="index > 0" class="step-line" :class="{ 'step-line--active': phase.status !== 'PENDING' }"></view>

						<!-- 节点 -->
						<view class="step-node">
							<view v-if="phase.status === 'COMPLETED'" class="node-check"></view>
							<view v-else-if="phase.status === 'IN_PROGRESS'" class="node-dot"></view>
						</view>

						<!-- 内容 -->
						<view class="step-content">
							<text class="step-name">{{ phase.name }}</text>
							<text v-if="phase.startTime" class="step-time">{{ formatPhaseTime(phase.startTime) }}</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 术前须知（可折叠） -->
			<view v-if="surgery.preOpInstructions && surgery.preOpInstructions.length > 0" class="caution-section">
				<view class="collapsible-card collapsible-card--pre"
				      :class="{ 'collapsible-card--expanded': preOpExpanded }"
				      @click="preOpExpanded = !preOpExpanded">
					<view class="collapsible-header">
						<view class="header-left">
							<view class="caution-icon caution-icon--pre">
								<text class="caution-icon-text">!</text>
							</view>
							<text class="caution-title">术前须知</text>
							<text class="item-count">{{ surgery.preOpInstructions.length }}项</text>
						</view>
						<view class="expand-arrow" :class="{ 'expand-arrow--up': preOpExpanded }"></view>
					</view>
					<view class="collapsible-content" v-show="preOpExpanded">
						<view v-for="(item, index) in surgery.preOpInstructions" :key="'pre-' + index" class="caution-item">
							<view class="caution-bullet"></view>
							<text class="caution-text">{{ item }}</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 术后注意（可折叠） -->
			<view v-if="surgery.postOpCautions && surgery.postOpCautions.length > 0" class="caution-section">
				<view class="collapsible-card collapsible-card--post"
				      :class="{ 'collapsible-card--expanded': postOpExpanded }"
				      @click="postOpExpanded = !postOpExpanded">
					<view class="collapsible-header">
						<view class="header-left">
							<view class="caution-icon caution-icon--post">
								<text class="caution-icon-text">i</text>
							</view>
							<text class="caution-title">术后注意事项</text>
							<text class="item-count">{{ surgery.postOpCautions.length }}项</text>
						</view>
						<view class="expand-arrow" :class="{ 'expand-arrow--up': postOpExpanded }"></view>
					</view>
					<view class="collapsible-content" v-show="postOpExpanded">
						<view v-for="(item, index) in surgery.postOpCautions" :key="'post-' + index" class="caution-item">
							<view class="caution-bullet caution-bullet--post"></view>
							<text class="caution-text">{{ item }}</text>
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
	fetchSurgeryDetail
} from '@/store/surgery.js'

export default {
	data() {
		return {
			statusBarHeight: 44,
			surgeryId: '',
			preOpExpanded: false,
			postOpExpanded: false,
			currentNoticeIndex: 0,
			noticeTimer: null,
			noTransition: false
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
		surgery() {
			return this.surgeryState.currentSurgery
		},
		currentNotices() {
			// 特殊阶段的自定义提示
			const specialNotices = {
				'术前准备': ['当前阶段：术前准备', '请按医嘱做好准备', '如有问题请联系医护'],
				'术后恢复(PACU)': ['当前阶段：术后恢复中', '患者正在恢复区', '请耐心等待通知'],
				'完成': ['手术已完成', '恢复顺利', '祝早日康复']
			}

			// 获取当前进行中的阶段
			const currentPhase = this.surgery?.phases?.find(p => p.status === 'IN_PROGRESS')
			const phaseName = currentPhase?.name

			// 如果是特殊阶段，返回自定义提示
			if (phaseName && specialNotices[phaseName]) {
				return specialNotices[phaseName]
			}

			// 其他阶段统一格式：当前阶段：xxx + 医生正在操作 + 请耐心等待
			if (phaseName) {
				return [`当前阶段：${phaseName}`, '医生正在操作', '请耐心等待']
			}

			// 已完成状态
			if (this.surgery?.status === 'COMPLETED') {
				return ['手术已完成', '恢复顺利', '祝早日康复']
			}

			// 默认（术前准备）
			return ['当前阶段：术前准备', '请按医嘱做好准备', '如有问题请联系医护']
		},
		// 无限循环用：末尾追加第一条，实现无缝衔接
		loopNotices() {
			const list = this.currentNotices
			return [...list, list[0]]
		},
		noticeColor() {
			const colors = {
				PRE_OP: '#3B82F6',
				IN_OPERATION: '#3FD2C2',
				POST_OP: '#14B8A6',
				COMPLETED: '#10B981'
			}
			return colors[this.surgery?.status] || colors.PRE_OP
		},
		noticeStyle() {
			const bgs = {
				PRE_OP: 'rgba(59, 130, 246, 0.08)',
				IN_OPERATION: 'rgba(63, 210, 194, 0.08)',
				POST_OP: 'rgba(20, 184, 166, 0.08)',
				COMPLETED: 'rgba(16, 185, 129, 0.08)'
			}
			return { background: bgs[this.surgery?.status] || bgs.PRE_OP }
		},
		// SVG图标颜色滤镜（将黑色转为目标颜色）
		iconColorFilter() {
			const filters = {
				// #3B82F6 蓝色
				PRE_OP: 'invert(42%) sepia(93%) saturate(1352%) hue-rotate(203deg) brightness(97%) contrast(96%)',
				// #3FD2C2 青绿色
				IN_OPERATION: 'invert(73%) sepia(42%) saturate(467%) hue-rotate(123deg) brightness(92%) contrast(89%)',
				// #14B8A6 薄荷绿
				POST_OP: 'invert(58%) sepia(65%) saturate(487%) hue-rotate(127deg) brightness(93%) contrast(89%)',
				// #10B981 医疗绿
				COMPLETED: 'invert(62%) sepia(43%) saturate(588%) hue-rotate(109deg) brightness(92%) contrast(88%)'
			}
			return filters[this.surgery?.status] || filters.PRE_OP
		}
	},
	onLoad(options) {
		this.getStatusBarHeight()
		this.surgeryId = options.id || uni.getStorageSync('currentSurgeryId')
		this.loadData()
	},
	onShow() {
		this.startNoticeScroll()
	},
	onHide() {
		this.stopNoticeScroll()
	},
	onUnload() {
		this.stopNoticeScroll()
	},
	methods: {
		getStatusBarHeight() {
			const sysInfo = uni.getSystemInfoSync()
			this.statusBarHeight = sysInfo.statusBarHeight || 44
		},
		startNoticeScroll() {
			this.stopNoticeScroll()
			this.noticeTimer = setInterval(() => {
				const len = this.currentNotices.length
				this.currentNoticeIndex++

				// 当滚动到末尾的"复制项"（显示第一句）时
				// 等动画完成后，瞬间重置到真正的第一项
				if (this.currentNoticeIndex >= len) {
					setTimeout(() => {
						this.noTransition = true  // 禁用过渡
						this.currentNoticeIndex = 0  // 瞬移到开头
						// 下一帧恢复过渡
						setTimeout(() => {
							this.noTransition = false
						}, 50)
					}, 500)  // 等待滚动动画完成
				}
			}, 3000)
		},
		stopNoticeScroll() {
			if (this.noticeTimer) {
				clearInterval(this.noticeTimer)
				this.noticeTimer = null
			}
		},
		async loadData() {
			if (this.surgeryId) {
				await fetchSurgeryDetail(this.surgeryId)
			}
		},
		goBack() {
			uni.navigateBack()
		},
		formatScheduledTime(dateStr) {
			if (!dateStr) return ''
			const date = new Date(dateStr)
			const year = date.getFullYear()
			const month = (date.getMonth() + 1).toString().padStart(2, '0')
			const day = date.getDate().toString().padStart(2, '0')
			const hours = date.getHours().toString().padStart(2, '0')
			const minutes = date.getMinutes().toString().padStart(2, '0')
			return `${year}-${month}-${day} ${hours}:${minutes}`
		},
		formatPhaseTime(timeStr) {
			if (!timeStr) return ''
			const date = new Date(timeStr)
			const hours = date.getHours().toString().padStart(2, '0')
			const minutes = date.getMinutes().toString().padStart(2, '0')
			return `${hours}:${minutes}`
		},
		formatDuration(surgery) {
			// 未完成状态显示"暂未完成"
			if (surgery.status !== 'COMPLETED') {
				return '暂未完成'
			}
			// 从phases中找首阶段的startTime和末阶段的endTime计算
			const phases = surgery.phases || []
			const firstPhase = phases.find(p => p.startTime)
			const lastPhase = [...phases].reverse().find(p => p.endTime)
			if (!firstPhase || !lastPhase) {
				return '--'
			}
			const start = new Date(firstPhase.startTime)
			const end = new Date(lastPhase.endTime)
			const diffMs = end - start
			if (diffMs <= 0) return '--'
			const diffMins = Math.round(diffMs / 60000)
			if (diffMins < 60) {
				return `${diffMins}分钟`
			}
			const hours = Math.floor(diffMins / 60)
			const mins = diffMins % 60
			return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`
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
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		padding: 0 $spacing-sm;

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

.loading-container {
	display: flex;
	align-items: center;
	justify-content: center;
	padding-top: 300rpx;
}

.loading-spinner {
	width: 64rpx;
	height: 64rpx;
	border: 4rpx solid rgba(59, 130, 246, 0.2);
	border-top-color: #3B82F6;
	border-radius: 50%;
	animation: spin 0.8s linear infinite;
}

@keyframes spin {
	to { transform: rotate(360deg); }
}

.content {
	min-height: calc(100vh - 132rpx);
}

// 顶部信息区
.surgery-info-header {
	padding: $spacing-lg;
	background: $bg-card;
	margin: $spacing-md $spacing-lg;
	border-radius: $radius-lg;
	box-shadow: $shadow-sm;

	.page--dark & {
		background: $dark-bg-card;
	}
}

.info-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: $spacing-sm;
	padding-bottom: $spacing-sm;
	border-bottom: 1rpx solid $border-color-light;

	.page--dark & {
		border-bottom-color: $dark-border-color;
	}

	&--last {
		margin-bottom: 0;
		padding-bottom: 0;
		border-bottom: none;
	}
}

.info-label {
	font-size: $font-size-sm;
	color: $text-secondary;

	.page--dark & {
		color: $dark-text-secondary;
	}
}

.info-value {
	font-size: $font-size-sm;
	font-weight: $font-weight-semibold;
	color: $text-primary;
	flex-shrink: 0;

	.page--dark & {
		color: $dark-text-primary;
	}

	&--doctor {
		max-width: 60%;
		text-align: right;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		flex-shrink: 1;
	}
}

// 滚动提示 - Jobs级设计
.scroll-notice {
	margin: 0 $spacing-lg $spacing-md;
	border-radius: $radius-lg;
	padding: $spacing-sm $spacing-md;
	display: flex;
	align-items: center;
	height: 56rpx;

	&__icon {
		width: 40rpx;
		height: 32rpx;
		margin-right: $spacing-sm;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	&__wrapper {
		flex: 1;
		height: 40rpx;
		overflow: hidden;
	}

	&__content {
		transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);

		&.no-transition {
			transition: none;
		}
	}

	&__text {
		display: block;
		height: 40rpx;
		line-height: 40rpx;
		font-size: $font-size-sm;
		font-weight: $font-weight-medium;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
}

// 提示图标
.notice-icon-img {
	width: 36rpx;
	height: 28rpx;
}

// 时间线部分
.timeline-section {
	padding: 0 $spacing-lg $spacing-lg;
}

.section-header {
	margin-bottom: $spacing-md;
}

.section-title {
	font-size: $font-size-lg;
	font-weight: $font-weight-semibold;
	color: $text-primary;

	.page--dark & {
		color: $dark-text-primary;
	}
}

// 简洁时间线
.simple-timeline {
	background: $bg-card;
	border-radius: $radius-lg;
	padding: $spacing-md;
	box-shadow: $shadow-sm;

	.page--dark & {
		background: $dark-bg-card;
	}
}

.timeline-step {
	display: flex;
	align-items: center;
	position: relative;
	padding: $spacing-sm 0;

	&:first-child {
		padding-top: 0;
	}

	&:last-child {
		padding-bottom: 0;
	}

	&--completed {
		.step-node {
			background: #10B981;
		}
		.step-name {
			color: $text-primary;
			.page--dark & { color: $dark-text-primary; }
		}
		.step-time {
			color: #10B981;
		}
	}

	&--in_progress {
		.step-node {
			background: #3FD2C2;
			animation: nodeGlow 2s ease-in-out infinite;
		}
		.step-name {
			color: #3FD2C2;
			font-weight: $font-weight-semibold;
		}
		.step-time {
			color: #3FD2C2;
		}
	}

	&--pending {
		.step-node {
			background: transparent;
			border: 2rpx dashed $text-muted;
			.page--dark & { border-color: $dark-text-muted; }
		}
		.step-name {
			color: $text-muted;
			.page--dark & { color: $dark-text-muted; }
		}
	}
}

@keyframes nodeGlow {
	0%, 100% { box-shadow: 0 0 0 0 rgba(63, 210, 194, 0.4); }
	50% { box-shadow: 0 0 0 8rpx rgba(63, 210, 194, 0); }
}

// 连接线
.step-line {
	position: absolute;
	left: 13rpx;
	top: -$spacing-sm;
	width: 2rpx;
	height: $spacing-sm;
	background: $border-color-light;

	&--active {
		background: #10B981;
	}

	.page--dark & {
		background: $dark-border-color;
	}
}

// 节点
.step-node {
	width: 28rpx;
	height: 28rpx;
	border-radius: 50%;
	margin-right: $spacing-md;
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;

	.node-check {
		width: 10rpx;
		height: 14rpx;
		border-bottom: 3rpx solid #fff;
		border-right: 3rpx solid #fff;
		transform: rotate(45deg);
		margin-top: -4rpx;
	}

	.node-dot {
		width: 8rpx;
		height: 8rpx;
		background: #fff;
		border-radius: 50%;
	}
}

// 内容
.step-content {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.step-name {
	font-size: $font-size-base;
	color: $text-primary;

	.page--dark & {
		color: $dark-text-primary;
	}
}

.step-time {
	font-size: $font-size-sm;
	color: $text-muted;
	font-family: $font-family-mono;

	.page--dark & {
		color: $dark-text-muted;
	}
}

// 注意事项卡片（可折叠）
.caution-section {
	padding: 0 $spacing-lg $spacing-md;
}

.collapsible-card {
	background: $bg-card;
	border-radius: $radius-lg;
	padding: $spacing-md;
	box-shadow: $shadow-sm;

	.page--dark & {
		background: $dark-bg-card;
	}

	&--pre {
		border-left: 6rpx solid $color-warning;
	}

	&--post {
		border-left: 6rpx solid $color-info;
	}
}

.collapsible-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.header-left {
	display: flex;
	align-items: center;
}

.item-count {
	font-size: $font-size-xs;
	color: $text-muted;
	margin-left: $spacing-sm;

	.page--dark & {
		color: $dark-text-muted;
	}
}

.expand-arrow {
	width: 16rpx;
	height: 16rpx;
	border-right: 3rpx solid $text-muted;
	border-bottom: 3rpx solid $text-muted;
	transform: rotate(45deg);
	transition: transform 0.3s ease;

	&--up {
		transform: rotate(-135deg);
	}

	.page--dark & {
		border-color: $dark-text-muted;
	}
}

.collapsible-content {
	margin-top: $spacing-md;
	padding-top: $spacing-md;
	border-top: 1rpx solid $border-color-light;

	.page--dark & {
		border-top-color: $dark-border-color;
	}
}

.caution-icon {
	width: 40rpx;
	height: 40rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: $spacing-sm;

	&--pre {
		background: rgba(245, 158, 11, 0.15);
	}

	&--post {
		background: rgba(59, 130, 246, 0.15);
	}
}

.caution-icon-text {
	font-size: $font-size-base;
	font-weight: $font-weight-bold;

	.caution-icon--pre & {
		color: $color-warning;
	}

	.caution-icon--post & {
		color: $color-info;
	}
}

.caution-title {
	font-size: $font-size-base;
	font-weight: $font-weight-semibold;
	color: $text-primary;

	.page--dark & {
		color: $dark-text-primary;
	}
}

.caution-list {
	padding-left: $spacing-xs;
}

.caution-item {
	display: flex;
	align-items: flex-start;
	margin-bottom: $spacing-sm;

	&:last-child {
		margin-bottom: 0;
	}
}

.caution-bullet {
	width: 8rpx;
	height: 8rpx;
	border-radius: 50%;
	background: $color-warning;
	margin-top: 12rpx;
	margin-right: $spacing-sm;
	flex-shrink: 0;

	&--post {
		background: $color-info;
	}
}

.caution-text {
	font-size: $font-size-sm;
	color: $text-secondary;
	line-height: 1.6;

	.page--dark & {
		color: $dark-text-secondary;
	}
}

// 安全区
.safe-area-bottom {
	height: calc(40rpx + env(safe-area-inset-bottom));
}
</style>
