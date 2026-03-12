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
			mainValue: '28',
			mainUnit: '%',
			status: RISK_LEVEL.ATTENTION
		},
		{
			id: 'eye-health-risk',
			title: '眼健康风险',
			mainValue: '中等',
			mainUnit: '',
			status: RISK_LEVEL.NORMAL
		},
		{
			id: 'development-index',
			title: '视力发育指数',
			mainValue: '78',
			mainUnit: '/100',
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
			mainValue: '42',
			mainUnit: '%',
			status: RISK_LEVEL.MEDIUM
		},
		{
			id: 'related-disease-risk',
			title: '相关眼病风险',
			mainValue: '高',
			mainUnit: '',
			status: RISK_LEVEL.HIGH
		},
		{
			id: 'health-index',
			title: '视力健康指数',
			mainValue: '70',
			mainUnit: '/100',
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
			title: '视力稳定性',
			mainValue: '95',
			mainUnit: '%',
			status: RISK_LEVEL.NORMAL
		},
		{
			id: 'adult-disease-risk',
			title: '眼病风险',
			mainValue: '偏高',
			mainUnit: '',
			status: RISK_LEVEL.MEDIUM
		},
		{
			id: 'health-index',
			title: '眼健康指数',
			mainValue: '85',
			mainUnit: '/100',
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

// ==================== 眼部检查数据 ====================

/**
 * 近视等级枚举
 */
export const MYOPIA_LEVEL = {
	MILD: 'mild',           // 轻度近视 < 3.00D
	MODERATE: 'moderate',   // 中度近视 3.00-6.00D
	HIGH: 'high',           // 高度近视 6.00-9.00D
	SEVERE: 'severe'        // 超高度近视 >= 9.00D
}

/**
 * 近视等级配置
 */
export const MYOPIA_CONFIG = {
	[MYOPIA_LEVEL.MILD]: {
		color: '#10B981',
		bgColor: 'rgba(16, 185, 129, 0.1)',
		label: '轻度近视',
		range: '< 3.00D'
	},
	[MYOPIA_LEVEL.MODERATE]: {
		color: '#3B82F6',
		bgColor: 'rgba(59, 130, 246, 0.1)',
		label: '中度近视',
		range: '3.00-6.00D'
	},
	[MYOPIA_LEVEL.HIGH]: {
		color: '#F59E0B',
		bgColor: 'rgba(245, 158, 11, 0.1)',
		label: '高度近视',
		range: '6.00-9.00D'
	},
	[MYOPIA_LEVEL.SEVERE]: {
		color: '#EF4444',
		bgColor: 'rgba(239, 68, 68, 0.1)',
		label: '超高度近视',
		range: '>= 9.00D'
	}
}

/**
 * 根据球镜度数评估近视等级
 * @param {number} sph - 球镜度数 (负值)
 * @returns {object} { level, config }
 */
export function getMyopiaRisk(sph) {
	const abs = Math.abs(sph || 0)
	let level
	if (abs < 3.00) {
		level = MYOPIA_LEVEL.MILD
	} else if (abs < 6.00) {
		level = MYOPIA_LEVEL.MODERATE
	} else if (abs < 9.00) {
		level = MYOPIA_LEVEL.HIGH
	} else {
		level = MYOPIA_LEVEL.SEVERE
	}
	return {
		level,
		...MYOPIA_CONFIG[level]
	}
}

/**
 * 将近视度数映射到仪表盘百分比 (0-100)
 * 范围：0D ~ -12D → 0% ~ 100%
 * @param {number} sph - 球镜度数 (负值)
 * @returns {number} 百分比
 */
export function getMyopiaGaugeProgress(sph) {
	const abs = Math.abs(sph || 0)
	const max = 12
	const progress = (abs / max) * 100
	return Math.max(0, Math.min(100, progress))
}

/**
 * Mock 眼部检查数据
 */
export function getMockEyeExamData() {
	return {
		examDate: '2026-02-20',
		od: {
			sph: -3.50,
			cyl: -0.75,
			axis: 180,
			va: 5.0,
			al: 25.12,
			k: 43.25,
			iop: 15,
			nakedVision: 4.5
		},
		os: {
			sph: -4.25,
			cyl: -1.00,
			axis: 175,
			va: 4.9,
			al: 25.68,
			k: 43.50,
			iop: 16,
			nakedVision: 4.3
		},
		pd: 63
	}
}

/**
 * Mock 历史趋势数据 (近6次检查 + 2次预测)
 */
export function getMockTrendData() {
	return {
		history: [
			{ date: '2024-03', od: -2.50, os: -3.00 },
			{ date: '2024-06', od: -2.75, os: -3.25 },
			{ date: '2024-09', od: -3.00, os: -3.50 },
			{ date: '2025-01', od: -3.00, os: -3.75 },
			{ date: '2025-06', od: -3.25, os: -4.00 },
			{ date: '2026-02', od: -3.50, os: -4.25 }
		],
		prediction: [
			{ date: '2026-08', od: -3.75, os: -4.50 },
			{ date: '2027-02', od: -4.00, os: -4.75 }
		]
	}
}

// ==================== Sankey 因果解析数据 ====================

/**
 * 成人版 Sankey 数据 (SPH -3.50D, AL 25.12mm, IOP 15mmHg)
 */
export function getAdultSankeyData() {
	return {
		score: 85,
		scoreLabel: '综合眼健康评估',
		chips: [
			{ text: '中度近视', status: RISK_LEVEL.ATTENTION },
			{ text: '眼压正常', status: RISK_LEVEL.NORMAL },
			{ text: '眼轴偏长', status: RISK_LEVEL.ATTENTION }
		],
		leftNodes: [
			{ tag: '屈光', label: '屈光度', value: '-3.50D', color: '#FF6B9D' },
			{ tag: '进展', label: '近视进展', value: '-0.75D/年', color: '#5B9EFF' },
			{ tag: '眼轴', label: '眼轴长度', value: '25.12mm', color: '#607D9C' },
			{ tag: '眼压', label: '眼压', value: '15mmHg', color: '#9B72CF' },
			{ tag: '视力', label: '裸眼视力', value: '4.5', color: '#FF9D6B' }
		],
		middleNodes: ['中度近视', '进展偏快', '眼轴偏长', '眼压正常', '轻度下降'],
		rightNodes: [
			{ label: '视网膜病变', risk: '中等风险', color: '#26C6DA' },
			{ label: '眼疲劳症', risk: '中等风险', color: '#4DD0E1' },
			{ label: '干眼症', risk: '低风险', color: '#80DEEA' }
		],
		connections: [
			[0, 0, 2], [0, 1, 2],
			[1, 0, 1], [1, 1, 2],
			[2, 0, 3],
			[3, 2, 1],
			[4, 1, 1], [4, 2, 2]
		],
		tips: [
			{ icon: '⏱', iconSize: '50rpx', title: '控制用眼时间', desc: '近距离用眼每50分钟休息10分钟，望远≥6米处' },
			{ icon: '📐', title: '定期眼轴监测', desc: '每6个月复查眼轴，及时评估近视进展速度' },
			{ icon: '🌿', title: '增加户外活动', desc: '每日户外活动≥2小时，有助减缓近视进展' }
		]
	}
}

/**
 * 学生版 Sankey 数据 (13-17岁，SPH -2.00D，进展较快)
 */
export function getStudentSankeyData() {
	return {
		score: 70,
		scoreLabel: '综合眼健康评估',
		chips: [
			{ text: '轻中度近视', status: RISK_LEVEL.ATTENTION },
			{ text: '进展较快', status: RISK_LEVEL.MEDIUM },
			{ text: '眼轴增长', status: RISK_LEVEL.ATTENTION }
		],
		leftNodes: [
			{ tag: '屈光', label: '屈光度', value: '-2.00D', color: '#FF6B9D' },
			{ tag: '进展', label: '近视进展', value: '-1.00D/年', color: '#5B9EFF' },
			{ tag: '眼轴', label: '眼轴长度', value: '24.50mm', color: '#607D9C' },
			{ tag: '眼压', label: '眼压', value: '14mmHg', color: '#9B72CF' },
			{ tag: '视力', label: '裸眼视力', value: '4.2', color: '#FF9D6B' }
		],
		middleNodes: ['轻中度近视', '进展过快', '眼轴偏长', '眼压正常', '明显下降'],
		rightNodes: [
			{ label: '高度近视风险', risk: '中等风险', color: '#26C6DA' },
			{ label: '眼疲劳症', risk: '较高风险', color: '#4DD0E1' },
			{ label: '干眼症', risk: '低风险', color: '#80DEEA' }
		],
		connections: [
			[0, 0, 2], [0, 1, 2],
			[1, 0, 3], [1, 1, 2],
			[2, 0, 2],
			[3, 2, 1],
			[4, 1, 2], [4, 2, 1]
		],
		tips: [
			{ icon: '📚', title: '规范用眼习惯', desc: '保持阅读距离≥33cm，光线充足，姿势端正' },
			{ icon: '🔬', title: '积极近视防控', desc: '考虑角膜塑形镜等防控手段，减缓眼轴增长' },
			{ icon: '🌿', title: '户外活动优先', desc: '每日户外活动≥2小时是目前最有效的防控方式' }
		]
	}
}

/**
 * 儿童版 Sankey 数据 (0-12岁，远视储备偏低)
 */
export function getChildSankeyData() {
	return {
		score: 78,
		scoreLabel: '综合眼健康评估',
		chips: [
			{ text: '远视储备偏低', status: RISK_LEVEL.ATTENTION },
			{ text: '眼压正常', status: RISK_LEVEL.NORMAL },
			{ text: '发育待观察', status: RISK_LEVEL.ATTENTION }
		],
		leftNodes: [
			{ tag: '屈光', label: '屈光度', value: '+0.50D', color: '#FF6B9D' },
			{ tag: '储备', label: '远视储备', value: '偏低', color: '#5B9EFF' },
			{ tag: '眼轴', label: '眼轴长度', value: '22.80mm', color: '#607D9C' },
			{ tag: '眼压', label: '眼压', value: '13mmHg', color: '#9B72CF' },
			{ tag: '视力', label: '裸眼视力', value: '4.8', color: '#FF9D6B' }
		],
		middleNodes: ['正视化偏快', '储备不足', '眼轴正常', '眼压正常', '视力良好'],
		rightNodes: [
			{ label: '早发近视风险', risk: '中等风险', color: '#26C6DA' },
			{ label: '视力疲劳', risk: '低风险', color: '#4DD0E1' },
			{ label: '弱视风险', risk: '低风险', color: '#80DEEA' }
		],
		connections: [
			[0, 0, 2], [1, 0, 3],
			[2, 0, 1],
			[3, 1, 1],
			[4, 1, 1], [4, 2, 1]
		],
		tips: [
			{ icon: '🌳', title: '户外活动是关键', desc: '每天≥2小时户外活动，自然光有助于延缓近视发生' },
			{ icon: '📺', title: '减少屏幕时间', desc: '6岁以下每天屏幕时间不超过1小时，避免近距离用眼' },
			{ icon: '👁', title: '定期视力筛查', desc: '每6个月进行一次眼科检查，监测远视储备变化' }
		]
	}
}

/**
 * 根据年龄分组获取 Sankey 详情数据
 * @param {'child'|'student'|'adult'} ageGroup
 * @returns {object} Sankey 数据
 */
export function getSankeyDataByGroup(ageGroup) {
	switch (ageGroup) {
		case 'child':   return getChildSankeyData()
		case 'student': return getStudentSankeyData()
		case 'adult':
		default:        return getAdultSankeyData()
	}
}

/**
 * 眼部数据字段配置
 */
export const EYE_DATA_GROUPS = [
	{
		key: 'refraction',
		title: '屈光数据',
		fields: [
			{ key: 'sph', label: '球镜(SPH)', unit: 'D', format: v => v > 0 ? `+${v.toFixed(2)}` : v.toFixed(2) },
			{ key: 'cyl', label: '柱镜(CYL)', unit: 'D', format: v => v > 0 ? `+${v.toFixed(2)}` : v.toFixed(2) },
			{ key: 'axis', label: '轴位(AXIS)', unit: '°', format: v => `${v}` },
			{ key: 'va', label: '矫正视力', unit: '', format: v => v.toFixed(1) }
		]
	},
	{
		key: 'cornea',
		title: '角膜与眼轴',
		fields: [
			{ key: 'al', label: '眼轴(AL)', unit: 'mm', format: v => v.toFixed(2) },
			{ key: 'k', label: '角膜曲率(K)', unit: 'D', format: v => v.toFixed(2) },
			{ key: 'iop', label: '眼压(IOP)', unit: 'mmHg', format: v => `${v}` }
		]
	},
	{
		key: 'vision',
		title: '裸眼视力',
		fields: [
			{ key: 'nakedVision', label: '裸眼视力', unit: '', format: v => v.toFixed(1) }
		]
	}
]
