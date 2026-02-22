/**
 * 用药提醒API模块
 * 对接后端 /api/app/extra 专用用药提醒接口
 */
import { get, post } from './request.js'

// ========== 数据转换工具函数 ==========

/**
 * 药物类型映射：前端 -> 后端
 */
const MEDICINE_TYPE_TO_API = {
	drops: 'DROP',
	pill: 'PILL',
	capsule: 'CAPSULE',
	injection: 'INJECT'
}

/**
 * 药物类型映射：后端 -> 前端
 */
const MEDICINE_TYPE_FROM_API = {
	DROP: 'drops',
	PILL: 'pill',
	CAPSULE: 'capsule',
	INJECT: 'injection'
}

/**
 * 将前端表单数据转换为创建API参数
 * @param {Object} formData - 前端表单数据
 * @returns {Object} API参数
 */
function transformToCreateApi(formData) {
	// 构建content JSON，包含type以便获取时恢复药物类型
	const contentObj = {
		spec: formData.medicineSpec || '',
		dosage: formData.dosage || '',
		frequency: formData.frequency || '',
		type: formData.medicineType || 'pill'
	}

	// 从scheduledTime提取时间部分 (HH:mm:ss)
	let time = '08:00:00'
	if (formData.scheduledTime) {
		const timePart = formData.scheduledTime.substring(11, 19)
		time = timePart || '08:00:00'
	}

	return {
		title: formData.medicineName || '',
		content: JSON.stringify(contentObj),
		medicalType: MEDICINE_TYPE_TO_API[formData.medicineType] || 'PILL',
		time: time,
		duration: formData.duration || 7
	}
}

/**
 * 将前端表单数据转换为修改API参数
 * @param {string} reminderId - 提醒ID
 * @param {Object} formData - 前端表单数据
 * @returns {Object} API参数
 */
function transformToUpdateApi(reminderId, formData) {
	// 构建content JSON
	const contentObj = {
		spec: formData.medicineSpec || '',
		dosage: formData.dosage || '',
		frequency: formData.frequency || ''
	}

	return {
		reminderId: reminderId,
		title: formData.medicineName || '',
		content: JSON.stringify(contentObj),
		medicalType: MEDICINE_TYPE_TO_API[formData.medicineType] || 'PILL',
		scheduledTime: formData.scheduledTime || ''
	}
}

/**
 * 将新API返回的Reminder转换为前端格式
 * 新API响应: { id(agendaId), reminderId, userId, title, remark, resolved, startTime, endTime }
 * @param {Object} reminder - API返回的Reminder对象
 * @returns {Object} 前端格式数据
 */
function transformFromApi(reminder) {
	// 解析remark字段（创建时以JSON格式存入content，返回时为remark）
	let contentObj = { spec: '', dosage: '', frequency: '', type: '' }
	try {
		if (reminder.remark) {
			const parsed = JSON.parse(reminder.remark)
			contentObj = {
				spec: parsed.spec || '',
				dosage: parsed.dosage || '',
				frequency: parsed.frequency || '',
				type: parsed.type || ''
			}
		}
	} catch (e) {
		// remark不是JSON格式，作为纯文本赋给dosage
		contentObj.dosage = reminder.remark || ''
	}

	return {
		id: reminder.reminderId || '',
		agendaId: reminder.id || '', // 日程ID，toggle操作需要
		reminderType: 'MEDICATION',
		reminderTitle: reminder.title || '',
		medicineName: reminder.title || '',
		medicineSpec: contentObj.spec,
		dosage: contentObj.dosage,
		medicineType: contentObj.type ? (MEDICINE_TYPE_FROM_API[contentObj.type] || contentObj.type) : 'pill',
		frequency: contentObj.frequency,
		scheduledTime: reminder.startTime || '',
		status: reminder.resolved ? 'READ' : 'SCHEDULED',
		enabled: true,
		_raw: reminder
	}
}

// ========== API 函数 ==========

/**
 * 获取用药提醒列表
 * @param {string} date - 日期筛选（可选），格式 YYYY-MM-DD；不传则取当月
 */
export async function getReminderList(date = null) {
	try {
		let startTime, endTime

		if (date) {
			// 指定日期：取该日全天
			startTime = `${date}T00:00:00`
			endTime = `${date}T23:59:59`
		} else {
			// 默认取当月
			const now = new Date()
			const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
			const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
			const pad = (n) => String(n).padStart(2, '0')
			startTime = `${firstDay.getFullYear()}-${pad(firstDay.getMonth() + 1)}-${pad(firstDay.getDate())}T00:00:00`
			endTime = `${lastDay.getFullYear()}-${pad(lastDay.getMonth() + 1)}-${pad(lastDay.getDate())}T23:59:59`
		}

		const res = await get('/api/app/extra/get-medical-reminder', {
			startTime,
			endTime
		})

		if (res.code === 200 && res.data) {
			const list = (Array.isArray(res.data) ? res.data : []).map(transformFromApi)
			list.sort((a, b) => (a.scheduledTime || '').localeCompare(b.scheduledTime || ''))
			return { code: 200, msg: 'ok', data: { list, total: list.length } }
		}

		return { code: res.code || 500, msg: res.msg || '获取失败', data: { list: [], total: 0 } }
	} catch (error) {
		console.error('获取用药提醒列表失败:', error)
		return { code: 500, msg: error.message || '获取失败', data: { list: [], total: 0 } }
	}
}

/**
 * 创建用药提醒
 * @param {Object} data - 前端表单数据
 */
export async function createReminder(data) {
	try {
		const apiData = transformToCreateApi(data)
		const res = await post('/api/app/extra/create-medical-reminder', apiData)

		if (res.code === 200) {
			return { code: 200, msg: res.msg || 'ok', data: null }
		}
		return { code: res.code || 500, msg: res.msg || '创建失败' }
	} catch (error) {
		console.error('创建用药提醒失败:', error)
		return { code: 500, msg: error.message || '创建失败' }
	}
}

/**
 * 更新用药提醒
 * @param {string} id - 提醒ID
 * @param {Object} data - 前端表单数据
 */
export async function updateReminder(id, data) {
	try {
		const apiData = transformToUpdateApi(id, data)
		const res = await post('/api/app/base/modify-medical-notification', apiData)

		if (res.code === 200) {
			return { code: 200, msg: 'ok' }
		}
		return { code: res.code || 500, msg: res.msg || '修改失败' }
	} catch (error) {
		console.error('更新用药提醒失败:', error)
		return { code: 500, msg: error.message || '修改失败' }
	}
}

/**
 * 删除用药提醒（支持批量）
 * @param {string} id - 提醒ID (reminderId)
 */
export async function deleteReminder(id) {
	try {
		const res = await post('/api/app/extra/remove-medical-reminder', {
			reminderIds: [id]
		})

		if (res.code === 200) {
			return { code: 200, msg: res.msg || 'ok' }
		}
		return { code: res.code || 500, msg: res.msg || '删除失败' }
	} catch (error) {
		console.error('删除用药提醒失败:', error)
		return { code: 500, msg: error.message || '删除失败' }
	}
}

/**
 * 切换用药提醒完成状态（双向toggle）
 * @param {string} agendaId - 日程ID（get接口返回的id字段）
 */
export async function toggleReminderState(agendaId) {
	try {
		const res = await post(`/api/app/extra/toggle-medical-reminder-state?agendaId=${encodeURIComponent(agendaId)}`)

		if (res.code === 200) {
			return { code: 200, msg: res.msg || 'ok' }
		}
		return { code: res.code || 500, msg: res.msg || '切换状态失败' }
	} catch (error) {
		console.error('切换用药提醒状态失败:', error)
		return { code: 500, msg: error.message || '切换状态失败' }
	}
}

/**
 * 标记用药完成（兼容旧调用方式的包装函数）
 * @param {Object} reminder - 完整的提醒对象（需含agendaId）
 */
export async function markAsCompleted(reminder) {
	if (!reminder || !reminder.agendaId) {
		console.error('markAsCompleted: 缺少agendaId')
		return { code: 500, msg: '缺少必要参数' }
	}
	return toggleReminderState(reminder.agendaId)
}

export default {
	getReminderList,
	createReminder,
	updateReminder,
	deleteReminder,
	toggleReminderState,
	markAsCompleted
}
