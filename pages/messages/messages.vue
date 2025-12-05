<template>
	<view class="page" :class="{ 'page--dark': isDark }">
		<!-- 状态栏占位 -->
		<view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>

		<!-- 顶部导航栏 -->
		<view class="navbar">
			<text class="navbar__title">消息</text>
			<view v-if="hasUnread" class="navbar__action" @click="handleMarkAllRead">
				<text class="navbar__action-text">全部已读</text>
			</view>
		</view>

		<!-- 标签切换 -->
		<view class="tabs">
			<view
				v-for="(tab, index) in tabs"
				:key="index"
				class="tab-item"
				:class="{ 'tab-item--active': currentTab === index }"
				@click="switchTab(index)"
			>
				<text class="tab-item__text">{{ tab.name }}</text>
				<view v-if="tab.count > 0" class="tab-item__badge">{{ tab.count > 99 ? '99+' : tab.count }}</view>
				<view v-if="currentTab === index" class="tab-item__indicator"></view>
			</view>
		</view>

		<!-- 消息列表 -->
		<scroll-view
			class="content"
			scroll-y
			:refresher-enabled="true"
			:refresher-triggered="isRefreshing"
			@refresherrefresh="onRefresh"
			@scrolltolower="onLoadMore"
		>
			<view v-if="loading && messages.length === 0" class="loading">
				<view class="loading__spinner"></view>
				<text class="loading__text">加载中...</text>
			</view>

			<view v-else-if="messages.length === 0" class="empty">
				<view class="empty__icon"></view>
				<text class="empty__text">暂无消息</text>
			</view>

			<view v-else class="messages">
				<view
					v-for="(msg, index) in messages"
					:key="msg.id"
					class="message-item"
					@click="openMessage(msg)"
				>
					<view class="message-item__avatar" :class="[`message-item__avatar--${getTypeClass(msg.reminderType)}`]">
						<view v-if="msg.reminderType === 'SYSTEM'" class="avatar-icon avatar-icon--system"></view>
						<view v-else-if="msg.reminderType === 'RESERVE'" class="avatar-icon avatar-icon--reserve"></view>
						<view v-else class="avatar-icon avatar-icon--medication"></view>
					</view>
					<view class="message-item__content">
						<view class="message-item__header">
							<text class="message-item__title">{{ msg.reminderTitle }}</text>
							<text class="message-item__time">{{ formatTime(msg.sentTime) }}</text>
						</view>
						<text class="message-item__desc">{{ msg.reminderContent }}</text>
					</view>
					<view v-if="msg.status === 'UNREAD'" class="message-item__badge"></view>
				</view>

				<!-- 加载更多 -->
				<view v-if="hasMore" class="load-more">
					<text class="load-more__text">{{ loadingMore ? '加载中...' : '上拉加载更多' }}</text>
				</view>
				<view v-else-if="messages.length > 0" class="load-more">
					<text class="load-more__text">没有更多了</text>
				</view>
			</view>

			<!-- 底部占位 -->
			<view class="tabbar-placeholder"></view>
		</scroll-view>

		<!-- 底部导航 -->
		<TabBar />
	</view>
</template>

<script>
import TabBar from '@/components/TabBar.vue'
import { isDarkMode } from '@/store/theme.js'
import {
	notificationState,
	fetchUnreadNotifications,
	markAsRead,
	markAllAsRead,
	getAllUnreadNotifications,
	getUnreadByType,
	getUnreadCount,
	getUnreadCountByType
} from '@/store/notification.js'
import { getReadNotifications } from '@/utils/api/notification.js'

export default {
	components: {
		TabBar
	},
	data() {
		return {
			statusBarHeight: 44,
			currentTab: 0,
			loading: false,
			isRefreshing: false,
			loadingMore: false,
			// 已读消息分页
			readMessages: [],
			pageNum: 1,
			pageSize: 10,
			hasMore: true,
			total: 0
		}
	},
	computed: {
		isDark() {
			return isDarkMode()
		},
		tabs() {
			return [
				{ name: '全部', type: null, count: getUnreadCount() },
				{ name: '系统通知', type: 'SYSTEM', count: getUnreadCountByType('SYSTEM') },
				{ name: '预约提醒', type: 'RESERVE', count: getUnreadCountByType('RESERVE') },
				{ name: '用药提醒', type: 'MEDICATION', count: getUnreadCountByType('MEDICATION') }
			]
		},
		hasUnread() {
			return getUnreadCount() > 0
		},
		// 根据当前标签获取消息列表
		messages() {
			const tab = this.tabs[this.currentTab]
			let unreadList = []

			if (tab.type === null) {
				// 全部
				unreadList = getAllUnreadNotifications()
			} else {
				unreadList = getUnreadByType(tab.type)
			}

			// 合并已读消息
			const filteredRead = tab.type === null
				? this.readMessages
				: this.readMessages.filter(m => m.reminderType === tab.type)

			return [...unreadList, ...filteredRead]
		}
	},
	onLoad() {
		this.getStatusBarHeight()
		this.loadData()
		// 监听新通知到达事件
		uni.$on('notification-received', this.onNotificationReceived)
	},
	onUnload() {
		// 移除事件监听
		uni.$off('notification-received', this.onNotificationReceived)
	},
	onShow() {
		// #ifdef APP-PLUS
		uni.hideTabBar({ animation: false })
		// #endif
		// 页面显示时刷新数据
		this.refreshUnread()
	},
	methods: {
		// 收到新通知时的处理
		onNotificationReceived(notification) {
			console.log('消息页面收到新通知事件:', notification)
			// 自动刷新列表
			this.refreshUnread()
		},

		getStatusBarHeight() {
			const sysInfo = uni.getSystemInfoSync()
			this.statusBarHeight = sysInfo.statusBarHeight || 44
		},

		// 加载数据
		async loadData() {
			this.loading = true
			try {
				await this.refreshUnread()
			} finally {
				this.loading = false
			}
		},

		// 刷新未读通知
		async refreshUnread() {
			await fetchUnreadNotifications()
		},

		// 下拉刷新
		async onRefresh() {
			this.isRefreshing = true
			try {
				await this.refreshUnread()
				// 重置已读分页
				this.pageNum = 1
				this.readMessages = []
				this.hasMore = true
			} finally {
				this.isRefreshing = false
			}
		},

		// 加载更多已读消息
		async onLoadMore() {
			if (this.loadingMore || !this.hasMore) return

			const tab = this.tabs[this.currentTab]
			// 只有选择了具体类型时才加载已读消息
			if (tab.type === null) {
				this.hasMore = false
				return
			}

			this.loadingMore = true
			try {
				const res = await getReadNotifications(tab.type, this.pageNum, this.pageSize)
				if (res.code === 200) {
					const list = res.data || []
					this.readMessages = [...this.readMessages, ...list]
					this.total = res.total || 0
					this.hasMore = this.readMessages.length < this.total
					if (list.length > 0) {
						this.pageNum++
					}
				}
			} catch (err) {
				console.error('加载已读消息失败:', err)
			} finally {
				this.loadingMore = false
			}
		},

		switchTab(index) {
			if (this.currentTab === index) return
			this.currentTab = index
			// 切换标签时重置已读分页
			this.pageNum = 1
			this.readMessages = []
			this.hasMore = true
		},

		// 点击消息
		async openMessage(msg) {
			// 如果是未读，标记为已读
			if (msg.status === 'UNREAD') {
				const success = await markAsRead(msg.id)
				if (success) {
					msg.status = 'READ'
				}
			}

			// 根据消息类型跳转
			if (msg.reminderType === 'RESERVE' && msg.appointmentId) {
				// 跳转到预约详情
				uni.navigateTo({
					url: `/pages/profile/medical-records?appointmentId=${msg.appointmentId}`
				})
			} else if (msg.reminderType === 'MEDICATION' && msg.prescriptionId) {
				// 跳转到处方详情
				uni.navigateTo({
					url: `/pages/profile/medical-records?prescriptionId=${msg.prescriptionId}`
				})
			} else {
				// 显示消息详情弹窗
				uni.showModal({
					title: msg.reminderTitle,
					content: msg.reminderContent,
					showCancel: false,
					confirmText: '知道了'
				})
			}
		},

		// 全部标记已读
		async handleMarkAllRead() {
			uni.showLoading({ title: '处理中...' })
			try {
				const success = await markAllAsRead()
				if (success) {
					uni.showToast({ title: '已全部标记为已读', icon: 'success' })
				}
			} finally {
				uni.hideLoading()
			}
		},

		// 获取类型对应的CSS类
		getTypeClass(type) {
			const map = {
				'SYSTEM': 'system',
				'RESERVE': 'reserve',
				'MEDICATION': 'medication'
			}
			return map[type] || 'system'
		},

		// 格式化时间
		formatTime(timeStr) {
			if (!timeStr) return ''

			const date = new Date(timeStr)
			const now = new Date()
			const diff = now - date

			// 今天
			if (date.toDateString() === now.toDateString()) {
				return `今天 ${this.padZero(date.getHours())}:${this.padZero(date.getMinutes())}`
			}

			// 昨天
			const yesterday = new Date(now)
			yesterday.setDate(yesterday.getDate() - 1)
			if (date.toDateString() === yesterday.toDateString()) {
				return `昨天 ${this.padZero(date.getHours())}:${this.padZero(date.getMinutes())}`
			}

			// 7天内
			if (diff < 7 * 24 * 60 * 60 * 1000) {
				return `${Math.floor(diff / (24 * 60 * 60 * 1000))}天前`
			}

			// 更早
			return `${date.getMonth() + 1}/${date.getDate()}`
		},

		padZero(num) {
			return num < 10 ? '0' + num : num
		}
	}
}
</script>

<style lang="scss" scoped>
.page {
	min-height: 100vh;
	background: $bg-base;
	display: flex;
	flex-direction: column;

	&--dark {
		background: $dark-bg-base;
	}
}

.status-bar {
	flex-shrink: 0;
}

.navbar {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 88rpx;
	padding: 0 $spacing-lg;
	flex-shrink: 0;
	position: relative;

	&__title {
		font-size: $font-size-lg;
		font-weight: $font-weight-semibold;
		color: $text-primary;
	}

	&__action {
		position: absolute;
		right: $spacing-lg;
		padding: $spacing-xs $spacing-md;
	}

	&__action-text {
		font-size: $font-size-sm;
		color: $color-primary;
	}
}

.tabs {
	display: flex;
	padding: $spacing-md $spacing-lg;
	border-bottom: 1rpx solid $border-color-light;
	flex-shrink: 0;
}

.tab-item {
	position: relative;
	padding: $spacing-sm $spacing-md;
	margin-right: $spacing-md;
	display: flex;
	align-items: center;

	&__text {
		font-size: $font-size-base;
		color: $text-secondary;
		transition: color 0.25s ease;
	}

	&__badge {
		min-width: 32rpx;
		height: 32rpx;
		line-height: 32rpx;
		padding: 0 8rpx;
		margin-left: 8rpx;
		background: $color-accent;
		border-radius: 16rpx;
		font-size: 20rpx;
		color: #fff;
		text-align: center;
	}

	&--active .tab-item__text {
		color: $color-primary;
		font-weight: $font-weight-semibold;
	}

	&__indicator {
		position: absolute;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 40rpx;
		height: 6rpx;
		background: $color-primary;
		border-radius: 3rpx;
	}
}

.content {
	flex: 1;
	overflow: hidden;
}

.loading {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: $spacing-2xl;

	&__spinner {
		width: 60rpx;
		height: 60rpx;
		border: 4rpx solid $border-color-light;
		border-top-color: $color-primary;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: $spacing-md;
	}

	&__text {
		font-size: $font-size-sm;
		color: $text-muted;
	}
}

@keyframes spin {
	to { transform: rotate(360deg); }
}

.empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: $spacing-2xl;

	&__icon {
		width: 120rpx;
		height: 120rpx;
		background: $bg-elevated;
		border-radius: 50%;
		margin-bottom: $spacing-lg;
		position: relative;

		&::before {
			content: '';
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			width: 60rpx;
			height: 48rpx;
			border: 4rpx solid $text-muted;
			border-radius: 8rpx;
		}
	}

	&__text {
		font-size: $font-size-base;
		color: $text-muted;
	}
}

.messages {
	padding: $spacing-md $spacing-lg;
}

.message-item {
	display: flex;
	align-items: flex-start;
	padding: $spacing-lg;
	background: $bg-card;
	border-radius: $radius-lg;
	box-shadow: $shadow-sm;
	margin-bottom: $spacing-md;
	position: relative;

	&__avatar {
		width: 88rpx;
		height: 88rpx;
		border-radius: $radius-md;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		margin-right: $spacing-md;

		&--system {
			background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.2) 100%);
		}
		&--reserve {
			background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.2) 100%);
		}
		&--medication {
			background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.2) 100%);
		}
	}

	&__content {
		flex: 1;
		min-width: 0;
	}

	&__header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: $spacing-xs;
	}

	&__title {
		font-size: $font-size-base;
		font-weight: $font-weight-medium;
		color: $text-primary;
	}

	&__time {
		font-size: $font-size-xs;
		color: $text-muted;
		flex-shrink: 0;
	}

	&__desc {
		font-size: $font-size-sm;
		color: $text-secondary;
		line-height: $line-height-normal;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	&__badge {
		position: absolute;
		top: $spacing-lg;
		right: $spacing-lg;
		width: 16rpx;
		height: 16rpx;
		background: $color-accent;
		border-radius: 50%;
	}
}

.avatar-icon {
	width: 40rpx;
	height: 40rpx;
	position: relative;

	&--system {
		border: 3rpx solid $color-info;
		border-radius: 50%;

		&::before {
			content: '';
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			width: 4rpx;
			height: 16rpx;
			background: $color-info;
		}
		&::after {
			content: '';
			position: absolute;
			bottom: 8rpx;
			left: 50%;
			transform: translateX(-50%);
			width: 4rpx;
			height: 4rpx;
			background: $color-info;
			border-radius: 50%;
		}
	}

	&--reserve {
		width: 44rpx;
		height: 44rpx;
		border: 3rpx solid $color-success;
		border-radius: 6rpx;

		&::before {
			content: '';
			position: absolute;
			top: 12rpx;
			left: 0;
			right: 0;
			height: 2rpx;
			background: $color-success;
		}

		&::after {
			content: '';
			position: absolute;
			top: 20rpx;
			left: 8rpx;
			width: 8rpx;
			height: 8rpx;
			background: $color-success;
			border-radius: 2rpx;
		}
	}

	&--medication {
		width: 36rpx;
		height: 44rpx;
		border: 3rpx solid $color-warning;
		border-radius: 8rpx 8rpx 4rpx 4rpx;
		position: relative;

		&::before {
			content: '';
			position: absolute;
			top: -6rpx;
			left: 50%;
			transform: translateX(-50%);
			width: 16rpx;
			height: 6rpx;
			background: $color-warning;
			border-radius: 3rpx 3rpx 0 0;
		}

		&::after {
			content: '+';
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			font-size: 24rpx;
			color: $color-warning;
			font-weight: bold;
		}
	}
}

.load-more {
	padding: $spacing-lg;
	text-align: center;

	&__text {
		font-size: $font-size-sm;
		color: $text-muted;
	}
}

.tabbar-placeholder {
	height: calc(140rpx + env(safe-area-inset-bottom));
}

// 深色模式
.page--dark {
	.navbar__title { color: $dark-text-primary; }
	.navbar__action-text { color: $dark-color-primary; }

	.tabs { border-bottom-color: $dark-border-color; }
	.tab-item__text { color: $dark-text-secondary; }
	.tab-item--active .tab-item__text { color: $dark-color-primary; }
	.tab-item__indicator { background: $dark-color-primary; }

	.loading__spinner { border-color: $dark-border-color; border-top-color: $dark-color-primary; }
	.loading__text { color: $dark-text-muted; }

	.empty__icon { background: $dark-bg-elevated; }
	.empty__icon::before { border-color: $dark-text-muted; }
	.empty__text { color: $dark-text-muted; }

	.message-item {
		background: $dark-bg-card;
		&__title { color: $dark-text-primary; }
		&__time { color: $dark-text-muted; }
		&__desc { color: $dark-text-secondary; }
	}

	.load-more__text { color: $dark-text-muted; }
}
</style>
