/**
 * API接口统一导出
 */
import request from './request.js'
import chat from './chat.js'
import * as user from './user.js'
import * as appointment from './appointment.js'
import * as medical from './medical.js'
import * as notification from './notification.js'
import * as surgery from './surgery.js'

export { request, chat, user, appointment, medical, notification, surgery }

export default {
	request,
	chat,
	user,
	appointment,
	medical,
	notification,
	surgery
}
