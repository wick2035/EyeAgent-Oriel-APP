/**
 * 患者健康档案状态管理
 * AI医问通 - 患者信息状态管理
 */

import { reactive } from 'vue'
import { getPatientInfo, modifyPatientInfo } from '@/utils/api/patient.js'

// 患者状态
const patientState = reactive({
	loading: false,
	data: null,
	lastFetched: null,
	error: null
})

// 不可编辑字段
export const READONLY_FIELDS = ['patientName', 'age', 'dateOfBirth', 'idNumber']

// 字段分组配置
export const FIELD_GROUPS = [
	{
		key: 'body',
		title: '身体数据',
		fields: ['height', 'weight']
	},
	{
		key: 'basic',
		title: '基本信息',
		fields: ['gender', 'bloodType', 'nation', 'maritalStatus']
	},
	{
		key: 'career',
		title: '职业信息',
		fields: ['careerType', 'workUnit']
	},
	{
		key: 'emergency',
		title: '紧急联系',
		fields: ['emergencyContact', 'emergencyContactPhone']
	},
	{
		key: 'insurance',
		title: '医保信息',
		fields: ['insuranceStatus', 'insuranceCardNumber']
	},
	{
		key: 'contact',
		title: '联系方式',
		fields: ['email', 'address']
	}
]

// 字段配置（标签、类型、选项等）
export const FIELD_CONFIG = {
	// 身份信息（只读）
	patientName: { label: '姓名', type: 'text', readonly: true },
	age: { label: '年龄', type: 'text', readonly: true, unit: '岁' },
	dateOfBirth: { label: '出生日期', type: 'date', readonly: true },
	idNumber: { label: '身份证号', type: 'text', readonly: true },

	// 身体数据
	height: {
		label: '身高',
		type: 'number',
		unit: 'cm',
		min: 50,
		max: 250,
		placeholder: '请输入身高'
	},
	weight: {
		label: '体重',
		type: 'number',
		unit: 'kg',
		min: 20,
		max: 300,
		placeholder: '请输入体重'
	},

	// 基本信息
	gender: {
		label: '性别',
		type: 'picker',
		options: [
			{ label: '男', value: 'male' },
			{ label: '女', value: 'female' }
		]
	},
	bloodType: {
		label: '血型',
		type: 'picker',
		options: [
			{ label: 'A型', value: 'A' },
			{ label: 'B型', value: 'B' },
			{ label: 'O型', value: 'O' },
			{ label: 'AB型', value: 'AB' },
			{ label: '未知', value: '' }
		]
	},
	nation: {
		label: '民族',
		type: 'text',
		placeholder: '请输入民族'
	},
	maritalStatus: {
		label: '婚姻状况',
		type: 'picker',
		options: [
			{ label: '未婚', value: '未婚' },
			{ label: '已婚', value: '已婚' },
			{ label: '离异', value: '离异' },
			{ label: '丧偶', value: '丧偶' }
		]
	},

	// 职业信息
	careerType: {
		label: '职业',
		type: 'text',
		placeholder: '请输入职业'
	},
	workUnit: {
		label: '工作单位',
		type: 'text',
		placeholder: '请输入工作单位'
	},

	// 紧急联系
	emergencyContact: {
		label: '紧急联系人',
		type: 'text',
		placeholder: '请输入紧急联系人姓名'
	},
	emergencyContactPhone: {
		label: '联系人电话',
		type: 'text',
		placeholder: '请输入联系人电话'
	},

	// 医保信息
	insuranceStatus: {
		label: '医保状态',
		type: 'picker',
		options: [
			{ label: '正常', value: '正常' },
			{ label: '暂停', value: '暂停' },
			{ label: '未参保', value: '未参保' }
		]
	},
	insuranceCardNumber: {
		label: '医保卡号',
		type: 'text',
		placeholder: '请输入医保卡号'
	},

	// 联系方式
	phone: {
		label: '手机号',
		type: 'text',
		readonly: true
	},
	email: {
		label: '邮箱',
		type: 'text',
		placeholder: '请输入邮箱地址'
	},
	address: {
		label: '地址',
		type: 'textarea',
		placeholder: '请输入详细地址'
	}
}

/**
 * 获取患者状态
 */
export function getPatientState() {
	return patientState
}

/**
 * 检查字段是否只读
 * @param {string} fieldKey 字段键名
 */
export function isFieldReadonly(fieldKey) {
	return READONLY_FIELDS.includes(fieldKey)
}

/**
 * 获取字段配置
 * @param {string} fieldKey 字段键名
 */
export function getFieldConfig(fieldKey) {
	return FIELD_CONFIG[fieldKey] || { label: fieldKey, type: 'text' }
}

/**
 * 获取字段显示值
 * @param {string} fieldKey 字段键名
 * @param {any} value 字段值
 */
export function getFieldDisplayValue(fieldKey, value) {
	if (value === null || value === undefined || value === '') {
		return '未设置'
	}

	const config = FIELD_CONFIG[fieldKey]
	if (!config) return value

	// 处理选择器类型，显示label而非value
	if (config.type === 'picker' && config.options) {
		const option = config.options.find(opt => opt.value === value)
		if (option) return option.label
	}

	// 处理带单位的数值
	if (config.unit && value) {
		return `${value}${config.unit}`
	}

	// 处理日期格式
	if (config.type === 'date' && value) {
		return value.split('T')[0]
	}

	return value
}

/**
 * 拉取患者信息
 */
export async function fetchPatient() {
	if (patientState.loading) return

	patientState.loading = true
	patientState.error = null

	try {
		const response = await getPatientInfo()
		if (response.code === 200 && response.data) {
			patientState.data = response.data
			patientState.lastFetched = Date.now()
		} else {
			patientState.error = response.msg || '获取患者信息失败'
		}
	} catch (error) {
		patientState.error = error.message || '获取患者信息失败'
	} finally {
		patientState.loading = false
	}

	return patientState.data
}

/**
 * 更新患者信息
 * @param {object} data 要更新的字段
 */
export async function updatePatient(data) {
	patientState.loading = true
	patientState.error = null

	try {
		const response = await modifyPatientInfo(data)
		if (response.code === 200) {
			// 更新成功后，合并新数据到本地状态
			if (response.data) {
				patientState.data = response.data
			} else {
				// 如果后端没返回完整数据，手动合并
				patientState.data = { ...patientState.data, ...data }
			}
			return { success: true, data: patientState.data }
		} else {
			patientState.error = response.msg || '更新失败'
			return { success: false, message: response.msg }
		}
	} catch (error) {
		patientState.error = error.message || '更新失败'
		return { success: false, message: error.message }
	} finally {
		patientState.loading = false
	}
}

/**
 * 计算BMI
 * @param {number} height 身高(cm)
 * @param {number} weight 体重(kg)
 */
export function calculateBMI(height, weight) {
	if (!height || !weight || height <= 0 || weight <= 0) {
		return null
	}
	const heightM = height / 100
	return (weight / (heightM * heightM)).toFixed(1)
}

/**
 * 获取BMI状态
 * @param {number} bmi BMI值
 */
export function getBMIStatus(bmi) {
	if (!bmi) return { text: '未知', color: '#999', level: 'unknown' }

	const bmiNum = parseFloat(bmi)
	if (bmiNum < 18.5) {
		return { text: '偏瘦', color: '#3B82F6', level: 'thin' }
	} else if (bmiNum < 24) {
		return { text: '正常', color: '#10B981', level: 'normal' }
	} else if (bmiNum < 28) {
		return { text: '偏胖', color: '#F59E0B', level: 'overweight' }
	} else {
		return { text: '肥胖', color: '#EF4444', level: 'obese' }
	}
}

/**
 * 获取BMI进度百分比（用于进度条显示）
 * @param {number} bmi BMI值
 */
export function getBMIProgress(bmi) {
	if (!bmi) return 0

	const bmiNum = parseFloat(bmi)
	// BMI范围约15-35，映射到0-100%
	const min = 15
	const max = 35
	const progress = ((bmiNum - min) / (max - min)) * 100
	return Math.max(0, Math.min(100, progress))
}

/**
 * 脱敏身份证号
 * @param {string} idNumber 身份证号
 */
export function maskIdNumber(idNumber) {
	if (!idNumber) return '未设置'
	if (idNumber.length < 8) return idNumber
	return idNumber.substring(0, 3) + '***' + idNumber.substring(idNumber.length - 4)
}

/**
 * 清除患者状态
 */
export function clearPatientState() {
	patientState.data = null
	patientState.lastFetched = null
	patientState.error = null
	patientState.loading = false
}
