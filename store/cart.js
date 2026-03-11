/**
 * 购物车状态管理
 * 与 store/theme.js、store/user.js 保持一致的 reactive 模式
 */
import { reactive, computed } from 'vue'

const CART_STORAGE_KEY = 'eye2_cart_items'

// ============================================================
// 购物车响应式状态
// ============================================================
export const cartState = reactive({
	items: []
	// CartItem 结构：
	// {
	//   cart_item_id: string,    // 购物车行唯一ID
	//   product_id: string,      // 商品ID
	//   name: string,            // 商品名称
	//   spec: string,            // 规格（如"5ml×10支"）
	//   price: number,           // 单价（单位：分，¥1.00 = 100）
	//   quantity: number,        // 当前数量
	//   stock: number,           // 库存上限
	//   image_url: string,       // 商品图片
	//   is_prescription: boolean,// 是否处方药
	//   selected: boolean        // 是否被勾选
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

/** 已勾选商品总价（单位：分） */
export const totalPrice = computed(() =>
	selectedItems.value.reduce((sum, i) => sum + i.price * i.quantity, 0)
)

/** 是否全选 */
export const isAllSelected = computed(() =>
	cartState.items.length > 0 && cartState.items.every(i => i.selected)
)

// ============================================================
// 内部：持久化到本地存储
// ============================================================
function persist() {
	try {
		uni.setStorageSync(CART_STORAGE_KEY, JSON.stringify(cartState.items))
	} catch (e) {
		console.error('[cart] 持久化失败:', e)
	}
}

// ============================================================
// Actions
// ============================================================

/**
 * 初始化：从本地存储恢复购物车数据
 * 在 App.vue onLaunch 或订单页 onLoad 中调用
 */
export function initCart() {
	try {
		const raw = uni.getStorageSync(CART_STORAGE_KEY)
		if (raw) {
			const parsed = JSON.parse(raw)
			if (Array.isArray(parsed)) {
				cartState.items = parsed
			}
		}
	} catch (e) {
		cartState.items = []
	}
}

/**
 * 加入购物车
 * 若该商品已存在则叠加数量，否则新增（默认选中）
 * @param {Object} product - 商品信息（需含 product_id、name、spec、price、stock、image_url、is_prescription）
 */
export function addItem(product) {
	const exist = cartState.items.find(i => i.product_id === product.product_id)
	if (exist) {
		exist.quantity = Math.min(exist.quantity + 1, exist.stock || 99)
	} else {
		cartState.items.push({
			cart_item_id: 'ci_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
			product_id: product.product_id,
			name: product.name,
			spec: product.spec || '',
			price: product.price,
			quantity: 1,
			stock: product.stock || 99,
			image_url: product.image_url || '/static/medicine.svg',
			is_prescription: product.is_prescription || false,
			selected: true
		})
	}
	persist()
}

/**
 * 删除购物车商品
 * @param {string} cart_item_id
 */
export function removeItem(cart_item_id) {
	const idx = cartState.items.findIndex(i => i.cart_item_id === cart_item_id)
	if (idx !== -1) {
		cartState.items.splice(idx, 1)
		persist()
	}
}

/**
 * 更新数量（增量方式，delta 可为正/负）
 * 若数量降至 0 则自动删除该商品
 * @param {string} cart_item_id
 * @param {number} delta - 变化量（+1 或 -1）
 */
export function updateQuantity(cart_item_id, delta) {
	const item = cartState.items.find(i => i.cart_item_id === cart_item_id)
	if (!item) return
	const next = item.quantity + delta
	if (next <= 0) {
		removeItem(cart_item_id)
		return
	}
	item.quantity = Math.min(next, item.stock || 99)
	persist()
}

/**
 * 切换单个商品的选中状态
 * @param {string} cart_item_id
 */
export function toggleSelect(cart_item_id) {
	const item = cartState.items.find(i => i.cart_item_id === cart_item_id)
	if (item) {
		item.selected = !item.selected
		persist()
	}
}

/**
 * 全选/取消全选
 * @param {boolean} val
 */
export function selectAll(val) {
	cartState.items.forEach(i => { i.selected = val })
	persist()
}

/**
 * 清空购物车（全部删除）
 */
export function clearCart() {
	cartState.items = []
	persist()
}

/**
 * 删除已选中商品
 */
export function clearSelected() {
	cartState.items = cartState.items.filter(i => !i.selected)
	persist()
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
