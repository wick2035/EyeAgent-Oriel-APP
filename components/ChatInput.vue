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

				<view
					v-if="!isVoiceMode"
					class="chat-input__btn chat-input__btn--plus"
					@click="toggleMediaPanel"
				>
					<view class="plus-icon" :class="{ 'plus-icon--active': showMediaPanel }"></view>
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

				<view
					v-if="isVoiceMode"
					class="voice-area"
					@touchstart.stop="startRecording"
					@touchend.stop="stopRecording"
					@touchcancel.stop="cancelRecording"
				>
					<template v-if="!isRecording">
						<view class="voice-idle-dot"></view>
						<text class="voice-area__text">按住说话</text>
					</template>

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

		<!-- ── 媒体选项（贴在输入框下方，随动上移）──────────── -->
		<view
			v-if="showMediaPanel"
			class="media-tiles-wrap"
			:class="{ 'media-tiles-wrap--show': mediaPanelVisible }"
		>
			<view class="media-tiles" :class="{ 'media-tiles--show': mediaPanelVisible }">
				<view class="media-item" @click="handleMediaAction('camera')">
					<view class="media-item__icon">
						<image class="media-item__img" src="@/static/camera.svg" mode="aspectFit" />
					</view>
					<text class="media-item__label">拍照</text>
				</view>
				<view class="media-item" @click="handleMediaAction('album')">
					<view class="media-item__icon">
						<image class="media-item__img" src="@/static/photo.svg" mode="aspectFit" />
					</view>
					<text class="media-item__label">相册</text>
				</view>
				<view class="media-item" @click="handleMediaAction('file')">
					<view class="media-item__icon">
						<image class="media-item__img" src="@/static/uploadfolder.svg" mode="aspectFit" />
					</view>
					<text class="media-item__label">本地文件</text>
				</view>
			</view>
		</view>

		<!-- 透明遮罩：点击任意处关闭 -->
		<view
			v-if="showMediaPanel"
			class="media-dismiss"
			@click="closeMediaPanel"
		></view>
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
			isRecording: false,
			showMediaPanel: false,
			mediaPanelVisible: false
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
		// ── 媒体面板 ──────────────────────────────────────────
		toggleMediaPanel() {
			if (this.showMediaPanel) {
				this.closeMediaPanel()
				return
			}
			if (this.isFocused) {
				this.isFocused = false
				this.$emit('blur')
				setTimeout(() => this.openMediaPanel(), 150)
			} else {
				this.openMediaPanel()
			}
		},
		openMediaPanel() {
			this.showMediaPanel = true
			this.$nextTick(() => {
				setTimeout(() => { this.mediaPanelVisible = true }, 30)
			})
		},
		closeMediaPanel() {
			this.mediaPanelVisible = false
			setTimeout(() => { this.showMediaPanel = false }, 460)
		},
		handleMediaAction(type) {
			this.closeMediaPanel()
			setTimeout(() => {
				switch (type) {
					case 'camera':
						uni.chooseImage({
							count: 1,
							sourceType: ['camera'],
							success: (res) => {
								this.$emit('mediaSelect', { type, files: res.tempFilePaths })
							}
						})
						break
					case 'album':
						uni.chooseImage({
							count: 9,
							sourceType: ['album'],
							sizeType: ['compressed'],
							success: (res) => {
								this.$emit('mediaSelect', { type, files: res.tempFilePaths })
							}
						})
						break
					case 'file':
						uni.chooseFile({
							count: 1,
							type: 'all',
							success: (res) => {
								this.$emit('mediaSelect', { type, files: res.tempFilePaths })
							}
						})
						break
				}
			}, 480)
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
		padding: $spacing-md $spacing-lg;
		background: $bg-card;
		border-radius: $radius-xl;
		position: relative;
		z-index: 1;
		transition: background 0.2s ease;

		&--recording {
			background: #FFF8F8;
		}
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

		&--plus {
			background: $bg-elevated;
			margin-right: $spacing-sm;
			&:active { transform: scale(0.9); }
		}

		&--voice {
			background: $bg-elevated;
			&:active { transform: scale(0.9); }
		}

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
	}

	// 深色模式
	&--dark {
		.chat-input__wrapper {
			background: $dark-bg-card;
			&--recording { background: #1F1815; }
		}
		.glow-border { box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.3); }
		.chat-input__field { color: $dark-text-primary; }
		.chat-input__btn--plus,
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

		.plus-icon {
			&::before, &::after { background: $dark-text-secondary; }
		}

		.media-item__icon { background: $dark-bg-elevated; }
		.media-item__label { color: $dark-text-secondary; }
		.media-item__img { filter: invert(1); opacity: 0.6; }

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

// ── 图标尺寸 ──────────────────────────────────────────────────────

.voice-icon { width: 36rpx; height: 36rpx; }
.send-icon  { width: 36rpx; height: 36rpx; }
.stop-icon  { width: 20rpx; height: 20rpx; background: $color-error; border-radius: 4rpx; }

// ── + 号图标 ──────────────────────────────────────────────────────

.plus-icon {
	width: 22rpx; height: 22rpx;
	position: relative;
	transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);

	&--active {
		transform: rotate(45deg);
	}

	&::before {
		content: '';
		position: absolute;
		left: 50%; top: 0;
		transform: translateX(-50%);
		width: 3rpx; height: 22rpx;
		background: $text-secondary;
		border-radius: 2rpx;
	}
	&::after {
		content: '';
		position: absolute;
		top: 50%; left: 0;
		transform: translateY(-50%);
		width: 22rpx; height: 3rpx;
		background: $text-secondary;
		border-radius: 2rpx;
	}
}

// ── 键盘图标 ──────────────────────────────────────────────────────

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
	height: 64rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: $spacing-sm;
	animation: mode-in 0.25s ease;
}

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

// ── 录制波形 ──────────────────────────────────────────────────────

.waveform {
	display: flex;
	align-items: flex-end;
	gap: 4rpx;
	height: 36rpx;
	flex-shrink: 0;
	animation: mode-in 0.2s ease;
	&--mirror { transform: scaleX(-1); }
}

.waveform__bar {
	width: 4rpx; height: 36rpx;
	border-radius: 2rpx;
	background: linear-gradient(180deg, #EF4444 0%, #F97316 100%);
	transform-origin: bottom center;
	animation: wave-active 0.6s ease-in-out infinite;
}

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

// ── 媒体选项区域 ──────────────────────────────────────────────────

// 透明遮罩：仅用于点击收起，不遮挡视觉
.media-dismiss {
	position: fixed;
	top: 0; right: 0; bottom: 0; left: 0;
	z-index: 99;   // 低于 chat-input(100)，高于页面内容
}

// 高度动画容器：驱动输入框上移
.media-tiles-wrap {
	overflow: hidden;
	max-height: 0;
	transition: max-height 0.45s cubic-bezier(0.16, 1, 0.3, 1);
	position: relative;
	z-index: 101;  // 确保在遮罩之上可点击

	&--show {
		max-height: 260rpx;
	}
}

// 三个色块行
.media-tiles {
	display: flex;
	flex-direction: row;
	justify-content: space-around;
	align-items: flex-start;
	padding: $spacing-xs $spacing-lg $spacing-md;
	opacity: 0;
	transform: translateY(14rpx);
	transition:
		opacity 0.3s ease 0.06s,
		transform 0.45s cubic-bezier(0.16, 1, 0.3, 1) 0.06s;

	&--show {
		opacity: 1;
		transform: translateY(0);
	}
}

.media-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: $spacing-xs;
	flex: 1;

	&:active .media-item__icon {
		transform: scale(0.88);
		opacity: 0.8;
	}
}

.media-item__icon {
	width: 96rpx; height: 96rpx;
	border-radius: $radius-lg;
	background: #F2F4F7;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.18s ease;
}

.media-item__label {
	font-size: 24rpx;
	color: $text-secondary;
	font-weight: 500;
	text-align: center;
	letter-spacing: 0.5rpx;
}

// ── 媒体图标（SVG 图片）──────────────────────────────────────────

.media-item__img {
	width: 48rpx;
	height: 48rpx;
	opacity: 0.65;
}

// ── 模式切换进入动画 ──────────────────────────────────────────────

@keyframes mode-in {
	from { opacity: 0; transform: translateY(6rpx); }
	to   { opacity: 1; transform: translateY(0);    }
}
</style>
