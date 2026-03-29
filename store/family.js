/**
 * 家庭成员（就诊人）状态管理
 * AI医问通 - 就诊人切换与家庭成员管理
 */

import { reactive } from 'vue'
import config from '@/utils/config.js'
import { getFamilyMembers, addMember, updateMember, deleteMember } from '@/utils/api/family.js'
import { clearPatientState } from '@/store/patient.js'
import { clearSurgeryState } from '@/store/surgery.js'
import { clearMedicationState } from '@/store/medication.js'

// 关系枚举
export const RELATION_MAP = {
	self: '本人',
	father: '父亲',
	mother: '母亲',
	spouse: '配偶',
	son: '儿子',
	daughter: '女儿',
	sibling: '兄弟姐妹',
	other: '其他'
}

// 关系选项列表（用于 picker）
export const RELATION_OPTIONS = Object.entries(RELATION_MAP)
	.filter(([key]) => key !== 'self')
	.map(([value, label]) => ({ value, label }))

// 头像渐变色板（按关系分配）
const AVATAR_COLORS = {
	self:     { from: '#1E3A5F', to: '#4A90D9' },
	spouse:   { from: '#E8567F', to: '#F7A8B8' },
	father:   { from: '#2D7D46', to: '#5CB85C' },
	mother:   { from: '#9B59B6', to: '#D6A4E8' },
	son:      { from: '#F5A623', to: '#FFCC02' },
	daughter: { from: '#3B82F6', to: '#93C5FD' },
	sibling:  { from: '#14B8A6', to: '#5EEAD4' },
	other:    { from: '#8B949E', to: '#C0C8D1' }
}

// 最大成员数
export const MAX_MEMBERS = 6

// localStorage key
const STORAGE_KEY_CURRENT = 'family_current_patient_id'

// 家庭成员状态
const familyState = reactive({
	members: [],
	currentId: '',
	loading: false,
	initialized: false
})

/**
 * 初始化家庭成员（App 启动时调用）
 */
export async function initFamily() {
	// 从 localStorage 恢复当前选中的就诊人
	try {
		const savedId = uni.getStorageSync(STORAGE_KEY_CURRENT)
		if (savedId) {
			familyState.currentId = savedId
		}
	} catch (e) {
		console.error('恢复就诊人选择失败:', e)
	}

	await fetchFamilyMembers()
}

/**
 * 获取就诊人列表
 */
export async function fetchFamilyMembers() {
	familyState.loading = true
	try {
		const res = await getFamilyMembers()
		if (res.code === 200 && Array.isArray(res.data)) {
			familyState.members = res.data
			// 如果没有选中的就诊人，默认选中本人（isDefault: true）
			if (!familyState.currentId) {
				const defaultMember = res.data.find(m => m.isDefault) || res.data[0]
				if (defaultMember) {
					familyState.currentId = defaultMember.id
					uni.setStorageSync(STORAGE_KEY_CURRENT, defaultMember.id)
				}
			}
			// 如果当前选中的 ID 不在列表中（被删除了），回退到本人
			if (familyState.currentId && !res.data.find(m => m.id === familyState.currentId)) {
				const defaultMember = res.data.find(m => m.isDefault) || res.data[0]
				if (defaultMember) {
					familyState.currentId = defaultMember.id
					uni.setStorageSync(STORAGE_KEY_CURRENT, defaultMember.id)
				}
			}
		}
		familyState.initialized = true
	} catch (e) {
		console.error('获取就诊人列表失败:', e)
	} finally {
		familyState.loading = false
	}
}

/**
 * 切换当前就诊人
 */
export function switchPatient(id) {
	if (familyState.currentId === id) return

	familyState.currentId = id
	uni.setStorageSync(STORAGE_KEY_CURRENT, id)

	// 清空患者缓存数据，下次进入页面会重新拉取
	clearPatientState()
	clearSurgeryState()
	clearMedicationState()

	// 广播切换事件，各页面监听后刷新数据
	uni.$emit('patient-switched', { patientId: id })
}

/**
 * 添加就诊人
 */
export async function addFamilyMember(data) {
	const res = await addMember(data)
	if (res.code === 200) {
		await fetchFamilyMembers()
	}
	return res
}

/**
 * 编辑就诊人
 */
export async function updateFamilyMember(id, data) {
	const res = await updateMember(id, data)
	if (res.code === 200) {
		await fetchFamilyMembers()
	}
	return res
}

/**
 * 删除就诊人
 */
export async function removeFamilyMember(id) {
	const res = await deleteMember(id)
	if (res.code === 200) {
		// 如果删除的是当前选中的，切回本人
		if (familyState.currentId === id) {
			const defaultMember = familyState.members.find(m => m.isDefault) || familyState.members[0]
			if (defaultMember) {
				switchPatient(defaultMember.id)
			}
		}
		await fetchFamilyMembers()
	}
	return res
}

/**
 * 获取当前就诊人对象
 */
export function getCurrentPatient() {
	return familyState.members.find(m => m.id === familyState.currentId) || null
}

/**
 * 获取当前就诊人 ID
 */
export function getCurrentPatientId() {
	return familyState.currentId
}

/**
 * 当前就诊人是否是本人
 */
export function isCurrentSelf() {
	const current = getCurrentPatient()
	return !current || current.isDefault || current.relation === 'self'
}

/**
 * 关系枚举转中文
 */
export function getRelationLabel(relation) {
	return RELATION_MAP[relation] || '其他'
}

/**
 * 根据关系获取头像渐变色
 */
export function getAvatarColor(relation) {
	return AVATAR_COLORS[relation] || AVATAR_COLORS.other
}

/**
 * 获取姓氏首字（用于头像显示）
 */
export function getNameInitial(name) {
	if (!name) return ''
	return name.charAt(0)
}

/**
 * 获取家庭成员状态（供组件直接访问响应式对象）
 */
export function getFamilyState() {
	return familyState
}

export { familyState }
