<template>
	<view class="edit-page" :class="{ 'edit-page--dark': isDark }">
		<!-- 背景层 -->
		<view class="bg-layer">
			<view class="bg-gradient"></view>
			<view class="particles">
				<view v-for="i in 6" :key="i" class="particle" :class="`particle--${i}`"></view>
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
				<text class="navbar__title">编辑资料</text>
				<view class="navbar__save" @click="saveProfile">
					<text class="navbar__save-text">保存</text>
				</view>
			</view>

			<!-- 表单区域 -->
			<scroll-view class="scroll-area" scroll-y>
				<!-- 头像区域 -->
				<view class="avatar-section" :class="{ 'section--visible': pageReady }">
					<view class="avatar-wrapper" @click="chooseAvatar">
						<view class="avatar">
							<image v-if="formData.avatar" class="avatar__img" :src="formData.avatar" mode="aspectFill" />
							<text v-else class="avatar__text">{{ avatarText }}</text>
						</view>
						<view class="avatar-badge">
							<view class="camera-icon"></view>
						</view>
					</view>
					<text class="avatar-tip">点击更换头像</text>
				</view>

				<!-- 基本信息 -->
				<view class="form-section" :class="{ 'section--visible': pageReady }" style="--delay: 0.1s">
					<text class="form-section__title">基本信息</text>
					<view class="form-card">
						<!-- 昵称 -->
						<view class="form-item">
							<text class="form-item__label">昵称</text>
							<input
								class="form-item__input"
								type="text"
								v-model="formData.name"
								placeholder="请输入昵称"
								placeholder-class="form-placeholder"
								maxlength="20"
							/>
						</view>

						<!-- 性别 -->
						<view class="form-item" @click="showGenderPicker = true">
							<text class="form-item__label">性别</text>
							<text class="form-item__value">{{ genderText }}</text>
							<view class="form-item__arrow"></view>
						</view>

						<!-- 生日 -->
						<view class="form-item" @click="openBirthdayPicker">
							<text class="form-item__label">生日</text>
							<text class="form-item__value">{{ formData.birthday || '请选择' }}</text>
							<view class="form-item__arrow"></view>
						</view>

						<!-- 身份证号 -->
						<view class="form-item form-item--no-border">
							<text class="form-item__label">身份证号</text>
							<input
								class="form-item__input"
								type="idcard"
								v-model="formData.idCard"
								placeholder="请输入身份证号"
								placeholder-class="form-placeholder"
								maxlength="18"
							/>
						</view>
					</view>
				</view>

				<!-- 联系方式 -->
				<view class="form-section" :class="{ 'section--visible': pageReady }" style="--delay: 0.2s">
					<text class="form-section__title">联系方式</text>
					<view class="form-card">
						<view class="form-item form-item--no-border">
							<text class="form-item__label">手机号</text>
							<text class="form-item__value form-item__value--disabled">{{ phoneDisplay }}</text>
							<view class="form-item__tag">已绑定</view>
						</view>
					</view>
				</view>

				<!-- 底部留白 -->
				<view class="bottom-space"></view>
			</scroll-view>
		</view>

		<!-- 性别选择器弹窗 -->
		<view class="picker-mask" v-if="showGenderPicker" @click="showGenderPicker = false">
			<view class="picker-popup" @click.stop>
				<view class="picker-header">
					<text class="picker-cancel" @click="showGenderPicker = false">取消</text>
					<text class="picker-title">选择性别</text>
					<text class="picker-confirm" @click="confirmGender">确定</text>
				</view>
				<view class="picker-body">
					<view
						v-for="item in genderOptions"
						:key="item.value"
						class="picker-option"
						:class="{ 'picker-option--active': tempGender === item.value }"
						@click="tempGender = item.value"
					>
						<text class="picker-option__text">{{ item.label }}</text>
						<view v-if="tempGender === item.value" class="picker-option__check"></view>
					</view>
				</view>
			</view>
		</view>

		<!-- 生日选择器弹窗 -->
		<view class="picker-mask" v-if="showBirthdayPicker" @click="showBirthdayPicker = false">
			<view class="picker-popup" @click.stop>
				<view class="picker-header">
					<text class="picker-cancel" @click="showBirthdayPicker = false">取消</text>
					<text class="picker-title">选择生日</text>
					<text class="picker-confirm" @click="confirmBirthday">确定</text>
				</view>
				<view class="birthday-picker-body">
					<picker-view
						class="birthday-picker-view"
						:value="birthdayPickerValue"
						:immediate-change="true"
						@change="onBirthdayPickerChange"
						indicator-style="height: 88rpx;"
					>
						<!-- 年 -->
						<picker-view-column>
							<view class="picker-item" v-for="year in years" :key="year">{{ year }}年</view>
						</picker-view-column>
						<!-- 月 -->
						<picker-view-column>
							<view class="picker-item" v-for="month in months" :key="month">{{ month }}月</view>
						</picker-view-column>
						<!-- 日 -->
						<picker-view-column>
							<view class="picker-item" v-for="day in days" :key="day">{{ day }}日</view>
						</picker-view-column>
					</picker-view>
				</view>
			</view>
		</view>

		<!-- 顶部通知栏 -->
		<TopNotificationBar />
	</view>
</template>

<script>
import { getUserInfo, updateUserInfo } from '@/store/user.js'
import { isDarkMode } from '@/store/theme.js'
import TopNotificationBar from '@/components/TopNotificationBar.vue'

export default {
	components: {
		TopNotificationBar
	},
	data() {
		return {
			statusBarHeight: 44,
			pageReady: false,
			formData: {
				name: '',
				avatar: '',
				gender: 0, // 0-未设置 1-男 2-女
				birthday: '',
				idCard: ''
			},
			showGenderPicker: false,
			tempGender: 0,
			genderOptions: [
				{ label: '未设置', value: 0 },
				{ label: '男', value: 1 },
				{ label: '女', value: 2 }
			],
			today: '',
			// 生日选择器相关
			showBirthdayPicker: false,
			years: [],
			months: [],
			days: [],
			birthdayPickerValue: [0, 0, 0]
		}
	},
	computed: {
		isDark() {
			return isDarkMode()
		},
		avatarText() {
			const name = this.formData.name || '用'
			return name.charAt(0).toUpperCase()
		},
		genderText() {
			const item = this.genderOptions.find(g => g.value === this.formData.gender)
			return item ? item.label : '未设置'
		},
		phoneDisplay() {
			const userInfo = getUserInfo()
			return userInfo.phone || '未绑定'
		}
	},
	onLoad() {
		this.getStatusBarHeight()
		this.initFormData()
		this.initBirthdayPicker()
		this.today = this.formatDate(new Date())
		setTimeout(() => {
			this.pageReady = true
		}, 100)
	},
	methods: {
		getStatusBarHeight() {
			const sysInfo = uni.getSystemInfoSync()
			this.statusBarHeight = sysInfo.statusBarHeight || 44
		},

		initFormData() {
			const userInfo = getUserInfo()
			this.formData.name = userInfo.name || ''
			this.formData.avatar = userInfo.avatar || ''
			this.formData.gender = userInfo.gender || 0
			this.formData.birthday = userInfo.birthday || ''
			this.formData.idCard = userInfo.idCard || ''
			this.tempGender = this.formData.gender
		},

		formatDate(date) {
			const y = date.getFullYear()
			const m = String(date.getMonth() + 1).padStart(2, '0')
			const d = String(date.getDate()).padStart(2, '0')
			return `${y}-${m}-${d}`
		},

		goBack() {
			uni.navigateBack()
		},

		chooseAvatar() {
			uni.chooseImage({
				count: 1,
				sizeType: ['compressed'],
				sourceType: ['album', 'camera'],
				success: (res) => {
					this.formData.avatar = res.tempFilePaths[0]
					// 实际项目中这里需要上传到服务器
				}
			})
		},

		// 初始化生日选择器
		initBirthdayPicker() {
			const currentYear = new Date().getFullYear()
			// 生成年份数组：当前年 - 1900（倒序，解决滚动位置偏移问题）
			this.years = []
			for (let i = currentYear; i >= 1900; i--) {
				this.years.push(i)
			}
			// 生成月份数组：1-12
			this.months = []
			for (let i = 1; i <= 12; i++) {
				this.months.push(i)
			}
			// 默认生成当前年1月的天数
			this.updateDays(this.years[0], 1)
		},

		// 获取指定年月的天数
		getDaysInMonth(year, month) {
			// 闰年判断
			const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)
			const daysInMonth = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
			return daysInMonth[month - 1]
		},

		// 更新日期数组
		updateDays(year, month) {
			const maxDays = this.getDaysInMonth(year, month)
			this.days = []
			for (let i = 1; i <= maxDays; i++) {
				this.days.push(i)
			}
		},

		// 打开生日选择器
		openBirthdayPicker() {
			const currentYear = new Date().getFullYear()
			let yearIdx = 0 // 默认当前年（倒序数组，当前年在索引0）
			let monthIdx = 0
			let dayIdx = 0

			// 如果已有生日，解析并设置选中位置
			if (this.formData.birthday) {
				const parts = this.formData.birthday.split('-')
				if (parts.length === 3) {
					const year = parseInt(parts[0])
					const month = parseInt(parts[1])
					const day = parseInt(parts[2])

					// 倒序数组：索引 = 当前年 - 选中年
					yearIdx = currentYear - year
					if (yearIdx < 0 || yearIdx >= this.years.length) yearIdx = 0

					monthIdx = month - 1
					dayIdx = day - 1

					// 更新日期数组
					this.updateDays(year, month)
				}
			}

			// 先重置为0，延迟设置正确值，等待picker-view渲染完成
			this.birthdayPickerValue = [0, 0, 0]
			this.showBirthdayPicker = true
			setTimeout(() => {
				this.birthdayPickerValue = [yearIdx, monthIdx, dayIdx]
			}, 150)
		},

		// 滚动变化处理
		onBirthdayPickerChange(e) {
			const val = e.detail.value
			const year = this.years[val[0]]
			const month = this.months[val[1]]

			// 更新日期数组
			this.updateDays(year, month)

			// 修正日期索引（如果超出范围）
			let dayIdx = val[2]
			if (dayIdx >= this.days.length) {
				dayIdx = this.days.length - 1
			}

			this.birthdayPickerValue = [val[0], val[1], dayIdx]
		},

		// 确认生日选择
		confirmBirthday() {
			const yearIdx = this.birthdayPickerValue[0]
			const monthIdx = this.birthdayPickerValue[1]
			const dayIdx = this.birthdayPickerValue[2]

			const year = this.years[yearIdx]
			const month = String(this.months[monthIdx]).padStart(2, '0')
			const day = String(this.days[dayIdx]).padStart(2, '0')

			this.formData.birthday = `${year}-${month}-${day}`
			this.showBirthdayPicker = false
		},

		confirmGender() {
			this.formData.gender = this.tempGender
			this.showGenderPicker = false
		},

		async saveProfile() {
			if (!this.formData.name.trim()) {
				uni.showToast({ title: '请输入昵称', icon: 'none' })
				return
			}

			uni.showLoading({ title: '保存中...' })

			try {
				// 模拟API调用延迟
				await new Promise(resolve => setTimeout(resolve, 800))

				// 更新本地用户信息
				updateUserInfo({
					name: this.formData.name,
					avatar: this.formData.avatar,
					gender: this.formData.gender,
					birthday: this.formData.birthday,
					idCard: this.formData.idCard
				})

				uni.hideLoading()
				uni.showToast({ title: '保存成功', icon: 'success' })

				setTimeout(() => {
					uni.navigateBack()
				}, 1000)
			} catch (error) {
				uni.hideLoading()
				uni.showToast({ title: '保存失败，请重试', icon: 'none' })
			}
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

.edit-page {
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

	&--1 { left: 27%; top: 24%; animation-delay: -1.5s; }
	&--2 { left: 39%; top: 38%; animation-delay: -3s; }
	&--3 { left: 51%; top: 52%; animation-delay: -4.5s; }
	&--4 { left: 63%; top: 66%; animation-delay: -6s; }
	&--5 { left: 75%; top: 80%; animation-delay: -7.5s; }
	&--6 { left: 87%; top: 94%; animation-delay: -9s; }
}

@keyframes float-particle {
	0%, 100% { transform: translateY(0); opacity: 0.3; }
	50% { transform: translateY(-30rpx); opacity: 0.7; }
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

	&__save {
		padding: 12rpx 24rpx;
		background: linear-gradient(135deg, $light-accent 0%, #4A90D9 100%);
		border-radius: 32rpx;
	}

	&__save-text {
		font-size: 26rpx;
		color: #fff;
		font-weight: 500;
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
.section--visible {
	animation: section-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) var(--delay, 0s) both;
}

@keyframes section-in {
	from { opacity: 0; transform: translateY(40rpx); }
	to { opacity: 1; transform: translateY(0); }
}

// ==================== 头像区域 ====================
.avatar-section {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 48rpx 0;
}

.avatar-wrapper {
	position: relative;
	margin-bottom: 16rpx;
}

.avatar {
	width: 160rpx;
	height: 160rpx;
	background: linear-gradient(135deg, $light-accent 0%, #4A90D9 100%);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	overflow: hidden;
	box-shadow: 0 12rpx 40rpx rgba(30, 58, 95, 0.25);

	&__img {
		width: 100%;
		height: 100%;
	}

	&__text {
		font-size: 56rpx;
		font-weight: 700;
		color: #fff;
	}
}

.avatar-badge {
	position: absolute;
	right: 0;
	bottom: 0;
	width: 48rpx;
	height: 48rpx;
	background: $light-bg-card;
	border: 2rpx solid $light-border;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.camera-icon {
	width: 24rpx;
	height: 20rpx;
	border: 2rpx solid $light-text-secondary;
	border-radius: 4rpx;
	position: relative;

	&::before {
		content: '';
		position: absolute;
		top: -6rpx;
		left: 50%;
		transform: translateX(-50%);
		width: 10rpx;
		height: 4rpx;
		background: $light-text-secondary;
		border-radius: 2rpx 2rpx 0 0;
	}

	&::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 10rpx;
		height: 10rpx;
		border: 2rpx solid $light-text-secondary;
		border-radius: 50%;
	}
}

.avatar-tip {
	font-size: 24rpx;
	color: $light-text-muted;
}

// ==================== 表单区域 ====================
.form-section {
	margin-bottom: 32rpx;

	&__title {
		display: block;
		font-size: 24rpx;
		color: $light-text-muted;
		margin-bottom: 16rpx;
		padding-left: 8rpx;
		letter-spacing: 1rpx;
	}
}

.form-card {
	background: $light-bg-card;
	border-radius: 24rpx;
	box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
	overflow: hidden;
}

.form-item {
	display: flex;
	align-items: center;
	padding: 28rpx 32rpx;
	border-bottom: 1rpx solid $light-border;

	&--no-border {
		border-bottom: none;
	}

	&__label {
		width: 140rpx;
		font-size: 30rpx;
		color: $light-text-primary;
		flex-shrink: 0;
	}

	&__input {
		flex: 1;
		font-size: 30rpx;
		color: $light-text-primary;
		text-align: right;
		background: transparent;
	}

	&__value {
		flex: 1;
		font-size: 30rpx;
		color: $light-text-primary;
		text-align: right;

		&--disabled {
			color: $light-text-muted;
		}
	}

	&__picker {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: flex-end;
	}

	&__arrow {
		width: 14rpx;
		height: 14rpx;
		border-top: 2rpx solid $light-text-muted;
		border-right: 2rpx solid $light-text-muted;
		transform: rotate(45deg);
		margin-left: 16rpx;
	}

	&__tag {
		padding: 6rpx 16rpx;
		background: rgba(16, 185, 129, 0.15);
		border-radius: 20rpx;
		font-size: 22rpx;
		color: #10B981;
		margin-left: 16rpx;
	}
}

.form-placeholder {
	color: $light-text-muted;
}

// ==================== 性别选择器弹窗 ====================
.picker-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.4);
	z-index: 1000;
	display: flex;
	align-items: flex-end;
	animation: mask-in 0.3s ease;
}

@keyframes mask-in {
	from { opacity: 0; }
	to { opacity: 1; }
}

.picker-popup {
	width: 100%;
	background: $light-bg-card;
	border-radius: 32rpx 32rpx 0 0;
	padding-bottom: env(safe-area-inset-bottom);
	animation: popup-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes popup-in {
	from { transform: translateY(100%); }
	to { transform: translateY(0); }
}

.picker-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 32rpx;
	border-bottom: 1rpx solid $light-border;
}

.picker-cancel {
	font-size: 30rpx;
	color: $light-text-muted;
	padding: 8rpx 16rpx;
}

.picker-title {
	font-size: 32rpx;
	font-weight: 600;
	color: $light-text-primary;
}

.picker-confirm {
	font-size: 30rpx;
	color: $light-accent;
	padding: 8rpx 16rpx;
	font-weight: 500;
}

.picker-body {
	padding: 16rpx 32rpx;
}

.picker-option {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 32rpx 16rpx;
	border-radius: 16rpx;
	transition: background 0.2s ease;

	&--active {
		background: rgba(30, 58, 95, 0.08);
	}

	&__text {
		font-size: 32rpx;
		color: $light-text-primary;
	}

	&__check {
		width: 20rpx;
		height: 32rpx;
		border-right: 4rpx solid $light-accent;
		border-bottom: 4rpx solid $light-accent;
		transform: rotate(45deg);
		margin-right: 8rpx;
	}
}

// ==================== 生日选择器 ====================
.birthday-picker-body {
	padding: 0 32rpx;
}

.birthday-picker-view {
	width: 100%;
	height: 440rpx;
}

.picker-item {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 88rpx;
	line-height: 88rpx;
	font-size: 32rpx;
	color: $light-text-primary;
}

// 底部留白
.bottom-space {
	height: calc(60rpx + env(safe-area-inset-bottom));
}

// ==================== 深色模式 ====================
.edit-page--dark {
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

	.navbar__save {
		background: linear-gradient(135deg, $accent-coral 0%, $accent-coral-light 100%);
	}

	.back-icon {
		border-color: $dark-text-light;
	}

	.avatar {
		background: linear-gradient(135deg, $accent-coral 0%, $accent-coral-light 100%);
		box-shadow: 0 12rpx 40rpx rgba(255, 107, 91, 0.35);
	}

	.avatar-badge {
		background: $dark-glass-bg;
		border-color: $dark-glass-border;
		box-shadow: none;
		backdrop-filter: blur(10px);
	}

	.camera-icon {
		border-color: $dark-text-light;

		&::before {
			background: $dark-text-light;
		}

		&::after {
			border-color: $dark-text-light;
		}
	}

	.avatar-tip {
		color: $dark-text-muted;
	}

	.form-section__title {
		color: $dark-text-muted;
	}

	.form-card {
		background: $dark-glass-bg;
		border: 1rpx solid $dark-glass-border;
		box-shadow: none;
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
	}

	.form-item {
		border-bottom-color: rgba(255, 255, 255, 0.06);

		&__label {
			color: $dark-text-light;
		}

		&__input {
			color: $dark-text-light;
		}

		&__value {
			color: $dark-text-light;

			&--disabled {
				color: $dark-text-muted;
			}
		}

		&__arrow {
			border-color: $dark-text-muted;
		}
	}

	.form-placeholder {
		color: $dark-text-muted;
	}

	.picker-mask {
		background: rgba(0, 0, 0, 0.6);
	}

	.picker-popup {
		background: linear-gradient(180deg, $dark-bg-mid 0%, $dark-bg-deep 100%);
	}

	.picker-header {
		border-bottom-color: $dark-glass-border;
	}

	.picker-cancel {
		color: $dark-text-muted;
	}

	.picker-title {
		color: $dark-text-light;
	}

	.picker-confirm {
		color: $accent-coral;
	}

	.picker-option {
		&--active {
			background: rgba(255, 107, 91, 0.1);
		}

		&__text {
			color: $dark-text-light;
		}

		&__check {
			border-color: $accent-coral;
		}
	}

	.picker-item {
		color: $dark-text-light;
	}
}
</style>
