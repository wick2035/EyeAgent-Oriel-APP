<template>
	<view class="page" :class="{ 'page--dark': isDark }">
		<!-- 状态栏占位 -->
		<view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>

		<!-- 导航栏 -->
		<view class="navbar">
			<view class="navbar__back" @click="goBack">
				<view class="navbar__back-icon"></view>
			</view>
			<view class="navbar__center">
				<text class="navbar__title">{{ doctorName }}</text>
				<text v-if="department" class="navbar__sub">{{ department }}</text>
			</view>
			<view class="navbar__right"></view>
		</view>

		<!-- 聊天区域 -->
		<view class="chat-area">
			<!-- 即将开通提示 -->
			<view class="coming-soon">
				<view class="coming-soon__icon-wrap">
					<view class="coming-soon__icon">
						<!-- 对话气泡图标 -->
						<view class="coming-soon__bubble coming-soon__bubble--left"></view>
						<view class="coming-soon__bubble coming-soon__bubble--right"></view>
					</view>
					<!-- 脉冲动画 -->
					<view class="coming-soon__pulse"></view>
				</view>
				<text class="coming-soon__title">即将开通，敬请期待</text>
				<text class="coming-soon__desc">医生在线咨询功能开发中</text>
				<view class="coming-soon__features">
					<view class="coming-soon__feature">
						<view class="coming-soon__feature-dot"></view>
						<text class="coming-soon__feature-text">图文咨询</text>
					</view>
					<view class="coming-soon__feature">
						<view class="coming-soon__feature-dot"></view>
						<text class="coming-soon__feature-text">处方解读</text>
					</view>
					<view class="coming-soon__feature">
						<view class="coming-soon__feature-dot"></view>
						<text class="coming-soon__feature-text">复诊提醒</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 底部输入栏（禁用） -->
		<view class="input-bar">
			<view class="input-bar__inner">
				<input
					class="input-bar__input"
					type="text"
					disabled
					placeholder="功能即将开通..."
					:placeholder-style="isDark ? 'color: #484F58' : 'color: #9AABBF'"
				/>
				<view class="input-bar__send input-bar__send--disabled">
					<view class="input-bar__send-icon"></view>
				</view>
			</view>
			<!-- 安全区 -->
			<view class="input-bar__safe"></view>
		</view>
	</view>
</template>

<script>
import { isDarkMode } from '@/store/theme.js'

export default {
	data() {
		return {
			statusBarHeight: 44,
			doctorName: '',
			department: ''
		}
	},
	computed: {
		isDark() {
			return isDarkMode()
		}
	},
	onLoad(options) {
		this.doctorName = options.name || '医生'
		this.department = options.department || ''
		this.getStatusBarHeight()
	},
	methods: {
		getStatusBarHeight() {
			const sysInfo = uni.getSystemInfoSync()
			this.statusBarHeight = sysInfo.statusBarHeight || 44
		},
		goBack() {
			uni.navigateBack()
		}
	}
}
</script>

<style lang="scss" scoped>
.page {
	height: 100vh;
	overflow: hidden;
	background: $bg-base;
	display: flex;
	flex-direction: column;

	&--dark {
		background: $dark-bg-base;
	}
}

.status-bar {
	flex-shrink: 0;
}

// 导航栏
.navbar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	height: 88rpx;
	padding: 0 $spacing-lg;
	flex-shrink: 0;
	border-bottom: 1rpx solid $border-color-light;

	&__back {
		width: 64rpx;
		height: 64rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		transition: background 0.15s ease;

		&:active {
			background: rgba(30, 58, 95, 0.06);
		}
	}

	&__back-icon {
		width: 20rpx;
		height: 20rpx;
		border-left: 4rpx solid $text-primary;
		border-bottom: 4rpx solid $text-primary;
		transform: rotate(45deg);
		margin-left: 8rpx;
	}

	&__center {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	&__title {
		font-size: $font-size-lg;
		font-weight: $font-weight-semibold;
		color: $text-primary;
		line-height: $line-height-tight;
	}

	&__sub {
		font-size: $font-size-xs;
		color: $text-muted;
		margin-top: 2rpx;
	}

	&__right {
		width: 64rpx;
	}
}

// 聊天区域
.chat-area {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
}

// 即将开通
.coming-soon {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 0 $spacing-2xl;

	&__icon-wrap {
		position: relative;
		width: 200rpx;
		height: 200rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: $spacing-xl;
	}

	&__icon {
		width: 120rpx;
		height: 100rpx;
		position: relative;
		z-index: 2;
	}

	&__bubble {
		position: absolute;
		border-radius: $radius-lg;
		border: 4rpx solid $color-primary;

		&--left {
			width: 72rpx;
			height: 52rpx;
			left: 0;
			top: 12rpx;
			opacity: 0.6;
			border-bottom-left-radius: 8rpx;

			&::after {
				content: '';
				position: absolute;
				top: 50%;
				left: 16rpx;
				transform: translateY(-50%);
				width: 32rpx;
				height: 4rpx;
				background: $color-primary;
				opacity: 0.5;
				border-radius: 2rpx;
			}
		}

		&--right {
			width: 80rpx;
			height: 52rpx;
			right: 0;
			bottom: 12rpx;
			border-bottom-right-radius: 8rpx;
			background: rgba(30, 58, 95, 0.05);

			&::after {
				content: '';
				position: absolute;
				top: 50%;
				left: 16rpx;
				transform: translateY(-50%);
				width: 40rpx;
				height: 4rpx;
				background: $color-primary;
				opacity: 0.3;
				border-radius: 2rpx;
			}
		}
	}

	&__pulse {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 160rpx;
		height: 160rpx;
		border-radius: 50%;
		background: rgba(30, 58, 95, 0.04);
		animation: pulseGlow 2.5s ease-in-out infinite;
	}

	&__title {
		font-size: $font-size-xl;
		font-weight: $font-weight-semibold;
		color: $text-primary;
		margin-bottom: $spacing-sm;
	}

	&__desc {
		font-size: $font-size-base;
		color: $text-muted;
		margin-bottom: $spacing-xl;
	}

	&__features {
		display: flex;
		gap: $spacing-lg;
	}

	&__feature {
		display: flex;
		align-items: center;
	}

	&__feature-dot {
		width: 10rpx;
		height: 10rpx;
		border-radius: 50%;
		background: $color-primary;
		opacity: 0.4;
		margin-right: $spacing-xs;
	}

	&__feature-text {
		font-size: $font-size-sm;
		color: $text-secondary;
	}
}

@keyframes pulseGlow {
	0%, 100% {
		transform: translate(-50%, -50%) scale(1);
		opacity: 1;
	}
	50% {
		transform: translate(-50%, -50%) scale(1.15);
		opacity: 0.5;
	}
}

// 底部输入栏
.input-bar {
	flex-shrink: 0;
	background: $bg-card;
	border-top: 1rpx solid $border-color-light;
	padding: $spacing-sm $spacing-lg;

	&__inner {
		display: flex;
		align-items: center;
		gap: $spacing-sm;
	}

	&__input {
		flex: 1;
		height: 72rpx;
		background: $bg-elevated;
		border-radius: $radius-full;
		padding: 0 $spacing-md;
		font-size: $font-size-base;
		color: $text-primary;
		opacity: 0.5;
	}

	&__send {
		width: 64rpx;
		height: 64rpx;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;

		&--disabled {
			background: $bg-elevated;
			opacity: 0.4;
		}
	}

	&__send-icon {
		width: 0;
		height: 0;
		border-left: 16rpx solid $text-muted;
		border-top: 10rpx solid transparent;
		border-bottom: 10rpx solid transparent;
		margin-left: 4rpx;
	}

	&__safe {
		height: env(safe-area-inset-bottom);
	}
}

// 深色模式
.page--dark {
	.navbar {
		border-bottom-color: $dark-border-color;
	}
	.navbar__back-icon {
		border-color: $dark-text-primary;
	}
	.navbar__back:active {
		background: rgba(255, 255, 255, 0.08);
	}
	.navbar__title {
		color: $dark-text-primary;
	}
	.navbar__sub {
		color: $dark-text-muted;
	}

	.coming-soon__bubble {
		border-color: $dark-color-primary;

		&--left::after,
		&--right::after {
			background: $dark-color-primary;
		}

		&--right {
			background: rgba(74, 144, 217, 0.08);
		}
	}
	.coming-soon__pulse {
		background: rgba(74, 144, 217, 0.06);
	}
	.coming-soon__title {
		color: $dark-text-primary;
	}
	.coming-soon__desc {
		color: $dark-text-muted;
	}
	.coming-soon__feature-dot {
		background: $dark-color-primary;
	}
	.coming-soon__feature-text {
		color: $dark-text-secondary;
	}

	.input-bar {
		background: $dark-bg-card;
		border-top-color: $dark-border-color;
	}
	.input-bar__input {
		background: $dark-bg-elevated;
		color: $dark-text-primary;
	}
	.input-bar__send--disabled {
		background: $dark-bg-elevated;
	}
	.input-bar__send-icon {
		border-left-color: $dark-text-muted;
	}
}
</style>
