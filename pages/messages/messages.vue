<template>
	<view class="page" :class="{ 'page--dark': isDark }">
		<!-- 状态栏占位 -->
		<view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>

		<!-- 顶部导航栏 -->
		<view class="navbar">
			<text class="navbar__title">消息</text>
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
				<text class="tab-item__text">{{ tab }}</text>
				<view v-if="currentTab === index" class="tab-item__indicator"></view>
			</view>
		</view>

		<!-- 消息列表 -->
		<scroll-view class="content" scroll-y>
			<view v-if="filteredMessages.length === 0" class="empty">
				<view class="empty__icon"></view>
				<text class="empty__text">暂无消息</text>
			</view>

			<view v-else class="messages">
				<view
					v-for="(msg, index) in filteredMessages"
					:key="index"
					class="message-item"
					@click="openMessage(msg)"
				>
					<view class="message-item__avatar" :class="[`message-item__avatar--${msg.type}`]">
						<view v-if="msg.type === 'system'" class="avatar-icon avatar-icon--system"></view>
						<view v-else-if="msg.type === 'consult'" class="avatar-icon avatar-icon--consult"></view>
						<view v-else class="avatar-icon avatar-icon--notify"></view>
					</view>
					<view class="message-item__content">
						<view class="message-item__header">
							<text class="message-item__title">{{ msg.title }}</text>
							<text class="message-item__time">{{ msg.time }}</text>
						</view>
						<text class="message-item__desc">{{ msg.desc }}</text>
					</view>
					<view v-if="msg.unread" class="message-item__badge"></view>
				</view>
			</view>

			<!-- 底部占位 -->
			<view class="tabbar-placeholder"></view>
		</scroll-view>

		<!-- 底部导航 -->
		<TabBar :current="3" />
	</view>
</template>

<script>
import TabBar from '@/components/TabBar.vue'
import { isDarkMode } from '@/store/theme.js'

export default {
	components: {
		TabBar
	},
	data() {
		return {
			statusBarHeight: 44,
			currentTab: 0,
			tabs: ['全部', '系统通知', '问诊回复'],
			messages: [
				{
					id: 1,
					type: 'system',
					title: '系统通知',
					desc: '您的账号已完成实名认证，可以享受更多服务',
					time: '今天 14:30',
					unread: true
				},
				{
					id: 2,
					type: 'consult',
					title: '问诊回复',
					desc: '小Eye回复了您的问诊：根据您描述的症状，建议您...',
					time: '今天 10:15',
					unread: true
				},
				{
					id: 3,
					type: 'system',
					title: '预约提醒',
					desc: '您预约的张明华医生明天上午9:00有诊，请准时就诊',
					time: '昨天 18:00',
					unread: false
				},
				{
					id: 4,
					type: 'notify',
					title: '健康提示',
					desc: '根据您的健康数据分析，建议您增加每日饮水量',
					time: '昨天 09:30',
					unread: false
				},
				{
					id: 5,
					type: 'consult',
					title: '问诊回复',
					desc: '感谢您的咨询，您的问题已解答完毕，祝您身体健康',
					time: '3天前',
					unread: false
				}
			]
		}
	},
	computed: {
		isDark() {
			return isDarkMode()
		},
		filteredMessages() {
			if (this.currentTab === 0) return this.messages
			if (this.currentTab === 1) return this.messages.filter(m => m.type === 'system' || m.type === 'notify')
			if (this.currentTab === 2) return this.messages.filter(m => m.type === 'consult')
			return this.messages
		}
	},
	onLoad() {
		this.getStatusBarHeight()
	},
	methods: {
		getStatusBarHeight() {
			const sysInfo = uni.getSystemInfoSync()
			this.statusBarHeight = sysInfo.statusBarHeight || 44
		},
		switchTab(index) {
			this.currentTab = index
		},
		openMessage(msg) {
			msg.unread = false
			uni.showToast({ title: '消息详情开发中', icon: 'none' })
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

	&__title {
		font-size: $font-size-lg;
		font-weight: $font-weight-semibold;
		color: $text-primary;
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
	padding: $spacing-sm $spacing-lg;
	margin-right: $spacing-lg;

	&__text {
		font-size: $font-size-base;
		color: $text-secondary;
		transition: color 0.25s ease;
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
		&--consult {
			background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(240, 147, 251, 0.1) 100%);
		}
		&--notify {
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

	&--consult {
		&::before {
			content: '';
			position: absolute;
			top: 0;
			left: 50%;
			transform: translateX(-50%);
			width: 8rpx;
			height: 40rpx;
			background: linear-gradient(180deg, #667EEA 0%, #F093FB 100%);
			border-radius: 4rpx;
		}
		&::after {
			content: '';
			position: absolute;
			top: 50%;
			left: 0;
			transform: translateY(-50%);
			width: 40rpx;
			height: 8rpx;
			background: linear-gradient(90deg, #667EEA 0%, #F093FB 100%);
			border-radius: 4rpx;
		}
	}

	&--notify {
		border: 3rpx solid $color-warning;
		border-radius: 20rpx 20rpx 6rpx 6rpx;
		height: 36rpx;

		&::after {
			content: '';
			position: absolute;
			bottom: -8rpx;
			left: 50%;
			transform: translateX(-50%);
			width: 12rpx;
			height: 6rpx;
			background: $color-warning;
			border-radius: 0 0 6rpx 6rpx;
		}
	}
}

.tabbar-placeholder {
	height: calc(140rpx + env(safe-area-inset-bottom));
}

// 深色模式
.page--dark {
	.navbar__title { color: $dark-text-primary; }

	.tabs { border-bottom-color: $dark-border-color; }
	.tab-item__text { color: $dark-text-secondary; }
	.tab-item--active .tab-item__text { color: $dark-color-primary; }
	.tab-item__indicator { background: $dark-color-primary; }

	.empty__icon { background: $dark-bg-elevated; }
	.empty__icon::before { border-color: $dark-text-muted; }
	.empty__text { color: $dark-text-muted; }

	.message-item {
		background: $dark-bg-card;
		&__title { color: $dark-text-primary; }
		&__time { color: $dark-text-muted; }
		&__desc { color: $dark-text-secondary; }
	}
}
</style>
