/**
 * API接口统一导出
 */
import request from './request.js'
import chat from './chat.js'
import * as user from './user.js'

export { request, chat, user }

export default {
	request,
	chat,
	user
}
