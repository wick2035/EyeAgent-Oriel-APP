/**
 * 就诊记录相关API
 */
import { get } from './request.js'
import { getMyAppointments } from './appointment.js'

// ========== 文件下载 ==========

/**
 * 获取文件下载URL
 * @param {String} fileId - 文件ID
 */
export async function getFileDownloadUrl(fileId) {
	return get('/api/file/download-url', { fileId })
}

// ========== 预约记录 ==========

// 辅助函数：根据时间获取时段标签
function getPeriodLabel(time) {
	if (!time) return '上午'
	const hour = parseInt(time.split('T')[1]?.split(':')[0] || '9')
	if (hour < 12) return '上午'
	if (hour < 18) return '下午'
	return '晚上'
}

// 辅助函数：格式化时间范围
function formatTimeRange(start, end) {
	const s = start?.split('T')[1]?.substring(0, 5) || '09:00'
	const e = end?.split('T')[1]?.substring(0, 5) || '10:00'
	return `${s}-${e}`
}

/**
 * 获取预约记录列表
 * @param {Object} params - { status, page, pageSize }
 */
export async function getAppointmentList(params = {}) {
	// 调用真实API
	const res = await getMyAppointments(params)

	if (res.code === 200) {
		// 适配数据格式，保留所有原始字段用于详情页
		let list = (res.data.list || []).map(item => ({
			// 原始字段（详情页需要）
			...item,
			// 兼容字段（列表页显示用）
			id: item.reserveId,
			status: item.status?.toLowerCase() || 'pending',
			hospitalName: item.hospitalName || '未知医院',
			departmentName: item.department || '未知科室',
			doctorName: item.doctorName || '未知医生',
			doctorTitle: item.doctorTitle || '医师',
			appointmentDate: item.startTime?.split('T')[0] || '',
			periodLabel: getPeriodLabel(item.startTime),
			timeRange: formatTimeRange(item.startTime, item.endTime),
			queueNumber: item.queuePosition || 1,
			registrationFee: 0,
			createTime: item.startTime
		}))

		// 按状态筛选（如果有）
		if (params.status) {
			list = list.filter(a => a.status === params.status)
		}

		// 状态优先级：诊断中 > 待诊断 > 完成诊断 > 已过期 > 已取消
		const statusPriority = { in_progress: 1, pending: 2, completed: 3, expired: 4, cancelled: 5, canceled: 5 }

		// 先按状态优先级排序，同状态内按时间倒序
		list.sort((a, b) => {
			const priorityA = statusPriority[a.status] || 2
			const priorityB = statusPriority[b.status] || 2
			if (priorityA !== priorityB) {
				return priorityA - priorityB
			}
			return new Date(b.createTime || 0) - new Date(a.createTime || 0)
		})

		return { code: 200, msg: 'ok', data: { list, total: list.length } }
	}

	return res
}

// ========== 病历报告 ==========

/**
 * 获取病历报告列表
 */
export async function getMedicalRecordList() {
	const res = await get('/api/app/base/medical-record-list')
	console.log('病历报告API响应:', res)
	if (res.code === 200) {
		// 兼容两种数据格式：直接数组 或 { list: [] } 格式
		const rawData = Array.isArray(res.data) ? res.data : (res.data?.list || res.data || [])
		const dataArray = Array.isArray(rawData) ? rawData : []

		const list = dataArray.map(item => ({
			id: item.id,
			title: `${item.department || '眼科'}病历`,
			hospitalName: item.hospitalName || '',
			departmentName: item.department || '',
			doctorName: item.doctorName || '',
			diagnosis: item.diagnosis || '',
			chiefComplaint: item.chiefComplaint || '',
			visitDate: item.visitDate?.split('T')[0] || '',
			fileId: item.fileId || '',
			createTime: item.createTime
		}))
		// 按日期倒序排列
		list.sort((a, b) => new Date(b.visitDate || 0) - new Date(a.visitDate || 0))
		return { code: 200, msg: 'ok', data: { list, total: list.length } }
	}
	return res
}

// ========== 处方记录 ==========

/**
 * 获取处方记录列表
 */
export async function getPrescriptionList() {
	const res = await get('/api/app/base/prescription-list')
	console.log('处方记录API响应:', res)
	if (res.code === 200) {
		// 兼容两种数据格式：直接数组 或 { list: [] } 格式
		const rawData = Array.isArray(res.data) ? res.data : (res.data?.list || res.data || [])
		const dataArray = Array.isArray(rawData) ? rawData : []

		const list = dataArray.map(item => ({
			id: item.prescription?.id,
			title: (item.prescription?.prescriptionType ? item.prescription.prescriptionType + '处方单' : '处方记录'),
			hospitalName: item.prescription?.hospitalName || '',
			doctorName: item.prescription?.prescriberName || '',
			visitDate: item.prescription?.prescriptionDate?.split('T')[0] || '',
			medicines: (item.details || []).map(d => ({ name: d.drugName })),
			fileId: item.prescription?.fileId || '',
			createTime: item.prescription?.createTime
		}))
		// 按日期倒序排列
		list.sort((a, b) => new Date(b.visitDate || 0) - new Date(a.visitDate || 0))
		return { code: 200, msg: 'ok', data: { list, total: list.length } }
	}
	return res
}

// ========== 智能诊断报告 ==========

/**
 * 获取智能诊断报告列表（检查结果）
 */
export async function getDiagnosisList() {
	const res = await get('/api/app/base/check-result-list')
	console.log('诊断报告API响应:', res)
	if (res.code === 200) {
		// 兼容两种数据格式：直接数组 或 { list: [] } 格式
		const rawData = Array.isArray(res.data) ? res.data : (res.data?.list || res.data || [])
		const dataArray = Array.isArray(rawData) ? rawData : []

		const list = dataArray.map(item => {
			// 计算风险等级
			const risk = item.myopiaRisk || 0
			let severity = 'mild'
			if (risk > 60) severity = 'severe'
			else if (risk > 30) severity = 'moderate'

			return {
				id: item.id,
				title: 'AI近视检查诊断报告',
				symptoms: [
					`右眼视力: ${item.vaOd ?? '-'}`,
					`左眼视力: ${item.vaOs ?? '-'}`
				],
				aiDiagnosis: item.aiDiagnosis || '',
				confidence: risk,
				severity,
				visitDate: item.createTime?.split('T')[0] || '',
				fileId: item.reportFileId || '',
				createTime: item.createTime
			}
		})
		// 按日期倒序排列
		list.sort((a, b) => new Date(b.createTime || 0) - new Date(a.createTime || 0))
		return { code: 200, msg: 'ok', data: { list, total: list.length } }
	}
	return res
}

export default {
	getAppointmentList,
	getMedicalRecordList,
	getPrescriptionList,
	getDiagnosisList,
	getFileDownloadUrl
}
