<template>
	<view class="training" :class="{ 'training--dark': isDark }">
		<!-- 渐变漂移背景 -->
		<view class="training__bg"></view>

		<!-- 准备倒计时 -->
		<view v-if="phase === 'ready'" class="ready-phase">
			<text class="ready-phase__title" :class="{ 'fade-in': readyVisible }">准备开始</text>
			<text class="ready-phase__count" :key="readyCount">{{ readyCount }}</text>
			<text class="ready-phase__hint" :class="{ 'fade-in': readyVisible }">放松你的眼睛</text>
		</view>

		<!-- 锻炼进行中 -->
		<view v-if="phase === 'active'" class="active-phase">
			<!-- 眼球运动：大箭头指示方向（Eyeye风格） -->
			<view v-if="exerciseType === 'eye-movement'" class="arrow-area">
				<!-- 箭头模式：屏幕中央大箭头 -->
				<view v-if="!eyeRestMode" class="big-arrow-wrap">
					<view
						class="big-arrow"
						:style="{ transform: 'rotate(' + arrowAngle + 'deg)' }"
						:key="'arrow-' + currentStep"
					>
						<view class="big-arrow__shaft"></view>
						<view class="big-arrow__head-left"></view>
						<view class="big-arrow__head-right"></view>
					</view>
				</view>

				<!-- 休息模式：闭眼文字提示 -->
				<view v-if="eyeRestMode" class="eye-rest">
					<text class="eye-rest__text" :key="movementLabel">{{ movementLabel }}</text>
				</view>

				<!-- 底部提示文字 -->
				<view class="arrow-hint">
					<text class="arrow-hint__text">{{ eyeRestMode ? '让眼睛充分休息' : '保持面对屏幕，只转动眼睛' }}</text>
					<text v-if="!eyeRestMode" class="arrow-hint__text">看往箭头所指的方向</text>
				</view>
			</view>

			<!-- 眨眼练习：CSS眼睛 -->
			<view v-if="exerciseType === 'blink'" class="blink-area">
				<view class="css-eye" :class="'css-eye--' + blinkState">
					<view class="css-eye__lid css-eye__lid--top"></view>
					<view class="css-eye__outer">
						<view class="css-eye__iris">
							<view class="css-eye__pupil">
								<view class="css-eye__highlight"></view>
							</view>
						</view>
					</view>
					<view class="css-eye__lid css-eye__lid--bottom"></view>
				</view>
				<text class="blink-hint" :key="blinkHint">{{ blinkHint }}</text>
			</view>

			<!-- 焦点切换 -->
			<view v-if="exerciseType === 'focus-shift'" class="focus-area">
				<view class="focus-bg-blur" :class="{ 'focus-bg-blur--far': focusFar }"></view>
				<view
					class="focus-dot"
					:class="{ 'focus-dot--far': focusFar }"
				></view>
				<text class="focus-hint" :key="focusHint">{{ focusHint }}</text>
			</view>

			<!-- 20-20-20 倒计时环 -->
			<view v-if="exerciseType === 'twenty-rule'" class="twenty-area">
				<text class="twenty-title">看向远方</text>
				<view class="twenty-ring">
					<view class="twenty-ring__track"></view>
					<view class="twenty-ring__progress" :style="{ '--progress': twentyProgress }"></view>
					<view class="twenty-ring__center">
						<text class="twenty-num" :key="remainSeconds">{{ remainSeconds }}</text>
					</view>
				</view>
				<text class="twenty-desc">看向6米以外的物体</text>
				<text class="twenty-subdesc">让睫状肌充分放松</text>
			</view>
		</view>

		<!-- 完成庆祝 -->
		<view v-if="phase === 'done'" class="done-phase">
			<view class="done-check" :class="{ 'done-check--pop': doneAnim }">
				<view class="done-check__icon"></view>
			</view>
			<text class="done-text" :class="{ 'fade-in-up': doneAnim }">太棒了，眼睛感谢你</text>
			<view class="done-stats" :class="{ 'fade-in-up-delay': doneAnim }">
				<text class="done-stats__item">+1 次锻炼</text>
				<text class="done-stats__item">+{{ exerciseDuration }}秒</text>
			</view>
			<view
				class="done-btn"
				:class="{ 'fade-in-up-delay2': doneAnim }"
				@click="goFinish"
			>
				<text class="done-btn__text">完成</text>
			</view>
		</view>

		<!-- 底部控制栏（锻炼中显示） -->
		<view v-if="phase === 'active'" class="controls">
			<!-- 进度条 -->
			<view class="progress-bar">
				<view class="progress-bar__fill" :style="{ width: progressPercent + '%' }"></view>
			</view>
			<view class="controls__row">
				<text class="controls__time">{{ formatTime(remainSeconds) }}</text>
				<view class="controls__step">
					<text class="controls__step-text">{{ currentStep }}/{{ totalSteps }}</text>
				</view>
				<view class="controls__btns">
					<view class="ctrl-btn" :class="{ 'ctrl-btn--off': !voiceEnabled }" @click="toggleVoice">
						<image class="ctrl-svg" src="/static/tishiyin.svg" mode="aspectFit"></image>
					</view>
					<view class="ctrl-btn" :class="{ 'ctrl-btn--off': !vibrateEnabled }" @click="toggleVibrate">
						<image class="ctrl-svg" src="/static/zhengdong.svg" mode="aspectFit"></image>
					</view>
					<view class="ctrl-btn" @click="togglePause">
						<view v-if="paused" class="ctrl-icon ctrl-icon--play"></view>
						<view v-else class="ctrl-icon ctrl-icon--pause"></view>
					</view>
					<view class="ctrl-btn ctrl-btn--close" @click="confirmExit">
						<view class="ctrl-icon ctrl-icon--close"></view>
					</view>
				</view>
			</view>
		</view>

		<!-- 退出确认弹窗 -->
		<view v-if="showExitModal" class="exit-modal" @click="showExitModal = false">
			<view class="exit-modal__card" :class="{ 'exit-modal__card--dark': isDark }" @click.stop>
				<text class="exit-modal__title">确定退出？</text>
				<text class="exit-modal__desc">当前锻炼进度将不会保存</text>
				<view class="exit-modal__btns">
					<view class="exit-modal__btn exit-modal__btn--cancel" @click="showExitModal = false">
						<text class="exit-modal__btn-text">继续锻炼</text>
					</view>
					<view class="exit-modal__btn exit-modal__btn--confirm" @click="exitTraining">
						<text class="exit-modal__btn-text exit-modal__btn-text--confirm">退出</text>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { isDarkMode } from '@/store/theme.js'
import { EXERCISE_TYPES, addRecord, vibrate, speak, stopSpeak, preInitTTS } from '@/store/eyeExercise.js'

export default {
	data() {
		return {
			exerciseType: '',
			exerciseConfig: null,
			exerciseDuration: 0,
			phase: 'ready', // ready | active | done
			readyCount: 3,
			readyVisible: false,
			paused: false,
			showExitModal: false,
			voiceEnabled: true,
			vibrateEnabled: true,

			// 通用计时
			remainSeconds: 0,
			totalSeconds: 0,
			progressPercent: 0,
			currentStep: 1,
			totalSteps: 1,
			timer: null,

			// 眼球运动
			areaWidth: 0,
			areaHeight: 0,
			movementSegments: [],
			currentSegIndex: 0,
			segTimer: null,
			arrowAngle: 0, // 初始朝上（箭头默认形状朝上，0deg = 朝上）
			movementLabel: '',
			eyeRestMode: false,

			// 眨眼
			blinkState: 'open', // open | blink | closed | opening
			blinkHint: '睁大眼睛',
			blinkTimer: null,

			// 焦点切换
			focusFar: false,
			focusHint: '注视圆点',
			focusTimer: null,

			// 20-20-20
			twentyProgress: 0,

			// 完成
			doneAnim: false
		}
	},
	computed: {
		isDark() {
			return isDarkMode()
		}
	},
	onLoad(query) {
		this.exerciseType = query.type || 'eye-movement'
		this.exerciseConfig = EXERCISE_TYPES[this.exerciseType]
		this.exerciseDuration = this.exerciseConfig.duration
		this.totalSeconds = this.exerciseDuration
		this.remainSeconds = this.exerciseDuration

		preInitTTS()
		this.initExercise()
	},
	onReady() {
		setTimeout(() => {
			this.readyVisible = true
			this.startReadyCountdown()
		}, 200)
	},
	onUnload() {
		this.clearAllTimers()
	},
	methods: {
		// ==================== 准备阶段 ====================
		startReadyCountdown() {
			this.doVibrate('light')
			const interval = setInterval(() => {
				this.readyCount--
				if (this.readyCount > 0) {
					this.doVibrate('light')
				} else {
					clearInterval(interval)
					this.doVibrate('medium')
					this.phase = 'active'
					this.startExercise()
				}
			}, 1000)
			this.timer = interval
		},

		// ==================== 初始化 ====================
		initExercise() {
			switch (this.exerciseType) {
				case 'eye-movement':
					this.initEyeMovement()
					break
				case 'blink':
					this.totalSteps = 3
					break
				case 'focus-shift':
					this.totalSteps = 9
					break
				case 'twenty-rule':
					this.totalSteps = 1
					break
			}
		},

		initEyeMovement() {
			// Eyeye风格：大箭头指示方向，每个方向保持3秒，穿插闭眼休息
			// arrowAngle: CSS rotate角度，0=右, -90=上, 90=下, 180=左
			// 角度：0=上, 180=下, -90=左, 90=右, -45=左上, 45=右上, -135=左下, 135=右下
			this.movementSegments = [
				{ angle: 0,    label: '向上看', duration: 3000, rest: false },
				{ angle: 180,  label: '向下看', duration: 3000, rest: false },
				{ angle: -90,  label: '向左看', duration: 3000, rest: false },
				{ angle: 90,   label: '向右看', duration: 3000, rest: false },
				{ angle: 0,    label: '紧闭双眼 5 秒钟', duration: 5000, rest: true },
				{ angle: -45,  label: '左上方看', duration: 3000, rest: false },
				{ angle: 135,  label: '右下方看', duration: 3000, rest: false },
				{ angle: 45,   label: '右上方看', duration: 3000, rest: false },
				{ angle: -135, label: '左下方看', duration: 3000, rest: false },
				{ angle: 0,    label: '紧闭双眼 5 秒钟', duration: 5000, rest: true },
				{ angle: 0,    label: '向上看', duration: 3000, rest: false },
				{ angle: 90,   label: '向右看', duration: 3000, rest: false },
				{ angle: 180,  label: '向下看', duration: 3000, rest: false },
				{ angle: -90,  label: '向左看', duration: 3000, rest: false },
				{ angle: 0,    label: '紧闭双眼 5 秒钟', duration: 5000, rest: true },
				{ angle: -45,  label: '左上方看', duration: 3000, rest: false },
				{ angle: 45,   label: '右上方看', duration: 3000, rest: false },
				{ angle: 135,  label: '右下方看', duration: 3000, rest: false },
			]
			this.totalSteps = this.movementSegments.length
		},

		// ==================== 开始锻炼 ====================
		startExercise() {
			// 通用倒计时
			this.startCountdown()

			switch (this.exerciseType) {
				case 'eye-movement':
					this.startEyeMovement()
					break
				case 'blink':
					this.startBlink()
					break
				case 'focus-shift':
					this.startFocusShift()
					break
				case 'twenty-rule':
					this.startTwentyRule()
					break
			}
		},

		startCountdown() {
			this.timer = setInterval(() => {
				if (this.paused) return
				this.remainSeconds--
				this.progressPercent = ((this.totalSeconds - this.remainSeconds) / this.totalSeconds) * 100

				if (this.exerciseType === 'twenty-rule') {
					this.twentyProgress = this.progressPercent / 100
				}

				if (this.remainSeconds <= 0) {
					clearInterval(this.timer)
					this.onComplete()
				}
			}, 1000)
		},

		// ==================== 眼球运动（Eyeye风格：大箭头方向指示） ====================
		startEyeMovement() {
			this.currentSegIndex = 0
			this.runMovementSegment()
		},

		runMovementSegment() {
			if (this.currentSegIndex >= this.movementSegments.length) return
			if (this.phase !== 'active') return

			const seg = this.movementSegments[this.currentSegIndex]
			this.currentStep = this.currentSegIndex + 1
			this.movementLabel = seg.label
			this.eyeRestMode = seg.rest
			this.arrowAngle = seg.angle
			if (seg.rest) {
				this.doVibrate('light')
				setTimeout(() => this.doVibrate('light'), 200)
			} else {
				this.doVibrate('light')
			}
			this.doSpeak(seg.label)

			const waitAndNext = () => {
				if (this.paused) {
					this.segTimer = setTimeout(waitAndNext, 100)
					return
				}
				this.currentSegIndex++
				if (this.currentSegIndex < this.movementSegments.length) {
					this.runMovementSegment()
				}
			}
			this.segTimer = setTimeout(waitAndNext, seg.duration)
		},

		// ==================== 眨眼练习 ====================
		startBlink() {
			this.runBlinkRound(0)
		},

		runBlinkRound(round) {
			if (round >= 3) return
			this.currentStep = round + 1

			const sequence = [
				{ state: 'open', hint: '睁大眼睛', duration: 3000 },
				{ state: 'blink', hint: '快速眨眼', duration: 1500 },
				{ state: 'closed', hint: '紧闭双眼', duration: 3000 },
				{ state: 'opening', hint: '缓慢睁开', duration: 2000 },
				{ state: 'open', hint: '放松', duration: 5500 }
			]

			let idx = 0
			const next = () => {
				if (this.paused) {
					this.blinkTimer = setTimeout(next, 50)
					return
				}
				if (this.phase !== 'active') return
				if (idx >= sequence.length) {
					this.runBlinkRound(round + 1)
					return
				}

				const step = sequence[idx]
				this.blinkState = step.state
				this.blinkHint = step.hint

				if (step.state === 'blink') {
					this.runBlinkAnimation(step.duration)
				}

				this.doVibrate('light')
				this.doSpeak(step.hint)
				idx++
				this.blinkTimer = setTimeout(next, step.duration)
			}
			next()
		},

		runBlinkAnimation(duration) {
			const count = 5
			const interval = duration / count
			let i = 0
			const blink = () => {
				if (i >= count) return
				this.blinkState = i % 2 === 0 ? 'closed' : 'open'
				this.doVibrate('light')
				i++
				setTimeout(blink, interval)
			}
			blink()
		},

		// ==================== 焦点切换 ====================
		startFocusShift() {
			this.runFocusRound(0)
		},

		runFocusRound(round) {
			if (round >= 9 || this.phase !== 'active') return
			this.currentStep = round + 1

			// 看近
			this.focusFar = false
			this.focusHint = '注视圆点'
			this.doVibrate('medium')
			this.doSpeak('注视圆点')

			this.focusTimer = setTimeout(() => {
				if (this.paused) {
					this.waitAndResume(() => this.runFocusRoundFar(round))
					return
				}
				this.runFocusRoundFar(round)
			}, 5000)
		},

		runFocusRoundFar(round) {
			if (this.phase !== 'active') return
			// 看远
			this.focusFar = true
			this.focusHint = '看向远处'
			this.doVibrate('medium')
			this.doSpeak('看向远处')

			this.focusTimer = setTimeout(() => {
				if (this.paused) {
					this.waitAndResume(() => this.runFocusRound(round + 1))
					return
				}
				this.runFocusRound(round + 1)
			}, 5000)
		},

		waitAndResume(callback) {
			const check = () => {
				if (!this.paused) {
					callback()
				} else {
					setTimeout(check, 100)
				}
			}
			check()
		},

		// ==================== 20-20-20 ====================
		startTwentyRule() {
			this.doSpeak('看向6米以外的物体')
		},

		// ==================== 完成 ====================
		onComplete() {
			this.clearAllTimers()
			this.doVibrate('heavy')
			this.doSpeak('锻炼完成')
			addRecord(this.exerciseType, this.exerciseDuration)
			this.phase = 'done'
			setTimeout(() => {
				this.doneAnim = true
			}, 100)
		},

		// ==================== 控制 ====================
		doVibrate(type) {
			if (this.vibrateEnabled) vibrate(type)
		},

		doSpeak(text) {
			if (this.voiceEnabled) speak(text)
		},

		toggleVoice() {
			this.voiceEnabled = !this.voiceEnabled
			if (!this.voiceEnabled) stopSpeak()
		},

		toggleVibrate() {
			this.vibrateEnabled = !this.vibrateEnabled
		},

		togglePause() {
			this.paused = !this.paused
		},

		confirmExit() {
			this.paused = true
			this.showExitModal = true
		},

		exitTraining() {
			this.clearAllTimers()
			stopSpeak()
			uni.navigateBack()
		},

		goFinish() {
			uni.navigateBack()
		},

		formatTime(sec) {
			const m = Math.floor(sec / 60)
			const s = sec % 60
			return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
		},

		clearAllTimers() {
			if (this.timer) clearInterval(this.timer)
			if (this.segTimer) clearTimeout(this.segTimer)
			if (this.blinkTimer) clearTimeout(this.blinkTimer)
			if (this.focusTimer) clearTimeout(this.focusTimer)
		}
	}
}
</script>

<style lang="scss" scoped>
.training {
	width: 100vw;
	height: 100vh;
	position: relative;
	overflow: hidden;
	background: #FFFDF7;

	&--dark {
		background: #1C2E3E;
	}

	&__bg {
		position: absolute;
		top: 0; left: 0; right: 0; bottom: 0;
		background: radial-gradient(ellipse at 30% 40%, rgba(16, 185, 129, 0.04) 0%, transparent 60%),
		            radial-gradient(ellipse at 70% 60%, rgba(14, 165, 233, 0.03) 0%, transparent 60%);
		animation: bgDrift 60s ease-in-out infinite alternate;
	}
}

.training--dark .training__bg {
	background: radial-gradient(ellipse at 30% 40%, rgba(107, 181, 212, 0.04) 0%, transparent 60%),
	            radial-gradient(ellipse at 70% 60%, rgba(107, 181, 212, 0.02) 0%, transparent 60%);
}

@keyframes bgDrift {
	0% { transform: translate(0, 0) scale(1); }
	50% { transform: translate(3%, 2%) scale(1.05); }
	100% { transform: translate(-2%, -1%) scale(1.02); }
}

/* ==================== 准备阶段 ==================== */
.ready-phase {
	position: absolute;
	top: 0; left: 0; right: 0; bottom: 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	z-index: 10;

	&__title {
		font-size: $font-size-xl;
		color: $text-secondary;
		opacity: 0;
		transform: translateY(20rpx);
		transition: all 500ms ease;
		margin-bottom: $spacing-xl;
	}

	&__count {
		font-size: 160rpx;
		font-weight: $font-weight-bold;
		color: #10B981;
		line-height: 1;
		animation: countPop 0.8s ease-out;
	}

	&__hint {
		font-size: $font-size-base;
		color: $text-muted;
		margin-top: $spacing-xl;
		opacity: 0;
		transform: translateY(20rpx);
		transition: all 500ms ease 200ms;
	}
}

.training--dark .ready-phase {
	&__title { color: rgba(107, 181, 212, 0.6); }
	&__count { color: #6BB5D4; }
	&__hint { color: rgba(107, 181, 212, 0.4); }
}

.fade-in {
	opacity: 1 !important;
	transform: translateY(0) !important;
}

@keyframes countPop {
	0% { transform: scale(1.5); opacity: 0; }
	60% { transform: scale(0.95); opacity: 1; }
	100% { transform: scale(1); opacity: 1; }
}

/* ==================== 眼球运动（Eyeye风格大箭头） ==================== */
.arrow-area {
	position: absolute;
	top: 0; left: 0; right: 0; bottom: 0;
	display: flex;
	align-items: center;
	justify-content: center;
}

.big-arrow-wrap {
	display: flex;
	align-items: center;
	justify-content: center;
}

/* 大箭头 — 默认朝上，absolute定位 */
.big-arrow {
	position: relative;
	width: 120px;
	height: 180px;
	transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);

	/* 箭杆：从底部延伸到V形交汇点 */
	&__shaft {
		position: absolute;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 24px;
		height: 180px;
		background: #10B981;
		border-radius: 12px;
	}

	/* 不需要 &__head 容器，两个臂直接定位 */

	/* V形左臂：向交点延长，形成平滑90度夹角 */
	&__head-left {
		position: absolute;
		top: -12px;
		left: 50%;
		width: 24px;
		height: 73px;
		background: #34D399;
		border-radius: 12px;
		transform-origin: 50% 12px;
		transform: translateX(-50%) rotate(45deg);
	}

	/* V形右臂 */
	&__head-right {
		position: absolute;
		top: -12px;
		left: 50%;
		width: 24px;
		height: 73px;
		background: #34D399;
		border-radius: 12px;
		transform-origin: 50% 12px;
		transform: translateX(-50%) rotate(-45deg);
	}
}

.training--dark .big-arrow {
	&__shaft { background: #34D399; }
	&__head-left { background: #6EE7B7; }
	&__head-right { background: #6EE7B7; }
}

/* 闭眼休息文字 */
.eye-rest {
	display: flex;
	align-items: center;
	justify-content: center;
	animation: hintFade 0.6s ease;

	&__text {
		font-size: 52rpx;
		font-weight: $font-weight-medium;
		color: $text-secondary;
		text-align: center;
		line-height: 1.6;
		letter-spacing: 6rpx;
	}
}

.training--dark .eye-rest__text {
	color: rgba(16, 185, 129, 0.7);
}

/* 底部提示文字 */
.arrow-hint {
	position: absolute;
	bottom: 200rpx;
	left: 0;
	right: 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8rpx;

	&__text {
		font-size: $font-size-base;
		color: $text-muted;
		text-align: center;
	}
}

.training--dark .arrow-hint__text {
	color: rgba(16, 185, 129, 0.5);
}

/* ==================== 眨眼练习 ==================== */
.blink-area {
	position: absolute;
	top: 0; left: 0; right: 0; bottom: 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
}

.css-eye {
	width: 240rpx;
	height: 120rpx;
	position: relative;
	margin-bottom: 80rpx;

	&__outer {
		width: 100%;
		height: 100%;
		border: 4rpx solid $color-primary;
		border-radius: 70% 70% 70% 70% / 100% 100% 100% 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		transition: height 300ms ease, border-radius 300ms ease;
	}

	&__iris {
		width: 80rpx;
		height: 80rpx;
		border-radius: 50%;
		background: radial-gradient(circle, $color-primary 30%, $color-primary-light 60%, #4A90D9 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: transform 300ms ease;
	}

	&__pupil {
		width: 32rpx;
		height: 32rpx;
		border-radius: 50%;
		background: #0D1117;
		position: relative;
	}

	&__highlight {
		position: absolute;
		top: 4rpx;
		right: 4rpx;
		width: 10rpx;
		height: 10rpx;
		border-radius: 50%;
		background: #FFFFFF;
	}

	&__lid {
		position: absolute;
		left: -2rpx;
		right: -2rpx;
		height: 50%;
		background: #FFFDF7;
		z-index: 2;
		transition: transform 300ms ease;

		&--top {
			top: -2rpx;
			border-radius: 0 0 50% 50%;
			transform-origin: top center;
			transform: scaleY(0);
		}
		&--bottom {
			bottom: -2rpx;
			border-radius: 50% 50% 0 0;
			transform-origin: bottom center;
			transform: scaleY(0);
		}
	}

	// 眨眼状态
	&--closed &__lid--top,
	&--closed &__lid--bottom {
		transform: scaleY(1);
	}

	&--blink &__lid--top,
	&--blink &__lid--bottom {
		transform: scaleY(1);
		transition-duration: 100ms;
	}

	&--opening &__lid--top,
	&--opening &__lid--bottom {
		transform: scaleY(0);
		transition-duration: 1500ms;
	}
}

.css-eye__lid { background: #FFFDF7; }

.training--dark .css-eye {
	&__outer { border-color: #6BB5D4; }
	&__iris { background: radial-gradient(circle, #3A6E85 30%, #5BA8C9 60%, #6BB5D4 100%); }
	&__lid { background: #1C2E3E; }
}

.blink-hint {
	font-size: $font-size-xl;
	color: $text-secondary;
	animation: hintFade 0.5s ease;
}
.training--dark .blink-hint { color: rgba(107, 181, 212, 0.7); }

@keyframes hintFade {
	0% { opacity: 0; transform: translateY(10rpx); }
	100% { opacity: 1; transform: translateY(0); }
}

/* ==================== 焦点切换 ==================== */
.focus-area {
	position: absolute;
	top: 0; left: 0; right: 0; bottom: 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
}

.focus-bg-blur {
	position: absolute;
	top: 0; left: 0; right: 0; bottom: 0;
	backdrop-filter: blur(0px);
	-webkit-backdrop-filter: blur(0px);
	transition: all 800ms ease-in-out;

	&--far {
		backdrop-filter: blur(2px);
		-webkit-backdrop-filter: blur(2px);
		background: rgba(16, 185, 129, 0.02);
	}
}

.focus-dot {
	width: 60px;
	height: 60px;
	border-radius: 50%;
	background: radial-gradient(circle, #34D399 0%, #10B981 60%);
	box-shadow:
		0 0 30px rgba(16, 185, 129, 0.5),
		0 0 80px rgba(16, 185, 129, 0.2);
	transition: all 800ms ease-in-out;
	z-index: 2;

	&--far {
		width: 8px;
		height: 8px;
		background: radial-gradient(circle, #A7F3D0 0%, #6EE7B7 60%);
		box-shadow:
			0 0 40px rgba(16, 185, 129, 0.3),
			0 0 120px rgba(16, 185, 129, 0.1);
		opacity: 0.6;
	}
}

.focus-hint {
	position: absolute;
	bottom: 280rpx;
	font-size: $font-size-xl;
	color: $text-secondary;
	z-index: 3;
	animation: hintFade 0.5s ease;
}
.training--dark .focus-hint { color: rgba(107, 181, 212, 0.7); }

/* ==================== 20-20-20 ==================== */
.twenty-area {
	position: absolute;
	top: 0; left: 0; right: 0; bottom: 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
}

.twenty-title {
	font-size: $font-size-2xl;
	font-weight: $font-weight-semibold;
	color: $text-primary;
	margin-bottom: $spacing-xl;
	letter-spacing: 4rpx;
}
.training--dark .twenty-title { color: rgba(107, 181, 212, 0.8); }

.twenty-ring {
	width: 300rpx;
	height: 300rpx;
	position: relative;
	margin-bottom: $spacing-xl;

	&__track {
		position: absolute;
		top: 0; left: 0;
		width: 100%; height: 100%;
		border-radius: 50%;
		border: 10rpx solid rgba(16, 185, 129, 0.15);
	}

	&__progress {
		position: absolute;
		top: 0; left: 0;
		width: 100%; height: 100%;
		border-radius: 50%;
		border: 10rpx solid transparent;
		border-top-color: #10B981;
		border-right-color: #10B981;
		transform: rotate(-90deg);
		transition: transform 1s linear;
		// 使用 conic-gradient 模拟进度
		background: conic-gradient(
			#10B981 0%,
			#0EA5E9 calc(var(--progress) * 100%),
			transparent calc(var(--progress) * 100%)
		);
		mask: radial-gradient(transparent 58%, #000 59%, #000 67%, transparent 68%);
		-webkit-mask: radial-gradient(transparent 58%, #000 59%, #000 67%, transparent 68%);
	}

	&__center {
		position: absolute;
		top: 50%; left: 50%;
		transform: translate(-50%, -50%);
	}
}

.twenty-num {
	font-size: 96rpx;
	font-weight: $font-weight-bold;
	color: #10B981;
	line-height: 1;
	animation: countPop 0.6s ease-out;
}

.twenty-desc {
	font-size: $font-size-base;
	color: $text-secondary;
	margin-bottom: $spacing-xs;
}
.twenty-subdesc {
	font-size: $font-size-sm;
	color: $text-muted;
}
.training--dark {
	.twenty-desc { color: rgba(107, 181, 212, 0.6); }
	.twenty-subdesc { color: rgba(107, 181, 212, 0.4); }
}

/* ==================== 完成庆祝 ==================== */
.done-phase {
	position: absolute;
	top: 0; left: 0; right: 0; bottom: 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	z-index: 10;
}

.done-check {
	width: 120rpx;
	height: 120rpx;
	border-radius: 50%;
	background: linear-gradient(135deg, #10B981 0%, #0EA5E9 100%);
	display: flex;
	align-items: center;
	justify-content: center;
	transform: scale(0);
	transition: transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1);

	&--pop {
		transform: scale(1);
	}

	&__icon {
		width: 40rpx;
		height: 24rpx;
		border-left: 6rpx solid #FFFFFF;
		border-bottom: 6rpx solid #FFFFFF;
		transform: rotate(-45deg);
		margin-top: -8rpx;
	}
}

.done-text {
	font-size: $font-size-xl;
	font-weight: $font-weight-semibold;
	color: $text-primary;
	margin-top: $spacing-xl;
	opacity: 0;
	transform: translateY(20rpx);
}

.done-stats {
	display: flex;
	gap: $spacing-lg;
	margin-top: $spacing-md;
	opacity: 0;
	transform: translateY(20rpx);

	&__item {
		font-size: $font-size-base;
		color: #10B981;
		padding: 8rpx 24rpx;
		background: rgba(16, 185, 129, 0.08);
		border-radius: $radius-full;
	}
}

.done-btn {
	margin-top: 80rpx;
	width: 400rpx;
	height: 88rpx;
	background: linear-gradient(135deg, #10B981 0%, #0EA5E9 100%);
	border-radius: $radius-full;
	display: flex;
	align-items: center;
	justify-content: center;
	opacity: 0;
	transform: translateY(20rpx);

	&:active {
		transform: scale(0.96) !important;
	}

	&__text {
		font-size: $font-size-lg;
		font-weight: $font-weight-semibold;
		color: #FFFFFF;
	}
}

.training--dark {
	.done-text { color: rgba(107, 181, 212, 0.9); }
	.done-stats__item { background: rgba(16, 185, 129, 0.12); color: #34D399; }
}

.fade-in-up {
	opacity: 1 !important;
	transform: translateY(0) !important;
	transition: all 500ms ease 300ms;
}

.fade-in-up-delay {
	opacity: 1 !important;
	transform: translateY(0) !important;
	transition: all 500ms ease 600ms;
}

.fade-in-up-delay2 {
	opacity: 1 !important;
	transform: translateY(0) !important;
	transition: all 500ms ease 1200ms;
}

/* ==================== 底部控制栏 ==================== */
.controls {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	padding: 0 $spacing-lg calc(#{$spacing-xl} + env(safe-area-inset-bottom));
	z-index: 20;
}

.progress-bar {
	height: 4rpx;
	background: rgba(16, 185, 129, 0.15);
	border-radius: 2rpx;
	overflow: hidden;
	margin-bottom: $spacing-md;

	&__fill {
		height: 100%;
		background: linear-gradient(90deg, #10B981, #0EA5E9);
		border-radius: 2rpx;
		transition: width 1s linear;
	}
}

.controls__row {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.controls__time {
	font-size: $font-size-xl;
	font-weight: $font-weight-medium;
	color: $text-muted;
	font-variant-numeric: tabular-nums;
	min-width: 120rpx;
}
.training--dark .controls__time { color: rgba(107, 181, 212, 0.4); }

.controls__step {
	flex: 1;
	text-align: center;

	&-text {
		font-size: $font-size-sm;
		color: $text-muted;
	}
}
.training--dark .controls__step-text { color: rgba(107, 181, 212, 0.35); }

.controls__btns {
	display: flex;
	gap: $spacing-md;
}

.ctrl-btn {
	width: 72rpx;
	height: 72rpx;
	border-radius: 50%;
	background: rgba(16, 185, 129, 0.08);
	display: flex;
	align-items: center;
	justify-content: center;

	&--close {
		background: rgba(239, 68, 68, 0.08);
	}

	&--off {
		opacity: 0.35;
	}

	&:active {
		transform: scale(0.9);
	}
}

.ctrl-svg {
	width: 36rpx;
	height: 36rpx;
	filter: brightness(0);
	opacity: 0.3;
}
.training--dark .ctrl-svg {
	filter: brightness(0) invert(1);
	opacity: 0.5;
}

.ctrl-icon {
	&--pause {
		width: 16rpx;
		height: 20rpx;
		border-left: 4rpx solid $text-muted;
		border-right: 4rpx solid $text-muted;
	}

	&--play {
		width: 0;
		height: 0;
		border-top: 12rpx solid transparent;
		border-bottom: 12rpx solid transparent;
		border-left: 18rpx solid #10B981;
		margin-left: 4rpx;
	}

	&--close {
		width: 20rpx;
		height: 20rpx;
		position: relative;
		&::before, &::after {
			content: '';
			position: absolute;
			top: 50%; left: 0;
			width: 100%; height: 3rpx;
			background: $color-error;
		}
		&::before { transform: rotate(45deg); }
		&::after { transform: rotate(-45deg); }
	}
}

.training--dark .ctrl-icon--pause { border-color: rgba(107, 181, 212, 0.5); }

/* ==================== 退出弹窗 ==================== */
.exit-modal {
	position: absolute;
	top: 0; left: 0; right: 0; bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 100;

	&__card {
		width: 560rpx;
		background: $bg-card;
		border-radius: $radius-xl;
		padding: $spacing-xl;
		text-align: center;

		&--dark {
			background: $dark-bg-card;
		}
	}

	&__title {
		font-size: $font-size-lg;
		font-weight: $font-weight-semibold;
		color: $text-primary;
		display: block;
		margin-bottom: $spacing-sm;
	}

	&__desc {
		font-size: $font-size-sm;
		color: $text-secondary;
		display: block;
		margin-bottom: $spacing-xl;
	}

	&__btns {
		display: flex;
		gap: $spacing-md;
	}

	&__btn {
		flex: 1;
		height: 80rpx;
		border-radius: $radius-lg;
		display: flex;
		align-items: center;
		justify-content: center;

		&--cancel {
			background: rgba(16, 185, 129, 0.1);
		}

		&--confirm {
			background: rgba(239, 68, 68, 0.1);
		}
	}

	&__btn-text {
		font-size: $font-size-base;
		font-weight: $font-weight-medium;
		color: #10B981;

		&--confirm {
			color: $color-error;
		}
	}
}

.exit-modal__card--dark {
	.exit-modal__title { color: $dark-text-primary; }
	.exit-modal__desc { color: $dark-text-muted; }
}
</style>
