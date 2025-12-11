/**
 * 就诊记录相关API
 */
import { get } from './request.js'
import { getMyAppointments } from './appointment.js'

// ========== Mock数据（API对接前使用） ==========

const MOCK_APPOINTMENTS = [
	{
		id: 'apt-001',
		status: 'completed',
		hospitalName: '深圳眼科医院',
		departmentName: '白内障科',
		doctorName: '张明华',
		doctorTitle: '主任医师',
		appointmentDate: '2024-11-28',
		periodLabel: '上午',
		timeRange: '08:00-12:00',
		queueNumber: 5,
		registrationFee: 50,
		createTime: '2024-11-25 14:30:00'
	},
	{
		id: 'apt-002',
		status: 'completed',
		hospitalName: '深圳眼科医院',
		departmentName: '青光眼科',
		doctorName: '陈晓燕',
		doctorTitle: '主任医师',
		appointmentDate: '2024-11-15',
		periodLabel: '下午',
		timeRange: '14:00-17:30',
		queueNumber: 12,
		registrationFee: 50,
		createTime: '2024-11-12 09:15:00'
	},
	{
		id: 'apt-003',
		status: 'pending',
		hospitalName: '深圳眼科医院',
		departmentName: '眼底病科',
		doctorName: '刘伟强',
		doctorTitle: '副主任医师',
		appointmentDate: '2024-12-10',
		periodLabel: '上午',
		timeRange: '08:30-12:00',
		queueNumber: 8,
		registrationFee: 35,
		createTime: '2024-12-03 16:20:00'
	},
	{
		id: 'apt-004',
		status: 'cancelled',
		hospitalName: '深圳市人民医院',
		departmentName: '眼科',
		doctorName: '王建国',
		doctorTitle: '主治医师',
		appointmentDate: '2024-11-20',
		periodLabel: '下午',
		timeRange: '14:00-17:00',
		queueNumber: 3,
		registrationFee: 25,
		createTime: '2024-11-18 10:00:00',
		cancelReason: '个人原因'
	}
]

const MOCK_RECORDS = [
	{
		id: 'rec-001',
		title: '白内障术前检查报告',
		hospitalName: '深圳眼科医院',
		departmentName: '白内障科',
		doctorName: '张明华',
		diagnosis: '右眼老年性白内障（成熟期）',
		chiefComplaint: '右眼视力下降1年，加重3个月',
		visitDate: '2024-11-28',
		pdfUrl: 'https://example.com/records/rec-001.pdf',
		createTime: '2024-11-28 10:30:00'
	},
	{
		id: 'rec-002',
		title: '眼压检测报告',
		hospitalName: '深圳眼科医院',
		departmentName: '青光眼科',
		doctorName: '陈晓燕',
		diagnosis: '双眼高眼压症',
		chiefComplaint: '双眼胀痛、视物模糊2周',
		visitDate: '2024-11-15',
		pdfUrl: 'https://example.com/records/rec-002.pdf',
		createTime: '2024-11-15 15:20:00'
	},
	{
		id: 'rec-003',
		title: '眼底检查报告',
		hospitalName: '深圳眼科医院',
		departmentName: '眼底病科',
		doctorName: '刘伟强',
		diagnosis: '双眼糖尿病视网膜病变（非增殖期）',
		chiefComplaint: '视力下降，眼前有黑影飘动',
		visitDate: '2024-10-20',
		pdfUrl: 'https://example.com/records/rec-003.pdf',
		createTime: '2024-10-20 09:45:00'
	}
]

const MOCK_PRESCRIPTIONS = [
	{
		id: 'pres-001',
		title: '术后用药处方',
		hospitalName: '深圳眼科医院',
		departmentName: '白内障科',
		doctorName: '张明华',
		visitDate: '2024-11-28',
		medicines: [
			{ name: '左氧氟沙星滴眼液', specification: '5ml:15mg', dosage: '1滴', frequency: '每日4次', duration: '2周' },
			{ name: '妥布霉素地塞米松滴眼液', specification: '5ml', dosage: '1滴', frequency: '每日4次', duration: '2周' },
			{ name: '玻璃酸钠滴眼液', specification: '5ml', dosage: '1滴', frequency: '每日4次', duration: '1个月' }
		],
		pdfUrl: 'https://example.com/prescriptions/pres-001.pdf',
		createTime: '2024-11-28 11:00:00'
	},
	{
		id: 'pres-002',
		title: '降眼压药物处方',
		hospitalName: '深圳眼科医院',
		departmentName: '青光眼科',
		doctorName: '陈晓燕',
		visitDate: '2024-11-15',
		medicines: [
			{ name: '盐酸卡替洛尔滴眼液', specification: '5ml:10mg', dosage: '1滴', frequency: '每日2次', duration: '1个月' },
			{ name: '曲伏前列素滴眼液', specification: '2.5ml', dosage: '1滴', frequency: '每晚1次', duration: '1个月' }
		],
		pdfUrl: 'https://example.com/prescriptions/pres-002.pdf',
		createTime: '2024-11-15 16:00:00'
	},
	{
		id: 'pres-003',
		title: '眼底病变用药处方',
		hospitalName: '深圳眼科医院',
		departmentName: '眼底病科',
		doctorName: '刘伟强',
		visitDate: '2024-10-20',
		medicines: [
			{ name: '羟苯磺酸钙胶囊', specification: '0.5g*24粒', dosage: '0.5g', frequency: '每日3次', duration: '3个月' },
			{ name: '复方血栓通胶囊', specification: '0.5g*30粒', dosage: '1.5g', frequency: '每日3次', duration: '3个月' }
		],
		pdfUrl: 'https://example.com/prescriptions/pres-003.pdf',
		createTime: '2024-10-20 10:30:00'
	}
]

const MOCK_DIAGNOSES = [
	{
		id: 'diag-001',
		title: 'AI眼底筛查报告',
		symptoms: ['视力下降', '眼前黑影', '视物变形'],
		aiDiagnosis: '根据眼底照片分析，双眼存在糖尿病视网膜病变特征，主要表现为：微血管瘤、硬性渗出、棉絮斑。建议进一步行眼底荧光造影检查。',
		suggestions: [
			'严格控制血糖，空腹血糖控制在7.0mmol/L以下',
			'定期复查眼底，建议每3个月复查一次',
			'如出现视力急剧下降，应立即就诊',
			'控制血压、血脂，保持健康生活方式'
		],
		confidence: 92,
		severity: 'moderate',
		visitDate: '2024-10-20',
		pdfUrl: 'https://example.com/diagnoses/diag-001.pdf',
		createTime: '2024-10-20 09:50:00'
	},
	{
		id: 'diag-002',
		title: 'AI干眼症评估报告',
		symptoms: ['眼睛干涩', '异物感', '视疲劳', '畏光'],
		aiDiagnosis: '根据症状问卷和泪膜分析，诊断为中度干眼症，主要原因可能为睑板腺功能障碍导致的蒸发过强型干眼。',
		suggestions: [
			'减少电子屏幕使用时间，每30分钟休息5分钟',
			'使用人工泪液，每日4-6次',
			'热敷眼睑，每日2次，每次10分钟',
			'增加环境湿度，避免空调直吹'
		],
		confidence: 88,
		severity: 'mild',
		visitDate: '2024-11-05',
		pdfUrl: 'https://example.com/diagnoses/diag-002.pdf',
		createTime: '2024-11-05 14:20:00'
	},
	{
		id: 'diag-003',
		title: 'AI白内障评估报告',
		symptoms: ['视力模糊', '眩光', '色觉改变'],
		aiDiagnosis: '根据裂隙灯检查图像分析，右眼晶状体皮质及核混浊明显，符合老年性白内障（成熟期）表现，左眼晶状体轻度混浊。',
		suggestions: [
			'右眼建议尽早行白内障超声乳化+人工晶体植入术',
			'左眼暂可观察，定期复查',
			'术前需完善全身检查，控制血糖血压',
			'术后遵医嘱用药，避免剧烈运动'
		],
		confidence: 95,
		severity: 'severe',
		visitDate: '2024-11-28',
		pdfUrl: 'https://example.com/diagnoses/diag-003.pdf',
		createTime: '2024-11-28 10:35:00'
	}
]

// 是否使用Mock数据
const USE_MOCK = true

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
		// 适配数据格式
		let list = (res.data.list || []).map(item => ({
			id: item.reserveId,
			status: item.status?.toLowerCase() || 'pending',
			hospitalName: item.hospitalName || '未知医院',
			departmentName: item.department || '未知科室',
			doctorName: item.doctorName || '未知医生',
			doctorTitle: item.doctorTitle || '医师',
			appointmentDate: item.startTime?.split('T')[0] || '',
			periodLabel: getPeriodLabel(item.startTime),
			timeRange: formatTimeRange(item.startTime, item.endTime),
			queueNumber: 1,
			registrationFee: 0,
			createTime: item.startTime
		}))

		// 按状态筛选（如果有）
		if (params.status) {
			list = list.filter(a => a.status === params.status)
		}

		// 按时间倒序
		list.sort((a, b) => new Date(b.createTime || 0) - new Date(a.createTime || 0))

		return { code: 200, msg: 'ok', data: { list, total: list.length } }
	}

	return res
}

// ========== 病历报告 ==========

/**
 * 获取病历报告列表
 * @param {Object} params - { page, pageSize }
 */
export async function getMedicalRecordList(params = {}) {
	if (USE_MOCK) {
		await new Promise(resolve => setTimeout(resolve, 300))
		const list = [...MOCK_RECORDS].sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate))
		return { code: 200, msg: 'ok', data: { list, total: list.length } }
	}
	return get('/api/medical/records', params)
}

// ========== 处方记录 ==========

/**
 * 获取处方记录列表
 * @param {Object} params - { page, pageSize }
 */
export async function getPrescriptionList(params = {}) {
	if (USE_MOCK) {
		await new Promise(resolve => setTimeout(resolve, 300))
		const list = [...MOCK_PRESCRIPTIONS].sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate))
		return { code: 200, msg: 'ok', data: { list, total: list.length } }
	}
	return get('/api/medical/prescriptions', params)
}

// ========== 智能诊断报告 ==========

/**
 * 获取智能诊断报告列表
 * @param {Object} params - { page, pageSize }
 */
export async function getDiagnosisList(params = {}) {
	if (USE_MOCK) {
		await new Promise(resolve => setTimeout(resolve, 300))
		const list = [...MOCK_DIAGNOSES].sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate))
		return { code: 200, msg: 'ok', data: { list, total: list.length } }
	}
	return get('/api/medical/diagnoses', params)
}

export default {
	getAppointmentList,
	getMedicalRecordList,
	getPrescriptionList,
	getDiagnosisList
}
