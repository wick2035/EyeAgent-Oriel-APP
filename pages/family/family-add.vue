<template>
	<view class="page" :class="{ 'page--dark': isDark }">
		<!-- 固定头部 -->
		<view class="fixed-header">
			<view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
			<view class="navbar">
				<view class="navbar__back" @click="goBack">
					<view class="back-icon"></view>
				</view>
				<text class="navbar__title">{{ isEdit ? '编辑就诊人' : '添加就诊人' }}</text>
				<view class="navbar__placeholder"></view>
			</view>
		</view>

		<!-- 头部占位 -->
		<view class="header-placeholder" :style="{ height: (statusBarHeight + 44) + 'px' }"></view>

		<!-- 表单 -->
		<view class="form-card">
			<!-- 姓名 -->
			<view class="form-item">
				<text class="form-item__label">姓名</text>
				<input
					class="form-item__input"
					v-model="form.name"
					placeholder="请输入就诊人姓名"
					placeholder-class="form-item__placeholder"
					maxlength="20"
				/>
			</view>

			<!-- 关系 -->
			<view class="form-item" @click="showRelationPicker = true">
				<text class="form-item__label">与本人关系</text>
				<view class="form-item__value">
					<text :class="form.relation ? 'form-item__text' : 'form-item__placeholder'">
						{{ form.relation ? relationLabel : '请选择' }}
					</text>
					<view class="form-item__arrow"></view>
				</view>
			</view>

			<!-- 手机号 -->
			<view class="form-item">
				<text class="form-item__label">手机号</text>
				<input
					class="form-item__input"
					v-model="form.phone"
					placeholder="请输入手机号"
					placeholder-class="form-item__placeholder"
					type="number"
					maxlength="11"
				/>
			</view>

			<!-- 身份证号 -->
			<view class="form-item">
				<text class="form-item__label">身份证号</text>
				<input
					class="form-item__input"
					v-model="form.idNumber"
					placeholder="请输入身份证号码"
					placeholder-class="form-item__placeholder"
					maxlength="18"
				/>
			</view>

			<!-- 验证码 -->
			<view class="form-item form-item--last">
				<text class="form-item__label">验证码</text>
				<input
					class="form-item__input form-item__input--code"
					v-model="form.verifyCode"
					placeholder="请输入验证码"
					placeholder-class="form-item__placeholder"
					type="number"
					maxlength="6"
				/>
				<view
					class="sms-btn"
					:class="{ 'sms-btn--disabled': smsCooldown > 0 || !canSendSms }"
					@click="sendSmsCode"
				>
					<text class="sms-btn__text">{{ smsBtnText }}</text>
				</view>
			</view>
		</view>

		<!-- 提交按钮 -->
		<view class="btn-area">
			<view class="submit-btn" :class="{ 'submit-btn--disabled': !canSubmit }" @click="handleSubmit">
				<text class="submit-btn__text">{{ isEdit ? '保存' : '添加' }}</text>
			</view>
		</view>

		<!-- 删除按钮（编辑模式） -->
		<view class="delete-area" v-if="isEdit" @click="handleDelete">
			<text class="delete-text">删除该就诊人</text>
		</view>

		<!-- 关系选择器 -->
		<view class="picker-mask" v-if="showRelationPicker" @click="showRelationPicker = false">
			<view class="picker-panel" @click.stop>
				<view class="picker-panel__header">
					<text class="picker-panel__cancel" @click="showRelationPicker = false">取消</text>
					<text class="picker-panel__title">选择关系</text>
					<text class="picker-panel__confirm" @click="showRelationPicker = false">确定</text>
				</view>
				<view class="picker-panel__body">
					<view
						v-for="item in relationOptions"
						:key="item.value"
						class="picker-option"
						:class="{ 'picker-option--active': form.relation === item.value }"
						@click="selectRelation(item.value)"
					>
						<text class="picker-option__text">{{ item.label }}</text>
						<view v-if="form.relation === item.value" class="picker-option__check"></view>
					</view>
				</view>
			</view>
		</view>

	</view>
</template>

<script>
import { isDarkMode } from '@/store/theme.js'
import {
	addFamilyMember,
	updateFamilyMember,
	removeFamilyMember,
	getRelationLabel,
	RELATION_OPTIONS,
	familyState
} from '@/store/family.js'
import { sendSms } from '@/utils/api/user.js'

export default {
	data() {
		return {
			statusBarHeight: 44,
			isEdit: false,
			editId: '',
			form: {
				name: '',
				relation: '',
				phone: '',
				idNumber: '',
				verifyCode: ''
			},
			showRelationPicker: false,
			submitting: false,
			relationOptions: RELATION_OPTIONS,
			smsCooldown: 0,
			smsTimer: null
		}
	},
	computed: {
		isDark() {
			return isDarkMode()
		},
		canSubmit() {
			return this.form.name.trim() && this.form.relation && this.form.phone.length === 11 && this.form.idNumber.length >= 15 && this.form.verifyCode.length >= 4 && !this.submitting
		},
		canSendSms() {
			return this.form.phone.length === 11
		},
		smsBtnText() {
			return this.smsCooldown > 0 ? `${this.smsCooldown}s` : '获取验证码'
		},
		relationLabel() {
			return getRelationLabel(this.form.relation)
		}
	},
	beforeDestroy() {
		if (this.smsTimer) clearInterval(this.smsTimer)
	},
	onLoad(options) {
		this.getStatusBarHeight()
		if (options.id) {
			this.isEdit = true
			this.editId = options.id
			this.loadMember(options.id)
		}
	},
	methods: {
		getStatusBarHeight() {
			const sysInfo = uni.getSystemInfoSync()
			this.statusBarHeight = sysInfo.statusBarHeight || 44
		},
		goBack() {
			uni.navigateBack()
		},
		loadMember(id) {
			const member = familyState.members.find(m => m.id === id)
			if (member) {
				this.form.name = member.name || ''
				this.form.relation = member.relation || ''
				this.form.phone = member.phone || ''
				this.form.idNumber = member.idNumber || ''
			}
		},
		selectRelation(value) {
			this.form.relation = value
			this.showRelationPicker = false
		},
		async sendSmsCode() {
			if (this.smsCooldown > 0 || !this.canSendSms) return
			try {
				await sendSms(this.form.phone)
				uni.showToast({ title: '验证码已发送', icon: 'none' })
				this.smsCooldown = 60
				this.smsTimer = setInterval(() => {
					this.smsCooldown--
					if (this.smsCooldown <= 0) {
						clearInterval(this.smsTimer)
						this.smsTimer = null
					}
				}, 1000)
			} catch (e) {
				uni.showToast({ title: '发送失败', icon: 'none' })
			}
		},
		async handleSubmit() {
			if (!this.canSubmit) return

			this.submitting = true
			try {
				const data = {
					name: this.form.name.trim(),
					relation: this.form.relation,
					phone: this.form.phone,
					idNumber: this.form.idNumber,
					verifyCode: this.form.verifyCode
				}

				let res
				if (this.isEdit) {
					res = await updateFamilyMember(this.editId, data)
				} else {
					res = await addFamilyMember(data)
				}

				if (res.code === 200) {
					uni.showToast({
						title: this.isEdit ? '保存成功' : '添加成功',
						icon: 'success'
					})
					setTimeout(() => uni.navigateBack(), 800)
				} else {
					uni.showToast({ title: res.msg || '操作失败', icon: 'none' })
				}
			} catch (e) {
				uni.showToast({ title: '操作失败', icon: 'none' })
			} finally {
				this.submitting = false
			}
		},
		handleDelete() {
			uni.showModal({
				title: '确认删除',
				content: `确定要删除就诊人「${this.form.name}」吗？`,
				confirmColor: '#EF4444',
				success: async (res) => {
					if (res.confirm) {
						const result = await removeFamilyMember(this.editId)
						if (result.code === 200) {
							uni.showToast({ title: '已删除', icon: 'success' })
							setTimeout(() => uni.navigateBack(), 800)
						} else {
							uni.showToast({ title: result.msg || '删除失败', icon: 'none' })
						}
					}
				}
			})
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

.status-bar {
	width: 100%;
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

// 表单
.form-card {
	margin: $spacing-lg $spacing-lg 0;
	background: $bg-card;
	border-radius: $radius-xl;
	box-shadow: $shadow-sm;
	overflow: hidden;

	.page--dark & {
		background: $dark-bg-card;
	}
}

.form-item {
	display: flex;
	align-items: center;
	padding: $spacing-md $spacing-lg;
	border-bottom: 1rpx solid $border-color-light;

	&--last {
		border-bottom: none;
	}

	.page--dark & {
		border-bottom-color: $dark-border-color;
	}

	&__label {
		width: 160rpx;
		font-size: $font-size-base;
		color: $text-primary;
		flex-shrink: 0;

		.page--dark & {
			color: $dark-text-primary;
		}
	}

	&__input {
		flex: 1;
		font-size: $font-size-base;
		color: $text-primary;
		text-align: right;

		.page--dark & {
			color: $dark-text-primary;
		}
	}

	&__value {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: flex-end;
	}

	&__text {
		font-size: $font-size-base;
		color: $text-primary;

		.page--dark & {
			color: $dark-text-primary;
		}
	}

	&__placeholder {
		font-size: $font-size-base;
		color: $text-muted;

		.page--dark & {
			color: $dark-text-muted;
		}
	}

	&__input--code {
		flex: 1;
		min-width: 0;
	}

	&__arrow {
		width: 14rpx;
		height: 14rpx;
		border-top: 3rpx solid $text-muted;
		border-right: 3rpx solid $text-muted;
		transform: rotate(45deg);
		margin-left: $spacing-sm;

		.page--dark & {
			border-color: $dark-text-muted;
		}
	}
}

.sms-btn {
	flex-shrink: 0;
	margin-left: $spacing-sm;
	padding: 12rpx 24rpx;
	background: rgba(30, 58, 95, 0.08);
	border-radius: $radius-sm;
	transition: opacity 150ms ease;

	&:active {
		opacity: 0.6;
	}

	&--disabled {
		opacity: 0.4;
		pointer-events: none;
	}

	&__text {
		font-size: $font-size-xs;
		color: $color-primary;
		white-space: nowrap;
	}

	.page--dark & {
		background: rgba(74, 144, 217, 0.15);
	}
}

// 提交按钮
.btn-area {
	padding: $spacing-xl $spacing-lg 0;
}

.submit-btn {
	height: 96rpx;
	background: $color-primary;
	border-radius: $radius-xl;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 8rpx 24rpx rgba(30, 58, 95, 0.25);
	transition: transform 150ms ease, opacity 150ms ease;

	&:active {
		transform: scale(0.97);
	}

	&--disabled {
		opacity: 0.5;
		pointer-events: none;
	}

	&__text {
		font-size: $font-size-lg;
		font-weight: $font-weight-semibold;
		color: #fff;
	}
}

// 删除按钮
.delete-area {
	padding: $spacing-xl;
	text-align: center;
}

.delete-text {
	font-size: $font-size-base;
	color: $color-error;

	&:active {
		opacity: 0.5;
	}
}

// 选择器面板
.picker-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 200;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: flex-end;
	animation: maskFadeIn 0.25s ease;
}

.picker-panel {
	width: 100%;
	background: $bg-card;
	border-radius: $radius-xl $radius-xl 0 0;
	animation: panelSlideUp 0.3s ease;
	padding-bottom: env(safe-area-inset-bottom);

	.page--dark & {
		background: $dark-bg-card;
	}

	&__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: $spacing-md $spacing-lg;
		border-bottom: 1rpx solid $border-color-light;

		.page--dark & {
			border-bottom-color: $dark-border-color;
		}
	}

	&__cancel {
		font-size: $font-size-base;
		color: $text-muted;
	}

	&__title {
		font-size: $font-size-base;
		font-weight: $font-weight-semibold;
		color: $text-primary;

		.page--dark & {
			color: $dark-text-primary;
		}
	}

	&__confirm {
		font-size: $font-size-base;
		color: $color-primary;
	}

	&__body {
		padding: $spacing-sm 0;
	}
}

.picker-option {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: $spacing-md $spacing-lg;

	&--active {
		background: rgba(30, 58, 95, 0.05);

		.page--dark & {
			background: rgba(74, 144, 217, 0.1);
		}
	}

	&__text {
		font-size: $font-size-lg;
		color: $text-primary;

		.page--dark & {
			color: $dark-text-primary;
		}
	}

	&__check {
		width: 20rpx;
		height: 12rpx;
		border-left: 4rpx solid $color-primary;
		border-bottom: 4rpx solid $color-primary;
		transform: rotate(-45deg);
	}
}

@keyframes maskFadeIn {
	from { opacity: 0; }
	to { opacity: 1; }
}

@keyframes panelSlideUp {
	from { transform: translateY(100%); }
	to { transform: translateY(0); }
}
</style>
