/**
 * 眼部健康数据模型
 * AI医问通 - 根据年龄分组的眼健康风险评估
 */

import { reactive } from 'vue'

/**
 * 风险等级枚举
 */
export const RISK_LEVEL = {
	NORMAL: 'normal',       // 正常
	ATTENTION: 'attention', // 需关注
	MEDIUM: 'medium',       // 中高风险
	HIGH: 'high'            // 异常
}

/**
 * 风险等级配置
 */
export const RISK_CONFIG = {
	[RISK_LEVEL.NORMAL]: {
		color: '#10B981',
		bgColor: 'rgba(16, 185, 129, 0.1)',
		label: '正常'
	},
	[RISK_LEVEL.ATTENTION]: {
		color: '#F59E0B',
		bgColor: 'rgba(245, 158, 11, 0.1)',
		label: '需关注'
	},
	[RISK_LEVEL.MEDIUM]: {
		color: '#F97316',
		bgColor: 'rgba(249, 115, 22, 0.1)',
		label: '中高风险'
	},
	[RISK_LEVEL.HIGH]: {
		color: '#EF4444',
		bgColor: 'rgba(239, 68, 68, 0.1)',
		label: '异常'
	}
}

/**
 * 获取风险配置
 * @param {string} level - 风险等级
 * @returns {object} 风险配置
 */
export function getRiskConfig(level) {
	return RISK_CONFIG[level] || RISK_CONFIG[RISK_LEVEL.NORMAL]
}

/**
 * 儿童版数据 (0-12岁)
 */
export function getChildHealthData() {
	return [
		{
			id: 'myopia-risk',
			title: '近视发生风险',
			icon: 'eye',
			mainValue: '28',
			mainUnit: '%',
			mainLabel: '近视发生概率',
			subItems: [],
			status: RISK_LEVEL.ATTENTION
		},
		{
			id: 'eye-health-risk',
			title: '眼健康风险',
			icon: 'shield',
			mainValue: '中等',
			mainUnit: '',
			mainLabel: '视疲劳风险',
			subItems: [],
			status: RISK_LEVEL.NORMAL
		},
		{
			id: 'development-index',
			title: '视力发育指数',
			icon: 'chart',
			mainValue: '78',
			mainUnit: '/100',
			mainLabel: '综合指数',
			subItems: [],
			status: RISK_LEVEL.NORMAL
		}
	]
}

/**
 * 学生版数据 (13-17岁)
 */
export function getStudentHealthData() {
	return [
		{
			id: 'progression-risk',
			title: '近视进展风险',
			icon: 'eye',
			mainValue: '42',
			mainUnit: '%',
			mainLabel: '加深风险',
			subItems: [],
			status: RISK_LEVEL.MEDIUM
		},
		{
			id: 'related-disease-risk',
			title: '相关眼病风险',
			icon: 'alert',
			mainValue: '高',
			mainUnit: '',
			mainLabel: '视疲劳风险',
			subItems: [],
			status: RISK_LEVEL.HIGH
		},
		{
			id: 'health-index',
			title: '视力健康指数',
			icon: 'chart',
			mainValue: '70',
			mainUnit: '/100',
			mainLabel: '综合指数',
			subItems: [],
			status: RISK_LEVEL.ATTENTION
		}
	]
}

/**
 * 成人版数据 (18岁以上)
 */
export function getAdultHealthData() {
	return [
		{
			id: 'stability-assessment',
			title: '近视稳定性评估',
			icon: 'eye',
			mainValue: '15',
			mainUnit: '%',
			mainLabel: '近视变化风险',
			subItems: [],
			status: RISK_LEVEL.NORMAL
		},
		{
			id: 'adult-disease-risk',
			title: '成人眼病风险',
			icon: 'alert',
			mainValue: '偏高',
			mainUnit: '',
			mainLabel: '干眼风险',
			subItems: [],
			status: RISK_LEVEL.MEDIUM
		},
		{
			id: 'health-index',
			title: '视力健康指数',
			icon: 'chart',
			mainValue: '85',
			mainUnit: '/100',
			mainLabel: '健康指数',
			subItems: [],
			status: RISK_LEVEL.NORMAL
		}
	]
}

/**
 * 根据年龄分组获取健康数据
 * @param {'child'|'student'|'adult'} ageGroup - 年龄分组
 * @returns {Array} 健康数据数组
 */
export function getHealthDataByGroup(ageGroup) {
	switch (ageGroup) {
		case 'child':
			return getChildHealthData()
		case 'student':
			return getStudentHealthData()
		case 'adult':
		default:
			return getAdultHealthData()
	}
}
