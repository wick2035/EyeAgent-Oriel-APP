<template>
	<view class="bubble-wrap">
		<!-- 时间戳分隔线 -->
		<view v-if="showTime" class="time-divider">
			<text class="time-divider__text">{{ formattedTime }}</text>
		</view>

		<!-- 消息气泡 -->
		<view class="bubble" :class="[isSelf ? 'bubble--right' : 'bubble--left', isDark ? 'bubble--dark' : '']">
			<!-- 对方头像（左侧） -->
			<view v-if="!isSelf" class="bubble__avatar">
				<image :src="avatar || '/static/temporary/male.jpg'" class="bubble__avatar-img" mode="aspectFill" />
			</view>

			<!-- 己方头像（row-reverse 下排在 DOM 前 → 视觉最右） -->
			<view v-if="isSelf" class="bubble__avatar">
				<image :src="selfAvatar || '/static/temporary/male.jpg'" class="bubble__avatar-img" mode="aspectFill" />
			</view>

			<!-- 内容区 -->
			<view class="bubble__content" :class="isSelf ? 'bubble__content--right' : 'bubble__content--left'">
				<!-- 解密失败 -->
				<view v-if="message.decryptFailed" class="bubble__body bubble__body--error" :class="isSelf ? 'bubble__body--right' : 'bubble__body--left'">
					<text class="bubble__lock">&#128274;</text>
					<text class="bubble__error-text">消息无法解密</text>
				</view>

				<!-- 文本消息 -->
				<view v-else-if="message.messageType === 'TEXT'" class="bubble__body" :class="isSelf ? 'bubble__body--right' : 'bubble__body--left'">
					<text class="bubble__text" :class="isSelf ? 'bubble__text--right' : ''">{{ message.decryptedContent }}</text>
				</view>

				<!-- 图片消息 -->
				<view v-else-if="message.messageType === 'IMAGE'" class="bubble__body bubble__body--image" @click="previewImage">
					<image :src="message.fileUrl" class="bubble__image" mode="widthFix" />
				</view>

				<!-- 文件消息 -->
				<view v-else-if="message.messageType === 'FILE'" class="bubble__body" :class="isSelf ? 'bubble__body--right' : 'bubble__body--left'">
					<text class="bubble__text" :class="isSelf ? 'bubble__text--right' : ''">{{ message.decryptedContent || '[文件]' }}</text>
				</view>

				<!-- 发送状态 -->
				<view v-if="isSelf" class="bubble__status">
					<!-- 发送中 -->
					<view v-if="message.status === 'sending'" class="bubble__sending-icon"></view>
					<!-- 发送失败 -->
					<view v-else-if="message.status === 'failed'" class="bubble__failed-icon" @click="$emit('retry', message.id)">
						<text class="bubble__failed-text">!</text>
					</view>
					<!-- 已发送/已读 -->
					<view v-else class="bubble__check">
						<text class="bubble__check-text" :class="message.readStatus === 1 ? 'bubble__check-text--read' : ''">{{ message.readStatus === 1 ? '✓✓' : '✓' }}</text>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { isDarkMode } from '@/store/theme.js'
import { getUserInfo } from '@/store/user.js'

export default {
	name: 'DoctorChatBubble',
	props: {
		message: {
			type: Object,
			required: true
		},
		avatar: {
			type: String,
			default: ''
		},
		showTime: {
			type: Boolean,
			default: false
		}
	},
	emits: ['retry'],
	computed: {
		isDark() {
			return isDarkMode()
		},
		isSelf() {
			const userInfo = getUserInfo()
			return this.message.senderType === 'PATIENT' && this.message.senderId === userInfo.id
		},
		selfAvatar() {
			const userInfo = getUserInfo()
			return userInfo.avatar || ''
		},
		formattedTime() {
			if (!this.message.createTime) return ''
			const date = new Date(this.message.createTime)
			const now = new Date()
			const isToday = date.toDateString() === now.toDateString()
			const time = `${this.pad(date.getHours())}:${this.pad(date.getMinutes())}`
			if (isToday) return time

			const yesterday = new Date(now)
			yesterday.setDate(yesterday.getDate() - 1)
			if (date.toDateString() === yesterday.toDateString()) return `昨天 ${time}`

			return `${date.getMonth() + 1}/${date.getDate()} ${time}`
		}
	},
	methods: {
		pad(n) {
			return n < 10 ? '0' + n : n
		},
		previewImage() {
			if (this.message.fileUrl) {
				uni.previewImage({
					urls: [this.message.fileUrl],
					current: this.message.fileUrl
				})
			}
		}
	}
}
</script>

<style lang="scss" scoped>
.bubble-wrap {
	padding: 0 $spacing-md;
}

// 时间分隔线
.time-divider {
	display: flex;
	justify-content: center;
	padding: $spacing-md 0;

	&__text {
		font-size: $font-size-xs;
		color: $text-muted;
		background: $bg-elevated;
		padding: 4rpx 20rpx;
		border-radius: $radius-full;
	}
}

// 气泡容器
.bubble {
	display: flex;
	align-items: flex-start;
	margin-bottom: $spacing-sm;

	&--right {
		flex-direction: row-reverse;
	}

	// 头像
	&__avatar {
		width: 72rpx;
		height: 72rpx;
		border-radius: 50%;
		overflow: hidden;
		flex-shrink: 0;
	}

	&__avatar-img {
		width: 100%;
		height: 100%;
	}

	// 内容区
	&__content {
		max-width: 65%;
		display: flex;
		align-items: flex-end;

		&--left {
			margin-left: $spacing-sm;
			flex-direction: row;
		}

		&--right {
			margin-right: $spacing-sm;
			flex-direction: row-reverse;
		}
	}

	// 气泡体
	&__body {
		padding: $spacing-md $spacing-lg;
		border-radius: 24rpx;
		word-break: break-all;

		&--left {
			background: $bg-card;
			border-top-left-radius: 8rpx;
			box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
		}

		&--right {
			background: linear-gradient(135deg, #3388ff 0%, #5EAAFF 100%);
			border-top-right-radius: 8rpx;
			box-shadow: 0 2rpx 12rpx rgba(51, 136, 255, 0.25);
		}

		&--image {
			padding: 6rpx;
			border-radius: 16rpx;
			background: $bg-card;
			box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
		}

		&--error {
			display: flex;
			align-items: center;
			gap: 8rpx;
			background: rgba(239, 68, 68, 0.08);
			border: 2rpx solid rgba(239, 68, 68, 0.2);
		}
	}

	// 文本
	&__text {
		font-size: $font-size-base;
		color: $text-primary;
		line-height: 1.6;

		&--right {
			color: #FFFFFF;
		}
	}

	// 图片
	&__image {
		width: 360rpx;
		max-width: 100%;
		border-radius: 12rpx;
	}

	// 错误
	&__lock {
		font-size: 28rpx;
	}

	&__error-text {
		font-size: $font-size-sm;
		color: #EF4444;
	}

	// 发送状态
	&__status {
		display: flex;
		align-items: flex-end;
		margin: 0 8rpx;
		flex-shrink: 0;
	}

	&__sending-icon {
		width: 28rpx;
		height: 28rpx;
		border: 3rpx solid $text-muted;
		border-top-color: $color-primary;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	&__failed-icon {
		width: 36rpx;
		height: 36rpx;
		background: #EF4444;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	&__failed-text {
		color: #FFFFFF;
		font-size: 24rpx;
		font-weight: bold;
	}

	&__check {
		margin-bottom: 4rpx;
	}

	&__check-text {
		font-size: 22rpx;
		color: $text-muted;
		letter-spacing: -2rpx;

		&--read {
			color: $color-primary;
		}
	}
}

@keyframes spin {
	to { transform: rotate(360deg); }
}

// 深色模式
.bubble--dark {
	.time-divider__text {
		color: $dark-text-muted;
		background: $dark-bg-elevated;
	}

	.bubble__body--left {
		background: $dark-bg-card;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.2);
	}

	.bubble__body--right {
		background: linear-gradient(135deg, #2277ee 0%, #4499ff 100%);
	}

	.bubble__body--image {
		background: $dark-bg-card;
	}

	.bubble__text {
		color: $dark-text-primary;

		&--right {
			color: #FFFFFF;
		}
	}

	.bubble__sending-icon {
		border-color: $dark-text-muted;
		border-top-color: $dark-color-primary;
	}

	.bubble__check-text {
		color: $dark-text-muted;

		&--read {
			color: $dark-color-primary;
		}
	}

	.bubble__error-text {
		color: #F87171;
	}
}
</style>
