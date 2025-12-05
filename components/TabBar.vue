<template>
	<view class="tabbar" :class="{ 'tabbar--dark': isDark }">
		<view class="tabbar__bg"></view>
		<view class="tabbar__content">
			<view
				v-for="(item, index) in tabs"
				:key="index"
				class="tabbar__item"
				:class="{
					'tabbar__item--active': currentIndex === index,
					'tabbar__item--center': index === 2
				}"
				@click="switchTab(index)"
			>
				<!-- 中间AI图标特殊处理 -->
				<view v-if="index === 2" class="tabbar__ai-wrapper">
					<view class="tabbar__ai-icon">
						<view class="ai-petal ai-petal--1"></view>
						<view class="ai-petal ai-petal--2"></view>
						<view class="ai-petal ai-petal--3"></view>
						<view class="ai-petal ai-petal--4"></view>
						<view class="ai-petal ai-petal--5"></view>
					</view>
				</view>
				<!-- 普通图标 -->
				<view v-else class="tabbar__icon">
					<view class="icon" :class="[`icon--${item.icon}`, { 'icon--active': currentIndex === index }]"></view>
					<!-- 消息未读角标 -->
					<view v-if="index === 3 && messageUnreadText" class="tabbar__badge">
						{{ messageUnreadText }}
					</view>
				</view>
				<text class="tabbar__label" :class="{ 'tabbar__label--active': currentIndex === index }">
					{{ item.text }}
				</text>
				<!-- 选中指示器 -->
				<view v-if="currentIndex === index && index !== 2" class="tabbar__indicator"></view>
			</view>
		</view>
		<!-- 安全区域填充 -->
		<view class="tabbar__safe-area"></view>
	</view>
</template>

<script>
import { isDarkMode } from '@/store/theme.js'
import { getUnreadCount } from '@/store/notification.js'

export default {
	name: 'TabBar',
	data() {
		return {
			currentIndex: 0,
			tabs: [
				{ icon: 'home', text: '首页', path: '/pages/index/index' },
				{ icon: 'calendar', text: '预约', path: '/pages/appointment/appointment' },
				{ icon: 'ai', text: 'AI问诊', path: '/pages/ai-consult/ai-consult' },
				{ icon: 'message', text: '消息', path: '/pages/messages/messages' },
				{ icon: 'user', text: '我的', path: '/pages/profile/profile' }
			]
		}
	},
	computed: {
		isDark() {
			return isDarkMode()
		},
		// 消息未读数量
		messageUnreadCount() {
			return getUnreadCount()
		},
		// 格式化未读数量显示
		messageUnreadText() {
			const count = this.messageUnreadCount
			if (count <= 0) return ''
			if (count > 99) return '99+'
			return String(count)
		}
	},
	mounted() {
		// 根据当前页面路由自动计算索引
		this.updateCurrentIndex()
	},
	methods: {
		// 根据当前路由更新索引
		updateCurrentIndex() {
			const pages = getCurrentPages()
			if (pages.length > 0) {
				const currentPage = pages[pages.length - 1]
				const route = '/' + currentPage.route
				const index = this.tabs.findIndex(tab => tab.path === route)
				if (index !== -1) {
					this.currentIndex = index
				}
			}
		},
		switchTab(index) {
			if (this.currentIndex === index) return
			// 不预先更新 currentIndex，完全依赖新页面 mounted 时的路由推导
			uni.switchTab({
				url: this.tabs[index].path
			})
		}
	}
}
</script>

<style lang="scss" scoped>
.tabbar {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 999;

	&__bg {
		position: absolute;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		background: rgba(255, 255, 255, 0.85);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border-top: 1rpx solid rgba(229, 233, 239, 0.6);
	}

	&__content {
		position: relative;
		display: flex;
		align-items: flex-end;
		justify-content: space-around;
		height: 120rpx;
		padding: 0 20rpx;
	}

	&__item {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		position: relative;
		transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);

		&:active {
			transform: scale(0.92);
		}

		&--active {
			.tabbar__icon .icon {
				transform: translateY(-4rpx);
			}
		}

		&--center {
			margin-top: -30rpx;
		}
	}

	&__icon {
		width: 52rpx;
		height: 52rpx;
		margin-bottom: 6rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
	}

	&__badge {
		position: absolute;
		top: -8rpx;
		right: -16rpx;
		min-width: 32rpx;
		height: 32rpx;
		line-height: 32rpx;
		padding: 0 8rpx;
		background: #FF4D4F;
		border-radius: 16rpx;
		font-size: 20rpx;
		color: #fff;
		text-align: center;
		font-weight: 500;
	}

	&__ai-wrapper {
		width: 96rpx;
		height: 96rpx;
		margin-bottom: 6rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(180deg, #FAFBFD 0%, #F0F5FA 100%);
		border-radius: 50%;
		box-shadow: 0 4rpx 20rpx rgba(102, 126, 234, 0.25);
		position: relative;
	}

	&__ai-icon {
		width: 56rpx;
		height: 56rpx;
		position: relative;
		animation: ai-rotate 8s linear infinite;
	}

	&__label {
		font-size: 22rpx;
		color: #8a8a8a;
		transition: color 0.25s ease;
		font-weight: 500;

		&--active {
			color: #1E3A5F;
		}
	}

	&__indicator {
		position: absolute;
		bottom: 16rpx;
		width: 32rpx;
		height: 6rpx;
		background: linear-gradient(90deg, #1E3A5F, #2D5A87);
		border-radius: 3rpx;
		animation: indicator-in 0.3s ease;
	}

	&__safe-area {
		height: constant(safe-area-inset-bottom);
		height: env(safe-area-inset-bottom);
		background: rgba(255, 255, 255, 0.85);
	}

	// 深色模式
	&--dark {
		.tabbar__bg {
			background: rgba(22, 27, 34, 0.9);
			border-top-color: rgba(48, 54, 61, 0.6);
		}

		.tabbar__ai-wrapper {
			background: linear-gradient(180deg, #21262D 0%, #161B22 100%);
			box-shadow: 0 4rpx 20rpx rgba(102, 126, 234, 0.35);
		}

		.tabbar__label {
			color: #8B949E;

			&--active {
				color: #4A90D9;
			}
		}

		.tabbar__indicator {
			background: linear-gradient(90deg, #4A90D9, #667EEA);
		}

		.tabbar__safe-area {
			background: rgba(22, 27, 34, 0.9);
		}

		.icon {
			&--home, &--calendar, &--message, &--user {
				border-color: #8B949E;
			}
			&--active {
				border-color: #4A90D9;
				&.icon--home::after,
				&.icon--calendar::after,
				&.icon--message::after,
				&.icon--user::after {
					background: #4A90D9;
				}
			}
		}
	}
}

// 图标样式
.icon {
	width: 48rpx;
	height: 48rpx;
	position: relative;
	transition: all 0.25s ease;

	// 首页图标 - 立方体
	&--home {
		width: 44rpx;
		height: 44rpx;
		border: 3rpx solid #8a8a8a;
		border-radius: 8rpx;
		position: relative;

		&::before {
			content: '';
			position: absolute;
			top: 6rpx;
			left: 6rpx;
			right: 6rpx;
			bottom: 6rpx;
			border: 2rpx solid currentColor;
			border-radius: 4rpx;
		}
	}

	// 预约图标 - 日历
	&--calendar {
		width: 44rpx;
		height: 44rpx;
		border: 3rpx solid #8a8a8a;
		border-radius: 6rpx;
		position: relative;

		&::before {
			content: '';
			position: absolute;
			top: 12rpx;
			left: 0;
			right: 0;
			height: 2rpx;
			background: currentColor;
		}

		&::after {
			content: '';
			position: absolute;
			top: 20rpx;
			left: 8rpx;
			width: 8rpx;
			height: 8rpx;
			background: #8a8a8a;
			border-radius: 2rpx;
		}
	}

	// 消息图标 - 铃铛
	&--message {
		width: 40rpx;
		height: 44rpx;
		border: 3rpx solid #8a8a8a;
		border-radius: 20rpx 20rpx 8rpx 8rpx;
		position: relative;

		&::after {
			content: '';
			position: absolute;
			bottom: -8rpx;
			left: 50%;
			transform: translateX(-50%);
			width: 12rpx;
			height: 6rpx;
			background: #8a8a8a;
			border-radius: 0 0 6rpx 6rpx;
		}
	}

	// 我的图标 - 用户
	&--user {
		width: 44rpx;
		height: 44rpx;
		position: relative;

		&::before {
			content: '';
			position: absolute;
			top: 0;
			left: 50%;
			transform: translateX(-50%);
			width: 20rpx;
			height: 20rpx;
			border: 3rpx solid #8a8a8a;
			border-radius: 50%;
		}

		&::after {
			content: '';
			position: absolute;
			bottom: 0;
			left: 50%;
			transform: translateX(-50%);
			width: 36rpx;
			height: 18rpx;
			border: 3rpx solid #8a8a8a;
			border-radius: 18rpx 18rpx 0 0;
			border-bottom: none;
		}
	}

	// 激活态
	&--active {
		&.icon--home {
			border-color: #1E3A5F;
			&::before { border-color: #1E3A5F; }
		}
		&.icon--calendar {
			border-color: #1E3A5F;
			&::before { background: #1E3A5F; }
			&::after { background: #1E3A5F; }
		}
		&.icon--message {
			border-color: #1E3A5F;
			&::after { background: #1E3A5F; }
		}
		&.icon--user {
			&::before { border-color: #1E3A5F; }
			&::after { border-color: #1E3A5F; }
		}
	}
}

// AI花瓣图标
.ai-petal {
	position: absolute;
	width: 14rpx;
	height: 24rpx;
	border-radius: 7rpx;
	top: 50%;
	left: 50%;
	transform-origin: center 20rpx;
	margin-left: -7rpx;
	margin-top: -20rpx;

	&--1 {
		background: #FF6B6B;
		transform: rotate(0deg);
	}
	&--2 {
		background: #4ECDC4;
		transform: rotate(72deg);
	}
	&--3 {
		background: #45B7D1;
		transform: rotate(144deg);
	}
	&--4 {
		background: #96CEB4;
		transform: rotate(216deg);
	}
	&--5 {
		background: #DDA0DD;
		transform: rotate(288deg);
	}
}

// 动画
@keyframes ai-rotate {
	from {
		transform: rotate(0deg);
	}
	to {
		transform: rotate(360deg);
	}
}

@keyframes indicator-in {
	from {
		transform: scaleX(0);
		opacity: 0;
	}
	to {
		transform: scaleX(1);
		opacity: 1;
	}
}
</style>
