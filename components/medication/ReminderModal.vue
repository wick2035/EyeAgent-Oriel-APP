<template>
	<view v-if="visible" class="reminder-modal" :class="{ 'reminder-modal--dark': isDark }">
		<!-- 遮罩 -->
		<view
			class="reminder-modal__overlay"
			:class="{ 'reminder-modal__overlay--show': showContent }"
			@click="handleClose"
		></view>

		<!-- 弹窗容器 -->
		<view
			class="reminder-modal__container"
			:class="{ 'reminder-modal__container--show': showContent }"
		>
			<!-- 拖动条 -->
			<view class="reminder-modal__handle"></view>

			<!-- 标题 -->
			<view class="reminder-modal__header">
				<text class="reminder-modal__title">{{ isEdit ? '编辑用药提醒' : '新增用药提醒' }}</text>
				<view class="reminder-modal__close" @click="handleClose">
					<view class="close-icon"></view>
				</view>
			</view>

			<!-- 内容 -->
			<scroll-view class="reminder-modal__content" scroll-y>
				<!-- 药物名称 -->
				<view class="form-item">
					<text class="form-item__label">药物名称 <text class="required">*</text></text>
					<input
						class="form-item__input"
						v-model="formData.medicineName"
						placeholder="请输入药物名称"
						:placeholder-style="placeholderStyle"
					/>
				</view>

				<!-- 药物规格 -->
				<view class="form-item">
					<text class="form-item__label">药物规格</text>
					<input
						class="form-item__input"
						v-model="formData.medicineSpec"
						placeholder="如：5ml:15mg"
						:placeholder-style="placeholderStyle"
					/>
				</view>

				<!-- 用量 -->
				<view class="form-item">
					<text class="form-item__label">每次用量 <text class="required">*</text></text>
					<input
						class="form-item__input"
						v-model="formData.dosage"
						placeholder="如：1滴、1粒"
						:placeholder-style="placeholderStyle"
					/>
				</view>

				<!-- 药物类型 -->
				<view class="form-item">
					<text class="form-item__label">药物类型</text>
					<scroll-view class="type-selector" scroll-x :show-scrollbar="false" enhanced>
						<view class="type-selector__inner">
							<view
								v-for="type in medicineTypes"
								:key="type.value"
								class="type-item"
								:class="{ 'type-item--active': formData.medicineType === type.value }"
								@click="formData.medicineType = type.value"
							>
								<view class="type-item__icon">
									<view class="drug-icon" :class="[`drug-icon--${type.value}`]"></view>
								</view>
								<text class="type-item__label">{{ type.label }}</text>
							</view>
						</view>
					</scroll-view>
				</view>

				<!-- 服药频率 -->
				<view class="form-item">
					<text class="form-item__label">服药频率</text>
					<scroll-view class="frequency-selector" scroll-x :show-scrollbar="false" enhanced>
						<view class="frequency-selector__inner">
							<view
								v-for="freq in frequencies"
								:key="freq"
								class="frequency-item"
								:class="{ 'frequency-item--active': formData.frequency === freq }"
								@click="formData.frequency = freq"
							>
								<text>{{ freq }}</text>
							</view>
						</view>
					</scroll-view>
				</view>

				<!-- 提醒时间 -->
				<view class="form-item">
					<text class="form-item__label">提醒时间 <text class="required">*</text></text>
					<picker mode="time" :value="pickerTime" @change="onTimeChange">
						<view class="time-picker">
							<text class="time-picker__value" v-if="formData.scheduledTime">
								{{ formatDisplayTime }}
							</text>
							<text class="time-picker__placeholder" v-else>选择时间</text>
							<view class="time-picker__arrow"></view>
						</view>
					</picker>
				</view>

				<!-- 持续时间 -->
				<view class="form-item">
					<text class="form-item__label">持续时间</text>
					<scroll-view class="duration-selector" scroll-x :show-scrollbar="false" enhanced>
						<view class="duration-selector__inner">
							<view
								v-for="dur in durations"
								:key="dur.value"
								class="duration-item"
								:class="{ 'duration-item--active': formData.duration === dur.value }"
								@click="selectDuration(dur.value)"
							>
								<text>{{ dur.label }}</text>
							</view>
						</view>
					</scroll-view>
					<!-- 自定义天数输入 -->
					<view v-if="formData.duration === 'custom'" class="custom-duration">
						<input
							type="number"
							class="custom-duration__input"
							v-model="customDays"
							placeholder="输入天数"
							:placeholder-style="placeholderStyle"
						/>
						<text class="custom-duration__unit">天</text>
					</view>
				</view>

				<!-- 底部留白 -->
				<view style="height: 40rpx;"></view>
			</scroll-view>

			<!-- 操作按钮 -->
			<view class="reminder-modal__footer">
				<view class="reminder-modal__btn reminder-modal__btn--cancel" @click="handleClose">
					<text>取消</text>
				</view>
				<view class="reminder-modal__btn reminder-modal__btn--confirm" @click="handleSubmit">
					<text>{{ isEdit ? '保存' : '添加' }}</text>
				</view>
			</view>
		</view>

	</view>
</template>

<script>
import { isDarkMode } from '@/store/theme.js'

export default {
	name: 'ReminderModal',
	props: {
		visible: {
			type: Boolean,
			default: false
		},
		editData: {
			type: Object,
			default: null
		}
	},
	data() {
		return {
			showContent: false,
			customDays: '',
			formData: {
				medicineName: '',
				medicineSpec: '',
				dosage: '',
				medicineType: 'pill',
				frequency: '每日1次',
				scheduledTime: '',
				duration: 7
			},
			medicineTypes: [
				{ value: 'drops', label: '滴剂' },
				{ value: 'pill', label: '药片' },
				{ value: 'capsule', label: '胶囊' },
				{ value: 'injection', label: '注射' }
			],
			frequencies: ['每日1次', '每日2次', '每日3次', '每日4次', '每日6次'],
			durations: [
				{ value: 7, label: '7天' },
				{ value: 14, label: '14天' },
				{ value: 30, label: '30天' },
				{ value: -1, label: '长期' },
				{ value: 'custom', label: '自定义' }
			]
		}
	},
	computed: {
		isDark() {
			return isDarkMode()
		},
		isEdit() {
			return !!this.editData
		},
		placeholderStyle() {
			return this.isDark
				? 'color: #484F58;'
				: 'color: #9AABBF;'
		},
		pickerTime() {
			if (this.formData.scheduledTime) {
				return this.formData.scheduledTime.substring(11, 16)
			}
			return '08:00'
		},
		formatDisplayTime() {
			if (!this.formData.scheduledTime) return ''
			return this.formData.scheduledTime.substring(11, 16)
		}
	},
	watch: {
		visible(val) {
			if (val) {
				setTimeout(() => {
					this.showContent = true
				}, 50)
				if (this.editData) {
					this.formData = { ...this.editData }
				} else {
					this.resetForm()
				}
			} else {
				this.showContent = false
			}
		}
	},
	methods: {
		resetForm() {
			this.formData = {
				medicineName: '',
				medicineSpec: '',
				dosage: '',
				medicineType: 'pill',
				frequency: '每日1次',
				scheduledTime: '',
				duration: 7
			}
			this.customDays = ''
		},
		selectDuration(value) {
			this.formData.duration = value
			if (value !== 'custom') {
				this.customDays = ''
			}
		},
		handleClose() {
			this.showContent = false
			setTimeout(() => {
				this.$emit('close')
			}, 300)
		},
		onTimeChange(e) {
			const time = e.detail.value
			// 编辑时保留原提醒日期，新建时用今天
			const existingDate = this.formData.scheduledTime
				? this.formData.scheduledTime.split('T')[0]
				: null
			const date = existingDate || new Date().toISOString().split('T')[0]
			this.formData.scheduledTime = `${date}T${time}:00`
		},
		handleSubmit() {
			// 验证
			if (!this.formData.medicineName.trim()) {
				uni.showToast({ title: '请输入药物名称', icon: 'none' })
				return
			}
			if (!this.formData.dosage.trim()) {
				uni.showToast({ title: '请输入每次用量', icon: 'none' })
				return
			}
			if (!this.formData.scheduledTime) {
				uni.showToast({ title: '请选择提醒时间', icon: 'none' })
				return
			}
			// 验证自定义天数
			if (this.formData.duration === 'custom') {
				const days = parseInt(this.customDays)
				if (!days || days <= 0) {
					uni.showToast({ title: '请输入有效天数', icon: 'none' })
					return
				}
			}

			// 提交数据，将自定义天数转为实际数值
			const submitData = { ...this.formData }
			if (submitData.duration === 'custom') {
				submitData.duration = parseInt(this.customDays)
			}

			this.$emit('submit', submitData)
			this.handleClose()
		}
	}
}
</script>

<style lang="scss" scoped>
.reminder-modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 10000;

	* {
		box-sizing: border-box;
	}

	&__overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(30, 58, 95, 0);
		backdrop-filter: blur(0px);
		transition: all 0.35s ease;

		&--show {
			background: rgba(30, 58, 95, 0.5);
			backdrop-filter: blur(12px);
		}
	}

	&__container {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		background: $bg-card;
		border-radius: $radius-xl $radius-xl 0 0;
		max-height: 85vh;
		transform: translateY(100%);
		transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
		display: flex;
		flex-direction: column;

		&--show {
			transform: translateY(0);
		}
	}

	&__handle {
		width: 60rpx;
		height: 8rpx;
		background: $border-color;
		border-radius: 4rpx;
		margin: 24rpx auto 16rpx;
	}

	&__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 $spacing-lg $spacing-md;
		border-bottom: 1rpx solid $border-color;
	}

	&__title {
		font-size: $font-size-xl;
		font-weight: $font-weight-semibold;
		color: $text-primary;
	}

	&__close {
		width: 56rpx;
		height: 56rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	&__content {
		flex: 1;
		padding: $spacing-lg;
		max-height: 60vh;
		overflow-x: hidden;
		box-sizing: border-box;
	}

	&__footer {
		display: flex;
		gap: $spacing-md;
		padding: $spacing-lg;
		padding-bottom: calc($spacing-lg + env(safe-area-inset-bottom));
		border-top: 1rpx solid $border-color;
	}

	&__btn {
		flex: 1;
		height: 88rpx;
		border-radius: $radius-md;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: $font-size-lg;
		font-weight: $font-weight-medium;
		transition: transform 0.2s ease;

		&:active {
			transform: scale(0.98);
		}

		&--cancel {
			background: $bg-elevated;
			color: $text-secondary;
		}

		&--confirm {
			background: linear-gradient(135deg, #0F766E 0%, #10B981 100%);
			color: #fff;
			box-shadow: 0 4rpx 16rpx rgba(16, 185, 129, 0.3);
		}
	}

	// 深色模式
	&--dark {
		.reminder-modal__overlay--show {
			background: rgba(0, 0, 0, 0.6);
		}

		.reminder-modal__container {
			background: $dark-bg-card;
		}

		.reminder-modal__handle {
			background: $dark-border-color;
		}

		.reminder-modal__header {
			border-bottom-color: $dark-border-color;
		}

		.reminder-modal__title {
			color: $dark-text-primary;
		}

		.reminder-modal__footer {
			border-top-color: $dark-border-color;
		}

		.reminder-modal__btn--cancel {
			background: $dark-bg-elevated;
			color: $dark-text-secondary;
		}

		.form-item__label {
			color: $dark-text-primary;
		}

		.form-item__input {
			background: $dark-bg-elevated;
			border-color: $dark-border-color;
			color: $dark-text-primary;
		}

		.type-item {
			background: $dark-bg-elevated;
			border-color: $dark-border-color;

			&--active {
				border-color: #10B981;
				background: rgba(16, 185, 129, 0.1);
			}
		}

		.type-item__label {
			color: $dark-text-secondary;
		}

		.frequency-item {
			background: $dark-bg-elevated;
			color: $dark-text-secondary;

			&--active {
				background: #10B981;
				color: #fff;
			}
		}

		.duration-item {
			background: $dark-bg-elevated;
			border-color: $dark-border-color;
			color: $dark-text-secondary;

			&--active {
				border-color: #10B981;
				background: rgba(16, 185, 129, 0.1);
				color: #10B981;
			}
		}

		.time-picker {
			background: $dark-bg-elevated;
			border-color: $dark-border-color;
		}

		.time-picker__value {
			color: $dark-text-primary;
		}

		.time-picker__placeholder {
			color: $dark-text-muted;
		}

		.custom-duration__input {
			background: $dark-bg-elevated;
			border-color: #10B981;
			color: $dark-text-primary;
		}

		.custom-duration__unit {
			color: $dark-text-secondary;
		}
	}
}

// 关闭图标
.close-icon {
	width: 24rpx;
	height: 24rpx;
	position: relative;

	&::before,
	&::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		width: 24rpx;
		height: 3rpx;
		background: $text-muted;
		border-radius: 2rpx;
	}

	&::before {
		transform: translate(-50%, -50%) rotate(45deg);
	}

	&::after {
		transform: translate(-50%, -50%) rotate(-45deg);
	}
}

// 表单项
.form-item {
	margin-bottom: $spacing-lg;

	&__label {
		font-size: $font-size-base;
		font-weight: $font-weight-medium;
		color: $text-primary;
		display: block;
		margin-bottom: $spacing-sm;

		.required {
			color: $color-error;
		}
	}

	&__input {
		width: 100%;
		height: 88rpx;
		padding: 0 $spacing-md;
		background: $bg-input;
		border: 2rpx solid $border-color;
		border-radius: $radius-md;
		font-size: $font-size-base;
		color: $text-primary;
		box-sizing: border-box;

		&:focus {
			border-color: #10B981;
		}
	}
}

// 类型选择器
.type-selector {
	width: 100%;
	white-space: nowrap;
	overflow: hidden;

	&__inner {
		display: inline-flex;
		gap: $spacing-sm;
		padding-right: $spacing-md;
		width: max-content;
	}
}

.type-item {
	display: inline-flex;
	flex-direction: column;
	align-items: center;
	padding: $spacing-sm $spacing-md;
	background: $bg-input;
	border: 2rpx solid $border-color;
	border-radius: $radius-md;
	transition: all 0.2s ease;
	box-sizing: border-box;
	min-width: 120rpx;

	&--active {
		border-color: #10B981;
		background: rgba(16, 185, 129, 0.08);
	}

	&__icon {
		width: 48rpx;
		height: 48rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: $spacing-xs;
	}

	&__label {
		font-size: $font-size-xs;
		color: $text-secondary;
	}
}

// 频率选择器
.frequency-selector {
	width: 100%;
	white-space: nowrap;
	overflow: hidden;

	&__inner {
		display: inline-flex;
		gap: $spacing-sm;
		padding-right: $spacing-md;
		width: max-content;
	}
}

.frequency-item {
	display: inline-block;
	padding: $spacing-sm $spacing-md;
	background: $bg-input;
	border-radius: $radius-sm;
	font-size: $font-size-sm;
	color: $text-secondary;
	transition: all 0.2s ease;
	flex-shrink: 0;

	&--active {
		background: #10B981;
		color: #fff;
	}
}

// 持续时间选择器
.duration-selector {
	width: 100%;
	white-space: nowrap;
	overflow: hidden;

	&__inner {
		display: inline-flex;
		gap: $spacing-sm;
		padding-right: $spacing-md;
		width: max-content;
	}
}

.duration-item {
	display: inline-block;
	padding: $spacing-sm $spacing-lg;
	background: $bg-input;
	border: 2rpx solid $border-color;
	border-radius: $radius-sm;
	font-size: $font-size-sm;
	color: $text-secondary;
	transition: all 0.2s ease;
	flex-shrink: 0;

	&--active {
		border-color: #10B981;
		background: rgba(16, 185, 129, 0.08);
		color: #10B981;
	}
}

// 自定义天数输入
.custom-duration {
	display: flex;
	align-items: center;
	gap: $spacing-sm;
	margin-top: $spacing-sm;

	&__input {
		flex: 1;
		height: 72rpx;
		padding: 0 $spacing-md;
		background: $bg-input;
		border: 2rpx solid #10B981;
		border-radius: $radius-md;
		font-size: $font-size-base;
		color: $text-primary;
		box-sizing: border-box;
		text-align: center;
	}

	&__unit {
		font-size: $font-size-base;
		color: $text-secondary;
		flex-shrink: 0;
	}
}

// 时间选择器
.time-picker {
	height: 88rpx;
	padding: 0 $spacing-md;
	background: $bg-input;
	border: 2rpx solid $border-color;
	border-radius: $radius-md;
	display: flex;
	align-items: center;
	justify-content: space-between;

	&__value {
		font-size: $font-size-lg;
		font-weight: $font-weight-medium;
		color: $text-primary;
		font-family: $font-family-mono;
	}

	&__placeholder {
		font-size: $font-size-base;
		color: $text-muted;
	}

	&__arrow {
		width: 16rpx;
		height: 16rpx;
		border-right: 3rpx solid $text-muted;
		border-bottom: 3rpx solid $text-muted;
		transform: rotate(-45deg);
	}
}

// 药物图标
.drug-icon {
	&--drops {
		width: 24rpx;
		height: 32rpx;
		position: relative;

		&::before {
			content: '';
			position: absolute;
			bottom: 0;
			left: 50%;
			transform: translateX(-50%);
			width: 16rpx;
			height: 24rpx;
			border: 2rpx solid #06B6D4;
			border-radius: 8rpx 8rpx 4rpx 4rpx;
		}

		&::after {
			content: '';
			position: absolute;
			top: 0;
			left: 50%;
			transform: translateX(-50%);
			width: 8rpx;
			height: 10rpx;
			background: #06B6D4;
			border-radius: 0 0 4rpx 4rpx;
		}
	}

	&--pill {
		width: 32rpx;
		height: 14rpx;
		border-radius: 7rpx;
		background: linear-gradient(90deg, #10B981 50%, #6EE7B7 50%);
		border: 2rpx solid #10B981;
	}

	&--capsule {
		width: 28rpx;
		height: 12rpx;
		border-radius: 6rpx;
		background: linear-gradient(90deg, #F59E0B 50%, #FCD34D 50%);
		border: 2rpx solid #F59E0B;
		transform: rotate(-30deg);
	}

	&--injection {
		width: 32rpx;
		height: 12rpx;
		position: relative;

		&::before {
			content: '';
			position: absolute;
			left: 0;
			top: 0;
			width: 24rpx;
			height: 12rpx;
			border: 2rpx solid #EF4444;
			border-radius: 2rpx;
		}

		&::after {
			content: '';
			position: absolute;
			right: 0;
			top: 50%;
			transform: translateY(-50%);
			width: 8rpx;
			height: 2rpx;
			background: #EF4444;
		}
	}
}
</style>
