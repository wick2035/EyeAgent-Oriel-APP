<template>
	<view class="page" :class="{ 'page--dark': isDark }">
		<!-- 固定头部 -->
		<view class="fixed-header" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="navbar">
				<view class="navbar__back" @click="goBack">
					<view class="back-icon"></view>
				</view>
				<text class="navbar__title">我的订单</text>
				<view class="navbar__placeholder"></view>
			</view>
		</view>

		<!-- 头部占位 -->
		<view class="header-placeholder" :style="{ height: (statusBarHeight + 44) + 'px' }"></view>

		<!-- 空状态 -->
		<view class="empty-state">
			<view class="empty-state__icon">
				<image class="empty-state__img" src="/static/E-car.svg" mode="aspectFit" />
			</view>

			<text class="empty-state__title">暂无订单</text>
			<text class="empty-state__desc">您还没有任何订单记录</text>
		</view>

		<!-- 顶部通知栏 -->
		<TopNotificationBar />
	</view>
</template>

<script>
import TopNotificationBar from '@/components/TopNotificationBar.vue'
import { isDarkMode } from '@/store/theme.js'

export default {
	components: {
		TopNotificationBar
	},
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

// 空状态
.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: $spacing-2xl $spacing-lg;
	min-height: 500rpx;
	padding-top: 200rpx;

	&__icon {
		width: 320rpx;
		height: 320rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: $spacing-xl;

		.page--dark & {
			opacity: 0.75;
		}
	}

	&__img {
		width: 100%;
		height: 100%;
	}

	&__title {
		font-size: $font-size-xl;
		font-weight: $font-weight-semibold;
		color: $text-primary;
		margin-bottom: $spacing-sm;

		.page--dark & {
			color: $dark-text-primary;
		}
	}

	&__desc {
		font-size: $font-size-base;
		color: $text-secondary;
		text-align: center;

		.page--dark & {
			color: $dark-text-secondary;
		}
	}
}
</style>
