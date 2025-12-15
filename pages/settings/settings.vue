<template>
	<view class="settings-page" :class="{ 'settings-page--dark': isDark }">
		<!-- 背景层 -->
		<view class="bg-layer">
			<view class="bg-gradient"></view>
			<!-- 漂浮光点 -->
			<view class="particles">
				<view v-for="i in 8" :key="i" class="particle" :class="`particle--${i}`"></view>
			</view>
		</view>

		<!-- 内容区 -->
		<view class="content">
			<!-- 状态栏占位 -->
			<view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>

			<!-- 导航栏 -->
			<view class="navbar" :class="{ 'navbar--visible': pageReady }">
				<view class="navbar__back" @click="goBack">
					<view class="back-icon"></view>
				</view>
				<text class="navbar__title">设置</text>
				<view class="navbar__placeholder"></view>
			</view>

			<!-- 滚动区域 -->
			<scroll-view class="scroll-area" scroll-y>
				<!-- 用户卡片 -->
				<view class="user-card" :class="{ 'card--visible': pageReady }" @click="goEditProfile">
					<view class="user-card__avatar">
						<text class="user-card__avatar-text">{{ avatarText }}</text>
					</view>
					<view class="user-card__info">
						<text class="user-card__name">{{ userInfo.name || '未设置昵称' }}</text>
						<text class="user-card__phone">{{ userInfo.phone || '未绑定手机' }}</text>
					</view>
					<view class="user-card__arrow"></view>
				</view>

				<!-- 账户安全 -->
				<view class="section" :class="{ 'card--visible': pageReady }" style="--delay: 0.1s">
					<text class="section__title">账户安全</text>
					<view class="section__card">
						<view class="menu-item" @click="handleMenu('password')">
							<view class="menu-item__icon menu-item__icon--lock"></view>
							<text class="menu-item__text">修改密码</text>
							<view class="menu-item__arrow"></view>
						</view>
						<view class="menu-item" @click="handleMenu('bindPhone')">
							<view class="menu-item__icon menu-item__icon--phone"></view>
							<text class="menu-item__text">手机号绑定</text>
							<text class="menu-item__value">{{ userInfo.phone || '未绑定' }}</text>
							<view class="menu-item__arrow"></view>
						</view>
					</view>
				</view>

				<!-- 通用设置 -->
				<view class="section" :class="{ 'card--visible': pageReady }" style="--delay: 0.2s">
					<text class="section__title">通用设置</text>
					<view class="section__card">
						<view class="menu-item">
							<view class="menu-item__icon menu-item__icon--bell"></view>
							<text class="menu-item__text">消息通知</text>
							<view class="custom-switch" :class="{ 'custom-switch--on': notifyEnabled }" @click="toggleNotify">
								<view class="custom-switch__track">
									<view class="custom-switch__thumb"></view>
								</view>
							</view>
						</view>
						<view class="menu-item menu-item--no-border" @click="clearCache">
							<view class="menu-item__icon menu-item__icon--trash"></view>
							<text class="menu-item__text">清除缓存</text>
							<text class="menu-item__value">{{ cacheSize }}</text>
							<view class="menu-item__arrow"></view>
						</view>
					</view>
				</view>

				<!-- 关于 -->
				<view class="section" :class="{ 'card--visible': pageReady }" style="--delay: 0.3s">
					<text class="section__title">关于</text>
					<view class="section__card">
						<view class="menu-item" @click="handleMenu('about')">
							<view class="menu-item__icon menu-item__icon--about"></view>
							<text class="menu-item__text">关于我们</text>
							<view class="menu-item__arrow"></view>
						</view>
						<view class="menu-item" @click="handleMenu('agreement')">
							<view class="menu-item__icon menu-item__icon--doc"></view>
							<text class="menu-item__text">用户协议</text>
							<view class="menu-item__arrow"></view>
						</view>
						<view class="menu-item" @click="handleMenu('privacy')">
							<view class="menu-item__icon menu-item__icon--shield"></view>
							<text class="menu-item__text">隐私政策</text>
							<view class="menu-item__arrow"></view>
						</view>
						<view class="menu-item menu-item--no-border">
							<view class="menu-item__icon menu-item__icon--version"></view>
							<text class="menu-item__text">版本号</text>
							<text class="menu-item__value">v1.0.0</text>
						</view>
					</view>
				</view>

				<!-- 退出登录按钮 -->
				<view class="logout-section" :class="{ 'card--visible': pageReady }" style="--delay: 0.4s">
					<view class="logout-btn" @click="handleLogout">
						<text class="logout-btn__text">退出登录</text>
						<view class="logout-btn__pulse"></view>
					</view>
				</view>

				<!-- 底部留白 -->
				<view class="bottom-space"></view>
			</scroll-view>
		</view>

		<!-- 顶部通知栏 -->
		<TopNotificationBar />
	</view>
</template>

<script>
import { getUserInfo, clearLoginState } from '@/store/user.js'
import { isDarkMode } from '@/store/theme.js'
import { logout } from '@/utils/api/user.js'
import { setMuted, getMuted } from '@/utils/websocket.js'
import TopNotificationBar from '@/components/TopNotificationBar.vue'

export default {
	components: {
		TopNotificationBar
	},
	data() {
		return {
			statusBarHeight: 44,
			pageReady: false,
			notifyEnabled: true,
			cacheSize: '12.5 MB'
		}
	},
	computed: {
		userInfo() {
			return getUserInfo()
		},
		avatarText() {
			const name = this.userInfo.name || '用'
			return name.charAt(0).toUpperCase()
		},
		isDark() {
			return isDarkMode()
		}
	},
	onLoad() {
		this.getStatusBarHeight()
		this.calculateCacheSize()
		this.loadNotifySetting()
		setTimeout(() => {
			this.pageReady = true
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

		goEditProfile() {
			uni.navigateTo({
				url: '/pages/settings/edit-profile'
			})
		},

		handleMenu(type) {
			const routes = {
				password: '/pages/settings/change-password',
				agreement: '/pages/settings/user-agreement',
				privacy: '/pages/settings/privacy-policy',
				about: '/pages/settings/about'
			}
			if (routes[type]) {
				uni.navigateTo({ url: routes[type] })
				return
			}
			const messages = {
				bindPhone: '手机绑定功能开发中'
			}
			if (messages[type]) {
				uni.showToast({ title: messages[type], icon: 'none' })
			}
		},

		loadNotifySetting() {
			// getMuted=true 表示静音，notifyEnabled=true 表示开启，逻辑相反
			this.notifyEnabled = !getMuted()
		},

		toggleNotify() {
			this.notifyEnabled = !this.notifyEnabled
			// 同步到 WebSocket 模块并持久化
			setMuted(!this.notifyEnabled)
			uni.showToast({
				title: this.notifyEnabled ? '已开启通知' : '已关闭通知',
				icon: 'none'
			})
		},

		calculateCacheSize() {
			// 模拟计算缓存大小
			try {
				const info = uni.getStorageInfoSync()
				const sizeKB = info.currentSize || 0
				if (sizeKB > 1024) {
					this.cacheSize = (sizeKB / 1024).toFixed(1) + ' MB'
				} else {
					this.cacheSize = sizeKB + ' KB'
				}
			} catch (e) {
				this.cacheSize = '0 KB'
			}
		},

		clearCache() {
			uni.showModal({
				title: '提示',
				content: '确定要清除缓存吗？',
				confirmColor: '#FF6B5B',
				success: (res) => {
					if (res.confirm) {
						uni.showLoading({ title: '清除中...' })
						setTimeout(() => {
							// 保留必要的用户数据
							const token = uni.getStorageSync('auth_token')
							const userInfo = uni.getStorageSync('user_info')
							const theme = uni.getStorageSync('app_theme')
							const notificationMuted = uni.getStorageSync('notification_muted')

							uni.clearStorageSync()

							// 恢复必要数据
							if (token) uni.setStorageSync('auth_token', token)
							if (userInfo) uni.setStorageSync('user_info', userInfo)
							if (theme) uni.setStorageSync('app_theme', theme)
							if (notificationMuted !== undefined && notificationMuted !== '') {
								uni.setStorageSync('notification_muted', notificationMuted)
							}

							this.cacheSize = '0 KB'
							uni.hideLoading()
							uni.showToast({ title: '缓存已清除', icon: 'success' })
						}, 800)
					}
				}
			})
		},

		handleLogout() {
			uni.showModal({
				title: '退出登录',
				content: '确定要退出当前账号吗？',
				confirmColor: '#FF6B5B',
				confirmText: '退出',
				success: async (res) => {
					if (res.confirm) {
						uni.showLoading({ title: '退出中...' })
						try {
							await logout()
						} catch (e) {
							// 即使API失败也继续退出
						}
						clearLoginState()
						uni.hideLoading()
						uni.reLaunch({
							url: '/pages/login/login'
						})
					}
				}
			})
		}
	}
}
</script>

<style lang="scss" scoped>
// ==================== 浅色模式变量 ====================
$light-bg-base: #FAFBFD;
$light-bg-card: #FFFFFF;
$light-text-primary: #1A1A1A;
$light-text-secondary: #666666;
$light-text-muted: #999999;
$light-border: rgba(0, 0, 0, 0.08);
$light-accent: #1E3A5F;

// ==================== 深色模式变量 ====================
$dark-bg-deep: #0A1628;
$dark-bg-mid: #122640;
$dark-bg-light: #1A365D;
$dark-text-light: #F0F6FC;
$dark-text-muted: rgba(240, 246, 252, 0.6);
$dark-glass-bg: rgba(255, 255, 255, 0.06);
$dark-glass-border: rgba(255, 255, 255, 0.1);

// 强调色
$accent-coral: #FF6B5B;
$accent-coral-light: #FF8A7A;

.settings-page {
	min-height: 100vh;
	position: relative;
	overflow: hidden;
	background: $light-bg-base;
}

// ==================== 背景层 ====================
.bg-layer {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 0;
}

.bg-gradient {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: linear-gradient(180deg, #E8F4FD 0%, $light-bg-base 100%);
}

// 漂浮光点（浅色模式隐藏）
.particles {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	pointer-events: none;
	opacity: 0;
}

.particle {
	position: absolute;
	width: 4rpx;
	height: 4rpx;
	background: rgba(255, 255, 255, 0.5);
	border-radius: 50%;
	animation: float-particle 10s ease-in-out infinite;

	&--1 { left: 20%; top: 17%; animation-delay: -1.2s; animation-duration: 9s; }
	&--2 { left: 30%; top: 29%; animation-delay: -2.4s; animation-duration: 10s; }
	&--3 { left: 40%; top: 41%; animation-delay: -3.6s; animation-duration: 11s; }
	&--4 { left: 50%; top: 53%; animation-delay: -4.8s; animation-duration: 12s; }
	&--5 { left: 60%; top: 65%; animation-delay: -6s; animation-duration: 13s; }
	&--6 { left: 70%; top: 77%; animation-delay: -7.2s; animation-duration: 14s; }
	&--7 { left: 80%; top: 89%; animation-delay: -8.4s; animation-duration: 15s; }
	&--8 { left: 90%; top: 100%; animation-delay: -9.6s; animation-duration: 16s; }
}

@keyframes float-particle {
	0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
	50% { transform: translateY(-40rpx) translateX(20rpx); opacity: 0.7; }
}

// ==================== 内容区 ====================
.content {
	position: relative;
	z-index: 1;
	min-height: 100vh;
	display: flex;
	flex-direction: column;
}

.status-bar {
	flex-shrink: 0;
}

// 导航栏
.navbar {
	display: flex;
	align-items: center;
	height: 88rpx;
	padding: 0 32rpx;
	opacity: 0;
	transform: translateY(-20rpx);
	transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);

	&--visible {
		opacity: 1;
		transform: translateY(0);
	}

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
		font-size: 34rpx;
		font-weight: 600;
		color: $light-text-primary;
		letter-spacing: 2rpx;
	}

	&__placeholder {
		width: 72rpx;
	}
}

.back-icon {
	width: 20rpx;
	height: 20rpx;
	border-left: 3rpx solid $light-text-primary;
	border-bottom: 3rpx solid $light-text-primary;
	transform: rotate(45deg);
	margin-left: 8rpx;
}

// 滚动区域
.scroll-area {
	flex: 1;
	padding: 0 32rpx;
	box-sizing: border-box;
	width: 100%;
}

// 入场动画
.card--visible {
	animation: card-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) var(--delay, 0s) both;
}

@keyframes card-in {
	from {
		opacity: 0;
		transform: translateY(40rpx);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

// ==================== 用户卡片 ====================
.user-card {
	display: flex;
	align-items: center;
	padding: 32rpx;
	margin-bottom: 32rpx;
	background: $light-bg-card;
	border-radius: 24rpx;
	box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
	transition: all 0.25s ease;

	&:active {
		transform: scale(0.98);
		background: #f8f8f8;
	}

	&__avatar {
		width: 100rpx;
		height: 100rpx;
		background: linear-gradient(135deg, $light-accent 0%, #4A90D9 100%);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 24rpx;
		box-shadow: 0 8rpx 24rpx rgba(30, 58, 95, 0.2);
	}

	&__avatar-text {
		font-size: 40rpx;
		font-weight: 700;
		color: #fff;
	}

	&__info {
		flex: 1;
	}

	&__name {
		display: block;
		font-size: 32rpx;
		font-weight: 600;
		color: $light-text-primary;
		margin-bottom: 8rpx;
	}

	&__phone {
		font-size: 26rpx;
		color: $light-text-muted;
	}

	&__arrow {
		width: 16rpx;
		height: 16rpx;
		border-top: 2rpx solid $light-text-muted;
		border-right: 2rpx solid $light-text-muted;
		transform: rotate(45deg);
	}
}

// ==================== 分组 ====================
.section {
	margin-bottom: 32rpx;

	&__title {
		display: block;
		font-size: 24rpx;
		color: $light-text-muted;
		margin-bottom: 16rpx;
		padding-left: 8rpx;
		letter-spacing: 1rpx;
	}

	&__card {
		background: $light-bg-card;
		border-radius: 24rpx;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
		overflow: hidden;
	}
}

// ==================== 菜单项 ====================
.menu-item {
	display: flex;
	align-items: center;
	padding: 28rpx 32rpx;
	border-bottom: 1rpx solid $light-border;
	transition: background 0.2s ease;

	&:active {
		background: #f5f5f5;
	}

	&--no-border {
		border-bottom: none;
	}

	&__icon {
		width: 44rpx;
		height: 44rpx;
		margin-right: 24rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;

		// 锁图标
		&--lock::before {
			content: '';
			width: 24rpx;
			height: 18rpx;
			border: 2rpx solid #4ECDC4;
			border-radius: 4rpx;
			position: absolute;
			bottom: 6rpx;
		}
		&--lock::after {
			content: '';
			width: 14rpx;
			height: 12rpx;
			border: 2rpx solid #4ECDC4;
			border-radius: 7rpx 7rpx 0 0;
			border-bottom: none;
			position: absolute;
			top: 6rpx;
		}

		// 手机图标
		&--phone::before {
			content: '';
			width: 26rpx;
			height: 38rpx;
			border: 2rpx solid #45B7D1;
			border-radius: 6rpx;
			position: absolute;
		}
		&--phone::after {
			content: '';
			width: 10rpx;
			height: 3rpx;
			background: #45B7D1;
			border-radius: 2rpx;
			position: absolute;
			bottom: 8rpx;
		}

		// 主题图标
		&--theme {
			border: 2rpx solid #667EEA;
			border-radius: 50%;
			width: 32rpx;
			height: 32rpx;
		}
		&--theme::before {
			content: '';
			width: 14rpx;
			height: 14rpx;
			background: #667EEA;
			border-radius: 50%;
			position: absolute;
			top: 4rpx;
			right: 4rpx;
		}

		// 铃铛图标
		&--bell {
			border: 2rpx solid #F59E0B;
			border-radius: 50% 50% 6rpx 6rpx;
			width: 28rpx;
			height: 30rpx;
		}
		&--bell::after {
			content: '';
			width: 10rpx;
			height: 6rpx;
			background: #F59E0B;
			border-radius: 0 0 5rpx 5rpx;
			position: absolute;
			bottom: -6rpx;
		}

		// 垃圾桶图标
		&--trash {
			border: 2rpx solid #EF4444;
			border-radius: 0 0 6rpx 6rpx;
			width: 26rpx;
			height: 28rpx;
			border-top: none;
		}
		&--trash::before {
			content: '';
			width: 34rpx;
			height: 2rpx;
			background: #EF4444;
			position: absolute;
			top: -2rpx;
		}
		&--trash::after {
			content: '';
			width: 12rpx;
			height: 6rpx;
			border: 2rpx solid #EF4444;
			border-radius: 4rpx 4rpx 0 0;
			border-bottom: none;
			position: absolute;
			top: -10rpx;
		}

		// 文档图标
		&--doc {
			border: 2rpx solid #96CEB4;
			border-radius: 4rpx;
			width: 28rpx;
			height: 34rpx;
		}
		&--doc::before {
			content: '';
			width: 16rpx;
			height: 2rpx;
			background: #96CEB4;
			position: absolute;
			top: 10rpx;
		}
		&--doc::after {
			content: '';
			width: 12rpx;
			height: 2rpx;
			background: #96CEB4;
			position: absolute;
			top: 18rpx;
		}

		// 盾牌图标
		&--shield {
			width: 28rpx;
			height: 34rpx;
			border: 2rpx solid #DDA0DD;
			border-radius: 4rpx 4rpx 14rpx 14rpx;
		}
		&--shield::before {
			content: '';
			width: 8rpx;
			height: 12rpx;
			border-right: 2rpx solid #DDA0DD;
			border-bottom: 2rpx solid #DDA0DD;
			transform: rotate(45deg);
			position: absolute;
			top: 6rpx;
			left: 8rpx;
		}

		// 信息图标
		&--info {
			border: 2rpx solid #3B82F6;
			border-radius: 50%;
			width: 32rpx;
			height: 32rpx;
		}
		&--info::before {
			content: 'i';
			font-size: 22rpx;
			font-weight: 700;
			font-style: italic;
			color: #3B82F6;
		}

		// 关于我们图标
		&--about {
			border: 2rpx solid #1E3A5F;
			border-radius: 50%;
			width: 32rpx;
			height: 32rpx;
		}
		&--about::before {
			content: '';
			width: 4rpx;
			height: 10rpx;
			background: #1E3A5F;
			position: absolute;
			bottom: 6rpx;
			border-radius: 2rpx;
		}
		&--about::after {
			content: '';
			width: 4rpx;
			height: 4rpx;
			background: #1E3A5F;
			position: absolute;
			top: 6rpx;
			border-radius: 50%;
		}

		// 版本图标
		&--version {
			border: 2rpx solid $light-text-muted;
			border-radius: 50%;
			width: 32rpx;
			height: 32rpx;
		}
		&--version::before {
			content: '';
			width: 0;
			height: 0;
			border-left: 8rpx solid transparent;
			border-right: 8rpx solid transparent;
			border-bottom: 12rpx solid $light-text-muted;
			position: absolute;
			top: 8rpx;
		}
	}

	&__text {
		flex: 1;
		font-size: 30rpx;
		color: $light-text-primary;
	}

	&__value {
		font-size: 26rpx;
		color: $light-text-muted;
		margin-right: 16rpx;
	}

	&__arrow {
		width: 14rpx;
		height: 14rpx;
		border-top: 2rpx solid $light-text-muted;
		border-right: 2rpx solid $light-text-muted;
		transform: rotate(45deg);
	}
}

// ==================== 自定义开关 ====================
.custom-switch {
	width: 88rpx;
	height: 48rpx;

	&__track {
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.1);
		border-radius: 24rpx;
		position: relative;
		transition: background 0.3s ease;
	}

	&__thumb {
		position: absolute;
		top: 4rpx;
		left: 4rpx;
		width: 40rpx;
		height: 40rpx;
		background: #fff;
		border-radius: 50%;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.15);
		transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	&--on {
		.custom-switch__track {
			background: rgba(30, 58, 95, 0.8);
		}
		.custom-switch__thumb {
			left: 44rpx;
			background: #fff;
			box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.2);
		}
	}
}

// ==================== 退出登录 ====================
.logout-section {
	padding: 32rpx 0;
}

.logout-btn {
	position: relative;
	height: 96rpx;
	border: 2rpx solid $accent-coral;
	border-radius: 20rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(255, 107, 91, 0.08);
	overflow: hidden;
	transition: all 0.25s ease;

	&:active {
		transform: scale(0.98);
		background: rgba(255, 107, 91, 0.15);
	}

	&__text {
		font-size: 32rpx;
		font-weight: 500;
		color: $accent-coral;
		letter-spacing: 4rpx;
	}

	&__pulse {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		border: 2rpx solid $accent-coral;
		border-radius: 20rpx;
		animation: logout-pulse 2s ease-out infinite;
	}
}

@keyframes logout-pulse {
	0% { transform: scale(1); opacity: 0.6; }
	100% { transform: scale(1.05); opacity: 0; }
}

// 底部留白
.bottom-space {
	height: calc(60rpx + env(safe-area-inset-bottom));
}

// ==================== 深色模式 ====================
.settings-page--dark {
	background: $dark-bg-deep;

	.bg-gradient {
		background: linear-gradient(165deg, $dark-bg-deep 0%, $dark-bg-mid 50%, $dark-bg-light 100%);
	}

	.particles {
		opacity: 1;
	}

	.navbar__title {
		color: $dark-text-light;
	}

	.back-icon {
		border-color: $dark-text-light;
	}

	.user-card {
		background: $dark-glass-bg;
		border: 1rpx solid $dark-glass-border;
		box-shadow: none;
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);

		&:active {
			background: rgba(255, 255, 255, 0.08);
		}

		&__avatar {
			background: linear-gradient(135deg, $accent-coral 0%, $accent-coral-light 100%);
			box-shadow: 0 8rpx 24rpx rgba(255, 107, 91, 0.3);
		}

		&__name {
			color: $dark-text-light;
		}

		&__phone {
			color: $dark-text-muted;
		}

		&__arrow {
			border-color: $dark-text-muted;
		}
	}

	.section__title {
		color: $dark-text-muted;
	}

	.section__card {
		background: $dark-glass-bg;
		border: 1rpx solid $dark-glass-border;
		box-shadow: none;
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
	}

	.menu-item {
		border-bottom-color: rgba(255, 255, 255, 0.06);

		&:active {
			background: rgba(255, 255, 255, 0.04);
		}

		&__text {
			color: $dark-text-light;
		}

		&__value {
			color: $dark-text-muted;
		}

		&__arrow {
			border-color: $dark-text-muted;
		}

		&__icon--version {
			border-color: $dark-text-muted;
		}
		&__icon--version::before {
			border-bottom-color: $dark-text-muted;
		}

		&__icon--about {
			border-color: $dark-text-muted;
		}
		&__icon--about::before {
			background: $dark-text-muted;
		}
		&__icon--about::after {
			background: $dark-text-muted;
		}
	}

	.custom-switch {
		&__track {
			background: rgba(255, 255, 255, 0.15);
		}

		&__thumb {
			background: $dark-text-muted;
			box-shadow: none;
		}

		&--on {
			.custom-switch__track {
				background: rgba(255, 107, 91, 0.3);
			}
			.custom-switch__thumb {
				background: $accent-coral;
				box-shadow: 0 0 16rpx rgba(255, 107, 91, 0.5);
			}
		}
	}

	.logout-btn {
		background: rgba(255, 107, 91, 0.08);
	}
}
</style>
