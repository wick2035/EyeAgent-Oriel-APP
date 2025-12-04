<template>
	<view class="page" :class="{ 'page--dark': isDark }">
		<!-- 顶部渐变背景 -->
		<view class="page__bg"></view>

		<!-- 状态栏占位 -->
		<view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>

		<!-- 头部区域 -->
		<view class="header">
			<view class="header__left">
				<text class="header__greeting">{{ greeting }}</text>
				<text class="header__name">欢迎使用AI医问通</text>
			</view>
			<view class="header__right">
				<view class="header__notify" @click="goToMessages">
					<view class="notify-icon"></view>
					<view v-if="unreadCount > 0" class="notify-badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</view>
				</view>
			</view>
		</view>

		<!-- 搜索栏 -->
		<view class="search-bar" @click="goToSearch">
			<view class="search-bar__icon"></view>
			<text class="search-bar__placeholder">搜索症状、疾病、医生...</text>
		</view>

		<!-- 快捷服务 -->
		<view class="services">
			<view class="services__title">快捷服务</view>
			<view class="services__grid">
				<view
					v-for="(service, index) in services"
					:key="index"
					class="service-item"
					:style="{ animationDelay: index * 0.1 + 's' }"
					@click="handleService(service)"
				>
					<view class="service-item__icon" :class="[`service-item__icon--${service.type}`]">
						<view class="service-icon" :class="[`service-icon--${service.icon}`]"></view>
					</view>
					<text class="service-item__text">{{ service.name }}</text>
				</view>
			</view>
		</view>

		<!-- 健康数据 -->
		<view class="health-data">
			<view class="health-data__header">
				<text class="health-data__title">今日健康</text>
				<text class="health-data__more" @click="goToHealth">查看更多</text>
			</view>
			<view class="health-data__cards">
				<view class="health-card health-card--steps">
					<view class="health-card__icon"></view>
					<view class="health-card__info">
						<text class="health-card__value">{{ healthData.steps }}</text>
						<text class="health-card__label">步数</text>
					</view>
				</view>
				<view class="health-card health-card--heart">
					<view class="health-card__icon"></view>
					<view class="health-card__info">
						<text class="health-card__value">{{ healthData.heartRate }}</text>
						<text class="health-card__label">心率</text>
					</view>
				</view>
				<view class="health-card health-card--sleep">
					<view class="health-card__icon"></view>
					<view class="health-card__info">
						<text class="health-card__value">{{ healthData.sleep }}</text>
						<text class="health-card__label">睡眠</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 健康资讯 -->
		<view class="news">
			<view class="news__header">
				<text class="news__title">健康资讯</text>
				<text class="news__more" @click="goToNews">更多</text>
			</view>
			<view class="news__list">
				<view
					v-for="(item, index) in newsList"
					:key="index"
					class="news-item"
					@click="goToNewsDetail(item)"
				>
					<view class="news-item__content">
						<text class="news-item__title">{{ item.title }}</text>
						<text class="news-item__desc">{{ item.desc }}</text>
						<view class="news-item__meta">
							<text class="news-item__source">{{ item.source }}</text>
							<text class="news-item__time">{{ item.time }}</text>
						</view>
					</view>
					<image v-if="item.cover" class="news-item__cover" :src="item.cover" mode="aspectFill"></image>
				</view>
			</view>
		</view>

		<!-- 底部占位（为TabBar留出空间） -->
		<view class="tabbar-placeholder"></view>

		<!-- 底部导航 -->
		<TabBar :current="0" />
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
			unreadCount: 3,
			services: [
				{ name: '在线问诊', icon: 'consult', type: 'primary', path: '/pages/ai-consult/ai-consult' },
				{ name: '预约挂号', icon: 'appointment', type: 'success', path: '/pages/appointment/appointment' },
				{ name: '健康档案', icon: 'record', type: 'info', path: '' },
				{ name: '用药提醒', icon: 'medicine', type: 'warning', path: '' }
			],
			healthData: {
				steps: '6,482',
				heartRate: '72',
				sleep: '7.5h'
			},
			newsList: [
				{
					id: 1,
					title: '秋冬季节如何预防流感？专家给你支招',
					desc: '随着气温下降，流感病毒开始活跃，专家建议从以下几个方面做好预防...',
					source: '健康时报',
					time: '2小时前',
					cover: ''
				},
				{
					id: 2,
					title: '每天喝多少水才健康？这个数字你要记住',
					desc: '正确的饮水习惯对健康至关重要，但喝水也有讲究...',
					source: '医学科普',
					time: '5小时前',
					cover: ''
				}
			]
		}
	},
	computed: {
		isDark() {
			return isDarkMode()
		},
		greeting() {
			const hour = new Date().getHours()
			if (hour < 6) return '夜深了'
			if (hour < 9) return '早上好'
			if (hour < 12) return '上午好'
			if (hour < 14) return '中午好'
			if (hour < 18) return '下午好'
			if (hour < 22) return '晚上好'
			return '夜深了'
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
		goToMessages() {
			uni.switchTab({
				url: '/pages/messages/messages'
			})
		},
		goToSearch() {
			uni.showToast({ title: '搜索功能开发中', icon: 'none' })
		},
		handleService(service) {
			if (service.path) {
				uni.switchTab({ url: service.path })
			} else {
				uni.showToast({ title: '功能开发中', icon: 'none' })
			}
		},
		goToHealth() {
			uni.showToast({ title: '健康详情开发中', icon: 'none' })
		},
		goToNews() {
			uni.showToast({ title: '资讯列表开发中', icon: 'none' })
		},
		goToNewsDetail(item) {
			uni.showToast({ title: '资讯详情开发中', icon: 'none' })
		}
	}
}
</script>

<style lang="scss" scoped>
.page {
	min-height: 100vh;
	background: $bg-base;
	position: relative;

	&__bg {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 480rpx;
		background: linear-gradient(180deg, #E8F4FD 0%, $bg-base 100%);
		z-index: 0;
	}

	&--dark {
		background: $dark-bg-base;

		.page__bg {
			background: linear-gradient(180deg, rgba(74, 144, 217, 0.1) 0%, $dark-bg-base 100%);
		}
	}
}

.status-bar {
	position: relative;
	z-index: 1;
}

.header {
	position: relative;
	z-index: 1;
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: $spacing-lg $spacing-lg 0;

	&__left {
		display: flex;
		flex-direction: column;
	}

	&__greeting {
		font-size: $font-size-sm;
		color: $text-secondary;
		margin-bottom: $spacing-xs;
	}

	&__name {
		font-size: $font-size-xl;
		font-weight: $font-weight-semibold;
		color: $text-primary;
	}

	&__notify {
		width: 80rpx;
		height: 80rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		background: $bg-card;
		border-radius: $radius-lg;
		box-shadow: $shadow-sm;
		position: relative;
	}
}

.notify-icon {
	width: 44rpx;
	height: 48rpx;
	border: 3rpx solid $text-secondary;
	border-radius: 22rpx 22rpx 8rpx 8rpx;
	position: relative;

	&::after {
		content: '';
		position: absolute;
		bottom: -8rpx;
		left: 50%;
		transform: translateX(-50%);
		width: 14rpx;
		height: 8rpx;
		background: $text-secondary;
		border-radius: 0 0 7rpx 7rpx;
	}
}

.notify-badge {
	position: absolute;
	top: 12rpx;
	right: 12rpx;
	min-width: 32rpx;
	height: 32rpx;
	padding: 0 8rpx;
	background: $color-accent;
	color: #fff;
	font-size: 20rpx;
	border-radius: 16rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.search-bar {
	position: relative;
	z-index: 1;
	margin: $spacing-lg;
	height: 88rpx;
	background: $bg-card;
	border-radius: $radius-xl;
	box-shadow: $shadow-sm;
	display: flex;
	align-items: center;
	padding: 0 $spacing-lg;

	&__icon {
		width: 36rpx;
		height: 36rpx;
		border: 3rpx solid $text-muted;
		border-radius: 50%;
		margin-right: $spacing-md;
		position: relative;

		&::after {
			content: '';
			position: absolute;
			bottom: -6rpx;
			right: -6rpx;
			width: 12rpx;
			height: 3rpx;
			background: $text-muted;
			transform: rotate(45deg);
		}
	}

	&__placeholder {
		font-size: $font-size-base;
		color: $text-muted;
	}
}

.services {
	position: relative;
	z-index: 1;
	padding: 0 $spacing-lg;
	margin-bottom: $spacing-lg;

	&__title {
		font-size: $font-size-lg;
		font-weight: $font-weight-semibold;
		color: $text-primary;
		margin-bottom: $spacing-md;
	}

	&__grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: $spacing-md;
	}
}

.service-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	animation: fadeInUp 0.5s ease backwards;

	&__icon {
		width: 112rpx;
		height: 112rpx;
		border-radius: $radius-lg;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: $spacing-sm;
		transition: transform 0.25s $ease-out-back;

		&--primary {
			background: linear-gradient(135deg, rgba(30, 58, 95, 0.1) 0%, rgba(45, 90, 135, 0.15) 100%);
		}
		&--success {
			background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.15) 100%);
		}
		&--info {
			background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.15) 100%);
		}
		&--warning {
			background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.15) 100%);
		}

		&:active {
			transform: scale(0.92);
		}
	}

	&__text {
		font-size: $font-size-sm;
		color: $text-secondary;
	}
}

.service-icon {
	width: 48rpx;
	height: 48rpx;
	position: relative;

	&--consult {
		border: 3rpx solid $color-primary;
		border-radius: 8rpx;
		position: relative;

		&::before {
			content: '';
			position: absolute;
			top: 10rpx;
			left: 8rpx;
			right: 8rpx;
			height: 3rpx;
			background: $color-primary;
		}
		&::after {
			content: '';
			position: absolute;
			top: 20rpx;
			left: 8rpx;
			width: 60%;
			height: 3rpx;
			background: $color-primary;
		}
	}

	&--appointment {
		border: 3rpx solid $color-success;
		border-radius: 6rpx;

		&::before {
			content: '';
			position: absolute;
			top: 12rpx;
			left: 0;
			right: 0;
			height: 3rpx;
			background: $color-success;
		}
	}

	&--record {
		border: 3rpx solid $color-info;
		border-radius: 6rpx;

		&::before {
			content: '';
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			width: 20rpx;
			height: 20rpx;
			border: 3rpx solid $color-info;
			border-radius: 50%;
		}
	}

	&--medicine {
		width: 20rpx;
		height: 40rpx;
		border: 3rpx solid $color-warning;
		border-radius: 10rpx;
		position: relative;

		&::before {
			content: '';
			position: absolute;
			top: 50%;
			left: -2rpx;
			right: -2rpx;
			height: 3rpx;
			background: $color-warning;
		}
	}
}

.health-data {
	position: relative;
	z-index: 1;
	padding: 0 $spacing-lg;
	margin-bottom: $spacing-lg;

	&__header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: $spacing-md;
	}

	&__title {
		font-size: $font-size-lg;
		font-weight: $font-weight-semibold;
		color: $text-primary;
	}

	&__more {
		font-size: $font-size-sm;
		color: $color-primary;
	}

	&__cards {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: $spacing-md;
	}
}

.health-card {
	background: $bg-card;
	border-radius: $radius-lg;
	padding: $spacing-md;
	box-shadow: $shadow-sm;
	display: flex;
	align-items: center;

	&__icon {
		width: 64rpx;
		height: 64rpx;
		border-radius: $radius-md;
		margin-right: $spacing-sm;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	&--steps .health-card__icon {
		background: rgba(16, 185, 129, 0.1);
		&::before {
			content: '';
			width: 24rpx;
			height: 32rpx;
			border-left: 4rpx solid $color-success;
			border-bottom: 4rpx solid $color-success;
			transform: rotate(-45deg);
			margin-top: -8rpx;
		}
	}

	&--heart .health-card__icon {
		background: rgba(239, 68, 68, 0.1);
		&::before {
			content: '';
			width: 28rpx;
			height: 24rpx;
			background: $color-error;
			border-radius: 14rpx 14rpx 0 0;
			transform: rotate(-45deg);
			position: relative;
		}
	}

	&--sleep .health-card__icon {
		background: rgba(102, 126, 234, 0.1);
		&::before {
			content: '';
			width: 28rpx;
			height: 28rpx;
			border: 4rpx solid #667EEA;
			border-radius: 50%;
			border-right-color: transparent;
			border-bottom-color: transparent;
			transform: rotate(-45deg);
		}
	}

	&__info {
		display: flex;
		flex-direction: column;
	}

	&__value {
		font-size: $font-size-lg;
		font-weight: $font-weight-bold;
		color: $text-primary;
		line-height: 1.2;
	}

	&__label {
		font-size: $font-size-xs;
		color: $text-muted;
	}
}

.news {
	position: relative;
	z-index: 1;
	padding: 0 $spacing-lg;

	&__header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: $spacing-md;
	}

	&__title {
		font-size: $font-size-lg;
		font-weight: $font-weight-semibold;
		color: $text-primary;
	}

	&__more {
		font-size: $font-size-sm;
		color: $color-primary;
	}
}

.news-item {
	background: $bg-card;
	border-radius: $radius-lg;
	padding: $spacing-md;
	margin-bottom: $spacing-md;
	box-shadow: $shadow-sm;
	display: flex;

	&__content {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	&__title {
		font-size: $font-size-base;
		font-weight: $font-weight-medium;
		color: $text-primary;
		line-height: $line-height-normal;
		margin-bottom: $spacing-xs;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	&__desc {
		font-size: $font-size-sm;
		color: $text-secondary;
		line-height: $line-height-normal;
		margin-bottom: $spacing-sm;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	&__meta {
		display: flex;
		align-items: center;
		margin-top: auto;
	}

	&__source {
		font-size: $font-size-xs;
		color: $text-muted;
		margin-right: $spacing-md;
	}

	&__time {
		font-size: $font-size-xs;
		color: $text-muted;
	}

	&__cover {
		width: 180rpx;
		height: 120rpx;
		border-radius: $radius-md;
		margin-left: $spacing-md;
		flex-shrink: 0;
	}
}

.tabbar-placeholder {
	height: calc(140rpx + env(safe-area-inset-bottom));
}

// 深色模式适配
.page--dark {
	.header__greeting { color: $dark-text-secondary; }
	.header__name { color: $dark-text-primary; }
	.header__notify { background: $dark-bg-card; }
	.notify-icon { border-color: $dark-text-secondary; }
	.notify-icon::after { background: $dark-text-secondary; }

	.search-bar {
		background: $dark-bg-card;
		&__icon { border-color: $dark-text-muted; }
		&__icon::after { background: $dark-text-muted; }
		&__placeholder { color: $dark-text-muted; }
	}

	.services__title { color: $dark-text-primary; }
	.service-item__text { color: $dark-text-secondary; }

	.health-data__title { color: $dark-text-primary; }
	.health-data__more { color: $dark-color-primary; }
	.health-card {
		background: $dark-bg-card;
		&__value { color: $dark-text-primary; }
		&__label { color: $dark-text-muted; }
	}

	.news__title { color: $dark-text-primary; }
	.news__more { color: $dark-color-primary; }
	.news-item {
		background: $dark-bg-card;
		&__title { color: $dark-text-primary; }
		&__desc { color: $dark-text-secondary; }
		&__source, &__time { color: $dark-text-muted; }
	}
}

@keyframes fadeInUp {
	from {
		opacity: 0;
		transform: translateY(20rpx);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}
</style>
