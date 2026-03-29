<template>
	<view class="page" :class="{ 'page--dark': isDark }">
		<!-- 背景 -->
		<view class="page-bg"></view>

		<!-- 固定导航栏 -->
		<view class="fixed-header" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="navbar">
				<view class="navbar__back" @click="goBack">
					<view class="back-icon"></view>
				</view>
				<text class="navbar__title">护眼锻炼</text>
				<view class="navbar__placeholder"></view>
			</view>
		</view>

		<!-- 占位 -->
		<view class="header-placeholder" :style="{ height: (statusBarHeight + 44) + 'px' }"></view>

		<scroll-view class="content" scroll-y>
			<!-- 英雄统计卡片 -->
			<view class="hero-card" :class="{ 'hero-card--appear': appeared }">
				<view class="hero-card__glow"></view>
				<view class="hero-card__inner">
					<!-- 环形进度 -->
					<view class="progress-ring">
						<view class="progress-ring__svg">
							<canvas canvas-id="progressCanvas" class="progress-ring__canvas"></canvas>
						</view>
						<view class="progress-ring__center">
							<text class="progress-ring__num">{{ todayCompleted }}</text>
							<text class="progress-ring__sep">/</text>
							<text class="progress-ring__total">{{ totalTypes }}</text>
						</view>
					</view>
					<text class="hero-card__label">今日已完成</text>

					<!-- 底部标签 -->
					<view class="hero-card__tags">
						<view class="hero-tag">
							<view class="hero-tag__icon hero-tag__icon--streak"></view>
							<text class="hero-tag__text">连续{{ streak }}天</text>
						</view>
						<view class="hero-tag__divider"></view>
						<view class="hero-tag">
							<view class="hero-tag__icon hero-tag__icon--time"></view>
							<text class="hero-tag__text">共{{ todayMinutes }}</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 锻炼项目 -->
			<view class="section">
				<text class="section__title">今日锻炼</text>
				<view class="exercise-grid">
					<view
						v-for="(item, key, idx) in exerciseTypes"
						:key="key"
						class="exercise-card"
						:class="[
							{ 'exercise-card--done': isCompleted(key) },
							{ 'exercise-card--appear': appeared }
						]"
						:style="{ '--delay': (idx * 80) + 'ms' }"
						@click="startExercise(key)"
					>
						<!-- 图标 -->
						<view class="exercise-card__icon" :style="{ background: item.color + '15' }">
							<view class="ex-icon" :class="'ex-icon--' + item.iconType" :style="{ '--c': item.color }"></view>
						</view>
						<!-- 信息 -->
						<text class="exercise-card__name">{{ item.name }}</text>
						<text class="exercise-card__meta">{{ item.duration }}秒 · {{ item.tag }}</text>
						<!-- 完成标记 -->
						<view v-if="isCompleted(key)" class="exercise-card__check">
							<view class="check-icon"></view>
						</view>
					</view>
				</view>
			</view>

			<!-- 本周记录 -->
			<view class="section">
				<text class="section__title">本周记录</text>
				<view class="week-chart">
					<view class="week-chart__bars">
						<view
							v-for="(day, index) in weekData"
							:key="day.key"
							class="bar-col"
						>
							<view
								class="bar"
								:class="[
									{ 'bar--today': day.isToday },
									{ 'bar--active': day.count > 0 },
									{ 'bar--appear': appeared }
								]"
								:style="{
									height: getBarHeight(day.count) + 'rpx',
									'--delay': (index * 50) + 'ms'
								}"
							></view>
							<text class="bar-label" :class="{ 'bar-label--today': day.isToday }">{{ day.label }}</text>
						</view>
					</view>
					<text class="week-chart__summary">本周共{{ weekTotal }}次锻炼</text>
				</view>
			</view>

			<!-- 锻炼提醒 -->
			<view class="section">
				<text class="section__title">锻炼提醒</text>
				<view class="reminder-card">
					<view class="reminder-item">
						<view class="reminder-item__left">
							<view class="reminder-icon reminder-icon--bell"></view>
							<text class="reminder-item__text">每日提醒</text>
						</view>
						<switch
							:checked="reminder.enabled"
							@change="onReminderToggle"
							color="#10B981"
							class="reminder-switch"
						/>
					</view>
					<view
						v-if="reminder.enabled"
						class="reminder-item reminder-item--time"
						@click="showTimePicker"
					>
						<view class="reminder-item__left">
							<view class="reminder-icon reminder-icon--clock"></view>
							<text class="reminder-item__text">提醒时间</text>
						</view>
						<view class="reminder-item__right">
							<text class="reminder-time">{{ reminder.time }}</text>
							<view class="reminder-arrow"></view>
						</view>
					</view>
				</view>
			</view>

			<!-- 底部留白 -->
			<view style="height: 80rpx;"></view>
		</scroll-view>

		<!-- 时间选择器 -->
		<picker
			v-if="reminder.enabled"
			mode="time"
			:value="reminder.time"
			@change="onTimeChange"
			ref="timePicker"
			class="hidden-picker"
		>
			<view ref="timePickerTrigger"></view>
		</picker>
	</view>
</template>

<script>
import { isDarkMode } from '@/store/theme.js'
import {
	EXERCISE_TYPES,
	initExerciseStore,
	getTodayRecords,
	getTodayCompletedTypes,
	getWeekData,
	getStreak,
	getReminder,
	updateReminder
} from '@/store/eyeExercise.js'

export default {
	data() {
		return {
			statusBarHeight: 44,
			appeared: false,
			exerciseTypes: EXERCISE_TYPES,
			totalTypes: Object.keys(EXERCISE_TYPES).length,
			todayCompleted: 0,
			completedTypes: [],
			streak: 0,
			todayDuration: 0,
			weekData: [],
			weekTotal: 0,
			reminder: { enabled: false, time: '09:00' }
		}
	},
	computed: {
		isDark() {
			return isDarkMode()
		},
		todayMinutes() {
			const sec = this.todayDuration
			if (sec < 60) return sec + '秒'
			return Math.floor(sec / 60) + '分' + (sec % 60 > 0 ? sec % 60 + '秒' : '')
		}
	},
	onLoad() {
		const sys = uni.getSystemInfoSync()
		this.statusBarHeight = sys.statusBarHeight || 44
		initExerciseStore()
	},
	onShow() {
		this.refreshData()
	},
	onReady() {
		setTimeout(() => {
			this.appeared = true
			this.drawProgress()
		}, 100)
	},
	methods: {
		goBack() {
			uni.navigateBack()
		},

		refreshData() {
			const today = getTodayRecords()
			this.completedTypes = getTodayCompletedTypes()
			this.todayCompleted = this.completedTypes.length
			this.todayDuration = today.totalDuration
			this.streak = getStreak()
			this.weekData = getWeekData()
			this.weekTotal = this.weekData.reduce((sum, d) => sum + d.count, 0)
			this.reminder = { ...getReminder() }

			this.$nextTick(() => {
				this.drawProgress()
			})
		},

		isCompleted(type) {
			return this.completedTypes.includes(type)
		},

		getBarHeight(count) {
			if (count === 0) return 8
			const max = Math.max(...this.weekData.map(d => d.count), 1)
			return Math.max(16, Math.round((count / max) * 120))
		},

		drawProgress() {
			const ctx = uni.createCanvasContext('progressCanvas', this)
			const size = 100
			const center = size / 2
			const radius = 40
			const lineWidth = 8
			const total = this.totalTypes
			const completed = this.todayCompleted

			// 背景环
			ctx.setLineWidth(lineWidth)
			ctx.setStrokeStyle(this.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.3)')
			ctx.setLineCap('round')
			ctx.beginPath()
			ctx.arc(center, center, radius, 0, Math.PI * 2)
			ctx.stroke()

			// 进度环
			if (completed > 0) {
				const angle = (completed / total) * Math.PI * 2
				const startAngle = -Math.PI / 2
				ctx.setLineWidth(lineWidth)
				ctx.setStrokeStyle('#FFFFFF')
				ctx.setLineCap('round')
				ctx.beginPath()
				ctx.arc(center, center, radius, startAngle, startAngle + angle)
				ctx.stroke()
			}

			ctx.draw()
		},

		startExercise(type) {
			uni.navigateTo({
				url: `/pages/eye-exercise/training?type=${type}`
			})
		},

		onReminderToggle(e) {
			const enabled = e.detail.value
			updateReminder(enabled, this.reminder.time)
			this.reminder.enabled = enabled
		},

		showTimePicker() {
			// 触发隐藏的 picker
			this.$refs.timePickerTrigger && this.$refs.timePickerTrigger.$el && this.$refs.timePickerTrigger.$el.click()
		},

		onTimeChange(e) {
			const time = e.detail.value
			updateReminder(this.reminder.enabled, time)
			this.reminder.time = time
		}
	}
}
</script>

<style lang="scss" scoped>
.page {
	min-height: 100vh;
	background: $bg-base;
	position: relative;

	&--dark {
		background: $dark-bg-base;
		.page-bg { background: linear-gradient(180deg, rgba(16, 185, 129, 0.06) 0%, $dark-bg-base 100%); }
	}
}

.page-bg {
	position: absolute;
	top: 0; left: 0; right: 0;
	height: 500rpx;
	background: linear-gradient(180deg, rgba(16, 185, 129, 0.08) 0%, $bg-base 100%);
}

/* 导航栏 */
.fixed-header {
	position: fixed;
	top: 0; left: 0; right: 0;
	z-index: 100;
	background: transparent;
}

.navbar {
	height: 44px;
	display: flex;
	align-items: center;
	padding: 0 $spacing-sm;

	&__back {
		width: 44px;
		height: 44px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	&__title {
		flex: 1;
		font-size: $font-size-lg;
		font-weight: $font-weight-semibold;
		color: $text-primary;
	}

	&__placeholder {
		width: 44px;
	}
}

.page--dark .navbar__title { color: $dark-text-primary; }

.back-icon {
	width: 20rpx;
	height: 20rpx;
	border-left: 4rpx solid $text-primary;
	border-bottom: 4rpx solid $text-primary;
	transform: rotate(45deg);
}
.page--dark .back-icon { border-color: $dark-text-primary; }

.header-placeholder {
	position: relative;
	z-index: 1;
}

.content {
	position: relative;
	z-index: 1;
	height: calc(100vh - 44px);
}

/* ==================== 英雄卡片 ==================== */
.hero-card {
	margin: $spacing-md $spacing-lg;
	border-radius: $radius-xl;
	position: relative;
	overflow: hidden;
	opacity: 0;
	transform: translateY(40rpx);
	transition: all 500ms cubic-bezier(0.34, 1.56, 0.64, 1);

	&--appear {
		opacity: 1;
		transform: translateY(0);
	}

	&__glow {
		position: absolute;
		top: -50%; left: -50%;
		width: 200%; height: 200%;
		background: radial-gradient(circle at 30% 40%, rgba(52, 211, 153, 0.3) 0%, transparent 60%);
		animation: glowDrift 20s ease-in-out infinite alternate;
	}

	&__inner {
		position: relative;
		z-index: 1;
		padding: $spacing-xl $spacing-lg;
		background: linear-gradient(135deg, #10B981 0%, #0EA5E9 100%);
		border-radius: $radius-xl;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	&__label {
		font-size: $font-size-sm;
		color: rgba(255, 255, 255, 0.85);
		margin-top: $spacing-sm;
	}

	&__tags {
		display: flex;
		align-items: center;
		margin-top: $spacing-lg;
		padding-top: $spacing-md;
		border-top: 1rpx solid rgba(255, 255, 255, 0.2);
		width: 100%;
		justify-content: center;
	}
}

.page--dark .hero-card__inner {
	background: linear-gradient(135deg, #065F46 0%, #0C4A6E 100%);
}

@keyframes glowDrift {
	0% { transform: translate(0, 0) rotate(0deg); }
	100% { transform: translate(10%, 5%) rotate(30deg); }
}

/* 环形进度 */
.progress-ring {
	width: 200rpx;
	height: 200rpx;
	position: relative;

	&__svg {
		width: 100%;
		height: 100%;
	}

	&__canvas {
		width: 200rpx;
		height: 200rpx;
	}

	&__center {
		position: absolute;
		top: 50%; left: 50%;
		transform: translate(-50%, -50%);
		display: flex;
		align-items: baseline;
	}

	&__num {
		font-size: 72rpx;
		font-weight: $font-weight-bold;
		color: #FFFFFF;
		line-height: 1;
	}

	&__sep {
		font-size: $font-size-xl;
		color: rgba(255, 255, 255, 0.5);
		margin: 0 4rpx;
	}

	&__total {
		font-size: $font-size-xl;
		color: rgba(255, 255, 255, 0.7);
	}
}

/* 标签 */
.hero-tag {
	display: flex;
	align-items: center;

	&__icon {
		width: 28rpx;
		height: 28rpx;
		margin-right: 8rpx;

		&--streak {
			background: rgba(255, 255, 255, 0.9);
			mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M12 23a7.5 7.5 0 0 0 7.5-7.5c0-2-.5-4-2.5-6-.5 1-1.5 2-3 2.5C14 10 14 8 13 5.5c-1 2-2.5 3-4 4-.5-2-1.5-3.5-2-4.5-1.5 3-3 5.5-3 8A7.5 7.5 0 0 0 12 23z'/%3E%3C/svg%3E") center/contain no-repeat;
			-webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M12 23a7.5 7.5 0 0 0 7.5-7.5c0-2-.5-4-2.5-6-.5 1-1.5 2-3 2.5C14 10 14 8 13 5.5c-1 2-2.5 3-4 4-.5-2-1.5-3.5-2-4.5-1.5 3-3 5.5-3 8A7.5 7.5 0 0 0 12 23z'/%3E%3C/svg%3E") center/contain no-repeat;
		}

		&--time {
			border: 2rpx solid rgba(255, 255, 255, 0.9);
			border-radius: 50%;
			position: relative;
			&::before {
				content: '';
				position: absolute;
				top: 50%; left: 50%;
				width: 2rpx; height: 8rpx;
				background: rgba(255, 255, 255, 0.9);
				transform-origin: bottom center;
				transform: translate(-50%, -100%) rotate(0deg);
			}
			&::after {
				content: '';
				position: absolute;
				top: 50%; left: 50%;
				width: 2rpx; height: 6rpx;
				background: rgba(255, 255, 255, 0.9);
				transform-origin: bottom center;
				transform: translate(-50%, -100%) rotate(90deg);
			}
		}
	}

	&__text {
		font-size: $font-size-sm;
		color: rgba(255, 255, 255, 0.9);
	}

	&__divider {
		width: 1rpx;
		height: 24rpx;
		background: rgba(255, 255, 255, 0.3);
		margin: 0 $spacing-lg;
	}
}

/* ==================== 锻炼卡片网格 ==================== */
.section {
	margin: $spacing-lg $spacing-lg 0;

	&__title {
		font-size: $font-size-sm;
		color: $text-muted;
		margin-bottom: $spacing-sm;
		padding-left: 4rpx;
	}
}
.page--dark .section__title { color: $dark-text-muted; }

.exercise-grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: $spacing-md;
}

.exercise-card {
	background: $bg-card;
	border-radius: $radius-xl;
	padding: $spacing-lg;
	box-shadow: $shadow-sm;
	position: relative;
	overflow: hidden;
	opacity: 0;
	transform: translateY(30rpx);
	transition: opacity 400ms ease, transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1);
	transition-delay: var(--delay, 0ms);

	&--appear {
		opacity: 1;
		transform: translateY(0);
	}

	&:active {
		transform: scale(0.96) !important;
		box-shadow: $shadow-sm;
		transition: transform 150ms ease;
	}

	&--done {
		background: rgba(16, 185, 129, 0.04);
	}

	&__icon {
		width: 72rpx;
		height: 72rpx;
		border-radius: $radius-md;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: $spacing-md;
	}

	&__name {
		font-size: $font-size-base;
		font-weight: $font-weight-semibold;
		color: $text-primary;
		display: block;
		margin-bottom: 4rpx;
	}

	&__meta {
		font-size: $font-size-xs;
		color: $text-muted;
	}

	&__check {
		position: absolute;
		top: $spacing-md;
		right: $spacing-md;
		width: 36rpx;
		height: 36rpx;
		background: rgba(16, 185, 129, 0.12);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}
}

.page--dark .exercise-card {
	background: $dark-bg-card;
	&--done { background: rgba(16, 185, 129, 0.08); }
	&__name { color: $dark-text-primary; }
	&__meta { color: $dark-text-muted; }
}

.check-icon {
	width: 16rpx;
	height: 10rpx;
	border-left: 3rpx solid #10B981;
	border-bottom: 3rpx solid #10B981;
	transform: rotate(-45deg);
	margin-top: -4rpx;
}

/* 锻炼图标 */
.ex-icon {
	position: relative;

	&--movement {
		width: 32rpx;
		height: 32rpx;
		border: 3rpx solid var(--c);
		border-radius: 50%;
		&::before {
			content: '';
			position: absolute;
			top: 50%; left: 50%;
			width: 10rpx; height: 10rpx;
			background: var(--c);
			border-radius: 50%;
			transform: translate(-50%, -50%);
		}
		&::after {
			content: '';
			position: absolute;
			top: -6rpx; right: -6rpx;
			width: 16rpx; height: 16rpx;
			border: 2rpx solid transparent;
			border-top-color: var(--c);
			border-radius: 50%;
			transform: rotate(30deg);
		}
	}

	&--blink {
		width: 36rpx;
		height: 20rpx;
		border: 3rpx solid var(--c);
		border-radius: 70% 70% 70% 70% / 100% 100% 100% 100%;
		&::before {
			content: '';
			position: absolute;
			top: 50%; left: 50%;
			width: 10rpx; height: 10rpx;
			background: var(--c);
			border-radius: 50%;
			transform: translate(-50%, -50%);
		}
	}

	&--focus {
		width: 32rpx;
		height: 32rpx;
		&::before {
			content: '';
			position: absolute;
			top: 0; left: 0;
			width: 100%; height: 100%;
			border: 3rpx solid var(--c);
			border-radius: 50%;
			opacity: 0.4;
		}
		&::after {
			content: '';
			position: absolute;
			top: 50%; left: 50%;
			width: 14rpx; height: 14rpx;
			background: var(--c);
			border-radius: 50%;
			transform: translate(-50%, -50%);
		}
	}

	&--timer {
		width: 32rpx;
		height: 32rpx;
		border: 3rpx solid var(--c);
		border-radius: 50%;
		&::before {
			content: '';
			position: absolute;
			top: 4rpx; left: 50%;
			width: 2rpx; height: 10rpx;
			background: var(--c);
			transform-origin: bottom center;
			transform: translateX(-50%);
		}
		&::after {
			content: '';
			position: absolute;
			top: 50%; left: 50%;
			width: 8rpx; height: 2rpx;
			background: var(--c);
			transform-origin: left center;
			transform: translateY(-50%);
		}
	}
}

/* ==================== 本周图表 ==================== */
.week-chart {
	background: $bg-card;
	border-radius: $radius-xl;
	padding: $spacing-lg;
	box-shadow: $shadow-sm;

	&__bars {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		height: 160rpx;
		padding-bottom: $spacing-xs;
	}

	&__summary {
		text-align: right;
		font-size: $font-size-xs;
		color: $text-muted;
		margin-top: $spacing-sm;
	}
}

.page--dark .week-chart {
	background: $dark-bg-card;
	&__summary { color: $dark-text-muted; }
}

.bar-col {
	display: flex;
	flex-direction: column;
	align-items: center;
	flex: 1;
}

.bar {
	width: 16rpx;
	border-radius: 8rpx;
	background: $border-color-light;
	min-height: 8rpx;
	transform: scaleY(0);
	transform-origin: bottom;
	transition: transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1);
	transition-delay: var(--delay, 0ms);

	&--appear {
		transform: scaleY(1);
	}

	&--active {
		background: rgba(16, 185, 129, 0.3);
	}

	&--today.bar--active {
		background: linear-gradient(180deg, #10B981 0%, #0EA5E9 100%);
	}
}

.page--dark .bar {
	background: $dark-bg-elevated;
	&--active { background: rgba(16, 185, 129, 0.25); }
	&--today.bar--active { background: linear-gradient(180deg, #10B981 0%, #0EA5E9 100%); }
}

.bar-label {
	font-size: 20rpx;
	color: $text-muted;
	margin-top: 8rpx;

	&--today {
		color: #10B981;
		font-weight: $font-weight-semibold;
	}
}
.page--dark .bar-label { color: $dark-text-muted; &--today { color: #34D399; } }

/* ==================== 提醒设置 ==================== */
.reminder-card {
	background: $bg-card;
	border-radius: $radius-xl;
	box-shadow: $shadow-sm;
	overflow: hidden;
}

.page--dark .reminder-card { background: $dark-bg-card; }

.reminder-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: $spacing-md $spacing-lg;

	&--time {
		border-top: 1rpx solid $border-color-light;
	}

	&__left {
		display: flex;
		align-items: center;
	}

	&__text {
		font-size: $font-size-base;
		color: $text-primary;
		margin-left: $spacing-sm;
	}

	&__right {
		display: flex;
		align-items: center;
	}
}

.page--dark .reminder-item {
	&--time { border-color: $dark-border-color; }
	&__text { color: $dark-text-primary; }
}

.reminder-icon {
	width: 36rpx;
	height: 36rpx;
	position: relative;

	&--bell {
		border: 3rpx solid #10B981;
		border-radius: 50% 50% 0 0;
		height: 28rpx;
		width: 30rpx;
		margin-top: 4rpx;
		&::after {
			content: '';
			position: absolute;
			bottom: -8rpx;
			left: 50%;
			width: 12rpx; height: 4rpx;
			background: #10B981;
			border-radius: 0 0 6rpx 6rpx;
			transform: translateX(-50%);
		}
	}

	&--clock {
		border: 3rpx solid #0EA5E9;
		border-radius: 50%;
		width: 30rpx; height: 30rpx;
		&::before {
			content: '';
			position: absolute;
			top: 50%; left: 50%;
			width: 2rpx; height: 10rpx;
			background: #0EA5E9;
			transform-origin: bottom center;
			transform: translate(-50%, -100%);
		}
		&::after {
			content: '';
			position: absolute;
			top: 50%; left: 50%;
			width: 7rpx; height: 2rpx;
			background: #0EA5E9;
			transform-origin: left center;
			transform: translateY(-50%);
		}
	}
}

.reminder-time {
	font-size: $font-size-base;
	color: $text-secondary;
	margin-right: $spacing-sm;
}
.page--dark .reminder-time { color: $dark-text-secondary; }

.reminder-arrow {
	width: 14rpx;
	height: 14rpx;
	border-top: 3rpx solid $text-muted;
	border-right: 3rpx solid $text-muted;
	transform: rotate(45deg);
}
.page--dark .reminder-arrow { border-color: $dark-text-muted; }

.reminder-switch {
	transform: scale(0.85);
}

.hidden-picker {
	position: fixed;
	top: -9999rpx;
	left: -9999rpx;
}
</style>
