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

		<!-- 删除确认弹窗 -->
		<ConfirmDialog
			ref="confirmDialog"
			title="删除用药提醒"
			content="确定要删除这条用药提醒吗？删除后无法恢复。"
			confirmText="删除"
			icon="warning"
			@confirm="confirmDelete"
		/>

		<!-- 顶部通知栏 -->
		<TopNotificationBar />
	</view>
</template>

<script>
import ReminderCard from '@/components/medication/ReminderCard.vue'
import EmptyState from '@/components/medication/EmptyState.vue'
import ReminderModal from '@/components/medication/ReminderModal.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import TopNotificationBar from '@/components/TopNotificationBar.vue'

import { isDarkMode } from '@/store/theme.js'
import {
	getMedicationState,
	getGroupedRemindersByDate,
	fetchReminders,
	createReminder,
	updateReminder,
	deleteReminder,
	markAsCompleted,
	setEditingReminder,
	clearEditingReminder
} from '@/store/medication.js'

export default {
	components: {
		ReminderCard,
		EmptyState,
		ReminderModal,
		ConfirmDialog,
		TopNotificationBar
	},
	data() {
		return {
			statusBarHeight: 0,
			scrollHeight: 0,
			modalVisible: false,
			isRefreshing: false,
			deletingId: null,
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
			if (reminder) {
				setEditingReminder(reminder)
				this.modalVisible = true
			}
		},
		async handleToggleComplete(id, complete) {
			if (complete) {
				const result = await markAsCompleted(id)
				if (result.success) {
					uni.showToast({ title: '已完成', icon: 'success' })
				} else {
					uni.showToast({ title: result.message || '操作失败', icon: 'none' })
				}
			}
		},
		handleDeleteClick(id) {
			this.deletingId = id
			this.$refs.confirmDialog.show()
		},
		async confirmDelete() {
			if (this.deletingId) {
				const result = await deleteReminder(this.deletingId)
				if (result.success) {
					uni.showToast({ title: '已删除', icon: 'success' })
				}
				this.deletingId = null
			}
		},
		async handleSubmit(formData) {
			if (this.editingReminder) {
				const result = await updateReminder(this.editingReminder.id, formData)
				if (result.success) {
					uni.showToast({ title: '保存成功', icon: 'success' })
				}
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
</style>
