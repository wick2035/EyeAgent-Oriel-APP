/**
 * 订单 API 模块
 * USE_MOCK = true  → 使用本地模拟数据（开发/演示）
 * USE_MOCK = false → 调用真实后端接口
 */
import { get, post } from './request.js'

// ============================================================
// 模式开关：改为 false 即启用真实 API
// ============================================================
const USE_MOCK = true

// ============================================================
// 模拟数据（5条，覆盖所有状态）
// ============================================================
const MOCK_ORDERS = [
	{
		order_id: 'EYE20250309001',
		order_no: 'EYE20250309001',
		created_at: '2025-03-09 14:32',
		status: 'pending_pay',
		total_amount: 8800, // 分，¥88.00
		address_id: null,
		payment_method: null,
		items: [
			{
				product_id: 'P001',
				name: '玻璃酸钠滴眼液',
				spec: '0.1% 5ml×10支',
				price: 5800,
				quantity: 1,
				image_url: '/static/medicine.svg',
				is_prescription: false
			},
			{
				product_id: 'P002',
				name: '氧氟沙星眼膏',
				spec: '3.5g/支',
				price: 3000,
				quantity: 1,
				image_url: '/static/medicine.svg',
				is_prescription: true
			}
		]
	},
	{
		order_id: 'EYE20250307002',
		order_no: 'EYE20250307002',
		created_at: '2025-03-07 10:15',
		status: 'completed',
		total_amount: 13600,
		address_id: 'addr_001',
		payment_method: 'wechat',
		items: [
			{
				product_id: 'P003',
				name: '海昌隐形眼镜护理液',
				spec: '360ml/瓶',
				price: 6800,
				quantity: 2,
				image_url: '/static/medicine.svg',
				is_prescription: false
			}
		]
	},
	{
		order_id: 'EYE20250305003',
		order_no: 'EYE20250305003',
		created_at: '2025-03-05 09:08',
		status: 'refunding',
		total_amount: 3200,
		address_id: 'addr_001',
		payment_method: 'wechat',
		items: [
			{
				product_id: 'P004',
				name: '蒸汽热敷眼贴',
				spec: '10片/盒',
				price: 3200,
				quantity: 1,
				image_url: '/static/medicine.svg',
				is_prescription: false
			}
		]
	},
	{
		order_id: 'EYE20250301004',
		order_no: 'EYE20250301004',
		created_at: '2025-03-01 16:45',
		status: 'completed',
		total_amount: 22000,
		address_id: 'addr_001',
		payment_method: 'alipay',
		items: [
			{
				product_id: 'P005',
				name: '硫酸阿托品眼用凝胶',
				spec: '1% 5g/支',
				price: 11000,
				quantity: 2,
				image_url: '/static/medicine.svg',
				is_prescription: true
			}
		]
	},
	{
		order_id: 'EYE20250225005',
		order_no: 'EYE20250225005',
		created_at: '2025-02-25 11:20',
		status: 'refunded',
		total_amount: 4500,
		address_id: 'addr_001',
		payment_method: 'wechat',
		items: [
			{
				product_id: 'P006',
				name: '儿童近视防控眼贴',
				spec: '5片/包',
				price: 4500,
				quantity: 1,
				image_url: '/static/medicine.svg',
				is_prescription: false
			}
		]
	}
]

function mockDelay(ms = 400) {
	return new Promise(resolve => setTimeout(resolve, ms))
}

// ============================================================
// 1. 获取订单列表
// ============================================================
/**
 * @param {string} status - '' | 'pending_pay' | 'completed' | 'refund'
 * @param {number} page
 * @param {number} pageSize
 * @returns {{ code, data: { list, total, counts: { pending_pay, refund } } }}
 */
export async function getOrderList(status = '', page = 1, pageSize = 10) {
	if (USE_MOCK) {
		await mockDelay()
		let list = MOCK_ORDERS
		if (status === 'refund') {
			list = MOCK_ORDERS.filter(o => ['refunding', 'refunded'].includes(o.status))
		} else if (status) {
			list = MOCK_ORDERS.filter(o => o.status === status)
		}
		const start = (page - 1) * pageSize
		const pageList = list.slice(start, start + pageSize)
		const counts = {
			pending_pay: MOCK_ORDERS.filter(o => o.status === 'pending_pay').length,
			refund: MOCK_ORDERS.filter(o => ['refunding', 'refunded'].includes(o.status)).length
		}
		return { code: 200, msg: 'ok', data: { list: pageList, total: list.length, counts } }
	}
	try {
		return await get('/api/app/order/list', { status, page, pageSize })
	} catch (e) {
		return { code: 500, msg: e.message, data: { list: [], total: 0, counts: {} } }
	}
}

// ============================================================
// 2. 获取订单详情
// ============================================================
/**
 * @param {string} orderId
 */
export async function getOrderDetail(orderId) {
	if (USE_MOCK) {
		await mockDelay(200)
		const order = MOCK_ORDERS.find(o => o.order_id === orderId) || null
		return order
			? { code: 200, msg: 'ok', data: order }
			: { code: 404, msg: '订单不存在', data: null }
	}
	try {
		return await get('/api/app/order/detail', { orderId })
	} catch (e) {
		return { code: 500, msg: e.message, data: null }
	}
}

// ============================================================
// 3. 创建订单（从购物车结算）
// ============================================================
/**
 * @param {Array} cartItems - 已选中的购物车商品
 * @param {string} addressId
 */
export async function createOrder(cartItems, addressId) {
	if (USE_MOCK) {
		await mockDelay(600)
		const newOrder = {
			order_id: 'EYE' + Date.now(),
			order_no: 'EYE' + Date.now(),
			created_at: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
			status: 'pending_pay',
			items: cartItems.map(i => ({
				product_id: i.product_id,
				name: i.name,
				spec: i.spec,
				price: i.price,
				quantity: i.quantity,
				image_url: i.image_url,
				is_prescription: i.is_prescription || false
			})),
			total_amount: cartItems.reduce((s, i) => s + i.price * i.quantity, 0),
			address_id: addressId,
			payment_method: null
		}
		MOCK_ORDERS.unshift(newOrder)
		return { code: 200, msg: '下单成功', data: { order_id: newOrder.order_id } }
	}
	try {
		return await post('/api/app/order/create', { cartItems, addressId })
	} catch (e) {
		return { code: 500, msg: e.message, data: null }
	}
}

// ============================================================
// 4. 取消订单
// ============================================================
/**
 * @param {string} orderId
 */
export async function cancelOrder(orderId) {
	if (USE_MOCK) {
		await mockDelay(300)
		const order = MOCK_ORDERS.find(o => o.order_id === orderId)
		if (order && order.status === 'pending_pay') {
			order.status = 'cancelled'
		}
		return { code: 200, msg: '订单已取消' }
	}
	try {
		return await post('/api/app/order/cancel', { orderId })
	} catch (e) {
		return { code: 500, msg: e.message }
	}
}

// ============================================================
// 5. 支付订单
// ============================================================
/**
 * @param {string} orderId
 * @param {string} paymentMethod - 'wechat' | 'alipay'
 */
export async function payOrder(orderId, paymentMethod = 'wechat') {
	if (USE_MOCK) {
		await mockDelay(800)
		const order = MOCK_ORDERS.find(o => o.order_id === orderId)
		if (order) {
			order.status = 'completed'
			order.payment_method = paymentMethod
		}
		return { code: 200, msg: '支付成功', data: { pay_url: '' } }
	}
	try {
		return await post('/api/app/order/pay', { orderId, paymentMethod })
	} catch (e) {
		return { code: 500, msg: e.message, data: null }
	}
}

// ============================================================
// 6. 申请退款/售后
// ============================================================
/**
 * @param {string} orderId
 * @param {string} reason - 退款原因
 */
export async function applyRefund(orderId, reason) {
	if (USE_MOCK) {
		await mockDelay(400)
		const order = MOCK_ORDERS.find(o => o.order_id === orderId)
		if (order) order.status = 'refunding'
		return { code: 200, msg: '退款申请已提交，预计1-3个工作日到账' }
	}
	try {
		return await post('/api/app/order/refund/apply', { orderId, reason })
	} catch (e) {
		return { code: 500, msg: e.message }
	}
}

// ============================================================
// 7. 查询退款进度
// ============================================================
/**
 * @param {string} orderId
 */
export async function getRefundStatus(orderId) {
	if (USE_MOCK) {
		await mockDelay(200)
		const order = MOCK_ORDERS.find(o => o.order_id === orderId)
		const isRefunded = order?.status === 'refunded'
		return {
			code: 200,
			msg: 'ok',
			data: {
				status: order?.status || 'refunding',
				progress: [
					{ step: '提交申请', done: true,       time: '2025-03-05 09:08' },
					{ step: '平台审核', done: true,       time: '2025-03-05 11:30' },
					{ step: '退款到账', done: isRefunded, time: isRefunded ? '2025-03-07 09:00' : null }
				]
			}
		}
	}
	try {
		return await get('/api/app/order/refund/status', { orderId })
	} catch (e) {
		return { code: 500, msg: e.message, data: null }
	}
}

export default {
	getOrderList,
	getOrderDetail,
	createOrder,
	cancelOrder,
	payOrder,
	applyRefund,
	getRefundStatus
}
