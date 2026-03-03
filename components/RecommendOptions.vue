<template>
	<view v-if="options && options.length" class="recommend-options" :class="{ 'recommend-options--dark': isDark }">
		<!-- 标签选择区 -->
		<view class="chip-container">
			<view
				v-for="(option, index) in visibleOptions"
				:key="option.option_id"
				class="chip"
				:class="{ 'chip--selected': isSelected(option.option_id) }"
				:style="{ animationDelay: (index * 0.04) + 's' }"
				@click="toggleSelect(option)"
			>
				<text class="chip__label">{{ option.label }}</text>
			</view>
		</view>

		<!-- 提示文字 -->
		<text class="recommend-options__hint">{{ streaming ? '选项加载中，请稍候…' : '若无合适选项（多选），也可以打字直接告诉我' }}</text>

		<!-- 确认按钮 -->
		<view
			class="confirm-btn"
			:class="{ 'confirm-btn--disabled': selectedIds.length === 0 || streaming }"
			@click="handleConfirm"
		>
			<text class="confirm-btn__text">确认选择</text>
		</view>
	</view>
</template>

<script>
import { isDarkMode } from '@/store/theme.js'

export default {
	name: 'RecommendOptions',
	props: {
		options: {
			type: Array,
			required: true
		},
		streaming: {
			type: Boolean,
			default: false
		}
	},
	data() {
		return {
			selectedIds: []
		}
	},
	computed: {
		isDark() {
			return isDarkMode()
		},
		visibleOptions() {
			return this.options.filter(opt => !opt.label || !opt.label.includes('其他'))
		}
	},
	methods: {
		isSelected(optionId) {
			return this.selectedIds.indexOf(optionId) !== -1
		},

		toggleSelect(option) {
			const idx = this.selectedIds.indexOf(option.option_id)
			if (idx === -1) {
				this.selectedIds.push(option.option_id)
			} else {
				this.selectedIds.splice(idx, 1)
			}
		},

		handleConfirm() {
			if (this.selectedIds.length === 0 || this.streaming) return
			const selected = this.options.filter(
				opt => this.selectedIds.indexOf(opt.option_id) !== -1
			)
			this.$emit('confirm', selected)
			this.selectedIds = []
		}
	}
}
</script>

<style lang="scss" scoped>
.recommend-options {
	margin-top: $spacing-md;
	padding: 0;

	&__hint {
		display: block;
		text-align: center;
		font-size: $font-size-xs;
		color: $text-muted;
		margin-top: $spacing-sm;
		margin-bottom: $spacing-sm;
		padding: 0 $spacing-sm;
	}

	&--dark {
		.chip {
			background: $dark-bg-elevated;
			border-color: rgba(255, 255, 255, 0.08);
		}

		.chip__label {
			color: $dark-text-primary;
		}

		.chip--selected {
			background: $gradient-ai;
			border-color: transparent;
		}

		.chip--selected .chip__label {
			color: #FFFFFF;
		}

		.confirm-btn {
			background: $gradient-ai;
		}

		.confirm-btn--disabled {
			background: $dark-bg-elevated;
		}

		.confirm-btn--disabled .confirm-btn__text {
			color: $dark-text-muted;
		}

		.recommend-options__hint {
			color: $dark-text-muted;
		}
	}
}

.chip-container {
	display: flex;
	flex-wrap: wrap;
	gap: $spacing-sm;
}

.chip {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	height: 56rpx;
	padding: 0 $spacing-md;
	background: #F2F3F5;
	border: 1rpx solid rgba(102, 126, 234, 0.12);
	border-radius: $radius-full;
	transition: all $transition-normal;
	animation: chipEnter 0.3s cubic-bezier(0.16, 1, 0.3, 1) backwards;

	&:active {
		transform: scale(0.95);
	}

	&--selected {
		background: $gradient-ai;
		border-color: transparent;
		box-shadow: 0 2rpx 12rpx rgba(102, 126, 234, 0.3);
	}

	&--selected .chip__label {
		color: #FFFFFF;
	}

	&__label {
		font-size: $font-size-base;
		color: $text-primary;
		line-height: 1;
		white-space: nowrap;
	}
}

.confirm-btn {
	margin-top: $spacing-md;
	height: 72rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: $gradient-ai;
	border-radius: $radius-full;
	transition: all $transition-normal;

	&:active {
		transform: scale(0.97);
		opacity: 0.9;
	}

	&--disabled {
		background: $bg-elevated;
		opacity: 0.6;
	}

	&--disabled .confirm-btn__text {
		color: $text-muted;
	}

	&__text {
		font-size: $font-size-base;
		font-weight: $font-weight-medium;
		color: #FFFFFF;
	}
}

@keyframes chipEnter {
	from {
		opacity: 0;
		transform: translateY(12rpx);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}
</style>
