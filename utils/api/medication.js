/**
 * 用药提醒API模块
 */
import { get, post, put, del } from './request.js'

// ========== Mock数据 ==========
const MOCK_REMINDERS = [
	{
		id: 'rem_001',
		reminderType: 'MEDICATION',
		reminderTitle: '用药提醒',
		reminderContent: '请按时使用左氧氟沙星滴眼液',
		prescriptionId: 'pres-001',
		prescriptionTitle: '术后用药处方',
		medicineName: '左氧氟沙星滴眼液',
		medicineSpec: '5ml:15mg',
		dosage: '1滴',
		medicineType: 'drops',
		frequency: '每日4次',
		scheduledTime: '2025-12-09T08:00:00',
		status: 'READ',
		enabled: true
	},
	{
		id: 'rem_002',
		reminderType: 'MEDICATION',
		reminderTitle: '用药提醒',
		reminderContent: '请按时使用妥布霉素地塞米松滴眼液',
		prescriptionId: 'pres-001',
		prescriptionTitle: '术后用药处方',
		medicineName: '妥布霉素地塞米松滴眼液',
		medicineSpec: '5ml',
		dosage: '1滴',
		medicineType: 'drops',
		frequency: '每日4次',
		scheduledTime: '2025-12-09T12:00:00',
		status: 'UNREAD',
		enabled: true
	},
	{
		id: 'rem_003',
		reminderType: 'MEDICATION',
		reminderTitle: '用药提醒',
		reminderContent: '请按时服用羟苯磺酸钙胶囊',
		prescriptionId: 'pres-002',
		prescriptionTitle: '眼底病变用药处方',
		medicineName: '羟苯磺酸钙胶囊',
		medicineSpec: '0.5g*24粒',
		dosage: '0.5g',
		medicineType: 'capsule',
		frequency: '每日3次',
		scheduledTime: '2025-12-09T18:00:00',
		status: 'SCHEDULED',
		enabled: true
	},
	{
		id: 'rem_004',
		reminderType: 'MEDICATION',
		reminderTitle: '用药提醒',
		reminderContent: '请按时服用维生素A软胶囊',
		prescriptionId: 'pres-003',
		prescriptionTitle: '护眼保健处方',
		medicineName: '维生素A软胶囊',
		medicineSpec: '25000IU*30粒',
		dosage: '1粒',
		medicineType: 'pill',
		frequency: '每日1次',
		scheduledTime: '2025-12-09T21:00:00',
		status: 'SCHEDULED',
		enabled: true
	},
	{
		id: 'rem_005',
		reminderType: 'MEDICATION',
		reminderTitle: '用药提醒',
		reminderContent: '请按时使用玻璃酸钠滴眼液',
		prescriptionId: 'pres-001',
		prescriptionTitle: '术后用药处方',
		medicineName: '玻璃酸钠滴眼液',
		medicineSpec: '5ml:5mg',
		dosage: '1-2滴',
		medicineType: 'drops',
		frequency: '每日6次',
		scheduledTime: '2025-12-09T14:00:00',
		status: 'SCHEDULED',
		enabled: true
	}
]

const USE_MOCK = true

/**
 * 获取用药提醒列表
 * @param {string} date - 日期筛选（可选），格式 YYYY-MM-DD
 */
export async function getReminderList(date = null) {
	if (USE_MOCK) {
		await new Promise(resolve => setTimeout(resolve, 300))
		let list = [...MOCK_REMINDERS]
		if (date) {
			list = list.filter(r => r.scheduledTime.startsWith(date))
		}
		list.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime))
		return { code: 200, msg: 'ok', data: { list, total: list.length } }
	}
	return get('/api/app/medication/reminder-list', { date })
}

/**
 * 创建用药提醒
 * @param {Object} data - { prescriptionId, medicineName, dosage, frequency, times: ['08:00', '12:00'], enabled }
 */
export async function createReminder(data) {
	if (USE_MOCK) {
		await new Promise(resolve => setTimeout(resolve, 300))
		const newReminder = {
			id: 'rem_' + Date.now(),
			reminderType: 'MEDICATION',
			reminderTitle: '用药提醒',
			reminderContent: `请按时使用${data.medicineName}`,
			prescriptionId: data.prescriptionId || null,
			prescriptionTitle: data.prescriptionTitle || '自定义用药',
			medicineName: data.medicineName,
			medicineSpec: data.medicineSpec || '',
			dosage: data.dosage,
			medicineType: data.medicineType || 'pill',
			frequency: data.frequency,
			scheduledTime: data.scheduledTime,
			status: 'SCHEDULED',
			enabled: true
		}
		MOCK_REMINDERS.push(newReminder)
		return { code: 200, msg: 'ok', data: { id: newReminder.id } }
	}
	return post('/api/app/medication/create-reminder', data)
}

/**
 * 更新用药提醒
 */
export async function updateReminder(id, data) {
	if (USE_MOCK) {
		await new Promise(resolve => setTimeout(resolve, 300))
		const index = MOCK_REMINDERS.findIndex(r => r.id === id)
		if (index !== -1) {
			MOCK_REMINDERS[index] = { ...MOCK_REMINDERS[index], ...data }
		}
		return { code: 200, msg: 'ok' }
	}
	return put(`/api/app/medication/reminder/${id}`, data)
}

/**
 * 删除用药提醒
 */
export async function deleteReminder(id) {
	if (USE_MOCK) {
		await new Promise(resolve => setTimeout(resolve, 300))
		const index = MOCK_REMINDERS.findIndex(r => r.id === id)
		if (index !== -1) {
			MOCK_REMINDERS.splice(index, 1)
		}
		return { code: 200, msg: 'ok' }
	}
	return del(`/api/app/medication/reminder/${id}`)
}

/**
 * 标记用药完成
 */
export async function markAsCompleted(id) {
	if (USE_MOCK) {
		await new Promise(resolve => setTimeout(resolve, 300))
		const reminder = MOCK_REMINDERS.find(r => r.id === id)
		if (reminder) {
			reminder.status = 'READ'
		}
		return { code: 200, msg: 'ok' }
	}
	return post(`/api/app/medication/reminder/${id}/complete`)
}

/**
 * 取消完成标记
 */
export async function unmarkCompleted(id) {
	if (USE_MOCK) {
		await new Promise(resolve => setTimeout(resolve, 300))
		const reminder = MOCK_REMINDERS.find(r => r.id === id)
		if (reminder) {
			reminder.status = 'SCHEDULED'
		}
		return { code: 200, msg: 'ok' }
	}
	return post(`/api/app/medication/reminder/${id}/uncomplete`)
}

/**
 * 切换提醒开关
 */
export async function toggleReminder(id, enabled) {
	if (USE_MOCK) {
		await new Promise(resolve => setTimeout(resolve, 300))
		const reminder = MOCK_REMINDERS.find(r => r.id === id)
		if (reminder) {
			reminder.enabled = enabled
		}
		return { code: 200, msg: 'ok' }
	}
	return post(`/api/app/medication/reminder/${id}/toggle`, { enabled })
}

/**
 * 从处方创建提醒
 * @param {string} prescriptionId - 处方ID
 */
export async function createFromPrescription(prescriptionId) {
	if (USE_MOCK) {
		await new Promise(resolve => setTimeout(resolve, 500))
		return { code: 200, msg: 'ok', data: { createdCount: 3 } }
	}
	return post('/api/app/medication/create-from-prescription', { prescriptionId })
}

export default {
	getReminderList,
	createReminder,
	updateReminder,
	deleteReminder,
	markAsCompleted,
	unmarkCompleted,
	toggleReminder,
	createFromPrescription
}
