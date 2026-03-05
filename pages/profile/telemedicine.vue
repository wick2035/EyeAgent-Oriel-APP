<template>
	<view class="page" :class="{ 'page--dark': isDark }">
		<!-- 自定义导航栏 -->
		<view class="navbar" :class="{ 'navbar--dark': isDark }">
			<view class="navbar__status" :style="{ height: statusBarHeight + 'px' }"></view>
			<view class="navbar__content">
				<view class="navbar__back" @click="goBack">
					<view class="navbar__back-icon"></view>
				</view>
				<text class="navbar__title">云上医院</text>
				<view class="navbar__placeholder"></view>
			</view>
		</view>

		<!-- 主内容 -->
		<scroll-view class="main" scroll-y :style="{ paddingTop: (statusBarHeight + 44) + 'px' }">
			<!-- Hero 区域 -->
			<view class="hero" :class="{ 'hero--show': animationReady }">
				<view class="hero__icon-wrapper">
					<view class="hero__icon-bg"></view>
					<image class="hero__icon" src="@/static/cloud.svg" mode="aspectFit" />
				</view>
				<text class="hero__title">云上医院</text>
				<text class="hero__subtitle">随时随地，专业医疗触手可及</text>
			</view>

			<!-- 功能卡片 -->
			<view class="cards">
				<!-- 在线咨询 -->
				<view
					class="feature-card"
					:class="{ 'feature-card--show': animationReady }"
					style="animation-delay: 200ms"
					@click="goToOnlineConsultation"
				>
					<view class="feature-card__icon-area feature-card__icon-area--consultation">
						<image class="feature-card__icon-img" src="@/static/chat-online.svg" mode="aspectFit" />
					</view>
					<view class="feature-card__body">
						<text class="feature-card__title">在线咨询</text>
						<text class="feature-card__desc">与专家医生实时图文沟通</text>
						<view class="feature-card__tags">
							<view class="feature-card__tag feature-card__tag--primary">
								<text class="feature-card__tag-text feature-card__tag-text--primary">图文咨询</text>
							</view>
							<view class="feature-card__tag feature-card__tag--primary">
								<text class="feature-card__tag-text feature-card__tag-text--primary">处方解读</text>
							</view>
							<view class="feature-card__tag feature-card__tag--primary">
								<text class="feature-card__tag-text feature-card__tag-text--primary">专家答疑</text>
							</view>
						</view>
					</view>
					<view class="feature-card__arrow"></view>
				</view>

				<!-- 远程复诊 -->
				<view
					class="feature-card"
					:class="{ 'feature-card--show': animationReady }"
					style="animation-delay: 320ms"
					@click="goToRemoteFollowup"
				>
					<view class="feature-card__icon-area feature-card__icon-area--followup">
						<image class="feature-card__icon-img" src="@/static/cloud.svg" mode="aspectFit" />
					</view>
					<view class="feature-card__body">
						<text class="feature-card__title">远程复诊</text>
						<text class="feature-card__desc">术后复查，在线跟进恢复进度</text>
						<view class="feature-card__tags">
							<view class="feature-card__tag feature-card__tag--sky">
								<text class="feature-card__tag-text feature-card__tag-text--sky">复诊提醒</text>
							</view>
							<view class="feature-card__tag feature-card__tag--sky">
								<text class="feature-card__tag-text feature-card__tag-text--sky">术后跟踪</text>
							</view>
							<view class="feature-card__tag feature-card__tag--sky">
								<text class="feature-card__tag-text feature-card__tag-text--sky">报告查看</text>
							</view>
						</view>
					</view>
					<view class="feature-card__arrow"></view>
				</view>
			</view>

			<!-- 隐私横幅 -->
			<view class="privacy-banner" :class="{ 'privacy-banner--show': animationReady }">
				<view class="privacy-banner__shield">
					<view class="privacy-banner__check"></view>
				</view>
				<text class="privacy-banner__text">您的隐私和健康数据受到严格保护</text>
			</view>
		</scroll-view>
	</view>
</template>

<script>
import { isDarkMode } from '@/store/theme.js'

export default {
	data() {
		return {
			statusBarHeight: 44,
			animationReady: false
		}
	},
	computed: {
		isDark() {
			return isDarkMode()
		}
	},
	onLoad() {
		this.getStatusBarHeight()
		setTimeout(() => {
			this.animationReady = true
		}, 100)
	},
	methods: {
		getStatusBarHeight() {
			const sysInfo = uni.getSystemInfoSync()
			this.statusBarHeight = sysInfo.statusBarHeight || 44
		},
		goBack() {
			uni.navigateBack()
		},
		goToOnlineConsultation() {
			uni.navigateTo({
				url: '/pages/cloud-hospital/online-consultation'
			})
		},
		goToRemoteFollowup() {
			uni.navigateTo({
				url: '/pages/cloud-hospital/remote-followup'
			})
		}
	}
}
</script>

<style lang="scss" scoped>
.page {
	min-height: 100vh;
	background: linear-gradient(180deg, rgba(14, 165, 233, 0.06) 0%, $bg-base 35%);
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
		border-radius: 50%;
		transition: background $transition-fast;

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

	&__title {
		font-size: $font-size-lg;
		font-weight: $font-weight-semibold;
		color: $text-primary;
	}

	&__placeholder {
		width: 72rpx;
	}
}

// 主内容
.main {
	min-height: 100vh;
	padding-bottom: calc(#{$spacing-2xl} + env(safe-area-inset-bottom));
}

// Hero 区域
.hero {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding-top: $spacing-xl;
	padding-bottom: $spacing-md;
	opacity: 0;
	transform: translateY(-20rpx);

	&--show {
		animation: heroFadeIn 0.6s ease-out forwards;
	}

	&__icon-wrapper {
		position: relative;
		width: 180rpx;
		height: 180rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: $spacing-md;
	}

	&__icon-bg {
		position: absolute;
		width: 160rpx;
		height: 160rpx;
		background: linear-gradient(
			135deg,
			rgba(56, 189, 248, 0.12) 0%,
			rgba(14, 165, 233, 0.18) 50%,
			rgba(2, 132, 199, 0.12) 100%
		);
		border-radius: 50%;
		animation: pulse 3s ease-in-out infinite;
	}

	&__icon {
		position: relative;
		width: 80rpx;
		height: 80rpx;
		z-index: 1;
		filter: invert(52%) sepia(94%) saturate(1095%) hue-rotate(176deg) brightness(98%) contrast(92%);
		animation: float 4s ease-in-out infinite;
	}

	&__title {
		font-size: $font-size-2xl;
		font-weight: $font-weight-bold;
		color: $text-primary;
		letter-spacing: 4rpx;
		margin-bottom: $spacing-xs;
	}

	&__subtitle {
		font-size: $font-size-base;
		color: $text-muted;
	}
}

// 功能卡片容器
.cards {
	padding: $spacing-md $spacing-lg 0;
	display: flex;
	flex-direction: column;
	gap: $spacing-md;
}

// 功能卡片
.feature-card {
	display: flex;
	align-items: center;
	padding: $spacing-lg;
	background: $bg-card;
	border-radius: $radius-xl;
	box-shadow: $shadow-md;
	opacity: 0;
	transform: translateY(40rpx);
	transition: transform $transition-fast;

	&--show {
		animation: cardSlideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
	}

	&:active {
		transform: scale(0.98);
	}

	// 图标区域
	&__icon-area {
		width: 96rpx;
		height: 96rpx;
		border-radius: $radius-lg;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;

		&--consultation {
			background: linear-gradient(135deg, #1E3A5F 0%, #4A90D9 100%);
		}

		&--followup {
			background: linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%);
		}
	}

	&__icon-img {
		width: 48rpx;
		height: 48rpx;
		filter: brightness(0) invert(1);
	}

	// 内容区域
	&__body {
		flex: 1;
		margin-left: $spacing-md;
		overflow: hidden;
	}

	&__title {
		display: block;
		font-size: $font-size-lg;
		font-weight: $font-weight-semibold;
		color: $text-primary;
	}

	&__desc {
		display: block;
		font-size: $font-size-sm;
		color: $text-secondary;
		margin-top: 6rpx;
	}

	&__tags {
		display: flex;
		flex-wrap: wrap;
		gap: $spacing-xs;
		margin-top: $spacing-sm;
	}

	&__tag {
		padding: 4rpx 16rpx;
		border-radius: $radius-full;

		&--primary {
			background: rgba(30, 58, 95, 0.06);
		}

		&--sky {
			background: rgba(14, 165, 233, 0.08);
		}
	}

	&__tag-text {
		font-size: $font-size-xs;

		&--primary {
			color: $color-primary-light;
		}

		&--sky {
			color: #0284C7;
		}
	}

	// 箭头
	&__arrow {
		width: 16rpx;
		height: 16rpx;
		border-top: 3rpx solid $text-muted;
		border-right: 3rpx solid $text-muted;
		transform: rotate(45deg);
		flex-shrink: 0;
		margin-left: $spacing-sm;
	}
}

// 隐私横幅
.privacy-banner {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: $spacing-lg $spacing-lg 0;
	opacity: 0;

	&--show {
		animation: cardSlideUp 0.4s ease-out 0.5s forwards;
	}

	&__shield {
		width: 28rpx;
		height: 32rpx;
		border: 3rpx solid $color-success;
		border-radius: 4rpx 4rpx 50% 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: $spacing-xs;
		flex-shrink: 0;
	}

	&__check {
		width: 10rpx;
		height: 6rpx;
		border-left: 2rpx solid $color-success;
		border-bottom: 2rpx solid $color-success;
		transform: rotate(-45deg);
		margin-top: -2rpx;
	}

	&__text {
		font-size: $font-size-xs;
		color: $text-muted;
	}
}

// 动画
@keyframes heroFadeIn {
	from {
		opacity: 0;
		transform: translateY(-20rpx);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

@keyframes cardSlideUp {
	from {
		opacity: 0;
		transform: translateY(40rpx);
	}
	to {
		opacity: 1;
		transform: translateY(0);
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

	.navbar__back:active {
		background: rgba(255, 255, 255, 0.08);
	}

	.navbar__title {
		color: $dark-text-primary;
	}
}

// 深色模式
.page--dark {
	background: linear-gradient(180deg, rgba(14, 165, 233, 0.08) 0%, $dark-bg-base 35%);

	.hero {
		&__icon-bg {
			background: linear-gradient(
				135deg,
				rgba(56, 189, 248, 0.08) 0%,
				rgba(14, 165, 233, 0.12) 50%,
				rgba(2, 132, 199, 0.08) 100%
			);
		}

		&__title {
			color: $dark-text-primary;
		}

		&__subtitle {
			color: $dark-text-muted;
		}
	}

	.feature-card {
		background: $dark-bg-card;
		box-shadow: none;

		&__title {
			color: $dark-text-primary;
		}

		&__desc {
			color: $dark-text-secondary;
		}

		&__tag--primary {
			background: rgba(74, 144, 217, 0.1);
		}

		&__tag--sky {
			background: rgba(56, 189, 248, 0.1);
		}

		&__tag-text--primary {
			color: $dark-color-primary;
		}

		&__tag-text--sky {
			color: #38BDF8;
		}

		&__arrow {
			border-color: $dark-text-muted;
		}
	}

	.privacy-banner {
		&__shield {
			border-color: rgba(16, 185, 129, 0.6);
		}

		&__check {
			border-color: rgba(16, 185, 129, 0.6);
		}

		&__text {
			color: $dark-text-muted;
		}
	}
}
</style>
