<template>
	<view class="page" :class="{ 'page--dark': isDark }">
		<!-- 状态栏占位 -->
		<view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>

		<!-- 顶部导航栏 -->
		<view class="navbar">
			<view class="navbar__left" @click="goBack">
				<view class="back-icon"></view>
			</view>
			<text class="navbar__title">历史记录</text>
			<view class="navbar__right" @click="toggleSearch">
				<view class="search-icon"></view>
			</view>
		</view>

		<!-- 搜索框 -->
		<view class="search-bar" :class="{ 'search-bar--show': showSearch }">
			<view class="search-bar__inner">
				<view class="search-bar__icon"></view>
				<input
					class="search-bar__input"
					type="text"
					v-model="searchKey"
					placeholder="搜索会话"
					@confirm="handleSearch"
				/>
				<view v-if="searchKey" class="search-bar__clear" @click="clearSearch"></view>
			</view>
		</view>

		<!-- 会话列表 -->
		<scroll-view
			class="content"
			scroll-y
			@scrolltolower="loadMore"
			refresher-enabled
			:refresher-triggered="isRefreshing"
			@refresherrefresh="onRefresh"
		>
			<!-- 空状态 -->
			<view v-if="!loading && conversations.length === 0" class="empty">
				<view class="empty__icon"></view>
				<text class="empty__text">{{ searchKey ? '未找到相关会话' : '暂无历史记录' }}</text>
				<text class="empty__hint">开始一段新对话吧</text>
			</view>

			<!-- 会话列表 -->
			<view v-else class="conversation-list">
				<view
					v-for="item in conversations"
					:key="item.id"
					class="conversation-item"
					@click="enterConversation(item)"
				>
					<view class="conversation-item__avatar">
						<view class="ai-icon">
							<view class="ai-petal ai-petal--1"></view>
							<view class="ai-petal ai-petal--2"></view>
							<view class="ai-petal ai-petal--3"></view>
							<view class="ai-petal ai-petal--4"></view>
							<view class="ai-petal ai-petal--5"></view>
						</view>
					</view>
					<view class="conversation-item__content">
						<view class="conversation-item__header">
							<text class="conversation-item__title">{{ item.title || 'AI问诊' }}</text>
							<text class="conversation-item__time">{{ formatTime(item.updateTime) }}</text>
						</view>
						<text class="conversation-item__summary">{{ item.summary || '暂无摘要' }}</text>
						<view class="conversation-item__footer">
							<text class="conversation-item__count">{{ item.totalMessages || 0 }}条消息</text>
						</view>
					</view>
					<view class="conversation-item__arrow"></view>
				</view>
			</view>

			<!-- 加载更多 -->
			<view v-if="conversations.length > 0" class="load-more">
				<text v-if="loading" class="load-more__text">加载中...</text>
				<text v-else-if="!hasMore" class="load-more__text">没有更多了</text>
			</view>

			<!-- 底部占位 -->
			<view class="bottom-space"></view>
		</scroll-view>

		<!-- 顶部通知栏 -->
		<TopNotificationBar />
	</view>
</template>

<script>
import { isDarkMode } from '@/store/theme.js'
import { pageConversations } from '@/utils/api/chat.js'
import TopNotificationBar from '@/components/TopNotificationBar.vue'

export default {
	components: {
		TopNotificationBar
	},
	data() {
		return {
			statusBarHeight: 44,
			showSearch: false,
			searchKey: '',
			conversations: [],
			loading: false,
			isRefreshing: false,
			pageNum: 1,
			pageSize: 10,
			total: 0,
			hasMore: true
		}
	},
	computed: {
		isDark() {
			return isDarkMode()
		}
	},
	onLoad() {
		this.getStatusBarHeight()
		this.loadConversations()
	},
	methods: {
		getStatusBarHeight() {
			const sysInfo = uni.getSystemInfoSync()
			this.statusBarHeight = sysInfo.statusBarHeight || 44
		},

		goBack() {
			uni.navigateBack()
		},

		toggleSearch() {
			this.showSearch = !this.showSearch
			if (!this.showSearch && this.searchKey) {
				this.clearSearch()
			}
		},

		clearSearch() {
			this.searchKey = ''
			this.resetAndLoad()
		},

		handleSearch() {
			this.resetAndLoad()
		},

		resetAndLoad() {
			this.pageNum = 1
			this.conversations = []
			this.hasMore = true
			this.loadConversations()
		},

		async loadConversations() {
			if (this.loading) return

			this.loading = true
			try {
				const result = await pageConversations({
					searchKey: this.searchKey,
					pageNum: this.pageNum,
					pageSize: this.pageSize
				})

				if (this.pageNum === 1) {
					this.conversations = result.list
				} else {
					this.conversations = [...this.conversations, ...result.list]
				}

				this.total = result.total
				this.hasMore = this.conversations.length < result.total
			} catch (e) {
				console.error('加载会话失败:', e)
				uni.showToast({ title: e.message || '加载失败', icon: 'none' })
			} finally {
				this.loading = false
				this.isRefreshing = false
			}
		},

		loadMore() {
			if (!this.hasMore || this.loading) return
			this.pageNum++
			this.loadConversations()
		},

		onRefresh() {
			this.isRefreshing = true
			this.pageNum = 1
			this.hasMore = true
			this.loadConversations()
		},

		enterConversation(item) {
			// 将 conversationId 存入本地存储（tabBar 页面无法通过 navigateTo 传参）
			uni.setStorageSync('pendingConversationId', item.id)
			// 使用 switchTab 跳转到 tabBar 页面
			uni.switchTab({
				url: '/pages/ai-consult/ai-consult'
			})
		},

		formatTime(timeStr) {
			if (!timeStr) return ''

			// 双重解析：先原生（支持ISO 8601），再replace（支持 YYYY-MM-DD HH:mm:ss）
			let date = new Date(timeStr)
			if (isNaN(date.getTime())) {
				date = new Date(timeStr.replace(/-/g, '/'))
			}
			if (isNaN(date.getTime())) return ''

			const now = new Date()

			// 今天
			if (date.toDateString() === now.toDateString()) {
				return '今天'
			}

			// 昨天
			const yesterday = new Date(now)
			yesterday.setDate(yesterday.getDate() - 1)
			if (date.toDateString() === yesterday.toDateString()) {
				return '昨天'
			}

			// 同年：M/D
			const month = date.getMonth() + 1
			const day = date.getDate()
			if (date.getFullYear() === now.getFullYear()) {
				return `${month}/${day}`
			}

			// 跨年：YYYY/M/D
			return `${date.getFullYear()}/${month}/${day}`
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
	justify-content: space-between;
	height: 88rpx;
	padding: 0 $spacing-lg;
	flex-shrink: 0;

	&__left, &__right {
		width: 80rpx;
		height: 80rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	&__title {
		font-size: $font-size-lg;
		font-weight: $font-weight-semibold;
		color: $text-primary;
	}
}

.back-icon {
	width: 20rpx;
	height: 20rpx;
	border-left: 4rpx solid $text-primary;
	border-bottom: 4rpx solid $text-primary;
	transform: rotate(45deg);
}

.search-icon {
	width: 36rpx;
	height: 36rpx;
	border: 3rpx solid $text-secondary;
	border-radius: 50%;
	position: relative;

	&::after {
		content: '';
		position: absolute;
		bottom: -6rpx;
		right: -6rpx;
		width: 12rpx;
		height: 3rpx;
		background: $text-secondary;
		transform: rotate(45deg);
	}
}

.search-bar {
	padding: 0 $spacing-lg;
	height: 0;
	overflow: hidden;
	transition: all 0.3s ease;

	&--show {
		height: 96rpx;
		padding-bottom: $spacing-md;
	}

	&__inner {
		display: flex;
		align-items: center;
		height: 72rpx;
		background: $bg-elevated;
		border-radius: $radius-lg;
		padding: 0 $spacing-md;
	}

	&__icon {
		width: 32rpx;
		height: 32rpx;
		border: 2rpx solid $text-muted;
		border-radius: 50%;
		margin-right: $spacing-sm;
		position: relative;

		&::after {
			content: '';
			position: absolute;
			bottom: -4rpx;
			right: -4rpx;
			width: 8rpx;
			height: 2rpx;
			background: $text-muted;
			transform: rotate(45deg);
		}
	}

	&__input {
		flex: 1;
		font-size: $font-size-base;
		color: $text-primary;
	}

	&__clear {
		width: 32rpx;
		height: 32rpx;
		background: $text-muted;
		border-radius: 50%;
		position: relative;

		&::before, &::after {
			content: '';
			position: absolute;
			top: 50%;
			left: 50%;
			width: 16rpx;
			height: 2rpx;
			background: #fff;
		}

		&::before { transform: translate(-50%, -50%) rotate(45deg); }
		&::after { transform: translate(-50%, -50%) rotate(-45deg); }
	}
}

.content {
	flex: 1;
	overflow: hidden;
}

.empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: $spacing-2xl $spacing-xl;

	&__icon {
		width: 160rpx;
		height: 160rpx;
		background: $bg-elevated;
		border-radius: 50%;
		margin-bottom: $spacing-xl;
		position: relative;

		&::before {
			content: '';
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			width: 80rpx;
			height: 60rpx;
			border: 4rpx solid $text-muted;
			border-radius: 12rpx;
		}

		&::after {
			content: '';
			position: absolute;
			top: 40%;
			left: 50%;
			transform: translateX(-50%);
			width: 40rpx;
			height: 4rpx;
			background: $text-muted;
		}
	}

	&__text {
		font-size: $font-size-base;
		color: $text-secondary;
		margin-bottom: $spacing-sm;
	}

	&__hint {
		font-size: $font-size-sm;
		color: $text-muted;
	}
}

.conversation-list {
	padding: $spacing-md $spacing-lg;
}

.conversation-item {
	display: flex;
	align-items: center;
	padding: $spacing-lg;
	background: $bg-card;
	border-radius: $radius-lg;
	box-shadow: $shadow-sm;
	margin-bottom: $spacing-md;

	&__avatar {
		width: 88rpx;
		height: 88rpx;
		background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(240, 147, 251, 0.1) 100%);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		margin-right: $spacing-md;
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
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		flex: 1;
		margin-right: $spacing-sm;
	}

	&__time {
		font-size: $font-size-xs;
		color: $text-muted;
		flex-shrink: 0;
	}

	&__summary {
		font-size: $font-size-sm;
		color: $text-secondary;
		line-height: $line-height-normal;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		margin-bottom: $spacing-xs;
	}

	&__footer {
		display: flex;
		align-items: center;
	}

	&__count {
		font-size: $font-size-xs;
		color: $text-muted;
	}

	&__arrow {
		width: 16rpx;
		height: 16rpx;
		border-top: 3rpx solid $text-muted;
		border-right: 3rpx solid $text-muted;
		transform: rotate(45deg);
		margin-left: $spacing-md;
		flex-shrink: 0;
	}
}

.ai-icon {
	width: 40rpx;
	height: 40rpx;
	position: relative;
}

.ai-petal {
	position: absolute;
	width: 10rpx;
	height: 16rpx;
	border-radius: 5rpx;
	top: 50%;
	left: 50%;
	transform-origin: center 12rpx;
	margin-left: -5rpx;
	margin-top: -12rpx;

	&--1 { background: #FF6B6B; transform: rotate(0deg); }
	&--2 { background: #4ECDC4; transform: rotate(72deg); }
	&--3 { background: #45B7D1; transform: rotate(144deg); }
	&--4 { background: #96CEB4; transform: rotate(216deg); }
	&--5 { background: #DDA0DD; transform: rotate(288deg); }
}

.load-more {
	padding: $spacing-lg;
	text-align: center;

	&__text {
		font-size: $font-size-sm;
		color: $text-muted;
	}
}

.bottom-space {
	height: calc(40rpx + env(safe-area-inset-bottom));
}

// 深色模式
.page--dark {
	.navbar__title { color: $dark-text-primary; }
	.back-icon { border-color: $dark-text-primary; }
	.search-icon { border-color: $dark-text-secondary; }
	.search-icon::after { background: $dark-text-secondary; }

	.search-bar__inner { background: $dark-bg-elevated; }
	.search-bar__icon { border-color: $dark-text-muted; }
	.search-bar__icon::after { background: $dark-text-muted; }
	.search-bar__input { color: $dark-text-primary; }
	.search-bar__clear { background: $dark-text-muted; }

	.empty__icon { background: $dark-bg-elevated; }
	.empty__icon::before { border-color: $dark-text-muted; }
	.empty__icon::after { background: $dark-text-muted; }
	.empty__text { color: $dark-text-secondary; }
	.empty__hint { color: $dark-text-muted; }

	.conversation-item {
		background: $dark-bg-card;
		&__title { color: $dark-text-primary; }
		&__time { color: $dark-text-muted; }
		&__summary { color: $dark-text-secondary; }
		&__count { color: $dark-text-muted; }
		&__arrow { border-color: $dark-text-muted; }
	}

	.load-more__text { color: $dark-text-muted; }
}
</style>
