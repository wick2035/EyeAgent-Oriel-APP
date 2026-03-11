<template>
	<view
		v-show="visible"
		class="notification-bar"
		:class="{ 'notification-bar--active': active }"
		:style="{ paddingTop: statusBarHeight + 'px' }"
		@click="handleClick"
	>
		<!-- 内层彩色卡片（left/right margin + 圆角 + 背景色都在这里） -->
		<view
			class="notification-bar__card"
			:class="[`notification-bar__card--${type}`, { 'notification-bar__card--dark': isDark }]"
		>
			<view class="notification-bar__content">
				<!-- 类型图标 -->
				<view class="notification-bar__icon" :class="`notification-bar__icon--${type}`">
					<view v-if="type === 'system'" class="icon-system"></view>
					<view v-else-if="type === 'reserve'" class="icon-reserve"></view>
					<view v-else class="icon-medication"></view>
				</view>
				<!-- 文字内容 -->
				<view class="notification-bar__text">
					<text class="notification-bar__title">{{ title }}</text>
					<text v-if="content" class="notification-bar__desc">{{ content }}</text>
				</view>
				<!-- 关闭按钮 -->
				<view class="notification-bar__close" @click.stop="close">
					<text class="close-icon">×</text>
				</view>
			</view>
			<!-- 进度条 -->
			<view class="notification-bar__progress" :class="{ 'notification-bar__progress--active': active }" :style="{ animationDuration: duration + 'ms' }"></view>
		</view>
	</view>
</template>

<script>
import { isDarkMode } from '@/store/theme.js'
import { setNotificationBarReady } from '@/utils/websocket.js'
import { navigateByNotification } from '@/utils/notificationNavigate.js'

export default {
	name: 'TopNotificationBar',
	data() {
		return {
			visible: false,
			active: false,
			type: 'system', // system, reserve, medication
			title: '',
			content: '',
			duration: 5000,
			statusBarHeight: 44,
			timer: null,
			notificationData: null
		}
	},
	computed: {
		isDark() {
			return isDarkMode()
		}
	},
	mounted() {
		console.log('TopNotificationBar mounted')
		this.getStatusBarHeight()
		// 监听全局通知事件
		uni.$on('show-notification', this.show)
		// 通知WebSocket模块，通知栏已就绪
		setNotificationBarReady()
	},
	beforeDestroy() {
		uni.$off('show-notification', this.show)
		this.clearTimer()
	},
	methods: {
		getStatusBarHeight() {
			const sysInfo = uni.getSystemInfoSync()
			this.statusBarHeight = sysInfo.statusBarHeight || 44
		},

		/**
		 * 显示通知
		 * @param {Object} options - { type, title, content, duration, data }
		 */
		show(options) {
			this.clearTimer()

			this.type = options.type || 'system'
			this.title = options.title || '新消息'
			this.content = options.content || ''
			this.duration = options.duration || 5000
			this.notificationData = options.data || null
			this.active = false
			this.visible = true

			// 使用 nextTick 确保 iOS 上 DOM 更新完成后再触发动画
			this.$nextTick(() => {
				setTimeout(() => {
					this.active = true
				}, 50)

				// 自动关闭
				this.timer = setTimeout(() => {
					this.close()
				}, this.duration)
			})
		},

		close() {
			this.active = false
			// 等待退出动画完成后隐藏
			setTimeout(() => {
				this.visible = false
			}, 300)
			this.clearTimer()
		},

		clearTimer() {
			if (this.timer) {
				clearTimeout(this.timer)
				this.timer = null
			}
		},

		handleClick() {
			this.close()
			// 跳转到消息页面
			uni.switchTab({
				url: '/pages/messages/messages'
			})
		}
	}
}
</script>

<style lang="scss" scoped>
// 外层透明容器：仅负责动画（transform / opacity），固定在顶部全宽
// paddingTop 由 :style 动态注入（= statusBarHeight px），形成状态栏下方的透明间距
// top: 0 保证 iOS App-plus 的 translateY(-100%) 动画正常工作
.notification-bar {
	position: fixed;
	left: 0;
	right: 0;
	top: 0;
	z-index: 9999;
	-webkit-transform: translateY(-100%);
	transform: translateY(-100%);
	opacity: 0;
	-webkit-transition: -webkit-transform 0.3s ease-out, opacity 0.3s ease-out;
	transition: transform 0.3s ease-out, opacity 0.3s ease-out;

	&--active {
		-webkit-transform: translateY(0);
		transform: translateY(0);
		opacity: 1;
	}
}

// 内层彩色卡片：承载背景色、圆角、阴影、左右留白
.notification-bar__card {
	margin: 0 24rpx;
	border-radius: 24rpx;
	overflow: hidden;
	box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.15);

	&--system {
		background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
	}

	&--reserve {
		background: linear-gradient(135deg, #22C55E 0%, #16A34A 100%);
	}

	&--medication {
		background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
	}

	&--dark {
		box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.4);
	}
}

.notification-bar__content {
	display: flex;
	align-items: center;
	padding: 24rpx 32rpx;
}

.notification-bar__icon {
	width: 72rpx;
	height: 72rpx;
	border-radius: 16rpx;
	background: rgba(255, 255, 255, 0.2);
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	margin-right: 24rpx;
}

.notification-bar__text {
	flex: 1;
	min-width: 0;
}

.notification-bar__title {
	display: block;
	font-size: 30rpx;
	font-weight: 600;
	color: #fff;
	margin-bottom: 4rpx;
}

.notification-bar__desc {
	display: block;
	font-size: 26rpx;
	color: rgba(255, 255, 255, 0.85);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.notification-bar__close {
	width: 56rpx;
	height: 56rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	margin-left: 16rpx;

	.close-icon {
		font-size: 40rpx;
		color: rgba(255, 255, 255, 0.8);
		font-weight: 300;
	}
}

.notification-bar__progress {
	height: 4rpx;
	background: rgba(255, 255, 255, 0.3);
	width: 100%;
}

.notification-bar__progress--active {
	animation: progress linear forwards;
}

// 图标样式
.icon-system {
	width: 36rpx;
	height: 36rpx;
	border: 3rpx solid #fff;
	border-radius: 50%;
	position: relative;

	&::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		-webkit-transform: translate(-50%, -60%);
		transform: translate(-50%, -60%);
		width: 4rpx;
		height: 14rpx;
		background: #fff;
	}

	&::after {
		content: '';
		position: absolute;
		bottom: 6rpx;
		left: 50%;
		-webkit-transform: translateX(-50%);
		transform: translateX(-50%);
		width: 4rpx;
		height: 4rpx;
		background: #fff;
		border-radius: 50%;
	}
}

.icon-reserve {
	width: 36rpx;
	height: 36rpx;
	border: 3rpx solid #fff;
	border-radius: 6rpx;
	position: relative;

	&::before {
		content: '';
		position: absolute;
		top: 10rpx;
		left: 0;
		right: 0;
		height: 2rpx;
		background: #fff;
	}

	&::after {
		content: '';
		position: absolute;
		top: 16rpx;
		left: 6rpx;
		width: 8rpx;
		height: 8rpx;
		background: #fff;
		border-radius: 2rpx;
	}
}

.icon-medication {
	width: 32rpx;
	height: 40rpx;
	border: 3rpx solid #fff;
	border-radius: 6rpx 6rpx 4rpx 4rpx;
	position: relative;

	&::before {
		content: '';
		position: absolute;
		top: -6rpx;
		left: 50%;
		-webkit-transform: translateX(-50%);
		transform: translateX(-50%);
		width: 14rpx;
		height: 6rpx;
		background: #fff;
		border-radius: 3rpx 3rpx 0 0;
	}

	&::after {
		content: '+';
		position: absolute;
		top: 50%;
		left: 50%;
		-webkit-transform: translate(-50%, -50%);
		transform: translate(-50%, -50%);
		font-size: 20rpx;
		color: #fff;
		font-weight: bold;
	}
}

// 进度条动画
@keyframes progress {
	from {
		width: 100%;
	}
	to {
		width: 0%;
	}
}
</style>
