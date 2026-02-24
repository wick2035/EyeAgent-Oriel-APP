/**
 * 手术进度状态管理
 * 对接真实 API（/api/app/extra）
 */
import { reactive } from 'vue'
import { getSurgeryList, getSurgeryProcess, STATUS_PROGRESS_MAP } from '@/utils/api/surgery.js'

// 手术状态枚举
export const SURGERY_STATUS = {
	PRE_OP: 'PRE_OP',               // 术前准备
	IN_OPERATION: 'IN_OPERATION',   // 手术进行中
	POST_OP: 'POST_OP',             // 术后恢复
	COMPLETED: 'COMPLETED',         // 已完成
	CANCELLED: 'CANCELLED'          // 已取消
}

// 阶段状态枚举
export const PHASE_STATUS = {
	PENDING: 'PENDING',             // 待进行
	IN_PROGRESS: 'IN_PROGRESS',     // 进行中
	COMPLETED: 'COMPLETED'          // 已完成
}

// 手术类型
export const SURGERY_TYPE = {
	CATARACT: '白内障手术',
	LASIK: '近视矫正手术',
	GLAUCOMA: '青光眼手术',
	RETINA: '视网膜手术',
	CORNEA: '角膜移植手术',
	STRABISMUS: '斜视矫正手术',
	OTHER: '其他眼科手术'
}

// 状态颜色映射 - 医疗风格配色
export const STATUS_COLORS = {
	PRE_OP: {
		primary: '#3B82F6',
		bg: 'rgba(59, 130, 246, 0.08)',
		gradient: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'
	},
	IN_OPERATION: {
		primary: '#3FD2C2',
		bg: 'rgba(63, 210, 194, 0.08)',
		gradient: 'linear-gradient(135deg, #3FD2C2 0%, #14B8A6 100%)'
	},
	POST_OP: {
		primary: '#14B8A6',
		bg: 'rgba(20, 184, 166, 0.08)',
		gradient: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)'
	},
	COMPLETED: {
		primary: '#10B981',
		bg: 'rgba(16, 185, 129, 0.08)',
		gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
	},
	CANCELLED: {
		primary: '#6B7280',
		bg: 'rgba(107, 114, 128, 0.08)',
		gradient: 'linear-gradient(135deg, #6B7280 0%, #9CA3AF 100%)'
	}
}

// 手术状态
const surgeryState = reactive({
	surgeries: [],
	currentSurgery: null,
	loading: false,
	initialized: false
})

/**
 * 获取状态
 */
export function getSurgeryState() {
	return surgeryState
}

/**
 * 获取手术列表（调用真实 API）
 */
export async function fetchSurgeryList() {
	if (surgeryState.loading) return

	surgeryState.loading = true
	try {
		const res = await getSurgeryList()
		if (res.code === 200) {
			surgeryState.surgeries = res.data || []
		} else {
			console.error('获取手术列表失败:', res.msg)
			uni.showToast({ title: res.msg || '获取手术信息失败', icon: 'none' })
		}
		surgeryState.initialized = true
	} catch (err) {
		console.error('获取手术列表失败:', err)
		uni.showToast({ title: '获取手术信息失败', icon: 'none' })
	} finally {
		surgeryState.loading = false
	}
}

/**
 * 获取手术详情（列表 + 阶段进度）
 */
export async function fetchSurgeryDetail(id) {
	surgeryState.loading = true
	try {
		// 如果列表未加载，先加载列表
		if (!surgeryState.initialized || surgeryState.surgeries.length === 0) {
			const listRes = await getSurgeryList()
			if (listRes.code === 200) {
				surgeryState.surgeries = listRes.data || []
				surgeryState.initialized = true
			}
		}

		// 从列表中找到对应手术
		let surgery = surgeryState.surgeries.find(s => s.id === id)
		if (!surgery) {
			uni.showToast({ title: '手术信息不存在', icon: 'none' })
			surgeryState.currentSurgery = null
			return null
		}

		// 获取手术阶段进度
		const processRes = await getSurgeryProcess(id)
		if (processRes.code === 200 && processRes.data.length > 0) {
			surgery = {
				...surgery,
				phases: processRes.data,
				overallProgress: calculateOverallProgress({ phases: processRes.data })
			}
			// 同步更新列表中的数据
			const idx = surgeryState.surgeries.findIndex(s => s.id === id)
			if (idx !== -1) {
				surgeryState.surgeries[idx] = surgery
			}
		}

		surgeryState.currentSurgery = { ...surgery }
		return surgery
	} catch (err) {
		console.error('获取手术详情失败:', err)
		uni.showToast({ title: '获取手术详情失败', icon: 'none' })
		return null
	} finally {
		surgeryState.loading = false
	}
}

/**
 * 按状态分组获取手术列表
 */
export function getGroupedSurgeries() {
	const groups = {
		active: { key: 'active', label: '进行中', items: [] },
		upcoming: { key: 'upcoming', label: '即将进行', items: [] },
		completed: { key: 'completed', label: '已完成', items: [] }
	}

	const now = new Date()

	surgeryState.surgeries.forEach(surgery => {
		if (surgery.status === 'COMPLETED') {
			groups.completed.items.push(surgery)
		} else if (surgery.status === 'CANCELLED') {
			// 取消的不显示
		} else if (surgery.status === 'POST_OP' || surgery.status === 'IN_OPERATION') {
			groups.active.items.push(surgery)
		} else {
			// PRE_OP
			const scheduledDate = new Date(surgery.scheduledDate)
			const daysUntil = Math.ceil((scheduledDate - now) / (1000 * 60 * 60 * 24))
			if (daysUntil <= 7) {
				groups.active.items.push(surgery)
			} else {
				groups.upcoming.items.push(surgery)
			}
		}
	})

	// 排序
	groups.active.items.sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate))
	groups.upcoming.items.sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate))
	groups.completed.items.sort((a, b) => new Date(b.scheduledDate) - new Date(a.scheduledDate))

	return Object.values(groups).filter(g => g.items.length > 0)
}

/**
 * 计算总体进度（基于实际阶段数据）
 */
export function calculateOverallProgress(surgery) {
	if (!surgery || !surgery.phases || surgery.phases.length === 0) return 0

	const phases = surgery.phases
	const total = phases.length
	const completed = phases.filter(p => p.status === 'COMPLETED').length
	const inProgress = phases.filter(p => p.status === 'IN_PROGRESS').length

	// 已完成的阶段 + 进行中的算半个
	return Math.round(((completed + inProgress * 0.5) / total) * 100)
}

/**
 * 根据状态估算进度（列表页用）
 */
export function estimateProgressFromStatus(status) {
	return STATUS_PROGRESS_MAP[status] || 0
}

/**
 * 获取状态文本
 */
export function getStatusText(status) {
	const texts = {
		PRE_OP: '术前准备',
		IN_OPERATION: '手术进行中',
		POST_OP: '术后恢复',
		COMPLETED: '已完成',
		CANCELLED: '已取消'
	}
	return texts[status] || status
}

/**
 * 获取阶段状态文本
 */
export function getPhaseStatusText(status) {
	const texts = {
		PENDING: '待进行',
		IN_PROGRESS: '进行中',
		COMPLETED: '已完成'
	}
	return texts[status] || status
}

/**
 * 格式化日期
 */
export function formatDate(dateStr, format = 'full') {
	if (!dateStr) return ''

	const date = new Date(dateStr)
	const year = date.getFullYear()
	const month = date.getMonth() + 1
	const day = date.getDate()
	const hour = date.getHours().toString().padStart(2, '0')
	const minute = date.getMinutes().toString().padStart(2, '0')

	if (format === 'date') {
		return `${month}月${day}日`
	} else if (format === 'time') {
		return `${hour}:${minute}`
	} else if (format === 'datetime') {
		return `${month}月${day}日 ${hour}:${minute}`
	} else {
		return `${year}年${month}月${day}日`
	}
}

/**
 * 获取距离手术的天数
 */
export function getDaysUntilSurgery(scheduledDate) {
	if (!scheduledDate) return null

	const now = new Date()
	const scheduled = new Date(scheduledDate)
	const diff = Math.ceil((scheduled - now) / (1000 * 60 * 60 * 24))

	if (diff < 0) {
		return { days: Math.abs(diff), text: `已过${Math.abs(diff)}天`, isPast: true }
	} else if (diff === 0) {
		return { days: 0, text: '今天', isPast: false }
	} else if (diff === 1) {
		return { days: 1, text: '明天', isPast: false }
	} else {
		return { days: diff, text: `还有${diff}天`, isPast: false }
	}
}

/**
 * 获取下一个关键事件
 */
export function getNextEvent(surgery) {
	if (!surgery) return null

	// 如果有 phases 数据，查找当前进行中的阶段
	if (surgery.phases && surgery.phases.length > 0) {
		const currentPhase = surgery.phases.find(p => p.status === 'IN_PROGRESS')
		if (currentPhase) {
			return {
				type: 'phase',
				name: currentPhase.name
			}
		}
	}

	// 术前准备状态，下一个事件是手术
	if (surgery.status === 'PRE_OP') {
		return {
			type: 'surgery',
			name: '手术',
			date: surgery.scheduledDate
		}
	}

	return null
}

export default {
	surgeryState,
	getSurgeryState,
	fetchSurgeryList,
	fetchSurgeryDetail,
	getGroupedSurgeries,
	calculateOverallProgress,
	estimateProgressFromStatus,
	getStatusText,
	getPhaseStatusText,
	formatDate,
	getDaysUntilSurgery,
	getNextEvent,
	SURGERY_STATUS,
	PHASE_STATUS,
	SURGERY_TYPE,
	STATUS_COLORS
}
