/**
 * 购物车 API 模块
 */
import { get, post, put, del } from './request.js'

/**
 * 获取购物车列表
 * @returns {Promise<{code, msg, data: CartItemVO[]}>}
 */
export async function getCartList() {
	try {
		return await get('/api/app/cart/list')
	} catch (e) {
		return { code: 500, msg: e.message, data: [] }
	}
}

/**
 * 加入购物车（同药品自动合并数量）
 * @param {string} drugId - 药品 ID（UUID 主键）
 * @param {number} quantity - 数量，最小值 1
 */
export async function addCartItem(drugId, quantity = 1) {
	try {
		return await post('/api/app/cart/add', { drugId, quantity })
	} catch (e) {
		return { code: 500, msg: e.message, data: null }
	}
}

/**
 * 修改购物车数量（绝对值）
 * @param {string} cartItemId - 购物车项 ID
 * @param {number} quantity - 新数量，最小值 1
 */
export async function updateCartQuantity(cartItemId, quantity) {
	try {
		return await put('/api/app/cart/update-quantity', { cartItemId, quantity })
	} catch (e) {
		return { code: 500, msg: e.message, data: null }
	}
}

/**
 * 批量删除购物车项
 * @param {string[]} cartItemIds - 要删除的购物车项 ID 列表
 */
export async function removeCartItems(cartItemIds) {
	try {
		return await del('/api/app/cart/remove', { cartItemIds })
	} catch (e) {
		return { code: 500, msg: e.message, data: null }
	}
}

/**
 * 获取购物车商品数量（用于角标）
 * @returns {Promise<{code, msg, data: number}>}
 */
export async function getCartCount() {
	try {
		return await get('/api/app/cart/count')
	} catch (e) {
		return { code: 500, msg: e.message, data: 0 }
	}
}
