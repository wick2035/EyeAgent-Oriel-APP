<template>
	<view
		class="reminder-card"
		:class="[
			{ 'reminder-card--completed': isCompleted },
			{ 'reminder-card--dark': isDark }
		]"
		@touchstart="onTouchStart"
		@touchmove="onTouchMove"
		@touchend="onTouchEnd"
	>
		<!-- 删除操作区域 -->
		<view
			class="reminder-card__delete"
			:class="{ 'reminder-card__delete--visible': swipeOffset > 0 }"
			:style="{ width: swipeOffset + 'rpx' }"
		>
			<view class="reminder-card__delete-btn" @click.stop="handleDelete">
				<view class="delete-icon"></view>
			</view>
		</view>

		<!-- 卡片主体 -->
		<view
			class="reminder-card__body"
			:style="{ transform: `translateX(${-swipeOffset}rpx)` }"
			@click="handleCardClick"
		>
			<!-- 左侧复选框 -->
			<view
				class="reminder-card__checkbox"
				:class="{ 'reminder-card__checkbox--checked': isCompleted }"
				@click.stop="handleToggleComplete"
			>
				<view v-if="isCompleted" class="check-tick"></view>
			</view>

			<!-- 内容区域 -->
			<view class="reminder-card__content">
				<!-- 第一行：药品信息 -->
				<view class="reminder-card__info">
					<text
						class="reminder-card__name"
						:class="{ 'reminder-card__name--completed': isCompleted }"
					>{{ medicineName }}</text>
					<text class="reminder-card__spec">{{ medicineSpec }}</text>
					<text v-if="dosage" class="reminder-card__dosage">·{{ dosage }}</text>
					<text v-if="frequency" class="reminder-card__frequency">（{{ frequency }}）</text>
				</view>

				<!-- 第二行：时间 -->
				<text
					class="reminder-card__time"
					:class="{ 'reminder-card__time--completed': isCompleted }"
				>{{ displayTime }}</text>
			</view>
		</view>
	</view>
</template>

<script>
import { isDarkMode } from '@/store/theme.js'
import { formatDisplayTime } from '@/store/medication.js'

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
			default: 'SCHEDULED'
		},
		showDate: {
			type: Boolean,
			default: false
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
			deleteWidth: 140
		}
	},
	computed: {
		isDark() {
			return isDarkMode()
		},
		isCompleted() {
			return this.status === 'READ'
		},
		displayTime() {
			return formatDisplayTime(this.scheduledTime, this.showDate)
		}
	},
	methods: {
		handleCardClick() {
			if (this.swipeOffset > 0) {
				this.swipeOffset = 0
				return
			}
			this.$emit('click', this.id)
		},
		handleToggleComplete() {
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

			if (!this.isSwiping) {
				if (deltaY > Math.abs(deltaX)) {
					return
				}
				if (Math.abs(deltaX) < 10) {
					return
				}
				this.isSwiping = true
			}

			if (deltaX > 0) {
				this.swipeOffset = Math.min(deltaX * 2, this.deleteWidth)
			} else {
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
	margin: 0 $spacing-lg $spacing-sm;
	position: relative;
	overflow: hidden;
	border-radius: $radius-lg;
	animation: card-fade-in 0.35s ease-out backwards;
	animation-delay: calc(var(--index, 0) * 0.05s);

	// 删除区域
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
		z-index: 0;

		&--visible {
			background: $color-error;
		}
	}

	&__delete-btn {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	// 卡片主体
	&__body {
		background: #FFFFFF;
		border-radius: $radius-lg;
		padding: $spacing-lg;
		display: flex;
		align-items: center;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
		transition: transform 0.2s ease;
		will-change: transform;
		transform: translateZ(0);
		z-index: 1;
		position: relative;
	}

	// 复选框
	&__checkbox {
		width: 48rpx;
		height: 48rpx;
		border-radius: 50%;
		border: 3rpx solid #D1D5DB;
		margin-right: $spacing-md;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

		&--checked {
			background: #10B981;
			border-color: #10B981;
			animation: check-bounce 0.4s ease;
		}
	}

	// 内容区域
	&__content {
		flex: 1;
		min-width: 0;
	}

	// 药品信息行
	&__info {
		display: flex;
		align-items: baseline;
		flex-wrap: wrap;
		margin-bottom: 8rpx;
	}

	&__name {
		font-size: $font-size-lg;
		font-weight: $font-weight-semibold;
		color: $text-primary;
		margin-right: 8rpx;

		&--completed {
			text-decoration: line-through;
			color: #9CA3AF;
		}
	}

	&__spec {
		font-size: $font-size-sm;
		color: $text-secondary;
	}

	&__dosage {
		font-size: $font-size-sm;
		color: $text-secondary;
	}

	&__frequency {
		font-size: $font-size-sm;
		color: $text-muted;
	}

	// 时间
	&__time {
		font-size: $font-size-sm;
		color: $text-secondary;

		&--completed {
			text-decoration: line-through;
			color: #9CA3AF;
		}
	}

	// 已完成卡片
	&--completed {
		.reminder-card__body {
			background: #FAFAFA;
		}
	}

	// 深色模式
	&--dark {
		.reminder-card__body {
			background: $dark-bg-card;
			box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.2);
		}

		.reminder-card__checkbox {
			border-color: #4B5563;
		}

		.reminder-card__name {
			color: $dark-text-primary;

			&--completed {
				color: #6B7280;
			}
		}

		.reminder-card__spec,
		.reminder-card__dosage {
			color: $dark-text-secondary;
		}

		.reminder-card__frequency {
			color: $dark-text-muted;
		}

		.reminder-card__time {
			color: $dark-text-secondary;

			&--completed {
				color: #6B7280;
			}
		}

		&.reminder-card--completed {
			.reminder-card__body {
				background: rgba(0, 0, 0, 0.2);
			}
		}
	}
}

// 勾选图标
.check-tick {
	width: 12rpx;
	height: 20rpx;
	border-right: 4rpx solid #fff;
	border-bottom: 4rpx solid #fff;
	transform: rotate(45deg) translateY(-2rpx);
}

// 删除图标
.delete-icon {
	width: 36rpx;
	height: 36rpx;
	position: relative;

	&::before,
	&::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		width: 28rpx;
		height: 4rpx;
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

// 动画
@keyframes card-fade-in {
	from {
		opacity: 0;
		transform: translateY(16rpx);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

@keyframes check-bounce {
	0% { transform: scale(1); }
	30% { transform: scale(1.25); }
	50% { transform: scale(0.9); }
	70% { transform: scale(1.1); }
	100% { transform: scale(1); }
}
</style>
