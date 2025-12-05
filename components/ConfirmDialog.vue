<template>
	<view v-if="visible" class="dialog-mask" :class="{ 'dialog-mask--show': showAnimation }" @click="handleMaskClick">
		<view class="dialog" :class="[{ 'dialog--show': showAnimation }, isDark ? 'dialog--dark' : '']" @click.stop>
			<!-- 图标 -->
			<view v-if="icon" class="dialog__icon">
				<view :class="`icon-${icon}`"></view>
			</view>

			<!-- 标题 -->
			<text class="dialog__title">{{ title }}</text>

			<!-- 内容 -->
			<text v-if="content" class="dialog__content">{{ content }}</text>

			<!-- 按钮组 -->
			<view class="dialog__buttons">
				<view class="dialog__btn dialog__btn--cancel" @click="handleCancel">
					<text class="dialog__btn-text">{{ cancelText }}</text>
				</view>
				<view class="dialog__btn dialog__btn--confirm" @click="handleConfirm">
					<text class="dialog__btn-text dialog__btn-text--confirm">{{ confirmText }}</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { isDarkMode } from '@/store/theme.js'

export default {
	name: 'ConfirmDialog',
	props: {
		title: {
			type: String,
			default: '提示'
		},
		content: {
			type: String,
			default: ''
		},
		confirmText: {
			type: String,
			default: '确定'
		},
		cancelText: {
			type: String,
			default: '取消'
		},
		icon: {
			type: String,
			default: 'warning' // warning, success, error, info
		},
		closeOnMask: {
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
		show() {
			this.visible = true
			this.$nextTick(() => {
				setTimeout(() => {
					this.showAnimation = true
				}, 10)
			})
		},
		hide() {
			this.showAnimation = false
			setTimeout(() => {
				this.visible = false
			}, 200)
		},
		handleConfirm() {
			this.$emit('confirm')
			this.hide()
		},
		handleCancel() {
			this.$emit('cancel')
			this.hide()
		},
		handleMaskClick() {
			if (this.closeOnMask) {
				this.handleCancel()
			}
		}
	}
}
</script>

<style lang="scss" scoped>
.dialog-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 9999;
	transition: background 0.2s ease;

	&--show {
		background: rgba(0, 0, 0, 0.5);
	}
}

.dialog {
	width: 560rpx;
	background: $bg-card;
	border-radius: $radius-xl;
	padding: $spacing-xl $spacing-lg $spacing-lg;
	display: flex;
	flex-direction: column;
	align-items: center;
	box-shadow: $shadow-lg;
	transform: scale(0.9);
	opacity: 0;
	transition: all 0.2s ease;

	&--show {
		transform: scale(1);
		opacity: 1;
	}

	&__icon {
		width: 96rpx;
		height: 96rpx;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: $spacing-md;
		background: rgba(255, 107, 91, 0.1);
	}

	&__title {
		font-size: $font-size-lg;
		font-weight: $font-weight-semibold;
		color: $text-primary;
		margin-bottom: $spacing-sm;
	}

	&__content {
		font-size: $font-size-sm;
		color: $text-secondary;
		text-align: center;
		line-height: $line-height-normal;
		margin-bottom: $spacing-lg;
	}

	&__buttons {
		display: flex;
		width: 100%;
		gap: $spacing-md;
	}

	&__btn {
		flex: 1;
		height: 88rpx;
		border-radius: $radius-lg;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;

		&:active {
			transform: scale(0.96);
		}

		&--cancel {
			background: $bg-elevated;
		}

		&--confirm {
			background: $color-primary;
		}
	}

	&__btn-text {
		font-size: $font-size-base;
		font-weight: $font-weight-medium;
		color: $text-secondary;

		&--confirm {
			color: #fff;
		}
	}
}

// 图标样式
.icon-warning {
	width: 48rpx;
	height: 48rpx;
	position: relative;

	&::before {
		content: '';
		position: absolute;
		top: 8rpx;
		left: 50%;
		transform: translateX(-50%);
		width: 6rpx;
		height: 24rpx;
		background: $color-accent;
		border-radius: 3rpx;
	}

	&::after {
		content: '';
		position: absolute;
		bottom: 6rpx;
		left: 50%;
		transform: translateX(-50%);
		width: 6rpx;
		height: 6rpx;
		background: $color-accent;
		border-radius: 50%;
	}
}

.icon-success {
	width: 48rpx;
	height: 48rpx;
	position: relative;

	&::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		width: 12rpx;
		height: 24rpx;
		border: 4rpx solid $color-success;
		border-top: none;
		border-left: none;
		transform: translate(-50%, -60%) rotate(45deg);
	}
}

.icon-error {
	width: 48rpx;
	height: 48rpx;
	position: relative;

	&::before,
	&::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		width: 32rpx;
		height: 4rpx;
		background: $color-error;
		border-radius: 2rpx;
	}

	&::before {
		transform: translate(-50%, -50%) rotate(45deg);
	}

	&::after {
		transform: translate(-50%, -50%) rotate(-45deg);
	}
}

.icon-info {
	width: 48rpx;
	height: 48rpx;
	position: relative;

	&::before {
		content: '';
		position: absolute;
		top: 6rpx;
		left: 50%;
		transform: translateX(-50%);
		width: 6rpx;
		height: 6rpx;
		background: $color-info;
		border-radius: 50%;
	}

	&::after {
		content: '';
		position: absolute;
		bottom: 6rpx;
		left: 50%;
		transform: translateX(-50%);
		width: 6rpx;
		height: 24rpx;
		background: $color-info;
		border-radius: 3rpx;
	}
}

// 深色模式
.dialog--dark {
	background: $dark-bg-card;

	.dialog__title {
		color: $dark-text-primary;
	}

	.dialog__content {
		color: $dark-text-secondary;
	}

	.dialog__btn--cancel {
		background: $dark-bg-elevated;
	}

	.dialog__btn--confirm {
		background: $dark-color-primary;
	}

	.dialog__btn-text {
		color: $dark-text-secondary;
	}
}
</style>
