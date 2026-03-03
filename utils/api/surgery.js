/**
 * 手术信息API模块
 * 对接后端 /api/app/extra 手术信息接口
 */
import { get } from './request.js'

// ========== 阶段名称枚举 → 中文映射 ==========

const PHASE_NAME_MAP = {
	PRE_OP_PREPARATION: '术前准备',
	PATIENT_ENTERING: '患者进入手术室',
	ANESTHESIA_START: '麻醉开始',
	SURGERY_START: '手术开始',
	SURGERY_END: '手术结束',
	ANESTHESIA_END: '麻醉结束',
	PATIENT_LEAVING: '患者离开手术室',
	POST_OP_RECOVERY: '术后恢复(PACU)',
	COMPLETED: '完成'
}

// ========== 状态 → 估算进度 ==========

const STATUS_PROGRESS_MAP = {
	PRE_OP: 10,
	IN_OPERATION: 50,
	POST_OP: 80,
	COMPLETED: 100,
	CANCELLED: 0
}

// ========== 默认通用文案 ==========

const DEFAULT_PRE_OP_INSTRUCTIONS = [
	'术前8小时禁食禁水',
	'术前不要化妆，不要佩戴隐形眼镜',
	'穿宽松舒适的衣服，方便穿脱',
	'请安排家属陪同，术后当天不能独自离院'
]

const DEFAULT_POST_OP_CAUTIONS = [
	'术后当天避免用力揉眼',
	'术后1周内洗澡时避免水流入眼睛',
	'按时使用眼药水，不要擅自停药',
	'如有异常（剧烈疼痛、视力骤降）请及时就医'
]

// ========== 数据转换函数 ==========

/**
 * 将列表接口返回的手术数据转换为 UI 模型
 * @param {Object} item - API 返回的手术记录
 * @returns {Object} UI 模型
 */
function transformSurgeryFromApi(item) {
	// 合并手术室和台次显示
	let operatingRoomDisplay = item.operatingRoom || ''
	if (item.tableNumber) {
		operatingRoomDisplay = operatingRoomDisplay
			? `${operatingRoomDisplay} ${item.tableNumber}台`
			: `${item.tableNumber}台`
	}

	return {
		id: item.id || '',
		agendaId: item.agendaId || '',
		surgeryName: item.surgeryName || '',
		hospitalId: item.hospitalId || '',
		hospitalName: item.hospitalName || '',
		doctorId: item.doctorId || '',
		doctorName: item.doctorName || '',
		doctorTitle: item.doctorTitle || '',
		scheduledDate: item.scheduledDate || '',
		operatingRoom: operatingRoomDisplay || '--',
		status: item.status || 'PRE_OP',
		overallProgress: STATUS_PROGRESS_MAP[item.status] || 0,
		phases: [],
		preOpInstructions: DEFAULT_PRE_OP_INSTRUCTIONS,
		postOpCautions: DEFAULT_POST_OP_CAUTIONS
	}
}

/**
 * 将进度接口返回的阶段数据转换为 UI 模型
 * @param {Object} phase - API 返回的阶段记录
 * @returns {Object} UI 阶段模型
 */
function transformPhaseFromApi(phase) {
	return {
		id: phase.id || '',
		surgeryInfoId: phase.surgeryInfoId || '',
		name: PHASE_NAME_MAP[phase.name] || phase.name || '',
		nameEnum: phase.name || '',
		status: phase.status || 'PENDING',
		startTime: phase.startTime || null,
		endTime: phase.endTime || null,
		order: phase.order || 0
	}
}

// ========== API 函数 ==========

/**
 * 获取手术列表
 * @returns {Object} { code, msg, data: [] }
 */
export async function getSurgeryList() {
	try {
		const res = await get('/api/app/extra/get-surgery-info')

		if (res.code === 200 && res.data) {
			const list = (Array.isArray(res.data) ? res.data : []).map(transformSurgeryFromApi)
			// 按预定手术日期升序排列
			list.sort((a, b) => (a.scheduledDate || '').localeCompare(b.scheduledDate || ''))
			return { code: 200, msg: 'ok', data: list }
		}

		return { code: res.code || 500, msg: res.msg || '获取手术信息失败', data: [] }
	} catch (error) {
		console.error('获取手术列表失败:', error)
		return { code: 500, msg: error.message || '获取手术信息失败', data: [] }
	}
}

/**
 * 获取手术详细进度
 * @param {string} surgeryInfoId - 手术信息 ID
 * @returns {Object} { code, msg, data: [] }
 */
export async function getSurgeryProcess(surgeryInfoId) {
	try {
		const res = await get('/api/app/extra/get-surgery-process', { surgeryInfoId })

		if (res.code === 200 && res.data) {
			const phases = (Array.isArray(res.data) ? res.data : [])
				.map(transformPhaseFromApi)
				.sort((a, b) => a.order - b.order)
			return { code: 200, msg: 'ok', data: phases }
		}

		return { code: res.code || 500, msg: res.msg || '获取手术进度失败', data: [] }
	} catch (error) {
		console.error('获取手术进度失败:', error)
		return { code: 500, msg: error.message || '获取手术进度失败', data: [] }
	}
}

export { PHASE_NAME_MAP, STATUS_PROGRESS_MAP }

export default {
	getSurgeryList,
	getSurgeryProcess,
	PHASE_NAME_MAP,
	STATUS_PROGRESS_MAP
}
