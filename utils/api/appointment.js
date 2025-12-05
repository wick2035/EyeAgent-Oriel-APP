/**
 * 预约挂号相关API
 */
import { get, post } from './request.js'

// ========== Mock数据（API对接前使用） ==========

const MOCK_HOSPITALS = [
	{
		id: 'hosp-001',
		name: '深圳眼科医院',
		level: '三甲',
		type: '专科医院',
		address: '深圳市南山区科技园路1号',
		distance: 1200,
		tags: ['医保定点', '眼科专科'],
		rating: 4.9,
		departmentCount: 12,
		isOpen: true,
		openTime: '07:00-17:00'
	},
	{
		id: 'hosp-002',
		name: '深圳市人民医院',
		level: '三甲',
		type: '综合医院',
		address: '深圳市罗湖区东门北路1017号',
		distance: 2500,
		tags: ['医保定点', '综合三甲', '24h急诊'],
		rating: 4.8,
		departmentCount: 38,
		isOpen: true,
		openTime: '07:30-17:30'
	},
	{
		id: 'hosp-003',
		name: '北京大学深圳医院',
		level: '三甲',
		type: '综合医院',
		address: '深圳市福田区莲花路1120号',
		distance: 3800,
		tags: ['医保定点', '教学医院'],
		rating: 4.8,
		departmentCount: 42,
		isOpen: true,
		openTime: '08:00-17:00'
	},
	{
		id: 'hosp-004',
		name: '深圳爱尔眼科医院',
		level: '二甲',
		type: '专科医院',
		address: '深圳市福田区滨河大道2010号',
		distance: 4200,
		tags: ['眼科专科', '连锁品牌'],
		rating: 4.7,
		departmentCount: 8,
		isOpen: true,
		openTime: '08:30-17:30'
	}
]

const MOCK_DEPARTMENTS = {
	'hosp-001': [
		{ id: 'dept-001', hospitalId: 'hosp-001', name: '白内障科', icon: 'cataract', description: '专业诊治各类白内障疾病', doctorCount: 15, todayAvailable: 28, diseases: ['老年性白内障', '先天性白内障', '外伤性白内障'], isHot: true, sortOrder: 1 },
		{ id: 'dept-002', hospitalId: 'hosp-001', name: '青光眼科', icon: 'glaucoma', description: '青光眼早期诊断与治疗', doctorCount: 12, todayAvailable: 18, diseases: ['开角型青光眼', '闭角型青光眼', '继发性青光眼'], isHot: true, sortOrder: 2 },
		{ id: 'dept-003', hospitalId: 'hosp-001', name: '眼底病科', icon: 'retina', description: '视网膜黄斑等眼底疾病', doctorCount: 18, todayAvailable: 32, diseases: ['糖尿病视网膜病变', '黄斑变性', '视网膜脱离'], isHot: true, sortOrder: 3 },
		{ id: 'dept-004', hospitalId: 'hosp-001', name: '屈光手术科', icon: 'refraction', description: '近视矫正与屈光手术', doctorCount: 10, todayAvailable: 15, diseases: ['近视', '远视', '散光'], isHot: true, sortOrder: 4 },
		{ id: 'dept-005', hospitalId: 'hosp-001', name: '角膜病科', icon: 'cornea', description: '角膜疾病与角膜移植', doctorCount: 8, todayAvailable: 12, diseases: ['角膜炎', '圆锥角膜', '角膜溃疡'], isHot: false, sortOrder: 5 },
		{ id: 'dept-006', hospitalId: 'hosp-001', name: '小儿眼科', icon: 'pediatric', description: '儿童眼病与斜弱视治疗', doctorCount: 9, todayAvailable: 22, diseases: ['斜视', '弱视', '先天性眼病'], isHot: true, sortOrder: 6 },
		{ id: 'dept-007', hospitalId: 'hosp-001', name: '眼整形科', icon: 'oculoplastic', description: '眼睑整形与泪道疾病', doctorCount: 6, todayAvailable: 8, diseases: ['上睑下垂', '泪道阻塞', '眼袋'], isHot: false, sortOrder: 7 },
		{ id: 'dept-008', hospitalId: 'hosp-001', name: '干眼门诊', icon: 'dryeye', description: '干眼症诊断与治疗', doctorCount: 5, todayAvailable: 35, diseases: ['干眼症', '睑板腺功能障碍', '视疲劳'], isHot: true, sortOrder: 8 }
	]
}

const MOCK_DOCTORS = [
	{
		id: 'doc-001',
		hospitalId: 'hosp-001',
		departmentId: 'dept-001',
		name: '张明华',
		avatar: '',
		title: '主任医师',
		level: '专家',
		specialties: ['白内障超声乳化', '人工晶体植入', '复杂白内障手术'],
		introduction: '张明华主任从事眼科临床工作30余年，是国内知名白内障手术专家。擅长各类复杂白内障手术，已成功完成白内障手术逾万例。曾赴美国、德国等国进修学习，引进多项国际先进技术。',
		education: '北京大学医学部博士',
		experience: 30,
		rating: 4.9,
		consultCount: 2847,
		registrationFee: 5000,
		availableDates: ['2024-12-06', '2024-12-09', '2024-12-11', '2024-12-13']
	},
	{
		id: 'doc-002',
		hospitalId: 'hosp-001',
		departmentId: 'dept-001',
		name: '李婷婷',
		avatar: '',
		title: '副主任医师',
		level: '专家',
		specialties: ['白内障手术', '老年性白内障', '并发性白内障'],
		introduction: '李婷婷医生专注于白内障诊治15年，擅长微创白内障手术，手术风格精细稳健，深受患者好评。',
		education: '中山大学医学院硕士',
		experience: 15,
		rating: 4.8,
		consultCount: 1562,
		registrationFee: 3500,
		availableDates: ['2024-12-05', '2024-12-06', '2024-12-08', '2024-12-10', '2024-12-12']
	},
	{
		id: 'doc-003',
		hospitalId: 'hosp-001',
		departmentId: 'dept-001',
		name: '王建国',
		avatar: '',
		title: '主治医师',
		level: '普通',
		specialties: ['白内障诊断', '术前评估', '术后随访'],
		introduction: '王建国医生毕业于华中科技大学同济医学院，从事眼科工作8年，临床经验丰富。',
		education: '华中科技大学同济医学院硕士',
		experience: 8,
		rating: 4.6,
		consultCount: 892,
		registrationFee: 2500,
		availableDates: ['2024-12-05', '2024-12-06', '2024-12-07', '2024-12-08', '2024-12-09', '2024-12-10']
	},
	{
		id: 'doc-004',
		hospitalId: 'hosp-001',
		departmentId: 'dept-002',
		name: '陈晓燕',
		avatar: '',
		title: '主任医师',
		level: '专家',
		specialties: ['青光眼手术', '激光治疗', '难治性青光眼'],
		introduction: '陈晓燕主任是青光眼领域权威专家，从事青光眼临床与研究工作25年，发表SCI论文20余篇。',
		education: '复旦大学医学院博士',
		experience: 25,
		rating: 4.9,
		consultCount: 2156,
		registrationFee: 5000,
		availableDates: ['2024-12-07', '2024-12-10', '2024-12-14']
	},
	{
		id: 'doc-005',
		hospitalId: 'hosp-001',
		departmentId: 'dept-003',
		name: '刘伟强',
		avatar: '',
		title: '副主任医师',
		level: '专家',
		specialties: ['眼底病诊断', '玻璃体切除', '视网膜激光'],
		introduction: '刘伟强医生专注眼底病诊疗，擅长糖尿病视网膜病变、黄斑疾病的诊断与治疗。',
		education: '浙江大学医学院博士',
		experience: 18,
		rating: 4.8,
		consultCount: 1823,
		registrationFee: 3500,
		availableDates: ['2024-12-05', '2024-12-08', '2024-12-11', '2024-12-15']
	}
]

const MOCK_SCHEDULES = {
	'doc-001': {
		'2024-12-06': [
			{ id: 'slot-001', type: 'morning', label: '上午', startTime: '08:00', endTime: '12:00', totalSlots: 20, remainingSlots: 12, status: 'available', price: 5000 },
			{ id: 'slot-002', type: 'afternoon', label: '下午', startTime: '14:00', endTime: '17:30', totalSlots: 15, remainingSlots: 3, status: 'few', price: 5000 }
		],
		'2024-12-09': [
			{ id: 'slot-003', type: 'morning', label: '上午', startTime: '08:00', endTime: '12:00', totalSlots: 20, remainingSlots: 8, status: 'available', price: 5000 },
			{ id: 'slot-004', type: 'afternoon', label: '下午', startTime: '14:00', endTime: '17:30', totalSlots: 15, remainingSlots: 0, status: 'full', price: 5000 }
		],
		'2024-12-11': [
			{ id: 'slot-005', type: 'morning', label: '上午', startTime: '08:00', endTime: '12:00', totalSlots: 20, remainingSlots: 15, status: 'available', price: 5000 }
		],
		'2024-12-13': [
			{ id: 'slot-006', type: 'morning', label: '上午', startTime: '08:00', endTime: '12:00', totalSlots: 20, remainingSlots: 18, status: 'available', price: 5000 },
			{ id: 'slot-007', type: 'afternoon', label: '下午', startTime: '14:00', endTime: '17:30', totalSlots: 15, remainingSlots: 10, status: 'available', price: 5000 }
		]
	},
	'doc-002': {
		'2024-12-05': [
			{ id: 'slot-008', type: 'morning', label: '上午', startTime: '08:30', endTime: '12:00', totalSlots: 18, remainingSlots: 5, status: 'few', price: 3500 },
			{ id: 'slot-009', type: 'afternoon', label: '下午', startTime: '14:00', endTime: '17:00', totalSlots: 12, remainingSlots: 8, status: 'available', price: 3500 }
		],
		'2024-12-06': [
			{ id: 'slot-010', type: 'morning', label: '上午', startTime: '08:30', endTime: '12:00', totalSlots: 18, remainingSlots: 10, status: 'available', price: 3500 }
		]
	}
}

// 是否使用Mock数据
const USE_MOCK = true

// ========== 医院相关 ==========

/**
 * 获取医院列表
 * @param {Object} params - { keyword, city, page, pageSize }
 */
export async function getHospitalList(params = {}) {
	if (USE_MOCK) {
		// 模拟网络延迟
		await new Promise(resolve => setTimeout(resolve, 300))
		let list = [...MOCK_HOSPITALS]
		// 关键词搜索
		if (params.keyword) {
			const kw = params.keyword.toLowerCase()
			list = list.filter(h => h.name.toLowerCase().includes(kw) || h.address.toLowerCase().includes(kw))
		}
		return { code: 200, msg: 'ok', data: { list, total: list.length } }
	}
	return get('/api/appointment/hospitals', params)
}

/**
 * 获取医院详情
 * @param {string} hospitalId
 */
export async function getHospitalDetail(hospitalId) {
	if (USE_MOCK) {
		await new Promise(resolve => setTimeout(resolve, 200))
		const hospital = MOCK_HOSPITALS.find(h => h.id === hospitalId)
		return { code: 200, msg: 'ok', data: hospital || null }
	}
	return get(`/api/appointment/hospitals/${hospitalId}`)
}

// ========== 科室相关 ==========

/**
 * 获取医院科室列表
 * @param {string} hospitalId
 */
export async function getDepartmentList(hospitalId) {
	if (USE_MOCK) {
		await new Promise(resolve => setTimeout(resolve, 250))
		const departments = MOCK_DEPARTMENTS[hospitalId] || []
		return { code: 200, msg: 'ok', data: { list: departments } }
	}
	return get(`/api/appointment/hospitals/${hospitalId}/departments`)
}

// ========== 医生相关 ==========

/**
 * 获取科室医生列表
 * @param {Object} params - { hospitalId, departmentId, level, page, pageSize }
 */
export async function getDoctorList(params) {
	if (USE_MOCK) {
		await new Promise(resolve => setTimeout(resolve, 300))
		let list = [...MOCK_DOCTORS]
		if (params.hospitalId) {
			list = list.filter(d => d.hospitalId === params.hospitalId)
		}
		if (params.departmentId) {
			list = list.filter(d => d.departmentId === params.departmentId)
		}
		if (params.level) {
			list = list.filter(d => d.level === params.level)
		}
		return { code: 200, msg: 'ok', data: { list, total: list.length } }
	}
	return get('/api/appointment/doctors', params)
}

/**
 * 获取医生详情
 * @param {string} doctorId
 */
export async function getDoctorDetail(doctorId) {
	if (USE_MOCK) {
		await new Promise(resolve => setTimeout(resolve, 200))
		const doctor = MOCK_DOCTORS.find(d => d.id === doctorId)
		return { code: 200, msg: 'ok', data: doctor || null }
	}
	return get(`/api/appointment/doctors/${doctorId}`)
}

// ========== 排班相关 ==========

/**
 * 获取医生排班
 * @param {string} doctorId
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 */
export async function getDoctorSchedule(doctorId, startDate, endDate) {
	if (USE_MOCK) {
		await new Promise(resolve => setTimeout(resolve, 200))
		const schedule = MOCK_SCHEDULES[doctorId] || {}
		return { code: 200, msg: 'ok', data: { schedule } }
	}
	return get(`/api/appointment/doctors/${doctorId}/schedule`, { startDate, endDate })
}

// ========== 预约相关 ==========

/**
 * 提交预约
 * @param {Object} data - { doctorId, date, periodId, patientInfo }
 */
export async function createAppointment(data) {
	if (USE_MOCK) {
		await new Promise(resolve => setTimeout(resolve, 500))
		return {
			code: 200,
			msg: '预约成功',
			data: {
				appointmentId: 'apt-' + Date.now(),
				queueNumber: Math.floor(Math.random() * 20) + 1,
				...data
			}
		}
	}
	return post('/api/appointment/create', data)
}

/**
 * 获取我的预约列表
 * @param {Object} params - { status, page, pageSize }
 */
export async function getMyAppointments(params = {}) {
	if (USE_MOCK) {
		await new Promise(resolve => setTimeout(resolve, 300))
		return { code: 200, msg: 'ok', data: { list: [], total: 0 } }
	}
	return get('/api/appointment/my-appointments', params)
}

/**
 * 取消预约
 * @param {string} appointmentId
 */
export async function cancelAppointment(appointmentId) {
	if (USE_MOCK) {
		await new Promise(resolve => setTimeout(resolve, 300))
		return { code: 200, msg: '取消成功', data: null }
	}
	return post(`/api/appointment/${appointmentId}/cancel`)
}

export default {
	getHospitalList,
	getHospitalDetail,
	getDepartmentList,
	getDoctorList,
	getDoctorDetail,
	getDoctorSchedule,
	createAppointment,
	getMyAppointments,
	cancelAppointment
}
