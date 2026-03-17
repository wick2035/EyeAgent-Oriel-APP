<template>
	<view v-if="visible" class="typing" :class="{ 'typing--dark': isDark }">
		<text class="typing__text">对方正在输入</text>
		<view class="typing__dots">
			<view class="typing__dot" v-for="i in 3" :key="i" :style="{ animationDelay: (i - 1) * 200 + 'ms' }"></view>
		</view>
	</view>
</template>

<script>
import { isDarkMode } from '@/store/theme.js'

export default {
	name: 'TypingIndicator',
	props: {
		visible: {
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
.typing {
	display: flex;
	align-items: center;
	padding: $spacing-xs $spacing-lg;
	gap: 8rpx;

	&__text {
		font-size: $font-size-xs;
		color: $text-muted;
	}

	&__dots {
		display: flex;
		gap: 6rpx;
	}

	&__dot {
		width: 10rpx;
		height: 10rpx;
		border-radius: 50%;
		background: $text-muted;
		animation: typingBounce 1.4s ease-in-out infinite;
	}
}

@keyframes typingBounce {
	0%, 60%, 100% {
		transform: translateY(0);
		opacity: 0.4;
	}
	30% {
		transform: translateY(-8rpx);
		opacity: 1;
	}
}

.typing--dark {
	.typing__text {
		color: $dark-text-muted;
	}

	.typing__dot {
		background: $dark-text-muted;
	}
}
</style>
