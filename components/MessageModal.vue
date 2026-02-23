<template>
	<view v-if="visible" class="modal-overlay" :class="{ 'modal-overlay--show': showAnimation, 'modal-overlay--dark': isDark }">
		<!-- 毛玻璃蒙层 -->
		<view class="modal-backdrop" @click="handleBackdropClick"></view>

		<!-- 弹窗主体 -->
		<view class="modal-container" :class="{ 'modal-container--show': showAnimation }">
			<!-- 顶部装饰渐变条 -->
			<view class="modal-header-bar" :class="`modal-header-bar--${type}`"></view>

			<!-- 关闭按钮 -->
			<view class="modal-close" @click="close">
				<view class="modal-close__icon"></view>
			</view>

			<!-- 类型图标容器 -->
			<view class="modal-icon" :class="`modal-icon--${type}`">
				<view class="modal-icon__inner">
					<!-- 系统通知图标 - 铃铛 -->
					<view v-if="type === 'system'" class="icon-system-anim"></view>
					<!-- 预约提醒图标 - 日历 -->
					<view v-else-if="type === 'reserve'" class="icon-reserve-anim"></view>
					<!-- 用药提醒图标 - 药瓶 -->
					<view v-else class="icon-medication-anim"></view>
				</view>
				<!-- 图标背景光晕动画 -->
				<view class="modal-icon__glow" :class="`modal-icon__glow--${type}`"></view>
			</view>

			<!-- 消息标题 -->
			<text class="modal-title">{{ title }}</text>

			<!-- 消息时间 -->
			<text v-if="time" class="modal-time">{{ time }}</text>

			<!-- 分隔线 -->
			<view class="modal-divider"></view>

			<!-- 消息内容 -->
			<scroll-view class="modal-content" scroll-y>
				<text class="modal-content__text">{{ content }}</text>
			</scroll-view>

			<!-- 底部操作区 -->
			<view class="modal-actions">
				<view v-if="showSecondaryAction" class="modal-btn modal-btn--secondary" @click="handleSecondary">
					<text class="modal-btn__text">{{ secondaryText }}</text>
				</view>
				<view class="modal-btn modal-btn--primary" :class="`modal-btn--${type}`" @click="handlePrimary">
					<text class="modal-btn__text modal-btn__text--primary">{{ primaryText }}</text>
					<view class="modal-btn__shimmer"></view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { isDarkMode } from '@/store/theme.js'

export default {
	name: 'MessageModal',
	props: {
		// 消息类型：system | reserve | medication
		type: {
			type: String,
			default: 'system'
		},
		title: {
			type: String,
			default: ''
		},
		content: {
			type: String,
			default: ''
		},
		time: {
			type: String,
			default: ''
		},
		primaryText: {
			type: String,
			default: '知道了'
		},
		secondaryText: {
			type: String,
			default: '查看详情'
		},
		showSecondaryAction: {
			type: Boolean,
			default: false
		},
		closeOnBackdrop: {
			type: Boolean,
			default: true
		}
	},
	data() {
		return {
			visible: false,
			showAnimation: false
		}
	},
	computed: {
		isDark() {
			return isDarkMode()
		}
	},
	methods: {
		// 显示弹窗
		show(options = {}) {
			// 支持传入参数覆盖 props
			if (options.type) this.type = options.type
			if (options.title) this.title = options.title
			if (options.content) this.content = options.content
			if (options.time) this.time = options.time

			this.visible = true
			// 添加触觉反馈
			// #ifdef APP-PLUS
			uni.vibrateShort({ type: 'light' })
			// #endif
			this.$nextTick(() => {
				setTimeout(() => {
					this.showAnimation = true
				}, 20)
			})
		},

		// 关闭弹窗
		close() {
			this.showAnimation = false
			setTimeout(() => {
				this.visible = false
				this.$emit('close')
			}, 300)
		},

		handleBackdropClick() {
			if (this.closeOnBackdrop) {
				this.close()
			}
		},

		handlePrimary() {
			this.$emit('confirm')
			this.close()
		},

		handleSecondary() {
			this.$emit('secondary')
		}
	}
}
</script>

<style lang="scss" scoped>
// ==================== 弹窗蒙层 ====================
.modal-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 10000;
	display: flex;
	align-items: center;
	justify-content: center;
	opacity: 0;
	visibility: hidden;
	transition: opacity 0.3s ease, visibility 0.3s ease;

	&--show {
		opacity: 1;
		visibility: visible;
	}
}

// ==================== 毛玻璃蒙层 ====================
.modal-backdrop {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(30, 58, 95, 0.4);
	backdrop-filter: blur(20px) saturate(180%);
	-webkit-backdrop-filter: blur(20px) saturate(180%);
}

.modal-overlay--dark .modal-backdrop {
	background: rgba(13, 17, 23, 0.75);
	backdrop-filter: blur(24px) saturate(150%);
}

// ==================== 弹窗主体容器 ====================
.modal-container {
	position: relative;
	width: 620rpx;
	max-width: 90vw;
	max-height: 80vh;
	background: $bg-card;
	border-radius: $radius-xl;
	overflow: hidden;
	box-shadow:
		0 24rpx 80rpx rgba(30, 58, 95, 0.25),
		0 8rpx 24rpx rgba(30, 58, 95, 0.15),
		inset 0 1rpx 0 rgba(255, 255, 255, 0.1);

	// 入场动画初始状态
	transform: scale(0.85) translateY(40rpx);
	opacity: 0;
	transition:
		transform 0.35s $ease-out-back,
		opacity 0.3s ease;

	&--show {
		transform: scale(1) translateY(0);
		opacity: 1;
	}
}

.modal-overlay--dark .modal-container {
	background: $dark-bg-card;
	box-shadow:
		0 24rpx 80rpx rgba(0, 0, 0, 0.5),
		0 8rpx 24rpx rgba(0, 0, 0, 0.3),
		inset 0 1rpx 0 rgba(255, 255, 255, 0.05);
}

// ==================== 顶部装饰渐变条 ====================
.modal-header-bar {
	height: 8rpx;
	border-radius: 4rpx 4rpx 0 0;

	&--system {
		background: linear-gradient(90deg, #3B82F6 0%, #60A5FA 50%, #93C5FD 100%);
	}
	&--reserve {
		background: linear-gradient(90deg, #10B981 0%, #34D399 50%, #6EE7B7 100%);
	}
	&--medication {
		background: linear-gradient(90deg, #F59E0B 0%, #FBBF24 50%, #FCD34D 100%);
	}
}

// ==================== 关闭按钮 ====================
.modal-close {
	position: absolute;
	top: 24rpx;
	right: 24rpx;
	width: 56rpx;
	height: 56rpx;
	border-radius: 50%;
	background: rgba(30, 58, 95, 0.06);
	display: flex;
	align-items: center;
	justify-content: center;
	transition:
		background 0.2s ease,
		transform 0.2s ease;
	z-index: 10;

	&:active {
		transform: scale(0.9);
		background: rgba(30, 58, 95, 0.12);
	}

	&__icon {
		width: 24rpx;
		height: 24rpx;
		position: relative;

		&::before,
		&::after {
			content: '';
			position: absolute;
			top: 50%;
			left: 50%;
			width: 24rpx;
			height: 3rpx;
			background: $text-secondary;
			border-radius: 2rpx;
			transition: background 0.2s ease;
		}

		&::before {
			transform: translate(-50%, -50%) rotate(45deg);
		}
		&::after {
			transform: translate(-50%, -50%) rotate(-45deg);
		}
	}
}

.modal-overlay--dark .modal-close {
	background: rgba(255, 255, 255, 0.08);

	&:active {
		background: rgba(255, 255, 255, 0.15);
	}

	.modal-close__icon::before,
	.modal-close__icon::after {
		background: $dark-text-secondary;
	}
}

// ==================== 类型图标 ====================
.modal-icon {
	width: 120rpx;
	height: 120rpx;
	margin: 48rpx auto 32rpx;
	border-radius: 50%;
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;

	&--system {
		background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.25) 100%);
	}
	&--reserve {
		background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.25) 100%);
	}
	&--medication {
		background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.25) 100%);
	}

	&__inner {
		width: 56rpx;
		height: 56rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 2;
	}

	// 光晕动画效果
	&__glow {
		position: absolute;
		top: -10rpx;
		left: -10rpx;
		right: -10rpx;
		bottom: -10rpx;
		border-radius: 50%;
		opacity: 0;
		animation: iconGlow 2s ease-in-out infinite;

		&--system {
			background: radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%);
		}
		&--reserve {
			background: radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, transparent 70%);
		}
		&--medication {
			background: radial-gradient(circle, rgba(245, 158, 11, 0.3) 0%, transparent 70%);
		}
	}
}

@keyframes iconGlow {
	0%, 100% {
		opacity: 0;
		transform: scale(0.8);
	}
	50% {
		opacity: 1;
		transform: scale(1);
	}
}

// ==================== 图标动画样式 ====================

// 系统通知图标 - 铃铛摇晃动画
.icon-system-anim {
	width: 48rpx;
	height: 52rpx;
	border: 4rpx solid $color-info;
	border-radius: 24rpx 24rpx 8rpx 8rpx;
	position: relative;
	animation: bellSwing 2s ease-in-out infinite;
	transform-origin: top center;

	&::before {
		content: '';
		position: absolute;
		top: -12rpx;
		left: 50%;
		transform: translateX(-50%);
		width: 10rpx;
		height: 10rpx;
		background: $color-info;
		border-radius: 50%;
	}

	&::after {
		content: '';
		position: absolute;
		bottom: -12rpx;
		left: 50%;
		transform: translateX(-50%);
		width: 18rpx;
		height: 10rpx;
		background: $color-info;
		border-radius: 0 0 10rpx 10rpx;
	}
}

@keyframes bellSwing {
	0%, 100% { transform: rotate(0deg); }
	10% { transform: rotate(14deg); }
	20% { transform: rotate(-12deg); }
	30% { transform: rotate(10deg); }
	40% { transform: rotate(-8deg); }
	50% { transform: rotate(6deg); }
	60% { transform: rotate(0deg); }
}

// 预约提醒图标 - 日历脉冲动画
.icon-reserve-anim {
	width: 48rpx;
	height: 56rpx;
	border: 4rpx solid $color-success;
	border-radius: 8rpx;
	position: relative;

	&::before {
		content: '';
		position: absolute;
		top: 14rpx;
		left: 0;
		right: 0;
		height: 4rpx;
		background: $color-success;
	}

	&::after {
		content: '';
		position: absolute;
		top: 28rpx;
		left: 10rpx;
		width: 14rpx;
		height: 14rpx;
		background: $color-success;
		border-radius: 4rpx;
		animation: calendarPulse 1.5s ease-in-out infinite;
	}
}

@keyframes calendarPulse {
	0%, 100% {
		transform: scale(1);
		opacity: 1;
	}
	50% {
		transform: scale(1.2);
		opacity: 0.7;
	}
}

// 用药提醒图标 - 药瓶晃动
.icon-medication-anim {
	width: 40rpx;
	height: 52rpx;
	border: 4rpx solid $color-warning;
	border-radius: 10rpx 10rpx 6rpx 6rpx;
	position: relative;
	animation: pillShake 2s ease-in-out infinite;

	&::before {
		content: '';
		position: absolute;
		top: -12rpx;
		left: 50%;
		transform: translateX(-50%);
		width: 26rpx;
		height: 12rpx;
		background: $color-warning;
		border-radius: 6rpx 6rpx 0 0;
	}

	&::after {
		content: '+';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		font-size: 28rpx;
		color: $color-warning;
		font-weight: bold;
	}
}

@keyframes pillShake {
	0%, 100% { transform: rotate(0deg); }
	25% { transform: rotate(-10deg); }
	75% { transform: rotate(10deg); }
}

// ==================== 标题样式 ====================
.modal-title {
	display: block;
	font-size: $font-size-xl;
	font-weight: $font-weight-semibold;
	color: $text-primary;
	text-align: center;
	padding: 0 $spacing-xl;
	line-height: $line-height-tight;
}

.modal-overlay--dark .modal-title {
	color: $dark-text-primary;
}

// ==================== 时间样式 ====================
.modal-time {
	font-size: $font-size-sm;
	color: $text-muted;
	text-align: center;
	margin-top: $spacing-xs;
	display: block;
}

.modal-overlay--dark .modal-time {
	color: $dark-text-muted;
}

// ==================== 分隔线 ====================
.modal-divider {
	height: 1rpx;
	background: linear-gradient(90deg,
		transparent 0%,
		$border-color 20%,
		$border-color 80%,
		transparent 100%
	);
	margin: $spacing-lg $spacing-xl;
}

.modal-overlay--dark .modal-divider {
	background: linear-gradient(90deg,
		transparent 0%,
		$dark-border-color 20%,
		$dark-border-color 80%,
		transparent 100%
	);
}

// ==================== 内容区域 ====================
.modal-content {
	max-height: 320rpx;
	padding: 0 $spacing-xl;
	margin-bottom: $spacing-lg;

	&__text {
		display: block;
		font-size: $font-size-base;
		color: $text-secondary;
		line-height: $line-height-relaxed;
		text-align: justify;
		word-break: break-word;
	}
}

.modal-overlay--dark .modal-content__text {
	color: $dark-text-secondary;
}

// ==================== 底部操作按钮 ====================
.modal-actions {
	display: flex;
	padding: $spacing-md $spacing-lg $spacing-xl;
	gap: $spacing-md;
}

.modal-btn {
	flex: 1;
	height: 96rpx;
	border-radius: $radius-lg;
	display: flex;
	align-items: center;
	justify-content: center;
	position: relative;
	overflow: hidden;
	transition:
		transform 0.2s ease,
		box-shadow 0.2s ease;

	&:active {
		transform: scale(0.96);
	}

	&--secondary {
		background: $bg-elevated;
	}

	&--primary {
		// 渐变按钮基础样式
	}

	&--system.modal-btn--primary {
		background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
		box-shadow: 0 8rpx 24rpx rgba(59, 130, 246, 0.35);
	}

	&--reserve.modal-btn--primary {
		background: linear-gradient(135deg, #10B981 0%, #059669 100%);
		box-shadow: 0 8rpx 24rpx rgba(16, 185, 129, 0.35);
	}

	&--medication.modal-btn--primary {
		background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
		box-shadow: 0 8rpx 24rpx rgba(245, 158, 11, 0.35);
	}

	&__text {
		font-size: $font-size-base;
		font-weight: $font-weight-medium;
		color: $text-secondary;
		position: relative;
		z-index: 2;

		&--primary {
			color: #FFFFFF;
		}
	}

	&__shimmer {
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(
			90deg,
			transparent 0%,
			rgba(255, 255, 255, 0.25) 50%,
			transparent 100%
		);
		animation: btnShimmer 3s ease-in-out infinite;
	}
}

@keyframes btnShimmer {
	0% { left: -100%; }
	50%, 100% { left: 100%; }
}

// 深色模式按钮
.modal-overlay--dark {
	.modal-btn--secondary {
		background: $dark-bg-elevated;
	}

	.modal-btn__text {
		color: $dark-text-secondary;
	}
}
</style>
