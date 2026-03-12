<template>
	<view
		v-if="visible"
		class="toast-wrapper"
		:class="[
			`toast-wrapper--${position}`,
			{ 'toast-wrapper--dark': isDark }
		]"
	>
		<view
			class="toast-container"
			:class="[
				`toast-container--${currentType}`,
				{ 'toast-container--show': showAnimation }
			]"
		>
			<!-- 图标区域 -->
			<view class="toast-icon" :class="`toast-icon--${currentType}`">
				<!-- 成功图标 - 带绘制动画的对勾 -->
				<view v-if="currentType === 'success'" class="icon-success-animated">
					<view class="checkmark">
						<view class="checkmark__circle"></view>
						<view class="checkmark__check"></view>
					</view>
				</view>

				<!-- 失败图标 - 带动画的叉号 -->
				<view v-else-if="currentType === 'error'" class="icon-error-animated">
					<view class="crossmark">
						<view class="crossmark__circle"></view>
						<view class="crossmark__cross"></view>
					</view>
				</view>

				<!-- 警告图标 -->
				<view v-else-if="currentType === 'warning'" class="icon-warning-animated"></view>

				<!-- 信息图标 -->
				<view v-else class="icon-info-animated"></view>
			</view>

			<!-- 消息文本 -->
			<text class="toast-message">{{ message }}</text>
		</view>
	</view>
</template>

<script>
import { isDarkMode } from '@/store/theme.js'

export default {
	name: 'CustomToast',
	data() {
		return {
			visible: false,
			showAnimation: false,
			currentType: 'success', // success | error | warning | info
			message: '',
			position: 'center', // top | center | bottom
			duration: 2000,
			timer: null
		}
	},
	computed: {
		isDark() {
			return isDarkMode()
		}
	},
	methods: {
		/**
		 * 显示 Toast
		 * @param {Object} options - { type, message, position, duration }
		 */
		show(options) {
			// 清除之前的定时器
			if (this.timer) {
				clearTimeout(this.timer)
				this.timer = null
			}

			// 如果已经显示，先隐藏再显示
			if (this.visible) {
				this.showAnimation = false
				setTimeout(() => {
					this.visible = false
					this.$nextTick(() => {
						this._doShow(options)
					})
				}, 150)
			} else {
				this._doShow(options)
			}
		},

		_doShow(options) {
			// 设置参数
			this.currentType = options.type || 'success'
			this.message = options.message || ''
			this.position = options.position || 'center'
			this.duration = options.duration ?? 2000

			// 显示
			this.visible = true

			// 触觉反馈
			// #ifdef APP-PLUS
			if (this.currentType === 'success') {
				uni.vibrateShort({ type: 'light' })
			} else if (this.currentType === 'error') {
				uni.vibrateShort({ type: 'medium' })
			}
			// #endif

			this.$nextTick(() => {
				setTimeout(() => {
					this.showAnimation = true
				}, 10)
			})

			// 自动关闭
			if (this.duration > 0) {
				this.timer = setTimeout(() => {
					this.hide()
				}, this.duration)
			}
		},

		hide() {
			this.showAnimation = false
			setTimeout(() => {
				this.visible = false
				this.$emit('closed')
			}, 350)
		},

		// 快捷方法
		success(message, duration = 2000) {
			this.show({ type: 'success', message, duration })
		},

		error(message, duration = 2500) {
			this.show({ type: 'error', message, duration })
		},

		warning(message, duration = 2500) {
			this.show({ type: 'warning', message, duration })
		},

		info(message, duration = 2000) {
			this.show({ type: 'info', message, duration })
		}
	},
	beforeDestroy() {
		if (this.timer) {
			clearTimeout(this.timer)
		}
	}
}
</script>

<style lang="scss" scoped>
// ==================== Toast 包装器 ====================
.toast-wrapper {
	position: fixed;
	left: 0;
	right: 0;
	z-index: 99999;
	display: flex;
	justify-content: center;
	pointer-events: none;

	// 顶部位置
	&--top {
		top: 0;
		padding-top: calc(env(safe-area-inset-top) + 120rpx);
	}

	// 中间位置
	&--center {
		top: 50%;
		transform: translateY(-50%);
	}

	// 底部位置
	&--bottom {
		bottom: 0;
		padding-bottom: calc(env(safe-area-inset-bottom) + 200rpx);
	}
}

// ==================== Toast 容器 ====================
.toast-container {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: $spacing-xl $spacing-2xl;
	border-radius: $radius-xl;
	background: rgba(255, 255, 255, 0.95);
	backdrop-filter: blur(20px) saturate(180%);
	-webkit-backdrop-filter: blur(20px) saturate(180%);
	box-shadow:
		0 16rpx 48rpx rgba(30, 58, 95, 0.18),
		0 4rpx 12rpx rgba(30, 58, 95, 0.08),
		inset 0 1rpx 0 rgba(255, 255, 255, 0.5);
	min-width: 200rpx;
	max-width: 480rpx;

	// 初始状态
	opacity: 0;
	transform: scale(0.8) translateY(20rpx);
	transition:
		opacity 0.3s $ease-in-out-smooth,
		transform 0.35s $ease-out-back;

	&--show {
		opacity: 1;
		transform: scale(1) translateY(0);
	}

	// 不同类型的边框光效
	&--success {
		border: 2rpx solid rgba(16, 185, 129, 0.25);
	}
	&--error {
		border: 2rpx solid rgba(239, 68, 68, 0.25);
	}
	&--warning {
		border: 2rpx solid rgba(245, 158, 11, 0.25);
	}
	&--info {
		border: 2rpx solid rgba(59, 130, 246, 0.25);
	}
}

// 深色模式容器
.toast-wrapper--dark .toast-container {
	background: rgba(22, 27, 34, 0.92);
	box-shadow:
		0 16rpx 48rpx rgba(0, 0, 0, 0.4),
		0 4rpx 12rpx rgba(0, 0, 0, 0.2),
		inset 0 1rpx 0 rgba(255, 255, 255, 0.08);
}

// ==================== 图标容器 ====================
.toast-icon {
	width: 88rpx;
	height: 88rpx;
	margin-bottom: $spacing-md;
	display: flex;
	align-items: center;
	justify-content: center;
}

// ==================== 成功对勾动画 ====================
.icon-success-animated {
	width: 100%;
	height: 100%;
}

.checkmark {
	width: 88rpx;
	height: 88rpx;
	border-radius: 50%;
	position: relative;
	animation: scaleIn 0.3s ease-in-out 0.1s both;
}

.checkmark__circle {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	border-radius: 50%;
	border: 4rpx solid rgba(16, 185, 129, 0.25);
	background: rgba(16, 185, 129, 0.08);
	box-sizing: border-box;

	// 圆形绘制动画
	&::after {
		content: '';
		position: absolute;
		top: -4rpx;
		left: -4rpx;
		right: -4rpx;
		bottom: -4rpx;
		border-radius: 50%;
		border: 4rpx solid transparent;
		border-top-color: $color-success;
		animation: circleStroke 0.5s ease-in-out forwards;
	}
}

@keyframes circleStroke {
	0% { transform: rotate(0deg); }
	100% { transform: rotate(360deg); border-color: $color-success; }
}

.checkmark__check {
	position: absolute;
	top: 50%;
	left: 50%;
	width: 20rpx;
	height: 36rpx;
	border-right: 5rpx solid $color-success;
	border-bottom: 5rpx solid $color-success;
	transform: translate(-50%, -60%) rotate(45deg) scale(0);
	transform-origin: center;
	animation: checkStroke 0.3s ease-out 0.4s forwards;
}

@keyframes checkStroke {
	0% {
		transform: translate(-50%, -60%) rotate(45deg) scale(0);
	}
	50% {
		transform: translate(-50%, -60%) rotate(45deg) scale(1.2);
	}
	100% {
		transform: translate(-50%, -60%) rotate(45deg) scale(1);
	}
}

@keyframes scaleIn {
	0% { transform: scale(0.8); opacity: 0; }
	50% { transform: scale(1.05); }
	100% { transform: scale(1); opacity: 1; }
}

// ==================== 失败叉号动画 ====================
.icon-error-animated {
	width: 100%;
	height: 100%;
}

.crossmark {
	width: 88rpx;
	height: 88rpx;
	border-radius: 50%;
	position: relative;
	animation: scaleIn 0.3s ease-in-out 0.1s both;
}

.crossmark__circle {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	border-radius: 50%;
	border: 4rpx solid rgba(239, 68, 68, 0.25);
	background: rgba(239, 68, 68, 0.08);
	box-sizing: border-box;

	&::after {
		content: '';
		position: absolute;
		top: -4rpx;
		left: -4rpx;
		right: -4rpx;
		bottom: -4rpx;
		border-radius: 50%;
		border: 4rpx solid transparent;
		border-top-color: $color-error;
		animation: circleStrokeError 0.5s ease-in-out forwards;
	}
}

@keyframes circleStrokeError {
	0% { transform: rotate(0deg); }
	100% { transform: rotate(360deg); border-color: $color-error; }
}

.crossmark__cross {
	position: absolute;
	top: 50%;
	left: 50%;
	width: 36rpx;
	height: 36rpx;
	transform: translate(-50%, -50%);

	&::before,
	&::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		width: 36rpx;
		height: 5rpx;
		background: $color-error;
		border-radius: 3rpx;
		transform-origin: center;
	}

	&::before {
		transform: translate(-50%, -50%) rotate(45deg) scaleX(0);
		animation: crossLine1 0.25s ease-out 0.4s forwards;
	}

	&::after {
		transform: translate(-50%, -50%) rotate(-45deg) scaleX(0);
		animation: crossLine2 0.25s ease-out 0.5s forwards;
	}
}

@keyframes crossLine1 {
	0% { transform: translate(-50%, -50%) rotate(45deg) scaleX(0); }
	100% { transform: translate(-50%, -50%) rotate(45deg) scaleX(1); }
}

@keyframes crossLine2 {
	0% { transform: translate(-50%, -50%) rotate(-45deg) scaleX(0); }
	100% { transform: translate(-50%, -50%) rotate(-45deg) scaleX(1); }
}

// ==================== 警告图标动画 ====================
.icon-warning-animated {
	width: 72rpx;
	height: 72rpx;
	position: relative;
	animation: warningBounce 0.5s ease-out;

	// 三角形背景
	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 0;
		height: 0;
		border-left: 36rpx solid transparent;
		border-right: 36rpx solid transparent;
		border-bottom: 64rpx solid rgba(245, 158, 11, 0.15);
	}

	// 感叹号
	&::after {
		content: '!';
		position: absolute;
		bottom: 8rpx;
		left: 50%;
		transform: translateX(-50%);
		font-size: 40rpx;
		font-weight: bold;
		color: $color-warning;
		animation: warningPulse 1s ease-in-out infinite;
	}
}

@keyframes warningBounce {
	0% { transform: scale(0.5) translateY(-20rpx); opacity: 0; }
	60% { transform: scale(1.1) translateY(0); }
	100% { transform: scale(1) translateY(0); opacity: 1; }
}

@keyframes warningPulse {
	0%, 100% { opacity: 1; }
	50% { opacity: 0.6; }
}

// ==================== 信息图标动画 ====================
.icon-info-animated {
	width: 72rpx;
	height: 72rpx;
	border: 4rpx solid rgba(59, 130, 246, 0.3);
	border-radius: 50%;
	position: relative;
	background: rgba(59, 130, 246, 0.08);
	animation: infoPopIn 0.4s $ease-out-back;

	// 点
	&::before {
		content: '';
		position: absolute;
		top: 12rpx;
		left: 50%;
		transform: translateX(-50%);
		width: 10rpx;
		height: 10rpx;
		background: $color-info;
		border-radius: 50%;
	}

	// 竖线
	&::after {
		content: '';
		position: absolute;
		bottom: 12rpx;
		left: 50%;
		transform: translateX(-50%);
		width: 10rpx;
		height: 28rpx;
		background: $color-info;
		border-radius: 5rpx;
	}
}

@keyframes infoPopIn {
	0% { transform: scale(0) rotate(-180deg); }
	100% { transform: scale(1) rotate(0deg); }
}

// ==================== 消息文本 ====================
.toast-message {
	font-size: $font-size-base;
	font-weight: $font-weight-medium;
	color: $text-primary;
	text-align: center;
	line-height: $line-height-normal;
	max-width: 360rpx;
	word-break: break-word;
}

.toast-wrapper--dark .toast-message {
	color: $dark-text-primary;
}
</style>
