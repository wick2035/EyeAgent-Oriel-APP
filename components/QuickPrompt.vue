<template>
	<view class="prompt-card" :class="{ 'prompt-card--dark': isDark }" @click="handleClick">
		<view class="prompt-card__tag">#</view>
		<text class="prompt-card__text">{{ text }}</text>
		<view class="prompt-card__arrow"></view>
	</view>
</template>

<script>
import { isDarkMode } from '@/store/theme.js'

export default {
	name: 'QuickPrompt',
	props: {
		text: {
			type: String,
			required: true
		},
		id: {
			type: [String, Number],
			default: ''
		}
	},
	computed: {
		isDark() {
			return isDarkMode()
		}
	},
	methods: {
		handleClick() {
			this.$emit('click', { id: this.id, text: this.text })
		}
	}
}
</script>

<style lang="scss" scoped>
.prompt-card {
	display: flex;
	align-items: center;
	padding: $spacing-md $spacing-lg;
	background: $bg-card;
	border: 2rpx solid $border-color;
	border-radius: $radius-lg;
	margin-bottom: $spacing-md;
	transition: all 0.25s ease;

	&:active {
		transform: scale(0.98);
		background: $bg-elevated;
	}

	&__tag {
		width: 44rpx;
		height: 44rpx;
		background: rgba(30, 58, 95, 0.08);
		border-radius: $radius-sm;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: $font-size-lg;
		font-weight: $font-weight-semibold;
		color: $color-primary;
		margin-right: $spacing-md;
		flex-shrink: 0;
	}

	&__text {
		flex: 1;
		font-size: $font-size-base;
		color: $text-primary;
		line-height: $line-height-normal;
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

	// 深色模式
	&--dark {
		background: $dark-bg-card;
		border-color: $dark-border-color;

		&:active {
			background: $dark-bg-elevated;
		}

		.prompt-card__tag {
			background: rgba(74, 144, 217, 0.15);
			color: $dark-color-primary;
		}

		.prompt-card__text {
			color: $dark-text-primary;
		}

		.prompt-card__arrow {
			border-color: $dark-text-muted;
		}
	}
}
</style>
