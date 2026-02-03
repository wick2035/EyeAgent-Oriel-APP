<template>
	<view class="search-bar" :class="{ 'search-bar--dark': isDark, 'search-bar--focused': focused }">
		<view class="search-bar__inner">
			<!-- 搜索图标 -->
			<view class="search-bar__icon"></view>
			<input
				class="search-bar__input"
				type="text"
				:value="value"
				:placeholder="placeholder"
				:placeholder-style="isDark ? 'color: #484F58' : 'color: #9AABBF'"
				confirm-type="search"
				@input="onInput"
				@focus="onFocus"
				@blur="onBlur"
				@confirm="$emit('confirm', $event.detail.value)"
			/>
			<view v-if="value" class="search-bar__clear" @click="$emit('clear')">
				<view class="search-bar__clear-icon"></view>
			</view>
		</view>
	</view>
</template>

<script>
import { isDarkMode } from '@/store/theme.js'

export default {
	name: 'SearchBar',
	props: {
		value: {
			type: String,
			default: ''
		},
		placeholder: {
			type: String,
			default: '搜索'
		}
	},
	data() {
		return {
			focused: false
		}
	},
	computed: {
		isDark() {
			return isDarkMode()
		}
	},
	methods: {
		onInput(e) {
			this.$emit('input', e.detail.value)
		},
		onFocus() {
			this.focused = true
			this.$emit('focus')
		},
		onBlur() {
			this.focused = false
			this.$emit('blur')
		}
	}
}
</script>

<style lang="scss" scoped>
.search-bar {
	padding: $spacing-sm $spacing-lg;

	&__inner {
		display: flex;
		align-items: center;
		height: 72rpx;
		background: $bg-elevated;
		border-radius: $radius-full;
		padding: 0 $spacing-md;
		border: 1rpx solid transparent;
		transition: background 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
	}

	&--focused .search-bar__inner {
		background: $bg-card;
		box-shadow: 0 2rpx 12rpx rgba(30, 58, 95, 0.08);
		border-color: rgba(30, 58, 95, 0.15);
	}

	&__icon {
		width: 28rpx;
		height: 28rpx;
		margin-right: $spacing-sm;
		flex-shrink: 0;
		position: relative;

		&::before {
			content: '';
			position: absolute;
			top: 2rpx;
			left: 2rpx;
			width: 18rpx;
			height: 18rpx;
			border: 3rpx solid $text-muted;
			border-radius: 50%;
		}

		&::after {
			content: '';
			position: absolute;
			bottom: 2rpx;
			right: 2rpx;
			width: 10rpx;
			height: 3rpx;
			background: $text-muted;
			border-radius: 2rpx;
			transform: rotate(45deg);
			transform-origin: right center;
		}
	}

	&__input {
		flex: 1;
		font-size: $font-size-base;
		color: $text-primary;
		background: transparent;
		height: 72rpx;
		line-height: 72rpx;
	}

	&__clear {
		width: 36rpx;
		height: 36rpx;
		margin-left: $spacing-xs;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	&__clear-icon {
		width: 28rpx;
		height: 28rpx;
		background: $text-muted;
		border-radius: 50%;
		position: relative;

		&::before,
		&::after {
			content: '';
			position: absolute;
			top: 50%;
			left: 50%;
			width: 14rpx;
			height: 2rpx;
			background: $bg-card;
			border-radius: 1rpx;
		}

		&::before {
			transform: translate(-50%, -50%) rotate(45deg);
		}

		&::after {
			transform: translate(-50%, -50%) rotate(-45deg);
		}
	}
}

// 深色模式
.search-bar--dark {
	.search-bar__inner {
		background: $dark-bg-elevated;
	}

	&.search-bar--focused .search-bar__inner {
		background: $dark-bg-card;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.2);
		border-color: rgba(74, 144, 217, 0.2);
	}

	.search-bar__icon {
		&::before {
			border-color: $dark-text-muted;
		}
		&::after {
			background: $dark-text-muted;
		}
	}

	.search-bar__input {
		color: $dark-text-primary;
	}

	.search-bar__clear-icon {
		background: $dark-text-muted;

		&::before,
		&::after {
			background: $dark-bg-card;
		}
	}
}
</style>
