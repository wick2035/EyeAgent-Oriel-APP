<template>
	<view class="page" :class="{ 'page--dark': isDark }">
		<!-- 固定头部 -->
		<view class="fixed-header" :style="{ paddingTop: statusBarHeight + 'px' }">
			<!-- 导航栏 -->
			<view class="navbar">
				<view class="navbar__back" @click="goBack">
					<view class="navbar__back-icon"></view>
				</view>
				<text class="navbar__title">就诊记录</text>
				<view class="navbar__placeholder"></view>
			</view>

			<!-- Tab切换 -->
			<view class="tabs-wrapper">
				<view class="tabs__track">
					<view
						v-for="(tab, index) in tabs"
						:key="index"
						class="tabs__item"
						:class="{ 'tabs__item--active': currentTab === index }"
						@click="switchTab(index)"
					>
						<text>{{ tab.label }}</text>
						<view v-if="currentTab === index" class="tabs__indicator"></view>
					</view>
				</view>
			</view>
		</view>

		<!-- 头部占位 -->
		<view class="header-placeholder" :style="{ height: (statusBarHeight + 88) + 'px' }"></view>

		<!-- 内容区域 -->
		<scroll-view class="content" scroll-y @scrolltolower="loadMore">
			<!-- 预约记录 -->
			<view v-if="currentTab === 0" class="record-list">
				<view v-if="loading" class="skeleton-list">
					<view v-for="i in 3" :key="i" class="skeleton-card"></view>
				</view>
				<template v-else>
					<view
						v-for="item in appointments"
						:key="item.id"
						class="appointment-card"
						@click="viewAppointmentDetail(item)"
					>
						<view class="appointment-card__header">
							<view class="appointment-card__status" :class="'appointment-card__status--' + item.status">
								{{ getStatusText(item.status) }}
							</view>
							<text class="appointment-card__date">{{ item.appointmentDate }}</text>
						</view>
						<view class="appointment-card__body">
							<view class="appointment-card__hospital">
								<view class="hospital-icon"></view>
								<text>{{ item.hospitalName }}</text>
							</view>
							<view class="appointment-card__info">
								<text class="appointment-card__dept">{{ item.departmentName }}</text>
								<text class="appointment-card__doctor">{{ item.doctorName }} {{ item.doctorTitle }}</text>
							</view>
							<view class="appointment-card__time">
								<view class="time-icon"></view>
								<text>{{ item.periodLabel }} {{ item.timeRange }}</text>
								<text class="appointment-card__queue">第{{ item.queueNumber }}号</text>
							</view>
						</view>
					</view>
					<view v-if="appointments.length === 0" class="empty-state">
						<view class="empty-state__icon empty-state__icon--appointment"></view>
						<text class="empty-state__text">暂无预约记录</text>
					</view>
				</template>
			</view>

			<!-- 病历报告 -->
			<view v-if="currentTab === 1" class="record-list">
				<view v-if="loading" class="skeleton-list">
					<view v-for="i in 3" :key="i" class="skeleton-card"></view>
				</view>
				<template v-else>
					<view
						v-for="item in records"
						:key="item.id"
						class="report-card"
						@click="viewPdf(item, 'record')"
					>
						<view class="report-card__icon report-card__icon--record">
							<view class="record-icon"></view>
						</view>
						<view class="report-card__content">
							<text class="report-card__title">{{ item.title }}</text>
							<text class="report-card__hospital">{{ item.hospitalName }} · {{ item.departmentName }}</text>
							<text class="report-card__diagnosis">诊断：{{ item.diagnosis }}</text>
							<text class="report-card__date">{{ item.visitDate }}</text>
						</view>
						<view class="report-card__action">
							<view class="pdf-icon"></view>
						</view>
					</view>
					<view v-if="records.length === 0" class="empty-state">
						<view class="empty-state__icon empty-state__icon--record"></view>
						<text class="empty-state__text">暂无病历报告</text>
					</view>
				</template>
			</view>

			<!-- 处方记录 -->
			<view v-if="currentTab === 2" class="record-list">
				<view v-if="loading" class="skeleton-list">
					<view v-for="i in 3" :key="i" class="skeleton-card"></view>
				</view>
				<template v-else>
					<view
						v-for="item in prescriptions"
						:key="item.id"
						class="report-card"
						@click="viewPdf(item, 'prescription')"
					>
						<view class="report-card__icon report-card__icon--prescription">
							<view class="prescription-icon"></view>
						</view>
						<view class="report-card__content">
							<text class="report-card__title">{{ item.title }}</text>
							<text class="report-card__hospital">{{ item.hospitalName }} · {{ item.doctorName }}</text>
							<view class="report-card__medicines">
								<text v-for="(med, idx) in item.medicines.slice(0, 2)" :key="idx" class="medicine-tag">
									{{ med.name }}
								</text>
								<text v-if="item.medicines.length > 2" class="medicine-more">+{{ item.medicines.length - 2 }}</text>
							</view>
							<text class="report-card__date">{{ item.visitDate }}</text>
						</view>
						<view class="report-card__action">
							<view class="pdf-icon"></view>
						</view>
					</view>
					<view v-if="prescriptions.length === 0" class="empty-state">
						<view class="empty-state__icon empty-state__icon--prescription"></view>
						<text class="empty-state__text">暂无处方记录</text>
					</view>
				</template>
			</view>

			<!-- 智能诊断报告 -->
			<view v-if="currentTab === 3" class="record-list">
				<view v-if="loading" class="skeleton-list">
					<view v-for="i in 3" :key="i" class="skeleton-card"></view>
				</view>
				<template v-else>
					<view
						v-for="item in diagnoses"
						:key="item.id"
						class="diagnosis-card"
						@click="viewPdf(item, 'diagnosis')"
					>
						<view class="diagnosis-card__header">
							<view class="diagnosis-card__icon">
								<view class="ai-icon"></view>
							</view>
							<view class="diagnosis-card__meta">
								<text class="diagnosis-card__title">{{ item.title }}</text>
								<text class="diagnosis-card__date">{{ item.visitDate }}</text>
							</view>
							<view class="diagnosis-card__confidence" :class="'diagnosis-card__confidence--' + item.severity">
								<text>可信度 {{ item.confidence }}%</text>
							</view>
						</view>
						<view class="diagnosis-card__body">
							<view class="diagnosis-card__symptoms">
								<text class="diagnosis-card__label">主要症状：</text>
								<view class="symptom-tags">
									<text v-for="(s, idx) in item.symptoms" :key="idx" class="symptom-tag">{{ s }}</text>
								</view>
							</view>
							<text class="diagnosis-card__result">{{ item.aiDiagnosis }}</text>
						</view>
						<view class="diagnosis-card__footer">
							<text class="diagnosis-card__view">查看完整报告</text>
							<view class="pdf-icon pdf-icon--small"></view>
						</view>
					</view>
					<view v-if="diagnoses.length === 0" class="empty-state">
						<view class="empty-state__icon empty-state__icon--diagnosis"></view>
						<text class="empty-state__text">暂无诊断报告</text>
					</view>
				</template>
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
import { getAppointmentList, getMedicalRecordList, getPrescriptionList, getDiagnosisList } from '@/utils/api/medical.js'
import TopNotificationBar from '@/components/TopNotificationBar.vue'

export default {
	components: {
		TopNotificationBar
	},
	data() {
		return {
			statusBarHeight: 44,
			currentTab: 0,
			tabs: [
				{ label: '预约记录', key: 'appointment' },
				{ label: '病历报告', key: 'record' },
				{ label: '处方记录', key: 'prescription' },
				{ label: '诊断报告', key: 'diagnosis' }
			],
			loading: false,
			appointments: [],
			records: [],
			prescriptions: [],
			diagnoses: []
		}
	},
	computed: {
		isDark() {
			return isDarkMode()
		}
	},
	onLoad() {
		this.getStatusBarHeight()
		this.loadData()
	},
	onShow() {
		// 每次进入页面时强制刷新预约记录
		if (this.currentTab === 0) {
			this.forceRefreshAppointments()
		}
	},
	methods: {
		getStatusBarHeight() {
			const sysInfo = uni.getSystemInfoSync()
			this.statusBarHeight = sysInfo.statusBarHeight || 44
		},

		// 强制刷新预约记录（用于onShow）
		async forceRefreshAppointments() {
			this.loading = true
			try {
				const res = await getAppointmentList()
				if (res.code === 200) {
					this.appointments = res.data.list || []
				}
			} catch (e) {
				console.error('加载预约记录失败:', e)
			} finally {
				this.loading = false
			}
		},

		async loadData() {
			this.loading = true
			try {
				switch (this.currentTab) {
					case 0:
						// 移除缓存检查，每次都加载
						const res = await getAppointmentList()
						if (res.code === 200) this.appointments = res.data.list || []
						break
					case 1:
						if (this.records.length === 0) {
							const res = await getMedicalRecordList()
							if (res.code === 200) this.records = res.data.list || []
						}
						break
					case 2:
						if (this.prescriptions.length === 0) {
							const res = await getPrescriptionList()
							if (res.code === 200) this.prescriptions = res.data.list || []
						}
						break
					case 3:
						if (this.diagnoses.length === 0) {
							const res = await getDiagnosisList()
							if (res.code === 200) this.diagnoses = res.data.list || []
						}
						break
				}
			} catch (e) {
				console.error('加载数据失败:', e)
			} finally {
				this.loading = false
			}
		},

		switchTab(index) {
			this.currentTab = index
			this.loadData()
		},

		loadMore() {
			// TODO: 分页加载
		},

		getStatusText(status) {
			const map = {
				pending: '待就诊',
				completed: '已完成',
				cancelled: '已取消',
				canceled: '已取消'
			}
			return map[status] || status
		},

		viewPdf(item, type) {
			uni.navigateTo({
				url: `/pages/profile/pdf-viewer?url=${encodeURIComponent(item.pdfUrl)}&title=${encodeURIComponent(item.title)}&type=${type}`
			})
		},

		viewAppointmentDetail(item) {
			// 缓存数据以便详情页使用
			uni.setStorageSync('tempAppointmentDetail', JSON.stringify(item))
			uni.navigateTo({
				url: `/pages/profile/appointment-detail?id=${item.id}`
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
}

// 固定头部
.fixed-header {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	z-index: 100;
	background: $bg-base;
}

// 头部占位
.header-placeholder {
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
	}

	&__placeholder {
		width: 72rpx;
	}
}

// Tab切换
.tabs-wrapper {
	flex-shrink: 0;
	border-bottom: 2rpx solid $border-color-light;
}

.tabs__track {
	display: flex;
	width: 100%;
}

.tabs__item {
	flex: 1;
	position: relative;
	padding: $spacing-md 0;
	font-size: $font-size-base;
	color: $text-secondary;
	text-align: center;
	transition: color 0.3s ease;

	&--active {
		color: $color-primary;
		font-weight: $font-weight-semibold;
	}
}

.tabs__indicator {
	position: absolute;
	bottom: 0;
	left: 50%;
	transform: translateX(-50%);
	width: 48rpx;
	height: 6rpx;
	background: linear-gradient(90deg, $color-primary, $color-primary-light);
	border-radius: 3rpx;
}

// 内容区
.content {
	flex: 1;
	overflow: hidden;
}

.record-list {
	padding: $spacing-md $spacing-lg;
}

// 骨架屏
.skeleton-list {
	display: flex;
	flex-direction: column;
	gap: $spacing-md;
}

.skeleton-card {
	height: 200rpx;
	background: linear-gradient(90deg, $bg-elevated 25%, $bg-card 50%, $bg-elevated 75%);
	background-size: 200% 100%;
	border-radius: $radius-lg;
	animation: skeleton-loading 1.5s infinite;
}

@keyframes skeleton-loading {
	0% { background-position: 200% 0; }
	100% { background-position: -200% 0; }
}

// 预约记录卡片
.appointment-card {
	background: $bg-card;
	border-radius: $radius-lg;
	padding: $spacing-lg;
	margin-bottom: $spacing-md;
	box-shadow: $shadow-sm;

	&__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: $spacing-md;
		padding-bottom: $spacing-md;
		border-bottom: 2rpx solid $border-color-light;
	}

	&__status {
		font-size: $font-size-sm;
		padding: 6rpx 16rpx;
		border-radius: $radius-sm;
		font-weight: $font-weight-medium;

		&--pending {
			background: rgba(59, 130, 246, 0.1);
			color: $color-info;
		}

		&--completed {
			background: rgba(16, 185, 129, 0.1);
			color: $color-success;
		}

		&--cancelled,
		&--canceled {
			background: rgba(156, 163, 175, 0.1);
			color: $text-muted;
		}
	}

	&__date {
		font-size: $font-size-sm;
		color: $text-secondary;
	}

	&__body {
		display: flex;
		flex-direction: column;
		gap: $spacing-sm;
	}

	&__hospital {
		display: flex;
		align-items: center;
		font-size: $font-size-lg;
		font-weight: $font-weight-semibold;
		color: $text-primary;
	}

	&__info {
		display: flex;
		align-items: center;
		gap: $spacing-md;
	}

	&__dept {
		font-size: $font-size-base;
		color: $color-primary;
		background: rgba(30, 58, 95, 0.06);
		padding: 4rpx 12rpx;
		border-radius: $radius-xs;
	}

	&__doctor {
		font-size: $font-size-base;
		color: $text-secondary;
	}

	&__time {
		display: flex;
		align-items: center;
		font-size: $font-size-sm;
		color: $text-muted;
	}

	&__queue {
		margin-left: auto;
		color: $color-accent;
		font-weight: $font-weight-medium;
	}
}

.hospital-icon {
	width: 32rpx;
	height: 32rpx;
	margin-right: $spacing-sm;
	position: relative;

	&::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 24rpx;
		height: 24rpx;
		border: 3rpx solid $color-primary;
		border-radius: 4rpx;
	}

	&::after {
		content: '+';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		font-size: 20rpx;
		color: $color-primary;
		font-weight: bold;
	}
}

.time-icon {
	width: 28rpx;
	height: 28rpx;
	margin-right: $spacing-xs;
	position: relative;

	&::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 20rpx;
		height: 20rpx;
		border: 3rpx solid $text-muted;
		border-radius: 50%;
	}

	&::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		width: 8rpx;
		height: 3rpx;
		background: $text-muted;
		transform-origin: left center;
		transform: translateY(-50%) rotate(-45deg);
	}
}

// 报告卡片
.report-card {
	display: flex;
	align-items: center;
	background: $bg-card;
	border-radius: $radius-lg;
	padding: $spacing-lg;
	margin-bottom: $spacing-md;
	box-shadow: $shadow-sm;
	transition: transform 0.25s ease;

	&:active {
		transform: scale(0.98);
	}

	&__icon {
		width: 80rpx;
		height: 80rpx;
		border-radius: $radius-md;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		margin-right: $spacing-md;

		&--record {
			background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.15) 100%);
		}

		&--prescription {
			background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.15) 100%);
		}
	}

	&__content {
		flex: 1;
		min-width: 0;
	}

	&__title {
		font-size: $font-size-lg;
		font-weight: $font-weight-semibold;
		color: $text-primary;
		display: block;
		margin-bottom: 4rpx;
	}

	&__hospital {
		font-size: $font-size-sm;
		color: $text-secondary;
		display: block;
		margin-bottom: 4rpx;
	}

	&__diagnosis {
		font-size: $font-size-sm;
		color: $text-muted;
		display: block;
		margin-bottom: 4rpx;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	&__medicines {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: $spacing-xs;
		margin-bottom: 4rpx;
	}

	&__date {
		font-size: $font-size-xs;
		color: $text-muted;
	}

	&__action {
		flex-shrink: 0;
		margin-left: $spacing-md;
	}
}

.record-icon {
	width: 36rpx;
	height: 44rpx;
	position: relative;

	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 28rpx;
		height: 36rpx;
		border: 3rpx solid $color-info;
		border-radius: 4rpx;
	}

	&::after {
		content: '';
		position: absolute;
		top: 8rpx;
		left: 6rpx;
		width: 16rpx;
		height: 3rpx;
		background: $color-info;
		box-shadow: 0 8rpx 0 $color-info, 0 16rpx 0 $color-info;
	}
}

.prescription-icon {
	width: 36rpx;
	height: 44rpx;
	position: relative;

	&::before {
		content: 'Rx';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		font-size: 24rpx;
		font-weight: bold;
		color: $color-success;
		font-style: italic;
	}
}

.medicine-tag {
	font-size: $font-size-xs;
	color: $color-success;
	background: rgba(16, 185, 129, 0.08);
	padding: 4rpx 10rpx;
	border-radius: $radius-xs;
}

.medicine-more {
	font-size: $font-size-xs;
	color: $text-muted;
}

.pdf-icon {
	width: 40rpx;
	height: 48rpx;
	position: relative;

	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 32rpx;
		height: 40rpx;
		border: 3rpx solid $color-accent;
		border-radius: 4rpx;
	}

	&::after {
		content: 'PDF';
		position: absolute;
		bottom: 4rpx;
		left: 50%;
		transform: translateX(-50%);
		font-size: 14rpx;
		color: $color-accent;
		font-weight: bold;
	}

	&--small {
		width: 32rpx;
		height: 40rpx;

		&::before {
			width: 26rpx;
			height: 32rpx;
		}

		&::after {
			font-size: 12rpx;
			bottom: 2rpx;
		}
	}
}

// 诊断报告卡片
.diagnosis-card {
	background: $bg-card;
	border-radius: $radius-lg;
	padding: $spacing-lg;
	margin-bottom: $spacing-md;
	box-shadow: $shadow-sm;
	transition: transform 0.25s ease;

	&:active {
		transform: scale(0.98);
	}

	&__header {
		display: flex;
		align-items: center;
		margin-bottom: $spacing-md;
	}

	&__icon {
		width: 64rpx;
		height: 64rpx;
		background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(240, 147, 251, 0.1) 100%);
		border-radius: $radius-md;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: $spacing-md;
	}

	&__meta {
		flex: 1;
	}

	&__title {
		font-size: $font-size-lg;
		font-weight: $font-weight-semibold;
		color: $text-primary;
		display: block;
	}

	&__date {
		font-size: $font-size-xs;
		color: $text-muted;
	}

	&__confidence {
		font-size: $font-size-xs;
		padding: 6rpx 12rpx;
		border-radius: $radius-sm;

		&--mild {
			background: rgba(16, 185, 129, 0.1);
			color: $color-success;
		}

		&--moderate {
			background: rgba(245, 158, 11, 0.1);
			color: $color-warning;
		}

		&--severe {
			background: rgba(239, 68, 68, 0.1);
			color: $color-error;
		}
	}

	&__body {
		margin-bottom: $spacing-md;
	}

	&__symptoms {
		display: flex;
		align-items: flex-start;
		margin-bottom: $spacing-sm;
	}

	&__label {
		font-size: $font-size-sm;
		color: $text-muted;
		flex-shrink: 0;
	}

	&__result {
		font-size: $font-size-sm;
		color: $text-secondary;
		line-height: $line-height-relaxed;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	&__footer {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		padding-top: $spacing-md;
		border-top: 2rpx solid $border-color-light;
	}

	&__view {
		font-size: $font-size-sm;
		color: $color-primary;
		margin-right: $spacing-xs;
	}
}

.ai-icon {
	width: 32rpx;
	height: 32rpx;
	position: relative;

	&::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 0;
		right: 0;
		height: 4rpx;
		background: linear-gradient(90deg, #667EEA, #F093FB);
		border-radius: 2rpx;
		transform: translateY(-50%);
	}

	&::after {
		content: '';
		position: absolute;
		top: 0;
		bottom: 0;
		left: 50%;
		width: 4rpx;
		background: linear-gradient(180deg, #667EEA, #F093FB);
		border-radius: 2rpx;
		transform: translateX(-50%);
	}
}

.symptom-tags {
	display: flex;
	flex-wrap: wrap;
	gap: $spacing-xs;
}

.symptom-tag {
	font-size: $font-size-xs;
	color: $text-secondary;
	background: $bg-elevated;
	padding: 4rpx 10rpx;
	border-radius: $radius-xs;
}

// 空状态
.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: $spacing-2xl 0;

	&__icon {
		width: 120rpx;
		height: 120rpx;
		background: $bg-elevated;
		border-radius: 50%;
		margin-bottom: $spacing-md;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	&__text {
		font-size: $font-size-base;
		color: $text-muted;
	}
}

.safe-area {
	height: calc(40rpx + env(safe-area-inset-bottom));
}

// ========== 深色模式 ==========
.page--dark {
	background: $dark-bg-base;

	.fixed-header {
		background: $dark-bg-base;
	}

	.navbar {
		&__back-icon { border-color: $dark-text-primary; }
		&__title { color: $dark-text-primary; }
	}

	.tabs-wrapper { border-bottom-color: $dark-border-color; }

	.tabs__item {
		color: $dark-text-secondary;
		&--active { color: $dark-color-primary; }
	}

	.tabs__indicator {
		background: linear-gradient(90deg, $dark-color-primary, lighten($dark-color-primary, 10%));
	}

	.skeleton-card {
		background: linear-gradient(90deg, $dark-bg-elevated 25%, $dark-bg-card 50%, $dark-bg-elevated 75%);
		background-size: 200% 100%;
	}

	.appointment-card {
		background: $dark-bg-card;

		&__header { border-bottom-color: $dark-border-color; }
		&__date { color: $dark-text-secondary; }
		&__hospital { color: $dark-text-primary; }
		&__dept {
			color: $dark-color-primary;
			background: rgba(74, 144, 217, 0.1);
		}
		&__doctor { color: $dark-text-secondary; }
		&__time { color: $dark-text-muted; }
		&__queue { color: $dark-color-accent; }
	}

	.hospital-icon {
		&::before { border-color: $dark-color-primary; }
		&::after { color: $dark-color-primary; }
	}

	.time-icon {
		&::before { border-color: $dark-text-muted; }
		&::after { background: $dark-text-muted; }
	}

	.report-card {
		background: $dark-bg-card;

		&__title { color: $dark-text-primary; }
		&__hospital { color: $dark-text-secondary; }
		&__diagnosis { color: $dark-text-muted; }
		&__date { color: $dark-text-muted; }
	}

	.record-icon {
		&::before { border-color: $dark-color-primary; }
		&::after { background: $dark-color-primary; box-shadow: 0 8rpx 0 $dark-color-primary, 0 16rpx 0 $dark-color-primary; }
	}

	.prescription-icon::before { color: $color-success; }

	.medicine-tag { background: rgba(16, 185, 129, 0.15); }

	.pdf-icon {
		&::before { border-color: $dark-color-accent; }
		&::after { color: $dark-color-accent; }
	}

	.diagnosis-card {
		background: $dark-bg-card;

		&__title { color: $dark-text-primary; }
		&__date { color: $dark-text-muted; }
		&__label { color: $dark-text-muted; }
		&__result { color: $dark-text-secondary; }
		&__footer { border-top-color: $dark-border-color; }
		&__view { color: $dark-color-primary; }
	}

	.symptom-tag {
		background: $dark-bg-elevated;
		color: $dark-text-secondary;
	}

	.empty-state {
		&__icon { background: $dark-bg-elevated; }
		&__text { color: $dark-text-muted; }
	}
}
</style>
