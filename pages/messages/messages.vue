<template>
	<view class="page" :class="{ 'page--dark': isDark }">
		<!-- 固定顶部栏 -->
		<view class="fixed-top" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="navbar">
				<text class="navbar__title">消息</text>
				<view v-if="hasUnread" class="navbar__action" @click="handleMarkAllRead">
					<text class="navbar__action-text">全部已读</text>
				</view>
			</view>
		</view>

		<!-- 顶部占位 -->
		<view class="fixed-top-placeholder" :style="{ height: topBarHeight + 'px' }"></view>

		<!-- 搜索栏 -->
		<SearchBar
			:value="searchKeyword"
			placeholder="搜索通知和医生对话"
			@input="onSearchInput"
			@clear="clearSearch"
		/>

		<!-- 消息列表 -->
		<scroll-view
			class="content"
			scroll-y
			:refresher-enabled="true"
			:refresher-triggered="isRefreshing"
			@refresherrefresh="onRefresh"
		>
			<view v-if="loading" class="loading">
				<view class="loading__spinner"></view>
				<text class="loading__text">加载中...</text>
			</view>

			<view v-else>
				<!-- 服务通知区域 -->
				<view v-if="displayServiceEntries.length > 0" class="section">
					<view
						v-for="(entry, index) in displayServiceEntries"
						:key="entry.type"
						class="conversation-row"
						:style="{ animationDelay: index * 60 + 'ms' }"
						@click="openNotificationType(entry.type)"
					>
						<!-- 图标 -->
						<view class="conversation-row__avatar" :class="`conversation-row__avatar--${entry.iconClass}`">
							<image
								:src="entry.icon"
								class="service-icon-img"
								mode="aspectFit"
							/>
						</view>

						<!-- 内容 -->
						<view class="conversation-row__body">
							<view class="conversation-row__top">
								<text class="conversation-row__name">{{ entry.label }}</text>
								<text class="conversation-row__time">{{ entry.latestTime }}</text>
							</view>
							<view class="conversation-row__bottom">
								<text class="conversation-row__preview">{{ entry.latestText }}</text>
								<view v-if="entry.unreadCount > 0" class="conversation-row__badge">
									{{ entry.unreadCount > 99 ? '99+' : entry.unreadCount }}
								</view>
							</view>
						</view>

						<!-- 分隔线 -->
						<view v-if="index < displayServiceEntries.length - 1" class="conversation-row__divider"></view>
					</view>
				</view>

				<!-- 医生对话区域 -->
				<view v-if="displayDoctors.length > 0" class="section">
					<view class="section-header">
						<text class="section-header__text">医生对话</text>
					</view>

					<view
						v-for="(doctor, index) in displayDoctors"
						:key="doctor.id"
						class="conversation-row"
						:style="{ animationDelay: (displayServiceEntries.length + index) * 60 + 'ms' }"
						@click="openDoctorChat(doctor)"
					>
						<!-- 医生头像 -->
						<view class="conversation-row__doctor-avatar">
							<image
								:src="doctor.avatar || '/static/avatar-default.svg'"
								class="conversation-row__doctor-avatar-img"
								mode="aspectFill"
							/>
							<view v-if="doctor.online" class="conversation-row__online-dot"></view>
						</view>

						<!-- 内容 -->
						<view class="conversation-row__body">
							<view class="conversation-row__top">
								<view class="conversation-row__name-wrap">
									<text class="conversation-row__name">{{ doctor.name }}</text>
									<text class="conversation-row__dept">{{ doctor.department }}</text>
								</view>
								<text class="conversation-row__time">{{ formatTime(doctor.lastMessageTime) }}</text>
							</view>
							<view class="conversation-row__bottom">
								<text class="conversation-row__preview">{{ doctor.lastMessage }}</text>
								<view v-if="doctor.unreadCount > 0" class="conversation-row__badge">
									{{ doctor.unreadCount > 99 ? '99+' : doctor.unreadCount }}
								</view>
							</view>
						</view>

						<!-- 分隔线 -->
						<view v-if="index < displayDoctors.length - 1" class="conversation-row__divider"></view>
					</view>
				</view>

				<!-- 全部为空 -->
				<view v-if="displayServiceEntries.length === 0 && displayDoctors.length === 0" class="empty">
					<view class="empty__icon-wrap">
						<view class="empty__icon"></view>
					</view>
					<text class="empty__text">{{ searchKeyword ? '没有找到相关消息' : '暂无消息' }}</text>
				</view>
			</view>

			<!-- 底部占位 -->
			<view class="tabbar-placeholder"></view>
		</scroll-view>

		<!-- 底部导航 -->
		<TabBar />

		<!-- 顶部通知栏 -->
    <CustomToast ref="customToast" />
    <TopNotificationBar />
	</view>
</template>

<script>
import TabBar from '@/components/TabBar.vue'
import SearchBar from '@/components/SearchBar.vue'
import { isDarkMode } from '@/store/theme.js'
import {
	fetchUnreadNotifications,
	markAllAsRead,
	getUnreadByType,
	getUnreadCount,
	getUnreadCountByType,
	getLatestByType
} from '@/store/notification.js'
import {
	fetchSessions,
	getSessionList,
	getTotalUnreadCount
} from '@/store/chat.js'

import TopNotificationBar from '@/components/TopNotificationBar.vue'
import CustomToast from "@/components/CustomToast.vue"
import { setToastInstance } from "@/utils/toast.js"

export default {
	components: {
		TopNotificationBar,
		TabBar,
		SearchBar,
		CustomToast
	},
	data() {
		return {
			statusBarHeight: 44,
			topBarHeight: 0,
			loading: false,
			isRefreshing: false,
			searchKeyword: ''
		}
	},
	computed: {
		isDark() {
			return isDarkMode()
		},
		hasUnread() {
			return getUnreadCount() > 0 || getTotalUnreadCount() > 0
		},
		doctorConversations() {
			return getSessionList().map(session => ({
				id: session.id,
				name: session.doctorName || '医生',
				department: session.doctorDepartment || '',
				avatar: session.doctorAvatar || '',
				online: false,
				lastMessage: session.lastDecryptedPreview || ' ',
				lastMessageTime: session.lastMessageAt,
				unreadCount: session.unreadCount || 0
			}))
		},
		serviceEntries() {
			return [
				{
					type: 'SYSTEM',
					label: '系统通知',
					icon: '/static/system.svg',
					iconClass: 'system',
					latestText: this.getLatestPreview('SYSTEM'),
					latestTime: this.getLatestTime('SYSTEM'),
					unreadCount: getUnreadCountByType('SYSTEM')
				},
				{
					type: 'RESERVE',
					label: '预约提醒',
					icon: '/static/appointment.svg',
					iconClass: 'reserve',
					latestText: this.getLatestPreview('RESERVE'),
					latestTime: this.getLatestTime('RESERVE'),
					unreadCount: getUnreadCountByType('RESERVE')
				},
				{
					type: 'MEDICATION',
					label: '用药提醒',
					icon: '/static/service.svg',
					iconClass: 'medication',
					latestText: this.getLatestPreview('MEDICATION'),
					latestTime: this.getLatestTime('MEDICATION'),
					unreadCount: getUnreadCountByType('MEDICATION')
				}
			]
		},
		displayServiceEntries() {
			if (!this.searchKeyword) return this.serviceEntries
			const kw = this.searchKeyword.toLowerCase()
			return this.serviceEntries.filter(s =>
				s.label.includes(kw) || (s.latestText && s.latestText.toLowerCase().includes(kw))
			)
		},
		displayDoctors() {
			if (!this.searchKeyword) return this.doctorConversations
			const kw = this.searchKeyword.toLowerCase()
			return this.doctorConversations.filter(d =>
				(d.name && d.name.toLowerCase().includes(kw)) ||
				(d.lastMessage && d.lastMessage.toLowerCase().includes(kw)) ||
				(d.department && d.department.toLowerCase().includes(kw))
			)
		}
	},
	onLoad() {
		this.getStatusBarHeight()
		this.loadData()
		uni.$on('notification-received', this.onNotificationReceived)
		uni.$on('chat-sessions-updated', this.onChatSessionsUpdated)
	},
	onReady() {
		setToastInstance(this.$refs.customToast)
		this.measureTopBar()
	},
	onUnload() {
		uni.$off('notification-received', this.onNotificationReceived)
		uni.$off('chat-sessions-updated', this.onChatSessionsUpdated)
	},
	onShow() {
		// #ifdef APP-PLUS
		uni.hideTabBar({ animation: false })
		// #endif
		this.refreshUnread()
	},
	methods: {
		onNotificationReceived() {
			this.refreshUnread()
		},

		onChatSessionsUpdated() {
			// 聊天会话列表已通过 computed 自动更新，无需额外操作
		},

		getStatusBarHeight() {
			const sysInfo = uni.getSystemInfoSync()
			this.statusBarHeight = sysInfo.statusBarHeight || 44
		},
		measureTopBar() {
			const query = uni.createSelectorQuery().in(this)
			query.select('.fixed-top').boundingClientRect((rect) => {
				if (rect) {
					this.topBarHeight = rect.height
				}
			}).exec()
		},

		async loadData() {
			this.loading = true
			try {
				await this.refreshUnread()
			} finally {
				this.loading = false
			}
		},

		async refreshUnread() {
			await Promise.all([
				fetchUnreadNotifications(),
				fetchSessions().catch(e => console.warn('获取聊天会话失败:', e))
			])
		},

		async onRefresh() {
			this.isRefreshing = true
			try {
				await this.refreshUnread()
			} finally {
				this.isRefreshing = false
			}
		},

		getLatestPreview(type) {
			const latest = getLatestByType(type)
			if (!latest) return '暂无新消息'
			const content = this.formatMedicationContent(latest.reminderContent, latest.reminderType)
			if (latest.reminderType === 'MEDICATION' && latest.reminderTitle) {
				return latest.reminderTitle + '：' + content
			}
			return content
		},

		formatMedicationContent(content, type) {
			if (type !== 'MEDICATION' || !content) return content
			try {
				const obj = JSON.parse(content)
				const parts = []
				if (obj.dosage) parts.push(obj.dosage)
				if (obj.spec) parts.push(obj.spec)
				if (obj.frequency) parts.push(obj.frequency)
				return parts.length > 0 ? parts.join(' · ') : content
			} catch (e) {
				return content
			}
		},

		getLatestTime(type) {
			const latest = getLatestByType(type)
			if (latest) return this.formatTime(latest.sentTime)
			return ''
		},

		openNotificationType(type) {
			uni.navigateTo({
				url: `/pages/messages/notification-detail?type=${type}`
			})
		},

		openDoctorChat(doctor) {
			uni.navigateTo({
				url: `/pages/messages/doctor-chat?sessionId=${doctor.id}&name=${doctor.name}&department=${doctor.department}&avatar=${encodeURIComponent(doctor.avatar || '')}`
			})
		},

		async handleMarkAllRead() {
			uni.showLoading({ title: '处理中...' })
			try {
				const success = await markAllAsRead()
				if (success) {
					this.$toast.success('已全部标记为已读')
				}
			} finally {
				uni.hideLoading()
			}
		},

		onSearchInput(val) {
			this.searchKeyword = val
		},

		clearSearch() {
			this.searchKeyword = ''
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
				return '昨天'
			}

			if (diff < 7 * 24 * 60 * 60 * 1000) {
				return `${Math.floor(diff / (24 * 60 * 60 * 1000))}天前`
			}

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
	height: 100vh;
	overflow: hidden;
	background: $bg-base;
	display: flex;
	flex-direction: column;

	&--dark {
		background: $dark-bg-base;
	}
}

.fixed-top {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	z-index: 10;
	background: $bg-base;
}

.fixed-top-placeholder {
	flex-shrink: 0;
}

// ==================== 导航栏 ====================
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

// ==================== 内容区 ====================
.content {
	flex: 1;
	overflow: hidden;
}

// ==================== 加载状态 ====================
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

// ==================== 区块 ====================
.section {
	background: $bg-card;
	margin-bottom: $spacing-sm;
}

.section-header {
	padding: $spacing-lg $spacing-lg $spacing-sm;

	&__text {
		font-size: $font-size-xs;
		color: $text-muted;
		font-weight: $font-weight-medium;
		letter-spacing: 2rpx;
	}
}

// ==================== 对话行 ====================
.conversation-row {
	display: flex;
	align-items: center;
	padding: $spacing-lg;
	position: relative;
	transition: background 0.15s ease;
	animation: rowFadeIn 0.35s $ease-in-out-smooth forwards;
	opacity: 0;

	&:active {
		background: $bg-elevated;
	}

	// 服务通知图标容器
	&__avatar {
		width: 96rpx;
		height: 96rpx;
		border-radius: $radius-md;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		margin-right: $spacing-md;

		&--system {
			background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
		}
		&--reserve {
			background: linear-gradient(135deg, #10B981 0%, #34D399 100%);
		}
		&--medication {
			background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%);
		}
	}

	// 医生头像
	&__doctor-avatar {
		width: 96rpx;
		height: 96rpx;
		border-radius: 50%;
		background: linear-gradient(135deg, $color-primary 0%, $color-primary-light 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		margin-right: $spacing-md;
		position: relative;
	}

	&__doctor-avatar-img {
		width: 100%;
		height: 100%;
		border-radius: inherit;
	}

	&__online-dot {
		position: absolute;
		bottom: 4rpx;
		right: 4rpx;
		width: 20rpx;
		height: 20rpx;
		border-radius: 50%;
		background: $color-success;
		border: 4rpx solid $bg-card;
	}

	// 内容区
	&__body {
		flex: 1;
		min-width: 0;
	}

	&__top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 8rpx;
	}

	&__name-wrap {
		display: flex;
		align-items: center;
		min-width: 0;
	}

	&__name {
		font-size: $font-size-md;
		font-weight: $font-weight-semibold;
		color: $text-primary;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	&__dept {
		font-size: $font-size-xs;
		color: $text-muted;
		margin-left: $spacing-xs;
		flex-shrink: 0;
		background: $bg-elevated;
		padding: 2rpx 12rpx;
		border-radius: $radius-full;
	}

	&__time {
		font-size: $font-size-xs;
		color: $text-muted;
		flex-shrink: 0;
		margin-left: $spacing-sm;
	}

	&__bottom {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	&__preview {
		flex: 1;
		font-size: $font-size-sm;
		color: $text-secondary;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		margin-right: $spacing-sm;
	}

	&__badge {
		min-width: 36rpx;
		height: 36rpx;
		line-height: 36rpx;
		padding: 0 10rpx;
		background: $color-accent;
		border-radius: $radius-full;
		font-size: 22rpx;
		color: #FFFFFF;
		text-align: center;
		flex-shrink: 0;
	}

	// 分隔线（WeChat 风格左缩进）
	&__divider {
		position: absolute;
		bottom: 0;
		left: 128rpx;
		right: 0;
		height: 1rpx;
		background: $border-color-light;
	}
}

@keyframes rowFadeIn {
	from {
		opacity: 0;
		transform: translateY(16rpx);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

// ==================== 服务通知图标 ====================
.service-icon-img {
	width: 48rpx;
	height: 48rpx;
}

// ==================== 空状态 ====================
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
		height: 64rpx;
		position: relative;

		&::before {
			content: '';
			position: absolute;
			top: 0;
			left: 50%;
			transform: translateX(-50%);
			width: 60rpx;
			height: 44rpx;
			border: 4rpx solid $text-muted;
			border-radius: 8rpx;
			opacity: 0.4;
		}

		&::after {
			content: '';
			position: absolute;
			bottom: 0;
			left: 50%;
			transform: translateX(-50%);
			width: 36rpx;
			height: 36rpx;
			border: 4rpx solid $text-muted;
			border-radius: 50%;
			opacity: 0.3;
		}
	}

	&__text {
		font-size: $font-size-base;
		color: $text-muted;
	}
}

// ==================== 底部占位 ====================
.tabbar-placeholder {
	height: calc(140rpx + env(safe-area-inset-bottom));
}

// ==================== 深色模式 ====================
.page--dark {
	.fixed-top { background: $dark-bg-base; }
	.navbar__title { color: $dark-text-primary; }
	.navbar__action-text { color: $dark-color-primary; }

	.loading__spinner { border-color: $dark-border-color; border-top-color: $dark-color-primary; }
	.loading__text { color: $dark-text-muted; }

	.section {
		background: $dark-bg-card;
	}

	.section-header__text {
		color: $dark-text-muted;
	}

	.conversation-row {
		&:active { background: $dark-bg-elevated; }

		&__name { color: $dark-text-primary; }
		&__time { color: $dark-text-muted; }
		&__preview { color: $dark-text-secondary; }
		&__divider { background: $dark-border-color-light; }

		&__dept {
			color: $dark-text-muted;
			background: $dark-bg-elevated;
		}

		&__online-dot {
			border-color: $dark-bg-card;
		}
	}

	.empty__icon-wrap { background: $dark-bg-elevated; }
	.empty__icon::before,
	.empty__icon::after { border-color: $dark-text-muted; }
	.empty__text { color: $dark-text-muted; }
}
</style>
