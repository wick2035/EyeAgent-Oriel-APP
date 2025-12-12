/**
 * 年龄计算工具
 * AI医问通 - 用于眼部健康模块的年龄分组
 */

/**
 * 根据生日计算年龄
 * @param {string} birthday - 生日字符串，格式: 'YYYY-MM-DD'
 * @returns {number|null} 年龄，无效输入返回 null
 */
export function calculateAge(birthday) {
	if (!birthday) return null

	const birthDate = new Date(birthday)
	if (isNaN(birthDate.getTime())) return null

	const today = new Date()
	let age = today.getFullYear() - birthDate.getFullYear()
	const monthDiff = today.getMonth() - birthDate.getMonth()

	// 如果还没过生日，年龄减1
	if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
		age--
	}

	return age >= 0 ? age : null
}

/**
 * 根据年龄获取用户分组
 * @param {number|null} age - 年龄
 * @returns {'child'|'student'|'adult'} 年龄分组
 */
export function getAgeGroup(age) {
	if (age === null || age === undefined) return 'adult'
	if (age <= 12) return 'child'
	if (age <= 17) return 'student'
	return 'adult'
}

/**
 * 获取年龄分组的中文名称
 * @param {'child'|'student'|'adult'} group - 年龄分组
 * @returns {string} 中文名称
 */
export function getAgeGroupLabel(group) {
	const labels = {
		child: '儿童版',
		student: '学生版',
		adult: '成人版'
	}
	return labels[group] || '成人版'
}
