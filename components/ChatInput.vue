<template>
	<view class="chat-input" :class="{ 'chat-input--dark': isDark }">
		<!-- 功能按钮区域 -->
		<scroll-view
			v-if="showQuickActions && quickActions.length"
			class="chat-input__quick-actions"
			scroll-x
			:show-scrollbar="false"
		>
			<view class="quick-actions-inner">
				<view
					v-for="(action, index) in quickActions"
					:key="index"
					class="quick-action-btn"
					@click="handleQuickAction(action)"
				>
					<text class="quick-action-btn__icon">{{ action.icon }}</text>
					<text class="quick-action-btn__text">{{ action.text }}</text>
				</view>
			</view>
		</scroll-view>

		<view class="chat-input__wrapper">
			<!-- AI标识图标 -->
			<view class="chat-input__ai-icon">
				<view class="ai-sparkle"></view>
			</view>

			<!-- 输入框 -->
			<input
				class="chat-input__field"
				type="text"
				v-model="inputValue"
				:placeholder="placeholder"
				:disabled="disabled"
				@input="handleInput"
				@confirm="handleSend"
				@focus="handleFocus"
				@blur="handleBlur"
				confirm-type="send"
			/>

			<!-- 右侧按钮组 -->
			<view class="chat-input__actions">
				<!-- 语音按钮 -->
				<view class="chat-input__btn chat-input__btn--voice" @click="handleVoice">
					<image class="voice-icon" src="@/static/radio.svg" mode="aspectFit" />
				</view>

				<!-- 停止按钮（仅在AI回复中显示） -->
				<view
					v-if="isSending"
					class="chat-input__btn chat-input__btn--stop"
					@click="handleStop"
				>
					<view class="stop-icon"></view>
				</view>

				<!-- 发送按钮（AI回复中隐藏） -->
				<view
					v-else
					class="chat-input__btn chat-input__btn--send"
					:class="{ 'chat-input__btn--active': canSend }"
					@click="handleSend"
				>
					<image class="send-icon" src="@/static/send.svg" mode="aspectFit" />
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { isDarkMode } from '@/store/theme.js'

export default {
	name: 'ChatInput',
	props: {
		placeholder: {
			type: String,
			default: '描述您的症状或健康问题...'
		},
		disabled: {
			type: Boolean,
			default: false
		},
		isSending: {
			type: Boolean,
			default: false
		},
		value: {
			type: String,
			default: ''
		},
		quickActions: {
			type: Array,
			default: () => []
		},
		showQuickActions: {
			type: Boolean,
			default: false
		}
	},
	data() {
		return {
			inputValue: this.value,
			isFocused: false
		}
	},
	computed: {
		isDark() {
			return isDarkMode()
		},
		canSend() {
			return this.inputValue.trim().length > 0 && !this.disabled
		}
	},
	watch: {
		value(val) {
			this.inputValue = val
		}
	},
	methods: {
		handleInput(e) {
			this.inputValue = e.detail.value
			this.$emit('input', this.inputValue)
		},
		handleSend() {
			if (!this.canSend) return
			this.$emit('send', this.inputValue.trim())
			this.inputValue = ''
		},
		handleVoice() {
			this.$emit('voice')
			uni.showToast({ title: '语音功能开发中', icon: 'none' })
		},
		handleStop() {
			this.$emit('stop')
		},
		handleFocus() {
			this.isFocused = true
			this.$emit('focus')
		},
		handleBlur() {
			this.isFocused = false
			this.$emit('blur')
		},
		handleQuickAction(action) {
			this.$emit('quickAction', action)
		},
		// 外部调用清空输入
		clear() {
			this.inputValue = ''
		},
		// 外部调用设置值
		setValue(val) {
			this.inputValue = val
		}
	}
}
</script>

<style lang="scss" scoped>
.chat-input {
	position: fixed;
	left: 0;
	right: 0;
	bottom: calc(120rpx + env(safe-area-inset-bottom));
	z-index: 100;
	background: transparent;

	// 功能按钮区域
	&__quick-actions {
		white-space: nowrap;
		padding: 0 $spacing-lg;
		margin-bottom: $spacing-sm;
	}

	&__wrapper {
		display: flex;
		align-items: center;
		padding: $spacing-md $spacing-lg;
		background: $bg-card;
		margin: $spacing-md;
		margin-top: 0;
		border-radius: $radius-xl;
		box-shadow: $shadow-md;
	}

	&__ai-icon {
		width: 56rpx;
		height: 56rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: $spacing-sm;
		flex-shrink: 0;
	}

	&__field {
		flex: 1;
		height: 56rpx;
		font-size: $font-size-base;
		color: $text-primary;
		background: transparent;
	}

	&__actions {
		display: flex;
		align-items: center;
		gap: $spacing-sm;
		margin-left: $spacing-sm;
	}

	&__btn {
		width: 64rpx;
		height: 64rpx;
		border-radius: $radius-md;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.25s ease;

		&--voice {
			background: $bg-elevated;

			&:active {
				transform: scale(0.9);
			}
		}

		&--send {
			background: $bg-elevated;

			&.chat-input__btn--active {
				background: $gradient-ai;
				.send-icon {
					filter: brightness(0) invert(1);
				}
			}

			&:active {
				transform: scale(0.9);
			}
		}

		&--stop {
			background: rgba(239, 68, 68, 0.1);

			&:active {
				transform: scale(0.9);
			}
		}
	}


	// 深色模式
	&--dark {
		background: transparent;

		.chat-input__wrapper {
			background: $dark-bg-card;
		}

		.chat-input__field {
			color: $dark-text-primary;
		}

		.chat-input__btn--voice {
			background: $dark-bg-elevated;
		}

		.chat-input__btn--send {
			background: $dark-bg-elevated;

			&.chat-input__btn--active {
				background: $gradient-ai;
			}
		}

		.voice-icon,
		.send-icon {
			filter: invert(0.6);
		}

		.chat-input__btn--stop {
			background: rgba(239, 68, 68, 0.15);
		}

		.quick-action-btn {
			background: #2A2D32;
			border-color: #3A3D42;

			&:active {
				background: #353940;
			}

			&__text {
				color: #E5E5E5;
			}
		}
	}
}

// 功能按钮内层容器
.quick-actions-inner {
	display: inline-flex;
	gap: $spacing-md;
	padding: $spacing-xs 0;
}

// 功能按钮样式
.quick-action-btn {
	display: inline-flex;
	align-items: center;
	padding: 14rpx 24rpx;
	background: #FFFFFF;
	border: 2rpx solid #E8E8E8;
	border-radius: 36rpx;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
	transition: all 0.2s ease;
	flex-shrink: 0;

	&:active {
		transform: scale(0.96);
		background: #F5F5F5;
	}

	&__icon {
		font-size: 32rpx;
		margin-right: 8rpx;
	}

	&__text {
		font-size: 26rpx;
		color: #1A1A1A;
		font-weight: 500;
	}
}

// AI星光图标
.ai-sparkle {
	width: 32rpx;
	height: 32rpx;
	position: relative;

	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 8rpx;
		height: 32rpx;
		background: linear-gradient(180deg, #667EEA 0%, #F093FB 100%);
		border-radius: 4rpx;
	}

	&::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 0;
		transform: translateY(-50%);
		width: 32rpx;
		height: 8rpx;
		background: linear-gradient(90deg, #667EEA 0%, #F093FB 100%);
		border-radius: 4rpx;
	}
}

// 语音图标
.voice-icon {
	width: 36rpx;
	height: 36rpx;
}

// 发送图标
.send-icon {
	width: 36rpx;
	height: 36rpx;
}

// 停止图标 - 正方形
.stop-icon {
	width: 20rpx;
	height: 20rpx;
	background: $color-error;
	border-radius: 4rpx;
}
</style>
