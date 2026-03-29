/**
 * 家庭成员（就诊人）API
 * AI医问通 - 就诊人管理接口
 */

import { get, post, put, del } from './request.js'

/**
 * 获取就诊人列表
 * @returns {Promise<object>} { code, data: [{ id, name, relation, gender, birthDate, avatar, isDefault }] }
 */
export async function getFamilyMembers() {
	try {
		return await get('/api/app/family/members')
	} catch (error) {
		console.error('获取就诊人列表失败:', error)
		return { code: 500, msg: error.message || '获取就诊人列表失败', data: [] }
	}
}

/**
 * 添加就诊人
 * @param {object} data
 * @param {string} data.name - 姓名
 * @param {string} data.relation - 关系 (father/mother/spouse/son/daughter/sibling/other)
 * @param {string} data.gender - 性别 (male/female)
 * @param {string} data.birthDate - 出生日期 (YYYY-MM-DD)
 * @returns {Promise<object>}
 */
export async function addMember(data) {
	try {
		return await post('/api/app/family/members', data)
	} catch (error) {
		console.error('添加就诊人失败:', error)
		return { code: 500, msg: error.message || '添加就诊人失败', data: null }
	}
}

/**
 * 编辑就诊人
 * @param {string} id - 就诊人 ID
 * @param {object} data - 要修改的字段
 * @returns {Promise<object>}
 */
export async function updateMember(id, data) {
	try {
		return await put(`/api/app/family/members/${id}`, data)
	} catch (error) {
		console.error('编辑就诊人失败:', error)
		return { code: 500, msg: error.message || '编辑就诊人失败', data: null }
	}
}

/**
 * 删除就诊人
 * @param {string} id - 就诊人 ID
 * @returns {Promise<object>}
 */
export async function deleteMember(id) {
	try {
		return await del(`/api/app/family/members/${id}`)
	} catch (error) {
		console.error('删除就诊人失败:', error)
		return { code: 500, msg: error.message || '删除就诊人失败', data: null }
	}
}
