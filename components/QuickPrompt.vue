<template>
	<view class="prompt-tag" :class="{ 'prompt-tag--dark': isDark }" @click="handleClick">
		<text class="prompt-tag__text">{{ text }}</text>
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
.prompt-tag {
	display: inline-flex;
	align-items: center;
	padding: 16rpx 28rpx;
	background: #F2F3F5;
	border-radius: 32rpx;
	transition: all 0.2s ease;

	&:active {
		transform: scale(0.96);
		background: #E8E9EB;
	}

	&__text {
		font-size: 28rpx;
		color: #1A1A1A;
		line-height: 1.4;
		white-space: nowrap;
	}

	// 深色模式
	&--dark {
		background: #2A2D32;

		&:active {
			background: #353940;
		}

		.prompt-tag__text {
			color: #E5E5E5;
		}
	}
}
</style>
