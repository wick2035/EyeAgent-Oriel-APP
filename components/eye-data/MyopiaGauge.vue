<template>
	<view class="gauge" :class="{ 'gauge--dark': isDark }">
		<text class="gauge__eye-label">{{ eyeLabel }}</text>
		<text class="gauge__value" :style="{ color: riskConfig.color }">{{ displayDegree }}</text>
		<view class="gauge__badge" :style="{ background: riskConfig.bgColor }">
			<text class="gauge__badge-text" :style="{ color: riskConfig.color }">{{ riskConfig.label }}</text>
		</view>
	</view>
</template>

<script>
import { isDarkMode } from '@/store/theme.js'
import { getMyopiaRisk } from '@/store/eyeHealth.js'

export default {
	name: 'MyopiaGauge',
	props: {
		degree: {
			type: Number,
			default: 0
		},
		eye: {
			type: String,
			default: 'OD',
			validator: v => ['OD', 'OS'].includes(v)
		}
	},
	computed: {
		isDark() {
			return isDarkMode()
		},
		eyeLabel() {
			return this.eye === 'OD' ? 'OD 右眼' : 'OS 左眼'
		},
		displayDegree() {
			if (!this.degree) return '--'
			return this.degree.toFixed(2) + 'D'
		},
		riskConfig() {
			return getMyopiaRisk(this.degree)
		}
	}
}
</script>

<style lang="scss" scoped>
.gauge {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 20rpx 0 16rpx;

	&__eye-label {
		font-size: 22rpx;
		color: #5A6B7C;
		font-weight: 500;
		letter-spacing: 1rpx;
		margin-bottom: 12rpx;
	}

	&__value {
		font-size: 48rpx;
		font-weight: 700;
		font-family: 'Menlo', 'Consolas', monospace;
		line-height: 1.1;
	}

	&__badge {
		margin-top: 10rpx;
		padding: 4rpx 16rpx;
		border-radius: 16rpx;
	}

	&__badge-text {
		font-size: 20rpx;
		font-weight: 500;
	}

	&--dark {
		.gauge__eye-label {
			color: #8B949E;
		}
	}
}
</style>
