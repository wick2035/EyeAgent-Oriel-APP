<template>
	<view class="health-page" :class="{ 'health-page--dark': isDark }">
		<!-- 背景层 -->
		<view class="bg-layer">
			<view class="bg-gradient"></view>
			<view class="particles">
				<view v-for="i in 6" :key="i" class="particle" :class="`particle--${i}`"></view>
			</view>
		</view>

		<!-- 固定顶栏 -->
		<view class="fixed-header">
			<view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
			<view class="navbar" :class="{ 'navbar--visible': pageReady }">
				<view class="navbar__back" @click="goBack">
					<view class="back-icon"></view>
				</view>
				<text class="navbar__title">健康档案</text>
				<view class="navbar__placeholder"></view>
			</view>
		</view>

		<!-- 内容区 -->
		<view class="content">
			<!-- 加载状态 -->
			<view v-if="loading" class="loading-container" :style="{ top: navbarTotalHeight }">
				<view class="loading-spinner"></view>
				<text class="loading-text">加载中...</text>
			</view>

			<!-- 主内容 -->
			<scroll-view v-else class="scroll-area" scroll-y :style="{ top: navbarTotalHeight }">
				<!-- 身份卡片 -->
				<view class="identity-card" :class="{ 'section--visible': pageReady }">
					<view class="identity-card__avatar">
						<text class="avatar-text">{{ avatarText }}</text>
					</view>
					<view class="identity-card__info">
						<text class="identity-name">{{ patient.patientName || '未设置姓名' }}</text>
						<view class="identity-sub">
							<text class="identity-id">{{ patient.idNumber || '--' }}</text>
							<view class="identity-divider"></view>
							<text class="identity-age">{{ patient.age || '--' }}岁</text>
						</view>
					</view>
					<view class="identity-card__badge">
						<view class="verified-icon"></view>
						<text class="badge-text">实名认证</text>
					</view>
				</view>

				<!-- 身体数据卡片 -->
				<view class="section body-section" :class="{ 'section--visible': pageReady }" style="--index: 1">
					<view class="section-header">
						<view class="section-indicator"></view>
						<text class="section-title">身体数据</text>
					</view>
					<view class="body-card">
						<view class="body-metrics">
							<view class="metric" @click="editField('height')">
								<text class="metric-value">{{ patient.height || '--' }}</text>
								<text class="metric-unit">cm</text>
								<text class="metric-label">身高</text>
								<view class="metric-edit-hint"></view>
							</view>
							<view class="metric-divider"></view>
							<view class="metric" @click="editField('weight')">
								<text class="metric-value">{{ patient.weight || '--' }}</text>
								<text class="metric-unit">kg</text>
								<text class="metric-label">体重</text>
								<view class="metric-edit-hint"></view>
							</view>
						</view>
						<view class="bmi-section" v-if="bmiValue">
							<view class="bmi-header">
								<text class="bmi-label">BMI</text>
								<text class="bmi-value">{{ bmiValue }}</text>
								<text class="bmi-status" :style="{ color: bmiStatus.color }">{{ bmiStatus.text }}</text>
							</view>
							<view class="bmi-bar">
								<view class="bmi-track">
									<view class="bmi-zone bmi-zone--thin"></view>
									<view class="bmi-zone bmi-zone--normal"></view>
									<view class="bmi-zone bmi-zone--overweight"></view>
									<view class="bmi-zone bmi-zone--obese"></view>
								</view>
								<view class="bmi-indicator" :style="{ left: bmiProgress + '%' }">
									<view class="bmi-pointer"></view>
								</view>
							</view>
							<view class="bmi-labels">
								<text class="bmi-range-label">偏瘦</text>
								<text class="bmi-range-label">正常</text>
								<text class="bmi-range-label">偏胖</text>
								<text class="bmi-range-label">肥胖</text>
							</view>
						</view>
					</view>
				</view>

				<!-- 眼部数据 -->
				<view class="section" :class="{ 'section--visible': pageReady }" style="--index: 2">
					<view class="section-header">
						<view class="section-indicator"></view>
						<text class="section-title">眼部数据</text>
					</view>
					<EyeDataSection />
				</view>

				<!-- 其他分组 -->
				<view
					v-for="(group, gIndex) in displayGroups"
					:key="group.key"
					class="section"
					:class="{ 'section--visible': pageReady }"
					:style="{ '--index': gIndex + 3 }"
				>
					<view class="section-header">
						<view class="section-indicator"></view>
						<text class="section-title">{{ group.title }}</text>
					</view>
					<view class="section-card">
						<view
							v-for="(field, fIndex) in group.fields"
							:key="field"
							class="field-item"
							:class="{
								'field-item--readonly': isReadonly(field),
								'field-item--last': fIndex === group.fields.length - 1
							}"
							@click="handleFieldClick(field)"
						>
							<text class="field-label">{{ getFieldLabel(field) }}</text>
							<text class="field-value">{{ getFieldValue(field) }}</text>
							<view v-if="isReadonly(field)" class="lock-icon"></view>
							<view v-else class="arrow-icon"></view>
						</view>
					</view>
				</view>

				<!-- 底部留白 -->
				<view class="bottom-space"></view>
			</scroll-view>
		</view>

		<!-- 编辑底部Sheet -->
		<view class="sheet-mask" v-if="showEditSheet" @click="closeEditSheet">
			<view class="edit-sheet" @click.stop>
				<view class="sheet-handle"></view>
				<view class="sheet-header">
					<text class="sheet-cancel" @click="closeEditSheet">取消</text>
					<text class="sheet-title">{{ editingFieldLabel }}</text>
					<text class="sheet-confirm" @click="confirmEdit">确定</text>
				</view>
				<view class="sheet-content">
					<!-- 文本输入 -->
					<view v-if="editingFieldType === 'text'" class="input-wrapper">
						<input
							class="sheet-input"
							type="text"
							v-model="editValue"
							:placeholder="editingFieldPlaceholder"
							placeholder-class="sheet-placeholder"
							:cursor-spacing="20"
						/>
					</view>

					<!-- 数字输入 -->
					<view v-else-if="editingFieldType === 'number'" class="number-input-wrapper">
						<input
							class="sheet-input sheet-input--number"
							type="digit"
							v-model="editValue"
							:placeholder="editingFieldPlaceholder"
							placeholder-class="sheet-placeholder"
							:cursor-spacing="20"
						/>
						<text class="number-unit">{{ editingFieldUnit }}</text>
					</view>

					<!-- 多行文本 -->
					<view v-else-if="editingFieldType === 'textarea'" class="textarea-wrapper">
						<textarea
							class="sheet-textarea"
							v-model="editValue"
							:placeholder="editingFieldPlaceholder"
							placeholder-class="sheet-placeholder"
							:maxlength="200"
							:cursor-spacing="20"
						/>
					</view>

					<!-- 选择器 -->
					<view v-else-if="editingFieldType === 'picker'" class="picker-wrapper">
						<view
							v-for="option in editingFieldOptions"
							:key="option.value"
							class="picker-option"
							:class="{ 'picker-option--active': editValue === option.value }"
							@click="editValue = option.value"
						>
							<text class="picker-option__text">{{ option.label }}</text>
							<view v-if="editValue === option.value" class="picker-option__check"></view>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 顶部通知栏 -->
		<TopNotificationBar />
	</view>
</template>

<script>
import TopNotificationBar from '@/components/TopNotificationBar.vue'
import EyeDataSection from '@/components/eye-data/EyeDataSection.vue'
import { isDarkMode } from '@/store/theme.js'
import {
	getPatientState,
	fetchPatient,
	updatePatient,
	isFieldReadonly,
	getFieldConfig,
	getFieldDisplayValue,
	calculateBMI,
	getBMIStatus,
	getBMIProgress,
	maskIdNumber,
	FIELD_GROUPS,
	READONLY_FIELDS
} from '@/store/patient.js'

export default {
	components: {
		TopNotificationBar,
		EyeDataSection
	},
	data() {
		return {
			statusBarHeight: 44,
			pageReady: false,
			// 编辑Sheet
			showEditSheet: false,
			editingField: null,
			editValue: ''
		}
	},
	computed: {
		isDark() {
			return isDarkMode()
		},
		navbarTotalHeight() {
			return `calc(${this.statusBarHeight}px + 88rpx)`
		},
		patientState() {
			return getPatientState()
		},
		loading() {
			return this.patientState.loading
		},
		patient() {
			return this.patientState.data || {}
		},
		avatarText() {
			const name = this.patient.patientName || '用'
			return name.charAt(0).toUpperCase()
		},
		maskedIdNumber() {
			return maskIdNumber(this.patient.idNumber)
		},
		// BMI计算
		bmiValue() {
			return calculateBMI(this.patient.height, this.patient.weight)
		},
		bmiStatus() {
			return getBMIStatus(this.bmiValue)
		},
		bmiProgress() {
			return getBMIProgress(this.bmiValue)
		},
		// 分组展示（排除身体数据，单独处理）
		displayGroups() {
			return FIELD_GROUPS.filter(g => g.key !== 'body')
		},
		// 编辑字段相关
		editingFieldConfig() {
			if (!this.editingField) return {}
			return getFieldConfig(this.editingField)
		},
		editingFieldLabel() {
			return this.editingFieldConfig.label || ''
		},
		editingFieldType() {
			return this.editingFieldConfig.type || 'text'
		},
		editingFieldPlaceholder() {
			return this.editingFieldConfig.placeholder || `请输入${this.editingFieldLabel}`
		},
		editingFieldUnit() {
			return this.editingFieldConfig.unit || ''
		},
		editingFieldOptions() {
			return this.editingFieldConfig.options || []
		}
	},
	onLoad() {
		this.getStatusBarHeight()
		this.loadPatientInfo()
	},
	methods: {
		getStatusBarHeight() {
			const sysInfo = uni.getSystemInfoSync()
			this.statusBarHeight = sysInfo.statusBarHeight || 44
		},

		async loadPatientInfo() {
			await fetchPatient()
			setTimeout(() => {
				this.pageReady = true
			}, 100)
		},

		goBack() {
			uni.navigateBack()
		},

		// 字段相关方法
		isReadonly(fieldKey) {
			return isFieldReadonly(fieldKey)
		},

		getFieldLabel(fieldKey) {
			const config = getFieldConfig(fieldKey)
			return config.label || fieldKey
		},

		getFieldValue(fieldKey) {
			const value = this.patient[fieldKey]
			return getFieldDisplayValue(fieldKey, value)
		},

		handleFieldClick(fieldKey) {
			if (this.isReadonly(fieldKey)) {
				uni.showToast({ title: '此项不可修改', icon: 'none' })
				return
			}
			this.editField(fieldKey)
		},

		// 编辑字段
		editField(fieldKey) {
			if (this.isReadonly(fieldKey)) return

			this.editingField = fieldKey
			this.editValue = this.patient[fieldKey] || ''
			this.showEditSheet = true
		},

		closeEditSheet() {
			this.showEditSheet = false
			this.editingField = null
			this.editValue = ''
		},

		async confirmEdit() {
			if (!this.editingField) return

			const fieldKey = this.editingField
			let value = this.editValue

			// 数字类型转换
			if (this.editingFieldType === 'number' && value) {
				value = parseFloat(value)
				if (isNaN(value)) {
					uni.showToast({ title: '请输入有效数字', icon: 'none' })
					return
				}
			}

			uni.showLoading({ title: '保存中...' })

			const result = await updatePatient({ [fieldKey]: value })

			uni.hideLoading()

			if (result.success) {
				uni.showToast({ title: '保存成功', icon: 'success' })
				this.closeEditSheet()
			} else {
				uni.showToast({ title: result.message || '保存失败', icon: 'none' })
			}
		}
	}
}
</script>

<style lang="scss" scoped>
// ==================== 变量定义 ====================
$light-bg-base: #FAFBFD;
$light-bg-card: #FFFFFF;
$light-text-primary: #1A2B3C;
$light-text-secondary: #5A6B7C;
$light-text-muted: #9AABBF;
$light-border: rgba(0, 0, 0, 0.06);
$light-accent: #1E3A5F;
$light-accent-light: #2D5A87;

$dark-bg-deep: #0A1628;
$dark-bg-mid: #122640;
$dark-bg-card: #161B22;
$dark-text-primary: #F0F6FC;
$dark-text-secondary: #8B949E;
$dark-text-muted: #484F58;
$dark-glass-bg: rgba(255, 255, 255, 0.06);
$dark-glass-border: rgba(255, 255, 255, 0.1);

$accent-coral: #FF6B5B;

// BMI颜色
$bmi-thin: #3B82F6;
$bmi-normal: #10B981;
$bmi-overweight: #F59E0B;
$bmi-obese: #EF4444;

// ==================== 页面容器 ====================
.health-page {
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
	height: 500rpx;
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

	&--1 { left: 20%; top: 20%; animation-delay: -1s; }
	&--2 { left: 40%; top: 35%; animation-delay: -3s; }
	&--3 { left: 60%; top: 25%; animation-delay: -5s; }
	&--4 { left: 75%; top: 40%; animation-delay: -7s; }
	&--5 { left: 85%; top: 15%; animation-delay: -2s; }
	&--6 { left: 30%; top: 45%; animation-delay: -4s; }
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

// ==================== 固定顶栏 ====================
.fixed-header {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	z-index: 100;
	background: rgba(250, 251, 253, 0.92);
	backdrop-filter: blur(20rpx);
}

// ==================== 导航栏 ====================
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

// ==================== 加载状态 ====================
.loading-container {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
}

.loading-spinner {
	width: 64rpx;
	height: 64rpx;
	border: 4rpx solid $light-border;
	border-top-color: $light-accent;
	border-radius: 50%;
	animation: spin 0.8s linear infinite;
}

@keyframes spin {
	to { transform: rotate(360deg); }
}

.loading-text {
	margin-top: 24rpx;
	font-size: 28rpx;
	color: $light-text-muted;
}

// ==================== 滚动区域 ====================
.scroll-area {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	padding: 0 32rpx;
	box-sizing: border-box;
}

// 入场动画
.section--visible {
	animation: section-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) calc(var(--index, 0) * 0.08s) both;
}

@keyframes section-in {
	from { opacity: 0; transform: translateY(40rpx); }
	to { opacity: 1; transform: translateY(0); }
}

// ==================== 身份卡片 ====================
.identity-card {
	display: flex;
	align-items: center;
	padding: 32rpx;
	background: #F0F4F8;
	border-radius: 24rpx;
	margin-top: 32rpx;
	margin-bottom: 32rpx;
	border: 1rpx solid #D0D7DE;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);

	&__avatar {
		width: 100rpx;
		height: 100rpx;
		background: linear-gradient(135deg, #1E3A5F 0%, #2D5A87 100%);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 24rpx;
		flex-shrink: 0;
	}

	&__info {
		flex: 1;
		min-width: 0;
	}

	&__badge {
		display: flex;
		align-items: center;
		padding: 8rpx 16rpx;
		background: rgba(16, 185, 129, 0.1);
		border-radius: 20rpx;
		flex-shrink: 0;
	}
}

.avatar-text {
	font-size: 44rpx;
	font-weight: 700;
	color: #fff;
}

.identity-name {
	font-size: 36rpx;
	font-weight: 600;
	color: #1A2B3C;
	display: block;
	margin-bottom: 8rpx;
}

.identity-sub {
	display: flex;
	align-items: center;
}

.identity-id {
	font-size: 24rpx;
	color: #5A6B7C;
	letter-spacing: 1rpx;
}

.identity-divider {
	width: 2rpx;
	height: 20rpx;
	background: #D0D7DE;
	margin: 0 16rpx;
}

.identity-age {
	font-size: 24rpx;
	color: #5A6B7C;
}

.verified-icon {
	width: 24rpx;
	height: 24rpx;
	position: relative;
	margin-right: 8rpx;

	&::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 20rpx;
		height: 20rpx;
		border: 2rpx solid #10B981;
		border-radius: 50%;
	}

	&::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 45%;
		transform: translate(-50%, -60%) rotate(45deg);
		width: 8rpx;
		height: 12rpx;
		border-right: 2rpx solid #10B981;
		border-bottom: 2rpx solid #10B981;
	}
}

.badge-text {
	font-size: 20rpx;
	color: #10B981;
}

// ==================== 分组区域 ====================
.section {
	margin-bottom: 32rpx;
}

.section-header {
	display: flex;
	align-items: center;
	margin-bottom: 16rpx;
	padding-left: 8rpx;
}

.section-indicator {
	width: 4rpx;
	height: 28rpx;
	background: $light-accent;
	border-radius: 2rpx;
	margin-right: 12rpx;
}

.section-title {
	font-size: 26rpx;
	color: $light-text-muted;
	letter-spacing: 1rpx;
}

.section-card {
	background: $light-bg-card;
	border-radius: 24rpx;
	box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
	overflow: hidden;
}

// ==================== 身体数据卡片 ====================
.body-card {
	background: $light-bg-card;
	border-radius: 24rpx;
	box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
	overflow: hidden;
}

.body-metrics {
	display: flex;
	align-items: center;
	padding: 32rpx;
}

.metric {
	flex: 1;
	text-align: center;
	position: relative;

	&:active {
		opacity: 0.7;
	}
}

.metric-value {
	font-size: 56rpx;
	font-weight: 700;
	color: $light-text-primary;
	display: block;
	line-height: 1;
}

.metric-unit {
	font-size: 24rpx;
	color: $light-text-muted;
	margin-left: 4rpx;
}

.metric-label {
	font-size: 24rpx;
	color: $light-text-secondary;
	display: block;
	margin-top: 8rpx;
}

.metric-edit-hint {
	position: absolute;
	top: 8rpx;
	right: 24rpx;
	width: 12rpx;
	height: 12rpx;
	border-top: 2rpx solid $light-text-muted;
	border-right: 2rpx solid $light-text-muted;
	transform: rotate(45deg);
}

.metric-divider {
	width: 2rpx;
	height: 80rpx;
	background: $light-border;
}

// BMI区域
.bmi-section {
	padding: 24rpx 32rpx 32rpx;
	border-top: 1rpx solid $light-border;
}

.bmi-header {
	display: flex;
	align-items: baseline;
	margin-bottom: 16rpx;
}

.bmi-label {
	font-size: 26rpx;
	color: $light-text-secondary;
	margin-right: 12rpx;
}

.bmi-value {
	font-size: 36rpx;
	font-weight: 600;
	color: $light-text-primary;
	margin-right: 12rpx;
}

.bmi-status {
	font-size: 24rpx;
	font-weight: 500;
}

.bmi-bar {
	position: relative;
	height: 16rpx;
	margin-bottom: 12rpx;
}

.bmi-track {
	display: flex;
	height: 100%;
	border-radius: 8rpx;
	overflow: hidden;
}

.bmi-zone {
	flex: 1;

	&--thin { background: $bmi-thin; }
	&--normal { background: $bmi-normal; }
	&--overweight { background: $bmi-overweight; }
	&--obese { background: $bmi-obese; }
}

.bmi-indicator {
	position: absolute;
	top: -8rpx;
	transform: translateX(-50%);
	transition: left 0.3s ease;
}

.bmi-pointer {
	width: 0;
	height: 0;
	border-left: 10rpx solid transparent;
	border-right: 10rpx solid transparent;
	border-top: 12rpx solid $light-text-primary;
}

.bmi-labels {
	display: flex;
	justify-content: space-between;
}

.bmi-range-label {
	font-size: 20rpx;
	color: $light-text-muted;
	flex: 1;
	text-align: center;
}

// ==================== 字段列表 ====================
.field-item {
	display: flex;
	align-items: center;
	padding: 28rpx 32rpx;
	border-bottom: 1rpx solid $light-border;
	transition: background 0.2s ease;

	&--last {
		border-bottom: none;
	}

	&--readonly {
		.field-value {
			color: $light-text-muted;
		}
	}

	&:active:not(.field-item--readonly) {
		background: rgba(0, 0, 0, 0.02);
	}
}

.field-label {
	width: 160rpx;
	font-size: 30rpx;
	color: $light-text-primary;
	flex-shrink: 0;
}

.field-value {
	flex: 1;
	font-size: 30rpx;
	color: $light-text-secondary;
	text-align: right;
	margin-right: 16rpx;
}

.arrow-icon {
	width: 14rpx;
	height: 14rpx;
	border-top: 2rpx solid $light-text-muted;
	border-right: 2rpx solid $light-text-muted;
	transform: rotate(45deg);
	flex-shrink: 0;
}

.lock-icon {
	width: 28rpx;
	height: 28rpx;
	position: relative;
	flex-shrink: 0;

	&::before {
		content: '';
		position: absolute;
		bottom: 4rpx;
		left: 50%;
		transform: translateX(-50%);
		width: 18rpx;
		height: 12rpx;
		border: 2rpx solid $light-text-muted;
		border-radius: 3rpx;
	}

	&::after {
		content: '';
		position: absolute;
		top: 4rpx;
		left: 50%;
		transform: translateX(-50%);
		width: 10rpx;
		height: 8rpx;
		border: 2rpx solid $light-text-muted;
		border-radius: 5rpx 5rpx 0 0;
		border-bottom: none;
	}
}

// ==================== 底部留白 ====================
.bottom-space {
	height: calc(60rpx + env(safe-area-inset-bottom));
}

// ==================== 编辑Sheet ====================
.sheet-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.4);
	z-index: 1000;
	display: flex;
	align-items: flex-end;
	animation: mask-in 0.25s ease;
}

@keyframes mask-in {
	from { opacity: 0; }
	to { opacity: 1; }
}

.edit-sheet {
	width: 100%;
	background: $light-bg-card;
	border-radius: 32rpx 32rpx 0 0;
	padding-bottom: env(safe-area-inset-bottom);
	animation: sheet-up 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes sheet-up {
	from { transform: translateY(100%); }
	to { transform: translateY(0); }
}

.sheet-handle {
	width: 64rpx;
	height: 8rpx;
	background: $light-border;
	border-radius: 4rpx;
	margin: 16rpx auto;
}

.sheet-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 16rpx 32rpx 24rpx;
	border-bottom: 1rpx solid $light-border;
}

.sheet-cancel {
	font-size: 30rpx;
	color: $light-text-muted;
	padding: 8rpx 16rpx;
}

.sheet-title {
	font-size: 32rpx;
	font-weight: 600;
	color: $light-text-primary;
}

.sheet-confirm {
	font-size: 30rpx;
	color: $light-accent;
	font-weight: 500;
	padding: 8rpx 16rpx;
}

.sheet-content {
	padding: 32rpx;
	min-height: 200rpx;
}

.input-wrapper,
.number-input-wrapper,
.textarea-wrapper {
	background: rgba(0, 0, 0, 0.03);
	border-radius: 16rpx;
	padding: 24rpx;
}

.number-input-wrapper {
	display: flex;
	align-items: center;
}

.sheet-input {
	flex: 1;
	font-size: 32rpx;
	color: $light-text-primary;
	background: transparent;

	&--number {
		text-align: center;
		font-size: 48rpx;
		font-weight: 600;
	}
}

.number-unit {
	font-size: 28rpx;
	color: $light-text-muted;
	margin-left: 12rpx;
}

.sheet-textarea {
	width: 100%;
	height: 200rpx;
	font-size: 30rpx;
	color: $light-text-primary;
	background: transparent;
}

.sheet-placeholder {
	color: $light-text-muted;
}

// Picker选项
.picker-wrapper {
	max-height: 500rpx;
	overflow-y: auto;
}

.picker-option {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 28rpx 24rpx;
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
	}
}

// ==================== 深色模式 ====================
.health-page--dark {
	background: $dark-bg-deep;

	.fixed-header {
		background: rgba(10, 22, 40, 0.92);
	}

	.bg-gradient {
		background: linear-gradient(180deg, rgba(74, 144, 217, 0.15) 0%, $dark-bg-deep 100%);
	}

	.particles {
		opacity: 1;
	}

	.navbar__title {
		color: $dark-text-primary;
	}

	.back-icon {
		border-color: $dark-text-primary;
	}

	.loading-spinner {
		border-color: $dark-glass-border;
		border-top-color: $accent-coral;
	}

	.loading-text {
		color: $dark-text-muted;
	}

	// 身份卡片（深色模式用蓝色）
	.identity-card {
		background: linear-gradient(135deg, #1E3A5F 0%, #2D5A87 100%);
		box-shadow: 0 8rpx 32rpx rgba(30, 58, 95, 0.25);
		border-color: rgba(255, 255, 255, 0.1);
	}

	.identity-name {
		color: #fff;
	}

	.identity-id,
	.identity-age {
		color: rgba(255, 255, 255, 0.8);
	}

	.identity-divider {
		background: rgba(255, 255, 255, 0.4);
	}

	// 分组区域
	.section-indicator {
		background: $accent-coral;
	}

	.section-title {
		color: $dark-text-muted;
	}

	.section-card,
	.body-card {
		background: $dark-glass-bg;
		border: 1rpx solid $dark-glass-border;
		box-shadow: none;
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
	}

	// 身体数据
	.metric-value {
		color: $dark-text-primary;
	}

	.metric-label {
		color: $dark-text-secondary;
	}

	.metric-unit,
	.metric-edit-hint {
		border-color: $dark-text-muted;
	}

	.metric-divider {
		background: $dark-glass-border;
	}

	.bmi-section {
		border-top-color: $dark-glass-border;
	}

	.bmi-label {
		color: $dark-text-secondary;
	}

	.bmi-value {
		color: $dark-text-primary;
	}

	.bmi-pointer {
		border-top-color: $dark-text-primary;
	}

	.bmi-range-label {
		color: $dark-text-muted;
	}

	// 字段列表
	.field-item {
		border-bottom-color: $dark-glass-border;

		&:active:not(.field-item--readonly) {
			background: rgba(255, 255, 255, 0.03);
		}
	}

	.field-label {
		color: $dark-text-primary;
	}

	.field-value {
		color: $dark-text-secondary;
	}

	.field-item--readonly .field-value {
		color: $dark-text-muted;
	}

	.arrow-icon {
		border-color: $dark-text-muted;
	}

	.lock-icon {
		&::before,
		&::after {
			border-color: $dark-text-muted;
		}
	}

	// 编辑Sheet
	.sheet-mask {
		background: rgba(0, 0, 0, 0.6);
	}

	.edit-sheet {
		background: linear-gradient(180deg, $dark-bg-mid 0%, $dark-bg-deep 100%);
	}

	.sheet-handle {
		background: $dark-glass-border;
	}

	.sheet-header {
		border-bottom-color: $dark-glass-border;
	}

	.sheet-cancel {
		color: $dark-text-muted;
	}

	.sheet-title {
		color: $dark-text-primary;
	}

	.sheet-confirm {
		color: $accent-coral;
	}

	.input-wrapper,
	.number-input-wrapper,
	.textarea-wrapper {
		background: rgba(255, 255, 255, 0.04);
	}

	.sheet-input,
	.sheet-textarea {
		color: $dark-text-primary;
	}

	.number-unit {
		color: $dark-text-muted;
	}

	.sheet-placeholder {
		color: $dark-text-muted;
	}

	.picker-option {
		&--active {
			background: rgba(255, 107, 91, 0.1);
		}

		&__text {
			color: $dark-text-primary;
		}

		&__check {
			border-color: $accent-coral;
		}
	}
}
</style>
