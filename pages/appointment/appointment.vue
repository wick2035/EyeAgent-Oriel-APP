<template>
	<view class="page" :class="{ 'page--dark': isDark }">
		<!-- 状态栏占位 -->
		<view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>

		<!-- 顶部导航栏 -->
		<view class="navbar">
			<text class="navbar__title">预约挂号</text>
		</view>

		<!-- 科室分类 -->
		<scroll-view class="departments" scroll-x show-scrollbar="false">
			<view
				v-for="(dept, index) in departments"
				:key="index"
				class="department-tag"
				:class="{ 'department-tag--active': currentDept === index }"
				@click="selectDept(index)"
			>
				{{ dept }}
			</view>
		</scroll-view>

		<!-- 内容区域 -->
		<scroll-view class="content" scroll-y>
			<!-- 医生列表 -->
			<view class="doctors">
				<view
					v-for="(doctor, index) in doctors"
					:key="index"
					class="doctor-card"
					@click="selectDoctor(doctor)"
				>
					<view class="doctor-card__avatar">
						<text class="doctor-card__avatar-text">{{ doctor.name.charAt(0) }}</text>
					</view>
					<view class="doctor-card__info">
						<view class="doctor-card__header">
							<text class="doctor-card__name">{{ doctor.name }}</text>
							<text class="doctor-card__title">{{ doctor.title }}</text>
						</view>
						<text class="doctor-card__dept">{{ doctor.department }}</text>
						<text class="doctor-card__intro">{{ doctor.intro }}</text>
						<view class="doctor-card__footer">
							<view class="doctor-card__rating">
								<view class="star-icon"></view>
								<text class="doctor-card__rating-value">{{ doctor.rating }}</text>
							</view>
							<text class="doctor-card__count">{{ doctor.consultCount }}人已咨询</text>
						</view>
					</view>
					<view class="doctor-card__action">
						<view class="doctor-card__btn" :class="{ 'doctor-card__btn--disabled': !doctor.available }">
							{{ doctor.available ? '预约' : '约满' }}
						</view>
					</view>
				</view>
			</view>

			<!-- 底部占位 -->
			<view class="tabbar-placeholder"></view>
		</scroll-view>

		<!-- 底部导航 -->
		<TabBar :current="1" />
	</view>
</template>

<script>
import TabBar from '@/components/TabBar.vue'
import { isDarkMode } from '@/store/theme.js'

export default {
	components: {
		TabBar
	},
	data() {
		return {
			statusBarHeight: 44,
			currentDept: 0,
			departments: ['全部', '眼科', '内科', '外科', '皮肤科', '儿科', '妇科', '骨科', '神经科'],
			doctors: [
				{
					id: 1,
					name: '张明华',
					title: '主任医师',
					department: '眼科',
					intro: '擅长白内障、青光眼、眼底病变等眼部疾病的诊断与治疗，从医30年经验丰富。',
					rating: 4.9,
					consultCount: 2847,
					available: true
				},
				{
					id: 2,
					name: '李婷婷',
					title: '副主任医师',
					department: '眼科',
					intro: '专注于近视防控、角膜塑形镜验配及干眼症治疗。',
					rating: 4.8,
					consultCount: 1562,
					available: true
				},
				{
					id: 3,
					name: '王建国',
					title: '主任医师',
					department: '内科',
					intro: '心血管内科专家，擅长高血压、冠心病、心律失常等疾病诊治。',
					rating: 4.9,
					consultCount: 3421,
					available: false
				},
				{
					id: 4,
					name: '陈晓燕',
					title: '副主任医师',
					department: '皮肤科',
					intro: '皮肤美容、过敏性皮肤病、痤疮等常见皮肤问题诊疗专家。',
					rating: 4.7,
					consultCount: 1893,
					available: true
				},
				{
					id: 5,
					name: '刘伟强',
					title: '主治医师',
					department: '骨科',
					intro: '运动损伤、关节疾病、脊柱退行性病变的微创治疗。',
					rating: 4.6,
					consultCount: 982,
					available: true
				}
			]
		}
	},
	computed: {
		isDark() {
			return isDarkMode()
		}
	},
	onLoad() {
		this.getStatusBarHeight()
	},
	methods: {
		getStatusBarHeight() {
			const sysInfo = uni.getSystemInfoSync()
			this.statusBarHeight = sysInfo.statusBarHeight || 44
		},
		selectDept(index) {
			this.currentDept = index
			// TODO: 根据科室筛选医生
		},
		selectDoctor(doctor) {
			if (!doctor.available) {
				uni.showToast({ title: '该医生暂无可预约时段', icon: 'none' })
				return
			}
			uni.showToast({ title: '预约详情页开发中', icon: 'none' })
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

	&--dark {
		background: $dark-bg-base;
	}
}

.status-bar {
	flex-shrink: 0;
}

.navbar {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 88rpx;
	padding: 0 $spacing-lg;
	flex-shrink: 0;

	&__title {
		font-size: $font-size-lg;
		font-weight: $font-weight-semibold;
		color: $text-primary;
	}
}

.departments {
	white-space: nowrap;
	padding: $spacing-md $spacing-lg;
	flex-shrink: 0;
}

.department-tag {
	display: inline-block;
	padding: $spacing-sm $spacing-lg;
	background: $bg-card;
	border: 2rpx solid $border-color;
	border-radius: $radius-full;
	margin-right: $spacing-md;
	font-size: $font-size-sm;
	color: $text-secondary;
	transition: all 0.25s ease;

	&--active {
		background: $color-primary;
		border-color: $color-primary;
		color: #fff;
	}

	&:active {
		transform: scale(0.95);
	}
}

.content {
	flex: 1;
	overflow: hidden;
}

.doctors {
	padding: $spacing-md $spacing-lg;
}

.doctor-card {
	display: flex;
	align-items: flex-start;
	padding: $spacing-lg;
	background: $bg-card;
	border-radius: $radius-lg;
	box-shadow: $shadow-sm;
	margin-bottom: $spacing-md;

	&__avatar {
		width: 100rpx;
		height: 100rpx;
		background: linear-gradient(135deg, $color-primary-light 0%, $color-primary 100%);
		border-radius: $radius-md;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	&__avatar-text {
		font-size: $font-size-2xl;
		color: #fff;
		font-weight: $font-weight-bold;
	}

	&__info {
		flex: 1;
		margin: 0 $spacing-md;
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
		margin-right: $spacing-sm;
	}

	&__title {
		font-size: $font-size-xs;
		color: $color-primary;
		background: rgba(30, 58, 95, 0.08);
		padding: 4rpx 12rpx;
		border-radius: $radius-xs;
	}

	&__dept {
		font-size: $font-size-sm;
		color: $text-secondary;
		margin-bottom: $spacing-xs;
		display: block;
	}

	&__intro {
		font-size: $font-size-sm;
		color: $text-muted;
		line-height: $line-height-normal;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		margin-bottom: $spacing-sm;
	}

	&__footer {
		display: flex;
		align-items: center;
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

	&__count {
		font-size: $font-size-xs;
		color: $text-muted;
	}

	&__action {
		flex-shrink: 0;
	}

	&__btn {
		padding: $spacing-sm $spacing-lg;
		background: $color-primary;
		color: #fff;
		font-size: $font-size-sm;
		border-radius: $radius-md;
		font-weight: $font-weight-medium;

		&--disabled {
			background: $text-muted;
		}

		&:active {
			opacity: 0.8;
		}
	}
}

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

.tabbar-placeholder {
	height: calc(140rpx + env(safe-area-inset-bottom));
}

// 深色模式
.page--dark {
	.navbar__title { color: $dark-text-primary; }

	.department-tag {
		background: $dark-bg-card;
		border-color: $dark-border-color;
		color: $dark-text-secondary;

		&--active {
			background: $dark-color-primary;
			border-color: $dark-color-primary;
			color: #fff;
		}
	}

	.doctor-card {
		background: $dark-bg-card;

		&__name { color: $dark-text-primary; }
		&__title {
			color: $dark-color-primary;
			background: rgba(74, 144, 217, 0.15);
		}
		&__dept { color: $dark-text-secondary; }
		&__intro { color: $dark-text-muted; }
		&__count { color: $dark-text-muted; }
		&__btn {
			background: $dark-color-primary;
			&--disabled { background: $dark-text-muted; }
		}
	}
}
</style>
