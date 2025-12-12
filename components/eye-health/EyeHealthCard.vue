<template>
	<view
		class="eye-card"
		:class="{ 'eye-card--dark': isDark }"
		:style="{ animationDelay: delay + 's' }"
		@click="handleClick"
	>
		<!-- 左侧渐变装饰线 -->
		<view class="eye-card__accent"></view>

		<!-- 图标区域 -->
		<view class="eye-card__icon">
			<view class="icon" :class="`icon--${icon}`"></view>
		</view>

		<!-- 内容区域 -->
		<view class="eye-card__content">
			<text class="eye-card__title">{{ title }}</text>
			<view class="eye-card__main">
				<text class="eye-card__value">{{ mainValue }}</text>
				<text v-if="mainUnit" class="eye-card__unit">{{ mainUnit }}</text>
			</view>
			<text class="eye-card__label">{{ mainLabel }}</text>
			<!-- 副指标 -->
			<view v-if="subItems && subItems.length" class="eye-card__sub">
				<view v-for="(item, idx) in subItems" :key="idx" class="eye-card__sub-item">
					<text class="eye-card__sub-label">{{ item.label }}</text>
					<text class="eye-card__sub-value">{{ item.value }}</text>
				</view>
			</view>
		</view>

		<!-- 状态指示器 -->
		<view class="eye-card__status">
			<RiskIndicator :status="status" />
		</view>
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
		icon: {
			type: String,
			default: 'eye'
		},
		mainValue: {
			type: [String, Number],
			required: true
		},
		mainUnit: {
			type: String,
			default: ''
		},
		mainLabel: {
			type: String,
			default: ''
		},
		subItems: {
			type: Array,
			default: () => []
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
	position: relative;
	background: rgba(255, 255, 255, 0.85);
	backdrop-filter: blur(20px);
	-webkit-backdrop-filter: blur(20px);
	border-radius: 32rpx;
	border: 1rpx solid rgba(255, 255, 255, 0.18);
	box-shadow: 0 8rpx 32rpx rgba(30, 58, 95, 0.08);
	padding: 32rpx;
	padding-left: 40rpx;
	display: flex;
	align-items: flex-start;
	overflow: hidden;
	transition: transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1),
	            box-shadow 250ms ease;
	animation: card-enter 0.5s cubic-bezier(0.16, 1, 0.3, 1) backwards;

	&:active {
		transform: scale(0.98);
		box-shadow: 0 4rpx 16rpx rgba(30, 58, 95, 0.06);
	}

	// 左侧渐变装饰线
	&__accent {
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 6rpx;
		background: linear-gradient(180deg, #667EEA 0%, #764BA2 100%);
		border-radius: 3rpx 0 0 3rpx;
	}

	// 图标区域
	&__icon {
		width: 80rpx;
		height: 80rpx;
		border-radius: 20rpx;
		background: linear-gradient(135deg, rgba(102, 126, 234, 0.12) 0%, rgba(118, 75, 162, 0.18) 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 24rpx;
		flex-shrink: 0;
	}

	// 内容区域
	&__content {
		flex: 1;
		min-width: 0;
	}

	&__title {
		font-size: 24rpx;
		color: #5A6B7C;
		margin-bottom: 8rpx;
		display: block;
	}

	&__main {
		display: flex;
		align-items: baseline;
		margin-bottom: 4rpx;
	}

	&__value {
		font-size: 48rpx;
		font-weight: 700;
		color: #1A2B3C;
		font-family: 'PingFang SC', -apple-system, sans-serif;
		line-height: 1.1;
	}

	&__unit {
		font-size: 24rpx;
		color: #9AABBF;
		margin-left: 4rpx;
		font-weight: 500;
	}

	&__label {
		font-size: 22rpx;
		color: #9AABBF;
		display: block;
		margin-top: 2rpx;
	}

	// 副指标区域
	&__sub {
		margin-top: 12rpx;
		padding-top: 12rpx;
		border-top: 1rpx solid rgba(0, 0, 0, 0.05);
	}

	&__sub-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 4rpx;

		&:last-child {
			margin-bottom: 0;
		}
	}

	&__sub-label {
		font-size: 22rpx;
		color: #9AABBF;
	}

	&__sub-value {
		font-size: 22rpx;
		color: #5A6B7C;
		font-weight: 500;
	}

	// 状态区域
	&__status {
		flex-shrink: 0;
		margin-left: 16rpx;
		align-self: flex-start;
	}

	// 深色模式
	&--dark {
		background: rgba(22, 27, 34, 0.85);
		border-color: rgba(255, 255, 255, 0.08);
		box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.25);

		.eye-card__title {
			color: #8B949E;
		}

		.eye-card__value {
			color: #F0F6FC;
		}

		.eye-card__unit,
		.eye-card__label,
		.eye-card__sub-label {
			color: #484F58;
		}

		.eye-card__sub-value {
			color: #8B949E;
		}

		.eye-card__sub {
			border-top-color: rgba(255, 255, 255, 0.06);
		}

		.eye-card__icon {
			background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.25) 100%);
		}
	}
}

// 图标样式
.icon {
	width: 40rpx;
	height: 40rpx;
	background-size: contain;
	background-repeat: no-repeat;
	background-position: center;

	&--eye {
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23667EEA' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z'%3E%3C/path%3E%3Ccircle cx='12' cy='12' r='3'%3E%3C/circle%3E%3C/svg%3E");
	}

	&--shield {
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23667EEA' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'%3E%3C/path%3E%3Cpath d='M9 12l2 2 4-4'%3E%3C/path%3E%3C/svg%3E");
	}

	&--chart {
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23667EEA' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M18 20V10'%3E%3C/path%3E%3Cpath d='M12 20V4'%3E%3C/path%3E%3Cpath d='M6 20v-6'%3E%3C/path%3E%3C/svg%3E");
	}

	&--alert {
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23667EEA' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z'%3E%3C/path%3E%3Cline x1='12' y1='9' x2='12' y2='13'%3E%3C/line%3E%3Cline x1='12' y1='17' x2='12.01' y2='17'%3E%3C/line%3E%3C/svg%3E");
	}
}

@keyframes card-enter {
	0% {
		opacity: 0;
		transform: translateY(30rpx);
	}
	100% {
		opacity: 1;
		transform: translateY(0);
	}
}
</style>
