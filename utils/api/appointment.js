/**
 * 预约挂号相关API - 真实API接入版本
 */
import { get, post } from './request.js'

// ========== 数据适配函数 ==========

/**
 * 适配医院数据
 */
function adaptHospital(apiData) {
	return {
		id: apiData.id,
		name: apiData.hospitalName,
		level: apiData.hospitalLevel || '未定级',
		type: apiData.hospitalType || '综合医院',
		address: [apiData.province, apiData.city, apiData.address].filter(Boolean).join(''),
		logoUrl: apiData.logoUrl || '',
		rating: apiData.star || 4.5,
		// 默认值
		distance: 0,
		tags: [apiData.hospitalLevel, apiData.hospitalType].filter(Boolean),
		departmentCount: 0,
		isOpen: true,
		openTime: '07:00-17:00'
	}
}

/**
 * 适配医生数据
 */
function adaptDoctor(apiData) {
	return {
		id: apiData.id,
		name: apiData.name,
		title: apiData.title || '医师',
		hospitalArea: apiData.hospitalArea || '', // 科室
		specialty: apiData.specialty || '',
		specialties: apiData.specialty ? apiData.specialty.split(/[,，、]/) : [],
		gender: apiData.gender || 'male',
		age: apiData.age || 0,
		phoneNumber: apiData.phoneNumber || '',
		// 默认值
		avatar: '',
		level: apiData.title?.includes('主任') ? '专家' : '普通',
		introduction: apiData.specialty ? `擅长：${apiData.specialty}` : '',
		education: '',
		experience: 0,
		rating: 4.5,
		consultCount: 0,
		registrationFee: 0,
		availableDates: [] // 需要从排班API获取
	}
}

/**
 * 计算时段状态
 * @param {Object} slot - 时段数据
 * @param {string} date - 日期字符串 YYYY-MM-DD
 * @returns {string} 状态：available/few/full/booked/passed
 */
function getSlotStatus(slot, date) {
	// 检查今天已过的时段
	const today = new Date()
	const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

	if (date === todayStr) {
		const now = new Date()
		const [hours, minutes] = slot.startTime.split(':').map(Number)
		const slotTime = new Date()
		slotTime.setHours(hours, minutes, 0, 0)

		if (now > slotTime) {
			return 'passed'
		}
	}

	// 用户已预约该时段
	if (slot.agendaId) {
		return 'booked'
	}
	// 不可预约（约满或其他原因）
	if (slot.canReserve === false || slot.capacity === 0) {
		return 'full'
	}
	// 号源紧张
	if (slot.capacity <= 3) {
		return 'few'
	}
	// 充足
	return 'available'
}

/**
 * 适配排班数据 - 将slots转换为页面需要的格式
 * 支持新接口返回的 canReserve 和 agendaId 字段
 */
function adaptSchedule(apiData) {
	const scheduleData = {}

	if (!apiData || !Array.isArray(apiData)) {
		return scheduleData
	}

	apiData.forEach(dayData => {
		const date = dayData.date
		// 兼容 hourlySlots 和 slots 两种字段名
		const slots = dayData.slots || dayData.hourlySlots || []

		scheduleData[date] = slots.map((slot, index) => {
			const startHour = parseInt(slot.startTime.split(':')[0])
			let type = 'morning'
			let label = '上午'

			if (startHour >= 12 && startHour < 18) {
				type = 'afternoon'
				label = '下午'
			} else if (startHour >= 18) {
				type = 'evening'
				label = '晚上'
			}

			// 格式化时间显示（兼容 "09:00" 和 "09:00:00" 格式）
			const startTime = slot.startTime.substring(0, 5)
			const endTime = slot.endTime.substring(0, 5)

			// 计算状态（传入日期用于判断是否已过期）
			const status = getSlotStatus(slot, date)

			return {
				id: `${date}-${index}`,
				type,
				label, // 显示时间段类型（上午/下午/晚上）
				startTime,
				endTime,
				fullStartTime: slot.startTime,
				fullEndTime: slot.endTime,
				totalSlots: slot.capacity,
				remainingSlots: slot.capacity,
				// 是否可预约：已过期或接口返回不可预约时为 false
				canReserve: status !== 'passed' && slot.canReserve !== false,
				agendaId: slot.agendaId || null,
				status,
				price: 0 // API未返回价格，使用默认值
			}
		})
	})

	return scheduleData
}

/**
 * 适配预约列表数据
 */
function adaptReservation(apiData) {
	return {
		id: apiData.reserveId,
		reserveId: apiData.reserveId,
		startTime: apiData.startTime,
		endTime: apiData.endTime,
		status: apiData.status,
		patientName: apiData.patientName,
		queuePosition: apiData.queuePosition || null,  // 排队位置（就诊序号）
		doctorId: String(apiData.doctorId || ''),  // 统一转为字符串，避免类型比较问题
		doctorName: apiData.doctorName,
		doctorTitle: apiData.doctorTitle,
		doctorSpecialty: apiData.doctorSpecialty,
		department: apiData.department,
		doctorAvatarUrl: apiData.doctorAvatarUrl,
		consultationRoom: apiData.consultationRoom || '',  // 就诊室
		hospitalId: apiData.hospitalId || '',  // 医院ID
		hospitalName: apiData.hospitalName,
		hospitalAddress: apiData.hospitalAddress,
		hospitalLevel: apiData.hospitalLevel
	}
}

// ========== 医院相关 ==========

/**
 * 获取医院列表
 * @param {Object} params - { keyword, page, pageSize }
 */
export async function getHospitalList(params = {}) {
	const res = await get('/api/app/base/page-hospital-info', {
		pageNum: params.page || 1,
		pageSize: params.pageSize || 10,
		searchKey: params.keyword || ''
	})

	if (res.code === 200) {
		const list = (res.data || []).map(adaptHospital)
		return {
			code: 200,
			msg: 'ok',
			data: {
				list,
				total: res.total || list.length
			}
		}
	}
	return res
}

/**
 * 获取医院详情
 * @param {string} hospitalId
 */
export async function getHospitalDetail(hospitalId) {
	// API暂无单独获取医院详情的接口，从列表中模拟
	const res = await getHospitalList({ pageSize: 100 })
	if (res.code === 200) {
		const hospital = res.data.list.find(h => h.id === hospitalId)
		return { code: 200, msg: 'ok', data: hospital || null }
	}
	return res
}

// ========== 科室相关 ==========

/**
 * 获取医院科室列表（从医生的hospitalArea字段提取）
 * @param {string} hospitalId
 */
export async function getDepartmentList(hospitalId) {
	// 先获取该医院所有医生
	const res = await get('/api/app/base/page-doctor-by-hospital', {
		hospitalId,
		pageNum: 1,
		pageSize: 100
	})

	if (res.code === 200) {
		const doctors = res.data || []
		const deptSet = new Set()
		const departments = []

		doctors.forEach(d => {
			const deptName = d.hospitalArea
			if (deptName && !deptSet.has(deptName)) {
				deptSet.add(deptName)
				const deptDoctors = doctors.filter(doc => doc.hospitalArea === deptName)
				departments.push({
					id: deptName,
					hospitalId,
					name: deptName,
					icon: 'default',
					description: `${deptName}门诊`,
					doctorCount: deptDoctors.length,
					todayAvailable: deptDoctors.length * 5, // 估算值
					diseases: [],
					isHot: deptDoctors.length >= 3,
					sortOrder: departments.length + 1
				})
			}
		})

		return { code: 200, msg: 'ok', data: { list: departments } }
	}
	return { code: 200, msg: 'ok', data: { list: [] } }
}

// ========== 医生相关 ==========

/**
 * 获取科室医生列表
 * @param {Object} params - { hospitalId, departmentId, level, page, pageSize }
 */
export async function getDoctorList(params) {
	const res = await get('/api/app/base/page-doctor-by-hospital', {
		hospitalId: params.hospitalId,
		pageNum: params.page || 1,
		pageSize: params.pageSize || 20
	})

	if (res.code === 200) {
		let doctors = (res.data || []).map(adaptDoctor)

		// 前端按科室筛选
		if (params.departmentId) {
			doctors = doctors.filter(d => d.hospitalArea === params.departmentId)
		}

		// 前端按级别筛选
		if (params.level) {
			doctors = doctors.filter(d => d.level === params.level)
		}

		return {
			code: 200,
			msg: 'ok',
			data: {
				list: doctors,
				total: res.total || doctors.length
			}
		}
	}
	return { code: 200, msg: 'ok', data: { list: [], total: 0 } }
}

/**
 * 获取医生详情
 * @param {string} doctorId
 * @param {string} hospitalId - 可选，用于优化查询
 */
export async function getDoctorDetail(doctorId, hospitalId) {
	// API暂无单独获取医生详情的接口
	// 如果有hospitalId，从该医院医生列表中查找
	if (hospitalId) {
		const res = await getDoctorList({ hospitalId, pageSize: 100 })
		if (res.code === 200) {
			const doctor = res.data.list.find(d => d.id === doctorId)
			if (doctor) {
				// 获取该医生的排班，补充可预约日期
				const scheduleRes = await getDoctorFreeTime(doctorId)
				if (scheduleRes.code === 200 && scheduleRes.data?.schedule) {
					doctor.availableDates = Object.keys(scheduleRes.data.schedule)
				}
				return { code: 200, msg: 'ok', data: doctor }
			}
		}
	}

	// 无法获取详情时返回基础信息
	const scheduleRes = await getDoctorFreeTime(doctorId)
	const availableDates = scheduleRes.code === 200 && scheduleRes.data?.schedule
		? Object.keys(scheduleRes.data.schedule)
		: []

	return {
		code: 200,
		msg: 'ok',
		data: {
			id: doctorId,
			name: '医生',
			title: '医师',
			specialties: [],
			rating: 4.5,
			consultCount: 0,
			experience: 0,
			registrationFee: 0,
			availableDates
		}
	}
}

// ========== 排班相关 ==========

/**
 * 获取医生空闲时间（排班）
 * @param {string} doctorId
 */
export async function getDoctorFreeTime(doctorId) {
	const res = await get('/api/app/base/doctor-free-time', { doctorId })

	if (res.code === 200) {
		const schedule = adaptSchedule(res.data)
		return {
			code: 200,
			msg: 'ok',
			data: { schedule }
		}
	}
	return { code: res.code, msg: res.msg, data: { schedule: {} } }
}

/**
 * 获取医生排班 - 兼容旧接口
 * @param {string} doctorId
 * @param {string} startDate - YYYY-MM-DD (未使用，API自动返回未来3天)
 * @param {string} endDate - YYYY-MM-DD (未使用)
 */
export async function getDoctorSchedule(doctorId, startDate, endDate) {
	return getDoctorFreeTime(doctorId)
}

// ========== 预约相关 ==========

/**
 * 预约医生
 * @param {Object} data - { doctorId, date, startTime, time }
 */
export async function createAppointment(data) {
	// 组装ISO 8601格式的时间
	// data.date: "2025-12-11"
	// data.startTime: "09:00"
	// data.time: "2025-12-11T09:00:00" (已组装好的时间)
	let time = data.time

	if (!time && data.date && data.startTime) {
		time = `${data.date}T${data.startTime}:00`
	}

	// API文档说明参数放在URL中
	const res = await post(`/api/app/base/reserve-doctor?doctorId=${data.doctorId}&time=${encodeURIComponent(time)}`)

	if (res.code === 200) {
		return {
			code: 200,
			msg: res.msg || '预约成功',
			data: {
				appointmentId: res.data?.id,
				queueNumber: 1, // API未返回排队号
				...res.data
			}
		}
	}
	return res
}

/**
 * 预约医生 - 新接口名称
 * @param {Object} data - { doctorId, time }
 */
export async function reserveDoctor(data) {
	const res = await post(`/api/app/base/reserve-doctor?doctorId=${data.doctorId}&time=${encodeURIComponent(data.time)}`)

	if (res.code === 200) {
		return {
			code: 200,
			msg: res.msg || '预约成功',
			data: {
				appointmentId: res.data?.id,
				queueNumber: 1,
				...res.data
			}
		}
	}
	return res
}

/**
 * 获取患者预约列表
 * @param {Object} params - { status, page, pageSize } (未使用，API不支持分页)
 */
export async function getMyAppointments(params = {}) {
	const res = await get('/api/app/base/patient-reserve-time')

	if (res.code === 200) {
		const list = (res.data || []).map(adaptReservation)
		return {
			code: 200,
			msg: 'ok',
			data: {
				list,
				total: list.length
			}
		}
	}
	return { code: 200, msg: 'ok', data: { list: [], total: 0 } }
}

/**
 * 获取患者预约列表 - 新接口名称
 */
export async function getPatientReserveList() {
	return getMyAppointments()
}

/**
 * 取消预约
 * @param {string} appointmentId - 预约ID (reserveId)
 */
export async function cancelAppointment(appointmentId) {
	const res = await post('/api/app/base/cancel-reserve', {
		reserveId: appointmentId
	})

	if (res.code === 200) {
		return { code: 200, msg: '取消成功', data: null }
	}
	return res
}

/**
 * 取消预约 - 新接口名称
 * @param {string} reserveId
 */
export async function cancelReserve(reserveId) {
	return cancelAppointment(reserveId)
}

export default {
	getHospitalList,
	getHospitalDetail,
	getDepartmentList,
	getDoctorList,
	getDoctorDetail,
	getDoctorSchedule,
	getDoctorFreeTime,
	createAppointment,
	reserveDoctor,
	getMyAppointments,
	getPatientReserveList,
	cancelAppointment,
	cancelReserve
}
