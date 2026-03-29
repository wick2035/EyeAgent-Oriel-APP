<template>
	<view class="page" :class="{ 'page--dark': isDark }">
		<!-- 顶部背景 -->
		<view class="page__bg"></view>

		<!-- 状态栏占位 -->
		<view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>

		<!-- 用户卡片 -->
		<view class="user-card">
			<view class="user-card__avatar">
				<image v-if="userInfo.avatar" class="user-card__avatar-img" :src="userInfo.avatar" mode="aspectFill" />
				<text v-else class="user-card__avatar-text">{{ avatarText }}</text>
			</view>
			<view class="user-card__info">
				<text class="user-card__name">{{ userName }}</text>
				<view class="user-card__badge">
					<text class="user-card__badge-text">普通会员</text>
				</view>
			</view>
			<view class="user-card__actions">
				<view class="user-card__action" @click="togglePatientSelector">
					<view class="switch-patient-icon" :class="{ 'switch-patient-icon--active': showPatientSelector }"></view>
				</view>
				<view class="user-card__action" @click="goToSettings">
					<image class="settings-icon" src="@/static/setting.svg" mode="aspectFit" />
				</view>
			</view>
		</view>

		<!-- 就诊人选择栏（默认折叠） -->
		<view class="patient-selector-wrap" :class="{ 'patient-selector-wrap--open': showPatientSelector }">
			<PatientSelector v-if="selectorLoaded" />
		</view>

		<!-- 健康档案入口 -->
		<view class="health-entry" @click="goToHealthRecord">
			<view class="health-entry__icon">
				<image class="health-icon-img" src="@/static/Heath-file.svg" mode="aspectFit" />
			</view>
			<view class="health-entry__content">
				<text class="health-entry__title">{{ healthRecordTitle }}</text>
				<text class="health-entry__desc">记录健康数据，AI更懂{{ isCurrentSelf ? '您' : currentPatientName }}</text>
			</view>
			<view class="health-entry__arrow"></view>
		</view>

		<!-- 功能列表 -->
		<view class="menu-section">
			<view class="menu-section__title">服务</view>
			<view class="menu-list">
				<view
					v-for="(item, index) in serviceMenus"
					:key="index"
					class="menu-item"
					@click="handleMenu(item)"
				>
					<view class="menu-item__icon" :style="{ background: getIconBgColor(item) }">
						<image v-if="item.icon === 'orders'" class="menu-icon menu-icon--orders" src="@/static/shop.svg" mode="aspectFit" />
						<image v-else-if="item.icon === 'medicine'" class="menu-icon menu-icon--medicine" src="@/static/medicine.svg" mode="aspectFit" />
						<image v-else-if="item.icon === 'telemedicine'" class="menu-icon menu-icon--telemedicine" src="@/static/cloud.svg" mode="aspectFit" />
						<view v-else-if="item.icon === 'surgery'" class="menu-icon menu-icon--surgery"></view>
						<view v-else-if="item.icon === 'eye-exercise'" class="menu-icon menu-icon--eye-exercise"></view>
						<view v-else class="menu-icon" :class="[`menu-icon--${item.icon}`]"></view>
					</view>
					<text class="menu-item__text">{{ item.title }}</text>
					<view class="menu-item__arrow"></view>
				</view>
			</view>
		</view>

		<view class="menu-section">
			<view class="menu-section__title">设置</view>
			<view class="menu-list">
				<view
					v-for="(item, index) in settingMenus"
					:key="index"
					class="menu-item"
					@click="handleMenu(item)"
				>
					<view class="menu-item__icon" :style="{ background: getIconBgColor(item) }">
						<image v-if="item.icon === 'theme'" class="menu-icon menu-icon--theme" src="@/static/moon.svg" mode="aspectFit" />
						<view v-else class="menu-icon" :class="[`menu-icon--${item.icon}`]"></view>
					</view>
					<text class="menu-item__text">{{ item.title }}</text>
					<view v-if="item.type === 'switch'" class="menu-item__switch">
						<switch :checked="isDark" @change="toggleTheme" color="#1E3A5F" />
					</view>
					<view v-else class="menu-item__arrow"></view>
				</view>
			</view>
		</view>

		<!-- 版本信息 -->
		<view class="version">
			<text class="version__text">AI医问通 v{{ appVersion }}</text>
		</view>

		<!-- 底部占位 -->
		<view class="tabbar-placeholder"></view>

		<!-- 底部导航 -->
		<TabBar />

		<!-- 顶部通知栏 -->
    <TopNotificationBar />
	</view>
</template>

<script>
import TabBar from '@/components/TabBar.vue'
import PatientSelector from '@/components/PatientSelector.vue'
import { isDarkMode, setTheme, THEME_LIGHT, THEME_DARK } from '@/store/theme.js'
import { getUserInfo, isLoggedIn } from '@/store/user.js'
import { getCurrentPatient, isCurrentSelf as checkIsCurrentSelf } from '@/store/family.js'
import { getCurrentVersion } from '@/utils/version.js'

import TopNotificationBar from '@/components/TopNotificationBar.vue'

export default {
	components: {
		TopNotificationBar,
		TabBar,
		PatientSelector,
	},
	data() {
		return {
			statusBarHeight: 44,
			appVersion: '1.0.0',
			showPatientSelector: false,
			selectorLoaded: false,
			serviceMenus: [
				{ title: '我的订单', icon: 'orders', bgColor: 'rgba(249, 115, 22, 0.1)' },
				{ title: '就诊记录', icon: 'record', bgColor: 'rgba(30, 58, 95, 0.1)' },
				{ title: '云上医院', icon: 'telemedicine', bgColor: 'rgba(14, 165, 233, 0.1)' },
				{ title: '用药提醒', icon: 'medicine', bgColor: 'rgba(16, 185, 129, 0.1)' },
				{ title: '手术进度', icon: 'surgery', bgColor: 'rgba(255, 107, 91, 0.1)' },
				{ title: '护眼锻炼', icon: 'eye-exercise', bgColor: 'rgba(16, 185, 129, 0.1)' }
			],
			settingMenus: [
				{ title: '深色模式', icon: 'theme', bgColor: 'rgba(102, 126, 234, 0.1)', type: 'switch' },
				{ title: '帮助中心', icon: 'help', bgColor: 'rgba(59, 130, 246, 0.1)' },
				{ title: '关于我们', icon: 'about', bgColor: 'rgba(139, 148, 158, 0.1)' }
			]
		}
	},
	computed: {
		isDark() {
			return isDarkMode()
		},
		userInfo() {
			return getUserInfo()
		},
		userName() {
			return this.userInfo.name || '未设置昵称'
		},
		avatarText() {
			const name = this.userInfo.name || '用'
			return name.charAt(0).toUpperCase()
		},
		currentPatientName() {
			const patient = getCurrentPatient()
			return patient ? patient.name : ''
		},
		isCurrentSelf() {
			return checkIsCurrentSelf()
		},
		healthRecordTitle() {
			if (this.isCurrentSelf) return '我的健康档案'
			return this.currentPatientName + '的健康档案'
		}
	},
	onLoad() {
		this.getStatusBarHeight()
		this.appVersion = getCurrentVersion()
	},
	onShow() {
		// #ifdef APP-PLUS
		uni.hideTabBar({ animation: false })
		// #endif
	},
	methods: {
		getStatusBarHeight() {
			const sysInfo = uni.getSystemInfoSync()
			this.statusBarHeight = sysInfo.statusBarHeight || 44
		},
		togglePatientSelector() {
			this.showPatientSelector = !this.showPatientSelector
			if (this.showPatientSelector && !this.selectorLoaded) {
				this.selectorLoaded = true
			}
		},
		goToSettings() {
			uni.navigateTo({
				url: '/pages/settings/settings'
			})
		},
		goToHealthRecord() {
			uni.navigateTo({
				url: '/pages/profile/health-record'
			})
		},
		handleMenu(item) {
			if (item.type === 'switch') return

			// 我的订单跳转
			if (item.icon === 'orders') {
				uni.navigateTo({
					url: '/pages/orders/my-orders'
				})
				return
			}

			// 就诊记录跳转
			if (item.icon === 'record') {
				uni.navigateTo({
					url: '/pages/profile/medical-records'
				})
				return
			}

			// 用药提醒跳转
			if (item.icon === 'medicine') {
				uni.navigateTo({
					url: '/pages/medication/medication-reminder'
				})
				return
			}

			// 手术进度跳转
			if (item.icon === 'surgery') {
				uni.navigateTo({
					url: '/pages/surgery/surgery-progress'
				})
				return
			}

			// 护眼锻炼跳转
			if (item.icon === 'eye-exercise') {
				uni.navigateTo({
					url: '/pages/eye-exercise/index'
				})
				return
			}

			// 远程复诊跳转
			if (item.icon === 'telemedicine') {
				uni.navigateTo({
					url: '/pages/profile/telemedicine'
				})
				return
			}

			// 帮助中心跳转
			if (item.icon === 'help') {
				uni.navigateTo({
					url: '/pages/settings/help-center'
				})
				return
			}

			// 关于我们跳转
			if (item.icon === 'about') {
				uni.navigateTo({
					url: '/pages/settings/about'
				})
				return
			}

			uni.showToast({ title: `${item.title}开发中`, icon: 'none' })
		},
		toggleTheme(e) {
			const isDarkMode = e.detail.value
			setTheme(isDarkMode ? THEME_DARK : THEME_LIGHT)
		},
		getIconBgColor(item) {
			if (this.isDark && item.icon === 'record') {
				return 'rgba(74, 144, 217, 0.15)'
			}
			return item.bgColor
		}
	}
}
</script>

<style lang="scss" scoped>
.page {
	min-height: 100vh;
	background: $bg-base;
	position: relative;

	&__bg {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 400rpx;
		background: linear-gradient(180deg, #E8F4FD 0%, $bg-base 100%);
	}

	&--dark {
		background: $dark-bg-base;

		.page__bg {
			background: linear-gradient(180deg, rgba(74, 144, 217, 0.1) 0%, $dark-bg-base 100%);
		}
	}
}

.status-bar {
	position: relative;
	z-index: 1;
}

.user-card {
	position: relative;
	z-index: 1;
	display: flex;
	align-items: center;
	margin: $spacing-lg;
	padding: $spacing-lg;
	background: $bg-card;
	border-radius: $radius-xl;
	box-shadow: $shadow-md;

	&__avatar {
		width: 120rpx;
		height: 120rpx;
		background: linear-gradient(135deg, $color-primary-light 0%, $color-primary 100%);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: $spacing-lg;
	}

	&__avatar-text {
		font-size: $font-size-2xl;
		color: #fff;
		font-weight: $font-weight-bold;
	}

	&__avatar-img {
		width: 100%;
		height: 100%;
		border-radius: 50%;
	}

	&__info {
		flex: 1;
	}

	&__name {
		font-size: $font-size-xl;
		font-weight: $font-weight-semibold;
		color: $text-primary;
		display: block;
		margin-bottom: $spacing-xs;
	}

	&__badge {
		display: inline-block;
		padding: 4rpx 16rpx;
		background: rgba(245, 158, 11, 0.1);
		border-radius: $radius-sm;
	}

	&__badge-text {
		font-size: $font-size-xs;
		color: $color-warning;
	}

	&__actions {
		display: flex;
		align-items: center;
		gap: 4rpx;
	}

	&__action {
		width: 72rpx;
		height: 72rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}
}

.switch-patient-icon {
	width: 40rpx;
	height: 36rpx;
	position: relative;

	// 前面的人头
	&::before {
		content: '';
		position: absolute;
		width: 14rpx;
		height: 14rpx;
		border: 3rpx solid $text-muted;
		border-radius: 50%;
		top: 2rpx;
		left: 4rpx;
		transition: border-color 250ms ease;
	}

	// 后面的人头
	&::after {
		content: '';
		position: absolute;
		width: 14rpx;
		height: 14rpx;
		border: 3rpx solid $text-muted;
		border-radius: 50%;
		top: 6rpx;
		right: 4rpx;
		transition: border-color 250ms ease;
	}

	&--active::before,
	&--active::after {
		border-color: $color-primary;
	}
}

.patient-selector-wrap {
	position: relative;
	z-index: 1;
	max-height: 0;
	opacity: 0;
	overflow: hidden;
	transition: max-height 300ms ease, opacity 250ms ease;

	&--open {
		max-height: 360rpx;
		opacity: 1;
	}
}

.settings-icon {
	width: 40rpx;
	height: 40rpx;
}

.health-entry {
	position: relative;
	z-index: 1;
	display: flex;
	align-items: center;
	margin: 0 $spacing-lg $spacing-lg;
	padding: $spacing-lg;
	background: linear-gradient(135deg, #1E3A5F 0%, #4A90D9 100%);
	border-radius: $radius-xl;
	box-shadow: $shadow-md;

	&__icon {
		width: 88rpx;
		height: 88rpx;
		background: rgba(255, 255, 255, 0.2);
		border-radius: $radius-md;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: $spacing-md;
	}

	&__content {
		flex: 1;
	}

	&__title {
		font-size: $font-size-lg;
		font-weight: $font-weight-semibold;
		color: #fff;
		display: block;
		margin-bottom: 4rpx;
	}

	&__desc {
		font-size: $font-size-sm;
		color: rgba(255, 255, 255, 0.8);
	}

	&__arrow {
		width: 16rpx;
		height: 16rpx;
		border-top: 3rpx solid rgba(255, 255, 255, 0.8);
		border-right: 3rpx solid rgba(255, 255, 255, 0.8);
		transform: rotate(45deg);
	}
}

.health-icon-img {
	width: 44rpx;
	height: 44rpx;
	// 黑色SVG转为白色
	filter: brightness(0) invert(1);
}

.menu-section {
	position: relative;
	z-index: 1;
	margin: 0 $spacing-lg $spacing-lg;

	&__title {
		font-size: $font-size-sm;
		color: $text-muted;
		margin-bottom: $spacing-sm;
		padding-left: $spacing-sm;
	}
}

.menu-list {
	background: $bg-card;
	border-radius: $radius-xl;
	box-shadow: $shadow-sm;
	overflow: hidden;
}

.menu-item {
	display: flex;
	align-items: center;
	padding: $spacing-md $spacing-lg;
	border-bottom: 1rpx solid $border-color-light;

	&:last-child {
		border-bottom: none;
	}

	&__icon {
		width: 72rpx;
		height: 72rpx;
		border-radius: $radius-md;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: $spacing-md;
	}

	&__text {
		flex: 1;
		font-size: $font-size-base;
		color: $text-primary;
	}

	&__arrow {
		width: 16rpx;
		height: 16rpx;
		border-top: 3rpx solid $text-muted;
		border-right: 3rpx solid $text-muted;
		transform: rotate(45deg);
	}

	&__switch {
		transform: scale(0.8);
	}
}

.menu-icon {
	width: 36rpx;
	height: 36rpx;
	position: relative;

	&--record {
		border: 3rpx solid $color-primary;
		border-radius: 6rpx;
		&::before {
			content: '';
			position: absolute;
			top: 8rpx;
			left: 6rpx;
			right: 6rpx;
			height: 3rpx;
			background: $color-primary;
		}
		&::after {
			content: '';
			position: absolute;
			top: 16rpx;
			left: 6rpx;
			width: 50%;
			height: 3rpx;
			background: $color-primary;
		}
	}

	&--star {
		&::before {
			content: '';
			position: absolute;
			top: 0;
			left: 50%;
			transform: translateX(-50%);
			width: 0;
			height: 0;
			border-left: 18rpx solid transparent;
			border-right: 18rpx solid transparent;
			border-bottom: 12rpx solid $color-warning;
		}
		&::after {
			content: '';
			position: absolute;
			bottom: 0;
			left: 50%;
			transform: translateX(-50%);
			width: 0;
			height: 0;
			border-left: 18rpx solid transparent;
			border-right: 18rpx solid transparent;
			border-top: 24rpx solid $color-warning;
		}
	}

	&--medicine {
		width: 36rpx;
		height: 36rpx;
		border: none;
		border-radius: 0;
		// 将黑色 SVG 转为绿色 #10B981
		filter: invert(56%) sepia(52%) saturate(552%) hue-rotate(118deg) brightness(92%) contrast(94%);
	}

	&--orders {
		width: 36rpx;
		height: 36rpx;
		border: none;
		border-radius: 0;
		// 将黑色SVG转为橙色（降低饱和度和亮度，避免iOS端过亮）
		filter: invert(48%) sepia(90%) saturate(800%) hue-rotate(2deg) brightness(98%) contrast(96%);
	}

	&--telemedicine {
		width: 36rpx;
		height: 36rpx;
		border: none;
		border-radius: 0;
		// 将黑色SVG转为天空蓝 #0EA5E9
		filter: invert(52%) sepia(94%) saturate(1095%) hue-rotate(176deg) brightness(98%) contrast(92%);
	}

	&--theme {
		width: 36rpx;
		height: 36rpx;
		// 将黑色SVG转为紫色 #667EEA
		filter: invert(48%) sepia(79%) saturate(2476%) hue-rotate(218deg) brightness(98%) contrast(85%);
	}

	&--help {
		border: 3rpx solid $color-info;
		border-radius: 50%;
		&::before {
			content: '?';
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			font-size: 24rpx;
			color: $color-info;
			font-weight: bold;
		}
	}

	&--about {
		border: 3rpx solid #8B949E;
		border-radius: 50%;
		&::before {
			content: 'i';
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			font-size: 24rpx;
			color: #8B949E;
			font-weight: bold;
			font-style: italic;
		}
	}

	&--surgery {
		// 眼睛外轮廓
		width: 36rpx;
		height: 20rpx;
		border: 3rpx solid $color-accent;
		border-radius: 70% 70% 70% 70% / 100% 100% 100% 100%;
		position: relative;

		// 瞳孔
		&::before {
			content: '';
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			width: 12rpx;
			height: 12rpx;
			background: $color-accent;
			border-radius: 50%;
		}

		// 高光点
		&::after {
			content: '';
			position: absolute;
			top: 35%;
			left: 58%;
			width: 4rpx;
			height: 4rpx;
			background: #fff;
			border-radius: 50%;
		}
	}

	&--eye-exercise {
		// 眼睛外轮廓
		width: 36rpx;
		height: 20rpx;
		border: 3rpx solid #10B981;
		border-radius: 70% 70% 70% 70% / 100% 100% 100% 100%;
		position: relative;

		// 瞳孔
		&::before {
			content: '';
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			width: 10rpx;
			height: 10rpx;
			background: #10B981;
			border-radius: 50%;
		}

		// 运动弧线
		&::after {
			content: '';
			position: absolute;
			top: -8rpx;
			right: -10rpx;
			width: 24rpx;
			height: 24rpx;
			border: 2rpx solid transparent;
			border-top-color: #10B981;
			border-radius: 50%;
			transform: rotate(30deg);
		}
	}
}

.version {
	position: relative;
	z-index: 1;
	text-align: center;
	padding: $spacing-xl 0;

	&__text {
		font-size: $font-size-xs;
		color: $text-muted;
	}
}

.tabbar-placeholder {
	height: calc(140rpx + env(safe-area-inset-bottom));
}

// 深色模式
.page--dark {
	.user-card {
		background: $dark-bg-card;
		&__name { color: $dark-text-primary; }
	}
	.switch-patient-icon::before,
	.switch-patient-icon::after {
		border-color: $dark-text-muted;
	}
	.switch-patient-icon--active::before,
	.switch-patient-icon--active::after {
		border-color: $dark-color-primary;
	}

	.settings-icon {
		// 深色模式下将黑色SVG转为浅色
		filter: invert(70%) sepia(10%) saturate(200%) hue-rotate(180deg) brightness(90%);
	}

	.health-entry {
		background: linear-gradient(135deg, #1E3A5F 0%, rgba(74, 144, 217, 0.9) 100%);
	}

	.menu-section__title { color: $dark-text-muted; }
	.menu-list { background: $dark-bg-card; }
	.menu-item {
		border-bottom-color: $dark-border-color;
		&__text { color: $dark-text-primary; }
		&__arrow { border-color: $dark-text-muted; }
	}

	// 手术图标深色模式适配
	.menu-icon--surgery {
		border-color: #FF8A7A;
		&::before {
			background: #FF8A7A;
		}
	}

	// 护眼锻炼图标深色模式适配
	.menu-icon--eye-exercise {
		border-color: #34D399;
		&::before {
			background: #34D399;
		}
		&::after {
			border-top-color: #34D399;
		}
	}

	// 就诊记录图标深色模式适配
	.menu-icon--record {
		border-color: $dark-color-primary;
		&::before {
			background: $dark-color-primary;
		}
		&::after {
			background: $dark-color-primary;
		}
	}

	.version__text { color: $dark-text-muted; }
}
</style>
