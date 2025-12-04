<template>
	<view class="message" :class="[`message--${type}`, { 'message--dark': isDark }]">
		<!-- AI消息 -->
		<view v-if="type === 'ai'" class="message__avatar">
			<view class="ai-avatar">
				<view class="ai-petal ai-petal--1"></view>
				<view class="ai-petal ai-petal--2"></view>
				<view class="ai-petal ai-petal--3"></view>
				<view class="ai-petal ai-petal--4"></view>
				<view class="ai-petal ai-petal--5"></view>
			</view>
		</view>

		<view class="message__content">
			<view class="message__bubble">
				<!-- 打字机效果（AI思考中） -->
				<view v-if="loading" class="typing-indicator">
					<view class="typing-dot"></view>
					<view class="typing-dot"></view>
					<view class="typing-dot"></view>
				</view>
				<!-- 消息文本 -->
				<text v-else class="message__text">{{ content }}</text>
			</view>
			<text v-if="time" class="message__time">{{ time }}</text>
		</view>

		<!-- 用户消息 -->
		<view v-if="type === 'user'" class="message__avatar message__avatar--user">
			<text class="user-avatar">我</text>
		</view>
	</view>
</template>

<script>
import { isDarkMode } from '@/store/theme.js'

export default {
	name: 'MessageBubble',
	props: {
		type: {
			type: String,
			default: 'ai', // 'ai' | 'user'
			validator: val => ['ai', 'user'].includes(val)
		},
		content: {
			type: String,
			default: ''
		},
		time: {
			type: String,
			default: ''
		},
		loading: {
			type: Boolean,
			default: false
		}
	},
	computed: {
		isDark() {
			return isDarkMode()
		}
	}
}
</script>

<style lang="scss" scoped>
.message {
	display: flex;
	align-items: flex-start;
	padding: $spacing-md $spacing-lg;
	animation: messageIn 0.3s ease;

	&--user {
		justify-content: flex-end;

		.message__content {
			display: flex;
			flex-direction: column;
			align-items: flex-end;
		}

		.message__bubble {
			background: $color-primary;
			color: #fff;
			border-radius: $radius-lg $radius-lg 8rpx $radius-lg;
		}

		.message__text {
			color: #fff;
		}

		.message__time {
			text-align: right;
		}

		.message__avatar {
			margin-left: $spacing-md;
			margin-right: 0;
			order: 1;
		}
	}

	&--ai {
		.message__bubble {
			background: $bg-card;
			border: 1rpx solid $border-color-light;
			border-radius: $radius-lg $radius-lg $radius-lg 8rpx;
		}
	}

	&__avatar {
		width: 72rpx;
		height: 72rpx;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		margin-right: $spacing-md;

		&--user {
			background: $color-primary-light;
		}
	}

	&__content {
		max-width: calc(100% - 160rpx);
	}

	&__bubble {
		display: inline-block;
		padding: $spacing-md $spacing-lg;
		box-shadow: $shadow-sm;
		max-width: 100%;
	}

	&__text {
		font-size: $font-size-base;
		line-height: $line-height-relaxed;
		word-break: break-word;
	}

	&__time {
		font-size: $font-size-xs;
		color: $text-muted;
		margin-top: $spacing-xs;
		display: block;
	}

	// 深色模式
	&--dark {
		&.message--ai .message__bubble {
			background: $dark-bg-card;
			border-color: $dark-border-color;
		}

		&.message--ai .message__text {
			color: $dark-text-primary;
		}

		&.message--user .message__bubble {
			background: $dark-color-primary;
		}

		&.message--user .message__text {
			color: #fff;
		}

		.message__time {
			color: $dark-text-muted;
		}

		.message__avatar--user {
			background: $dark-color-primary;
		}
	}
}

// AI头像
.ai-avatar {
	width: 48rpx;
	height: 48rpx;
	position: relative;
	animation: ai-rotate 6s linear infinite;
}

.ai-petal {
	position: absolute;
	width: 10rpx;
	height: 18rpx;
	border-radius: 5rpx;
	top: 50%;
	left: 50%;
	transform-origin: center 14rpx;
	margin-left: -5rpx;
	margin-top: -14rpx;

	&--1 { background: #FF6B6B; transform: rotate(0deg); }
	&--2 { background: #4ECDC4; transform: rotate(72deg); }
	&--3 { background: #45B7D1; transform: rotate(144deg); }
	&--4 { background: #96CEB4; transform: rotate(216deg); }
	&--5 { background: #DDA0DD; transform: rotate(288deg); }
}

// 用户头像
.user-avatar {
	font-size: $font-size-sm;
	color: #fff;
	font-weight: $font-weight-semibold;
}

// 打字指示器
.typing-indicator {
	display: flex;
	align-items: center;
	gap: 8rpx;
	padding: 8rpx 0;
}

.typing-dot {
	width: 12rpx;
	height: 12rpx;
	background: $text-muted;
	border-radius: 50%;
	animation: typingBounce 1.4s ease-in-out infinite;

	&:nth-child(2) { animation-delay: 0.2s; }
	&:nth-child(3) { animation-delay: 0.4s; }
}

@keyframes ai-rotate {
	from { transform: rotate(0deg); }
	to { transform: rotate(360deg); }
}

@keyframes messageIn {
	from {
		opacity: 0;
		transform: translateY(20rpx);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

@keyframes typingBounce {
	0%, 60%, 100% {
		transform: translateY(0);
	}
	30% {
		transform: translateY(-8rpx);
	}
}
</style>
