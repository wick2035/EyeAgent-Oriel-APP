/**
 * 购物车状态管理（API 驱动）
 * 与 store/theme.js、store/user.js 保持一致的 reactive 模式
 */
import { reactive, computed } from 'vue'
import { getCartList, addCartItem, updateCartQuantity, removeCartItems } from '@/utils/api/cart.js'

// ============================================================
// 购物车响应式状态
// ============================================================
export const cartState = reactive({
	items: [],
	loading: false
	// CartItem 结构：
	// {
	//   cart_item_id: string,    // 购物车项 ID（对应 API id）
	//   product_id: string,      // 药品 ID（对应 API drugId）
	//   name: string,            // 药品名称（对应 API drugName）
	//   spec: string,            // 规格（对应 API drugSpecification）
	//   price: number,           // 单价（单位：元）
	//   quantity: number,        // 当前数量
	//   stock: number,           // 库存上限（对应 API stockQuantity）
	//   image_url: string,       // 商品图片（前端默认值）
	//   is_prescription: boolean,// 是否处方药（对应 API isPrescriptionDrug）
	//   selected: boolean        // 是否被勾选（纯前端状态）
	// }
})

// ============================================================
// Computed（响应式派生状态）
// ============================================================

/** 购物车总件数（用于导航栏角标） */
export const totalCount = computed(() =>
	cartState.items.reduce((sum, item) => sum + item.quantity, 0)
)

/** 已勾选商品列表 */
export const selectedItems = computed(() =>
	cartState.items.filter(i => i.selected)
)

/** 已勾选商品总价（单位：元） */
export const totalPrice = computed(() =>
	selectedItems.value.reduce((sum, i) => sum + i.price * i.quantity, 0)
)

/** 是否全选 */
export const isAllSelected = computed(() =>
	cartState.items.length > 0 && cartState.items.every(i => i.selected)
)

// ============================================================
// 内部：API 字段映射
// ============================================================
function mapCartItemFromApi(apiItem) {
	return {
		cart_item_id: apiItem.id,
		product_id: apiItem.drugId,
		name: apiItem.drugName,
		spec: apiItem.drugSpecification || '',
		price: apiItem.price,
		quantity: apiItem.quantity,
		stock: apiItem.stockQuantity || 99,
		image_url: '/static/medicine.svg',
		is_prescription: apiItem.isPrescriptionDrug || false,
		selected: true
	}
}

// ============================================================
// Actions
// ============================================================

/**
 * 初始化：从 API 加载购物车数据
 */
export async function initCart() {
	cartState.loading = true
	try {
		const res = await getCartList()
		if (res.code === 200 && Array.isArray(res.data)) {
			// 保留已有的选中状态
			const oldSelectionMap = {}
			cartState.items.forEach(item => {
				oldSelectionMap[item.cart_item_id] = item.selected
			})
			cartState.items = res.data.map(apiItem => {
				const mapped = mapCartItemFromApi(apiItem)
				// 恢复之前的选中状态（如果存在）
				if (oldSelectionMap[mapped.cart_item_id] !== undefined) {
					mapped.selected = oldSelectionMap[mapped.cart_item_id]
				}
				return mapped
			})
		}
	} catch (e) {
		console.error('[cart] 加载购物车失败:', e)
	} finally {
		cartState.loading = false
	}
}

/**
 * 加入购物车
 * @param {Object} product - 需含 product_id（drugId）
 * @param {number} [quantity=1] - 数量
 */
export async function addItem(product, quantity = 1) {
	try {
		const drugId = product.product_id || product.drugId
		const res = await addCartItem(drugId, quantity)
		if (res.code === 200) {
			await initCart()
		} else {
			uni.showToast({ title: res.msg || '加入购物车失败', icon: 'none' })
		}
		return res
	} catch (e) {
		console.error('[cart] 加入购物车失败:', e)
		uni.showToast({ title: '加入购物车失败', icon: 'none' })
	}
}

/**
 * 删除购物车商品
 * @param {string} cart_item_id
 */
export async function removeItem(cart_item_id) {
	try {
		const res = await removeCartItems([cart_item_id])
		if (res.code === 200) {
			const idx = cartState.items.findIndex(i => i.cart_item_id === cart_item_id)
			if (idx !== -1) cartState.items.splice(idx, 1)
		} else {
			uni.showToast({ title: res.msg || '删除失败', icon: 'none' })
		}
	} catch (e) {
		console.error('[cart] 删除失败:', e)
	}
}

/**
 * 更新数量（增量方式，delta 可为正/负）
 * @param {string} cart_item_id
 * @param {number} delta - 变化量（+1 或 -1）
 */
export async function updateQuantity(cart_item_id, delta) {
	const item = cartState.items.find(i => i.cart_item_id === cart_item_id)
	if (!item) return
	const newQty = item.quantity + delta
	if (newQty <= 0) {
		await removeItem(cart_item_id)
		return
	}
	const clampedQty = Math.min(newQty, item.stock || 99)
	// 乐观更新
	const oldQty = item.quantity
	item.quantity = clampedQty
	try {
		const res = await updateCartQuantity(cart_item_id, clampedQty)
		if (res.code !== 200) {
			item.quantity = oldQty
			uni.showToast({ title: res.msg || '修改数量失败', icon: 'none' })
		}
	} catch (e) {
		item.quantity = oldQty
		console.error('[cart] 修改数量失败:', e)
	}
}

/**
 * 切换单个商品的选中状态（纯前端）
 * @param {string} cart_item_id
 */
export function toggleSelect(cart_item_id) {
	const item = cartState.items.find(i => i.cart_item_id === cart_item_id)
	if (item) item.selected = !item.selected
}

/**
 * 全选/取消全选（纯前端）
 * @param {boolean} val
 */
export function selectAll(val) {
	cartState.items.forEach(i => { i.selected = val })
}

/**
 * 清空购物车（全部删除）
 */
export async function clearCart() {
	const allIds = cartState.items.map(i => i.cart_item_id)
	if (allIds.length === 0) return
	try {
		const res = await removeCartItems(allIds)
		if (res.code === 200) {
			cartState.items = []
		} else {
			uni.showToast({ title: res.msg || '清空失败', icon: 'none' })
		}
	} catch (e) {
		console.error('[cart] 清空失败:', e)
	}
}

/**
 * 删除已选中商品
 */
export async function clearSelected() {
	const selectedIds = cartState.items.filter(i => i.selected).map(i => i.cart_item_id)
	if (selectedIds.length === 0) return
	try {
		const res = await removeCartItems(selectedIds)
		if (res.code === 200) {
			cartState.items = cartState.items.filter(i => !i.selected)
		} else {
			uni.showToast({ title: res.msg || '删除失败', icon: 'none' })
		}
	} catch (e) {
		console.error('[cart] 删除选中失败:', e)
	}
}

export default {
	cartState,
	totalCount,
	selectedItems,
	totalPrice,
	isAllSelected,
	initCart,
	addItem,
	removeItem,
	updateQuantity,
	toggleSelect,
	selectAll,
	clearCart,
	clearSelected
}
