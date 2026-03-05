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

		<view class="glow-border" :class="{ 'glow-border--recording': isVoiceMode && isRecording }">
			<view
				class="chat-input__wrapper"
				:class="{
					'chat-input__wrapper--voice': isVoiceMode,
					'chat-input__wrapper--recording': isVoiceMode && isRecording
				}"
			>
				<!-- ── 文字模式 ─────────────────────────────── -->
				<view v-if="!isVoiceMode" class="chat-input__ai-icon">
					<view class="ai-sparkle"></view>
				</view>

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

				<view v-if="!isVoiceMode" class="chat-input__actions">
					<view class="chat-input__btn chat-input__btn--voice" @click="toggleVoiceMode">
						<image class="voice-icon" src="@/static/radio.svg" mode="aspectFit" />
					</view>
					<view v-if="isSending" class="chat-input__btn chat-input__btn--stop" @click="handleStop">
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

				<!-- ── 语音模式 ─────────────────────────────── -->

				<!-- 触摸区：整个左侧区域均可按住录音 -->
				<view
					v-if="isVoiceMode"
					class="voice-area"
					@touchstart.stop="startRecording"
					@touchend.stop="stopRecording"
					@touchcancel.stop="cancelRecording"
				>
					<!-- 空闲态：脉冲点 + 文字 -->
					<template v-if="!isRecording">
						<view class="voice-idle-dot"></view>
						<text class="voice-area__text">按住说话</text>
					</template>

					<!-- 录制中：波形 + 文字 + 镜像波形（左右对称） -->
					<template v-else>
						<view class="waveform">
							<view v-for="n in 7" :key="n" class="waveform__bar" :class="`waveform__bar--${n}`"></view>
						</view>

						<text class="voice-area__text voice-area__text--recording">松开发送</text>

						<view class="waveform waveform--mirror">
							<view v-for="n in 7" :key="n" class="waveform__bar" :class="`waveform__bar--${n}`"></view>
						</view>
					</template>
				</view>

				<!-- 键盘按钮：独立于 voice-area，自身吸收 touch 防止触发录音 -->
				<view
					v-if="isVoiceMode"
					class="chat-input__btn chat-input__btn--keyboard"
					:class="{ 'chat-input__btn--disabled': isRecording }"
					@click.stop="toggleVoiceMode"
					@touchstart.stop
					@touchend.stop
				>
					<view class="keyboard-icon"></view>
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
		toggleVoiceMode() {
			if (this.isRecording) return
			this.isVoiceMode = !this.isVoiceMode
		},
		startRecording() {
			this.isRecording = true
			this.$emit('recordStart')
		},
		stopRecording() {
			if (!this.isRecording) return
			this.isRecording = false
			this.$emit('recordStop')
		},
		cancelRecording() {
			if (!this.isRecording) return
			this.isRecording = false
			this.$emit('recordCancel')
		},
		clear() {
			this.inputValue = ''
		},
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

	&__quick-actions {
		white-space: nowrap;
		padding: 0 $spacing-lg;
		margin-bottom: $spacing-sm;
	}

	&__wrapper {
		display: flex;
		align-items: center;
		// 文字模式与语音模式共用同一 padding，高度完全一致
		padding: $spacing-md $spacing-lg;
		background: $bg-card;
		border-radius: $radius-xl;
		position: relative;
		z-index: 1;
		transition: background 0.2s ease;

		// 录制中：极淡暖色底
		&--recording {
			background: #FFF8F8;
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
			&:active { transform: scale(0.9); }
		}

		// 键盘按钮：往左留出 8rpx 呼吸空间
		&--keyboard {
			background: $bg-elevated;
			color: $text-secondary;
			margin-right: 8rpx;
			&:active { transform: scale(0.9); }
		}

		&--disabled {
			opacity: 0.3;
			pointer-events: none;
		}

		&--send {
			background: $bg-elevated;
			&.chat-input__btn--active {
				background: $gradient-ai;
				.send-icon { filter: brightness(0) invert(1); }
			}
			&:active { transform: scale(0.9); }
		}

		&--stop {
			background: rgba(239, 68, 68, 0.1);
			&:active { transform: scale(0.9); }
		}
	}

	// 简明主题
	&--simple {
		.glow-border {
			padding: 0;
			&::before { display: none; }
		}
		.chat-input__btn--send.chat-input__btn--active { background: #4A90E2; }
		.ai-sparkle {
			&::before { background: #4A90E2; }
			&::after  { background: #4A90E2; }
		}
	}

	// 深色模式
	&--dark {
		.chat-input__wrapper {
			background: $dark-bg-card;
			&--recording { background: #1F1815; }
		}
		.glow-border { box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.3); }
		.chat-input__field { color: $dark-text-primary; }
		.chat-input__btn--voice,
		.chat-input__btn--keyboard { background: $dark-bg-elevated; }
		.chat-input__btn--keyboard { color: $dark-text-secondary; }
		.chat-input__btn--send {
			background: $dark-bg-elevated;
			&.chat-input__btn--active { background: $gradient-ai; }
		}
		.voice-icon, .send-icon { filter: invert(0.6); }
		.chat-input__btn--stop { background: rgba(239, 68, 68, 0.15); }

		.voice-area__text {
			color: $dark-text-secondary;
			&--recording { color: #F87171; }
		}

		.quick-action-btn {
			background: #2A2D32;
			border-color: #3A3D42;
			&:active { background: #353940; }
			&__text { color: #E5E5E5; }
		}
	}
}

// ── 功能快捷按钮 ──────────────────────────────────────────────────

.quick-actions-inner {
	display: inline-flex;
	gap: $spacing-md;
	padding: $spacing-xs 0;
}

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
	&:active { transform: scale(0.96); background: #F5F5F5; }
	&__icon { font-size: 32rpx; margin-right: 8rpx; }
	&__text { font-size: 26rpx; color: #1A1A1A; font-weight: 500; }
}

// ── 流光边框 ──────────────────────────────────────────────────────

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
		top: 50%; left: 50%;
		width: 150vw; height: 150vw;
		transform: translate(-50%, -50%);
		background: conic-gradient(
			from 0deg,
			#E2CBFF 0%, #393BB2 25%,
			#E2CBFF 50%, #393BB2 75%,
			#E2CBFF 100%
		);
		animation: glow-spin 4s linear infinite;
	}

	// 录制中：流光加速 + 切换为暖色
	&--recording::before {
		background: conic-gradient(
			from 0deg,
			#FFCDD2 0%, #EF4444 25%,
			#FFCDD2 50%, #F97316 75%,
			#FFCDD2 100%
		);
		animation-duration: 1.5s;
	}
}

@keyframes glow-spin {
	to { transform: translate(-50%, -50%) rotate(360deg); }
}

// ── AI 星光图标 ───────────────────────────────────────────────────

.ai-sparkle {
	width: 32rpx; height: 32rpx;
	position: relative;
	&::before {
		content: '';
		position: absolute;
		top: 0; left: 50%;
		transform: translateX(-50%);
		width: 8rpx; height: 32rpx;
		background: linear-gradient(180deg, #667EEA 0%, #F093FB 100%);
		border-radius: 4rpx;
	}
	&::after {
		content: '';
		position: absolute;
		top: 50%; left: 0;
		transform: translateY(-50%);
		width: 32rpx; height: 8rpx;
		background: linear-gradient(90deg, #667EEA 0%, #F093FB 100%);
		border-radius: 4rpx;
	}
}

// ── 图标尺寸 ──────────────────────────────────────────────────────

.voice-icon { width: 36rpx; height: 36rpx; }
.send-icon  { width: 36rpx; height: 36rpx; }
.stop-icon  { width: 20rpx; height: 20rpx; background: $color-error; border-radius: 4rpx; }

// ── 键盘图标（纯 CSS）────────────────────────────────────────────

.keyboard-icon {
	width: 36rpx; height: 27rpx;
	border: 2.5rpx solid currentColor;
	border-radius: 5rpx;
	position: relative;
	box-sizing: border-box;
	&::before {
		content: '';
		position: absolute;
		top: 6rpx; left: 6rpx;
		width: 5rpx; height: 5rpx;
		border-radius: 50%;
		background: currentColor;
		box-shadow: 9rpx 0 0 currentColor, 18rpx 0 0 currentColor;
	}
	&::after {
		content: '';
		position: absolute;
		bottom: 5rpx; left: 7rpx; right: 7rpx;
		height: 3.5rpx;
		border-radius: 2rpx;
		background: currentColor;
	}
}

// ── 语音触摸区 ────────────────────────────────────────────────────

.voice-area {
	flex: 1;
	// 高度与文字模式 input 对齐，保持 wrapper 总高度不变
	height: 64rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: $spacing-sm;
	animation: mode-in 0.25s ease;
}

// 空闲脉冲点
.voice-idle-dot {
	width: 18rpx; height: 18rpx;
	border-radius: 50%;
	background: $gradient-ai;
	flex-shrink: 0;
	animation: voice-pulse 1.5s ease-in-out infinite;
}

@keyframes voice-pulse {
	0%, 100% { opacity: 0.45; transform: scale(1);    }
	50%       { opacity: 1;    transform: scale(1.25); }
}

// 状态文字
.voice-area__text {
	font-size: 30rpx;
	font-weight: 500;
	color: $text-secondary;
	letter-spacing: 2rpx;
	transition: color 0.2s ease;
	flex-shrink: 0;

	&--recording {
		color: #EF4444;
		font-weight: 600;
	}
}

// ── 录制波形（左右各 7 根，对称排列）────────────────────────────

.waveform {
	display: flex;
	align-items: flex-end;
	gap: 4rpx;
	height: 36rpx;
	flex-shrink: 0;
	animation: mode-in 0.2s ease;

	// 右侧镜像：水平翻转，视觉上与左侧对称
	&--mirror {
		transform: scaleX(-1);
	}
}

.waveform__bar {
	width: 4rpx;
	height: 36rpx;
	border-radius: 2rpx;
	background: linear-gradient(180deg, #EF4444 0%, #F97316 100%);
	transform-origin: bottom center;
	animation: wave-active 0.6s ease-in-out infinite;
}

// 7 根柱子错开延迟，形成自然律动
.waveform__bar--1 { animation-delay: 0.00s; animation-duration: 0.55s; }
.waveform__bar--2 { animation-delay: 0.12s; animation-duration: 0.70s; }
.waveform__bar--3 { animation-delay: 0.24s; animation-duration: 0.45s; }
.waveform__bar--4 { animation-delay: 0.08s; animation-duration: 0.62s; }
.waveform__bar--5 { animation-delay: 0.36s; animation-duration: 0.75s; }
.waveform__bar--6 { animation-delay: 0.20s; animation-duration: 0.50s; }
.waveform__bar--7 { animation-delay: 0.44s; animation-duration: 0.65s; }

@keyframes wave-active {
	0%, 100% { transform: scaleY(0.18); }
	50%       { transform: scaleY(1.00); }
}

// ── 模式切换进入动画 ──────────────────────────────────────────────

@keyframes mode-in {
	from { opacity: 0; transform: translateY(6rpx); }
	to   { opacity: 1; transform: translateY(0);    }
}
</style>
