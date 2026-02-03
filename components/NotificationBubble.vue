<template>
	<view
		class="notif-bubble"
		:class="[`notif-bubble--${typeClass}`, { 'notif-bubble--unread': isUnread, 'notif-bubble--dark': isDark }]"
		@click="$emit('click')"
	>
		<view class="notif-bubble__card">
			<!-- 顶部彩色装饰条 -->
			<view class="notif-bubble__bar" :class="`notif-bubble__bar--${typeClass}`"></view>

			<!-- 未读指示点 -->
			<view v-if="isUnread" class="notif-bubble__dot"></view>

			<!-- 标题 -->
			<text class="notif-bubble__title">{{ title }}</text>

			<!-- 内容 -->
			<text class="notif-bubble__content">{{ content }}</text>

			<!-- 底部 -->
			<view class="notif-bubble__footer">
				<text class="notif-bubble__time">{{ time }}</text>
				<text v-if="hasAction" class="notif-bubble__action" @click.stop="$emit('action')">
					查看详情 >
				</text>
			</view>
		</view>
	</view>
</template>

<script>
import { isDarkMode } from '@/store/theme.js'

export default {
	name: 'NotificationBubble',
	props: {
		typeClass: {
			type: String,
			default: 'system'
		},
		title: {
			type: String,
			default: ''
		},
		content: {
			type: String,
			default: ''
		},
		time: {
			type: String,
			default: ''
		},
		isUnread: {
			type: Boolean,
			default: false
		},
		hasAction: {
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
.notif-bubble {
	padding: 0 $spacing-lg;
	margin-bottom: $spacing-md;
	animation: bubbleIn 0.3s $ease-in-out-smooth forwards;
	opacity: 0;

	&__card {
		position: relative;
		background: $bg-card;
		border-radius: $radius-lg;
		box-shadow: $shadow-sm;
		overflow: hidden;
		padding: $spacing-lg;
		padding-top: $spacing-md;
		transition: transform 0.15s ease, background 0.15s ease;

		&:active {
			transform: scale(0.98);
			background: $bg-elevated;
		}
	}

	&__bar {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 6rpx;

		&--system {
			background: linear-gradient(90deg, #3B82F6 0%, #60A5FA 50%, #93C5FD 100%);
		}
		&--reserve {
			background: linear-gradient(90deg, #10B981 0%, #34D399 50%, #6EE7B7 100%);
		}
		&--medication {
			background: linear-gradient(90deg, #F59E0B 0%, #FBBF24 50%, #FCD34D 100%);
		}
	}

	&__dot {
		position: absolute;
		top: $spacing-md;
		right: $spacing-md;
		width: 14rpx;
		height: 14rpx;
		background: $color-accent;
		border-radius: 50%;
		z-index: 2;
	}

	&__title {
		font-size: $font-size-md;
		font-weight: $font-weight-semibold;
		color: $text-primary;
		line-height: $line-height-tight;
		margin-bottom: $spacing-sm;
		padding-right: $spacing-lg;
	}

	&__content {
		font-size: $font-size-sm;
		color: $text-secondary;
		line-height: $line-height-relaxed;
		display: -webkit-box;
		-webkit-line-clamp: 4;
		-webkit-box-orient: vertical;
		overflow: hidden;
		margin-bottom: $spacing-sm;
	}

	&__footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: $spacing-sm;
		border-top: 1rpx solid $border-color-light;
	}

	&__time {
		font-size: $font-size-xs;
		color: $text-muted;
	}

	&__action {
		font-size: $font-size-xs;
		color: $color-primary;
		font-weight: $font-weight-medium;
	}
}

@keyframes bubbleIn {
	from {
		opacity: 0;
		transform: translateY(20rpx);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

// 深色模式
.notif-bubble--dark {
	.notif-bubble__card {
		background: $dark-bg-card;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.15);

		&:active {
			background: $dark-bg-elevated;
		}
	}

	.notif-bubble__dot {
		background: $dark-color-accent;
	}

	.notif-bubble__title {
		color: $dark-text-primary;
	}

	.notif-bubble__content {
		color: $dark-text-secondary;
	}

	.notif-bubble__footer {
		border-top-color: $dark-border-color-light;
	}

	.notif-bubble__time {
		color: $dark-text-muted;
	}

	.notif-bubble__action {
		color: $dark-color-primary;
	}
}
</style>
