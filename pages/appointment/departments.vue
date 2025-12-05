<template>
	<view class="page" :class="{ 'page--dark': isDark }">
		<!-- 状态栏占位 -->
		<view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>

		<!-- 导航栏 -->
		<view class="navbar">
			<view class="navbar__back" @click="goBack">
				<view class="navbar__back-icon"></view>
			</view>
			<text class="navbar__title">{{ hospitalName }}</text>
			<view class="navbar__placeholder"></view>
		</view>

		<!-- 内容区域 -->
		<scroll-view class="content" scroll-y>
			<!-- 医院信息卡片 -->
			<view class="hospital-info">
				<view class="hospital-info__row">
					<view class="hospital-info__icon hospital-info__icon--location"></view>
					<text class="hospital-info__text">{{ hospitalDetail?.address || '加载中...' }}</text>
				</view>
				<view class="hospital-info__row">
					<view class="hospital-info__icon hospital-info__icon--time"></view>
					<text class="hospital-info__text">挂号时间：{{ hospitalDetail?.openTime || '07:00-17:00' }}</text>
				</view>
			</view>

			<!-- 热门科室 -->
			<view class="section">
				<view class="section__header">
					<view class="section__icon section__icon--hot"></view>
					<text class="section__title">热门科室</text>
				</view>

				<!-- 骨架屏 -->
				<view v-if="loading" class="hot-grid">
					<view v-for="i in 6" :key="i" class="hot-item hot-item--skeleton">
						<view class="skeleton-icon"></view>
						<view class="skeleton-text"></view>
						<view class="skeleton-badge"></view>
					</view>
				</view>

				<!-- 热门科室网格 -->
				<view v-else class="hot-grid">
					<view
						v-for="dept in hotDepartments"
						:key="dept.id"
						class="hot-item"
						@click="goToDoctors(dept)"
					>
						<view class="hot-item__icon" :class="'hot-item__icon--' + dept.icon">
							<view class="eye-icon" v-if="dept.icon === 'cataract'">
								<view class="eye-icon__outer"></view>
								<view class="eye-icon__inner"></view>
								<view class="eye-icon__pupil"></view>
							</view>
							<view class="eye-icon" v-else-if="dept.icon === 'glaucoma'">
								<view class="eye-icon__outer"></view>
								<view class="eye-icon__pressure"></view>
							</view>
							<view class="eye-icon" v-else-if="dept.icon === 'retina'">
								<view class="eye-icon__outer"></view>
								<view class="eye-icon__retina"></view>
							</view>
							<view class="eye-icon" v-else-if="dept.icon === 'refraction'">
								<view class="glasses-icon"></view>
							</view>
							<view class="eye-icon" v-else-if="dept.icon === 'pediatric'">
								<view class="child-icon"></view>
							</view>
							<view class="eye-icon" v-else-if="dept.icon === 'dryeye'">
								<view class="drop-icon"></view>
							</view>
							<view class="eye-icon" v-else>
								<view class="eye-icon__outer"></view>
								<view class="eye-icon__inner"></view>
							</view>
						</view>
						<text class="hot-item__name">{{ dept.name }}</text>
						<view class="hot-item__badge" :class="{ 'hot-item__badge--warning': dept.todayAvailable < 10 }">
							<text>剩{{ dept.todayAvailable }}</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 全部科室 -->
			<view class="section">
				<view class="section__header">
					<view class="section__icon section__icon--all"></view>
					<text class="section__title">全部科室</text>
				</view>

				<!-- 骨架屏 -->
				<view v-if="loading" class="dept-list">
					<view v-for="i in 4" :key="i" class="dept-card dept-card--skeleton">
						<view class="skeleton-avatar"></view>
						<view class="skeleton-content">
							<view class="skeleton-line"></view>
							<view class="skeleton-line skeleton-line--short"></view>
						</view>
					</view>
				</view>

				<!-- 科室列表 -->
				<view v-else class="dept-list">
					<view
						v-for="dept in departments"
						:key="dept.id"
						class="dept-card"
						@click="goToDoctors(dept)"
					>
						<view class="dept-card__icon" :class="'dept-card__icon--' + dept.icon">
							<view class="eye-simple"></view>
						</view>
						<view class="dept-card__info">
							<view class="dept-card__header">
								<text class="dept-card__name">{{ dept.name }}</text>
								<view v-if="dept.isHot" class="dept-card__hot">热门</view>
							</view>
							<text class="dept-card__desc">{{ dept.description }}</text>
							<view class="dept-card__meta">
								<text class="dept-card__stat">{{ dept.doctorCount }}位医生</text>
								<text class="dept-card__divider">|</text>
								<text class="dept-card__available" :class="{ 'dept-card__available--warning': dept.todayAvailable < 10 }">
									今日可约 {{ dept.todayAvailable }}
								</text>
							</view>
							<view class="dept-card__diseases">
								<text v-for="(disease, idx) in dept.diseases.slice(0, 3)" :key="idx" class="dept-card__disease">{{ disease }}</text>
							</view>
						</view>
						<view class="dept-card__arrow"></view>
					</view>
				</view>
			</view>

			<!-- 底部安全区 -->
			<view class="safe-area"></view>
		</scroll-view>
	</view>
</template>

<script>
import { isDarkMode } from '@/store/theme.js'
import { getDepartmentList, getHospitalDetail } from '@/utils/api/appointment.js'

export default {
	data() {
		return {
			statusBarHeight: 44,
			hospitalId: '',
			hospitalName: '',
			hospitalDetail: null,
			loading: true,
			departments: []
		}
	},
	computed: {
		isDark() {
			return isDarkMode()
		},
		hotDepartments() {
			return this.departments.filter(d => d.isHot).slice(0, 6)
		}
	},
	onLoad(options) {
		this.hospitalId = options.hospitalId || ''
		this.hospitalName = decodeURIComponent(options.hospitalName || '选择科室')
		this.getStatusBarHeight()
		this.loadData()
	},
	methods: {
		getStatusBarHeight() {
			const sysInfo = uni.getSystemInfoSync()
			this.statusBarHeight = sysInfo.statusBarHeight || 44
		},

		async loadData() {
			this.loading = true
			try {
				// 并行加载医院详情和科室列表
				const [hospitalRes, deptRes] = await Promise.all([
					getHospitalDetail(this.hospitalId),
					getDepartmentList(this.hospitalId)
				])

				if (hospitalRes.code === 200) {
					this.hospitalDetail = hospitalRes.data
				}
				if (deptRes.code === 200) {
					this.departments = deptRes.data.list || []
				}
			} catch (e) {
				console.error('加载数据失败:', e)
			} finally {
				this.loading = false
			}
		},

		goBack() {
			uni.navigateBack()
		},

		goToDoctors(dept) {
			uni.navigateTo({
				url: `/pages/appointment/doctors?hospitalId=${this.hospitalId}&hospitalName=${encodeURIComponent(this.hospitalName)}&departmentId=${dept.id}&departmentName=${encodeURIComponent(dept.name)}`
			})
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

// 内容区
.content {
	flex: 1;
	overflow: hidden;
}

// 医院信息
.hospital-info {
	margin: $spacing-md $spacing-lg;
	padding: $spacing-lg;
	background: linear-gradient(135deg, rgba(30, 58, 95, 0.05) 0%, rgba(45, 90, 135, 0.08) 100%);
	border-radius: $radius-lg;
	border: 2rpx solid rgba(30, 58, 95, 0.1);

	&__row {
		display: flex;
		align-items: center;
		margin-bottom: $spacing-sm;

		&:last-child {
			margin-bottom: 0;
		}
	}

	&__icon {
		width: 32rpx;
		height: 32rpx;
		margin-right: $spacing-sm;
		position: relative;

		&--location {
			&::before {
				content: '';
				position: absolute;
				top: 2rpx;
				left: 50%;
				transform: translateX(-50%);
				width: 20rpx;
				height: 20rpx;
				border: 3rpx solid $color-primary;
				border-radius: 50% 50% 50% 0;
				transform: translateX(-50%) rotate(-45deg);
			}
			&::after {
				content: '';
				position: absolute;
				top: 8rpx;
				left: 50%;
				transform: translateX(-50%);
				width: 6rpx;
				height: 6rpx;
				background: $color-primary;
				border-radius: 50%;
			}
		}

		&--time {
			&::before {
				content: '';
				position: absolute;
				top: 50%;
				left: 50%;
				transform: translate(-50%, -50%);
				width: 24rpx;
				height: 24rpx;
				border: 3rpx solid $color-primary;
				border-radius: 50%;
			}
			&::after {
				content: '';
				position: absolute;
				top: 50%;
				left: 50%;
				width: 10rpx;
				height: 3rpx;
				background: $color-primary;
				transform-origin: left center;
				transform: translateY(-50%) rotate(-45deg);
			}
		}
	}

	&__text {
		font-size: $font-size-sm;
		color: $text-secondary;
		flex: 1;
	}
}

// 区块
.section {
	margin: $spacing-lg $spacing-lg 0;

	&__header {
		display: flex;
		align-items: center;
		margin-bottom: $spacing-md;
	}

	&__icon {
		width: 36rpx;
		height: 36rpx;
		margin-right: $spacing-sm;
		position: relative;

		&--hot {
			&::before {
				content: '';
				position: absolute;
				top: 50%;
				left: 50%;
				transform: translate(-50%, -50%);
				width: 24rpx;
				height: 28rpx;
				background: linear-gradient(180deg, $color-accent 0%, darken($color-accent, 10%) 100%);
				clip-path: polygon(50% 0%, 100% 35%, 80% 100%, 20% 100%, 0% 35%);
			}
		}

		&--all {
			&::before {
				content: '';
				position: absolute;
				top: 50%;
				left: 50%;
				transform: translate(-50%, -50%);
				width: 24rpx;
				height: 24rpx;
				border: 3rpx solid $color-primary;
				border-radius: 6rpx;
			}
			&::after {
				content: '';
				position: absolute;
				top: 50%;
				left: 50%;
				transform: translate(-50%, -50%);
				width: 12rpx;
				height: 12rpx;
				background: $color-primary;
				border-radius: 3rpx;
			}
		}
	}

	&__title {
		font-size: $font-size-lg;
		font-weight: $font-weight-semibold;
		color: $text-primary;
	}
}

// 热门科室网格
.hot-grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: $spacing-md;
}

.hot-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: $spacing-lg $spacing-sm;
	background: $bg-card;
	border-radius: $radius-lg;
	box-shadow: $shadow-sm;
	position: relative;
	transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);

	&:active {
		transform: scale(0.95);
	}

	&--skeleton {
		pointer-events: none;
	}

	&__icon {
		width: 80rpx;
		height: 80rpx;
		border-radius: $radius-md;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: $spacing-sm;

		&--cataract { background: linear-gradient(135deg, rgba(30, 58, 95, 0.1) 0%, rgba(30, 58, 95, 0.15) 100%); }
		&--glaucoma { background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.15) 100%); }
		&--retina { background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.15) 100%); }
		&--refraction { background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.15) 100%); }
		&--cornea { background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.15) 100%); }
		&--pediatric { background: linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(168, 85, 247, 0.15) 100%); }
		&--oculoplastic { background: linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(236, 72, 153, 0.15) 100%); }
		&--dryeye { background: linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(6, 182, 212, 0.15) 100%); }
	}

	&__name {
		font-size: $font-size-sm;
		color: $text-primary;
		font-weight: $font-weight-medium;
		text-align: center;
	}

	&__badge {
		position: absolute;
		top: 8rpx;
		right: 8rpx;
		background: rgba(16, 185, 129, 0.1);
		color: $color-success;
		font-size: $font-size-xs;
		padding: 4rpx 10rpx;
		border-radius: $radius-full;

		&--warning {
			background: rgba(245, 158, 11, 0.1);
			color: $color-warning;
		}
	}
}

// 眼睛图标
.eye-icon {
	width: 40rpx;
	height: 40rpx;
	position: relative;

	&__outer {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 36rpx;
		height: 20rpx;
		border: 3rpx solid $color-primary;
		border-radius: 50%;
	}

	&__inner {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 16rpx;
		height: 16rpx;
		border: 3rpx solid $color-primary;
		border-radius: 50%;
	}

	&__pupil {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 8rpx;
		height: 8rpx;
		background: $color-primary;
		border-radius: 50%;
	}

	&__pressure {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 24rpx;
		height: 24rpx;
		border: 3rpx dashed $color-error;
		border-radius: 50%;
	}

	&__retina {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 20rpx;
		height: 20rpx;
		background: radial-gradient(circle, $color-warning 30%, transparent 70%);
		border-radius: 50%;
	}
}

.glasses-icon {
	width: 40rpx;
	height: 20rpx;
	position: relative;

	&::before, &::after {
		content: '';
		position: absolute;
		top: 0;
		width: 16rpx;
		height: 16rpx;
		border: 3rpx solid $color-info;
		border-radius: 50%;
	}
	&::before { left: 0; }
	&::after { right: 0; }
}

.child-icon {
	width: 24rpx;
	height: 32rpx;
	position: relative;

	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 20rpx;
		height: 20rpx;
		border: 3rpx solid #a855f7;
		border-radius: 50%;
	}

	&::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 16rpx;
		height: 12rpx;
		border: 3rpx solid #a855f7;
		border-radius: 50% 50% 0 0;
		border-bottom: none;
	}
}

.drop-icon {
	width: 20rpx;
	height: 28rpx;
	position: relative;

	&::before {
		content: '';
		position: absolute;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 20rpx;
		height: 20rpx;
		border: 3rpx solid #06b6d4;
		border-radius: 50%;
	}

	&::after {
		content: '';
		position: absolute;
		top: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 0;
		height: 0;
		border-left: 10rpx solid transparent;
		border-right: 10rpx solid transparent;
		border-bottom: 14rpx solid #06b6d4;
	}
}

// 科室列表
.dept-list {
	display: flex;
	flex-direction: column;
	gap: $spacing-md;
}

.dept-card {
	display: flex;
	align-items: center;
	padding: $spacing-lg;
	background: $bg-card;
	border-radius: $radius-lg;
	box-shadow: $shadow-sm;
	transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);

	&:active {
		transform: scale(0.98);
	}

	&--skeleton {
		pointer-events: none;
	}

	&__icon {
		width: 80rpx;
		height: 80rpx;
		border-radius: $radius-md;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		background: linear-gradient(135deg, rgba(30, 58, 95, 0.08) 0%, rgba(30, 58, 95, 0.12) 100%);
	}

	&__info {
		flex: 1;
		margin: 0 $spacing-md;
		min-width: 0;
	}

	&__header {
		display: flex;
		align-items: center;
		margin-bottom: $spacing-xs;
	}

	&__name {
		font-size: $font-size-lg;
		font-weight: $font-weight-semibold;
		color: $text-primary;
	}

	&__hot {
		margin-left: $spacing-sm;
		font-size: $font-size-xs;
		color: $color-accent;
		background: rgba(255, 107, 91, 0.1);
		padding: 2rpx 10rpx;
		border-radius: $radius-xs;
	}

	&__desc {
		font-size: $font-size-sm;
		color: $text-muted;
		margin-bottom: $spacing-xs;
		display: block;
	}

	&__meta {
		display: flex;
		align-items: center;
		margin-bottom: $spacing-xs;
	}

	&__stat {
		font-size: $font-size-sm;
		color: $text-secondary;
	}

	&__divider {
		margin: 0 $spacing-sm;
		color: $border-color;
	}

	&__available {
		font-size: $font-size-sm;
		color: $color-success;
		font-weight: $font-weight-medium;

		&--warning {
			color: $color-warning;
		}
	}

	&__diseases {
		display: flex;
		flex-wrap: wrap;
		gap: $spacing-xs;
	}

	&__disease {
		font-size: $font-size-xs;
		color: $text-muted;
		background: $bg-elevated;
		padding: 4rpx 12rpx;
		border-radius: $radius-xs;
	}

	&__arrow {
		width: 16rpx;
		height: 16rpx;
		border-right: 3rpx solid $text-muted;
		border-bottom: 3rpx solid $text-muted;
		transform: rotate(-45deg);
		flex-shrink: 0;
	}
}

.eye-simple {
	width: 32rpx;
	height: 18rpx;
	border: 3rpx solid $color-primary;
	border-radius: 50%;
	position: relative;

	&::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 10rpx;
		height: 10rpx;
		background: $color-primary;
		border-radius: 50%;
	}
}

// 骨架屏
.skeleton-icon {
	width: 80rpx;
	height: 80rpx;
	border-radius: $radius-md;
	background: linear-gradient(90deg, $bg-elevated 25%, $bg-card 50%, $bg-elevated 75%);
	background-size: 200% 100%;
	animation: skeleton-loading 1.5s infinite;
}

.skeleton-text {
	width: 60rpx;
	height: 24rpx;
	border-radius: $radius-xs;
	margin-top: $spacing-sm;
	background: linear-gradient(90deg, $bg-elevated 25%, $bg-card 50%, $bg-elevated 75%);
	background-size: 200% 100%;
	animation: skeleton-loading 1.5s infinite;
}

.skeleton-badge {
	width: 48rpx;
	height: 24rpx;
	border-radius: $radius-full;
	position: absolute;
	top: 8rpx;
	right: 8rpx;
	background: linear-gradient(90deg, $bg-elevated 25%, $bg-card 50%, $bg-elevated 75%);
	background-size: 200% 100%;
	animation: skeleton-loading 1.5s infinite;
}

.skeleton-avatar {
	width: 80rpx;
	height: 80rpx;
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

	&--short {
		width: 60%;
	}
}

@keyframes skeleton-loading {
	0% { background-position: 200% 0; }
	100% { background-position: -200% 0; }
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

	.hospital-info {
		background: linear-gradient(135deg, rgba(74, 144, 217, 0.08) 0%, rgba(74, 144, 217, 0.12) 100%);
		border-color: rgba(74, 144, 217, 0.15);

		&__icon {
			&--location::before { border-color: $dark-color-primary; }
			&--location::after { background: $dark-color-primary; }
			&--time::before { border-color: $dark-color-primary; }
			&--time::after { background: $dark-color-primary; }
		}

		&__text { color: $dark-text-secondary; }
	}

	.section {
		&__icon--hot::before { background: linear-gradient(180deg, $dark-color-accent 0%, darken($dark-color-accent, 10%) 100%); }
		&__icon--all::before { border-color: $dark-color-primary; }
		&__icon--all::after { background: $dark-color-primary; }
		&__title { color: $dark-text-primary; }
	}

	.hot-item {
		background: $dark-bg-card;

		&__name { color: $dark-text-primary; }
		&__badge {
			background: rgba(16, 185, 129, 0.15);
			&--warning { background: rgba(245, 158, 11, 0.15); }
		}
	}

	.eye-icon__outer,
	.eye-icon__inner { border-color: $dark-color-primary; }
	.eye-icon__pupil { background: $dark-color-primary; }
	.eye-simple {
		border-color: $dark-color-primary;
		&::after { background: $dark-color-primary; }
	}

	.dept-card {
		background: $dark-bg-card;

		&__icon { background: linear-gradient(135deg, rgba(74, 144, 217, 0.1) 0%, rgba(74, 144, 217, 0.15) 100%); }
		&__name { color: $dark-text-primary; }
		&__hot { background: rgba(255, 138, 122, 0.15); color: $dark-color-accent; }
		&__desc { color: $dark-text-muted; }
		&__stat { color: $dark-text-secondary; }
		&__divider { color: $dark-border-color; }
		&__disease { background: $dark-bg-elevated; color: $dark-text-muted; }
		&__arrow { border-color: $dark-text-muted; }
	}

	.skeleton-icon,
	.skeleton-text,
	.skeleton-badge,
	.skeleton-avatar,
	.skeleton-line {
		background: linear-gradient(90deg, $dark-bg-elevated 25%, $dark-bg-card 50%, $dark-bg-elevated 75%);
		background-size: 200% 100%;
	}
}
</style>
