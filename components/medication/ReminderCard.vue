<template>
	<view
		class="reminder-card"
		:class="[
			`reminder-card--${status}`,
			{ 'reminder-card--dark': isDark },
			{ 'reminder-card--disabled': !enabled }
		]"
		@click="handleClick"
		@touchstart="onTouchStart"
		@touchmove="onTouchMove"
		@touchend="onTouchEnd"
	>
		<!-- 删除操作区域 -->
		<view class="reminder-card__delete" :class="{ 'reminder-card__delete--visible': swipeOffset > 0 }" :style="{ width: deleteWidth + 'rpx' }">
			<view class="reminder-card__delete-btn" @click.stop="handleDelete">
				<view class="delete-icon"></view>
			</view>
		</view>

		<!-- 卡片主体 -->
		<view class="reminder-card__body" :style="{ transform: `translateX(${-swipeOffset}rpx)` }">
			<!-- 左侧状态条 -->
			<view class="reminder-card__status-bar"></view>

			<view class="reminder-card__content">
				<!-- 药物图标 -->
				<view class="reminder-card__icon" :class="[`reminder-card__icon--${medicineType}`]">
					<view class="drug-icon" :class="[`drug-icon--${medicineType}`]"></view>
				</view>

				<!-- 药物信息 -->
				<view class="reminder-card__info">
					<text class="reminder-card__name">{{ medicineName }}</text>
					<text class="reminder-card__spec">{{ medicineSpec }} · {{ dosage }}</text>
					<view class="reminder-card__meta">
						<view class="reminder-card__time">
							<view class="time-icon"></view>
							<text>{{ formatTime }}</text>
						</view>
						<text class="reminder-card__frequency">{{ frequency }}</text>
					</view>
				</view>

				<!-- 完成按钮 -->
				<view
					class="reminder-card__check"
					:class="{ 'reminder-card__check--completed': isCompleted }"
					@click.stop="handleToggleComplete"
				>
					<view v-if="isCompleted" class="check-icon"></view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { isDarkMode } from '@/store/theme.js'

export default {
	name: 'ReminderCard',
	props: {
		id: {
			type: String,
			required: true
		},
		medicineName: {
			type: String,
			required: true
		},
		medicineSpec: {
			type: String,
			default: ''
		},
		dosage: {
			type: String,
			default: ''
		},
		medicineType: {
			type: String,
			default: 'pill', // drops, pill, capsule, injection
			validator: (value) => ['drops', 'pill', 'capsule', 'injection'].includes(value)
		},
		frequency: {
			type: String,
			default: ''
		},
		scheduledTime: {
			type: String,
			default: ''
		},
		status: {
			type: String,
			default: 'SCHEDULED', // SCHEDULED, UNREAD, READ
			validator: (value) => ['SCHEDULED', 'UNREAD', 'READ'].includes(value)
		},
		enabled: {
			type: Boolean,
			default: true
		},
		index: {
			type: Number,
			default: 0
		}
	},
	data() {
		return {
			swipeOffset: 0,
			startX: 0,
			startY: 0,
			isSwiping: false,
			deleteWidth: 160
		}
	},
	computed: {
		isDark() {
			return isDarkMode()
		},
		isCompleted() {
			return this.status === 'READ'
		},
		formatTime() {
			if (!this.scheduledTime) return ''
			return this.scheduledTime.substring(11, 16)
		}
	},
	methods: {
		handleClick() {
			if (this.swipeOffset > 0) {
				this.swipeOffset = 0
				return
			}
			this.$emit('click', this.id)
		},
		handleToggleComplete() {
			// 已完成状态不允许取消
			if (this.isCompleted) {
				return
			}
			this.$emit('toggle-complete', this.id, true)
		},
		handleDelete() {
			this.$emit('delete', this.id)
			this.swipeOffset = 0
		},
		onTouchStart(e) {
			this.startX = e.touches[0].clientX
			this.startY = e.touches[0].clientY
			this.isSwiping = false
		},
		onTouchMove(e) {
			const deltaX = this.startX - e.touches[0].clientX
			const deltaY = Math.abs(e.touches[0].clientY - this.startY)

			// 如果还没确定滑动方向
			if (!this.isSwiping) {
				// 垂直移动大于水平移动，认为是页面滚动，不处理卡片滑动
				if (deltaY > Math.abs(deltaX)) {
					return
				}
				// 水平移动达到阈值才开始卡片滑动
				if (Math.abs(deltaX) < 10) {
					return
				}
				this.isSwiping = true
			}

			if (deltaX > 0) {
				// 向左滑动
				this.swipeOffset = Math.min(deltaX * 2, this.deleteWidth)
			} else {
				// 向右滑动恢复
				this.swipeOffset = Math.max(0, this.swipeOffset + deltaX * 2)
			}
		},
		onTouchEnd() {
			if (this.swipeOffset > this.deleteWidth / 2) {
				this.swipeOffset = this.deleteWidth
			} else {
				this.swipeOffset = 0
			}
			this.isSwiping = false
		}
	}
}
</script>

<style lang="scss" scoped>
.reminder-card {
	margin: 0 $spacing-lg $spacing-md;
	position: relative;
	overflow: hidden;
	border-radius: $radius-lg;
	animation: card-slide-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) backwards;
	animation-delay: calc(var(--index, 0) * 0.06s);

	&__delete {
		position: absolute;
		right: 0;
		top: 0;
		bottom: 0;
		background: transparent;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 0;
		overflow: hidden;
		border-radius: 0;
		z-index: 0;

		&--visible {
			background: $color-error;
		}
	}

	&__delete-btn {
		width: 80rpx;
		height: 80rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	&__body {
		background: $bg-card;
		border-radius: $radius-lg;
		box-shadow: $shadow-sm;
		position: relative;
		transition: transform 0.2s ease;
		will-change: transform;
		transform: translateZ(0); // 开启 GPU 加速
		z-index: 1;
	}

	&__status-bar {
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 6rpx;
		background: #6366F1;
		border-radius: 3rpx 0 0 3rpx;
		transition: background 0.3s ease;
	}

	&--READ &__status-bar {
		background: #10B981;
	}

	&--UNREAD &__status-bar {
		background: #F59E0B;
		animation: status-pulse 1.5s ease-in-out infinite;
	}

	&__content {
		display: flex;
		align-items: center;
		padding: $spacing-lg;
		padding-left: calc($spacing-lg + 6rpx);
	}

	&__icon {
		width: 80rpx;
		height: 80rpx;
		border-radius: $radius-md;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: $spacing-md;
		flex-shrink: 0;

		&--drops {
			background: linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(6, 182, 212, 0.2) 100%);
		}

		&--pill {
			background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.2) 100%);
		}

		&--capsule {
			background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.2) 100%);
		}

		&--injection {
			background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.2) 100%);
		}
	}

	&__info {
		flex: 1;
		min-width: 0;
	}

	&__name {
		font-size: $font-size-lg;
		font-weight: $font-weight-semibold;
		color: $text-primary;
		display: block;
		margin-bottom: 4rpx;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	&__spec {
		font-size: $font-size-sm;
		color: $text-secondary;
		display: block;
		margin-bottom: $spacing-xs;
	}

	&__meta {
		display: flex;
		align-items: center;
	}

	&__time {
		font-size: $font-size-sm;
		color: $text-muted;
		display: flex;
		align-items: center;
	}

	&__frequency {
		font-size: $font-size-xs;
		color: $text-muted;
		margin-left: $spacing-md;
		padding: 4rpx 12rpx;
		background: $bg-elevated;
		border-radius: $radius-xs;
	}

	&__check {
		width: 56rpx;
		height: 56rpx;
		border-radius: 50%;
		border: 3rpx solid #6366F1;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-left: $spacing-md;
		flex-shrink: 0;
		transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);

		&--completed {
			background: #10B981;
			border-color: #10B981;
			transform: scale(1.1);
		}
	}

	&--disabled {
		opacity: 0.5;
	}

	// 深色模式
	&--dark {
		.reminder-card__body {
			background: $dark-bg-card;
			box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.2);
		}

		.reminder-card__name {
			color: $dark-text-primary;
		}

		.reminder-card__spec {
			color: $dark-text-secondary;
		}

		.reminder-card__time {
			color: $dark-text-muted;
		}

		.reminder-card__frequency {
			background: $dark-bg-elevated;
			color: $dark-text-muted;
		}
	}
}

// 药物图标
.drug-icon {
	&--drops {
		width: 36rpx;
		height: 48rpx;
		position: relative;

		&::before {
			content: '';
			position: absolute;
			bottom: 0;
			left: 50%;
			transform: translateX(-50%);
			width: 24rpx;
			height: 36rpx;
			border: 3rpx solid #06B6D4;
			border-radius: 12rpx 12rpx 6rpx 6rpx;
		}

		&::after {
			content: '';
			position: absolute;
			top: 0;
			left: 50%;
			transform: translateX(-50%);
			width: 12rpx;
			height: 14rpx;
			background: #06B6D4;
			border-radius: 0 0 6rpx 6rpx;
		}
	}

	&--pill {
		width: 44rpx;
		height: 20rpx;
		border-radius: 10rpx;
		background: linear-gradient(90deg, #10B981 50%, #6EE7B7 50%);
		border: 2rpx solid #10B981;
	}

	&--capsule {
		width: 42rpx;
		height: 18rpx;
		border-radius: 9rpx;
		background: linear-gradient(90deg, #F59E0B 50%, #FCD34D 50%);
		border: 2rpx solid #F59E0B;
		transform: rotate(-30deg);
	}

	&--injection {
		width: 48rpx;
		height: 16rpx;
		position: relative;

		&::before {
			content: '';
			position: absolute;
			left: 0;
			top: 0;
			width: 36rpx;
			height: 16rpx;
			border: 2rpx solid #EF4444;
			border-radius: 2rpx;
			background: linear-gradient(90deg, transparent 60%, rgba(239, 68, 68, 0.2) 100%);
		}

		&::after {
			content: '';
			position: absolute;
			right: 0;
			top: 50%;
			transform: translateY(-50%);
			width: 12rpx;
			height: 2rpx;
			background: #EF4444;
		}
	}
}

// 时间图标
.time-icon {
	width: 24rpx;
	height: 24rpx;
	border: 2rpx solid $text-muted;
	border-radius: 50%;
	margin-right: 6rpx;
	position: relative;

	&::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		width: 2rpx;
		height: 8rpx;
		background: $text-muted;
		transform-origin: bottom center;
		transform: translate(-50%, -100%) rotate(0deg);
	}

	&::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		width: 2rpx;
		height: 6rpx;
		background: $text-muted;
		transform-origin: bottom center;
		transform: translate(-50%, -100%) rotate(90deg);
	}
}

// 勾选图标
.check-icon {
	width: 14rpx;
	height: 24rpx;
	border-right: 4rpx solid #fff;
	border-bottom: 4rpx solid #fff;
	transform: rotate(45deg);
	margin-top: -6rpx;
}

// 删除图标
.delete-icon {
	width: 32rpx;
	height: 32rpx;
	position: relative;

	&::before,
	&::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		width: 24rpx;
		height: 3rpx;
		background: #fff;
		border-radius: 2rpx;
	}

	&::before {
		transform: translate(-50%, -50%) rotate(45deg);
	}

	&::after {
		transform: translate(-50%, -50%) rotate(-45deg);
	}
}

@keyframes card-slide-in {
	from {
		opacity: 0;
		transform: translateX(-30rpx);
	}
	to {
		opacity: 1;
		transform: translateX(0);
	}
}

@keyframes status-pulse {
	0%, 100% { opacity: 1; }
	50% { opacity: 0.5; }
}
</style>
