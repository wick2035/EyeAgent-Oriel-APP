/**
 * 通知导航工具函数
 * 根据通知类型和附加数据决定导航目标
 * 供 TopNotificationBar 和 App.vue 共同复用
 *
 * 导航规则：
 *   RESERVE  + 有 appointmentId  → appointment-detail?id=xxx
 *   RESERVE  + 无 appointmentId  → notification-detail?type=RESERVE
 *   MEDICATION + 有 prescriptionId → medical-records?prescriptionId=xxx
 *   MEDICATION + 无 prescriptionId → notification-detail?type=MEDICATION
 *   SYSTEM   （无具体业务ID）    → notification-detail?type=SYSTEM
 *
 * 注意：notification-detail 是普通页面（非 tabBar），
 *       需先 switchTab 到 messages，再延迟 navigateTo 跳转子页面。
 *
 * @param {{ type: string, appointmentId?: string|number, prescriptionId?: string|number }} payload
 */
export function navigateByNotification(payload) {
	if (!payload || !payload.type) {
		// 无类型数据时兜底跳转到消息中心
		uni.switchTab({ url: '/pages/messages/messages' })
		return
	}

	const { type, appointmentId, prescriptionId } = payload

	// 视频问诊通知 → 消息中心
	if (type === 'VIDEO_MEETING') {
		uni.switchTab({ url: '/pages/messages/messages' })
		return
	}

	// 预约提醒 + 有预约ID → 直接跳转预约详情
	if (type === 'RESERVE' && appointmentId) {
		uni.navigateTo({
			url: `/pages/profile/appointment-detail?id=${appointmentId}`
		})
		return
	}

	// 用药提醒 + 有处方ID → 直接跳转就诊记录
	if (type === 'MEDICATION' && prescriptionId) {
		uni.navigateTo({
			url: `/pages/profile/medical-records?prescriptionId=${prescriptionId}`
		})
		return
	}

	// 系统通知，或 RESERVE/MEDICATION 无具体业务ID：
	// 先切到 messages tabBar，再跳转到对应类型的通知详情列表
	uni.switchTab({
		url: '/pages/messages/messages',
		success: () => {
			setTimeout(() => {
				uni.navigateTo({
					url: `/pages/messages/notification-detail?type=${type}`
				})
			}, 100)
		}
	})
}
