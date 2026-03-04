<template>
	<view class="page" :class="{ 'page--dark': isDark }">
		<!-- 自定义导航栏 -->
		<view class="navbar">
			<view class="navbar__status" :style="{ height: statusBarHeight + 'px' }"></view>
			<view class="navbar__content">
				<view class="navbar__back" @click="goBack">
					<view class="navbar__back-icon"></view>
				</view>
				<text class="navbar__title">在线咨询</text>
				<view class="navbar__placeholder"></view>
			</view>
		</view>

		<!-- 主内容区 -->
		<view class="main" :style="{ paddingTop: (statusBarHeight + 88) + 'rpx' }">
			<!-- 顶部提示 -->
			<view class="tip-bar">
				<image class="tip-bar__icon" src="@/static/chat-online.svg" mode="aspectFit" />
				<text class="tip-bar__text">选择一位医生开始在线咨询</text>
			</view>

			<!-- 医生列表 -->
			<view class="doctor-list">
				<view
					v-for="(doctor, index) in doctors"
					:key="doctor.id"
					class="doctor-card"
					:class="{ 'doctor-card--show': animationReady }"
					:style="{ animationDelay: (index * 80) + 'ms' }"
					@click="startConsultation(doctor)"
				>
					<!-- 头像 -->
					<view class="doctor-card__avatar">
						<image
							:src="doctor.avatar || '/static/temporary/women.jpg'"
							class="doctor-card__avatar-img"
							mode="aspectFill"
						/>
						<view v-if="doctor.online" class="doctor-card__online"></view>
					</view>

					<!-- 信息区 -->
					<view class="doctor-card__info">
						<view class="doctor-card__row">
							<text class="doctor-card__name">{{ doctor.name }}</text>
							<view class="doctor-card__title-tag">
								<text class="doctor-card__title-text">{{ doctor.title }}</text>
							</view>
						</view>
						<text class="doctor-card__dept">{{ doctor.department }}</text>
						<text class="doctor-card__preview">{{ doctor.lastMessage }}</text>
					</view>

					<!-- 操作按钮 -->
					<view class="doctor-card__action">
						<text class="doctor-card__btn">开始咨询</text>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { getMockDoctorConversations } from '@/utils/mock/doctorChat.js'
import { isDarkMode } from '@/store/theme.js'

export default {
	data() {
		return {
			statusBarHeight: 44,
			doctors: [],
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
		this.doctors = getMockDoctorConversations()
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
		startConsultation(doctor) {
			uni.navigateTo({
				url: `/pages/messages/doctor-chat?id=${doctor.id}&name=${doctor.name}&department=${doctor.department}`
			})
		}
	}
}
</script>

<style lang="scss" scoped>
.page {
	min-height: 100vh;
	background: $bg-base;
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

// 主内容
.main {
	padding: 0 $spacing-lg;
	padding-bottom: calc(#{$spacing-xl} + env(safe-area-inset-bottom));
}

// 提示栏
.tip-bar {
	display: flex;
	align-items: center;
	padding: $spacing-md;
	margin-top: $spacing-xl;
	margin-bottom: $spacing-md;
	background: rgba(30, 58, 95, 0.04);
	border-radius: $radius-lg;

	&__icon {
		width: 32rpx;
		height: 32rpx;
		margin-right: $spacing-sm;
		filter: invert(20%) sepia(50%) saturate(2000%) hue-rotate(200deg) brightness(90%) contrast(95%);
	}

	&__text {
		font-size: $font-size-sm;
		color: $text-secondary;
	}
}

// 医生列表
.doctor-list {
	display: flex;
	flex-direction: column;
	gap: $spacing-md;
}

// 医生卡片
.doctor-card {
	display: flex;
	align-items: center;
	padding: $spacing-lg;
	background: $bg-card;
	border-radius: $radius-xl;
	box-shadow: $shadow-sm;
	opacity: 0;
	transform: translateY(30rpx);
	transition: transform $transition-fast, box-shadow $transition-fast;

	&--show {
		animation: cardFadeIn 0.4s ease forwards;
	}

	&:active {
		transform: scale(0.98);
		box-shadow: $shadow-md;
	}

	// 头像
	&__avatar {
		position: relative;
		width: 88rpx;
		height: 88rpx;
		border-radius: 50%;
		background: linear-gradient(135deg, $color-primary 0%, $color-primary-light 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	&__avatar-img {
		width: 100%;
		height: 100%;
		border-radius: inherit;
	}

	&__online {
		position: absolute;
		bottom: 2rpx;
		right: 2rpx;
		width: 16rpx;
		height: 16rpx;
		border-radius: 50%;
		background: $color-success;
		border: 3rpx solid #fff;
	}

	// 信息
	&__info {
		flex: 1;
		margin-left: $spacing-md;
		overflow: hidden;
	}

	&__row {
		display: flex;
		align-items: center;
		gap: $spacing-xs;
	}

	&__name {
		font-size: $font-size-lg;
		font-weight: $font-weight-semibold;
		color: $text-primary;
	}

	&__title-tag {
		padding: 2rpx 12rpx;
		background: $bg-elevated;
		border-radius: $radius-full;
	}

	&__title-text {
		font-size: $font-size-xs;
		color: $text-secondary;
	}

	&__dept {
		display: block;
		font-size: $font-size-sm;
		color: $text-muted;
		margin-top: 6rpx;
	}

	&__preview {
		display: block;
		font-size: $font-size-sm;
		color: $text-secondary;
		margin-top: $spacing-sm;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	// 操作按钮
	&__action {
		flex-shrink: 0;
		margin-left: $spacing-md;
	}

	&__btn {
		display: block;
		padding: 12rpx 32rpx;
		background: $color-primary;
		color: #fff;
		border-radius: $radius-full;
		font-size: $font-size-sm;
		font-weight: $font-weight-medium;
		transition: opacity $transition-fast;

		&:active {
			opacity: 0.85;
		}
	}
}

@keyframes cardFadeIn {
	from {
		opacity: 0;
		transform: translateY(30rpx);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

// 深色模式
.page--dark {
	background: $dark-bg-base;

	.navbar {
		background: rgba(22, 27, 34, 0.9);

		&__back-icon {
			border-color: $dark-text-primary;
		}

		&__title {
			color: $dark-text-primary;
		}
	}

	.tip-bar {
		background: rgba(74, 144, 217, 0.06);

		&__text {
			color: $dark-text-secondary;
		}
	}

	.doctor-card {
		background: $dark-bg-card;
		box-shadow: none;

		&__online {
			border-color: $dark-bg-card;
		}

		&__name {
			color: $dark-text-primary;
		}

		&__title-tag {
			background: $dark-bg-elevated;
		}

		&__title-text {
			color: $dark-text-secondary;
		}

		&__dept {
			color: $dark-text-muted;
		}

		&__preview {
			color: $dark-text-secondary;
		}

		&__btn {
			background: $dark-color-primary;
		}
	}
}
</style>
