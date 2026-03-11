<template>
	<page-meta :background-color="isDark ? '#0D1117' : '#FAFBFD'"></page-meta>
	<view class="page" :class="{ 'page--dark': isDark }">

		<!-- 固定导航栏 -->
		<view class="navbar" :class="{ 'navbar--dark': isDark }">
			<view class="navbar__status" :style="{ height: statusBarHeight + 'px' }"></view>
			<view class="navbar__content">
				<view class="navbar__back" @click="goBack">
					<view class="navbar__back-icon"></view>
				</view>
				<text class="navbar__title">远程复诊</text>
				<view class="navbar__placeholder"></view>
			</view>
			<!-- Tab 栏 -->
			<view class="tabs">
				<view
					v-for="(tab, i) in tabs"
					:key="i"
					class="tabs__item"
					:class="{ 'tabs__item--active': activeTab === i }"
					@click="switchTab(i)"
				>
					<text class="tabs__label">{{ tab.label }}</text>
					<view v-if="tab.count > 0" class="tabs__badge">
						<text class="tabs__badge-text">{{ tab.count }}</text>
					</view>
					<view v-if="activeTab === i" class="tabs__indicator"></view>
				</view>
			</view>
		</view>

		<!-- 导航栏占位 -->
		<view :style="{ height: navbarTotalHeight }"></view>

		<!-- 摘要横幅（有待复诊时展示） -->
		<view v-if="upcomingMeetings.length > 0 && activeTab === 0" class="summary-banner">
			<view class="summary-banner__left">
				<view class="summary-banner__icon-wrap">
					<image class="summary-banner__icon" src="@/static/cloud.svg" mode="aspectFit" />
				</view>
				<view class="summary-banner__text">
					<text class="summary-banner__title">您有 {{ upcomingMeetings.length }} 次待复诊</text>
					<text class="summary-banner__sub">{{ nextMeetingDesc }}</text>
				</view>
			</view>
			<view v-if="hasInProgress" class="summary-banner__live">
				<view class="summary-banner__live-dot"></view>
				<text class="summary-banner__live-text">进行中</text>
			</view>
		</view>

		<!-- 列表主体 -->
		<scroll-view scroll-y class="list-scroll" :style="{ top: navbarTotalHeight }">
			<!-- 骨架屏 -->
			<view v-if="loading" class="skeleton-wrap">
				<view v-for="i in 3" :key="i" class="skeleton-card">
					<view class="skeleton-row">
						<view class="skeleton-chip"></view>
						<view class="skeleton-time"></view>
					</view>
					<view class="skeleton-doctor">
						<view class="skeleton-avatar"></view>
						<view class="skeleton-info">
							<view class="skeleton-name"></view>
							<view class="skeleton-dept"></view>
						</view>
					</view>
					<view class="skeleton-divider"></view>
					<view class="skeleton-meta"></view>
					<view class="skeleton-actions">
						<view class="skeleton-btn"></view>
						<view class="skeleton-btn"></view>
					</view>
				</view>
			</view>

			<!-- 会议卡片列表 -->
			<view v-if="!loading && currentList.length > 0" class="meeting-list">

				<!-- 历史记录 Tab：appointment-card 简洁风格 -->
				<block v-if="activeTab === 1">
					<view
						v-for="(meeting, index) in currentList"
						:key="meeting.id"
						class="history-card"
						:class="{ 'history-card--show': animationReady }"
						:style="{ animationDelay: (index * 80) + 'ms' }"
					>
						<!-- Header：状态标签 + 日期 -->
						<view class="history-card__header">
							<view
								class="history-card__status"
								:class="meeting.status === 'COMPLETED' ? 'history-card__status--completed' : 'history-card__status--cancelled'"
							>
								{{ meeting.status === 'COMPLETED' ? '已完成' : '已取消' }}
							</view>
							<text class="history-card__date">{{ formatShortDate(meeting.scheduledAt) }}</text>
						</view>

						<!-- Body -->
						<view class="history-card__body">
							<!-- 医生名称行 -->
							<view class="history-card__doctor-row">
								<image
									class="history-card__avatar"
									:src="meeting.doctorAvatar || '/static/temporary/male.jpg'"
									mode="aspectFill"
								/>
								<text class="history-card__doctor-name">{{ meeting.doctorName || '主治医生' }}</text>
							</view>
							<!-- 科室 + 职称行 -->
							<view class="history-card__info">
								<text v-if="meeting.doctorDept" class="history-card__dept">{{ meeting.doctorDept }}</text>
								<text v-if="meeting.doctorTitle" class="history-card__title-tag">{{ meeting.doctorTitle }}</text>
							</view>
							<!-- 时间行 -->
							<view class="history-card__time-row">
								<view class="history-time-icon"></view>
								<text class="history-card__time-text">{{ formatScheduledDate(meeting.scheduledAt) }}</text>
							</view>
							<!-- 备注 -->
							<text v-if="meeting.notes" class="history-card__notes">{{ meeting.notes }}</text>
							<!-- 取消原因 -->
							<text v-if="meeting.cancelReason" class="history-card__reason">取消原因：{{ meeting.cancelReason }}</text>
						</view>
					</view>
				</block>

				<!-- 待复诊 Tab：保持原有 meeting-card 风格 -->
				<block v-else>
					<view
						v-for="(meeting, index) in currentList"
						:key="meeting.id"
						class="meeting-card"
						:class="[
							'meeting-card--' + getDisplayState(meeting),
							{ 'meeting-card--show': animationReady }
						]"
						:style="{ animationDelay: (index * 100) + 'ms' }"
					>
						<!-- 卡片头部：带色彩渐变的 header band -->
						<view class="card-header-band">
							<view class="card-header">
								<view class="status-chip" :class="'status-chip--' + getDisplayState(meeting)">
									<view
										v-if="['waiting','in_progress','imminent'].includes(getDisplayState(meeting))"
										class="pulse-dot"
									></view>
									<text class="status-chip__text">{{ getStatusLabel(meeting) }}</text>
								</view>
								<text
									class="card-time"
									:class="getTimeColorClass(meeting)"
								>{{ getTimeDisplay(meeting) }}</text>
							</view>
						</view>

						<!-- 医生信息 -->
						<view class="doctor-row">
							<view class="doctor-avatar-wrap">
								<image
									class="doctor-avatar"
									:src="meeting.doctorAvatar || '/static/temporary/male.jpg'"
									mode="aspectFill"
								/>
							</view>
							<view class="doctor-info">
								<view class="doctor-name-row">
									<text class="doctor-name">{{ meeting.doctorName || '主治医生' }}</text>
									<view v-if="meeting.doctorTitle" class="doctor-title-tag">
										<text class="doctor-title-text">{{ meeting.doctorTitle }}</text>
									</view>
								</view>
								<text v-if="meeting.doctorDept" class="doctor-dept">{{ meeting.doctorDept }}</text>
							</view>
						</view>

						<!-- 分隔线 -->
						<view class="card-divider"></view>

						<!-- 预约信息 -->
						<view class="meta-row">
							<view class="meta-item">
								<text class="meta-icon">📅</text>
								<text class="meta-text">{{ formatScheduledDate(meeting.scheduledAt) }}</text>
							</view>
							<view v-if="meeting.notes" class="meta-item">
								<text class="meta-icon">📋</text>
								<text class="meta-text meta-text--notes" :numberOfLines="1">{{ meeting.notes }}</text>
							</view>
						</view>

						<!-- 操作按钮 -->
						<view
							v-if="meeting.status !== 'COMPLETED' && meeting.status !== 'CANCELLED'"
							class="card-actions"
						>
							<!-- 取消按钮 -->
							<view
								v-if="canCancel(meeting)"
								class="action-btn action-btn--ghost"
								@click.stop="openCancelSheet(meeting)"
							>
								<text class="action-btn__text">取消预约</text>
							</view>
							<view v-else class="action-btn-placeholder"></view>

							<!-- 进入诊室按钮 -->
							<view
								class="action-btn action-btn--enter"
								:class="{
									'action-btn--enter-active': canEnter(meeting),
									'action-btn--enter-progress': meeting.status === 'IN_PROGRESS',
									'action-btn--enter-disabled': !canEnter(meeting)
								}"
								@click.stop="canEnter(meeting) && enterMeeting(meeting)"
							>
								<text class="action-btn__text action-btn__text--enter">
									{{ meeting.status === 'IN_PROGRESS' ? '立即进入' : '进入诊室' }}
								</text>
								<text class="action-btn__arrow">→</text>
							</view>
						</view>

						<!-- 完成/取消状态标记 -->
						<view v-else class="card-finished">
							<text class="card-finished__text">
								{{ meeting.status === 'COMPLETED' ? '✓ 诊疗已完成' : '✗ 预约已取消' }}
							</text>
							<text v-if="meeting.cancelReason" class="card-finished__reason">{{ meeting.cancelReason }}</text>
						</view>
					</view>
				</block>

			</view>

			<!-- 空状态 -->
			<view v-if="!loading && currentList.length === 0" class="empty-state">
				<view class="empty-state__icon-wrap">
					<view class="empty-state__icon-bg"></view>
					<image class="empty-state__icon" src="@/static/cloud.svg" mode="aspectFit" />
				</view>
				<text class="empty-state__title">{{ activeTab === 0 ? '暂无待复诊项目' : '暂无历史记录' }}</text>
				<text class="empty-state__desc">{{ activeTab === 0 ? '如有问题请联系主治医生' : '您的复诊历史将显示在这里' }}</text>
			</view>

			<view style="height: 60rpx;"></view>
		</scroll-view>

		<!-- 取消确认底部弹层 -->
		<view v-if="showCancelSheet" class="sheet-mask" @click="closeCancelSheet"></view>
		<view class="cancel-sheet" :class="{ 'cancel-sheet--show': showCancelSheet }">
			<view class="cancel-sheet__handle"></view>
			<text class="cancel-sheet__title">取消复诊预约</text>
			<view v-if="cancelTarget" class="cancel-sheet__doctor">
				<image
					class="cancel-sheet__avatar"
					:src="cancelTarget.doctorAvatar || '/static/temporary/male.jpg'"
					mode="aspectFill"
				/>
				<view>
					<text class="cancel-sheet__doctor-name">{{ cancelTarget.doctorName || '主治医生' }}</text>
					<text class="cancel-sheet__doctor-time">{{ formatScheduledDate(cancelTarget.scheduledAt) }}</text>
				</view>
			</view>
			<text class="cancel-sheet__reason-title">取消原因（选填）</text>
			<view class="cancel-sheet__reasons">
				<view
					v-for="(r, i) in cancelReasons"
					:key="i"
					class="reason-item"
					:class="{ 'reason-item--selected': selectedReason === r }"
					@click="selectedReason = (selectedReason === r ? '' : r)"
				>
					<view class="reason-item__radio">
						<view v-if="selectedReason === r" class="reason-item__radio-dot"></view>
					</view>
					<text class="reason-item__text">{{ r }}</text>
				</view>
			</view>
			<view class="cancel-sheet__actions">
				<view class="sheet-btn sheet-btn--ghost" @click="closeCancelSheet">
					<text class="sheet-btn__text">再想想</text>
				</view>
				<view class="sheet-btn sheet-btn--danger" :class="{ 'sheet-btn--loading': cancelling }" @click="confirmCancel">
					<text class="sheet-btn__text">{{ cancelling ? '取消中...' : '确认取消' }}</text>
				</view>
			</view>
		</view>

	</view>
</template>

<script>
import { isDarkMode } from '@/store/theme.js'
import { getMeetingList, getMeetingDetail, getJoinInfo, cancelMeeting } from '@/utils/api/followup.js'

const DAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

function pad(n) {
	return String(n).padStart(2, '0')
}

export default {
	data() {
		return {
			statusBarHeight: 44,
			activeTab: 0,
			tabs: [
				{ label: '待复诊', count: 0 },
				{ label: '历史记录', count: 0 }
			],
			meetings: [],
			loading: true,
			animationReady: false,
			nowMs: Date.now(),
			tickTimer: null,
			// 取消弹层
			showCancelSheet: false,
			cancelTarget: null,
			selectedReason: '',
			cancelling: false,
			cancelReasons: ['个人原因', '时间冲突', '已痊愈，无需复诊', '其他']
		}
	},
	computed: {
		isDark() {
			return isDarkMode()
		},
		navbarTotalHeight() {
			// statusBar(px) + navbar内容(88rpx) + tabs(88rpx)，转为 calc
			return `calc(${this.statusBarHeight}px + 88rpx + 88rpx)`
		},
		upcomingMeetings() {
			const active = this.meetings.filter(m =>
				['SCHEDULED', 'WAITING', 'IN_PROGRESS'].includes(m.status)
			)
			// 排序：IN_PROGRESS 置顶 → WAITING → SCHEDULED 按时间升序
			const order = { IN_PROGRESS: 0, WAITING: 1, SCHEDULED: 2 }
			return active.sort((a, b) => {
				if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status]
				return new Date(a.scheduledAt) - new Date(b.scheduledAt)
			})
		},
		historyMeetings() {
			return this.meetings
				.filter(m => ['COMPLETED', 'CANCELLED'].includes(m.status))
				.sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt))
		},
		currentList() {
			return this.activeTab === 0 ? this.upcomingMeetings : this.historyMeetings
		},
		hasInProgress() {
			return this.meetings.some(m => m.status === 'IN_PROGRESS')
		},
		nextMeetingDesc() {
			const next = this.upcomingMeetings.find(m => m.status !== 'IN_PROGRESS')
			if (!next) return this.hasInProgress ? '当前有复诊正在进行' : ''
			const d = new Date(next.scheduledAt)
			const diffDays = Math.floor((d - new Date()) / 86400000)
			if (diffDays === 0) return `今天 ${pad(d.getHours())}:${pad(d.getMinutes())}`
			if (diffDays === 1) return `明天 ${pad(d.getHours())}:${pad(d.getMinutes())}`
			return `${pad(d.getMonth() + 1)}月${pad(d.getDate())}日 ${pad(d.getHours())}:${pad(d.getMinutes())}`
		}
	},
	onLoad() {
		const sysInfo = uni.getSystemInfoSync()
		this.statusBarHeight = sysInfo.statusBarHeight || 44
	},
	onShow() {
		this.loadMeetings()
		this.startTick()
	},
	onHide() {
		this.stopTick()
	},
	onUnload() {
		this.stopTick()
	},
	methods: {
		goBack() {
			uni.navigateBack()
		},
		switchTab(i) {
			this.activeTab = i
			this.animationReady = false
			this.$nextTick(() => {
				setTimeout(() => { this.animationReady = true }, 50)
			})
		},

		// ── 数据加载 ──────────────────────────────
		async loadMeetings() {
			this.loading = true
			const res = await getMeetingList()
			if (res.code === 200) {
				this.meetings = res.data || []
				this.tabs[0].count = this.upcomingMeetings.length
				this.tabs[1].count = 0
			} else {
				uni.showToast({ title: res.msg || '加载失败', icon: 'none' })
			}
			this.loading = false
			setTimeout(() => { this.animationReady = true }, 80)
		},

		// ── 倒计时 ────────────────────────────────
		startTick() {
			this.nowMs = Date.now()
			if (this.tickTimer) return
			this.tickTimer = setInterval(() => {
				this.nowMs = Date.now()
			}, 1000)
		},
		stopTick() {
			if (this.tickTimer) {
				clearInterval(this.tickTimer)
				this.tickTimer = null
			}
		},

		// ── 状态计算 ──────────────────────────────
		getDisplayState(meeting) {
			const { status, scheduledAt } = meeting
			if (status === 'IN_PROGRESS') return 'in_progress'
			if (status === 'WAITING')     return 'waiting'
			if (status === 'COMPLETED')   return 'completed'
			if (status === 'CANCELLED')   return 'cancelled'
			// SCHEDULED
			const diffMs = new Date(scheduledAt).getTime() - this.nowMs
			if (diffMs <= 5 * 60 * 1000)  return 'imminent'   // < 5min
			if (diffMs <= 60 * 60 * 1000) return 'soon'        // < 1h
			return 'scheduled'
		},
		getStatusLabel(meeting) {
			const map = {
				in_progress: '进行中',
				waiting:     '等待中',
				imminent:    '即将开始',
				soon:        '即将开始',
				scheduled:   '已预约',
				completed:   '已完成',
				cancelled:   '已取消'
			}
			return map[this.getDisplayState(meeting)] || ''
		},
		canCancel(meeting) {
			if (meeting.status === 'WAITING') return true
			if (meeting.status === 'SCHEDULED') {
				const diffMs = new Date(meeting.scheduledAt).getTime() - this.nowMs
				return diffMs > 3 * 60 * 60 * 1000
			}
			return false
		},
		canEnter(meeting) {
			if (meeting.status === 'IN_PROGRESS' || meeting.status === 'WAITING') return true
			if (meeting.status === 'SCHEDULED') {
				const diffMs = new Date(meeting.scheduledAt).getTime() - this.nowMs
				return diffMs <= 5 * 60 * 1000
			}
			return false
		},

		// ── 时间显示 ──────────────────────────────
		getTimeDisplay(meeting) {
			const { status, scheduledAt, startedAt, maxDurationMinutes } = meeting
			const now = this.nowMs

			if (status === 'COMPLETED' || status === 'CANCELLED') {
				return this.formatShortDate(scheduledAt)
			}
			if (status === 'IN_PROGRESS') {
				if (startedAt && maxDurationMinutes) {
					const endMs = new Date(startedAt).getTime() + maxDurationMinutes * 60000
					const rem = Math.max(0, endMs - now)
					const s = Math.floor(rem / 1000)
					const m = Math.floor(s / 60)
					const h = Math.floor(m / 60)
					if (h > 0) return `剩余 ${h}:${pad(m % 60)}:${pad(s % 60)}`
					return `剩余 ${pad(m)}:${pad(s % 60)}`
				}
				return '进行中'
			}
			if (status === 'WAITING') return '等待医生进入'

			// SCHEDULED
			const diffMs = new Date(scheduledAt).getTime() - now
			if (diffMs <= 0) return '即将开始'
			if (diffMs <= 5 * 60 * 1000) {
				const s = Math.floor(diffMs / 1000)
				return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`
			}
			if (diffMs <= 60 * 60 * 1000) return `${Math.floor(diffMs / 60000)} 分钟后`
			if (diffMs <= 24 * 60 * 60 * 1000) return `${Math.floor(diffMs / 3600000)} 小时后`
			const d = Math.floor(diffMs / 86400000)
			if (d === 1) return '明天'
			if (d === 2) return '后天'
			return `${d} 天后`
		},
		getTimeColorClass(meeting) {
			const { status, startedAt, maxDurationMinutes } = meeting
			if (status === 'IN_PROGRESS') {
				if (startedAt && maxDurationMinutes) {
					const rem = Math.floor((new Date(startedAt).getTime() + maxDurationMinutes * 60000 - this.nowMs) / 1000)
					if (rem <= 300) return 'time--red'
					if (rem <= 600) return 'time--amber'
				}
				return 'time--green'
			}
			if (status === 'WAITING') return 'time--blue'
			if (status === 'SCHEDULED') {
				const diffMs = new Date(meeting.scheduledAt).getTime() - this.nowMs
				if (diffMs <= 5 * 60 * 1000)  return 'time--green'
				if (diffMs <= 60 * 60 * 1000) return 'time--amber'
				return 'time--blue'
			}
			return 'time--muted'
		},

		// ── 格式化 ────────────────────────────────
		formatScheduledDate(scheduledAt) {
			const d = new Date(scheduledAt)
			return `${pad(d.getMonth() + 1)}月${pad(d.getDate())}日  ${DAYS[d.getDay()]}  ${pad(d.getHours())}:${pad(d.getMinutes())}`
		},
		formatShortDate(scheduledAt) {
			const d = new Date(scheduledAt)
			return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}`
		},

		// ── 进入诊室 ──────────────────────────────
		async enterMeeting(meeting) {
			uni.showLoading({ title: '连接中...', mask: true })
			try {
				const [detailRes, joinRes] = await Promise.all([
					getMeetingDetail(meeting.id),
					getJoinInfo(meeting.id)
				])
				uni.hideLoading()

				if (joinRes.code !== 200 || !joinRes.data?.joinUrl) {
					uni.showToast({ title: joinRes.msg || '获取会议信息失败', icon: 'none' })
					return
				}

				const join = joinRes.data
				const detail = detailRes.data || {}

				let endTimeMs = 0
				if (detail.startedAt && detail.maxDurationMinutes) {
					endTimeMs = new Date(detail.startedAt).getTime() + detail.maxDurationMinutes * 60000
				}

				uni.navigateTo({
					url: '/pages/cloud-hospital/video-meeting'
						+ '?meetingId=' + encodeURIComponent(meeting.id)
						+ '&joinUrl=' + encodeURIComponent(join.joinUrl)
						+ '&endTimeMs=' + endTimeMs
						+ '&doctorName=' + encodeURIComponent(meeting.doctorName || '主治医生')
						+ '&department=' + encodeURIComponent(meeting.doctorDept || '')
						+ '&maxDurationMinutes=' + (detail.maxDurationMinutes || meeting.maxDurationMinutes || 30)
				})
			} catch (e) {
				uni.hideLoading()
				uni.showToast({ title: '连接失败，请重试', icon: 'none' })
			}
		},

		// ── 取消预约 ──────────────────────────────
		openCancelSheet(meeting) {
			this.cancelTarget = meeting
			this.selectedReason = ''
			this.showCancelSheet = true
		},
		closeCancelSheet() {
			if (this.cancelling) return
			this.showCancelSheet = false
			setTimeout(() => { this.cancelTarget = null }, 350)
		},
		async confirmCancel() {
			if (this.cancelling || !this.cancelTarget) return
			this.cancelling = true
			const res = await cancelMeeting(this.cancelTarget.id, this.selectedReason)
			this.cancelling = false
			if (res.code === 200) {
				this.showCancelSheet = false
				this.cancelTarget = null
				uni.showToast({ title: '预约已取消', icon: 'success' })
				await this.loadMeetings()
			} else {
				uni.showToast({ title: res.msg || '取消失败，请重试', icon: 'none' })
			}
		}
	}
}
</script>

<style lang="scss" scoped>
// ============================================================
// 页面底色
// ============================================================
.page {
	min-height: 100vh;
	background: linear-gradient(180deg, rgba(14, 165, 233, 0.06) 0%, $bg-base 28%);
}

// ============================================================
// 导航栏
// ============================================================
.navbar {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	z-index: 100;
	background: rgba(255, 255, 255, 0.92);
	backdrop-filter: blur(20rpx);

	&__status { }

	&__content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 88rpx;
		padding: 0 $spacing-md;
	}

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
		margin-left: 8rpx;
	}

	&__title {
		font-size: $font-size-lg;
		font-weight: $font-weight-semibold;
		color: $text-primary;
	}

	&__placeholder { width: 72rpx; }
}

.navbar--dark {
	background: rgba(22, 27, 34, 0.92);
	.navbar__back-icon { border-color: $dark-text-primary; }
	.navbar__title { color: $dark-text-primary; }
}

// ============================================================
// Tab 栏
// ============================================================
.tabs {
	display: flex;
	height: 88rpx;
	border-top: 2rpx solid rgba(0, 0, 0, 0.04);

	&__item {
		flex: 1;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8rpx;
	}

	&__label {
		font-size: $font-size-sm;
		font-weight: $font-weight-medium;
		color: $text-muted;
		transition: color 0.2s;
	}

	&__item--active &__label {
		color: $color-primary;
		font-weight: $font-weight-semibold;
	}

	&__badge {
		min-width: 36rpx;
		height: 36rpx;
		padding: 0 10rpx;
		border-radius: $radius-full;
		background: $color-primary;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	&__badge-text {
		font-size: 20rpx;
		color: #fff;
		font-weight: $font-weight-bold;
		line-height: 1;
	}

	&__indicator {
		position: absolute;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 48rpx;
		height: 6rpx;
		background: linear-gradient(90deg, $color-primary, rgba(51, 136, 255, 0.6));
		border-radius: 3rpx;
	}
}

// ============================================================
// 滚动区域（撑满全屏减去 navbar）
// ============================================================
.list-scroll {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
}

// ============================================================
// 摘要横幅
// ============================================================
.summary-banner {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin: $spacing-md $spacing-md $spacing-sm;
	padding: $spacing-md $spacing-lg;
	background: rgba(51, 136, 255, 0.06);
	border: 2rpx solid rgba(51, 136, 255, 0.12);
	border-radius: $radius-xl;

	&__left {
		display: flex;
		align-items: center;
		gap: $spacing-sm;
	}

	&__icon-wrap {
		width: 72rpx;
		height: 72rpx;
		border-radius: $radius-lg;
		background: rgba(51, 136, 255, 0.1);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	&__icon {
		width: 40rpx;
		height: 40rpx;
		filter: invert(40%) sepia(80%) saturate(1800%) hue-rotate(200deg) brightness(100%) contrast(100%);
	}

	&__title {
		font-size: $font-size-sm;
		font-weight: $font-weight-semibold;
		color: $text-primary;
		display: block;
	}

	&__sub {
		font-size: $font-size-xs;
		color: $text-muted;
		margin-top: 4rpx;
		display: block;
	}

	&__live {
		display: flex;
		align-items: center;
		gap: 8rpx;
		padding: 8rpx 20rpx;
		background: rgba(16, 185, 129, 0.1);
		border-radius: $radius-full;
	}

	&__live-dot {
		width: 14rpx;
		height: 14rpx;
		border-radius: 50%;
		background: #10B981;
		animation: dotPulse 1.5s ease-in-out infinite;
	}

	&__live-text {
		font-size: $font-size-xs;
		font-weight: $font-weight-semibold;
		color: #10B981;
	}
}

// ============================================================
// 会议卡片
// ============================================================
.meeting-list {
	padding: $spacing-sm $spacing-md;
}

.meeting-card {
	background: #fff;
	border-radius: $radius-xl;
	padding: $spacing-lg;
	margin-bottom: $spacing-md;
	box-shadow: 0 1rpx 4rpx rgba(30, 58, 95, 0.04), 0 6rpx 24rpx rgba(30, 58, 95, 0.08);
	border: 1.5rpx solid rgba(0, 0, 0, 0.14);
	overflow: hidden;
	opacity: 0;
	transform: translateY(36rpx);

	&--show {
		animation: cardFadeIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
	}

	// 进行中：绿色边框
	&--in_progress {
		border-color: rgba(16, 185, 129, 0.40);
	}

	// 等待中：蓝紫色边框
	&--waiting {
		border-color: rgba(99, 102, 241, 0.35);
	}

	// 历史：轻微降低对比度
	&--completed,
	&--cancelled {
		opacity: 0.72;
	}
}

// 卡片头部 header band（负 margin 撑满顶部，overflow:hidden 裁剪圆角）
.card-header-band {
	margin: -32rpx -32rpx 24rpx;
	padding: 20rpx 32rpx;
	border-radius: 32rpx 32rpx 0 0;
}

.meeting-card--in_progress .card-header-band {
	background: linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.03) 100%);
}

.meeting-card--imminent .card-header-band {
	background: linear-gradient(135deg, rgba(16, 185, 129, 0.10) 0%, rgba(16, 185, 129, 0.02) 100%);
}

.meeting-card--waiting .card-header-band {
	background: linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(99, 102, 241, 0.03) 100%);
}

.meeting-card--soon .card-header-band {
	background: linear-gradient(135deg, rgba(245, 158, 11, 0.10) 0%, rgba(245, 158, 11, 0.02) 100%);
}

.meeting-card--scheduled .card-header-band {
	background: linear-gradient(135deg, rgba(51, 136, 255, 0.08) 0%, rgba(51, 136, 255, 0.01) 100%);
}

.card-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

// 状态 chip
.status-chip {
	display: inline-flex;
	align-items: center;
	gap: 8rpx;
	padding: 8rpx 20rpx;
	border-radius: $radius-full;
	font-size: $font-size-xs;
	font-weight: $font-weight-semibold;

	&--scheduled  { background: rgba(51, 136, 255, 0.1);  color: #3388FF; }
	&--soon       { background: rgba(245, 158, 11, 0.1);  color: #F59E0B; }
	&--imminent   { background: rgba(16, 185, 129, 0.12); color: #10B981; }
	&--waiting    { background: rgba(99, 102, 241, 0.1);  color: #6366F1; }
	&--in_progress { background: rgba(16, 185, 129, 0.12); color: #10B981; }
	&--completed  { background: rgba(148, 163, 184, 0.1); color: #94A3B8; }
	&--cancelled  { background: rgba(239, 68, 68, 0.08);  color: #EF4444; }
}

.pulse-dot {
	width: 12rpx;
	height: 12rpx;
	border-radius: 50%;
	background: currentColor;
	animation: dotPulse 1.5s ease-in-out infinite;
}

// 时间显示
.card-time {
	font-size: $font-size-sm;
	font-weight: $font-weight-semibold;

	&.time--green  { color: #10B981; }
	&.time--amber  { color: #F59E0B; }
	&.time--red    { color: #EF4444; }
	&.time--blue   { color: #3388FF; }
	&.time--muted  { color: $text-muted; }
}

// 医生行
.doctor-row {
	display: flex;
	align-items: center;
	gap: $spacing-md;
	margin-bottom: $spacing-md;
}

.doctor-avatar-wrap {
	width: 96rpx;
	height: 96rpx;
	border-radius: 50%;
	overflow: hidden;
	flex-shrink: 0;
}

.doctor-avatar {
	width: 100%;
	height: 100%;
}

.doctor-info {
	flex: 1;
	overflow: hidden;
}

.doctor-name-row {
	display: flex;
	align-items: center;
	gap: $spacing-xs;
	margin-bottom: 6rpx;
}

.doctor-name {
	font-size: $font-size-lg;
	font-weight: $font-weight-semibold;
	color: $text-primary;
}

.doctor-title-tag {
	padding: 4rpx 12rpx;
	background: rgba(51, 136, 255, 0.08);
	border-radius: $radius-sm;
}

.doctor-title-text {
	font-size: 20rpx;
	color: $color-primary;
	font-weight: $font-weight-medium;
}

.doctor-dept {
	font-size: $font-size-xs;
	color: $text-muted;
}

// 分隔线
.card-divider {
	height: 2rpx;
	background: rgba(0, 0, 0, 0.05);
	margin: $spacing-sm 0 $spacing-md;
}

// 元信息行
.meta-row {
	display: flex;
	flex-direction: column;
	gap: 8rpx;
	margin-bottom: $spacing-lg;
}

.meta-item {
	display: flex;
	align-items: center;
	gap: $spacing-xs;
}

.meta-icon {
	font-size: 28rpx;
	width: 36rpx;
}

.meta-text {
	font-size: $font-size-sm;
	color: $text-secondary;
	flex: 1;

	&--notes {
		color: $text-muted;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
}

// 操作按钮区
.card-actions {
	display: flex;
	align-items: center;
	gap: $spacing-sm;
}

.action-btn-placeholder {
	flex: 1;
}

.action-btn {
	height: 72rpx;
	border-radius: $radius-lg;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8rpx;

	&--ghost {
		flex: 1;
		border: 2rpx solid rgba(0, 0, 0, 0.12);

		.action-btn__text { color: $text-secondary; font-size: $font-size-sm; }
	}

	&--enter {
		flex: 1.4;
		padding: 0 $spacing-md;
	}

	&--enter-disabled {
		background: rgba(0, 0, 0, 0.05);
		border: 2rpx solid rgba(0, 0, 0, 0.08);
		.action-btn__text--enter { color: $text-muted; }
		.action-btn__arrow { color: $text-muted; }
	}

	&--enter-active {
		background: linear-gradient(135deg, #3388FF 0%, #1166DD 100%);
		box-shadow: 0 4rpx 20rpx rgba(51, 136, 255, 0.35);
		.action-btn__text--enter { color: #fff; }
		.action-btn__arrow { color: rgba(255,255,255,0.8); }
	}

	&--enter-progress {
		background: linear-gradient(135deg, #10B981 0%, #059669 100%);
		box-shadow: 0 4rpx 20rpx rgba(16, 185, 129, 0.35);
		animation: btnPulse 2s ease-in-out infinite;
		.action-btn__text--enter { color: #fff; }
		.action-btn__arrow { color: rgba(255,255,255,0.8); }
	}
}

.action-btn__text {
	font-size: $font-size-sm;
	font-weight: $font-weight-semibold;
}

.action-btn__text--enter {
	font-size: $font-size-sm;
	font-weight: $font-weight-semibold;
}

.action-btn__arrow {
	font-size: $font-size-sm;
	font-weight: $font-weight-bold;
}

// 已完成/取消标记
.card-finished {
	padding-top: $spacing-xs;
	display: flex;
	flex-direction: column;
	gap: 4rpx;

	&__text {
		font-size: $font-size-xs;
		color: $text-muted;
	}

	&__reason {
		font-size: $font-size-xs;
		color: $text-muted;
		opacity: 0.7;
	}
}

// ============================================================
// 历史记录卡片（对齐 appointment-card 风格）
// ============================================================
.history-card {
	background: #fff;
	border-radius: $radius-lg;
	padding: $spacing-lg;
	margin-bottom: $spacing-md;
	box-shadow: $shadow-sm;
	opacity: 0;
	transform: translateY(24rpx);
	transition: transform 0.25s ease;

	&--show {
		animation: cardFadeIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards;
	}

	&:active {
		transform: scale(0.98);
	}

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

		&--completed {
			background: rgba(16, 185, 129, 0.1);
			color: $color-success;
		}

		&--cancelled {
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

	&__doctor-row {
		display: flex;
		align-items: center;
		gap: $spacing-sm;
	}

	&__avatar {
		width: 48rpx;
		height: 48rpx;
		border-radius: 50%;
		overflow: hidden;
		flex-shrink: 0;
	}

	&__doctor-name {
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

	&__title-tag {
		font-size: $font-size-base;
		color: $text-secondary;
	}

	&__time-row {
		display: flex;
		align-items: center;
		gap: $spacing-xs;
	}

	&__time-text {
		font-size: $font-size-sm;
		color: $text-muted;
	}

	&__notes {
		font-size: $font-size-xs;
		color: $text-muted;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	&__reason {
		font-size: $font-size-xs;
		color: $text-muted;
		font-style: italic;
	}
}

.history-time-icon {
	width: 28rpx;
	height: 28rpx;
	flex-shrink: 0;
	position: relative;

	&::before {
		content: "";
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
		content: "";
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

// ============================================================
// 骨架屏
// ============================================================
.skeleton-wrap {
	padding: $spacing-sm $spacing-md;
}

.skeleton-card {
	background: #fff;
	border-radius: $radius-xl;
	padding: $spacing-lg;
	margin-bottom: $spacing-md;
}

.skeleton-row {
	display: flex;
	justify-content: space-between;
	margin-bottom: $spacing-md;
}

.skeleton-chip {
	width: 120rpx;
	height: 44rpx;
	border-radius: $radius-full;
	background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
	background-size: 400% 100%;
	animation: shimmer 1.4s ease-in-out infinite;
}

.skeleton-time {
	width: 100rpx;
	height: 36rpx;
	border-radius: $radius-sm;
	background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
	background-size: 400% 100%;
	animation: shimmer 1.4s ease-in-out infinite;
}

.skeleton-doctor {
	display: flex;
	gap: $spacing-md;
	margin-bottom: $spacing-md;
}

.skeleton-avatar {
	width: 96rpx;
	height: 96rpx;
	border-radius: $radius-lg;
	background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
	background-size: 400% 100%;
	animation: shimmer 1.4s ease-in-out infinite;
	flex-shrink: 0;
}

.skeleton-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	justify-content: center;
	gap: $spacing-xs;
}

.skeleton-name {
	width: 180rpx;
	height: 36rpx;
	border-radius: $radius-sm;
	background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
	background-size: 400% 100%;
	animation: shimmer 1.4s ease-in-out infinite;
}

.skeleton-dept {
	width: 120rpx;
	height: 28rpx;
	border-radius: $radius-sm;
	background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
	background-size: 400% 100%;
	animation: shimmer 1.4s ease-in-out infinite;
}

.skeleton-divider {
	height: 2rpx;
	background: #f5f5f5;
	margin: $spacing-sm 0;
}

.skeleton-meta {
	width: 60%;
	height: 28rpx;
	border-radius: $radius-sm;
	margin-bottom: $spacing-md;
	background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
	background-size: 400% 100%;
	animation: shimmer 1.4s ease-in-out infinite;
}

.skeleton-actions {
	display: flex;
	gap: $spacing-sm;
}

.skeleton-btn {
	flex: 1;
	height: 72rpx;
	border-radius: $radius-lg;
	background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
	background-size: 400% 100%;
	animation: shimmer 1.4s ease-in-out infinite;
}

// ============================================================
// 空状态
// ============================================================
.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 120rpx $spacing-xl 60rpx;

	&__icon-wrap {
		position: relative;
		width: 240rpx;
		height: 240rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: $spacing-xl;
	}

	&__icon-bg {
		position: absolute;
		width: 200rpx;
		height: 200rpx;
		background: radial-gradient(circle, rgba(14, 165, 233, 0.12) 0%, transparent 70%);
		border-radius: 50%;
		animation: pulse 3s ease-in-out infinite;
	}

	&__icon {
		position: relative;
		width: 120rpx;
		height: 120rpx;
		z-index: 1;
		filter: invert(52%) sepia(94%) saturate(1095%) hue-rotate(176deg) brightness(98%) contrast(92%);
		animation: float 4s ease-in-out infinite;
	}

	&__title {
		font-size: 36rpx;
		font-weight: $font-weight-semibold;
		color: $text-primary;
		margin-bottom: $spacing-sm;
		letter-spacing: 2rpx;
	}

	&__desc {
		font-size: $font-size-base;
		color: $text-muted;
	}
}

// ============================================================
// 取消底部弹层
// ============================================================
.sheet-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	z-index: 200;
}

.cancel-sheet {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 201;
	background: #fff;
	border-radius: 32rpx 32rpx 0 0;
	padding: $spacing-md $spacing-xl $spacing-2xl;
	transform: translateY(100%);
	transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1);

	&--show {
		transform: translateY(0);
	}

	&__handle {
		width: 72rpx;
		height: 8rpx;
		border-radius: 4rpx;
		background: rgba(0, 0, 0, 0.15);
		margin: 0 auto $spacing-lg;
	}

	&__title {
		font-size: $font-size-lg;
		font-weight: $font-weight-bold;
		color: $text-primary;
		display: block;
		margin-bottom: $spacing-md;
	}

	&__doctor {
		display: flex;
		align-items: center;
		gap: $spacing-md;
		padding: $spacing-md;
		background: rgba(0, 0, 0, 0.03);
		border-radius: $radius-lg;
		margin-bottom: $spacing-lg;
	}

	&__avatar {
		width: 80rpx;
		height: 80rpx;
		border-radius: $radius-lg;
		overflow: hidden;
	}

	&__doctor-name {
		font-size: $font-size-base;
		font-weight: $font-weight-semibold;
		color: $text-primary;
		display: block;
	}

	&__doctor-time {
		font-size: $font-size-xs;
		color: $text-muted;
		display: block;
		margin-top: 4rpx;
	}

	&__reason-title {
		font-size: $font-size-sm;
		font-weight: $font-weight-semibold;
		color: $text-secondary;
		display: block;
		margin-bottom: $spacing-sm;
	}

	&__reasons {
		display: flex;
		flex-direction: column;
		gap: $spacing-sm;
		margin-bottom: $spacing-xl;
	}

	&__actions {
		display: flex;
		gap: $spacing-sm;
	}
}

.reason-item {
	display: flex;
	align-items: center;
	gap: $spacing-md;
	padding: $spacing-sm $spacing-md;
	border-radius: $radius-lg;
	border: 2rpx solid rgba(0, 0, 0, 0.08);
	transition: border-color 0.2s;

	&--selected {
		border-color: $color-primary;
		background: rgba(51, 136, 255, 0.04);
	}

	&__radio {
		width: 40rpx;
		height: 40rpx;
		border-radius: 50%;
		border: 4rpx solid rgba(0, 0, 0, 0.2);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	&--selected &__radio {
		border-color: $color-primary;
	}

	&__radio-dot {
		width: 20rpx;
		height: 20rpx;
		border-radius: 50%;
		background: $color-primary;
	}

	&__text {
		font-size: $font-size-sm;
		color: $text-secondary;
	}

	&--selected &__text {
		color: $text-primary;
		font-weight: $font-weight-medium;
	}
}

.sheet-btn {
	flex: 1;
	height: 88rpx;
	border-radius: $radius-lg;
	display: flex;
	align-items: center;
	justify-content: center;

	&--ghost {
		border: 2rpx solid rgba(0, 0, 0, 0.12);
		.sheet-btn__text { color: $text-secondary; }
	}

	&--danger {
		background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
		box-shadow: 0 4rpx 16rpx rgba(239, 68, 68, 0.3);
		.sheet-btn__text { color: #fff; }
	}

	&--loading {
		opacity: 0.7;
	}

	&__text {
		font-size: $font-size-base;
		font-weight: $font-weight-semibold;
	}
}

// ============================================================
// 动画
// ============================================================
@keyframes cardFadeIn {
	from { opacity: 0; transform: translateY(36rpx); }
	to   { opacity: 1; transform: translateY(0); }
}

@keyframes dotPulse {
	0%, 100% { opacity: 1; transform: scale(1); }
	50%       { opacity: 0.45; transform: scale(0.65); }
}

@keyframes btnPulse {
	0%, 100% { box-shadow: 0 4rpx 20rpx rgba(16, 185, 129, 0.35); }
	50%       { box-shadow: 0 4rpx 32rpx rgba(16, 185, 129, 0.6); }
}

@keyframes shimmer {
	0%   { background-position: -400% 0; }
	100% { background-position: 400% 0; }
}

@keyframes pulse {
	0%, 100% { transform: scale(1); opacity: 1; }
	50%       { transform: scale(1.08); opacity: 0.75; }
}

@keyframes float {
	0%, 100% { transform: translateY(0); }
	50%       { transform: translateY(-12rpx); }
}

// ============================================================
// 深色模式
// ============================================================
.page--dark {
	background: linear-gradient(180deg, rgba(14, 165, 233, 0.08) 0%, $dark-bg-base 28%);

	.summary-banner {
		background: rgba(51, 136, 255, 0.08);
		border-color: rgba(51, 136, 255, 0.15);

		&__title { color: $dark-text-primary; }
		&__sub    { color: $dark-text-muted; }
	}

	.meeting-card {
		background: $dark-bg-elevated;
		box-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.3), 0 6rpx 24rpx rgba(0, 0, 0, 0.4);
		border-color: rgba(255, 255, 255, 0.06);

		&--in_progress { border-color: rgba(16, 185, 129, 0.3); }
		&--waiting     { border-color: rgba(99, 102, 241, 0.25); }
	}

	.meeting-card--in_progress .card-header-band {
		background: linear-gradient(135deg, rgba(16, 185, 129, 0.18) 0%, rgba(16, 185, 129, 0.05) 100%);
	}
	.meeting-card--imminent .card-header-band {
		background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.04) 100%);
	}
	.meeting-card--waiting .card-header-band {
		background: linear-gradient(135deg, rgba(99, 102, 241, 0.18) 0%, rgba(99, 102, 241, 0.05) 100%);
	}
	.meeting-card--soon .card-header-band {
		background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.04) 100%);
	}
	.meeting-card--scheduled .card-header-band {
		background: linear-gradient(135deg, rgba(51, 136, 255, 0.12) 0%, rgba(51, 136, 255, 0.03) 100%);
	}

	.card-divider { background: rgba(255, 255, 255, 0.06); }

	.doctor-name  { color: $dark-text-primary; }
	.meta-text    { color: $dark-text-secondary; }
	.meta-text--notes { color: $dark-text-muted; }

	.action-btn--ghost {
		border-color: rgba(255, 255, 255, 0.1);
		.action-btn__text { color: $dark-text-muted; }
	}

	.card-finished__text,
	.card-finished__reason { color: $dark-text-muted; }

	.empty-state__title { color: $dark-text-primary; }
	.empty-state__desc  { color: $dark-text-muted; }

	.skeleton-card    { background: $dark-bg-elevated; }
	.skeleton-chip, .skeleton-time, .skeleton-avatar,
	.skeleton-name, .skeleton-dept, .skeleton-meta,
	.skeleton-btn {
		background: linear-gradient(90deg, rgba(255,255,255,0.06) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.06) 75%);
		background-size: 400% 100%;
	}
	.skeleton-divider { background: rgba(255,255,255,0.05); }

	.cancel-sheet {
		background: $dark-bg-elevated;

		&__title       { color: $dark-text-primary; }
		&__doctor      { background: rgba(255,255,255,0.04); }
		&__doctor-name { color: $dark-text-primary; }
		&__doctor-time { color: $dark-text-muted; }
		&__reason-title { color: $dark-text-secondary; }
		&__handle      { background: rgba(255,255,255,0.15); }
	}

	.reason-item {
		border-color: rgba(255, 255, 255, 0.1);
		&__text { color: $dark-text-secondary; }
		&--selected { background: rgba(51, 136, 255, 0.08); border-color: $color-primary; }
		&--selected &__text { color: $dark-text-primary; }
	}

	.tabs {
		border-top-color: rgba(255, 255, 255, 0.06);
		&__label        { color: $dark-text-muted; }
		&__item--active &__label { color: $color-primary; }
	}

	.sheet-btn--ghost {
		border-color: rgba(255, 255, 255, 0.12);
		.sheet-btn__text { color: $dark-text-secondary; }
	}

	.history-card {
		background: $dark-bg-card;

		&__header        { border-bottom-color: $dark-border-color; }
		&__date          { color: $dark-text-secondary; }
		&__doctor-name   { color: $dark-text-primary; }
		&__dept {
			color: $dark-color-primary;
			background: rgba(74, 144, 217, 0.1);
		}
		&__title-tag     { color: $dark-text-secondary; }
		&__time-text     { color: $dark-text-muted; }
		&__notes         { color: $dark-text-muted; }
		&__reason        { color: $dark-text-muted; }
	}

	.history-time-icon {
		&::before { border-color: $dark-text-muted; }
		&::after  { background: $dark-text-muted; }
	}
}
</style>
