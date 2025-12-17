/**
 * 手术进度状态管理
 * 采用模拟数据，后续可对接真实API
 */
import { reactive } from 'vue'

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

// 模拟手术数据
const mockSurgeries = [
	{
		id: 'surgery_001',
		patientId: 'patient_001',
		surgeryName: '白内障超声乳化术',
		surgeryType: 'CATARACT',
		hospitalName: '北京协和医院',
		hospitalId: 'hospital_001',
		departmentName: '眼科',
		surgeon: {
			id: 'doctor_001',
			name: '张明',
			title: '主任医师',
			avatar: ''
		},
		scheduledDate: '2025-01-20T09:00:00',
		actualStartTime: null,
		actualEndTime: null,
		estimatedRecoveryDate: '2025-02-20',
		operatingRoom: '05号室 3台',
		estimatedDuration: '约30分钟',
		status: 'PRE_OP',
		currentPhase: 1,
		overallProgress: 18,
		phases: [
			{ id: 1, name: '术前准备', status: 'COMPLETED', time: '2025-01-20T08:30:00' },
			{ id: 2, name: '患者进入手术室', status: 'COMPLETED', time: '2025-01-20T08:45:00' },
			{ id: 3, name: '麻醉开始', status: 'IN_PROGRESS', time: '2025-01-20T09:00:00' },
			{ id: 4, name: '手术开始', status: 'PENDING', time: null },
			{ id: 5, name: '手术结束', status: 'PENDING', time: null },
			{ id: 6, name: '麻醉结束', status: 'PENDING', time: null },
			{ id: 7, name: '患者离开手术室', status: 'PENDING', time: null },
			{ id: 8, name: '术后恢复(PACU)', status: 'PENDING', time: null },
			{ id: 9, name: '完成', status: 'PENDING', time: null }
		],
		preOpInstructions: [
			'术前8小时禁食禁水',
			'术前不要化妆，不要佩戴隐形眼镜',
			'穿宽松舒适的衣服，方便穿脱',
			'请安排家属陪同，术后当天不能独自离院'
		],
		postOpCautions: [
			'术后当天避免用力揉眼',
			'术后1周内洗澡时避免水流入眼睛',
			'按时使用眼药水，不要擅自停药',
			'如有异常（剧烈疼痛、视力骤降）请及时就医'
		],
		createdAt: '2025-01-08T14:30:00',
		updatedAt: '2025-01-11T09:00:00'
	},
	{
		id: 'surgery_002',
		patientId: 'patient_001',
		surgeryName: '飞秒激光近视矫正术',
		surgeryType: 'LASIK',
		hospitalName: '北京同仁医院',
		hospitalId: 'hospital_002',
		departmentName: '屈光手术中心',
		surgeon: {
			id: 'doctor_002',
			name: '李华',
			title: '副主任医师',
			avatar: ''
		},
		scheduledDate: '2024-12-15T10:00:00',
		actualStartTime: '2024-12-15T10:15:00',
		actualEndTime: '2024-12-15T10:45:00',
		estimatedRecoveryDate: '2025-01-15',
		operatingRoom: '03号室 2台',
		estimatedDuration: '约30分钟',
		status: 'POST_OP',
		currentPhase: 3,
		overallProgress: 70,
		phases: [
			{ id: 1, name: '术前准备', status: 'COMPLETED', time: '2024-12-15T09:30:00' },
			{ id: 2, name: '患者进入手术室', status: 'COMPLETED', time: '2024-12-15T09:50:00' },
			{ id: 3, name: '麻醉开始', status: 'COMPLETED', time: '2024-12-15T10:00:00' },
			{ id: 4, name: '手术开始', status: 'COMPLETED', time: '2024-12-15T10:15:00' },
			{ id: 5, name: '手术结束', status: 'COMPLETED', time: '2024-12-15T10:45:00' },
			{ id: 6, name: '麻醉结束', status: 'COMPLETED', time: '2024-12-15T10:50:00' },
			{ id: 7, name: '患者离开手术室', status: 'COMPLETED', time: '2024-12-15T11:00:00' },
			{ id: 8, name: '术后恢复(PACU)', status: 'IN_PROGRESS', time: '2024-12-15T11:10:00' },
			{ id: 9, name: '完成', status: 'PENDING', time: null }
		],
		preOpInstructions: [
			'术前3天停止佩戴隐形眼镜',
			'术前24小时不要饮酒',
			'手术当天不要化妆'
		],
		postOpCautions: [
			'术后1周内避免洗头水进入眼睛',
			'术后1月内避免剧烈运动',
			'术后3月内避免游泳',
			'外出佩戴防护眼镜'
		],
		createdAt: '2024-11-20T10:00:00',
		updatedAt: '2024-12-22T10:00:00'
	},
	{
		id: 'surgery_003',
		patientId: 'patient_001',
		surgeryName: '翼状胬肉切除术',
		surgeryType: 'OTHER',
		hospitalName: '北京眼科医院',
		hospitalId: 'hospital_003',
		departmentName: '眼表疾病科',
		surgeon: {
			id: 'doctor_003',
			name: '王芳',
			title: '主任医师',
			avatar: ''
		},
		scheduledDate: '2024-06-10T14:00:00',
		actualStartTime: '2024-06-10T14:10:00',
		actualEndTime: '2024-06-10T15:00:00',
		estimatedRecoveryDate: '2024-07-10',
		operatingRoom: '01号室 5台',
		estimatedDuration: '约50分钟',
		status: 'COMPLETED',
		currentPhase: 4,
		overallProgress: 100,
		phases: [
			{ id: 1, name: '术前准备', status: 'COMPLETED', time: '2024-06-10T13:30:00' },
			{ id: 2, name: '患者进入手术室', status: 'COMPLETED', time: '2024-06-10T13:50:00' },
			{ id: 3, name: '麻醉开始', status: 'COMPLETED', time: '2024-06-10T14:00:00' },
			{ id: 4, name: '手术开始', status: 'COMPLETED', time: '2024-06-10T14:10:00' },
			{ id: 5, name: '手术结束', status: 'COMPLETED', time: '2024-06-10T15:00:00' },
			{ id: 6, name: '麻醉结束', status: 'COMPLETED', time: '2024-06-10T15:05:00' },
			{ id: 7, name: '患者离开手术室', status: 'COMPLETED', time: '2024-06-10T15:15:00' },
			{ id: 8, name: '术后恢复(PACU)', status: 'COMPLETED', time: '2024-06-10T15:30:00' },
			{ id: 9, name: '完成', status: 'COMPLETED', time: '2024-06-10T16:00:00' }
		],
		preOpInstructions: [],
		postOpCautions: [],
		createdAt: '2024-05-20T10:00:00',
		updatedAt: '2024-07-10T10:00:00'
	}
]

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
 * 获取手术列表
 */
export async function fetchSurgeryList() {
	if (surgeryState.loading) return

	surgeryState.loading = true
	try {
		// 模拟API延迟
		await new Promise(resolve => setTimeout(resolve, 300))
		surgeryState.surgeries = [...mockSurgeries]
		surgeryState.initialized = true
	} catch (err) {
		console.error('获取手术列表失败:', err)
	} finally {
		surgeryState.loading = false
	}
}

/**
 * 获取手术详情
 */
export async function fetchSurgeryDetail(id) {
	surgeryState.loading = true
	try {
		await new Promise(resolve => setTimeout(resolve, 200))
		const surgery = mockSurgeries.find(s => s.id === id)
		if (surgery) {
			surgeryState.currentSurgery = { ...surgery }
			return surgery
		}
		return null
	} catch (err) {
		console.error('获取手术详情失败:', err)
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
 * 更新任务状态
 */
export async function updateTaskStatus(surgeryId, phaseId, taskId, completed) {
	try {
		await new Promise(resolve => setTimeout(resolve, 150))

		const surgery = surgeryState.surgeries.find(s => s.id === surgeryId)
		if (!surgery) return { success: false }

		const phase = surgery.phases.find(p => p.id === phaseId)
		if (!phase || !phase.tasks) return { success: false }

		const task = phase.tasks.find(t => t.id === taskId)
		if (!task) return { success: false }

		task.completed = completed
		task.completedAt = completed ? new Date().toISOString() : null

		// 更新阶段进度
		const completedTasks = phase.tasks.filter(t => t.completed).length
		phase.progress = Math.round((completedTasks / phase.tasks.length) * 100)

		// 更新总体进度
		surgery.overallProgress = calculateOverallProgress(surgery)

		// 同步到currentSurgery
		if (surgeryState.currentSurgery?.id === surgeryId) {
			surgeryState.currentSurgery = { ...surgery }
		}

		return { success: true }
	} catch (err) {
		console.error('更新任务状态失败:', err)
		return { success: false, error: err }
	}
}

/**
 * 计算总体进度
 */
export function calculateOverallProgress(surgery) {
	if (!surgery || !surgery.phases) return 0

	const phases = surgery.phases
	let totalWeight = 0
	let completedWeight = 0

	phases.forEach((phase, index) => {
		const weight = 25 // 每阶段25%
		totalWeight += weight

		if (phase.status === 'COMPLETED') {
			completedWeight += weight
		} else if (phase.status === 'IN_PROGRESS') {
			completedWeight += (weight * phase.progress / 100)
		}
	})

	return Math.round((completedWeight / totalWeight) * 100)
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

	const currentPhase = surgery.phases.find(p => p.status === 'IN_PROGRESS')
	if (!currentPhase) return null

	// 如果有未完成的任务
	if (currentPhase.tasks) {
		const nextTask = currentPhase.tasks.find(t => !t.completed)
		if (nextTask) {
			return {
				type: 'task',
				name: nextTask.name,
				date: nextTask.scheduledDate
			}
		}
	}

	// 如果是术前准备阶段，下一个事件是手术
	if (currentPhase.nameEn === 'PRE_OPERATION') {
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
	updateTaskStatus,
	calculateOverallProgress,
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
