/**
 * 订单 API 模块
 */
import { get, post } from './request.js'

/**
 * 获取订单列表
 * @param {string} status - '' | 'PENDING_PAYMENT' | 'PAID' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED'
 * @param {number} pageNum
 * @param {number} pageSize
 * @returns {Promise<{code, msg, data: OrderListVO[], total, pageNum, pages}>}
 */
export async function getOrderList(status = '', pageNum = 1, pageSize = 10) {
	try {
		const params = { pageNum, pageSize }
		if (status) params.status = status
		return await get('/api/app/order/list', params)
	} catch (e) {
		return { code: 500, msg: e.message, data: [], total: 0 }
	}
}

/**
 * 获取订单详情
 * @param {string} orderId
 * @returns {Promise<{code, msg, data: OrderDetailVO}>}
 */
export async function getOrderDetail(orderId) {
	try {
		return await get('/api/app/order/detail', { orderId })
	} catch (e) {
		return { code: 500, msg: e.message, data: null }
	}
}

/**
 * 从购物车创建订单
 * @param {string[]} cartItemIds - 选中的购物车项 ID 列表
 * @param {string} [remark] - 订单备注
 */
export async function createOrderFromCart(cartItemIds, remark) {
	try {
		const body = { cartItemIds }
		if (remark) body.remark = remark
		return await post('/api/app/order/create-from-cart', body)
	} catch (e) {
		return { code: 500, msg: e.message, data: null }
	}
}

/**
 * 支付订单（模拟支付）
 * @param {string} orderId
 */
export async function payOrder(orderId) {
	try {
		return await post('/api/app/order/pay?orderId=' + orderId)
	} catch (e) {
		return { code: 500, msg: e.message, data: null }
	}
}

/**
 * 取消订单
 * @param {string} orderId
 */
export async function cancelOrder(orderId) {
	try {
		return await post('/api/app/order/cancel?orderId=' + orderId)
	} catch (e) {
		return { code: 500, msg: e.message }
	}
}

/**
 * 确认收货
 * @param {string} orderId
 */
export async function confirmReceive(orderId) {
	try {
		return await post('/api/app/order/confirm-receive?orderId=' + orderId)
	} catch (e) {
		return { code: 500, msg: e.message }
	}
}

export default {
	getOrderList,
	getOrderDetail,
	createOrderFromCart,
	payOrder,
	cancelOrder,
	confirmReceive
}
