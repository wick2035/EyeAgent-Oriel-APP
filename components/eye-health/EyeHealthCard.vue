<template>
	<view
		class="eye-card"
		:class="{ 'eye-card--dark': isDark }"
		:style="{ animationDelay: delay + 's' }"
		@click="handleClick"
	>
		<!-- 标题 -->
		<text class="eye-card__title">{{ title }}</text>

		<!-- 数值 -->
		<view class="eye-card__main">
			<text class="eye-card__value">{{ mainValue }}</text>
			<text v-if="mainUnit" class="eye-card__unit">{{ mainUnit }}</text>
		</view>

		<!-- 状态指示器 -->
		<RiskIndicator :status="status" />
	</view>
</template>

<script>
import RiskIndicator from './RiskIndicator.vue'
import { isDarkMode } from '@/store/theme.js'
import { RISK_LEVEL } from '@/store/eyeHealth.js'

export default {
	name: 'EyeHealthCard',
	components: {
		RiskIndicator
	},
	props: {
		title: {
			type: String,
			required: true
		},
		mainValue: {
			type: [String, Number],
			required: true
		},
		mainUnit: {
			type: String,
			default: ''
		},
		status: {
			type: String,
			default: RISK_LEVEL.NORMAL
		},
		delay: {
			type: Number,
			default: 0
		}
	},
	computed: {
		isDark() {
			return isDarkMode()
		}
	},
	methods: {
		handleClick() {
			this.$emit('click')
		}
	}
}
</script>

<style lang="scss" scoped>
.eye-card {
	width: 200rpx;
	flex-shrink: 0;
	background: rgba(255, 255, 255, 0.9);
	backdrop-filter: blur(20px);
	-webkit-backdrop-filter: blur(20px);
	border-radius: 24rpx;
	border: 1rpx solid rgba(255, 255, 255, 0.2);
	box-shadow: 0 4rpx 20rpx rgba(30, 58, 95, 0.08);
	padding: 24rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
	transition: transform 200ms ease, box-shadow 200ms ease;
	animation: card-enter 0.4s cubic-bezier(0.16, 1, 0.3, 1) backwards;

	&:active {
		transform: scale(0.96);
		box-shadow: 0 2rpx 10rpx rgba(30, 58, 95, 0.06);
	}

	&__title {
		font-size: 24rpx;
		color: #5A6B7C;
		margin-bottom: 12rpx;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100%;
	}

	&__main {
		display: flex;
		align-items: baseline;
		justify-content: center;
		margin-bottom: 16rpx;
	}

	&__value {
		font-size: 44rpx;
		font-weight: 700;
		color: #1A2B3C;
		line-height: 1;
	}

	&__unit {
		font-size: 22rpx;
		color: #9AABBF;
		margin-left: 4rpx;
		font-weight: 500;
	}

	// 深色模式
	&--dark {
		background: rgba(22, 27, 34, 0.9);
		border-color: rgba(255, 255, 255, 0.08);
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.2);

		.eye-card__title {
			color: #8B949E;
		}

		.eye-card__value {
			color: #F0F6FC;
		}

		.eye-card__unit {
			color: #484F58;
		}
	}
}

@keyframes card-enter {
	0% {
		opacity: 0;
		transform: translateY(20rpx);
	}
	100% {
		opacity: 1;
		transform: translateY(0);
	}
}
</style>
