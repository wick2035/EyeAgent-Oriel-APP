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
		<view class="main" :style="{ paddingTop: (statusBarHeight * 2 + 88) + 'rpx' }">
			<!-- 顶部提示 -->
			<view class="tip-bar">
				<image class="tip-bar__icon" src="@/static/chat-online.svg" mode="aspectFit" />
				<text class="tip-bar__text">选择医生，开启您的在线健康咨询</text>
			</view>

			<!-- 医生列表 -->
			<view class="doctor-list">
				<view
					v-for="(doctor, index) in doctors"
					:key="doctor.id"
					class="doctor-card"
					:class="{ 'doctor-card--show': animationReady }"
					:style="{ animationDelay: (index * 120) + 'ms' }"
				>
					<!-- 顶部：头像 + 基本信息 -->
					<view class="doctor-card__top">
						<view class="doctor-card__avatar">
							<image
								:src="doctor.avatar || '/static/temporary/male.jpg'"
								class="doctor-card__avatar-img"
								mode="aspectFill"
							/>
							<view v-if="doctor.online" class="doctor-card__online"></view>
						</view>
						<view class="doctor-card__info">
							<view class="doctor-card__name-row">
								<text class="doctor-card__name">{{ doctor.name }}</text>
								<view class="doctor-card__title-tag">
									<text class="doctor-card__title-text">{{ doctor.title }}</text>
								</view>
							</view>
							<text class="doctor-card__dept">{{ doctor.department }}</text>
							<view v-if="doctor.online" class="doctor-card__status-row">
								<view class="doctor-card__status-dot"></view>
								<text class="doctor-card__status-text">在线</text>
							</view>
						</view>
					</view>

					<!-- 统计栏：评分 / 问诊量 / 从医年限 -->
					<view class="doctor-card__stats">
						<view class="doctor-card__stat">
							<image class="doctor-card__stat-icon doctor-card__stat-icon--star" src="@/static/star.svg" mode="aspectFit" />
							<view class="doctor-card__stat-content">
								<text class="doctor-card__stat-value">{{ doctor.rating }}</text>
								<text class="doctor-card__stat-label">评分</text>
							</view>
						</view>
						<view class="doctor-card__divider"></view>
						<view class="doctor-card__stat">
							<image class="doctor-card__stat-icon doctor-card__stat-icon--consult" src="@/static/wenzhenliang.svg" mode="aspectFit" />
							<view class="doctor-card__stat-content">
								<text class="doctor-card__stat-value">{{ doctor.consultCount }}</text>
								<text class="doctor-card__stat-label">问诊量</text>
							</view>
						</view>
						<view class="doctor-card__divider"></view>
						<view class="doctor-card__stat">
							<image class="doctor-card__stat-icon doctor-card__stat-icon--exp" src="@/static/congyinianxian.svg" mode="aspectFit" />
							<view class="doctor-card__stat-content">
								<text class="doctor-card__stat-value">{{ doctor.experience }}年</text>
								<text class="doctor-card__stat-label">从医年限</text>
							</view>
						</view>
					</view>

					<!-- 擅长标签 -->
					<view v-if="doctor.specialties && doctor.specialties.length" class="doctor-card__specialties">
						<view
							v-for="(tag, ti) in doctor.specialties.slice(0, 3)"
							:key="ti"
							class="doctor-card__specialty-tag"
						>
							<text class="doctor-card__specialty-text">{{ tag }}</text>
						</view>
					</view>

					<!-- 医生简介 -->
					<text v-if="doctor.introduction" class="doctor-card__intro">{{ doctor.introduction }}</text>

					<!-- 底部操作按钮 -->
					<view class="doctor-card__actions">
						<view class="doctor-card__action-btn doctor-card__action-btn--text" @click.stop="goTextConsult(doctor)">
							<image class="doctor-card__action-icon" src="@/static/chat-online.svg" mode="aspectFit" />
							<text class="doctor-card__action-label">图文咨询</text>
						</view>
						<view class="doctor-card__action-btn doctor-card__action-btn--video" @click.stop="goVideoConsult(doctor)">
							<image class="doctor-card__action-icon doctor-card__action-icon--white" src="@/static/camera.svg" mode="aspectFit" />
							<text class="doctor-card__action-label doctor-card__action-label--white">视频问诊</text>
						</view>
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
		goTextConsult(doctor) {
			uni.navigateTo({
				url: `/pages/messages/doctor-chat?id=${doctor.id}&name=${doctor.name}&department=${doctor.department}&type=text`
			})
		},
		goVideoConsult() {
			uni.showToast({
				title: '视频问诊即将开通',
				icon: 'none',
				duration: 2000
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
	padding: $spacing-md $spacing-lg;
	margin-top: $spacing-xl;
	margin-bottom: $spacing-lg;
	background: rgba(51, 136, 255, 0.05);
	border-radius: $radius-lg;
	border: 2rpx solid rgba(51, 136, 255, 0.1);

	&__icon {
		width: 32rpx;
		height: 32rpx;
		margin-right: $spacing-sm;
		flex-shrink: 0;
		filter: invert(40%) sepia(80%) saturate(1800%) hue-rotate(200deg) brightness(100%) contrast(100%);
	}

	&__text {
		font-size: $font-size-sm;
		color: #3388ff;
		font-weight: $font-weight-medium;
	}
}

// 医生列表
.doctor-list {
	display: flex;
	flex-direction: column;
	gap: 24rpx;
}

// 医生卡片
.doctor-card {
	display: flex;
	flex-direction: column;
	padding: $spacing-lg;
	background: $bg-card;
	border-radius: 24rpx;
	box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.06);
	opacity: 0;
	transform: translateY(40rpx);

	&--show {
		animation: cardFadeIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
	}

	// 顶部区：头像 + 基本信息
	&__top {
		display: flex;
		align-items: flex-start;
		gap: $spacing-md;
	}

	// 头像
	&__avatar {
		position: relative;
		width: 120rpx;
		height: 120rpx;
		border-radius: 16rpx;
		background: linear-gradient(135deg, #e8f2ff 0%, #c6dfff 100%);
		flex-shrink: 0;
		box-shadow: 0 8rpx 24rpx rgba(51, 136, 255, 0.18);
		overflow: visible;
	}

	&__avatar-img {
		width: 120rpx;
		height: 120rpx;
		border-radius: 16rpx;
	}

	&__online {
		position: absolute;
		bottom: -4rpx;
		right: -4rpx;
		width: 22rpx;
		height: 22rpx;
		border-radius: 50%;
		background: $color-success;
		border: 4rpx solid $bg-card;
		box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.12);
	}

	// 信息区
	&__info {
		flex: 1;
		padding-top: 4rpx;
	}

	&__name-row {
		display: flex;
		align-items: center;
		gap: $spacing-sm;
		flex-wrap: wrap;
	}

	&__name {
		font-size: 34rpx;
		font-weight: $font-weight-bold;
		color: $text-primary;
		letter-spacing: 1rpx;
	}

	&__title-tag {
		padding: 4rpx 16rpx;
		background: rgba(51, 136, 255, 0.08);
		border-radius: $radius-full;
	}

	&__title-text {
		font-size: $font-size-xs;
		color: #3388ff;
		font-weight: $font-weight-medium;
	}

	&__dept {
		display: block;
		font-size: $font-size-sm;
		color: $text-muted;
		margin-top: 8rpx;
	}

	&__status-row {
		display: flex;
		align-items: center;
		gap: 8rpx;
		margin-top: 10rpx;
	}

	&__status-dot {
		width: 12rpx;
		height: 12rpx;
		border-radius: 50%;
		background: $color-success;
	}

	&__status-text {
		font-size: $font-size-xs;
		color: $color-success;
		font-weight: $font-weight-medium;
	}

	// 统计栏
	&__stats {
		display: flex;
		align-items: center;
		justify-content: space-around;
		margin-top: $spacing-lg;
		padding: $spacing-md 0;
		border-top: 2rpx solid $border-color-light;
		border-bottom: 2rpx solid $border-color-light;
	}

	&__stat {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: $spacing-sm;
	}

	&__stat-icon {
		width: 36rpx;
		height: 36rpx;
		flex-shrink: 0;

		&--star {
			filter: invert(72%) sepia(60%) saturate(800%) hue-rotate(10deg) brightness(105%) contrast(100%);
		}

		&--consult {
			filter: invert(40%) sepia(80%) saturate(1800%) hue-rotate(200deg) brightness(100%) contrast(100%);
		}

		&--exp {
			filter: invert(45%) sepia(60%) saturate(600%) hue-rotate(240deg) brightness(90%) contrast(100%);
		}
	}

	&__stat-content {
		display: flex;
		flex-direction: column;
		gap: 2rpx;
	}

	&__stat-value {
		font-size: $font-size-md;
		font-weight: $font-weight-bold;
		color: $text-primary;
		line-height: 1.2;
	}

	&__stat-label {
		font-size: $font-size-xs;
		color: $text-muted;
	}

	&__divider {
		width: 2rpx;
		height: 48rpx;
		background: $border-color-light;
	}

	// 擅长标签
	&__specialties {
		display: flex;
		flex-wrap: wrap;
		gap: 12rpx;
		margin-top: $spacing-md;
	}

	&__specialty-tag {
		padding: 6rpx 20rpx;
		background: rgba(51, 136, 255, 0.07);
		border-radius: $radius-full;
	}

	&__specialty-text {
		font-size: $font-size-xs;
		color: #3388ff;
		font-weight: $font-weight-medium;
	}

	// 简介
	&__intro {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		font-size: $font-size-sm;
		color: $text-secondary;
		line-height: 1.6;
		margin-top: $spacing-md;
	}

	// 底部操作按钮区
	&__actions {
		display: flex;
		gap: 16rpx;
		margin-top: $spacing-lg;
	}

	&__action-btn {
		flex: 1;
		height: 80rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10rpx;
		border-radius: $radius-lg;
		transition: opacity 0.2s ease, transform 0.15s ease;

		&:active {
			opacity: 0.8;
			transform: scale(0.97);
		}

		&--text {
			background: rgba(51, 136, 255, 0.07);
			border: 2rpx solid rgba(51, 136, 255, 0.3);
		}

		&--video {
			background: linear-gradient(135deg, #3388ff 0%, #5EAAFF 100%);
			box-shadow: 0 6rpx 18rpx rgba(51, 136, 255, 0.3);
		}
	}

	&__action-icon {
		width: 32rpx;
		height: 32rpx;
		filter: invert(40%) sepia(80%) saturate(1800%) hue-rotate(200deg) brightness(100%) contrast(100%);

		&--white {
			filter: brightness(0) invert(1);
		}
	}

	&__action-label {
		font-size: $font-size-sm;
		font-weight: $font-weight-semibold;
		color: #3388ff;

		&--white {
			color: #fff;
		}
	}
}

@keyframes cardFadeIn {
	from {
		opacity: 0;
		transform: translateY(40rpx);
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
		background: rgba(51, 136, 255, 0.08);
		border-color: rgba(51, 136, 255, 0.15);

		&__text {
			color: #5EAAFF;
		}

		&__icon {
			filter: invert(60%) sepia(60%) saturate(1200%) hue-rotate(200deg) brightness(110%) contrast(100%);
		}
	}

	.doctor-card {
		background: $dark-bg-card;
		box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.3);

		&__online {
			border-color: $dark-bg-card;
		}

		&__name {
			color: $dark-text-primary;
		}

		&__title-tag {
			background: rgba(94, 170, 255, 0.12);
		}

		&__title-text {
			color: #5EAAFF;
		}

		&__dept {
			color: $dark-text-muted;
		}

		&__status-text {
			color: $color-success;
		}

		&__stats {
			border-color: $dark-border-color;
		}

		&__stat-value {
			color: $dark-text-primary;
		}

		&__stat-label {
			color: $dark-text-muted;
		}

		&__divider {
			background: $dark-border-color;
		}

		&__specialty-tag {
			background: rgba(94, 170, 255, 0.1);
		}

		&__specialty-text {
			color: #5EAAFF;
		}

		&__intro {
			color: $dark-text-secondary;
		}

		&__action-btn {
			&--text {
				background: rgba(94, 170, 255, 0.1);
				border-color: rgba(94, 170, 255, 0.25);
			}

			&--video {
				background: linear-gradient(135deg, #2277ee 0%, #4499ff 100%);
				box-shadow: 0 6rpx 18rpx rgba(51, 136, 255, 0.2);
			}
		}

		&__action-label {
			color: #5EAAFF;

			&--white {
				color: #fff;
			}
		}

		&__action-icon {
			filter: invert(60%) sepia(60%) saturate(1200%) hue-rotate(200deg) brightness(110%) contrast(100%);

			&--white {
				filter: brightness(0) invert(1);
			}
		}
	}
}
</style>
