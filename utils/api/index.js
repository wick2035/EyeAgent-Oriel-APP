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
import * as e2eeChat from './e2eeChat.js'
import * as order from './order.js'
import * as cart from './cart.js'
import * as drug from './drug.js'

export { request, chat, user, appointment, medical, notification, surgery, e2eeChat, order, cart, drug }

export default {
	request,
	chat,
	user,
	appointment,
	medical,
	notification,
	surgery,
	e2eeChat,
	order,
	cart,
	drug
}
