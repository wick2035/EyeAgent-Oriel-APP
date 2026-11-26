/**
 * 医生对话模拟数据
 * 用于在线咨询页医生列表展示（后端API接入前的占位数据）
 */

const mockDoctors = [
	{
		id: 'doc_001',
		name: '张明华',
		title: '主任医师',
		department: '眼底病科',
		avatar: '/static/avatar-default.svg',
		online: true,
		rating: 4.9,
		consultCount: 3205,
		experience: 18,
		specialties: ['复杂白内障', '青光眼手术', '眼底病变', '视网膜脱离'],
		introduction: '从事眼科临床工作18年，主刀复杂白内障及青光眼手术逾万例，在眼底疾病诊治领域有丰富经验。',
		lastMessage: '您的术后恢复情况很好，继续按时用药即可。',
		lastMessageTime: '2025-01-15T14:30:00',
		unreadCount: 2
	},
	{
		id: 'doc_002',
		name: '李婉清',
		title: '副主任医师',
		department: '角膜与眼表科',
		avatar: '/static/avatar-default.svg',
		online: true,
		rating: 4.8,
		consultCount: 1840,
		experience: 12,
		specialties: ['干眼症', '角膜炎', '近视激光矫正', '翼状胬肉'],
		introduction: '专注角膜病及眼表疾病12年，擅长干眼症综合治疗及各类近视矫正手术评估与随访。',
		lastMessage: '下次复查时间已为您安排在下周三上午。',
		lastMessageTime: '2025-01-14T09:15:00',
		unreadCount: 0
	},
	{
		id: 'doc_003',
		name: '王建国',
		title: '主治医师',
		department: '白内障科',
		avatar: '/static/avatar-default.svg',
		online: false,
		rating: 4.7,
		consultCount: 2100,
		experience: 9,
		specialties: ['白内障超声乳化', '人工晶体植入', '老年眼病', '屈光性白内障'],
		introduction: '深耕白内障专业9年，熟练开展超声乳化白内障吸除联合人工晶体植入术，患者满意度持续保持高水平。',
		lastMessage: '检查报告已出，各项指标正常。',
		lastMessageTime: '2025-01-13T16:45:00',
		unreadCount: 1
	}
]

export function getMockDoctorConversations() {
	return JSON.parse(JSON.stringify(mockDoctors))
}

export default { getMockDoctorConversations }
