<template>
	<view class="stats-card" :class="{ 'stats-card--dark': isDark }">
		<!-- 顶部装饰条 -->
		<view class="stats-card__decoration"></view>

		<view class="stats-card__content">
			<!-- 今日待服药 -->
			<view class="stats-card__section">
				<text class="stats-card__label">今日待服药</text>
				<view class="stats-card__value-wrap">
					<text class="stats-card__value">{{ total }}</text>
					<text class="stats-card__unit">剂</text>
				</view>
			</view>

			<!-- 环形进度 -->
			<view class="stats-card__progress">
				<svg class="circular-progress" viewBox="0 0 100 100">
					<defs>
						<linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
							<stop offset="0%" style="stop-color:#0F766E" />
							<stop offset="50%" style="stop-color:#10B981" />
							<stop offset="100%" style="stop-color:#34D399" />
						</linearGradient>
					</defs>
					<circle class="circular-progress__track" cx="50" cy="50" r="42" />
					<circle
						class="circular-progress__fill"
						cx="50" cy="50" r="42"
						:style="progressStyle"
					/>
				</svg>
				<view class="stats-card__progress-text">
					<text class="stats-card__percent">{{ completionRate }}</text>
					<text class="stats-card__percent-sign">%</text>
				</view>
			</view>

			<!-- 下一个提醒 -->
			<view class="stats-card__section stats-card__section--right">
				<text class="stats-card__label">下一个提醒</text>
				<text v-if="nextReminder" class="stats-card__next-time">{{ countdown }}</text>
				<text v-else class="stats-card__next-time stats-card__next-time--empty">暂无</text>
				<text v-if="nextReminder" class="stats-card__next-drug">{{ nextReminder.medicineName }}</text>
			</view>
		</view>
	</view>
</template>

<script>
import { isDarkMode } from '@/store/theme.js'

export default {
	name: 'StatsCard',
	props: {
		total: {
			type: Number,
			default: 0
		},
		completed: {
			type: Number,
			default: 0
		},
		nextReminder: {
			type: Object,
			default: null
		},
		countdown: {
			type: String,
			default: ''
		}
	},
	computed: {
		isDark() {
			return isDarkMode()
		},
		completionRate() {
			if (this.total === 0) return 100
			return Math.round((this.completed / this.total) * 100)
		},
		progressStyle() {
			const circumference = 2 * Math.PI * 42
			const progress = this.completionRate / 100
			const dashOffset = circumference * (1 - progress)
			return {
				strokeDasharray: `${circumference}`,
				strokeDashoffset: `${dashOffset}`
			}
		}
	}
}
</script>

<style lang="scss" scoped>
.stats-card {
	margin: $spacing-lg;
	padding: $spacing-xl $spacing-lg;
	background: rgba(255, 255, 255, 0.9);
	backdrop-filter: blur(20px);
	-webkit-backdrop-filter: blur(20px);
	border-radius: $radius-xl;
	border: 1rpx solid rgba(16, 185, 129, 0.15);
	box-shadow:
		0 4rpx 24rpx rgba(16, 185, 129, 0.08),
		inset 0 1rpx 0 rgba(255, 255, 255, 0.5);
	position: relative;
	overflow: hidden;
	animation: card-enter 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s backwards;

	&__decoration {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 6rpx;
		background: linear-gradient(135deg, #0F766E 0%, #10B981 50%, #34D399 100%);
		border-radius: 3rpx 3rpx 0 0;
	}

	&__content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: $spacing-sm;
	}

	&__section {
		flex: 1;

		&--right {
			text-align: right;
		}
	}

	&__label {
		font-size: $font-size-sm;
		color: $text-muted;
		display: block;
		margin-bottom: $spacing-xs;
	}

	&__value-wrap {
		display: flex;
		align-items: baseline;
	}

	&__value {
		font-size: 56rpx;
		font-weight: $font-weight-bold;
		color: #10B981;
		font-family: $font-family-mono;
		line-height: 1;
	}

	&__unit {
		font-size: $font-size-base;
		color: $text-secondary;
		margin-left: $spacing-xs;
	}

	&__progress {
		width: 120rpx;
		height: 120rpx;
		position: relative;
		flex-shrink: 0;
		margin: 0 $spacing-lg;
	}

	&__progress-text {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		display: flex;
		align-items: baseline;
		justify-content: center;
	}

	&__percent {
		font-size: $font-size-xl;
		font-weight: $font-weight-bold;
		color: #10B981;
		font-family: $font-family-mono;
	}

	&__percent-sign {
		font-size: $font-size-xs;
		color: $text-muted;
		margin-left: 2rpx;
	}

	&__next-time {
		font-size: $font-size-lg;
		font-weight: $font-weight-semibold;
		color: #F59E0B;
		display: block;
		font-family: $font-family-mono;

		&--empty {
			color: $text-muted;
		}
	}

	&__next-drug {
		font-size: $font-size-xs;
		color: $text-secondary;
		display: block;
		margin-top: 4rpx;
		max-width: 160rpx;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	// 深色模式
	&--dark {
		background: rgba(22, 27, 34, 0.9);
		border-color: rgba(16, 185, 129, 0.2);
		box-shadow:
			0 4rpx 24rpx rgba(0, 0, 0, 0.2),
			inset 0 1rpx 0 rgba(255, 255, 255, 0.05);

		.stats-card__label {
			color: $dark-text-muted;
		}

		.stats-card__unit {
			color: $dark-text-secondary;
		}

		.stats-card__next-drug {
			color: $dark-text-secondary;
		}

		.circular-progress__track {
			stroke: rgba(16, 185, 129, 0.15);
		}
	}
}

.circular-progress {
	width: 100%;
	height: 100%;
	transform: rotate(-90deg);

	&__track {
		fill: none;
		stroke: rgba(16, 185, 129, 0.12);
		stroke-width: 8;
	}

	&__fill {
		fill: none;
		stroke: url(#progress-gradient);
		stroke-width: 8;
		stroke-linecap: round;
		transition: stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1);
	}
}

@keyframes card-enter {
	from {
		opacity: 0;
		transform: translateY(-40rpx);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}
</style>
