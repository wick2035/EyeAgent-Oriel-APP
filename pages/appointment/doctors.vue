<template>
	<view class="page" :class="{ 'page--dark': isDark }">
		<!-- 状态栏占位 -->
		<view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>

		<!-- 导航栏 -->
		<view class="navbar">
			<view class="navbar__back" @click="goBack">
				<view class="navbar__back-icon"></view>
			</view>
			<text class="navbar__title">{{ departmentName }}</text>
			<view class="navbar__placeholder"></view>
		</view>

		<!-- 筛选Tab -->
		<view class="filter-tabs">
			<view class="filter-tabs__track">
				<view
					v-for="(tab, index) in tabs"
					:key="tab.value"
					class="filter-tabs__item"
					:class="{ 'filter-tabs__item--active': currentTab === index }"
					@click="switchTab(index)"
				>
					<text>{{ tab.label }}</text>
				</view>
				<!-- 滑动指示器 -->
				<view class="filter-tabs__indicator" :style="{ transform: `translateX(${currentTab * 100}%)` }"></view>
			</view>
		</view>

		<!-- 内容区域 -->
		<scroll-view class="content" scroll-y @scrolltolower="loadMore">
			<!-- 骨架屏 -->
			<view v-if="loading" class="doctor-list">
				<view v-for="i in 3" :key="i" class="doctor-card doctor-card--skeleton">
					<view class="skeleton-avatar"></view>
					<view class="skeleton-content">
						<view class="skeleton-line skeleton-line--title"></view>
						<view class="skeleton-line skeleton-line--short"></view>
						<view class="skeleton-line skeleton-line--medium"></view>
						<view class="skeleton-line skeleton-line--short"></view>
					</view>
				</view>
			</view>

			<!-- 医生列表 -->
			<view v-else class="doctor-list">
				<view
					v-for="doctor in filteredDoctors"
					:key="doctor.id"
					class="doctor-card"
				>
					<!-- 头像区 -->
					<view class="doctor-card__avatar">
						<text class="doctor-card__avatar-text">{{ doctor.name.charAt(0) }}</text>
					</view>

					<!-- 信息区 -->
					<view class="doctor-card__info">
						<view class="doctor-card__header">
							<text class="doctor-card__name">{{ doctor.name }}</text>
							<view class="doctor-card__title-tag">{{ doctor.title }}</view>
							<view class="doctor-card__level-tag" :class="doctor.level === '专家' ? 'doctor-card__level-tag--expert' : 'doctor-card__level-tag--normal'">
								{{ doctor.level === '专家' ? '专家' : '普通' }}
							</view>
						</view>

						<view class="doctor-card__stats">
							<view class="doctor-card__rating">
								<view class="star-icon"></view>
								<text class="doctor-card__rating-value">{{ doctor.rating }}</text>
							</view>
							<text class="doctor-card__consult">{{ doctor.consultCount }}人已问诊</text>
						</view>

						<text class="doctor-card__specialties">擅长：{{ doctor.specialties.join('、') }}</text>

						<!-- 可约日期 -->
						<view class="doctor-card__dates">
							<text class="doctor-card__dates-label">近7天可约：</text>
							<view class="doctor-card__date-tags">
								<view
									v-for="(date, idx) in getAvailableDays(doctor.availableDates).slice(0, 4)"
									:key="idx"
									class="doctor-card__date-tag"
									:class="{ 'doctor-card__date-tag--today': date.isToday }"
								>
									{{ date.label }}
								</view>
								<text v-if="doctor.availableDates.length > 4" class="doctor-card__date-more">+{{ doctor.availableDates.length - 4 }}</text>
							</view>
						</view>

						<!-- 操作按钮 -->
						<view class="doctor-card__actions">
							<view class="doctor-card__btn doctor-card__btn--outline" @click="viewDetail(doctor)">
								详情
							</view>
							<view class="doctor-card__btn doctor-card__btn--primary" @click="goToAppointment(doctor)">
								预约挂号
							</view>
						</view>
					</view>
				</view>

				<!-- 空状态 -->
				<view v-if="filteredDoctors.length === 0 && !loading" class="empty-state">
					<view class="empty-state__icon">
						<view class="empty-icon"></view>
					</view>
					<text class="empty-state__text">暂无{{ tabs[currentTab].label }}医生</text>
				</view>
			</view>

			<!-- 底部安全区 -->
			<view class="safe-area"></view>
		</scroll-view>

		<!-- 顶部通知栏 -->
		<TopNotificationBar />
	</view>
</template>

<script>
import { isDarkMode } from '@/store/theme.js'
import { getDoctorList } from '@/utils/api/appointment.js'
import TopNotificationBar from '@/components/TopNotificationBar.vue'

export default {
	components: {
		TopNotificationBar
	},
	data() {
		return {
			statusBarHeight: 44,
			hospitalId: '',
			hospitalName: '',
			departmentId: '',
			departmentName: '',
			loading: true,
			currentTab: 0,
			tabs: [
				{ label: '全部', value: '' },
				{ label: '专家门诊', value: '专家' },
				{ label: '普通门诊', value: '普通' }
			],
			doctors: [],
			page: 1,
			pageSize: 20,
			hasMore: true
		}
	},
	computed: {
		isDark() {
			return isDarkMode()
		},
		filteredDoctors() {
			const level = this.tabs[this.currentTab].value
			if (!level) return this.doctors
			return this.doctors.filter(d => d.level === level)
		}
	},
	onLoad(options) {
		this.hospitalId = options.hospitalId || ''
		this.hospitalName = decodeURIComponent(options.hospitalName || '')
		this.departmentId = options.departmentId || ''
		this.departmentName = decodeURIComponent(options.departmentName || '选择医生')
		this.getStatusBarHeight()
		this.loadDoctors()
	},
	methods: {
		getStatusBarHeight() {
			const sysInfo = uni.getSystemInfoSync()
			this.statusBarHeight = sysInfo.statusBarHeight || 44
		},

		async loadDoctors() {
			this.loading = true
			try {
				const res = await getDoctorList({
					hospitalId: this.hospitalId,
					departmentId: this.departmentId,
					page: this.page,
					pageSize: this.pageSize
				})
				if (res.code === 200) {
					this.doctors = res.data.list || []
					this.hasMore = this.doctors.length >= this.pageSize
				}
			} catch (e) {
				console.error('加载医生列表失败:', e)
			} finally {
				this.loading = false
			}
		},

		switchTab(index) {
			this.currentTab = index
		},

		loadMore() {
			if (this.hasMore && !this.loading) {
				this.page++
				this.loadDoctors()
			}
		},

		getAvailableDays(dates) {
			const today = new Date()
			today.setHours(0, 0, 0, 0)
			const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

			return dates.map(dateStr => {
				const date = new Date(dateStr)
				const isToday = date.getTime() === today.getTime()
				const isTomorrow = date.getTime() === today.getTime() + 86400000

				let label
				if (isToday) {
					label = '今天'
				} else if (isTomorrow) {
					label = '明天'
				} else {
					label = weekdays[date.getDay()]
				}

				return { date: dateStr, label, isToday }
			})
		},

		viewDetail(doctor) {
			this.goToAppointment(doctor)
		},

		goToAppointment(doctor) {
			uni.navigateTo({
				url: `/pages/appointment/doctor-detail?doctorId=${doctor.id}&hospitalName=${encodeURIComponent(this.hospitalName)}&departmentName=${encodeURIComponent(this.departmentName)}`
			})
		},

		goBack() {
			uni.navigateBack()
		}
	}
}
</script>

<style lang="scss" scoped>
.page {
	min-height: 100vh;
	background: $bg-base;
	display: flex;
	flex-direction: column;
}

.status-bar {
	flex-shrink: 0;
}

// 导航栏
.navbar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	height: 88rpx;
	padding: 0 $spacing-md;
	flex-shrink: 0;

	&__back {
		width: 72rpx;
		height: 72rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	&__back-icon {
		width: 20rpx;
		height: 20rpx;
		border-left: 4rpx solid $text-primary;
		border-bottom: 4rpx solid $text-primary;
		transform: rotate(45deg);
	}

	&__title {
		flex: 1;
		text-align: center;
		font-size: $font-size-lg;
		font-weight: $font-weight-semibold;
		color: $text-primary;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		padding: 0 $spacing-md;
	}

	&__placeholder {
		width: 72rpx;
	}
}

// 筛选Tab
.filter-tabs {
	padding: $spacing-md $spacing-lg;
	flex-shrink: 0;

	&__track {
		display: flex;
		position: relative;
		background: $bg-elevated;
		border-radius: $radius-full;
		padding: 6rpx;
	}

	&__item {
		flex: 1;
		height: 64rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: $font-size-sm;
		color: $text-secondary;
		position: relative;
		z-index: 1;
		transition: color 0.3s ease;

		&--active {
			color: #fff;
			font-weight: $font-weight-medium;
		}
	}

	&__indicator {
		position: absolute;
		top: 6rpx;
		left: 6rpx;
		width: calc(33.333% - 4rpx);
		height: 64rpx;
		background: linear-gradient(135deg, $color-primary 0%, $color-primary-light 100%);
		border-radius: $radius-full;
		transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
		z-index: 0;
	}
}

// 内容区
.content {
	flex: 1;
	overflow: hidden;
}

.doctor-list {
	padding: 0 $spacing-lg;
}

// 医生卡片
.doctor-card {
	padding: $spacing-lg;
	background: $bg-card;
	border-radius: $radius-lg;
	box-shadow: $shadow-sm;
	margin-bottom: $spacing-md;
	display: flex;
	transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);

	&:active {
		transform: scale(0.99);
	}

	&--skeleton {
		pointer-events: none;
	}

	&__avatar {
		width: 120rpx;
		height: 120rpx;
		background: linear-gradient(135deg, $color-primary-light 0%, $color-primary 100%);
		border-radius: $radius-md;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	&__avatar-text {
		font-size: $font-size-3xl;
		color: #fff;
		font-weight: $font-weight-bold;
	}

	&__info {
		flex: 1;
		margin-left: $spacing-md;
		min-width: 0;
	}

	&__header {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: $spacing-xs;
		margin-bottom: $spacing-xs;
	}

	&__name {
		font-size: $font-size-lg;
		font-weight: $font-weight-semibold;
		color: $text-primary;
	}

	&__title-tag {
		font-size: $font-size-xs;
		color: $color-primary;
		background: rgba(30, 58, 95, 0.08);
		padding: 4rpx 12rpx;
		border-radius: $radius-xs;
	}

	&__level-tag {
		font-size: $font-size-xs;
		padding: 4rpx 12rpx;
		border-radius: $radius-xs;

		&--expert {
			background: rgba(245, 158, 11, 0.1);
			color: $color-warning;
		}

		&--normal {
			background: rgba(16, 185, 129, 0.1);
			color: $color-success;
		}
	}

	&__stats {
		display: flex;
		align-items: center;
		margin-bottom: $spacing-xs;
	}

	&__rating {
		display: flex;
		align-items: center;
		margin-right: $spacing-md;
	}

	&__rating-value {
		font-size: $font-size-sm;
		color: $color-warning;
		font-weight: $font-weight-semibold;
	}

	&__consult {
		font-size: $font-size-xs;
		color: $text-muted;
	}

	&__specialties {
		font-size: $font-size-sm;
		color: $text-secondary;
		margin-bottom: $spacing-sm;
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	&__dates {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		margin-bottom: $spacing-md;
	}

	&__dates-label {
		font-size: $font-size-xs;
		color: $text-muted;
		margin-right: $spacing-xs;
	}

	&__date-tags {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: $spacing-xs;
	}

	&__date-tag {
		font-size: $font-size-xs;
		color: $color-primary;
		background: rgba(30, 58, 95, 0.06);
		padding: 4rpx 12rpx;
		border-radius: $radius-xs;

		&--today {
			background: $color-primary;
			color: #fff;
		}
	}

	&__date-more {
		font-size: $font-size-xs;
		color: $text-muted;
	}

	&__actions {
		display: flex;
		gap: $spacing-sm;
	}

	&__btn {
		flex: 1;
		height: 64rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: $font-size-sm;
		font-weight: $font-weight-medium;
		border-radius: $radius-md;
		transition: all 0.25s ease;

		&--outline {
			background: transparent;
			border: 2rpx solid $border-color;
			color: $text-secondary;

			&:active {
				background: $bg-elevated;
			}
		}

		&--primary {
			background: linear-gradient(135deg, $color-primary 0%, $color-primary-light 100%);
			color: #fff;

			&:active {
				opacity: 0.85;
			}
		}
	}
}

// 星星图标
.star-icon {
	width: 24rpx;
	height: 24rpx;
	position: relative;
	margin-right: 4rpx;

	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 0;
		height: 0;
		border-left: 12rpx solid transparent;
		border-right: 12rpx solid transparent;
		border-bottom: 8rpx solid $color-warning;
	}

	&::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 0;
		height: 0;
		border-left: 12rpx solid transparent;
		border-right: 12rpx solid transparent;
		border-top: 16rpx solid $color-warning;
	}
}

// 骨架屏
.skeleton-avatar {
	width: 120rpx;
	height: 120rpx;
	border-radius: $radius-md;
	background: linear-gradient(90deg, $bg-elevated 25%, $bg-card 50%, $bg-elevated 75%);
	background-size: 200% 100%;
	animation: skeleton-loading 1.5s infinite;
}

.skeleton-content {
	flex: 1;
	margin-left: $spacing-md;
}

.skeleton-line {
	height: 28rpx;
	border-radius: $radius-xs;
	margin-bottom: $spacing-sm;
	background: linear-gradient(90deg, $bg-elevated 25%, $bg-card 50%, $bg-elevated 75%);
	background-size: 200% 100%;
	animation: skeleton-loading 1.5s infinite;

	&--title { width: 50%; }
	&--short { width: 40%; }
	&--medium { width: 80%; }
}

@keyframes skeleton-loading {
	0% { background-position: 200% 0; }
	100% { background-position: -200% 0; }
}

// 空状态
.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: $spacing-2xl 0;

	&__icon {
		width: 160rpx;
		height: 160rpx;
		background: $bg-elevated;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: $spacing-md;
	}

	&__text {
		font-size: $font-size-base;
		color: $text-muted;
	}
}

.empty-icon {
	width: 60rpx;
	height: 60rpx;
	border: 4rpx solid $text-muted;
	border-radius: 50%;
	position: relative;

	&::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 20rpx;
		height: 4rpx;
		background: $text-muted;
	}
}

.safe-area {
	height: calc(40rpx + env(safe-area-inset-bottom));
}

// ========== 深色模式 ==========
.page--dark {
	background: $dark-bg-base;

	.navbar {
		&__back-icon { border-color: $dark-text-primary; }
		&__title { color: $dark-text-primary; }
	}

	.filter-tabs {
		&__track { background: $dark-bg-elevated; }
		&__item {
			color: $dark-text-secondary;
			&--active { color: #fff; }
		}
		&__indicator {
			background: linear-gradient(135deg, $dark-color-primary 0%, lighten($dark-color-primary, 10%) 100%);
		}
	}

	.doctor-card {
		background: $dark-bg-card;

		&__avatar {
			background: linear-gradient(135deg, lighten($dark-color-primary, 10%) 0%, $dark-color-primary 100%);
		}

		&__name { color: $dark-text-primary; }

		&__title-tag {
			background: rgba(74, 144, 217, 0.15);
			color: $dark-color-primary;
		}

		&__level-tag {
			&--expert { background: rgba(245, 158, 11, 0.15); }
			&--normal { background: rgba(16, 185, 129, 0.15); }
		}

		&__consult { color: $dark-text-muted; }
		&__specialties { color: $dark-text-secondary; }
		&__dates-label { color: $dark-text-muted; }

		&__date-tag {
			background: rgba(74, 144, 217, 0.1);
			color: $dark-color-primary;

			&--today {
				background: $dark-color-primary;
				color: #fff;
			}
		}

		&__date-more { color: $dark-text-muted; }

		&__btn {
			&--outline {
				border-color: $dark-border-color;
				color: $dark-text-secondary;

				&:active { background: $dark-bg-elevated; }
			}

			&--primary {
				background: linear-gradient(135deg, $dark-color-primary 0%, lighten($dark-color-primary, 10%) 100%);
			}
		}
	}

	.skeleton-avatar,
	.skeleton-line {
		background: linear-gradient(90deg, $dark-bg-elevated 25%, $dark-bg-card 50%, $dark-bg-elevated 75%);
		background-size: 200% 100%;
	}

	.empty-state {
		&__icon { background: $dark-bg-elevated; }
		&__text { color: $dark-text-muted; }
	}

	.empty-icon {
		border-color: $dark-text-muted;
		&::before { background: $dark-text-muted; }
	}
}
</style>
