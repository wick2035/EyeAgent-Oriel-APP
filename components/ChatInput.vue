<template>
	<view class="chat-input" :class="{ 'chat-input--dark': isDark, 'chat-input--simple': !isDark && bubbleTheme === 'simple' }">
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

		<view class="glow-border">
			<view
				class="chat-input__wrapper"
				:class="{ 'chat-input__wrapper--voice': isVoiceMode }"
			>
				<!-- AI标识图标（仅文字模式） -->
				<view v-if="!isVoiceMode" class="chat-input__ai-icon">
					<view class="ai-sparkle"></view>
				</view>

				<!-- 文字模式：输入框 -->
				<input
					v-if="!isVoiceMode"
					class="chat-input__field"
					type="text"
					v-model="inputValue"
					:placeholder="placeholder"
					:disabled="disabled"
					:cursor-spacing="20"
					@input="handleInput"
					@confirm="handleSend"
					@focus="handleFocus"
					@blur="handleBlur"
					confirm-type="send"
				/>

				<!-- 语音模式 -->
				<view v-else class="voice-mode">
					<!-- 波形：仅按住时显示 -->
					<view v-if="isRecording" class="waveform">
						<view
							v-for="n in 13"
							:key="n"
							class="waveform__bar"
							:class="`waveform__bar--${n}`"
						></view>
					</view>

					<!-- 底部操作行：按住说话按钮 + 键盘图标 -->
					<view class="voice-mode__bottom">
						<view
							class="voice-record-btn"
							:class="{ 'voice-record-btn--recording': isRecording }"
							@touchstart.stop="startRecording"
							@touchend.stop="stopRecording"
							@touchcancel.stop="cancelRecording"
						>
							<text class="voice-record-btn__text">{{ isRecording ? '松开发送' : '按住说话' }}</text>
						</view>

						<view
							class="chat-input__btn chat-input__btn--keyboard"
							:class="{ 'chat-input__btn--disabled': isRecording }"
							@click="toggleVoiceMode"
						>
							<view class="keyboard-icon"></view>
						</view>
					</view>
				</view>

				<!-- 文字模式：右侧按钮组 -->
				<view v-if="!isVoiceMode" class="chat-input__actions">
					<view
						class="chat-input__btn chat-input__btn--voice"
						@click="toggleVoiceMode"
					>
						<image class="voice-icon" src="@/static/radio.svg" mode="aspectFit" />
					</view>

					<view
						v-if="isSending"
						class="chat-input__btn chat-input__btn--stop"
						@click="handleStop"
					>
						<view class="stop-icon"></view>
					</view>
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
	</view>
</template>

<script>
import { isDarkMode, themeState } from '@/store/theme.js'

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
			isFocused: false,
			isVoiceMode: false,
			isRecording: false
		}
	},
	computed: {
		isDark() {
			return isDarkMode()
		},
		bubbleTheme() {
			return themeState.bubbleTheme
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
	mounted() {
		uni.onKeyboardHeightChange(res => {
			this.$emit('keyboardChange', res.height)
		})
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
		// 切换语音 / 文字模式
		toggleVoiceMode() {
			if (this.isRecording) return
			this.isVoiceMode = !this.isVoiceMode
		},
		// 开始录音（touchstart）
		startRecording() {
			this.isRecording = true
			this.$emit('recordStart')
		},
		// 停止录音并发送（touchend）
		stopRecording() {
			if (!this.isRecording) return
			this.isRecording = false
			this.$emit('recordStop')
		},
		// 取消录音（touchcancel）
		cancelRecording() {
			if (!this.isRecording) return
			this.isRecording = false
			this.$emit('recordCancel')
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
		border-radius: $radius-xl;
		position: relative;
		z-index: 1;

		// 语音模式：竖向布局
		&--voice {
			flex-direction: column;
			align-items: stretch;
			padding: $spacing-md $spacing-lg;
			gap: $spacing-sm;
		}
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
		animation: mode-in 0.25s ease;
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
		flex-shrink: 0;

		&--voice {
			background: $bg-elevated;

			&:active {
				transform: scale(0.9);
			}
		}

		&--keyboard {
			background: $bg-elevated;
			color: $text-secondary;

			&:active {
				transform: scale(0.9);
			}
		}

		&--disabled {
			opacity: 0.35;
			pointer-events: none;
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

	// 简明主题（仅浅色模式）
	&--simple {
		.glow-border {
			padding: 0;

			&::before {
				display: none;
			}
		}

		.chat-input__btn--send.chat-input__btn--active {
			background: #4A90E2;
		}

		.ai-sparkle {
			&::before {
				background: #4A90E2;
			}

			&::after {
				background: #4A90E2;
			}
		}
	}

	// 深色模式
	&--dark {
		background: transparent;

		.chat-input__wrapper {
			background: $dark-bg-card;
		}

		.glow-border {
			box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.3);
		}

		.chat-input__field {
			color: $dark-text-primary;
		}

		.chat-input__btn--voice {
			background: $dark-bg-elevated;
		}

		.chat-input__btn--keyboard {
			background: $dark-bg-elevated;
			color: $dark-text-secondary;
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

// 流光边框容器
.glow-border {
	position: relative;
	overflow: hidden;
	border-radius: $radius-xl;
	padding: 2rpx;
	margin: $spacing-md;
	margin-top: 0;
	box-shadow: $shadow-md;

	&::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		width: 150vw;
		height: 150vw;
		transform: translate(-50%, -50%);
		background: conic-gradient(
			from 0deg,
			#E2CBFF 0%,
			#393BB2 25%,
			#E2CBFF 50%,
			#393BB2 75%,
			#E2CBFF 100%
		);
		animation: glow-spin 4s linear infinite;
	}
}

@keyframes glow-spin {
	to {
		transform: translate(-50%, -50%) rotate(360deg);
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

// 键盘图标（纯CSS绘制）
.keyboard-icon {
	width: 36rpx;
	height: 27rpx;
	border: 2.5rpx solid currentColor;
	border-radius: 5rpx;
	position: relative;
	box-sizing: border-box;

	// 上排三个按键点
	&::before {
		content: '';
		position: absolute;
		top: 6rpx;
		left: 6rpx;
		width: 5rpx;
		height: 5rpx;
		border-radius: 50%;
		background: currentColor;
		box-shadow: 9rpx 0 0 currentColor, 18rpx 0 0 currentColor;
	}

	// 下方空格键
	&::after {
		content: '';
		position: absolute;
		bottom: 5rpx;
		left: 7rpx;
		right: 7rpx;
		height: 3.5rpx;
		border-radius: 2rpx;
		background: currentColor;
	}
}

// ─── 语音模式布局 ─────────────────────────────────────────────

.voice-mode {
	display: flex;
	flex-direction: column;
	gap: $spacing-sm;
	animation: mode-in 0.25s ease;
}

// 底部操作行：记录按钮 + 键盘图标
.voice-mode__bottom {
	display: flex;
	align-items: center;
	gap: $spacing-sm;
}

// ─── 波形动效（仅录制时显示）────────────────────────────────────

.waveform {
	display: flex;
	align-items: flex-end;
	justify-content: center;
	height: 56rpx;
	gap: 7rpx;
	padding-bottom: 4rpx;
	animation: mode-in 0.2s ease;
}

.waveform__bar {
	width: 6rpx;
	height: 48rpx;
	border-radius: 3rpx;
	background: linear-gradient(180deg, #667EEA 0%, #F093FB 100%);
	transform-origin: bottom center;
	animation: wave-active 0.6s ease-in-out infinite;
}

// 13根柱子各自错开延迟与时长，形成自然声波律动
.waveform__bar--1  { animation-delay: 0.00s; animation-duration: 0.55s; }
.waveform__bar--2  { animation-delay: 0.12s; animation-duration: 0.70s; }
.waveform__bar--3  { animation-delay: 0.24s; animation-duration: 0.45s; }
.waveform__bar--4  { animation-delay: 0.36s; animation-duration: 0.60s; }
.waveform__bar--5  { animation-delay: 0.08s; animation-duration: 0.75s; }
.waveform__bar--6  { animation-delay: 0.20s; animation-duration: 0.50s; }
.waveform__bar--7  { animation-delay: 0.44s; animation-duration: 0.65s; }
.waveform__bar--8  { animation-delay: 0.16s; animation-duration: 0.48s; }
.waveform__bar--9  { animation-delay: 0.32s; animation-duration: 0.72s; }
.waveform__bar--10 { animation-delay: 0.04s; animation-duration: 0.58s; }
.waveform__bar--11 { animation-delay: 0.28s; animation-duration: 0.42s; }
.waveform__bar--12 { animation-delay: 0.40s; animation-duration: 0.68s; }
.waveform__bar--13 { animation-delay: 0.10s; animation-duration: 0.53s; }

@keyframes wave-active {
	0%, 100% { transform: scaleY(0.18); }
	50%       { transform: scaleY(1.00); }
}

// ─── 按住说话按钮 ─────────────────────────────────────────────

.voice-record-btn {
	flex: 1;
	height: 88rpx;
	border-radius: 44rpx;
	background: $gradient-ai;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 8rpx 24rpx rgba(102, 126, 234, 0.35);
	transition: background 0.15s ease, box-shadow 0.15s ease, transform 0.1s ease;

	&--recording {
		background: linear-gradient(135deg, #EF4444 0%, #F97316 100%);
		box-shadow: 0 8rpx 32rpx rgba(239, 68, 68, 0.4);
		transform: scale(0.97);
	}

	&__text {
		font-size: 32rpx;
		font-weight: 600;
		color: #FFFFFF;
		letter-spacing: 4rpx;
	}
}

// ─── 模式切换进入动画 ─────────────────────────────────────────

@keyframes mode-in {
	from {
		opacity: 0;
		transform: translateY(8rpx);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}
</style>
