<template>
	<view class="page" :class="{ 'page--dark': isDark }">
		<!-- 氛围背景 -->
		<view class="atmosphere-bg">
			<view class="pulse-orb pulse-orb--1"></view>
			<view class="pulse-orb pulse-orb--2"></view>
			<view class="pulse-orb pulse-orb--3"></view>
		</view>

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

			<!-- 统计卡片 -->
			<StatsCard
				:total="todayStats.total"
				:completed="todayStats.completed"
				:nextReminder="todayStats.nextReminder"
				:countdown="nextCountdown"
			/>
		</view>

		<!-- 头部占位 -->
		<view class="header-placeholder" :style="{ height: (statusBarHeight + 44 + 150) + 'px' }"></view>

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
					class="time-group"
				>
					<!-- 时间分组标题 -->
					<view class="time-group__header">
						<view class="time-group__icon" :class="[`time-group__icon--${group.icon}`]">
							<view class="time-icon-inner" :class="[`time-icon-inner--${group.icon}`]"></view>
						</view>
						<text class="time-group__title">{{ group.label }}</text>
						<text class="time-group__count">{{ group.items.length }}项</text>
					</view>

					<!-- 提醒卡片列表 -->
					<ReminderCard
						v-for="(item, index) in group.items"
						:key="item.id"
						:id="item.id"
						:medicineName="item.medicineName"
						:medicineSpec="item.medicineSpec"
						:dosage="item.dosage"
						:medicineType="item.medicineType"
						:frequency="item.frequency"
						:scheduledTime="item.scheduledTime"
						:status="item.status"
						:enabled="item.enabled"
						:index="gIndex * 10 + index"
						:style="{ '--index': gIndex * 10 + index }"
						@click="handleCardClick"
						@toggle-complete="handleToggleComplete"
						@delete="handleDeleteClick"
					/>
				</view>
			</template>

			<!-- 空状态 -->
			<EmptyState v-else-if="!loading" @add="showAddModal" />

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
			<view class="fab__pulse"></view>
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
import StatsCard from '@/components/medication/StatsCard.vue'
import ReminderCard from '@/components/medication/ReminderCard.vue'
import EmptyState from '@/components/medication/EmptyState.vue'
import ReminderModal from '@/components/medication/ReminderModal.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import TopNotificationBar from '@/components/TopNotificationBar.vue'

import { isDarkMode } from '@/store/theme.js'
import {
	getMedicationState,
	getGroupedReminders,
	getNextReminderCountdown,
	fetchReminders,
	createReminder,
	updateReminder,
	deleteReminder,
	markAsCompleted,
	unmarkCompleted,
	setEditingReminder,
	clearEditingReminder
} from '@/store/medication.js'

export default {
	components: {
		StatsCard,
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
			countdownTimer: null
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
		todayStats() {
			return this.medicationState.todayStats
		},
		groupedReminders() {
			return getGroupedReminders()
		},
		editingReminder() {
			return this.medicationState.editingReminder
		},
		nextCountdown() {
			return getNextReminderCountdown()
		}
	},
	onLoad() {
		// 获取状态栏高度
		const sysInfo = uni.getSystemInfoSync()
		this.statusBarHeight = sysInfo.statusBarHeight || 0

		// 计算 scroll-view 高度 = 屏幕高度 - 头部占位高度
		const headerHeight = this.statusBarHeight + 44 + 150 // navbar(44) + stats card(150)
		this.scrollHeight = sysInfo.windowHeight - headerHeight

		// 加载数据
		this.loadData()

		// 启动倒计时更新
		this.startCountdownTimer()
	},
	onUnload() {
		this.stopCountdownTimer()
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
				}
			} else {
				const result = await unmarkCompleted(id)
				if (result.success) {
					uni.showToast({ title: '已取消', icon: 'none' })
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
				// 编辑模式
				const result = await updateReminder(this.editingReminder.id, formData)
				if (result.success) {
					uni.showToast({ title: '保存成功', icon: 'success' })
				}
			} else {
				// 新增模式
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
		},
		startCountdownTimer() {
			this.countdownTimer = setInterval(() => {
				// 强制更新倒计时显示
				this.$forceUpdate()
			}, 60000) // 每分钟更新一次
		},
		stopCountdownTimer() {
			if (this.countdownTimer) {
				clearInterval(this.countdownTimer)
				this.countdownTimer = null
			}
		}
	}
}
</script>

<style lang="scss" scoped>
.page {
	min-height: 100vh;
	background: $bg-base;
	position: relative;

	&--dark {
		background: $dark-bg-base;

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

		.time-group__title {
			color: $dark-text-primary;
		}

		.time-group__count {
			color: $dark-text-muted;
		}

		.loading-text {
			color: $dark-text-secondary;
		}
	}
}

// 氛围背景
.atmosphere-bg {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: linear-gradient(
		165deg,
		#E6F9F3 0%,
		#F0FDF9 30%,
		$bg-base 60%,
		#F0F5FA 100%
	);
	overflow: hidden;
	z-index: 0;
	animation: bg-fade-in 0.6s ease-out;

	.page--dark & {
		background: linear-gradient(
			165deg,
			rgba(16, 185, 129, 0.08) 0%,
			$dark-bg-base 40%,
			$dark-bg-base 100%
		);
	}
}

// 脉动光晕
.pulse-orb {
	position: absolute;
	border-radius: 50%;
	filter: blur(60rpx);
	animation: orb-pulse 4s ease-in-out infinite;

	&--1 {
		width: 300rpx;
		height: 300rpx;
		top: -100rpx;
		right: -80rpx;
		background: radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%);
		animation-delay: 0s;
	}

	&--2 {
		width: 200rpx;
		height: 200rpx;
		top: 40%;
		left: -60rpx;
		background: radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%);
		animation-delay: -1.5s;
	}

	&--3 {
		width: 250rpx;
		height: 250rpx;
		bottom: 20%;
		right: -40rpx;
		background: radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%);
		animation-delay: -3s;
	}
}

// 固定头部
.fixed-header {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	z-index: 100;
	background: linear-gradient(
		165deg,
		#E6F9F3 0%,
		#F0FDF9 30%,
		$bg-base 100%
	);

	.page--dark & {
		background: linear-gradient(
			165deg,
			rgba(16, 185, 129, 0.08) 0%,
			$dark-bg-base 40%,
			$dark-bg-base 100%
		);
	}
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

// 时间分组
.time-group {
	margin-top: $spacing-md;

	&:first-child {
		margin-top: $spacing-xs;
	}

	&__header {
		display: flex;
		align-items: center;
		padding: $spacing-sm $spacing-lg;
	}

	&__icon {
		width: 40rpx;
		height: 40rpx;
		border-radius: 50%;
		margin-right: $spacing-sm;
		display: flex;
		align-items: center;
		justify-content: center;

		&--morning { background: linear-gradient(135deg, #FCD34D 0%, #FBBF24 100%); }
		&--noon { background: linear-gradient(135deg, #FB923C 0%, #F97316 100%); }
		&--evening { background: linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%); }
		&--night { background: linear-gradient(135deg, #64748B 0%, #475569 100%); }
	}

	&__title {
		font-size: $font-size-base;
		font-weight: $font-weight-semibold;
		color: $text-primary;
	}

	&__count {
		font-size: $font-size-sm;
		color: $text-muted;
		margin-left: $spacing-sm;
	}
}

// 时间图标内部
.time-icon-inner {
	width: 16rpx;
	height: 16rpx;

	&--morning {
		background: #fff;
		border-radius: 50%;
		box-shadow: 0 0 8rpx rgba(255, 255, 255, 0.5);
	}

	&--noon {
		background: #fff;
		border-radius: 50%;
	}

	&--evening {
		width: 12rpx;
		height: 12rpx;
		border: 2rpx solid #fff;
		border-radius: 50%;
		border-right-color: transparent;
		border-bottom-color: transparent;
		transform: rotate(-45deg);
	}

	&--night {
		width: 12rpx;
		height: 12rpx;
		border: 2rpx solid #fff;
		border-radius: 50%;
		position: relative;

		&::after {
			content: '';
			position: absolute;
			top: -2rpx;
			right: -4rpx;
			width: 10rpx;
			height: 10rpx;
			background: linear-gradient(135deg, #64748B 0%, #475569 100%);
			border-radius: 50%;
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
	bottom: calc(140rpx + env(safe-area-inset-bottom) + $spacing-lg);
	width: 112rpx;
	height: 112rpx;
	background: linear-gradient(135deg, #0F766E 0%, #10B981 50%, #34D399 100%);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow:
		0 8rpx 32rpx rgba(16, 185, 129, 0.35),
		0 4rpx 12rpx rgba(16, 185, 129, 0.25);
	z-index: 100;
	animation: fab-bounce-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s backwards;
	transition: transform 0.2s ease, box-shadow 0.2s ease;

	&:active {
		transform: scale(0.9);
		box-shadow:
			0 4rpx 16rpx rgba(16, 185, 129, 0.25),
			0 2rpx 6rpx rgba(16, 185, 129, 0.2);
	}

	&__pulse {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		border-radius: 50%;
		border: 2rpx solid rgba(16, 185, 129, 0.5);
		animation: fab-pulse 2s ease-out infinite;
	}

	&__icon {
		width: 40rpx;
		height: 40rpx;
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
@keyframes bg-fade-in {
	from { opacity: 0; }
	to { opacity: 1; }
}

@keyframes orb-pulse {
	0%, 100% {
		transform: scale(1);
		opacity: 0.6;
	}
	50% {
		transform: scale(1.2);
		opacity: 1;
	}
}


@keyframes fab-bounce-in {
	from {
		opacity: 0;
		transform: scale(0);
	}
	60% {
		transform: scale(1.2);
	}
	to {
		opacity: 1;
		transform: scale(1);
	}
}

@keyframes fab-pulse {
	0% {
		transform: scale(1);
		opacity: 0.8;
	}
	100% {
		transform: scale(1.5);
		opacity: 0;
	}
}

@keyframes spin {
	to { transform: rotate(360deg); }
}
</style>
