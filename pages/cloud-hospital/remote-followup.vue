<template>
	<page-meta :background-color="isDark ? '#0D1117' : '#FAFBFD'"></page-meta>
	<view class="page" :class="{ 'page--dark': isDark }">
		<!-- 自定义导航栏 -->
		<view class="navbar" :class="{ 'navbar--dark': isDark }">
			<view class="navbar__status" :style="{ height: statusBarHeight + 'px' }"></view>
			<view class="navbar__content">
				<view class="navbar__back" @click="goBack">
					<view class="navbar__back-icon"></view>
				</view>
				<text class="navbar__title">远程复诊</text>
				<view class="navbar__placeholder"></view>
			</view>
		</view>

		<!-- 空状态内容 -->
		<view class="empty-container">
			<view class="empty-state">
				<!-- 大图标区域 -->
				<view class="empty-state__icon-wrapper">
					<view class="empty-state__icon-bg"></view>
					<image class="empty-state__icon" src="@/static/cloud.svg" mode="aspectFit" />
				</view>

				<!-- 文案区域 -->
				<view class="empty-state__content">
					<text class="empty-state__title">您暂无待复诊项目</text>
					<text class="empty-state__desc">如有问题请联系主治医生</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { isDarkMode } from '@/store/theme.js'

export default {
	data() {
		return {
			statusBarHeight: 44
		}
	},
	computed: {
		isDark() {
			return isDarkMode()
		}
	},
	onLoad() {
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
	min-height: 100vh;
	background: linear-gradient(180deg, rgba(14, 165, 233, 0.06) 0%, $bg-base 30%);
}

// 导航栏
.navbar {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	z-index: 100;
	background: rgba(255, 255, 255, 0.9);
	backdrop-filter: blur(20rpx);

	&__content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 88rpx;
		padding: 0 $spacing-md;
	}

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
		margin-left: 8rpx;
	}

	&__title {
		font-size: $font-size-lg;
		font-weight: $font-weight-semibold;
		color: $text-primary;
	}

	&__placeholder {
		width: 72rpx;
	}
}

// 空状态容器
.empty-container {
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 100vh;
	padding: 0 $spacing-xl;
}

.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-top: -120rpx;

	&__icon-wrapper {
		position: relative;
		width: 240rpx;
		height: 240rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: $spacing-xl;
	}

	&__icon-bg {
		position: absolute;
		width: 200rpx;
		height: 200rpx;
		background: linear-gradient(135deg, rgba(56, 189, 248, 0.15) 0%, rgba(14, 165, 233, 0.2) 50%, rgba(2, 132, 199, 0.15) 100%);
		border-radius: 50%;
		animation: pulse 3s ease-in-out infinite;
	}

	&__icon {
		position: relative;
		width: 120rpx;
		height: 120rpx;
		z-index: 1;
		filter: invert(52%) sepia(94%) saturate(1095%) hue-rotate(176deg) brightness(98%) contrast(92%);
		animation: float 4s ease-in-out infinite;
	}

	&__content {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-bottom: $spacing-xl;
	}

	&__title {
		font-size: 36rpx;
		font-weight: $font-weight-semibold;
		color: $text-primary;
		margin-bottom: $spacing-sm;
		letter-spacing: 2rpx;
	}

	&__desc {
		font-size: $font-size-base;
		color: $text-muted;
		letter-spacing: 1rpx;
	}
}

@keyframes pulse {
	0%, 100% {
		transform: scale(1);
		opacity: 1;
	}
	50% {
		transform: scale(1.08);
		opacity: 0.8;
	}
}

@keyframes float {
	0%, 100% {
		transform: translateY(0);
	}
	50% {
		transform: translateY(-12rpx);
	}
}

// 导航栏深色模式（直接绑定，避免 fixed 元素后代选择器失效）
.navbar--dark {
	background: rgba(22, 27, 34, 0.9);

	.navbar__back-icon {
		border-color: $dark-text-primary;
	}

	.navbar__title {
		color: $dark-text-primary;
	}
}

// 深色模式
.page--dark {
	background: linear-gradient(180deg, rgba(14, 165, 233, 0.08) 0%, $dark-bg-base 30%);

	.empty-container {
		background: $dark-bg-base;
	}

	.empty-state {
		&__icon-bg {
			background: linear-gradient(135deg, rgba(56, 189, 248, 0.1) 0%, rgba(14, 165, 233, 0.15) 50%, rgba(2, 132, 199, 0.1) 100%);
		}

		&__title {
			color: $dark-text-primary;
		}

		&__desc {
			color: $dark-text-muted;
		}
	}
}
</style>
