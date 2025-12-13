/**
 * 用药提醒API模块
 * 对接后端 AppBaseController API
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
 * 状态映射：后端 -> 前端
 */
const STATUS_FROM_API = {
	PENDING: 'SCHEDULED',
	SENT: 'UNREAD',
	COMPLETED: 'READ',
	CANCELLED: 'CANCELLED'
}

/**
 * 将前端表单数据转换为创建API参数
 * @param {Object} formData - 前端表单数据
 * @returns {Object} API参数
 */
function transformToCreateApi(formData) {
	// 构建content JSON
	const contentObj = {
		spec: formData.medicineSpec || '',
		dosage: formData.dosage || '',
		frequency: formData.frequency || ''
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
 * 将API返回的Reminder转换为前端格式
 * @param {Object} reminder - API返回的Reminder对象
 * @returns {Object} 前端格式数据
 */
function transformFromApi(reminder) {
	// 解析content JSON
	let contentObj = { spec: '', dosage: '', frequency: '' }
	try {
		if (reminder.reminderContent) {
			const parsed = JSON.parse(reminder.reminderContent)
			contentObj = {
				spec: parsed.spec || '',
				dosage: parsed.dosage || '',
				frequency: parsed.frequency || ''
			}
		}
	} catch (e) {
		// JSON解析失败，使用默认值
		console.warn('解析reminderContent失败:', e)
	}

	return {
		id: reminder.id,
		reminderType: reminder.reminderType || 'MEDICATION',
		reminderTitle: reminder.reminderTitle || '',
		reminderContent: reminder.reminderContent || '',
		medicineName: reminder.reminderTitle || '',
		medicineSpec: contentObj.spec,
		dosage: contentObj.dosage,
		medicineType: MEDICINE_TYPE_FROM_API[reminder.medicalType] || 'pill',
		frequency: contentObj.frequency,
		scheduledTime: reminder.scheduledTime || '',
		status: STATUS_FROM_API[reminder.status] || 'SCHEDULED',
		enabled: true, // 后端无此字段，默认为true
		// 保留原始字段供参考
		_raw: reminder
	}
}

// ========== API 函数 ==========

/**
 * 获取用药提醒列表
 * 合并未读和已读通知
 * @param {string} date - 日期筛选（可选），格式 YYYY-MM-DD
 */
export async function getReminderList(date = null) {
	try {
		// 并行获取未读和已读通知
		const [unreadRes, readRes] = await Promise.all([
			get('/api/app/base/get-unread-notification'),
			get('/api/app/base/get-read-notification', {
				reminderType: 'MEDICATION',
				pageNum: 1,
				pageSize: 100 // 获取足够多的已读记录
			})
		])

		let list = []

		// 处理未读通知（从medication数组获取）
		if (unreadRes.code === 200 && unreadRes.data) {
			const medicationList = unreadRes.data.medication || []
			list = list.concat(medicationList.map(transformFromApi))
		}

		// 处理已读通知
		if (readRes.code === 200 && readRes.data) {
			const readList = Array.isArray(readRes.data) ? readRes.data : []
			list = list.concat(readList.map(transformFromApi))
		}

		// 过滤CANCELLED状态
		list = list.filter(item => item.status !== 'CANCELLED')

		// 按日期筛选
		if (date) {
			list = list.filter(r => r.scheduledTime && r.scheduledTime.startsWith(date))
		}

		// 按时间排序
		list.sort((a, b) => (a.scheduledTime || '').localeCompare(b.scheduledTime || ''))

		return { code: 200, msg: 'ok', data: { list, total: list.length } }
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
		const res = await post('/api/app/base/create-medical-notification', apiData)

		if (res.code === 200) {
			return { code: 200, msg: 'ok', data: { id: res.data?.id } }
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
 * 删除用药提醒
 * @param {string} id - 提醒ID
 */
export async function deleteReminder(id) {
	try {
		const res = await post(`/api/app/base/remove-notification?reminderId=${encodeURIComponent(id)}`)

		if (res.code === 200) {
			return { code: 200, msg: 'ok' }
		}
		return { code: res.code || 500, msg: res.msg || '删除失败' }
	} catch (error) {
		console.error('删除用药提醒失败:', error)
		return { code: 500, msg: error.message || '删除失败' }
	}
}

/**
 * 标记用药完成（标记为已读）
 * @param {string} id - 提醒ID
 */
export async function markAsCompleted(id) {
	try {
		const res = await post(`/api/app/base/mark-notification-as-read?reminderId=${encodeURIComponent(id)}`)

		if (res.code === 200) {
			return { code: 200, msg: 'ok' }
		}
		return { code: res.code || 500, msg: res.msg || '标记失败' }
	} catch (error) {
		console.error('标记完成失败:', error)
		return { code: 500, msg: error.message || '标记失败' }
	}
}

export default {
	getReminderList,
	createReminder,
	updateReminder,
	deleteReminder,
	markAsCompleted
}
