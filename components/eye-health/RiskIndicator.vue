<template>
	<view
		class="risk-indicator"
		:class="[`risk-indicator--${status}`, { 'risk-indicator--dark': isDark }]"
		:style="indicatorStyle"
	>
		<view
			class="risk-indicator__dot"
			:class="{ 'risk-indicator__dot--animated': shouldAnimate }"
			:style="dotStyle"
		></view>
		<text class="risk-indicator__label" :style="labelStyle">{{ label }}</text>
	</view>
</template>

<script>
import { RISK_CONFIG, RISK_LEVEL } from '@/store/eyeHealth.js'
import { isDarkMode } from '@/store/theme.js'

export default {
	name: 'RiskIndicator',
	props: {
		status: {
			type: String,
			default: RISK_LEVEL.NORMAL,
			validator: (value) => Object.values(RISK_LEVEL).includes(value)
		}
	},
	computed: {
		isDark() {
			return isDarkMode()
		},
		config() {
			return RISK_CONFIG[this.status] || RISK_CONFIG[RISK_LEVEL.NORMAL]
		},
		label() {
			return this.config.label
		},
		shouldAnimate() {
			return this.status === RISK_LEVEL.HIGH || this.status === RISK_LEVEL.MEDIUM
		},
		indicatorStyle() {
			return {
				backgroundColor: this.config.bgColor
			}
		},
		dotStyle() {
			return {
				backgroundColor: this.config.color
			}
		},
		labelStyle() {
			return {
				color: this.config.color
			}
		}
	}
}
</script>

<style lang="scss" scoped>
.risk-indicator {
	display: inline-flex;
	align-items: center;
	padding: 8rpx 16rpx;
	border-radius: 9999rpx;
	transition: all 250ms ease;

	&__dot {
		width: 12rpx;
		height: 12rpx;
		border-radius: 50%;
		margin-right: 8rpx;
		flex-shrink: 0;
		position: relative;

		&--animated {
			&::after {
				content: '';
				position: absolute;
				top: 50%;
				left: 50%;
				width: 100%;
				height: 100%;
				border-radius: 50%;
				transform: translate(-50%, -50%);
				animation: pulse-ring 2s ease-out infinite;
				background: inherit;
			}
		}
	}

	&__label {
		font-size: 22rpx;
		font-weight: 500;
		white-space: nowrap;
	}

	// 深色模式微调
	&--dark {
		&.risk-indicator--normal {
			background: rgba(16, 185, 129, 0.15);
		}
		&.risk-indicator--attention {
			background: rgba(245, 158, 11, 0.15);
		}
		&.risk-indicator--medium {
			background: rgba(249, 115, 22, 0.15);
		}
		&.risk-indicator--high {
			background: rgba(239, 68, 68, 0.15);
		}
	}
}

@keyframes pulse-ring {
	0% {
		box-shadow: 0 0 0 0 currentColor;
		opacity: 0.6;
	}
	100% {
		box-shadow: 0 0 0 12rpx currentColor;
		opacity: 0;
	}
}
</style>
