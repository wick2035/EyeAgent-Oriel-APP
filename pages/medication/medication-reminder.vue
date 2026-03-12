<template>
	<view class="page" :class="{ 'page--dark': isDark }">
		<!-- 简洁背景 -->
		<view class="page-bg"></view>

		<!-- 固定头部区域 -->
		<view class="fixed-header" :style="{ paddingTop: statusBarHeight + 'px' }">
			<!-- 导航栏 -->
			<view class="navbar">
				<view class="navbar__back" @click="goBack">
					<view class="back-icon"></view>
				</view>
				<text class="navbar__title">用药提醒</text>
				<view class="navbar__action" @click="showAddModal">
					<view class="add-icon"></view>
				</view>
			</view>
		</view>

		<!-- 头部占位 -->
		<view class="header-placeholder" :style="{ height: (statusBarHeight + 44) + 'px' }"></view>

		<!-- 提醒列表 -->
		<scroll-view
			class="reminder-list"
			scroll-y
			:style="{ height: scrollHeight + 'px' }"
			:refresher-enabled="true"
			:refresher-triggered="isRefreshing"
			@refresherrefresh="onRefresh"
		>
			<template v-if="groupedReminders.length > 0">
				<view
					v-for="(group, gIndex) in groupedReminders"
					:key="group.key"
					class="date-group"
				>
					<!-- 分组标题 -->
					<view
						class="date-group__header"
						@click="toggleGroupExpand(group.key)"
					>
						<text class="date-group__title">{{ group.label }}</text>
						<!-- 展开/收起箭头 -->
						<view
							class="date-group__arrow"
							:class="{ 'date-group__arrow--expanded': expandedGroups[group.key] }"
						></view>
					</view>

					<!-- 提醒卡片列表 -->
					<view
						class="date-group__list"
						:class="{ 'date-group__list--collapsed': !expandedGroups[group.key] }"
					>
						<ReminderCard
							v-for="(item, index) in group.items"
							:key="item.id"
							:id="item.id"
							:medicineName="item.medicineName"
							:medicineSpec="item.medicineSpec"
							:dosage="item.dosage"
							:frequency="item.frequency"
							:scheduledTime="item.scheduledTime"
							:status="item.status"
							:showDate="group.showDate"
							:index="gIndex * 10 + index"
							:style="{ '--index': gIndex * 10 + index }"
							@click="handleCardClick"
							@toggle-complete="handleToggleComplete"
							@delete="handleDeleteClick"
						/>
					</view>
				</view>
			</template>

			<!-- 空状态 - 仅当所有分组都没有内容时显示 -->
			<EmptyState v-if="!loading && !hasAnyReminders" @add="showAddModal" />

			<!-- 加载中 -->
			<view v-if="loading" class="loading-state">
				<view class="loading-spinner"></view>
				<text class="loading-text">加载中...</text>
			</view>

			<!-- 底部留白 -->
			<view class="list-bottom"></view>
		</scroll-view>

		<!-- 悬浮添加按钮 -->
		<view class="fab" @click="showAddModal">
			<view class="fab__icon"></view>
		</view>

		<!-- 添加/编辑弹窗 -->
		<ReminderModal
			:visible="modalVisible"
			:editData="editingReminder"
			@close="closeModal"
			@submit="handleSubmit"
		/>

		<!-- 删除底部操作面板 -->
		<view
			v-if="showDeleteSheet"
			class="action-sheet-mask"
			:class="{ 'action-sheet-mask--show': showDeleteSheetAnim }"
			@click="closeDeleteSheet"
		>
			<view
				class="action-sheet"
				:class="[{ 'action-sheet--show': showDeleteSheetAnim }, isDark ? 'action-sheet--dark' : '']"
				@click.stop
			>
				<!-- 操作组 -->
				<view class="action-sheet__group">
					<view class="action-sheet__header">
						<text class="action-sheet__title">删除用药提醒</text>
						<text class="action-sheet__subtitle">{{ deletingReminder ? deletingReminder.medicineName : '' }}</text>
					</view>
					<view class="action-sheet__item action-sheet__item--danger" @click="confirmDeleteSingle">
						<text class="action-sheet__item-text action-sheet__item-text--danger">删除本次</text>
					</view>
					<view class="action-sheet__item action-sheet__item--danger" @click="confirmDeleteAll">
						<text class="action-sheet__item-text action-sheet__item-text--danger-bold">删除该项所有提醒</text>
					</view>
				</view>
				<!-- 取消按钮 -->
				<view class="action-sheet__cancel" @click="closeDeleteSheet">
					<text class="action-sheet__cancel-text">取消</text>
				</view>
			</view>
		</view>

		<!-- 编辑底部操作面板 -->
		<view
			v-if="showEditSheet"
			class="action-sheet-mask"
			:class="{ 'action-sheet-mask--show': showEditSheetAnim }"
			@click="closeEditSheet"
		>
			<view
				class="action-sheet"
				:class="[{ 'action-sheet--show': showEditSheetAnim }, isDark ? 'action-sheet--dark' : '']"
				@click.stop
			>
				<view class="action-sheet__group">
					<view class="action-sheet__header">
						<text class="action-sheet__title">修改用药提醒</text>
						<text class="action-sheet__subtitle">{{ editingTarget ? editingTarget.medicineName : '' }}</text>
					</view>
					<view class="action-sheet__item" @click="confirmEditSingle">
						<text class="action-sheet__item-text action-sheet__item-text--primary">修改本次</text>
					</view>
					<view class="action-sheet__item" @click="confirmEditAll">
						<text class="action-sheet__item-text action-sheet__item-text--primary">修改该项所有提醒</text>
					</view>
				</view>
				<view class="action-sheet__cancel" @click="closeEditSheet">
					<text class="action-sheet__cancel-text">取消</text>
				</view>
			</view>
		</view>

		<!-- 顶部通知栏 -->
	  <TopNotificationBar />
	</view>
</template>

<script>
import ReminderCard from '@/components/medication/ReminderCard.vue'
import EmptyState from '@/components/medication/EmptyState.vue'
import ReminderModal from '@/components/medication/ReminderModal.vue'

import { isDarkMode } from '@/store/theme.js'
import {
	getMedicationState,
	getGroupedRemindersByDate,
	fetchReminders,
	createReminder,
	updateReminder,
	updateReminderBatch,
	deleteReminder,
	deleteReminderBatch,
	markAsCompleted,
	setEditingReminder,
	clearEditingReminder
} from '@/store/medication.js'

import TopNotificationBar from '@/components/TopNotificationBar.vue'

export default {
	components: {
		TopNotificationBar,
		ReminderCard,
		EmptyState,
		ReminderModal,
	},
	data() {
		return {
			statusBarHeight: 0,
			scrollHeight: 0,
			modalVisible: false,
			isRefreshing: false,
			deletingReminder: null,
			showDeleteSheet: false,
			showDeleteSheetAnim: false,
			showEditSheet: false,
			showEditSheetAnim: false,
			editingTarget: null,
			editMode: 'single',
			expandedGroups: {
				today: true,
				tomorrow: true,
				later: true,
				completed: false // 已完成默认收起
			}
		}
	},
	computed: {
		isDark() {
			return isDarkMode()
		},
		medicationState() {
			return getMedicationState()
		},
		loading() {
			return this.medicationState.loading
		},
		groupedReminders() {
			return getGroupedRemindersByDate()
		},
		hasAnyReminders() {
			return this.groupedReminders.some(g => g.items.length > 0)
		},
		editingReminder() {
			return this.medicationState.editingReminder
		}
	},
	onLoad() {
		// 获取状态栏高度
		const sysInfo = uni.getSystemInfoSync()
		this.statusBarHeight = sysInfo.statusBarHeight || 0

		// 计算 scroll-view 高度 = 屏幕高度 - 导航栏高度
		const headerHeight = this.statusBarHeight + 44
		this.scrollHeight = sysInfo.windowHeight - headerHeight

		// 加载数据
		this.loadData()
	},
	onShow() {
		// 页面显示时刷新数据
		if (this.medicationState.initialized) {
			this.loadData()
		}
	},
	methods: {
		async loadData() {
			await fetchReminders()
		},
		goBack() {
			uni.navigateBack()
		},
		showAddModal() {
			clearEditingReminder()
			this.modalVisible = true
		},
		closeModal() {
			this.modalVisible = false
			clearEditingReminder()
		},
		toggleGroupExpand(key) {
			this.expandedGroups[key] = !this.expandedGroups[key]
		},
		handleCardClick(id) {
			const reminder = this.medicationState.reminders.find(r => r.id === id)
			if (!reminder) return
			this.editingTarget = reminder
			this.showEditSheet = true
			this.$nextTick(() => {
				setTimeout(() => { this.showEditSheetAnim = true }, 30)
			})
		},
		closeEditSheet() {
			this.showEditSheetAnim = false
			setTimeout(() => {
				this.showEditSheet = false
				this.editingTarget = null
			}, 300)
		},
		confirmEditSingle() {
			this.editMode = 'single'
			const reminder = this.editingTarget
			this.closeEditSheet()
			setTimeout(() => {
				setEditingReminder(reminder)
				this.modalVisible = true
			}, 350)
		},
		confirmEditAll() {
			this.editMode = 'all'
			const reminder = this.editingTarget
			this.closeEditSheet()
			setTimeout(() => {
				setEditingReminder(reminder)
				this.modalVisible = true
			}, 350)
		},
		async handleToggleComplete(id, complete) {
			const result = await markAsCompleted(id)
			if (result.success) {
				uni.showToast({ title: complete ? '已完成' : '已恢复', icon: 'success' })
			} else {
				uni.showToast({ title: result.message || '操作失败', icon: 'none' })
			}
		},
		handleDeleteClick(id) {
			const reminder = this.medicationState.reminders.find(r => r.id === id)
			if (!reminder) return
			this.deletingReminder = reminder
			this.showDeleteSheet = true
			this.$nextTick(() => {
				setTimeout(() => { this.showDeleteSheetAnim = true }, 30)
			})
		},
		closeDeleteSheet() {
			this.showDeleteSheetAnim = false
			setTimeout(() => {
				this.showDeleteSheet = false
				this.deletingReminder = null
			}, 300)
		},
		async confirmDeleteSingle() {
			if (!this.deletingReminder) return
			const id = this.deletingReminder.id
			this.closeDeleteSheet()
			const result = await deleteReminder(id)
			if (result.success) {
				uni.showToast({ title: '已删除', icon: 'success' })
			}
		},
		async confirmDeleteAll() {
			if (!this.deletingReminder) return
			const name = this.deletingReminder.medicineName
			this.closeDeleteSheet()
			const allIds = this.medicationState.reminders
				.filter(r => r.medicineName === name)
				.map(r => r.id)
			const result = await deleteReminderBatch(allIds)
			if (result.success) {
				uni.showToast({ title: '已删除全部', icon: 'success' })
			}
		},
		async handleSubmit(formData) {
			if (this.editingReminder) {
				if (this.editMode === 'all') {
					// 批量修改同名药物的所有提醒，保留各自原始日期只替换时间
					const name = this.editingReminder.medicineName
					const newTime = formData.scheduledTime ? formData.scheduledTime.split('T')[1] : null
					const entries = this.medicationState.reminders
						.filter(r => r.medicineName === name)
						.map(r => {
							const perData = { ...formData }
							if (newTime && r.scheduledTime) {
								const originalDate = r.scheduledTime.split('T')[0]
								perData.scheduledTime = `${originalDate}T${newTime}`
							}
							return { id: r.agendaId, data: perData }
						})
					const result = await updateReminderBatch(entries)
					if (result.success) {
						uni.showToast({ title: '已修改全部', icon: 'success' })
					} else {
						uni.showToast({ title: result.message || '修改失败', icon: 'none' })
					}
				} else {
					const result = await updateReminder(this.editingReminder.agendaId, formData)
					if (result.success) {
						uni.showToast({ title: '保存成功', icon: 'success' })
					} else {
						uni.showToast({ title: result.message || '修改失败', icon: 'none' })
					}
				}
				this.editMode = 'single'
			} else {
				const result = await createReminder(formData)
				if (result.success) {
					uni.showToast({ title: '添加成功', icon: 'success' })
				}
			}
		},
		async onRefresh() {
			this.isRefreshing = true
			await this.loadData()
			this.isRefreshing = false
		}
	}
}
</script>

<style lang="scss" scoped>
.page {
	min-height: 100vh;
	position: relative;

	&--dark {
		.page-bg {
			background: $dark-bg-base;
		}

		.fixed-header {
			background: $dark-bg-base;
		}

		.navbar__title {
			color: $dark-text-primary;
		}

		.back-icon {
			border-color: $dark-text-primary;
		}

		.add-icon::before,
		.add-icon::after {
			background: #10B981;
		}

		.date-group__title {
			color: $dark-text-primary;
		}

		.date-group__arrow {
			border-color: $dark-text-muted;
		}

		.loading-text {
			color: $dark-text-secondary;
		}
	}
}

// 简洁背景
.page-bg {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: #F5F6FA;
	z-index: -1;
}

// 固定头部
.fixed-header {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	z-index: 100;
	background: #F5F6FA;
}

// 头部占位
.header-placeholder {
	width: 100%;
}

// 导航栏
.navbar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	height: 88rpx;
	padding: 0 $spacing-md;
	position: relative;

	&__back,
	&__action {
		width: 72rpx;
		height: 72rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	&__title {
		font-size: $font-size-xl;
		font-weight: $font-weight-semibold;
		color: $text-primary;
	}
}

// 返回图标
.back-icon {
	width: 20rpx;
	height: 20rpx;
	border-left: 4rpx solid $text-primary;
	border-bottom: 4rpx solid $text-primary;
	transform: rotate(45deg);
}

// 添加图标
.add-icon {
	width: 28rpx;
	height: 28rpx;
	position: relative;

	&::before,
	&::after {
		content: '';
		position: absolute;
		background: #10B981;
		border-radius: 2rpx;
	}

	&::before {
		top: 50%;
		left: 0;
		right: 0;
		height: 4rpx;
		transform: translateY(-50%);
	}

	&::after {
		left: 50%;
		top: 0;
		bottom: 0;
		width: 4rpx;
		transform: translateX(-50%);
	}
}

// 提醒列表
.reminder-list {
	flex: 1;
	position: relative;
	z-index: 5;
}

// 日期分组
.date-group {
	margin-bottom: $spacing-sm;

	&__header {
		display: flex;
		align-items: center;
		padding: $spacing-md $spacing-lg;
		cursor: pointer;
	}

	&__title {
		font-size: $font-size-base;
		font-weight: $font-weight-semibold;
		color: $text-primary;
	}

	&__arrow {
		width: 16rpx;
		height: 16rpx;
		border-right: 3rpx solid $text-muted;
		border-bottom: 3rpx solid $text-muted;
		transform: rotate(45deg);
		margin-left: auto;
		transition: transform 0.3s ease;

		&--expanded {
			transform: rotate(-135deg);
		}
	}

	&__list {
		overflow: hidden;
		transition: max-height 0.3s ease, opacity 0.3s ease;

		&--collapsed {
			max-height: 0;
			opacity: 0;
		}
	}
}

// 加载状态
.loading-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: $spacing-2xl;
}

.loading-spinner {
	width: 48rpx;
	height: 48rpx;
	border: 4rpx solid rgba(16, 185, 129, 0.2);
	border-top-color: #10B981;
	border-radius: 50%;
	animation: spin 0.8s linear infinite;
	margin-bottom: $spacing-md;
}

.loading-text {
	font-size: $font-size-sm;
	color: $text-secondary;
}

// 底部留白
.list-bottom {
	height: calc(200rpx + env(safe-area-inset-bottom));
}

// 悬浮按钮
.fab {
	position: fixed;
	right: $spacing-lg;
	bottom: calc(120rpx + env(safe-area-inset-bottom));
	width: 112rpx;
	height: 112rpx;
	background: #10B981;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 8rpx 24rpx rgba(16, 185, 129, 0.35);
	z-index: 100;
	animation: fab-scale-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s backwards;
	transition: transform 0.2s ease, box-shadow 0.2s ease;

	&:active {
		transform: scale(0.92);
		box-shadow: 0 4rpx 12rpx rgba(16, 185, 129, 0.25);
	}

	&__icon {
		width: 32rpx;
		height: 32rpx;
		position: relative;

		&::before,
		&::after {
			content: '';
			position: absolute;
			background: #fff;
			border-radius: 2rpx;
		}

		&::before {
			top: 50%;
			left: 0;
			right: 0;
			height: 4rpx;
			transform: translateY(-50%);
		}

		&::after {
			left: 50%;
			top: 0;
			bottom: 0;
			width: 4rpx;
			transform: translateX(-50%);
		}
	}
}

// 动画
@keyframes spin {
	to { transform: rotate(360deg); }
}

@keyframes fab-scale-in {
	from {
		opacity: 0;
		transform: scale(0);
	}
	to {
		opacity: 1;
		transform: scale(1);
	}
}

// ===== 底部操作面板（iOS Action Sheet 风格） =====
.action-sheet-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0);
	z-index: 10000;
	transition: background 0.35s ease;

	&--show {
		background: rgba(30, 58, 95, 0.35);
		backdrop-filter: blur(16px) saturate(180%);
		-webkit-backdrop-filter: blur(16px) saturate(180%);
	}
}

.action-sheet {
	position: absolute;
	left: 16rpx;
	right: 16rpx;
	bottom: 0;
	padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
	transform: translateY(100%);
	transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);

	&--show {
		transform: translateY(0);
	}

	// 操作组卡片
	&__group {
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(40px) saturate(200%);
		-webkit-backdrop-filter: blur(40px) saturate(200%);
		border-radius: $radius-lg;
		overflow: hidden;
		margin-bottom: 16rpx;
	}

	// 标题区域
	&__header {
		padding: $spacing-md $spacing-lg;
		text-align: center;
		border-bottom: 1rpx solid rgba(0, 0, 0, 0.06);
	}

	&__title {
		display: block;
		font-size: $font-size-sm;
		font-weight: $font-weight-semibold;
		color: $text-secondary;
		margin-bottom: 4rpx;
	}

	&__subtitle {
		display: block;
		font-size: $font-size-xs;
		color: $text-muted;
		line-height: $line-height-normal;
	}

	// 操作项
	&__item {
		height: 112rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		transition: background 0.15s ease;

		&::after {
			content: '';
			position: absolute;
			left: 0;
			right: 0;
			bottom: 0;
			height: 1rpx;
			background: rgba(0, 0, 0, 0.06);
		}

		&:last-child::after {
			display: none;
		}

		&:active {
			background: rgba(0, 0, 0, 0.04);
		}
	}

	&__item-text {
		font-size: $font-size-lg;

		&--danger {
			color: $color-error;
			font-weight: $font-weight-semibold;
		}

		&--danger-bold {
			color: $color-error;
			font-weight: $font-weight-semibold;
		}

		&--primary {
			color: $color-primary;
			font-weight: $font-weight-semibold;
		}
	}

	// 取消按钮 - 独立卡片
	&__cancel {
		height: 112rpx;
		background: rgba(255, 255, 255, 0.98);
		backdrop-filter: blur(40px) saturate(200%);
		-webkit-backdrop-filter: blur(40px) saturate(200%);
		border-radius: $radius-lg;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.15s ease;

		&:active {
			background: rgba(240, 240, 240, 0.98);
		}
	}

	&__cancel-text {
		font-size: $font-size-lg;
		font-weight: $font-weight-semibold;
		color: $color-primary;
	}

	// ===== 深色模式 =====
	&--dark {
		.action-sheet__group {
			background: rgba(30, 35, 42, 0.92);
			backdrop-filter: blur(40px) saturate(160%);
			-webkit-backdrop-filter: blur(40px) saturate(160%);
		}

		.action-sheet__header {
			border-bottom-color: rgba(255, 255, 255, 0.06);
		}

		.action-sheet__title {
			color: $dark-text-secondary;
		}

		.action-sheet__subtitle {
			color: $dark-text-muted;
		}

		.action-sheet__item {
			&::after {
				background: rgba(255, 255, 255, 0.06);
			}

			&:active {
				background: rgba(255, 255, 255, 0.04);
			}
		}

		.action-sheet__item-text {
			&--danger {
				color: $dark-color-accent;
			}

			&--danger-bold {
				color: $dark-color-accent;
			}

			&--primary {
				color: $dark-color-primary;
			}
		}

		.action-sheet__cancel {
			background: rgba(30, 35, 42, 0.95);
			backdrop-filter: blur(40px) saturate(160%);
			-webkit-backdrop-filter: blur(40px) saturate(160%);

			&:active {
				background: rgba(40, 45, 52, 0.95);
			}
		}

		.action-sheet__cancel-text {
			color: $dark-color-primary;
		}
	}
}

// 深色模式蒙层
.action-sheet-mask--show {
	.page--dark & {
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(20px) saturate(150%);
		-webkit-backdrop-filter: blur(20px) saturate(150%);
	}
}
</style>
