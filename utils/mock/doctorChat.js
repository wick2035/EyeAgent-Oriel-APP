/**
 * 医生对话模拟数据
 * 用于消息页医生对话列表展示（后端API接入前的占位数据）
 */

const mockDoctors = [
	{
		id: 'doc_001',
		name: '张明华',
		title: '主任医师',
		department: '眼科',
		lastMessage: '您的术后恢复情况很好，继续按时用药即可。',
		lastMessageTime: '2025-01-15T14:30:00',
		unreadCount: 2,
		online: true
	},
	{
		id: 'doc_002',
		name: '李婉清',
		title: '副主任医师',
		department: '眼底病科',
		lastMessage: '下次复查时间已为您安排在下周三上午。',
		lastMessageTime: '2025-01-14T09:15:00',
		unreadCount: 0,
		online: false
	},
	{
		id: 'doc_003',
		name: '王建国',
		title: '主治医师',
		department: '白内障科',
		lastMessage: '检查报告已出，各项指标正常。',
		lastMessageTime: '2025-01-13T16:45:00',
		unreadCount: 1,
		online: true
	}
]

export function getMockDoctorConversations() {
	return JSON.parse(JSON.stringify(mockDoctors))
}

export default { getMockDoctorConversations }
