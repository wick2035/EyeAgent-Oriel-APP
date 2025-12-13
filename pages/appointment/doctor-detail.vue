<template>
	<view class="page" :class="{ 'page--dark': isDark }">
		<!-- 状态栏占位 -->
		<view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>

		<!-- 导航栏 -->
		<view class="navbar">
			<view class="navbar__back" @click="goBack">
				<view class="navbar__back-icon"></view>
			</view>
			<text class="navbar__title">预约挂号</text>
			<view class="navbar__placeholder"></view>
		</view>

		<!-- 内容区域 -->
		<scroll-view class="content" scroll-y>
			<!-- 医生信息卡片 -->
			<view class="doctor-info">
				<view class="doctor-info__main">
					<view class="doctor-info__avatar">
						<text class="doctor-info__avatar-text">{{ doctor?.name?.charAt(0) || '医' }}</text>
					</view>
					<view class="doctor-info__detail">
						<view class="doctor-info__header">
							<text class="doctor-info__name">{{ doctor?.name || '加载中...' }}</text>
							<view class="doctor-info__title">{{ doctor?.title }}</view>
						</view>
						<text class="doctor-info__dept">{{ departmentName }} · {{ hospitalName }}</text>
					</view>
				</view>

				<!-- 数据统计 -->
				<view class="doctor-info__stats">
					<view class="doctor-info__stat">
						<image class="doctor-info__stat-icon doctor-info__stat-icon--star" src="@/static/star.svg" mode="aspectFit" />
						<text class="doctor-info__stat-value">{{ doctor?.rating || '-' }}</text>
						<text class="doctor-info__stat-label">评分</text>
					</view>
					<view class="doctor-info__divider"></view>
					<view class="doctor-info__stat">
						<image class="doctor-info__stat-icon doctor-info__stat-icon--consult" src="@/static/wenzhenliang.svg" mode="aspectFit" />
						<text class="doctor-info__stat-value">{{ doctor?.consultCount || 0 }}</text>
						<text class="doctor-info__stat-label">问诊量</text>
					</view>
					<view class="doctor-info__divider"></view>
					<view class="doctor-info__stat">
						<image class="doctor-info__stat-icon doctor-info__stat-icon--exp" src="@/static/congyinianxian.svg" mode="aspectFit" />
						<text class="doctor-info__stat-value">{{ doctor?.experience || 0 }}年</text>
						<text class="doctor-info__stat-label">从医年限</text>
					</view>
				</view>
			</view>

			<!-- 擅长领域 -->
			<view class="section" v-if="doctor?.specialties?.length">
				<text class="section__title">擅长领域</text>
				<view class="specialty-tags">
					<view v-for="(s, idx) in doctor.specialties" :key="idx" class="specialty-tag">
						{{ s }}
					</view>
				</view>
			</view>

			<!-- 医生简介 -->
			<view class="section" v-if="doctor?.introduction">
				<text class="section__title">医生简介</text>
				<view class="intro-box">
					<text class="intro-box__text" :class="{ 'intro-box__text--expanded': introExpanded }">
						{{ doctor.introduction }}
					</text>
					<view v-if="doctor.introduction.length > 80" class="intro-box__toggle" @click="introExpanded = !introExpanded">
						<text>{{ introExpanded ? '收起' : '展开更多' }}</text>
						<view class="intro-box__arrow" :class="{ 'intro-box__arrow--up': introExpanded }"></view>
					</view>
				</view>
			</view>

			<!-- 选择日期 -->
			<view class="section">
				<text class="section__title">选择日期</text>
				<scroll-view class="date-picker" scroll-x show-scrollbar="false">
					<view class="date-picker__track">
						<view
							v-for="date in dateList"
							:key="date.value"
							class="date-item"
							:class="{
								'date-item--selected': selectedDate === date.value,
								'date-item--disabled': !date.available,
								'date-item--today': date.isToday
							}"
							@click="selectDate(date)"
						>
							<text class="date-item__month">{{ date.month }}月</text>
							<text class="date-item__day">{{ date.day }}</text>
							<text class="date-item__week">{{ date.weekday }}</text>
							<view class="date-item__indicator">
								<view v-if="date.available" class="date-item__dot date-item__dot--available"></view>
								<view v-else-if="date.isRest" class="date-item__rest">休</view>
								<view v-else class="date-item__dot"></view>
							</view>
						</view>
					</view>
				</scroll-view>
			</view>

			<!-- 选择时段 -->
			<view class="section">
				<text class="section__title">选择时段</text>

				<!-- 加载中 -->
				<view v-if="loadingSchedule" class="timeslot-skeleton">
					<view v-for="i in 2" :key="i" class="timeslot-skeleton__item"></view>
				</view>

				<!-- 时段列表 -->
				<view v-else-if="currentPeriods.length" class="timeslot-list">
					<view
						v-for="period in currentPeriods"
						:key="period.id"
						class="timeslot-card"
						:class="{
							'timeslot-card--selected': selectedPeriod === period.id,
							'timeslot-card--disabled': period.status === 'full',
							'timeslot-card--passed': period.status === 'passed',
							'timeslot-card--warning': period.status === 'few',
							'timeslot-card--booked': period.status === 'booked'
						}"
						@click="selectPeriod(period)"
					>
						<view class="timeslot-card__icon">
							<view v-if="period.type === 'morning'" class="sun-icon"></view>
							<view v-else-if="period.type === 'afternoon'" class="moon-icon"></view>
							<view v-else class="night-icon"></view>
						</view>
						<view class="timeslot-card__content">
							<text class="timeslot-card__label">{{ period.label }}</text>
							<text class="timeslot-card__time">{{ period.startTime }}-{{ period.endTime }}</text>
						</view>
						<view class="timeslot-card__status">
							<text class="timeslot-card__slots" :class="getSlotClass(period)">
								{{ getSlotText(period) }}
							</text>
							<text v-if="period.price > 0" class="timeslot-card__price">¥{{ (period.price / 100).toFixed(0) }}</text>
						</view>
						<!-- 已预约标记 - 仅在 agendaId 存在时显示 -->
						<view
							class="timeslot-card__booked-tag"
							v-if="period.agendaId"
							@click.stop="cancelBooking(period)"
						>
							<text>取消预约</text>
						</view>
						<view class="timeslot-card__check" v-if="selectedPeriod === period.id">
							<view class="check-icon"></view>
						</view>
					</view>
				</view>

				<!-- 无号源 -->
				<view v-else class="no-schedule">
					<view class="no-schedule__icon"></view>
					<text class="no-schedule__text">该日期暂无排班</text>
				</view>
			</view>

			<!-- 底部占位 -->
			<view class="bottom-placeholder"></view>
		</scroll-view>

		<!-- 底部操作栏 -->
		<view class="bottom-bar">
			<view class="bottom-bar__info">
				<text class="bottom-bar__label">挂号费</text>
				<text class="bottom-bar__price">{{ selectedPriceText === '免费' ? '免费' : '¥' + selectedPriceText }}</text>
			</view>
			<view
				class="bottom-bar__btn"
				:class="{
					'bottom-bar__btn--disabled': !canSubmit,
					'bottom-bar__btn--loading': submitting
				}"
				@click="submitAppointment"
			>
				<view v-if="submitting" class="loading-spinner"></view>
				{{ submitting ? '预约中...' : '确认预约' }}
			</view>
		</view>

		<!-- 预约成功弹窗 -->
		<view v-if="showSuccessModal" class="success-modal" @click="closeSuccessModal">
			<view class="success-modal__content" @click.stop>
				<view class="success-modal__icon">
					<view class="success-check"></view>
				</view>
				<text class="success-modal__title">预约成功</text>
				<text class="success-modal__desc">您的挂号序号为</text>
				<text class="success-modal__number">{{ appointmentResult?.position || appointmentResult?.queueNumber || 1 }}</text>
				<text class="success-modal__tips">请于就诊当日提前30分钟到达医院取号</text>
				<view class="success-modal__btn" @click="goToMyAppointments">
					查看我的预约
				</view>
			</view>
		</view>

		<!-- 取消确认弹窗 -->
		<view v-if="showCancelModal" class="cancel-modal" @click="closeCancelModal">
			<view class="cancel-modal__content" @click.stop>
				<view class="cancel-modal__icon">
					<text class="cancel-modal__question">?</text>
				</view>
				<text class="cancel-modal__title">确认取消预约？</text>
				<view class="cancel-modal__info">
					<text class="cancel-modal__info-label">您将取消以下预约：</text>
					<text class="cancel-modal__info-detail">
						{{ cancelingAppointment?.displayDate }} {{ cancelingAppointment?.displayPeriod }} {{ cancelingAppointment?.displayTime }}
					</text>
				</view>
				<text class="cancel-modal__tips">取消后该时段将释放给其他患者</text>
				<view class="cancel-modal__actions">
					<view class="cancel-modal__btn cancel-modal__btn--secondary" @click="closeCancelModal">
						再想想
					</view>
					<view
						class="cancel-modal__btn cancel-modal__btn--primary"
						:class="{ 'cancel-modal__btn--loading': canceling }"
						@click="confirmCancel"
					>
						{{ canceling ? '取消中...' : '确认取消' }}
					</view>
				</view>
			</view>
		</view>

		<!-- 取消成功弹窗 -->
		<view v-if="showCancelSuccessModal" class="cancel-success-modal" @click="closeCancelSuccessModal">
			<view class="cancel-success-modal__content" @click.stop>
				<view class="cancel-success-modal__icon">
					<view class="cancel-success-check"></view>
				</view>
				<text class="cancel-success-modal__title">已取消预约</text>
				<text class="cancel-success-modal__desc">您的预约已成功取消</text>
				<text class="cancel-success-modal__sub">该时段已释放</text>
				<text class="cancel-success-modal__tips">如需重新预约，可选择其他时段</text>
				<view class="cancel-success-modal__btn" @click="closeCancelSuccessModal">
					我知道了
				</view>
			</view>
		</view>

		<!-- 顶部通知栏 -->
		<TopNotificationBar />
	</view>
</template>

<script>
import { isDarkMode } from '@/store/theme.js'
import { getDoctorDetail, getDoctorSchedule, createAppointment, getMyAppointments, cancelAppointment } from '@/utils/api/appointment.js'
import TopNotificationBar from '@/components/TopNotificationBar.vue'

export default {
	components: {
		TopNotificationBar
	},
	data() {
		return {
			statusBarHeight: 44,
			doctorId: '',
			hospitalId: '',
			hospitalName: '',
			departmentName: '',
			doctor: null,
			introExpanded: false,
			dateList: [],
			selectedDate: '',
			scheduleData: {},
			loadingSchedule: false,
			selectedPeriod: '',
			showSuccessModal: false,
			appointmentResult: null,
			submitting: false,
			userAppointments: [], // 用户已预约的记录
			showCancelModal: false,        // 确认取消弹窗
			showCancelSuccessModal: false, // 取消成功弹窗
			cancelingAppointment: null,    // 正在取消的预约
			canceling: false               // 取消中状态
		}
	},
	computed: {
		isDark() {
			return isDarkMode()
		},
		currentPeriods() {
			if (!this.selectedDate) {
				return []
			}
			// 直接返回 API 数据，状态已在 adaptSchedule 中根据 canReserve/agendaId 处理
			return this.scheduleData[this.selectedDate] || []
		},
		selectedPeriodData() {
			return this.currentPeriods.find(p => p.id === this.selectedPeriod)
		},
		selectedPriceText() {
			if (this.selectedPeriodData && this.selectedPeriodData.price > 0) {
				return (this.selectedPeriodData.price / 100).toFixed(0)
			}
			if (this.doctor?.registrationFee > 0) {
				return (this.doctor.registrationFee / 100).toFixed(0)
			}
			return '免费'
		},
		canSubmit() {
			const period = this.selectedPeriodData
			// 使用 canReserve 字段判断是否可预约
			return this.selectedDate && this.selectedPeriod && period?.canReserve && !this.submitting
		}
	},
	onLoad(options) {
		this.doctorId = options.doctorId || ''
		this.hospitalId = options.hospitalId || ''
		this.hospitalName = decodeURIComponent(options.hospitalName || '')
		this.departmentName = decodeURIComponent(options.departmentName || '')
		this.getStatusBarHeight()
		this.initDateList()
		this.loadData()
	},
	onShow() {
		// 每次页面显示时刷新用户预约状态
		this.refreshUserAppointments()
	},
	methods: {
		getStatusBarHeight() {
			const sysInfo = uni.getSystemInfoSync()
			this.statusBarHeight = sysInfo.statusBarHeight || 44
		},

		// 仅刷新用户预约列表（用于onShow）
		async refreshUserAppointments() {
			try {
				const appointRes = await getMyAppointments()
				if (appointRes.code === 200) {
					this.userAppointments = appointRes.data.list || []
				}
			} catch (e) {
				console.error('刷新预约状态失败:', e)
			}
		},

		initDateList() {
			const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
			const today = new Date()
			today.setHours(0, 0, 0, 0)
			const list = []

			for (let i = 0; i < 14; i++) {
				const date = new Date(today.getTime() + i * 86400000)
				const year = date.getFullYear()
				const month = date.getMonth() + 1
				const day = date.getDate()
				const weekday = i === 0 ? '今天' : (i === 1 ? '明天' : weekdays[date.getDay()])
				const value = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

				list.push({
					value,
					year,
					month,
					day,
					weekday,
					isToday: i === 0,
					available: false, // 默认不可约，等排班数据更新
					isRest: false
				})
			}

			this.dateList = list
		},

		async loadData() {
			try {
				// 获取用户已有预约
				const appointRes = await getMyAppointments()
				if (appointRes.code === 200) {
					this.userAppointments = appointRes.data.list || []
				}

				// 加载医生详情（传递hospitalId以便获取完整信息）
				const res = await getDoctorDetail(this.doctorId, this.hospitalId)
				if (res.code === 200 && res.data) {
					this.doctor = res.data

					// 根据医生可约日期更新日期列表
					if (this.doctor.availableDates && this.doctor.availableDates.length > 0) {
						this.dateList = this.dateList.map(d => ({
							...d,
							available: this.doctor.availableDates.includes(d.value)
						}))

						// 自动选择第一个可约日期
						const firstAvailable = this.dateList.find(d => d.available)
						if (firstAvailable) {
							this.selectDate(firstAvailable)
						}
					} else {
						// 如果没有排班数据，显示提示
						uni.showToast({ title: '暂无排班信息', icon: 'none' })
					}
				}
			} catch (e) {
				console.error('加载医生详情失败:', e)
				uni.showToast({ title: '加载失败，请重试', icon: 'none' })
			}
		},

		async selectDate(date) {
			if (!date.available) {
				uni.showToast({ title: '该日期暂无号源', icon: 'none' })
				return
			}

			this.selectedDate = date.value
			this.selectedPeriod = ''

			// 加载该日期的排班
			await this.loadSchedule(date.value)
		},

		async loadSchedule(dateStr) {
			// 如果已有缓存数据，直接使用
			if (this.scheduleData[dateStr]) {
				// 自动选中第一个可约时段
				const firstAvailable = this.scheduleData[dateStr].find(p => p.status !== 'full')
				if (firstAvailable) {
					this.selectedPeriod = firstAvailable.id
				}
				return
			}

			this.loadingSchedule = true
			try {
				const res = await getDoctorSchedule(this.doctorId, dateStr, dateStr)
				if (res.code === 200 && res.data?.schedule) {
					this.scheduleData = { ...this.scheduleData, ...res.data.schedule }

					// 自动选中第一个可约时段
					const periods = this.scheduleData[dateStr] || []
					const firstAvailable = periods.find(p => p.status !== 'full')
					if (firstAvailable) {
						this.selectedPeriod = firstAvailable.id
					}
				}
			} catch (e) {
				console.error('加载排班失败:', e)
			} finally {
				this.loadingSchedule = false
			}
		},

		selectPeriod(period) {
			// 已过时段阻止选择
			if (period.status === 'passed') {
				uni.showToast({ title: '该时段已过', icon: 'none' })
				return
			}
			// 不可预约的时段阻止选择
			if (!period.canReserve) {
				if (period.status === 'booked') {
					// 已预约时段不提示，点击无效
					return
				}
				uni.showToast({ title: '该时段已约满', icon: 'none' })
				return
			}
			this.selectedPeriod = period.id
		},

		getSlotClass(period) {
			if (period.status === 'passed' || period.status === 'full' || period.status === 'booked') return 'timeslot-card__slots--full'
			if (period.status === 'few') return 'timeslot-card__slots--few'
			return 'timeslot-card__slots--available'
		},

		getSlotText(period) {
			if (period.status === 'passed') return '已过'
			if (period.status === 'booked') return '预约成功'
			if (period.status === 'full') return '已约满'
			return `剩余 ${period.remainingSlots} 号`
		},

		// 根据开始时间获取结束时间（默认+1小时）
		getEndTime(startTime) {
			const [hours, minutes] = startTime.split(':')
			const endHour = (parseInt(hours) + 1).toString().padStart(2, '0')
			return `${endHour}:${minutes}`
		},

		// 根据时间获取时段标签
		getTimeLabel(time) {
			const hour = parseInt(time.split(':')[0])
			if (hour < 12) return '上午'
			if (hour < 18) return '下午'
			return '晚上'
		},

		// 根据时间获取时段类型
		getTimeType(time) {
			const hour = parseInt(time.split(':')[0])
			if (hour < 12) return 'morning'
			if (hour < 18) return 'afternoon'
			return 'night'
		},

		// 格式化显示日期
		formatDisplayDate(dateStr) {
			const date = new Date(dateStr)
			const month = date.getMonth() + 1
			const day = date.getDate()
			const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
			return `${month}月${day}日 ${weekdays[date.getDay()]}`
		},

		// 点击"取消预约"按钮 - 显示确认弹窗（改用 period.agendaId）
		cancelBooking(period) {
			if (!period.agendaId) {
				uni.showToast({ title: '未找到预约记录', icon: 'none' })
				return
			}
			this.cancelingAppointment = {
				agendaId: period.agendaId,
				displayDate: this.formatDisplayDate(this.selectedDate),
				displayTime: `${period.startTime}-${period.endTime}`,
				displayPeriod: period.label
			}
			this.showCancelModal = true
		},

		// 关闭取消确认弹窗
		closeCancelModal() {
			this.showCancelModal = false
			this.cancelingAppointment = null
		},

		// 确认取消预约（使用 agendaId）
		async confirmCancel() {
			if (this.canceling || !this.cancelingAppointment) return

			this.canceling = true
			try {
				// 使用 agendaId 取消预约
				const result = await cancelAppointment(this.cancelingAppointment.agendaId)
				if (result.code === 200) {
					this.showCancelModal = false
					this.showCancelSuccessModal = true
					// 清除缓存并重新加载排班数据，以获取最新状态
					delete this.scheduleData[this.selectedDate]
					await this.loadSchedule(this.selectedDate)
				} else {
					uni.showToast({ title: result.msg || '取消失败', icon: 'none' })
				}
			} catch (e) {
				console.error('取消预约失败:', e)
				uni.showToast({ title: '取消失败，请重试', icon: 'none' })
			} finally {
				this.canceling = false
			}
		},

		// 关闭取消成功弹窗
		closeCancelSuccessModal() {
			this.showCancelSuccessModal = false
			this.cancelingAppointment = null
		},

		async submitAppointment() {
			if (!this.canSubmit) return

			this.submitting = true
			try {
				// 组装ISO 8601格式的预约时间
				// selectedDate: "2025-12-11"
				// selectedPeriodData.startTime: "09:00"
				const startTime = this.selectedPeriodData?.startTime || '09:00'
				const appointmentTime = `${this.selectedDate}T${startTime}:00`

				const res = await createAppointment({
					doctorId: this.doctorId,
					date: this.selectedDate,
					startTime: startTime,
					time: appointmentTime
				})

				if (res.code === 200) {
					this.appointmentResult = res.data
					this.showSuccessModal = true

					// 记录当前选中的时段ID，用于定位下一个可约时段
					const currentPeriodId = this.selectedPeriod

					// 清除缓存并重新加载排班数据，以获取最新的 canReserve/agendaId 状态
					delete this.scheduleData[this.selectedDate]
					await this.loadSchedule(this.selectedDate)

					// 预约成功后，自动选中下一个可约时段
					const periods = this.scheduleData[this.selectedDate] || []
					const currentIndex = periods.findIndex(p => p.id === currentPeriodId)
					// 从当前时段之后查找下一个可约时段
					const nextAvailable = periods.slice(currentIndex + 1).find(p => p.canReserve && p.status !== 'passed' && p.status !== 'full')
					if (nextAvailable) {
						this.selectedPeriod = nextAvailable.id
					} else {
						// 如果后面没有可约时段，清空选择
						this.selectedPeriod = ''
					}
				} else {
					uni.showToast({ title: res.msg || '预约失败', icon: 'none' })
				}
			} catch (e) {
				console.error('预约失败:', e)
				uni.showToast({ title: '预约失败，请重试', icon: 'none' })
			} finally {
				this.submitting = false
			}
		},

		closeSuccessModal() {
			this.showSuccessModal = false
		},

		goToMyAppointments() {
			this.showSuccessModal = false

			// 组装预约详情数据（使用API返回的时间数据，而非当前选中的时段）
			const appointmentDetail = {
				reserveId: this.appointmentResult?.id || this.appointmentResult?.reserveId,
				startTime: this.appointmentResult?.startTime,
				endTime: this.appointmentResult?.endTime,
				status: 'PENDING',
				patientName: this.appointmentResult?.patientName,
				queuePosition: this.appointmentResult?.position || this.appointmentResult?.queueNumber,
				doctorId: this.doctorId,
				doctorName: this.doctor?.name,
				doctorTitle: this.doctor?.title,
				department: this.departmentName,
				hospitalId: this.hospitalId,
				hospitalName: this.hospitalName,
				hospitalAddress: this.doctor?.hospitalAddress || ''
			}

			// 存储数据供详情页读取
			uni.setStorageSync('tempAppointmentDetail', JSON.stringify(appointmentDetail))

			// 跳转到预约详情页
			uni.navigateTo({
				url: '/pages/profile/appointment-detail'
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

// 医生信息卡片
.doctor-info {
	margin: $spacing-md $spacing-lg;
	padding: $spacing-lg;
	background: $bg-card;
	border-radius: $radius-lg;
	box-shadow: $shadow-sm;

	&__main {
		display: flex;
		align-items: center;
		margin-bottom: $spacing-lg;
	}

	&__avatar {
		width: 140rpx;
		height: 140rpx;
		background: linear-gradient(135deg, $color-primary-light 0%, $color-primary 100%);
		border-radius: $radius-lg;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		box-shadow: 0 8rpx 24rpx rgba(30, 58, 95, 0.2);
	}

	&__avatar-text {
		font-size: 64rpx;
		color: #fff;
		font-weight: $font-weight-bold;
	}

	&__detail {
		margin-left: $spacing-lg;
		flex: 1;
	}

	&__header {
		display: flex;
		align-items: center;
		margin-bottom: $spacing-xs;
	}

	&__name {
		font-size: $font-size-2xl;
		font-weight: $font-weight-bold;
		color: $text-primary;
		margin-right: $spacing-sm;
	}

	&__title {
		font-size: $font-size-sm;
		color: $color-primary;
		background: rgba(30, 58, 95, 0.08);
		padding: 6rpx 16rpx;
		border-radius: $radius-sm;
	}

	&__dept {
		font-size: $font-size-sm;
		color: $text-secondary;
		display: block;
	}

	&__stats {
		display: flex;
		align-items: center;
		justify-content: space-around;
		padding-top: $spacing-lg;
		border-top: 2rpx solid $border-color-light;
	}

	&__stat {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	&__stat-icon {
		width: 40rpx;
		height: 40rpx;
		margin-bottom: $spacing-xs;

		&--star {
			// 将黑色SVG转为橙色 $color-warning (#F59E0B)
			filter: invert(63%) sepia(63%) saturate(2201%) hue-rotate(360deg) brightness(101%) contrast(96%);
		}

		&--consult {
			// 将黑色SVG转为蓝色 $color-info (#3B82F6)
			filter: invert(42%) sepia(93%) saturate(1352%) hue-rotate(196deg) brightness(100%) contrast(95%);
		}

		&--exp {
			// 将黑色SVG转为绿色 $color-success (#10B981)
			filter: invert(56%) sepia(52%) saturate(552%) hue-rotate(118deg) brightness(92%) contrast(94%);
		}
	}

	&__stat-value {
		font-size: $font-size-lg;
		font-weight: $font-weight-bold;
		color: $text-primary;
		margin-bottom: 4rpx;
	}

	&__stat-label {
		font-size: $font-size-xs;
		color: $text-muted;
	}

	&__divider {
		width: 2rpx;
		height: 60rpx;
		background: $border-color-light;
	}
}

// 区块
.section {
	margin: $spacing-lg $spacing-lg 0;

	&__title {
		font-size: $font-size-lg;
		font-weight: $font-weight-semibold;
		color: $text-primary;
		margin-bottom: $spacing-md;
		display: block;
	}
}

// 擅长标签
.specialty-tags {
	display: flex;
	flex-wrap: wrap;
	gap: $spacing-sm;
}

.specialty-tag {
	font-size: $font-size-sm;
	color: $color-primary;
	background: rgba(30, 58, 95, 0.06);
	padding: $spacing-sm $spacing-md;
	border-radius: $radius-md;
}

// 简介
.intro-box {
	background: $bg-card;
	border-radius: $radius-lg;
	padding: $spacing-lg;

	&__text {
		font-size: $font-size-base;
		color: $text-secondary;
		line-height: $line-height-relaxed;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;

		&--expanded {
			-webkit-line-clamp: unset;
		}
	}

	&__toggle {
		display: flex;
		align-items: center;
		justify-content: center;
		margin-top: $spacing-sm;
		color: $color-primary;
		font-size: $font-size-sm;
	}

	&__arrow {
		width: 12rpx;
		height: 12rpx;
		border-right: 3rpx solid $color-primary;
		border-bottom: 3rpx solid $color-primary;
		transform: rotate(45deg);
		margin-left: 8rpx;
		transition: transform 0.3s ease;

		&--up {
			transform: rotate(-135deg);
		}
	}
}

// 日期选择器
.date-picker {
	white-space: nowrap;

	&__track {
		display: inline-flex;
		gap: $spacing-sm;
		padding: 4rpx;
	}
}

.date-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	width: 100rpx;
	padding: $spacing-md $spacing-sm;
	background: $bg-card;
	border-radius: $radius-lg;
	border: 2rpx solid transparent;
	transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

	&--selected {
		background: $color-primary;
		border-color: $color-primary;
		transform: scale(1.05);
		box-shadow: 0 8rpx 20rpx rgba(30, 58, 95, 0.25);

		.date-item__month,
		.date-item__day,
		.date-item__week {
			color: #fff;
		}
	}

	&--disabled {
		opacity: 0.5;
	}

	&--today:not(.date-item--selected) {
		border-color: $color-primary;
	}

	&__month {
		font-size: $font-size-xs;
		color: $text-muted;
		margin-bottom: 4rpx;
	}

	&__day {
		font-size: $font-size-xl;
		font-weight: $font-weight-bold;
		color: $text-primary;
	}

	&__week {
		font-size: $font-size-xs;
		color: $text-secondary;
		margin-top: 4rpx;
	}

	&__indicator {
		margin-top: $spacing-xs;
		height: 20rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	&__dot {
		width: 12rpx;
		height: 12rpx;
		border-radius: 50%;
		background: $text-muted;

		&--available {
			background: $color-success;
		}
	}

	&__rest {
		font-size: 18rpx;
		color: $text-muted;
	}
}

// 时段选择器
.timeslot-list {
	display: flex;
	flex-direction: column;
	gap: $spacing-md;
}

.timeslot-card {
	display: flex;
	align-items: center;
	padding: $spacing-lg;
	background: $bg-card;
	border-radius: $radius-lg;
	border: 2rpx solid transparent;
	transition: all 0.25s ease;

	&--selected {
		border-color: $color-primary;
		background: rgba(30, 58, 95, 0.03);
	}

	&--disabled {
		opacity: 0.6;

		.timeslot-card__label,
		.timeslot-card__time {
			color: $text-muted;
		}
	}

	&--passed {
		opacity: 0.5;

		.timeslot-card__label,
		.timeslot-card__time,
		.timeslot-card__slots {
			color: $text-muted;
		}
	}

	&--warning {
		.timeslot-card__slots {
			animation: pulse-warning 2s infinite;
		}
	}

	&__icon {
		width: 64rpx;
		height: 64rpx;
		background: $bg-elevated;
		border-radius: $radius-md;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: $spacing-md;
	}

	&__content {
		flex: 1;
	}

	&__label {
		font-size: $font-size-lg;
		font-weight: $font-weight-medium;
		color: $text-primary;
		display: block;
	}

	&__time {
		font-size: $font-size-sm;
		color: $text-secondary;
	}

	&__status {
		text-align: right;
		margin-right: $spacing-md;
	}

	&__slots {
		font-size: $font-size-sm;
		font-weight: $font-weight-medium;
		display: block;
		margin-bottom: 4rpx;

		&--available { color: $color-success; }
		&--few { color: $color-warning; }
		&--full { color: $text-muted; }
	}

	&__price {
		font-size: $font-size-sm;
		color: $text-muted;
	}

	&__check {
		width: 40rpx;
		height: 40rpx;
		background: $color-primary;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	&--booked {
		background: $bg-elevated;
		pointer-events: none;  // 禁止整个卡片点击

		.timeslot-card__icon,
		.timeslot-card__content,
		.timeslot-card__status {
			opacity: 0.6;
		}

		.timeslot-card__label,
		.timeslot-card__time {
			color: $text-muted;
		}
	}

	&__booked-tag {
		position: absolute;
		top: 0;
		right: 0;
		background: $color-accent;
		color: #fff;
		font-size: $font-size-xs;
		padding: 6rpx 16rpx;
		border-radius: 0 $radius-lg 0 $radius-md;
		transition: background 0.2s ease;
		pointer-events: auto;  // 重新启用按钮点击
		z-index: 10;  // 确保在顶层

		&:active {
			background: darken($color-accent, 10%);
		}
	}
}

.timeslot-card {
	position: relative;
}

@keyframes pulse-warning {
	0%, 100% { opacity: 1; }
	50% { opacity: 0.6; }
}

// 时段图标
.sun-icon {
	width: 32rpx;
	height: 32rpx;
	border-radius: 50%;
	background: linear-gradient(135deg, #FFD93D 0%, #FF9800 100%);
	box-shadow: 0 0 16rpx rgba(255, 152, 0, 0.4);
}

.moon-icon {
	width: 28rpx;
	height: 28rpx;
	border-radius: 50%;
	background: linear-gradient(135deg, #90CAF9 0%, #42A5F5 100%);
	position: relative;

	&::after {
		content: '';
		position: absolute;
		top: -4rpx;
		right: -4rpx;
		width: 20rpx;
		height: 20rpx;
		border-radius: 50%;
		background: $bg-elevated;
	}
}

.night-icon {
	width: 28rpx;
	height: 28rpx;
	border-radius: 50%;
	background: linear-gradient(135deg, #5C6BC0 0%, #3949AB 100%);
	position: relative;

	&::before {
		content: '';
		position: absolute;
		top: 4rpx;
		right: 6rpx;
		width: 4rpx;
		height: 4rpx;
		background: #fff;
		border-radius: 50%;
	}
}

.check-icon {
	width: 16rpx;
	height: 10rpx;
	border-left: 3rpx solid #fff;
	border-bottom: 3rpx solid #fff;
	transform: rotate(-45deg);
}

// 骨架屏
.timeslot-skeleton {
	display: flex;
	flex-direction: column;
	gap: $spacing-md;

	&__item {
		height: 120rpx;
		border-radius: $radius-lg;
		background: linear-gradient(90deg, $bg-elevated 25%, $bg-card 50%, $bg-elevated 75%);
		background-size: 200% 100%;
		animation: skeleton-loading 1.5s infinite;
	}
}

@keyframes skeleton-loading {
	0% { background-position: 200% 0; }
	100% { background-position: -200% 0; }
}

// 无排班
.no-schedule {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: $spacing-xl 0;

	&__icon {
		width: 80rpx;
		height: 80rpx;
		border: 4rpx dashed $text-muted;
		border-radius: 50%;
		margin-bottom: $spacing-md;
	}

	&__text {
		font-size: $font-size-base;
		color: $text-muted;
	}
}

.bottom-placeholder {
	height: 160rpx;
}

// 底部操作栏
.bottom-bar {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 100; // 确保在时段卡片之上
	display: flex;
	align-items: center;
	padding: $spacing-md $spacing-lg;
	padding-bottom: calc(#{$spacing-md} + env(safe-area-inset-bottom));
	background: rgba(255, 255, 255, 0.95);
	backdrop-filter: blur(20px);
	border-top: 2rpx solid $border-color-light;

	&__info {
		flex: 1;
	}

	&__label {
		font-size: $font-size-sm;
		color: $text-muted;
		display: block;
	}

	&__price {
		font-size: $font-size-2xl;
		font-weight: $font-weight-bold;
		color: $color-accent;
	}

	&__btn {
		min-width: 240rpx;
		height: 88rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, $color-primary 0%, $color-primary-light 100%);
		color: #fff;
		font-size: $font-size-lg;
		font-weight: $font-weight-semibold;
		border-radius: $radius-lg;
		transition: all 0.25s ease;

		&:active {
			transform: scale(0.98);
		}

		&--disabled {
			background: $text-muted;
			pointer-events: none;
		}

		&--loading {
			pointer-events: none;
			opacity: 0.85;
		}
	}
}

// Loading spinner
.loading-spinner {
	width: 32rpx;
	height: 32rpx;
	border: 4rpx solid rgba(255, 255, 255, 0.3);
	border-top-color: #fff;
	border-radius: 50%;
	margin-right: 12rpx;
	animation: spin 0.8s linear infinite;
}

@keyframes spin {
	to { transform: rotate(360deg); }
}

// 成功弹窗
.success-modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
	animation: fadeIn 0.3s ease;

	&__content {
		width: 600rpx;
		background: $bg-card;
		border-radius: $radius-xl;
		padding: $spacing-xl;
		display: flex;
		flex-direction: column;
		align-items: center;
		animation: bounceIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	&__icon {
		width: 120rpx;
		height: 120rpx;
		background: linear-gradient(135deg, $color-success 0%, lighten($color-success, 10%) 100%);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: $spacing-lg;
		box-shadow: 0 12rpx 32rpx rgba(16, 185, 129, 0.3);
	}

	&__title {
		font-size: $font-size-xl;
		font-weight: $font-weight-bold;
		color: $text-primary;
		margin-bottom: $spacing-sm;
	}

	&__desc {
		font-size: $font-size-base;
		color: $text-secondary;
		margin-bottom: $spacing-xs;
	}

	&__number {
		font-size: 80rpx;
		font-weight: $font-weight-bold;
		color: $color-primary;
		margin-bottom: $spacing-md;
	}

	&__tips {
		font-size: $font-size-sm;
		color: $text-muted;
		text-align: center;
		margin-bottom: $spacing-xl;
	}

	&__btn {
		width: 100%;
		height: 88rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, $color-primary 0%, $color-primary-light 100%);
		color: #fff;
		font-size: $font-size-lg;
		font-weight: $font-weight-semibold;
		border-radius: $radius-lg;
	}
}

.success-check {
	width: 40rpx;
	height: 24rpx;
	border-left: 8rpx solid #fff;
	border-bottom: 8rpx solid #fff;
	transform: rotate(-45deg);
}

@keyframes fadeIn {
	from { opacity: 0; }
	to { opacity: 1; }
}

@keyframes bounceIn {
	0% { transform: scale(0.5); opacity: 0; }
	100% { transform: scale(1); opacity: 1; }
}

@keyframes shake {
	0%, 100% { transform: rotate(0deg); }
	25% { transform: rotate(-8deg); }
	75% { transform: rotate(8deg); }
}

@keyframes drawCheck {
	0% { stroke-dashoffset: 50; }
	100% { stroke-dashoffset: 0; }
}

// 取消确认弹窗
.cancel-modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
	animation: fadeIn 0.3s ease;

	&__content {
		width: 600rpx;
		background: $bg-card;
		border-radius: $radius-xl;
		padding: $spacing-xl;
		display: flex;
		flex-direction: column;
		align-items: center;
		animation: bounceIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	&__icon {
		width: 120rpx;
		height: 120rpx;
		background: linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: $spacing-lg;
		box-shadow: 0 12rpx 32rpx rgba(245, 158, 11, 0.3);
		animation: shake 0.5s ease-in-out 0.3s;
	}

	&__question {
		font-size: 64rpx;
		font-weight: $font-weight-bold;
		color: #fff;
		line-height: 1;
	}

	&__title {
		font-size: $font-size-xl;
		font-weight: $font-weight-bold;
		color: $text-primary;
		margin-bottom: $spacing-md;
	}

	&__info {
		text-align: center;
		margin-bottom: $spacing-md;
	}

	&__info-label {
		font-size: $font-size-base;
		color: $text-secondary;
		display: block;
		margin-bottom: $spacing-xs;
	}

	&__info-detail {
		font-size: $font-size-base;
		font-weight: $font-weight-medium;
		color: $text-primary;
		display: block;
	}

	&__tips {
		font-size: $font-size-sm;
		color: $text-muted;
		text-align: center;
		margin-bottom: $spacing-xl;
	}

	&__actions {
		display: flex;
		gap: $spacing-md;
		width: 100%;
	}

	&__btn {
		flex: 1;
		height: 88rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: $font-size-lg;
		font-weight: $font-weight-semibold;
		border-radius: $radius-lg;
		transition: all 0.25s ease;

		&:active {
			transform: scale(0.98);
		}

		&--secondary {
			background: transparent;
			border: 2rpx solid $border-color;
			color: $text-secondary;
		}

		&--primary {
			background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
			color: #fff;
		}

		&--loading {
			opacity: 0.7;
			pointer-events: none;
		}
	}
}

// 取消成功弹窗
.cancel-success-modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
	animation: fadeIn 0.3s ease;

	&__content {
		width: 600rpx;
		background: $bg-card;
		border-radius: $radius-xl;
		padding: $spacing-xl;
		display: flex;
		flex-direction: column;
		align-items: center;
		animation: bounceIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	&__icon {
		width: 120rpx;
		height: 120rpx;
		background: linear-gradient(135deg, #06B6D4 0%, #0891B2 100%);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: $spacing-lg;
		box-shadow: 0 12rpx 32rpx rgba(6, 182, 212, 0.3);
	}

	&__title {
		font-size: $font-size-xl;
		font-weight: $font-weight-bold;
		color: $text-primary;
		margin-bottom: $spacing-sm;
	}

	&__desc {
		font-size: $font-size-base;
		color: $text-secondary;
		margin-bottom: $spacing-xs;
	}

	&__sub {
		font-size: $font-size-base;
		color: $text-secondary;
		margin-bottom: $spacing-md;
	}

	&__tips {
		font-size: $font-size-sm;
		color: $text-muted;
		text-align: center;
		margin-bottom: $spacing-xl;
	}

	&__btn {
		width: 100%;
		height: 88rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, $color-primary 0%, $color-primary-light 100%);
		color: #fff;
		font-size: $font-size-lg;
		font-weight: $font-weight-semibold;
		border-radius: $radius-lg;
		transition: all 0.25s ease;

		&:active {
			transform: scale(0.98);
		}
	}
}

.cancel-success-check {
	width: 40rpx;
	height: 24rpx;
	border-left: 8rpx solid #fff;
	border-bottom: 8rpx solid #fff;
	transform: rotate(-45deg);
}

// ========== 深色模式 ==========
.page--dark {
	background: $dark-bg-base;

	.navbar {
		&__back-icon { border-color: $dark-text-primary; }
		&__title { color: $dark-text-primary; }
	}

	.doctor-info {
		background: $dark-bg-card;

		&__avatar {
			background: linear-gradient(135deg, lighten($dark-color-primary, 10%) 0%, $dark-color-primary 100%);
		}

		&__name { color: $dark-text-primary; }

		&__title {
			background: rgba(74, 144, 217, 0.15);
			color: $dark-color-primary;
		}

		&__dept { color: $dark-text-secondary; }

		&__stats { border-top-color: $dark-border-color; }
		&__stat-value { color: $dark-text-primary; }
		&__stat-label { color: $dark-text-muted; }
		&__divider { background: $dark-border-color; }
	}

	.section__title { color: $dark-text-primary; }

	.specialty-tag {
		background: rgba(74, 144, 217, 0.1);
		color: $dark-color-primary;
	}

	.intro-box {
		background: $dark-bg-card;

		&__text { color: $dark-text-secondary; }
		&__toggle { color: $dark-color-primary; }
		&__arrow { border-color: $dark-color-primary; }
	}

	.date-item {
		background: $dark-bg-card;

		&--selected {
			background: $dark-color-primary;
			border-color: $dark-color-primary;
		}

		&--today:not(.date-item--selected) {
			border-color: $dark-color-primary;
		}

		&__month { color: $dark-text-muted; }
		&__day { color: $dark-text-primary; }
		&__week { color: $dark-text-secondary; }
		&__dot { background: $dark-text-muted; }
		&__rest { color: $dark-text-muted; }
	}

	.timeslot-card {
		background: $dark-bg-card;

		&--selected {
			border-color: $dark-color-primary;
			background: rgba(74, 144, 217, 0.08);
		}

		&--booked {
			background: $dark-bg-elevated;
			pointer-events: none;

			.timeslot-card__icon,
			.timeslot-card__content,
			.timeslot-card__status {
				opacity: 0.6;
			}

			.timeslot-card__label,
			.timeslot-card__time {
				color: $dark-text-muted;
			}
		}

		&--passed {
			opacity: 0.5;

			.timeslot-card__label,
			.timeslot-card__time,
			.timeslot-card__slots {
				color: $dark-text-muted;
			}
		}

		&__booked-tag {
			pointer-events: auto;
			z-index: 10;
		}

		&__icon { background: $dark-bg-elevated; }
		&__label { color: $dark-text-primary; }
		&__time { color: $dark-text-secondary; }
		&__price { color: $dark-text-muted; }
		&__check { background: $dark-color-primary; }
		&__booked-tag { background: $dark-color-accent; }
	}

	.timeslot-skeleton__item {
		background: linear-gradient(90deg, $dark-bg-elevated 25%, $dark-bg-card 50%, $dark-bg-elevated 75%);
		background-size: 200% 100%;
	}

	.no-schedule {
		&__icon { border-color: $dark-text-muted; }
		&__text { color: $dark-text-muted; }
	}

	.bottom-bar {
		background: rgba(22, 27, 34, 0.95);
		border-top-color: $dark-border-color;

		&__label { color: $dark-text-muted; }
		&__price { color: $dark-color-accent; }

		&__btn {
			background: linear-gradient(135deg, $dark-color-primary 0%, lighten($dark-color-primary, 10%) 100%);
			&--disabled { background: $dark-text-muted; }
		}
	}

	.success-modal__content {
		background: $dark-bg-card;

		.success-modal__title { color: $dark-text-primary; }
		.success-modal__desc { color: $dark-text-secondary; }
		.success-modal__number { color: $dark-color-primary; }
		.success-modal__tips { color: $dark-text-muted; }
		.success-modal__btn {
			background: linear-gradient(135deg, $dark-color-primary 0%, lighten($dark-color-primary, 10%) 100%);
		}
	}

	// 取消确认弹窗 - 深色模式
	.cancel-modal__content {
		background: $dark-bg-card;

		.cancel-modal__title { color: $dark-text-primary; }
		.cancel-modal__info-label { color: $dark-text-secondary; }
		.cancel-modal__info-detail { color: $dark-text-primary; }
		.cancel-modal__tips { color: $dark-text-muted; }
		.cancel-modal__btn--secondary {
			border-color: $dark-border-color;
			color: $dark-text-secondary;
		}
	}

	// 取消成功弹窗 - 深色模式
	.cancel-success-modal__content {
		background: $dark-bg-card;

		.cancel-success-modal__title { color: $dark-text-primary; }
		.cancel-success-modal__desc { color: $dark-text-secondary; }
		.cancel-success-modal__sub { color: $dark-text-secondary; }
		.cancel-success-modal__tips { color: $dark-text-muted; }
		.cancel-success-modal__btn {
			background: linear-gradient(135deg, $dark-color-primary 0%, lighten($dark-color-primary, 10%) 100%);
		}
	}
}
</style>
