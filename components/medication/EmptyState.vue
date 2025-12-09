<template>
	<view class="empty-state" :class="{ 'empty-state--dark': isDark }">
		<!-- 药瓶图标 -->
		<view class="empty-state__icon">
			<view class="bottle">
				<view class="bottle__cap"></view>
				<view class="bottle__body">
					<view class="bottle__label"></view>
				</view>
			</view>
			<!-- 跳动的药丸 -->
			<view class="pills">
				<view class="pill pill--1"></view>
				<view class="pill pill--2"></view>
				<view class="pill pill--3"></view>
			</view>
		</view>

		<text class="empty-state__title">暂无用药提醒</text>
		<text class="empty-state__desc">添加用药提醒，按时服药更健康</text>

		<view class="empty-state__btn" @click="handleAdd">
			<text class="empty-state__btn-text">添加用药提醒</text>
			<view class="btn-shimmer"></view>
		</view>
	</view>
</template>

<script>
import { isDarkMode } from '@/store/theme.js'

export default {
	name: 'EmptyState',
	computed: {
		isDark() {
			return isDarkMode()
		}
	},
	methods: {
		handleAdd() {
			this.$emit('add')
		}
	}
}
</script>

<style lang="scss" scoped>
.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: $spacing-2xl $spacing-lg;
	min-height: 500rpx;

	&__icon {
		width: 200rpx;
		height: 200rpx;
		position: relative;
		margin-bottom: $spacing-xl;
	}

	&__title {
		font-size: $font-size-xl;
		font-weight: $font-weight-semibold;
		color: $text-primary;
		margin-bottom: $spacing-sm;
	}

	&__desc {
		font-size: $font-size-base;
		color: $text-secondary;
		text-align: center;
		margin-bottom: $spacing-xl;
	}

	&__btn {
		padding: $spacing-md $spacing-2xl;
		background: linear-gradient(135deg, #0F766E 0%, #10B981 50%, #34D399 100%);
		border-radius: $radius-full;
		position: relative;
		overflow: hidden;
		box-shadow: 0 8rpx 24rpx rgba(16, 185, 129, 0.3);
		transition: transform 0.2s ease, box-shadow 0.2s ease;

		&:active {
			transform: scale(0.96);
			box-shadow: 0 4rpx 12rpx rgba(16, 185, 129, 0.3);
		}
	}

	&__btn-text {
		font-size: $font-size-lg;
		font-weight: $font-weight-medium;
		color: #fff;
		position: relative;
		z-index: 1;
	}

	// 深色模式
	&--dark {
		.empty-state__title {
			color: $dark-text-primary;
		}

		.empty-state__desc {
			color: $dark-text-secondary;
		}

		.bottle__body {
			border-color: rgba(16, 185, 129, 0.5);
			background: rgba(16, 185, 129, 0.1);
		}

		.bottle__cap {
			background: linear-gradient(180deg, #34D399 0%, #10B981 100%);
		}
	}
}

// 药瓶
.bottle {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	animation: bottle-wobble 3s ease-in-out infinite;

	&__cap {
		width: 40rpx;
		height: 20rpx;
		background: linear-gradient(180deg, #6EE7B7 0%, #10B981 100%);
		border-radius: 6rpx 6rpx 0 0;
		margin: 0 auto;
	}

	&__body {
		width: 70rpx;
		height: 100rpx;
		border: 4rpx solid rgba(16, 185, 129, 0.6);
		border-radius: 8rpx 8rpx 16rpx 16rpx;
		background: rgba(16, 185, 129, 0.08);
		position: relative;
		overflow: hidden;
	}

	&__label {
		position: absolute;
		top: 20rpx;
		left: 10rpx;
		right: 10rpx;
		height: 40rpx;
		background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.3) 100%);
		border-radius: 4rpx;

		&::before {
			content: '';
			position: absolute;
			top: 8rpx;
			left: 6rpx;
			right: 6rpx;
			height: 4rpx;
			background: rgba(16, 185, 129, 0.4);
			border-radius: 2rpx;
		}

		&::after {
			content: '';
			position: absolute;
			top: 18rpx;
			left: 6rpx;
			width: 60%;
			height: 4rpx;
			background: rgba(16, 185, 129, 0.4);
			border-radius: 2rpx;
		}
	}
}

// 药丸
.pills {
	position: absolute;
	bottom: 30rpx;
	left: 50%;
	transform: translateX(-50%);
	display: flex;
	gap: $spacing-sm;
}

.pill {
	width: 24rpx;
	height: 12rpx;
	border-radius: 6rpx;
	animation: pill-bounce 1.5s ease-in-out infinite;

	&--1 {
		background: linear-gradient(90deg, #10B981 50%, #6EE7B7 50%);
		animation-delay: 0s;
	}

	&--2 {
		background: linear-gradient(90deg, #F59E0B 50%, #FCD34D 50%);
		animation-delay: -0.2s;
	}

	&--3 {
		background: linear-gradient(90deg, #6366F1 50%, #A5B4FC 50%);
		animation-delay: -0.4s;
	}
}

// 按钮光效
.btn-shimmer {
	position: absolute;
	top: 0;
	left: -100%;
	width: 100%;
	height: 100%;
	background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
	animation: shimmer 2.5s ease-in-out infinite;
}

@keyframes bottle-wobble {
	0%, 100% { transform: translate(-50%, -50%) rotate(-3deg); }
	25% { transform: translate(-50%, -50%) rotate(3deg); }
	50% { transform: translate(-50%, -50%) rotate(-2deg); }
	75% { transform: translate(-50%, -50%) rotate(2deg); }
}

@keyframes pill-bounce {
	0%, 100% { transform: translateY(0); }
	50% { transform: translateY(-15rpx); }
}

@keyframes shimmer {
	0% { left: -100%; }
	50%, 100% { left: 100%; }
}
</style>
