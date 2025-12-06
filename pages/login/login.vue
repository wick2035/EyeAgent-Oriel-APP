<template>
	<view class="login-page">
		<!-- 背景层 -->
		<view class="bg-layer">
			<!-- 渐变背景 -->
			<view class="bg-gradient"></view>

			<!-- 心电脉搏线 -->
			<view class="pulse-line pulse-line--1">
				<view class="pulse-wave"></view>
			</view>
			<view class="pulse-line pulse-line--2">
				<view class="pulse-wave"></view>
			</view>

			<!-- 漂浮光点 -->
			<view class="particles">
				<view
					v-for="i in 12"
					:key="i"
					class="particle"
					:class="`particle--${i}`"
				></view>
			</view>
		</view>

		<!-- 内容区 -->
		<view class="content">
			<!-- 状态栏占位 -->
			<view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>

			<!-- 品牌区域 -->
			<view class="brand" :class="{ 'brand--visible': pageReady }">
				<!-- AI五瓣花图标 -->
				<view class="brand__logo">
					<view class="ai-flower">
						<view class="ai-petal ai-petal--1"></view>
						<view class="ai-petal ai-petal--2"></view>
						<view class="ai-petal ai-petal--3"></view>
						<view class="ai-petal ai-petal--4"></view>
						<view class="ai-petal ai-petal--5"></view>
						<view class="ai-core"></view>
					</view>
				</view>
				<text class="brand__title">AI医问通</text>
				<text class="brand__subtitle">您的智能健康助手</text>
			</view>

			<!-- 登录卡片 -->
			<view class="login-card" :class="{ 'login-card--visible': pageReady }">
				<!-- 账号输入 -->
				<view class="input-group" :class="{ 'input-group--focus': usernameFocus }">
					<view class="input-icon">
						<view class="icon-user"></view>
					</view>
					<input
						class="input-field"
						type="text"
						v-model="username"
						placeholder="请输入手机号/账号"
						placeholder-class="input-placeholder"
						@focus="usernameFocus = true"
						@blur="usernameFocus = false"
					/>
				</view>

				<!-- 密码输入 -->
				<view class="input-group" :class="{ 'input-group--focus': passwordFocus }">
					<view class="input-icon">
						<view class="icon-lock"></view>
					</view>
					<input
						class="input-field"
						:type="showPassword ? 'text' : 'password'"
						v-model="password"
						placeholder="请输入密码"
						placeholder-class="input-placeholder"
						@focus="passwordFocus = true"
						@blur="passwordFocus = false"
					/>
					<view class="input-eye" @click="showPassword = !showPassword">
						<view class="icon-eye" :class="{ 'icon-eye--open': showPassword }"></view>
					</view>
				</view>

				<!-- 登录按钮 -->
				<view
					class="login-btn"
					:class="{ 'login-btn--loading': isLoading, 'login-btn--disabled': !canLogin }"
					@click="handleLogin"
				>
					<view v-if="isLoading" class="btn-loader"></view>
					<text v-else class="login-btn__text">登 录</text>
					<view class="btn-ripple" :class="{ 'btn-ripple--active': rippleActive }"></view>
				</view>

				<!-- 分隔线 -->
				<view class="divider">
					<view class="divider__line"></view>
					<text class="divider__text">其他登录方式</text>
					<view class="divider__line"></view>
				</view>

				<!-- 微信登录 -->
				<view class="social-login">
					<view class="wx-btn" @click="handleWxLogin">
						<view class="wx-icon"></view>
						<view class="wx-ripple"></view>
					</view>
				</view>
			</view>

			<!-- 用户协议 -->
			<view class="agreement" :class="{ 'agreement--visible': pageReady }">
				<view
					class="checkbox"
					:class="{ 'checkbox--checked': agreedTerms }"
					@click="agreedTerms = !agreedTerms"
				>
					<view class="checkbox__inner">
						<view class="checkbox__tick"></view>
					</view>
				</view>
				<text class="agreement__text">
					已阅读并同意
					<text class="agreement__link" @click.stop="openUserAgreement">《用户协议》</text>
					和
					<text class="agreement__link" @click.stop="openPrivacyPolicy">《隐私政策》</text>
				</text>
			</view>
		</view>

		<!-- 自定义 Toast -->
		<CustomToast ref="customToast" />
	</view>
</template>

<script>
import { login, wxLogin, getWxLoginCode } from '@/utils/api/user.js'
import CustomToast from '@/components/CustomToast.vue'
import { setToastInstance } from '@/utils/toast.js'

export default {
	components: {
		CustomToast
	},
	data() {
		return {
			statusBarHeight: 44,
			pageReady: false,
			username: '',
			password: '',
			showPassword: false,
			usernameFocus: false,
			passwordFocus: false,
			agreedTerms: false,
			isLoading: false,
			rippleActive: false
		}
	},
	computed: {
		canLogin() {
			return this.username.trim() && this.password.trim() && this.agreedTerms
		}
	},
	onLoad() {
		this.getStatusBarHeight()
		// 延迟显示动画
		setTimeout(() => {
			this.pageReady = true
		}, 100)
	},
	onReady() {
		// 注册全局 Toast 实例
		setToastInstance(this.$refs.customToast)
	},
	methods: {
		getStatusBarHeight() {
			const sysInfo = uni.getSystemInfoSync()
			this.statusBarHeight = sysInfo.statusBarHeight || 44
		},

		async handleLogin() {
			if (!this.canLogin || this.isLoading) return

			if (!this.agreedTerms) {
				this.$refs.customToast.warning('请先同意用户协议')
				return
			}

			// 触发按钮涟漪动画
			this.rippleActive = true
			setTimeout(() => {
				this.rippleActive = false
			}, 600)

			this.isLoading = true

			try {
				const result = await login(this.username, this.password)

				if (result.success) {
					this.$refs.customToast.success('登录成功')
					setTimeout(() => {
						uni.switchTab({ url: '/pages/index/index' })
					}, 1500)
				} else {
					this.$refs.customToast.error(result.message || '登录失败')
				}
			} catch (error) {
				this.$refs.customToast.error('网络异常，请稍后重试')
			} finally {
				this.isLoading = false
			}
		},

		async handleWxLogin() {
			if (!this.agreedTerms) {
				this.$refs.customToast.warning('请先同意用户协议')
				return
			}

			try {
				uni.showLoading({ title: '微信登录中...' })

				const code = await getWxLoginCode()
				const result = await wxLogin(code)

				uni.hideLoading()

				if (result.success) {
					this.$refs.customToast.success('登录成功')
					setTimeout(() => {
						uni.switchTab({ url: '/pages/index/index' })
					}, 1500)
				} else {
					this.$refs.customToast.error(result.message || '微信登录失败')
				}
			} catch (error) {
				uni.hideLoading()
				this.$refs.customToast.error(error.message || '微信登录失败')
			}
		},

		openUserAgreement() {
			this.$refs.customToast.info('用户协议页面开发中')
		},

		openPrivacyPolicy() {
			this.$refs.customToast.info('隐私政策页面开发中')
		}
	}
}
</script>

<style lang="scss" scoped>
// 颜色变量
$bg-deep: #0A1628;
$bg-mid: #122640;
$bg-light: #1A365D;
$accent-coral: #FF6B5B;
$accent-coral-light: #FF8A7A;
$text-light: #F0F6FC;
$text-muted: rgba(240, 246, 252, 0.6);
$glass-bg: rgba(255, 255, 255, 0.08);
$glass-border: rgba(255, 255, 255, 0.12);
$wx-green: #07C160;

.login-page {
	min-height: 100vh;
	position: relative;
	overflow: hidden;
}

// ==================== 背景层 ====================
.bg-layer {
	position: absolute;
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
	background: linear-gradient(165deg, $bg-deep 0%, $bg-mid 50%, $bg-light 100%);
}

// 心电脉搏线
.pulse-line {
	position: absolute;
	left: 0;
	right: 0;
	height: 60rpx;
	overflow: hidden;
	opacity: 0.15;

	&--1 {
		top: 35%;
	}

	&--2 {
		top: 65%;
		opacity: 0.1;
	}
}

.pulse-wave {
	position: absolute;
	left: -100%;
	width: 200%;
	height: 100%;
	background: repeating-linear-gradient(
		90deg,
		transparent 0,
		transparent 60rpx,
		$accent-coral 60rpx,
		$accent-coral 62rpx,
		transparent 62rpx,
		transparent 100rpx,
		$accent-coral 100rpx,
		transparent 102rpx,
		transparent 120rpx,
		$accent-coral 120rpx,
		$accent-coral 180rpx,
		transparent 182rpx,
		transparent 200rpx,
		$accent-coral 200rpx,
		$accent-coral 202rpx,
		transparent 202rpx,
		transparent 240rpx,
		$accent-coral 240rpx,
		$accent-coral 260rpx,
		transparent 262rpx,
		transparent 300rpx
	);
	background-size: 300rpx 60rpx;
	animation: pulse-move 4s linear infinite;
}

@keyframes pulse-move {
	from { transform: translateX(0); }
	to { transform: translateX(50%); }
}

// 漂浮光点
.particles {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
}

.particle {
	position: absolute;
	width: 6rpx;
	height: 6rpx;
	background: rgba(255, 255, 255, 0.4);
	border-radius: 50%;
	animation: float-particle 8s ease-in-out infinite;

	@for $i from 1 through 12 {
		&--#{$i} {
			left: random(90) + 5%;
			top: random(80) + 10%;
			animation-delay: -#{random(8)}s;
			animation-duration: #{6 + random(4)}s;
			opacity: #{0.2 + random(5) * 0.1};
		}
	}
}

@keyframes float-particle {
	0%, 100% {
		transform: translateY(0) translateX(0);
		opacity: 0.3;
	}
	25% {
		transform: translateY(-30rpx) translateX(10rpx);
		opacity: 0.6;
	}
	50% {
		transform: translateY(-50rpx) translateX(-5rpx);
		opacity: 0.4;
	}
	75% {
		transform: translateY(-20rpx) translateX(15rpx);
		opacity: 0.7;
	}
}

// ==================== 内容区 ====================
.content {
	position: relative;
	z-index: 1;
	min-height: 100vh;
	display: flex;
	flex-direction: column;
	padding: 0 48rpx;
}

.status-bar {
	flex-shrink: 0;
}

// ==================== 品牌区域 ====================
.brand {
	padding-top: 80rpx;
	text-align: center;
	opacity: 0;
	transform: translateY(40rpx);
	transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);

	&--visible {
		opacity: 1;
		transform: translateY(0);
	}

	&__logo {
		width: 140rpx;
		height: 140rpx;
		margin: 0 auto 32rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	&__title {
		display: block;
		font-family: 'Noto Serif SC', 'PingFang SC', serif;
		font-size: 56rpx;
		font-weight: 700;
		color: $text-light;
		letter-spacing: 4rpx;
		margin-bottom: 16rpx;
		text-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.3);
	}

	&__subtitle {
		display: block;
		font-size: 28rpx;
		color: $text-muted;
		letter-spacing: 2rpx;
		animation: breath 3s ease-in-out infinite;
	}
}

@keyframes breath {
	0%, 100% { opacity: 0.6; }
	50% { opacity: 1; }
}

// AI五瓣花图标
.ai-flower {
	width: 100rpx;
	height: 100rpx;
	position: relative;
	animation: flower-rotate 12s linear infinite;
}

.ai-petal {
	position: absolute;
	width: 22rpx;
	height: 36rpx;
	border-radius: 11rpx;
	top: 50%;
	left: 50%;
	transform-origin: center 30rpx;
	margin-left: -11rpx;
	margin-top: -30rpx;
	box-shadow: 0 0 20rpx currentColor;

	&--1 { background: #FF6B6B; color: #FF6B6B; transform: rotate(0deg); }
	&--2 { background: #4ECDC4; color: #4ECDC4; transform: rotate(72deg); }
	&--3 { background: #45B7D1; color: #45B7D1; transform: rotate(144deg); }
	&--4 { background: #96CEB4; color: #96CEB4; transform: rotate(216deg); }
	&--5 { background: #DDA0DD; color: #DDA0DD; transform: rotate(288deg); }
}

.ai-core {
	position: absolute;
	top: 50%;
	left: 50%;
	width: 20rpx;
	height: 20rpx;
	margin: -10rpx 0 0 -10rpx;
	background: rgba(255, 255, 255, 0.9);
	border-radius: 50%;
	box-shadow: 0 0 30rpx rgba(255, 255, 255, 0.8);
}

@keyframes flower-rotate {
	from { transform: rotate(0deg); }
	to { transform: rotate(360deg); }
}

// ==================== 登录卡片 ====================
.login-card {
	margin-top: 64rpx;
	padding: 48rpx 40rpx;
	background: $glass-bg;
	border: 1rpx solid $glass-border;
	border-radius: 32rpx;
	backdrop-filter: blur(20px);
	-webkit-backdrop-filter: blur(20px);
	opacity: 0;
	transform: translateY(60rpx);
	transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.15s;

	&--visible {
		opacity: 1;
		transform: translateY(0);
	}
}

// 输入框组
.input-group {
	display: flex;
	align-items: center;
	height: 100rpx;
	padding: 0 32rpx;
	margin-bottom: 28rpx;
	background: rgba(255, 255, 255, 0.05);
	border: 2rpx solid rgba(255, 255, 255, 0.08);
	border-radius: 20rpx;
	transition: all 0.3s ease;

	&--focus {
		border-color: $accent-coral;
		background: rgba(255, 107, 91, 0.08);
		box-shadow: 0 0 30rpx rgba(255, 107, 91, 0.15);
	}
}

.input-icon {
	width: 44rpx;
	height: 44rpx;
	margin-right: 24rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.icon-user {
	width: 36rpx;
	height: 36rpx;
	position: relative;

	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 16rpx;
		height: 16rpx;
		border: 2rpx solid $text-muted;
		border-radius: 50%;
	}

	&::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 28rpx;
		height: 14rpx;
		border: 2rpx solid $text-muted;
		border-radius: 14rpx 14rpx 0 0;
		border-bottom: none;
	}

	.input-group--focus & {
		&::before, &::after {
			border-color: $accent-coral;
		}
	}
}

.icon-lock {
	width: 32rpx;
	height: 36rpx;
	position: relative;

	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 20rpx;
		height: 14rpx;
		border: 2rpx solid $text-muted;
		border-radius: 10rpx 10rpx 0 0;
		border-bottom: none;
	}

	&::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 22rpx;
		border: 2rpx solid $text-muted;
		border-radius: 4rpx;
	}

	.input-group--focus & {
		&::before, &::after {
			border-color: $accent-coral;
		}
	}
}

.input-field {
	flex: 1;
	height: 100%;
	font-size: 30rpx;
	color: $text-light;
	background: transparent;
}

.input-placeholder {
	color: $text-muted;
}

.input-eye {
	width: 60rpx;
	height: 60rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: -16rpx;
}

.icon-eye {
	width: 36rpx;
	height: 24rpx;
	position: relative;
	border: 2rpx solid $text-muted;
	border-radius: 18rpx;

	&::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 10rpx;
		height: 10rpx;
		background: $text-muted;
		border-radius: 50%;
	}

	&::after {
		content: '';
		position: absolute;
		top: 50%;
		left: -2rpx;
		right: -2rpx;
		height: 2rpx;
		background: $text-muted;
		transform: rotate(-30deg);
		transition: opacity 0.2s;
	}

	&--open::after {
		opacity: 0;
	}
}

// 登录按钮
.login-btn {
	position: relative;
	height: 96rpx;
	margin-top: 16rpx;
	background: linear-gradient(135deg, $accent-coral 0%, $accent-coral-light 100%);
	border-radius: 20rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	overflow: hidden;
	box-shadow: 0 8rpx 30rpx rgba(255, 107, 91, 0.35);
	transition: all 0.3s ease;

	&:active {
		transform: scale(0.98);
	}

	&--disabled {
		opacity: 0.5;
		box-shadow: none;
	}

	&--loading {
		pointer-events: none;
	}

	&__text {
		font-size: 32rpx;
		font-weight: 600;
		color: #fff;
		letter-spacing: 8rpx;
		margin-left: 8rpx;
	}
}

.btn-loader {
	width: 40rpx;
	height: 40rpx;
	border: 3rpx solid rgba(255, 255, 255, 0.3);
	border-top-color: #fff;
	border-radius: 50%;
	animation: spin 0.8s linear infinite;
}

@keyframes spin {
	to { transform: rotate(360deg); }
}

.btn-ripple {
	position: absolute;
	top: 50%;
	left: 50%;
	width: 0;
	height: 0;
	background: rgba(255, 255, 255, 0.3);
	border-radius: 50%;
	transform: translate(-50%, -50%);
	pointer-events: none;

	&--active {
		animation: ripple-out 0.6s ease-out;
	}
}

@keyframes ripple-out {
	to {
		width: 400rpx;
		height: 400rpx;
		opacity: 0;
	}
}

// 分隔线
.divider {
	display: flex;
	align-items: center;
	margin: 48rpx 0;

	&__line {
		flex: 1;
		height: 1rpx;
		background: linear-gradient(90deg, transparent, $glass-border, transparent);
	}

	&__text {
		padding: 0 24rpx;
		font-size: 24rpx;
		color: $text-muted;
	}
}

// 社交登录
.social-login {
	display: flex;
	justify-content: center;
}

.wx-btn {
	position: relative;
	width: 96rpx;
	height: 96rpx;
	background: $wx-green;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 8rpx 24rpx rgba(7, 193, 96, 0.35);
	transition: all 0.3s ease;

	&:active {
		transform: scale(0.95);
	}
}

.wx-icon {
	width: 48rpx;
	height: 40rpx;
	position: relative;

	// 微信图标 - 两个气泡
	&::before {
		content: '';
		position: absolute;
		left: 0;
		bottom: 0;
		width: 28rpx;
		height: 24rpx;
		background: #fff;
		border-radius: 14rpx 14rpx 0 14rpx;
	}

	&::after {
		content: '';
		position: absolute;
		right: 0;
		top: 0;
		width: 24rpx;
		height: 20rpx;
		background: #fff;
		border-radius: 12rpx 12rpx 12rpx 0;
	}
}

.wx-ripple {
	position: absolute;
	top: 50%;
	left: 50%;
	width: 100%;
	height: 100%;
	border: 2rpx solid $wx-green;
	border-radius: 50%;
	transform: translate(-50%, -50%);
	opacity: 0;
	animation: wx-pulse 2s ease-out infinite;
}

@keyframes wx-pulse {
	0% {
		transform: translate(-50%, -50%) scale(1);
		opacity: 0.6;
	}
	100% {
		transform: translate(-50%, -50%) scale(1.5);
		opacity: 0;
	}
}

// ==================== 用户协议 ====================
.agreement {
	margin-top: auto;
	padding: 48rpx 0;
	padding-bottom: calc(48rpx + env(safe-area-inset-bottom));
	display: flex;
	align-items: center;
	justify-content: center;
	opacity: 0;
	transform: translateY(20rpx);
	transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s;

	&--visible {
		opacity: 1;
		transform: translateY(0);
	}

	&__text {
		font-size: 24rpx;
		color: $text-muted;
	}

	&__link {
		color: $accent-coral-light;
	}
}

.checkbox {
	width: 36rpx;
	height: 36rpx;
	margin-right: 12rpx;
	display: flex;
	align-items: center;
	justify-content: center;

	&__inner {
		width: 32rpx;
		height: 32rpx;
		border: 2rpx solid $text-muted;
		border-radius: 8rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	&__tick {
		width: 12rpx;
		height: 20rpx;
		border-right: 3rpx solid transparent;
		border-bottom: 3rpx solid transparent;
		transform: rotate(45deg) scale(0);
		margin-top: -6rpx;
		transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	&--checked {
		.checkbox__inner {
			background: $accent-coral;
			border-color: $accent-coral;
			transform: scale(1.1);
			animation: check-bounce 0.4s ease;
		}

		.checkbox__tick {
			border-color: #fff;
			transform: rotate(45deg) scale(1);
		}
	}
}

@keyframes check-bounce {
	0% { transform: scale(1); }
	30% { transform: scale(1.2); }
	50% { transform: scale(0.9); }
	70% { transform: scale(1.15); }
	100% { transform: scale(1.1); }
}
</style>
