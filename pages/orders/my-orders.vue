<template>
	<view class="page" :class="{ 'page--dark': isDark }">

		<!-- ①固定头部：状态栏占位 + 导航栏 + Tab栏 -->
		<view class="fixed-header" :style="{ paddingTop: statusBarHeight + 'px' }">
			<!-- 导航栏 -->
			<view class="navbar">
				<view class="navbar__back" @click="goBack">
					<view class="back-icon"></view>
				</view>
				<text class="navbar__title">我的订单</text>
				<!-- 购物车入口：CSS图标 + 数量角标 -->
				<view class="navbar__cart" @click="openCart">
					<view class="cart-icon-wrap">
						<image class="cart-icon-img" src="/static/shop.svg" mode="aspectFit" />
						<view v-if="cartBadge > 0" class="cart-badge">
							<text class="cart-badge__text">{{ cartBadge > 99 ? '99+' : cartBadge }}</text>
						</view>
					</view>
				</view>
			</view>

			<!-- Tab筛选栏 -->
			<view class="tabs-wrapper">
				<view class="tabs__track">
					<view
						v-for="(tab, index) in tabs"
						:key="index"
						class="tabs__item"
						:class="{ 'tabs__item--active': currentTab === index }"
						@click="switchTab(index)"
					>
						<text>{{ tab.label }}</text>
						<!-- 数量角标：非激活且 count > 0 时显示 -->
						<view v-if="tab.count > 0 && currentTab !== index" class="tabs__badge">
							<text class="tabs__badge-text">{{ tab.count > 9 ? '9+' : tab.count }}</text>
						</view>
						<view v-if="currentTab === index" class="tabs__indicator"></view>
					</view>
				</view>
			</view>
		</view>

		<!-- ②头部占位（与固定头部实际高度保持一致） -->
		<view class="header-placeholder" :style="{ height: headerHeight + 'px' }"></view>

		<!-- ③订单列表 -->
		<scroll-view class="order-list" scroll-y :style="{ height: (windowHeight - headerHeight) + 'px' }" @scrolltolower="loadMore">

			<!-- 骨架屏 -->
			<view v-if="loading && currentList.length === 0" class="skeleton-list">
				<view v-for="i in 3" :key="i" class="skeleton-card">
					<view class="skeleton-card__header"></view>
					<view class="skeleton-card__body">
						<view class="skeleton-card__img"></view>
						<view class="skeleton-card__lines">
							<view class="skeleton-line skeleton-line--lg"></view>
							<view class="skeleton-line skeleton-line--sm"></view>
						</view>
					</view>
					<view class="skeleton-card__footer"></view>
				</view>
			</view>

			<template v-else>
				<!-- 订单卡片列表 -->
				<view
					v-for="(order, index) in currentList"
					:key="order.order_id"
					class="order-card-wrap"
					:style="{ animationDelay: Math.min(index * 50, 200) + 'ms' }"
				>
					<view
						class="order-card"
						@click="handleDetail(order)"
					>
						<!-- 卡片头部：订单号 + 时间 + 状态 -->
						<view class="order-card__header">
							<view class="order-card__header-left">
								<image class="shop-icon" src="/static/shopbag.svg" mode="aspectFit"></image>
								<text class="order-card__no">{{ order.order_no }}</text>
							</view>
							<view class="order-card__status" :class="'order-card__status--' + order.status">
								<text>{{ getStatusText(order.status) }}</text>
							</view>
						</view>

						<!-- 商品列表（最多展示2件） -->
						<view class="order-card__items">
							<view
								v-for="(item, idx) in order.items.slice(0, 2)"
								:key="item.product_id + '_' + idx"
								class="order-item"
							>
								<!-- 商品信息 -->
								<view class="order-item__info">
									<view class="order-item__name-row">
										<text class="order-item__name">{{ item.name }}</text>
										<view v-if="item.is_prescription" class="rx-badge rx-badge--xs">Rx</view>
									</view>
									<text class="order-item__spec">{{ item.spec }}</text>
								</view>
								<!-- 数量 + 单价 -->
								<view class="order-item__price-wrap">
									<text class="order-item__qty">×{{ item.quantity }}</text>
									<text class="order-item__price">¥{{ formatPrice(item.price) }}</text>
								</view>
							</view>

							<!-- 超出2件时显示提示 -->
							<view v-if="order.items.length > 2" class="order-items-more">
								<text>等{{ order.items.length }}件商品 →</text>
							</view>
						</view>

						<!-- 合计行 -->
						<view class="order-card__total">
							<text class="order-card__total-count">共{{ getTotalQty(order) }}件</text>
							<view class="order-card__total-right">
								<text class="order-card__total-label">合计：</text>
								<text class="order-card__total-symbol">¥</text>
								<text class="order-card__total-amount">{{ formatPrice(order.total_amount) }}</text>
							</view>
						</view>

						<!-- 操作按钮区 -->
						<view class="order-card__actions">
							<!-- 待付款 -->
							<template v-if="order.status === 'pending_pay'">
								<view class="action-btn action-btn--ghost" @click.stop="handleCancel(order)">
									取消订单
								</view>
								<view class="action-btn action-btn--primary" @click.stop="handlePay(order)">
									立即付款
    <TopNotificationBar />
								</view>
							</template>

							<!-- 已完成 -->
							<template v-else-if="order.status === 'completed'">
								<view class="action-btn action-btn--ghost" @click.stop="handleDetail(order)">
									查看详情
								</view>
								<view class="action-btn action-btn--primary" @click.stop="handleRebuy(order)">
									再次购买
								</view>
							</template>

							<!-- 退款中 / 已退款 -->
							<template v-else-if="order.status === 'refunding' || order.status === 'refunded'">
								<view class="action-btn action-btn--ghost" @click.stop="handleRefundProgress(order)">
									{{ order.status === 'refunding' ? '查看退款进度' : '退款详情' }}
								</view>
							</template>
						</view>
					</view>
				</view>

				<!-- 空状态 -->
				<view v-if="!loading && currentList.length === 0" class="empty-state">
					<view class="empty-state__icon">
						<image class="empty-state__img" src="/static/E-car.svg" mode="aspectFit" />
					</view>
					<text class="empty-state__title">暂无{{ tabs[currentTab].emptyText }}</text>
					<text class="empty-state__desc">快去选购眼科健康产品吧</text>
				</view>

				<!-- 已加载全部 -->
				<view v-if="noMore && currentList.length > 0" class="list-end">
					<text class="list-end__text">— 已加载全部 —</text>
				</view>
			</template>

			<view class="safe-area"></view>
		</scroll-view>

		<!-- ④购物车底部抽屉覆盖层 -->
		<view v-if="renderDrawer" class="cart-overlay">
			<!-- 背景遮罩 -->
			<view
				class="cart-mask"
				:class="{ 'cart-mask--open': cartOpen }"
				@click="closeCart"
			></view>

			<!-- 抽屉主体 -->
			<view class="cart-drawer" :class="{ 'cart-drawer--open': cartOpen }">

				<!-- 拖拽把手 -->
				<view class="cart-drawer__handle">
					<view class="handle-bar"></view>
				</view>

				<!-- 抽屉头部 -->
				<view class="cart-drawer__header">
					<text class="cart-drawer__title">购物车</text>
					<text class="cart-drawer__count">{{ cartItems.length }}件商品</text>
					<view
						v-if="cartItems.length > 0"
						class="cart-drawer__clear"
						@click="handleClearCart"
					>
						<text>清空</text>
					</view>
				</view>

				<!-- 有商品时 -->
				<template v-if="cartItems.length > 0">
					<!-- 商品列表（可滚动） -->
					<scroll-view class="cart-drawer__list" scroll-y>
						<view
							v-for="item in cartItems"
							:key="item.cart_item_id"
							class="cart-item"
							:class="{ 'cart-item--removing': removingId === item.cart_item_id }"
						>
							<!-- 复选框 -->
							<view
								class="cart-item__check"
								:class="{ 'cart-item__check--checked': item.selected }"
								@click="toggleSelect(item.cart_item_id)"
							>
								<view v-if="item.selected" class="check-tick"></view>
							</view>

							<!-- 商品图片 -->
							<view class="cart-item__img-wrap">
								<image
									class="cart-item__img"
									:src="item.image_url"
									mode="aspectFill"
								/>
								<view v-if="item.is_prescription" class="rx-badge rx-badge--xs">Rx</view>
							</view>

							<!-- 商品信息 -->
							<view class="cart-item__info">
								<text class="cart-item__name">{{ item.name }}</text>
								<text class="cart-item__spec">{{ item.spec }}</text>
								<!-- 价格 + 步进器 -->
								<view class="cart-item__bottom">
									<text class="cart-item__price">¥{{ formatPrice(item.price) }}</text>
									<view class="stepper">
										<view
											class="stepper__btn"
											:class="{ 'stepper__btn--disabled': item.quantity <= 1 }"
											@click="handleQuantity(item, -1)"
										>
											<text>－</text>
										</view>
										<text
											class="stepper__num"
											:class="{ 'stepper__num--bounce': bounceItemId === item.cart_item_id }"
										>{{ item.quantity }}</text>
										<view
											class="stepper__btn"
											:class="{ 'stepper__btn--disabled': item.quantity >= (item.stock || 99) }"
											@click="handleQuantity(item, 1)"
										>
											<text>＋</text>
										</view>
									</view>
								</view>
							</view>

							<!-- 删除按钮 -->
							<view class="cart-item__delete" @click="handleDeleteItem(item.cart_item_id)">
								<view class="delete-icon"></view>
							</view>
						</view>
					</scroll-view>

					<!-- 底部工具栏 -->
					<view class="cart-footer">
						<!-- 全选 -->
						<view class="footer-select" @click="handleSelectAll">
							<view class="footer-checkbox" :class="{ 'footer-checkbox--checked': cartAllSelected }">
								<view v-if="cartAllSelected" class="check-tick check-tick--sm"></view>
							</view>
							<text class="footer-select__label">全选</text>
						</view>

						<!-- 合计 -->
						<view class="footer-summary">
							<text class="footer-summary__count">已选{{ cartSelectedCount }}件</text>
							<view class="footer-summary__price">
								<text class="footer-summary__label">合计 </text>
								<text class="footer-summary__symbol">¥</text>
								<text class="footer-summary__amount">{{ formatPrice(cartTotalPrice) }}</text>
							</view>
						</view>

						<!-- 去结算按钮 -->
						<view
							class="footer-checkout"
							:class="{ 'footer-checkout--disabled': cartSelectedCount === 0 }"
							@click="handleCheckout"
						>
							<text class="footer-checkout__text">
								去结算{{ cartSelectedCount > 0 ? '(' + cartSelectedCount + ')' : '' }}
							</text>
						</view>
					</view>
				</template>

				<!-- 空购物车 -->
				<view v-else class="cart-empty">
					<view class="cart-empty__icon">
						<image class="cart-empty__img" src="/static/E-car.svg" mode="aspectFit" />
					</view>
					<text class="cart-empty__title">购物车还是空的</text>
					<text class="cart-empty__desc">精选眼科健康产品等你来选</text>
					<view class="cart-empty__btn" @click="goShop">
						<text class="cart-empty__btn-text">去选药品</text>
					</view>
				</view>

			</view>
		</view>

		<!-- ⑤顶部通知栏 -->
	</view>
</template>

<script>
import { isDarkMode } from '@/store/theme.js'
import {
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
	clearCart
} from '@/store/cart.js'
import { getOrderList, cancelOrder } from '@/utils/api/order.js'

export default {
	data() {
		return {
			statusBarHeight: 44,
			headerHeight: 0,
			windowHeight: 0,
			currentTab: 0,
			tabs: [
				{ label: '全部',      key: 'all',        count: 0, emptyText: '订单记录' },
				{ label: '待付款',    key: 'pending_pay', count: 0, emptyText: '待付款订单' },
				{ label: '已完成',    key: 'completed',  count: 0, emptyText: '已完成订单' },
				{ label: '退款/售后', key: 'refund',     count: 0, emptyText: '退款记录' }
			],
			// 各 Tab 的订单缓存
			orderLists: { all: [], pending_pay: [], completed: [], refund: [] },
			loading: false,
			noMore: false,
			page: 1,
			pageSize: 10,
			// 购物车抽屉控制
			renderDrawer: false,  // 控制DOM存在（v-if）
			cartOpen: false,      // 控制打开动画（CSS class）
			// 购物车交互状态
			removingId: null,     // 正在删除动画的商品ID
			bounceItemId: null    // 正在弹跳动画的步进器ID
		}
	},

	computed: {
		isDark() {
			return isDarkMode()
		},
		currentList() {
			const key = this.tabs[this.currentTab].key
			return this.orderLists[key]
		},
		// ---- 购物车相关 computed ----
		cartBadge() {
			return totalCount.value
		},
		cartItems() {
			return cartState.items
		},
		cartSelectedCount() {
			return selectedItems.value.length
		},
		cartTotalPrice() {
			return totalPrice.value
		},
		cartAllSelected() {
			return isAllSelected.value
		}
	},

	onLoad() {
		this.getStatusBarHeight()
		initCart()
		this.loadData(true)
	},

	onReady() {
		this.$nextTick(() => {
			uni.createSelectorQuery()
				.in(this)
				.select('.fixed-header')
				.boundingClientRect(rect => {
					if (rect) this.headerHeight = rect.height
				})
				.exec()
		})
	},

	onShow() {
		// 每次进入刷新当前Tab（处理从付款页等返回的场景）
		if (this.orderLists[this.tabs[this.currentTab].key].length > 0) {
			this.loadData(true)
		}
	},

	methods: {
		getStatusBarHeight() {
			const sysInfo = uni.getSystemInfoSync()
			this.statusBarHeight = sysInfo.statusBarHeight || 44
			this.windowHeight = sysInfo.windowHeight || 667
		},

		// ============================================================
		// 订单列表
		// ============================================================
		async loadData(reset = false) {
			if (reset) {
				this.page = 1
				this.noMore = false
			}
			if (this.loading || this.noMore) return
			this.loading = true
			try {
				const key = this.tabs[this.currentTab].key
				const status = key === 'all' ? '' : key
				const res = await getOrderList(status, this.page, this.pageSize)
				if (res.code === 200) {
					const list = res.data.list || []
					if (reset) {
						this.orderLists[key] = list
					} else {
						this.orderLists[key].push(...list)
					}
					this.noMore = list.length < this.pageSize
					this.page++
					// 更新角标数
					const counts = res.data.counts || {}
					this.tabs[1].count = counts.pending_pay || 0
					this.tabs[3].count = counts.refund || 0
				}
			} catch (e) {
				console.error('[orders] 加载失败:', e)
			} finally {
				this.loading = false
			}
		},

		switchTab(index) {
			if (this.currentTab === index) return
			this.currentTab = index
			const key = this.tabs[index].key
			if (this.orderLists[key].length === 0) {
				this.loadData(true)
			}
		},

		loadMore() {
			this.loadData(false)
		},

		getStatusText(status) {
			const map = {
				pending_pay: '待付款',
				completed: '已完成',
				refunding: '退款中',
				refunded: '已退款',
				cancelled: '已取消'
			}
			return map[status] || status
		},

		getTotalQty(order) {
			return order.items.reduce((sum, i) => sum + i.quantity, 0)
		},

		formatPrice(fen) {
			if (typeof fen !== 'number') return '0.00'
			return (fen / 100).toFixed(2)
		},

		// ============================================================
		// 订单操作
		// ============================================================
		handlePay(order) {
			uni.showToast({ title: '跳转支付页（待接入）', icon: 'none' })
			// uni.navigateTo({ url: `/pages/orders/pay?orderId=${order.order_id}` })
		},

		handleCancel(order) {
			uni.showModal({
				title: '取消订单',
				content: '确认取消该订单吗？取消后不可恢复。',
				confirmText: '确认取消',
				confirmColor: '#EF4444',
				success: async ({ confirm }) => {
					if (!confirm) return
					const res = await cancelOrder(order.order_id)
					if (res.code === 200) {
						uni.showToast({ title: '订单已取消', icon: 'success' })
						this.loadData(true)
					} else {
						uni.showToast({ title: res.msg || '操作失败', icon: 'none' })
					}
				}
			})
		},

		handleRebuy(order) {
			order.items.forEach(item => {
				addItem({
					product_id: item.product_id,
					name: item.name,
					spec: item.spec,
					price: item.price,
					stock: 99,
					image_url: item.image_url,
					is_prescription: item.is_prescription || false
				})
			})
			uni.showToast({ title: '已加入购物车', icon: 'success' })
			setTimeout(() => this.openCart(), 600)
		},

		handleDetail(order) {
			uni.showToast({ title: '订单详情（待接入）', icon: 'none' })
			// uni.setStorageSync('tempOrderDetail', JSON.stringify(order))
			// uni.navigateTo({ url: `/pages/orders/order-detail?id=${order.order_id}` })
		},

		handleRefundProgress(order) {
			uni.showToast({ title: '退款进度（待接入）', icon: 'none' })
			// uni.navigateTo({ url: `/pages/orders/refund-progress?id=${order.order_id}` })
		},

		goBack() {
			uni.navigateBack()
		},

		// ============================================================
		// 购物车抽屉
		// ============================================================
		openCart() {
			this.renderDrawer = true
			this.$nextTick(() => {
				setTimeout(() => {
					this.cartOpen = true
				}, 16)
			})
		},

		closeCart() {
			this.cartOpen = false
			setTimeout(() => {
				this.renderDrawer = false
			}, 320)
		},

		handleCheckout() {
			if (this.cartSelectedCount === 0) {
				uni.showToast({ title: '请先选择商品', icon: 'none' })
				return
			}
			this.closeCart()
			uni.showToast({ title: '结算页（待接入）', icon: 'none' })
			// uni.navigateTo({ url: '/pages/orders/checkout' })
		},

		goShop() {
			this.closeCart()
			setTimeout(() => {
				uni.switchTab({ url: '/pages/index/index' })
			}, 320)
		},

		// ============================================================
		// 购物车商品操作
		// ============================================================
		toggleSelect(cart_item_id) {
			toggleSelect(cart_item_id)
		},

		handleSelectAll() {
			selectAll(!this.cartAllSelected)
		},

		handleQuantity(item, delta) {
			updateQuantity(item.cart_item_id, delta)
			// 触发步进器弹跳动画
			this.bounceItemId = null
			this.$nextTick(() => {
				this.bounceItemId = item.cart_item_id
				clearTimeout(this._bounceTimer)
				this._bounceTimer = setTimeout(() => {
					this.bounceItemId = null
				}, 350)
			})
		},

		handleDeleteItem(cart_item_id) {
			this.removingId = cart_item_id
			setTimeout(() => {
				removeItem(cart_item_id)
				this.removingId = null
			}, 280)
		},

		handleClearCart() {
			uni.showModal({
				title: '清空购物车',
				content: '确认清空所有商品吗？',
				confirmText: '清空',
				confirmColor: '#EF4444',
				success: ({ confirm }) => {
					if (confirm) clearCart()
				}
			})
		}
	}
}
</script>

<style lang="scss" scoped>
// ============================================================
// 页面基础
// ============================================================
.page {
	display: flex;
	flex-direction: column;
	min-height: 100vh;
	background: $bg-base;
}

// ============================================================
// 固定头部
// ============================================================
.fixed-header {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	z-index: 100;
	background: $bg-base;
}

// 头部占位
.header-placeholder {
	flex-shrink: 0;
}

// ============================================================
// 导航栏
// ============================================================
.navbar {
	display: flex;
	align-items: center;
	height: 88rpx;
	padding: 0 $spacing-md;

	&__back {
		width: 72rpx;
		height: 72rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	&__title {
		flex: 1;
		text-align: center;
		font-size: $font-size-lg;
		font-weight: $font-weight-semibold;
		color: $text-primary;
	}

	&__cart {
		width: 72rpx;
		height: 72rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}
}

.back-icon {
	width: 20rpx;
	height: 20rpx;
	border-left: 4rpx solid $text-primary;
	border-bottom: 4rpx solid $text-primary;
	transform: rotate(45deg);
}

// 购物车图标（使用 E-car.svg）
.cart-icon-wrap {
	position: relative;
	width: 48rpx;
	height: 48rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.cart-icon-img {
	width: 44rpx;
	height: 44rpx;
	// 将 SVG 黑色线条映射到主文字色
	filter: brightness(0) saturate(100%);
	opacity: 0.75;
}

// 购物车角标
.cart-badge {
	position: absolute;
	top: -4rpx;
	right: -4rpx;
	min-width: 30rpx;
	height: 30rpx;
	padding: 0 6rpx;
	background: $color-accent;
	border-radius: $radius-full;
	display: flex;
	align-items: center;
	justify-content: center;
	animation: badge-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);

	&__text {
		font-size: 18rpx;
		color: #fff;
		font-weight: $font-weight-bold;
		line-height: 1;
	}
}

@keyframes badge-pop {
	0%   { transform: scale(0); opacity: 0; }
	70%  { transform: scale(1.2); opacity: 1; }
	100% { transform: scale(1); }
}

// ============================================================
// Tab切换栏（与 medical-records.vue 完全一致的结构）
// ============================================================
.tabs-wrapper {
	flex-shrink: 0;
	border-bottom: 2rpx solid $border-color-light;
}

.tabs__track {
	display: flex;
	width: 100%;
}

.tabs__item {
	flex: 1;
	position: relative;
	padding: $spacing-md 0;
	font-size: $font-size-sm;
	color: $text-secondary;
	text-align: center;
	transition: color 0.3s ease;

	&--active {
		color: $color-primary;
		font-weight: $font-weight-semibold;
	}
}

.tabs__indicator {
	position: absolute;
	bottom: 0;
	left: 50%;
	transform: translateX(-50%);
	width: 48rpx;
	height: 6rpx;
	background: linear-gradient(90deg, $color-primary, $color-primary-light);
	border-radius: 3rpx;
}

// Tab角标
.tabs__badge {
	position: absolute;
	top: 8rpx;
	right: 10rpx;
	min-width: 28rpx;
	height: 28rpx;
	padding: 0 6rpx;
	background: $color-accent;
	border-radius: $radius-full;
	display: flex;
	align-items: center;
	justify-content: center;

	&-text {
		font-size: 16rpx;
		color: #fff;
		font-weight: $font-weight-bold;
		line-height: 1;
	}
}

// ============================================================
// 订单列表
// ============================================================
.order-list {
	flex: 1;
}

// ============================================================
// 骨架屏
// ============================================================
.skeleton-list {
	padding: $spacing-md $spacing-lg;
	display: flex;
	flex-direction: column;
	gap: $spacing-md;
}

.skeleton-card {
	background: $bg-card;
	border-radius: $radius-lg;
	overflow: hidden;
	padding: $spacing-lg;

	&__header {
		height: 32rpx;
		background: $bg-elevated;
		border-radius: $radius-sm;
		margin-bottom: $spacing-lg;
		animation: skeleton-shimmer 1.5s infinite;
	}

	&__body {
		display: flex;
		gap: $spacing-md;
		margin-bottom: $spacing-md;
	}

	&__img {
		width: 96rpx;
		height: 96rpx;
		border-radius: $radius-md;
		background: $bg-elevated;
		flex-shrink: 0;
		animation: skeleton-shimmer 1.5s infinite;
	}

	&__lines {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: $spacing-sm;
		justify-content: center;
	}

	&__footer {
		height: 56rpx;
		background: $bg-elevated;
		border-radius: $radius-md;
		animation: skeleton-shimmer 1.5s infinite;
		margin-top: $spacing-sm;
	}
}

.skeleton-line {
	background: $bg-elevated;
	border-radius: $radius-sm;
	animation: skeleton-shimmer 1.5s infinite;

	&--lg {
		height: 28rpx;
		width: 70%;
	}

	&--sm {
		height: 22rpx;
		width: 45%;
	}
}

@keyframes skeleton-shimmer {
	0%, 100% { opacity: 0.6; }
	50% { opacity: 1; }
}

// ============================================================
// 订单卡片
// ============================================================
.order-card-wrap {
	padding: $spacing-sm $spacing-lg 0;
	animation: card-slide-in 0.35s ease-out backwards;
}

@keyframes card-slide-in {
	from {
		opacity: 0;
		transform: translateY(28rpx);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

.order-card {
	background: $bg-card;
	border-radius: $radius-lg;
	overflow: hidden;
	box-shadow: $shadow-sm;
	transition: transform 0.2s ease;
	margin-bottom: $spacing-sm;

	&:active {
		transform: scale(0.99);
	}

	// ---- 卡片头部 ----
	&__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: $spacing-md $spacing-lg;
		border-bottom: 1rpx solid $border-color-light;

		&-left {
			display: flex;
			align-items: center;
			gap: $spacing-xs;
		}
	}

	&__no {
		font-size: $font-size-xs;
		color: $text-muted;
		font-family: $font-family-mono;
	}

	// 状态标签
	&__status {
		font-size: 22rpx;
		font-weight: $font-weight-medium;
		padding: 6rpx 16rpx;
		border-radius: $radius-full;

		&--pending_pay {
			color: $color-primary;
			background: rgba(30, 58, 95, 0.08);
		}

		&--completed {
			color: $color-success;
			background: rgba(16, 185, 129, 0.08);
		}

		&--refunding {
			color: $color-warning;
			background: rgba(245, 158, 11, 0.08);
		}

		&--refunded {
			color: $text-muted;
			background: rgba(154, 171, 191, 0.08);
		}

		&--cancelled {
			color: $text-muted;
			background: rgba(154, 171, 191, 0.08);
		}
	}

	// ---- 商品列表 ----
	&__items {
		padding: $spacing-md $spacing-lg;
	}

	// ---- 合计行 ----
	&__total {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: $spacing-sm $spacing-lg $spacing-md;
		border-top: 1rpx solid $border-color-light;

		&-count {
			font-size: $font-size-xs;
			color: $text-muted;
		}

		&-right {
			display: flex;
			align-items: baseline;
			gap: 2rpx;
		}

		&-label {
			font-size: $font-size-sm;
			color: $text-secondary;
		}

		&-symbol {
			font-size: $font-size-sm;
			color: $color-accent;
			font-weight: $font-weight-semibold;
		}

		&-amount {
			font-size: $font-size-2xl;
			color: $color-accent;
			font-weight: $font-weight-bold;
			font-family: $font-family-mono;
			line-height: 1;
		}
	}

	// ---- 操作按钮区 ----
	&__actions {
		display: flex;
		justify-content: flex-end;
		gap: $spacing-sm;
		padding: 0 $spacing-lg $spacing-lg;
	}
}

// 店铺图标
.shop-icon {
	width: 28rpx;
	height: 28rpx;
	flex-shrink: 0;
	opacity: 0.45;
}

// ============================================================
// 订单商品行
// ============================================================
.order-item {
	display: flex;
	align-items: center;
	gap: $spacing-md;
	padding: $spacing-sm 0;

	&__info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 4rpx;
	}

	&__name-row {
		display: flex;
		align-items: center;
		gap: $spacing-xs;
		min-width: 0;
	}

	&__name {
		font-size: $font-size-base;
		font-weight: $font-weight-medium;
		color: $text-primary;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	&__spec {
		font-size: $font-size-xs;
		color: $text-muted;
	}

	&__price-wrap {
		flex-shrink: 0;
		text-align: right;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 4rpx;
	}

	&__qty {
		font-size: $font-size-xs;
		color: $text-muted;
	}

	&__price {
		font-size: $font-size-base;
		color: $text-secondary;
		font-weight: $font-weight-medium;
	}
}

// 处方药角标
.rx-badge {
	flex-shrink: 0;
	padding: 3rpx 10rpx;
	background: rgba(239, 68, 68, 0.12);
	border: 1rpx solid rgba(239, 68, 68, 0.2);
	border-radius: $radius-xs;
	font-size: 18rpx;
	font-weight: $font-weight-bold;
	font-style: italic;
	color: $color-error;

	&--xs {
		font-size: 16rpx;
		padding: 2rpx 8rpx;
	}
}

.order-items-more {
	padding: $spacing-xs 0;
	font-size: $font-size-xs;
	color: $color-primary;
}

// ============================================================
// 操作按钮
// ============================================================
.action-btn {
	height: 56rpx;
	padding: 0 $spacing-lg;
	border-radius: $radius-full;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: $font-size-sm;
	font-weight: $font-weight-medium;
	transition: transform 0.15s ease, opacity 0.15s ease;

	&:active {
		transform: scale(0.96);
		opacity: 0.85;
	}

	&--ghost {
		border: 1.5rpx solid $border-color;
		color: $text-secondary;
		background: transparent;
	}

	&--primary {
		background: linear-gradient(135deg, #3B9EE8 0%, #60C3F5 100%);
		color: #fff;
		box-shadow: 0 4rpx 16rpx rgba(59, 158, 232, 0.3);
	}

	&--warning {
		background: rgba(245, 158, 11, 0.1);
		color: $color-warning;
		border: 1rpx solid rgba(245, 158, 11, 0.2);
	}
}

// ============================================================
// 空状态
// ============================================================
.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: $spacing-2xl $spacing-lg;
	min-height: 500rpx;

	&__icon {
		width: 260rpx;
		height: 260rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: $spacing-xl;
		opacity: 0.7;
	}

	&__img {
		width: 100%;
		height: 100%;
	}

	&__title {
		font-size: $font-size-xl;
		font-weight: $font-weight-semibold;
		color: $text-primary;
		margin-bottom: $spacing-sm;
	}

	&__desc {
		font-size: $font-size-base;
		color: $text-muted;
	}
}

// 已加载全部
.list-end {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: $spacing-xl;

	&__text {
		font-size: $font-size-xs;
		color: $text-muted;
	}
}

.safe-area {
	height: calc(40rpx + env(safe-area-inset-bottom));
}

// ============================================================
// 购物车底部抽屉
// ============================================================
.cart-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 999;
}

// 背景遮罩
.cart-mask {
	position: absolute;
	inset: 0;
	background: transparent;
	transition: background 300ms ease;

	&--open {
		background: rgba(0, 0, 0, 0.5);
	}
}

// 抽屉主体
.cart-drawer {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	background: $bg-card;
	border-radius: $radius-xl $radius-xl 0 0;
	max-height: 75vh;
	display: flex;
	flex-direction: column;
	transform: translateY(100%);
	transition: transform 300ms cubic-bezier(0.32, 0.72, 0, 1);
	// 底部安全区留白
	padding-bottom: env(safe-area-inset-bottom);

	&--open {
		transform: translateY(0);
	}
}

// 拖拽把手
.cart-drawer__handle {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: $spacing-md 0 $spacing-sm;
	flex-shrink: 0;
}

.handle-bar {
	width: 72rpx;
	height: 8rpx;
	background: $border-color-light;
	border-radius: $radius-full;
}

// 抽屉头部
.cart-drawer__header {
	display: flex;
	align-items: center;
	padding: 0 $spacing-lg $spacing-md;
	border-bottom: 1rpx solid $border-color-light;
	flex-shrink: 0;
}

.cart-drawer__title {
	font-size: $font-size-xl;
	font-weight: $font-weight-bold;
	color: $text-primary;
}

.cart-drawer__count {
	margin-left: $spacing-sm;
	font-size: $font-size-sm;
	color: $text-muted;
}

.cart-drawer__clear {
	margin-left: auto;
	font-size: $font-size-sm;
	color: $color-error;
	padding: $spacing-xs $spacing-sm;

	&:active {
		opacity: 0.6;
	}
}

// 商品列表
.cart-drawer__list {
	flex: 1;
	height: 0; // flex + height:0 使scroll-view正确滚动
}

// ============================================================
// 购物车商品行
// ============================================================
.cart-item {
	display: flex;
	align-items: center;
	gap: $spacing-md;
	padding: $spacing-md $spacing-lg;
	border-bottom: 1rpx solid $border-color-light;
	max-height: 240rpx;
	overflow: hidden;
	transition: max-height 280ms ease, opacity 240ms ease, transform 240ms ease, padding 280ms ease;

	&--removing {
		max-height: 0;
		opacity: 0;
		transform: translateX(60rpx);
		padding-top: 0;
		padding-bottom: 0;
	}
}

// 复选框
.cart-item__check {
	width: 40rpx;
	height: 40rpx;
	border-radius: 50%;
	border: 3rpx solid $border-color-light;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	transition: border-color 0.2s ease, background 0.2s ease;

	&--checked {
		background: linear-gradient(135deg, $color-primary, $color-primary-light);
		border-color: $color-primary;
	}
}

.check-tick {
	width: 10rpx;
	height: 16rpx;
	border-right: 3rpx solid #fff;
	border-bottom: 3rpx solid #fff;
	transform: rotate(40deg) translateY(-2rpx);

	&--sm {
		width: 8rpx;
		height: 13rpx;
	}
}

// 商品图片
.cart-item__img-wrap {
	position: relative;
	width: 100rpx;
	height: 100rpx;
	border-radius: $radius-md;
	overflow: hidden;
	background: $bg-elevated;
	flex-shrink: 0;
}

.cart-item__img {
	width: 100%;
	height: 100%;
}

// 商品信息
.cart-item__info {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 4rpx;
}

.cart-item__name {
	font-size: $font-size-base;
	font-weight: $font-weight-medium;
	color: $text-primary;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.cart-item__spec {
	font-size: $font-size-xs;
	color: $text-muted;
}

.cart-item__bottom {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-top: $spacing-xs;
}

.cart-item__price {
	font-size: $font-size-base;
	color: $color-accent;
	font-weight: $font-weight-semibold;
}

// 数量步进器
.stepper {
	display: flex;
	align-items: center;
	gap: 0;
	background: $bg-elevated;
	border-radius: $radius-sm;
	overflow: hidden;

	&__btn {
		width: 52rpx;
		height: 44rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: $font-size-lg;
		color: $text-primary;
		transition: opacity 0.15s ease;

		&:active {
			opacity: 0.5;
		}

		&--disabled {
			color: $text-muted;
			pointer-events: none;
		}
	}

	&__num {
		min-width: 52rpx;
		text-align: center;
		font-size: $font-size-base;
		font-weight: $font-weight-semibold;
		color: $text-primary;
		font-family: $font-family-mono;

		&--bounce {
			animation: num-bounce 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
		}
	}
}

@keyframes num-bounce {
	0%   { transform: scale(1); }
	40%  { transform: scale(1.5); }
	75%  { transform: scale(0.88); }
	100% { transform: scale(1); }
}

// 删除按钮
.cart-item__delete {
	width: 44rpx;
	height: 44rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;

	&:active {
		opacity: 0.5;
	}
}

.delete-icon {
	width: 28rpx;
	height: 28rpx;
	position: relative;

	&::before, &::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		width: 24rpx;
		height: 3rpx;
		background: $text-muted;
		border-radius: 2rpx;
	}

	&::before { transform: translate(-50%, -50%) rotate(45deg); }
	&::after  { transform: translate(-50%, -50%) rotate(-45deg); }
}

// ============================================================
// 购物车底部工具栏
// ============================================================
.cart-footer {
	display: flex;
	align-items: center;
	gap: $spacing-sm;
	padding: $spacing-md $spacing-lg;
	border-top: 1rpx solid $border-color-light;
	flex-shrink: 0;
}

// 全选
.footer-select {
	display: flex;
	align-items: center;
	gap: $spacing-xs;
	flex-shrink: 0;

	&__label {
		font-size: $font-size-sm;
		color: $text-secondary;
	}
}

.footer-checkbox {
	width: 36rpx;
	height: 36rpx;
	border-radius: 50%;
	border: 3rpx solid $border-color-light;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: border-color 0.2s ease, background 0.2s ease;

	&--checked {
		background: linear-gradient(135deg, $color-primary, $color-primary-light);
		border-color: $color-primary;
	}
}

// 合计
.footer-summary {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	align-items: flex-end;

	&__count {
		font-size: 20rpx;
		color: $text-muted;
		margin-bottom: 2rpx;
	}

	&__price {
		display: flex;
		align-items: baseline;
		gap: 2rpx;
	}

	&__label {
		font-size: $font-size-sm;
		color: $text-secondary;
	}

	&__symbol {
		font-size: $font-size-sm;
		color: $color-accent;
		font-weight: $font-weight-semibold;
	}

	&__amount {
		font-size: $font-size-2xl;
		color: $color-accent;
		font-weight: $font-weight-bold;
		font-family: $font-family-mono;
		line-height: 1;
	}
}

// 去结算按钮
.footer-checkout {
	height: 72rpx;
	padding: 0 $spacing-xl;
	background: linear-gradient(135deg, #3B9EE8 0%, #60C3F5 100%);
	border-radius: $radius-full;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 4rpx 20rpx rgba(59, 158, 232, 0.35);
	flex-shrink: 0;
	transition: opacity 0.2s ease, transform 0.2s ease;

	&:active {
		transform: scale(0.97);
		opacity: 0.9;
	}

	&--disabled {
		background: $bg-elevated;
		box-shadow: none;
		pointer-events: none;

		.footer-checkout__text {
			color: $text-muted;
		}
	}

	&__text {
		font-size: $font-size-base;
		font-weight: $font-weight-semibold;
		color: #fff;
	}
}

// ============================================================
// 空购物车
// ============================================================
.cart-empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: $spacing-2xl $spacing-lg;

	&__icon {
		width: 200rpx;
		height: 200rpx;
		opacity: 0.6;
		margin-bottom: $spacing-xl;
	}

	&__img {
		width: 100%;
		height: 100%;
	}

	&__title {
		font-size: $font-size-xl;
		font-weight: $font-weight-semibold;
		color: $text-primary;
		margin-bottom: $spacing-sm;
	}

	&__desc {
		font-size: $font-size-base;
		color: $text-muted;
		margin-bottom: $spacing-xl;
	}

	&__btn {
		height: 72rpx;
		padding: 0 $spacing-2xl;
		background: linear-gradient(135deg, #3B9EE8 0%, #60C3F5 100%);
		border-radius: $radius-full;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4rpx 16rpx rgba(59, 158, 232, 0.3);

		&:active {
			opacity: 0.85;
		}
	}

	&__btn-text {
		font-size: $font-size-base;
		font-weight: $font-weight-semibold;
		color: #fff;
	}
}

// ============================================================
// 深色模式（统一在 .page--dark 作用域内）
// ============================================================
.page--dark {
	background: $dark-bg-base;

	// 固定头部
	.fixed-header {
		background: $dark-bg-base;
	}

	// 导航栏
	.navbar__title {
		color: $dark-text-primary;
	}

	.back-icon {
		border-color: $dark-text-primary;
	}

	// 深色模式下购物车图标变白
	.cart-icon-img {
		filter: brightness(0) saturate(100%) invert(1);
		opacity: 0.85;
	}

	// Tab栏
	.tabs-wrapper {
		border-bottom-color: $dark-border-color;
	}

	.tabs__item {
		color: $dark-text-secondary;

		&--active {
			color: $dark-color-primary;
		}
	}

	.tabs__indicator {
		background: linear-gradient(90deg, $dark-color-primary, lighten($dark-color-primary, 10%));
	}

	// 骨架屏
	.skeleton-card {
		background: $dark-bg-card;
	}

	.skeleton-card__header,
	.skeleton-card__img,
	.skeleton-card__footer,
	.skeleton-line {
		background: $dark-bg-elevated;
		animation: skeleton-shimmer-dark 1.5s infinite;
	}

	@keyframes skeleton-shimmer-dark {
		0%, 100% { opacity: 0.4; }
		50%       { opacity: 0.7; }
	}

	// 订单卡片
	.order-card {
		background: $dark-bg-card;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.4);

		&__header {
			border-bottom-color: $dark-border-color;
		}

		&__no {
			color: $dark-text-muted;
		}

		&__status {
			&--pending_pay {
				color: $dark-color-primary;
				background: rgba(74, 144, 217, 0.12);
			}

			&--completed {
				color: $color-success;
				background: rgba(16, 185, 129, 0.12);
			}

			&--refunding {
				color: $color-warning;
				background: rgba(245, 158, 11, 0.12);
			}

			&--refunded, &--cancelled {
				color: $dark-text-muted;
				background: rgba(139, 148, 158, 0.12);
			}
		}

		&__total {
			border-top-color: $dark-border-color;

			&-count {
				color: $dark-text-muted;
			}

			&-label {
				color: $dark-text-secondary;
			}

			&-symbol, &-amount {
				color: $dark-color-accent;
			}
		}
	}

	.shop-icon {
		opacity: 0.3;
	}

	// 商品行
	.order-item {
		&__name {
			color: $dark-text-primary;
		}

		&__spec {
			color: $dark-text-muted;
		}

		&__qty {
			color: $dark-text-muted;
		}

		&__price {
			color: $dark-text-secondary;
		}
	}

	// 操作按钮
	.action-btn {
		&--ghost {
			border-color: $dark-border-color;
			color: $dark-text-secondary;
		}
	}

	// 空状态
	.empty-state {
		&__title {
			color: $dark-text-primary;
		}

		&__desc {
			color: $dark-text-muted;
		}
	}

	// 购物车抽屉
	.cart-mask--open {
		background: rgba(0, 0, 0, 0.65);
	}

	.cart-drawer {
		background: $dark-bg-card;
	}

	.handle-bar {
		background: $dark-border-color;
	}

	.cart-drawer__header {
		border-bottom-color: $dark-border-color;
	}

	.cart-drawer__title {
		color: $dark-text-primary;
	}

	.cart-drawer__count {
		color: $dark-text-muted;
	}

	// 购物车商品行
	.cart-item {
		border-bottom-color: $dark-border-color;
	}

	.cart-item__check {
		border-color: $dark-border-color;

		&--checked {
			border-color: $dark-color-primary;
			background: linear-gradient(135deg, $dark-color-primary, lighten($dark-color-primary, 8%));
		}
	}

	.cart-item__img-wrap {
		background: $dark-bg-elevated;
	}

	.cart-item__name {
		color: $dark-text-primary;
	}

	.cart-item__spec {
		color: $dark-text-muted;
	}

	.cart-item__price {
		color: $dark-color-accent;
	}

	.stepper {
		background: $dark-bg-elevated;

		&__btn {
			color: $dark-text-primary;

			&--disabled {
				color: $dark-text-muted;
			}
		}

		&__num {
			color: $dark-text-primary;
		}
	}

	.delete-icon {
		&::before, &::after {
			background: $dark-text-muted;
		}
	}

	// 购物车底部工具栏
	.cart-footer {
		border-top-color: $dark-border-color;
	}

	.footer-select__label {
		color: $dark-text-secondary;
	}

	.footer-checkbox {
		border-color: $dark-border-color;

		&--checked {
			border-color: $dark-color-primary;
			background: linear-gradient(135deg, $dark-color-primary, lighten($dark-color-primary, 8%));
		}
	}

	.footer-summary {
		&__count {
			color: $dark-text-muted;
		}

		&__label {
			color: $dark-text-secondary;
		}

		&__symbol, &__amount {
			color: $dark-color-accent;
		}
	}

	.footer-checkout--disabled {
		background: $dark-bg-elevated;
	}

	// 更多商品提示
	.order-items-more {
		color: $dark-color-primary;
	}

	// 加载完毕提示
	.list-end__text {
		color: $dark-text-muted;
	}

	// 空购物车
	.cart-empty {
		&__title {
			color: $dark-text-primary;
		}

		&__desc {
			color: $dark-text-muted;
		}
	}
}
</style>
