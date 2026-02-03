<template>
	<view class="page" :class="{ 'page--dark': isDark }">
		<!-- 状态栏占位 -->
		<view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>

		<!-- 导航栏 -->
		<view class="navbar">
			<view class="navbar__back" @click="goBack">
				<view class="navbar__back-icon"></view>
			</view>
			<view class="navbar__center">
				<view class="navbar__type-dot" :class="`navbar__type-dot--${typeClass}`"></view>
				<text class="navbar__title">{{ typeLabel }}</text>
			</view>
			<view class="navbar__right"></view>
		</view>

		<!-- 消息详情弹窗 -->
		<MessageModal
			ref="messageModal"
			:type="typeClass"
			:title="modalTitle"
			:content="modalContent"
			:time="modalTime"
			primaryText="知道了"
			@confirm="onModalConfirm"
		/>

		<!-- 自定义 Toast -->
		<CustomToast ref="customToast" />

		<!-- 通知时间线列表 -->
		<scroll-view
			class="content"
			scroll-y
			:refresher-enabled="true"
			:refresher-triggered="isRefreshing"
			@refresherrefresh="onRefresh"
			@scrolltolower="onLoadMore"
		>
			<view v-if="loading && groupedNotifications.length === 0" class="loading">
				<view class="loading__spinner"></view>
				<text class="loading__text">加载中...</text>
			</view>

			<view v-else-if="groupedNotifications.length === 0" class="empty">
				<view class="empty__icon-wrap">
					<view class="empty__icon" :class="`empty__icon--${typeClass}`"></view>
				</view>
				<text class="empty__text">暂无{{ typeLabel }}</text>
				<text class="empty__sub">新的通知将会显示在这里</text>
			</view>

			<view v-else class="timeline">
				<template v-for="(item, index) in groupedNotifications">
					<!-- 时间分割线 -->
					<view v-if="item.type === 'divider'" :key="'d-' + index" class="time-divider">
						<text class="time-divider__text">{{ item.date }}</text>
					</view>

					<!-- 通知气泡卡片 -->
					<NotificationBubble
						v-else
						:key="'n-' + item.data.id"
						:typeClass="typeClass"
						:title="item.data.reminderTitle"
						:content="item.data.reminderContent"
						:time="formatTime(item.data.sentTime)"
						:isUnread="item.data.isUnread"
						:hasAction="hasActionLink(item.data)"
						:style="{ animationDelay: (index % 10) * 50 + 'ms' }"
						@click="openNotification(item.data)"
						@action="openNotificationAction(item.data)"
					/>
				</template>

				<!-- 加载更多 -->
				<view v-if="hasMore" class="load-more">
					<text class="load-more__text">{{ loadingMore ? '加载中...' : '上拉加载更多' }}</text>
				</view>
				<view v-else-if="allNotifications.length > 0" class="load-more">
					<text class="load-more__text">没有更多了</text>
				</view>
			</view>

			<!-- 底部安全区 -->
			<view class="safe-bottom"></view>
		</scroll-view>
	</view>
</template>

<script>
import NotificationBubble from '@/components/NotificationBubble.vue'
import MessageModal from '@/components/MessageModal.vue'
import CustomToast from '@/components/CustomToast.vue'
import { isDarkMode } from '@/store/theme.js'
import {
	fetchUnreadNotifications,
	markAsRead,
	getUnreadByType,
	getUnreadCountByType
} from '@/store/notification.js'
import { getReadNotifications } from '@/utils/api/notification.js'

export default {
	components: {
		NotificationBubble,
		MessageModal,
		CustomToast
	},
	data() {
		return {
			type: 'SYSTEM',
			statusBarHeight: 44,
			loading: false,
			isRefreshing: false,
			loadingMore: false,
			readMessages: [],
			pageNum: 1,
			pageSize: 15,
			hasMore: true,
			total: 0,
			// 弹窗数据
			modalTitle: '',
			modalContent: '',
			modalTime: ''
		}
	},
	computed: {
		isDark() {
			return isDarkMode()
		},
		typeLabel() {
			const map = { SYSTEM: '系统通知', RESERVE: '预约提醒', MEDICATION: '用药提醒' }
			return map[this.type] || '通知'
		},
		typeClass() {
			const map = { SYSTEM: 'system', RESERVE: 'reserve', MEDICATION: 'medication' }
			return map[this.type] || 'system'
		},
		allNotifications() {
			const unread = getUnreadByType(this.type).map(n => ({ ...n, isUnread: true }))
			const read = this.readMessages.map(n => ({ ...n, isUnread: false }))
			return [...unread, ...read].sort((a, b) => new Date(b.sentTime) - new Date(a.sentTime))
		},
		groupedNotifications() {
			const groups = []
			let currentDate = ''
			this.allNotifications.forEach(n => {
				const date = this.getDateLabel(n.sentTime)
				if (date !== currentDate) {
					groups.push({ type: 'divider', date })
					currentDate = date
				}
				groups.push({ type: 'notification', data: n })
			})
			return groups
		}
	},
	onLoad(options) {
		if (options.type) {
			this.type = options.type
		}
		this.getStatusBarHeight()
		this.loadData()
		uni.$on('notification-received', this.onNotificationReceived)
	},
	onUnload() {
		uni.$off('notification-received', this.onNotificationReceived)
	},
	methods: {
		onNotificationReceived(notification) {
			if (notification.reminderType === this.type) {
				this.refreshUnread()
			}
		},

		getStatusBarHeight() {
			const sysInfo = uni.getSystemInfoSync()
			this.statusBarHeight = sysInfo.statusBarHeight || 44
		},

		goBack() {
			uni.navigateBack()
		},

		async loadData() {
			this.loading = true
			try {
				await this.refreshUnread()
				await this.loadReadMessages()
			} finally {
				this.loading = false
			}
		},

		async refreshUnread() {
			await fetchUnreadNotifications()
		},

		async loadReadMessages() {
			if (this.loadingMore || !this.hasMore) return

			this.loadingMore = true
			try {
				const res = await getReadNotifications(this.type, this.pageNum, this.pageSize)
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

		async onRefresh() {
			this.isRefreshing = true
			try {
				await this.refreshUnread()
				this.pageNum = 1
				this.readMessages = []
				this.hasMore = true
				await this.loadReadMessages()
			} finally {
				this.isRefreshing = false
			}
		},

		onLoadMore() {
			this.loadReadMessages()
		},

		hasActionLink(notification) {
			return (notification.reminderType === 'RESERVE' && notification.appointmentId) ||
				(notification.reminderType === 'MEDICATION' && notification.prescriptionId)
		},

		async openNotification(notification) {
			// 标记已读
			if (notification.isUnread) {
				const success = await markAsRead(notification.id)
				if (success) {
					notification.isUnread = false
				}
			}

			// 根据类型跳转或显示弹窗
			if (notification.reminderType === 'RESERVE' && notification.appointmentId) {
				uni.navigateTo({
					url: `/pages/profile/medical-records?appointmentId=${notification.appointmentId}`
				})
			} else if (notification.reminderType === 'MEDICATION' && notification.prescriptionId) {
				uni.navigateTo({
					url: `/pages/profile/medical-records?prescriptionId=${notification.prescriptionId}`
				})
			} else {
				this.modalTitle = notification.reminderTitle
				this.modalContent = notification.reminderContent
				this.modalTime = this.formatTime(notification.sentTime)
				this.$refs.messageModal.show()
			}
		},

		openNotificationAction(notification) {
			if (notification.reminderType === 'RESERVE' && notification.appointmentId) {
				if (notification.isUnread) {
					markAsRead(notification.id)
				}
				uni.navigateTo({
					url: `/pages/profile/medical-records?appointmentId=${notification.appointmentId}`
				})
			} else if (notification.reminderType === 'MEDICATION' && notification.prescriptionId) {
				if (notification.isUnread) {
					markAsRead(notification.id)
				}
				uni.navigateTo({
					url: `/pages/profile/medical-records?prescriptionId=${notification.prescriptionId}`
				})
			}
		},

		onModalConfirm() {},

		getDateLabel(timeStr) {
			if (!timeStr) return ''
			const date = new Date(timeStr)
			const now = new Date()

			if (date.toDateString() === now.toDateString()) {
				return '今天'
			}

			const yesterday = new Date(now)
			yesterday.setDate(yesterday.getDate() - 1)
			if (date.toDateString() === yesterday.toDateString()) {
				return '昨天'
			}

			if (date.getFullYear() === now.getFullYear()) {
				return `${date.getMonth() + 1}月${date.getDate()}日`
			}

			return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
		},

		formatTime(timeStr) {
			if (!timeStr) return ''
			const date = new Date(timeStr)
			const now = new Date()
			const diff = now - date

			if (date.toDateString() === now.toDateString()) {
				return `${this.padZero(date.getHours())}:${this.padZero(date.getMinutes())}`
			}

			const yesterday = new Date(now)
			yesterday.setDate(yesterday.getDate() - 1)
			if (date.toDateString() === yesterday.toDateString()) {
				return `昨天 ${this.padZero(date.getHours())}:${this.padZero(date.getMinutes())}`
			}

			if (diff < 7 * 24 * 60 * 60 * 1000) {
				return `${Math.floor(diff / (24 * 60 * 60 * 1000))}天前`
			}

			return `${date.getMonth() + 1}/${date.getDate()} ${this.padZero(date.getHours())}:${this.padZero(date.getMinutes())}`
		},

		padZero(num) {
			return num < 10 ? '0' + num : num
		}
	}
}
</script>

<style lang="scss" scoped>
.page {
	height: 100vh;
	overflow: hidden;
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

// 导航栏
.navbar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	height: 88rpx;
	padding: 0 $spacing-lg;
	flex-shrink: 0;

	&__back {
		width: 64rpx;
		height: 64rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		transition: background 0.15s ease;

		&:active {
			background: rgba(30, 58, 95, 0.06);
		}
	}

	&__back-icon {
		width: 20rpx;
		height: 20rpx;
		border-left: 4rpx solid $text-primary;
		border-bottom: 4rpx solid $text-primary;
		transform: rotate(45deg);
		margin-left: 8rpx;
	}

	&__center {
		display: flex;
		align-items: center;
	}

	&__type-dot {
		width: 16rpx;
		height: 16rpx;
		border-radius: 50%;
		margin-right: $spacing-xs;

		&--system {
			background: $color-info;
		}
		&--reserve {
			background: $color-success;
		}
		&--medication {
			background: $color-warning;
		}
	}

	&__title {
		font-size: $font-size-lg;
		font-weight: $font-weight-semibold;
		color: $text-primary;
	}

	&__right {
		width: 64rpx;
	}
}

// 内容区
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

// 空状态
.empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 120rpx $spacing-lg;

	&__icon-wrap {
		width: 160rpx;
		height: 160rpx;
		border-radius: 50%;
		background: $bg-elevated;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: $spacing-lg;
	}

	&__icon {
		width: 80rpx;
		height: 80rpx;
		position: relative;

		&--system {
			border: 5rpx solid $color-info;
			border-radius: 40rpx 40rpx 12rpx 12rpx;
			opacity: 0.4;

			&::before {
				content: '';
				position: absolute;
				top: -16rpx;
				left: 50%;
				transform: translateX(-50%);
				width: 14rpx;
				height: 14rpx;
				background: $color-info;
				border-radius: 50%;
			}
		}

		&--reserve {
			border: 5rpx solid $color-success;
			border-radius: 12rpx;
			opacity: 0.4;

			&::before {
				content: '';
				position: absolute;
				top: 20rpx;
				left: 0;
				right: 0;
				height: 4rpx;
				background: $color-success;
			}
		}

		&--medication {
			border: 5rpx solid $color-warning;
			border-radius: 16rpx 16rpx 8rpx 8rpx;
			opacity: 0.4;

			&::before {
				content: '';
				position: absolute;
				top: -16rpx;
				left: 50%;
				transform: translateX(-50%);
				width: 36rpx;
				height: 16rpx;
				background: $color-warning;
				border-radius: 8rpx 8rpx 0 0;
			}
		}
	}

	&__text {
		font-size: $font-size-md;
		color: $text-secondary;
		margin-bottom: $spacing-xs;
	}

	&__sub {
		font-size: $font-size-sm;
		color: $text-muted;
	}
}

// 时间线
.timeline {
	padding: $spacing-md 0;
}

// 时间分割线
.time-divider {
	display: flex;
	justify-content: center;
	padding: $spacing-md 0 $spacing-sm;

	&__text {
		font-size: $font-size-xs;
		color: $text-muted;
		background: $bg-elevated;
		padding: 4rpx 24rpx;
		border-radius: $radius-full;
	}
}

// 加载更多
.load-more {
	padding: $spacing-lg;
	text-align: center;

	&__text {
		font-size: $font-size-sm;
		color: $text-muted;
	}
}

.safe-bottom {
	height: calc(32rpx + env(safe-area-inset-bottom));
}

// 深色模式
.page--dark {
	.navbar__back-icon {
		border-color: $dark-text-primary;
	}
	.navbar__back:active {
		background: rgba(255, 255, 255, 0.08);
	}
	.navbar__title {
		color: $dark-text-primary;
	}

	.loading__spinner {
		border-color: $dark-border-color;
		border-top-color: $dark-color-primary;
	}
	.loading__text { color: $dark-text-muted; }

	.empty__icon-wrap { background: $dark-bg-elevated; }
	.empty__text { color: $dark-text-secondary; }
	.empty__sub { color: $dark-text-muted; }

	.time-divider__text {
		color: $dark-text-muted;
		background: $dark-bg-elevated;
	}

	.load-more__text { color: $dark-text-muted; }
}
</style>
