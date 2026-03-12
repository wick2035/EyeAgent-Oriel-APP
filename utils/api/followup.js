/**
 * 远程复诊 API 模块
 * 注：真实 API 列表/详情仅返回 doctorId，不含医生姓名/科室等信息。
 * TODO: 请后端在 VideoMeetingListResponse / VideoMeetingResponse 中补充
 *       doctorName / doctorTitle / doctorDept / doctorAvatar 字段。
 */
import { get, post } from './request.js'

// ============================================================
// 3.2 获取我的会议列表
// GET /api/app/video/meetings
// ============================================================
export async function getMeetingList() {
	try {
		const res = await get('/api/app/video/meetings')
		if (res.code === 200 && Array.isArray(res.data)) {
			res.data = res.data.map(m => ({
				...m,
				doctorName:     m.doctorName     || '主治医生',
				doctorTitle:    m.doctorTitle    || '',
				departmentName: m.departmentName || '',
				hospitalName:   m.hospitalName   || ''
			}))
		}
		return res
	} catch (e) {
		return { code: 500, msg: e.message, data: [] }
	}
}

// ============================================================
// 3.3 获取会议详情
// GET /api/app/video/meeting/{meetingId}
// ============================================================
export async function getMeetingDetail(meetingId) {
	try {
		return await get(`/api/app/video/meeting/${meetingId}`)
	} catch (e) {
		return { code: 500, msg: e.message, data: null }
	}
}

// ============================================================
// 3.4 获取会议加入信息
// GET /api/app/video/meeting/{meetingId}/join
// ============================================================
export async function getJoinInfo(meetingId) {
	try {
		return await get(`/api/app/video/meeting/${meetingId}/join`)
	} catch (e) {
		return { code: 500, msg: e.message, data: null }
	}
}

// ============================================================
// 3.5 取消会议
// POST /api/app/video/meeting/{meetingId}/cancel
// ============================================================
export async function cancelMeeting(meetingId, reason = '') {
	try {
		return await post(`/api/app/video/meeting/${meetingId}/cancel`, reason ? { reason } : {})
	} catch (e) {
		return { code: 500, msg: e.message, data: null }
	}
}
