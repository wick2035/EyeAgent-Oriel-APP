/**
 * 患者健康档案 API
 * AI医问通 - 患者信息获取与修改
 */

import { get, post } from './request.js'

/**
 * 获取患者健康档案信息
 * @returns {Promise<object>} 患者完整信息
 */
export async function getPatientInfo() {
	try {
		const response = await get('/api/app/base/patient-info')
		return response
	} catch (error) {
		console.error('获取患者信息失败:', error)
		return {
			code: 500,
			msg: error.message || '获取患者信息失败',
			data: null
		}
	}
}

/**
 * 修改患者信息
 * @param {object} data - 要修改的字段
 * @param {string} [data.patientName] - 患者姓名
 * @param {string} [data.gender] - 性别 (male/female)
 * @param {number} [data.age] - 年龄
 * @param {string} [data.phone] - 联系电话
 * @param {string} [data.idNumber] - 身份证号
 * @param {string} [data.address] - 联系地址
 * @param {number} [data.height] - 身高(cm)
 * @param {number} [data.weight] - 体重(kg)
 * @param {string} [data.bloodType] - 血型
 * @param {string} [data.maritalStatus] - 婚姻状况
 * @param {string} [data.careerType] - 职业类型
 * @param {string} [data.nation] - 民族
 * @param {string} [data.workUnit] - 工作单位
 * @param {string} [data.dateOfBirth] - 出生日期 (ISO 8601格式)
 * @param {string} [data.email] - 邮箱
 * @param {string} [data.emergencyContact] - 紧急联系人
 * @param {string} [data.emergencyContactPhone] - 紧急联系人电话
 * @param {string} [data.insuranceStatus] - 医保状态
 * @param {string} [data.insuranceCardNumber] - 医保卡号
 * @returns {Promise<object>} 修改后的患者信息
 */
export async function modifyPatientInfo(data) {
	try {
		const response = await post('/api/app/base/modify-patient-info', data)
		return response
	} catch (error) {
		console.error('修改患者信息失败:', error)
		return {
			code: 500,
			msg: error.message || '修改患者信息失败',
			data: null
		}
	}
}
