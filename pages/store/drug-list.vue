<template>
	<view class="page" :class="{ 'page--dark': isDark }">

		<!-- ①固定头部：状态栏 + 导航栏 + 搜索栏 + 分类栏 -->
		<view class="fixed-header" :style="{ paddingTop: statusBarHeight + 'px' }">
			<!-- 导航栏 -->
			<view class="navbar">
				<view class="navbar__back" @click="goBack">
					<view class="back-icon"></view>
				</view>
				<text class="navbar__title">网上商城</text>
				<view class="navbar__right"></view>
			</view>

			<!-- 搜索栏 -->
			<view class="search-bar">
				<view class="search-bar__inner">
					<view class="search-bar__icon"></view>
					<input
						class="search-bar__input"
						placeholder="搜索药品名称"
						:value="searchText"
						@input="onSearchInput"
						confirm-type="search"
						@confirm="doSearch"
					/>
					<view v-if="searchText" class="search-bar__clear" @click="clearSearch">
						<text>✕</text>
					</view>
				</view>
			</view>

			<!-- 分类标签栏 -->
			<scroll-view class="category-bar" scroll-x :show-scrollbar="false">
				<view class="category-bar__inner">
					<view
						v-for="(cat, index) in categories"
						:key="index"
						class="category-pill"
						:class="{ 'category-pill--active': currentCategory === index }"
						@click="switchCategory(index)"
					>
						<text class="category-pill__text">{{ cat.label }}</text>
					</view>
				</view>
			</scroll-view>
		</view>

		<!-- ②头部占位 -->
		<view class="header-placeholder" :style="{ height: headerHeight + 'px' }"></view>

		<!-- ③主内容区 -->
		<scroll-view
			class="content-scroll"
			scroll-y
			@scrolltolower="loadMore"
			:style="{ height: (windowHeight - headerHeight) + 'px' }"
		>
			<!-- 促销Banner -->
			<view class="promo-banner">
				<view class="promo-banner__card">
					<view class="promo-banner__icon">
						<text class="promo-banner__emoji">🏥</text>
					</view>
					<view class="promo-banner__content">
						<text class="promo-banner__title">眼科用药专区</text>
						<text class="promo-banner__desc">非处方药自选 · 品质保障</text>
					</view>
				</view>
			</view>

			<!-- 骨架屏 -->
			<view v-if="loading && drugList.length === 0" class="product-grid">
				<view v-for="i in 4" :key="'sk-' + i" class="grid-card grid-card--skeleton">
					<view class="grid-card__img-wrap">
						<view class="skeleton-block skeleton-pulse"></view>
					</view>
					<view class="grid-card__body">
						<view class="skeleton-line skeleton-pulse" style="width: 80%"></view>
						<view class="skeleton-line skeleton-pulse" style="width: 50%; margin-top: 12rpx"></view>
						<view class="skeleton-line skeleton-pulse" style="width: 40%; margin-top: 16rpx"></view>
					</view>
				</view>
			</view>

			<!-- 商品网格 -->
			<view v-else-if="drugList.length > 0" class="product-grid">
				<view
					v-for="(drug, index) in drugList"
					:key="drug.product_id"
					class="grid-card"
					:style="{ animationDelay: Math.min(index * 0.05, 0.3) + 's' }"
					@click="goDetail(drug)"
				>
					<!-- 图片 -->
					<view class="grid-card__img-wrap">
						<image
							v-if="drug.image_url"
							class="grid-card__img"
							:src="drug.image_url"
							mode="aspectFill"
							lazy-load
						/>
						<view v-else class="grid-card__img-placeholder">
							<text class="grid-card__placeholder-icon">💊</text>
						</view>
						<!-- 角标 -->
						<view v-if="drug.is_prescription" class="grid-card__badge grid-card__badge--rx">
							<text class="grid-card__badge-text">处方药</text>
						</view>
						<view v-else-if="drug.stock_status === 'LOW_STOCK'" class="grid-card__badge grid-card__badge--stock">
							<text class="grid-card__badge-text">库存紧张</text>
						</view>
					</view>

					<!-- 内容 -->
					<view class="grid-card__body">
						<text class="grid-card__name">{{ drug.product_name }}</text>
						<view v-if="drug.specification" class="grid-card__spec-wrap">
							<text class="grid-card__spec">{{ drug.specification }}</text>
						</view>
						<!-- 价格 + 加购 -->
						<view class="grid-card__footer">
							<view class="grid-card__price">
								<text class="grid-card__price-symbol">¥</text>
								<text class="grid-card__price-integer">{{ priceInteger(drug.unit_price) }}</text>
								<text class="grid-card__price-decimal">.{{ priceDecimal(drug.unit_price) }}</text>
							</view>
							<view
								v-if="!drug.is_prescription && drug.stock_status !== 'OUT_OF_STOCK'"
								class="grid-card__cart-btn"
								@click.stop="handleAddCart(drug)"
							>
								<text class="grid-card__cart-btn-text">+</text>
							</view>
							<text v-else-if="drug.stock_status === 'OUT_OF_STOCK'" class="grid-card__sold-out">已售罄</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 空状态 -->
			<view v-else-if="!loading" class="empty-state">
				<view class="empty-state__icon">
					<text class="empty-state__emoji">🔍</text>
				</view>
				<text class="empty-state__title">暂无相关商品</text>
				<text class="empty-state__desc">换个关键词试试吧</text>
			</view>

			<!-- 加载更多 -->
			<view v-if="loading && drugList.length > 0" class="loading-more">
				<text class="loading-more__text">加载中...</text>
			</view>

			<!-- 已加载全部 -->
			<view v-if="noMore && drugList.length > 0" class="list-end">
				<text class="list-end__text">— 已加载全部 —</text>
			</view>

			<view class="safe-area"></view>
		</scroll-view>

		<!-- ④悬浮购物车按钮 -->
		<view class="fab-cart" @click="openCart" v-if="!cartOpen">
			<image class="fab-cart__icon" src="/static/shop.svg" mode="aspectFit" />
			<view v-if="cartBadge > 0" class="fab-cart__badge" :class="{ 'fab-cart__badge--bounce': badgeBounce }">
				<text class="fab-cart__badge-text">{{ cartBadge > 99 ? '99+' : cartBadge }}</text>
			</view>
		</view>

		<!-- ⑤购物车底部抽屉 -->
		<view v-if="renderDrawer" class="cart-overlay">
			<view
				class="cart-mask"
				:class="{ 'cart-mask--open': cartOpen }"
				@click="closeCart"
			></view>

			<view class="cart-drawer" :class="{ 'cart-drawer--open': cartOpen }">
				<view class="cart-drawer__handle">
					<view class="handle-bar"></view>
				</view>

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

				<template v-if="cartItems.length > 0">
					<scroll-view class="cart-drawer__list" scroll-y>
						<view
							v-for="item in cartItems"
							:key="item.cart_item_id"
							class="cart-item"
							:class="{ 'cart-item--removing': removingId === item.cart_item_id }"
						>
							<view
								class="cart-item__check"
								:class="{ 'cart-item__check--checked': item.selected }"
								@click="handleToggleSelect(item.cart_item_id)"
							>
								<view v-if="item.selected" class="check-tick"></view>
							</view>

							<view class="cart-item__img-wrap">
								<image class="cart-item__img" :src="item.image_url" mode="aspectFill" />
								<view v-if="item.is_prescription" class="rx-badge rx-badge--xs">Rx</view>
							</view>

							<view class="cart-item__info">
								<text class="cart-item__name">{{ item.name }}</text>
								<text class="cart-item__spec">{{ item.spec }}</text>
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

							<view class="cart-item__delete" @click="handleDeleteItem(item.cart_item_id)">
								<view class="delete-icon"></view>
							</view>
						</view>
					</scroll-view>

					<view class="cart-footer">
						<view class="footer-select" @click="handleSelectAll">
							<view class="footer-checkbox" :class="{ 'footer-checkbox--checked': cartAllSelected }">
								<view v-if="cartAllSelected" class="check-tick check-tick--sm"></view>
							</view>
							<text class="footer-select__label">全选</text>
						</view>

						<view class="footer-summary">
							<text class="footer-summary__count">已选{{ cartSelectedCount }}件</text>
							<view class="footer-summary__price">
								<text class="footer-summary__label">合计 </text>
								<text class="footer-summary__symbol">¥</text>
								<text class="footer-summary__amount">{{ formatPrice(cartTotalPrice) }}</text>
							</view>
						</view>

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

				<view v-else class="cart-empty">
					<view class="cart-empty__icon">
						<image class="cart-empty__img" src="/static/E-car.svg" mode="aspectFit" />
					</view>
					<text class="cart-empty__title">购物车还是空的</text>
					<text class="cart-empty__desc">精选眼科健康产品等你来选</text>
				</view>
			</view>
		</view>

		<TopNotificationBar />
	</view>
</template>

<script>
import { isDarkMode } from '@/store/theme.js'
import { getDrugPage, mapDrugToProduct } from '@/utils/api/drug.js'
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
import { createOrderFromCart } from '@/utils/api/order.js'
import TopNotificationBar from '@/components/TopNotificationBar.vue'

export default {
	components: { TopNotificationBar },
	data() {
		return {
			statusBarHeight: 44,
			headerHeight: 0,
			windowHeight: 667,
			// 搜索
			searchText: '',
			searchTimer: null,
			// 分类
			categories: [
				{ label: '全部', value: '' },
				{ label: '人工泪液', value: '人工泪液' },
				{ label: '眼药水', value: '眼药水' },
				{ label: '抗感染', value: '抗感染' },
				{ label: '抗炎药', value: '抗炎药' },
				{ label: '维生素', value: '维生素' }
			],
			currentCategory: 0,
			// 商品列表
			drugList: [],
			loading: false,
			noMore: false,
			page: 1,
			pageSize: 10,
			// 购物车抽屉
			renderDrawer: false,
			cartOpen: false,
			removingId: null,
			bounceItemId: null,
			badgeBounce: false
		}
	},

	computed: {
		isDark() {
			return isDarkMode()
		},
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

	onLoad(options) {
		this.getStatusBarHeight()
		initCart()
		// 支持从首页分类入口跳入
		if (options && options.category) {
			const idx = this.categories.findIndex(c => c.value === options.category)
			if (idx >= 0) this.currentCategory = idx
		}
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

	methods: {
		getStatusBarHeight() {
			const sysInfo = uni.getSystemInfoSync()
			this.statusBarHeight = sysInfo.statusBarHeight || 44
			this.windowHeight = sysInfo.windowHeight || 667
		},

		// ============================================================
		// 商品数据加载
		// ============================================================
		async loadData(reset = false) {
			if (reset) {
				this.page = 1
				this.noMore = false
			}
			if (this.loading || this.noMore) return
			this.loading = true
			try {
				const params = {
					pageNum: this.page,
					pageSize: this.pageSize
				}
				const catValue = this.categories[this.currentCategory].value
				if (catValue) params.drugCategory = catValue
				if (this.searchText.trim()) params.drugName = this.searchText.trim()

				const res = await getDrugPage(params)
				if (res.code === 200) {
					const list = Array.isArray(res.data) ? res.data.map(mapDrugToProduct) : []
					if (reset) {
						this.drugList = list
					} else {
						this.drugList.push(...list)
					}
					this.noMore = list.length < this.pageSize
					this.page++
				}
			} catch (e) {
				console.error('[drug-list] 加载失败:', e)
			} finally {
				this.loading = false
			}
		},

		loadMore() {
			this.loadData(false)
		},

		// ============================================================
		// 搜索
		// ============================================================
		onSearchInput(e) {
			this.searchText = e.detail.value
			clearTimeout(this.searchTimer)
			this.searchTimer = setTimeout(() => {
				this.loadData(true)
			}, 300)
		},

		doSearch() {
			this.loadData(true)
		},

		clearSearch() {
			this.searchText = ''
			this.loadData(true)
		},

		// ============================================================
		// 分类切换
		// ============================================================
		switchCategory(index) {
			if (this.currentCategory === index) return
			this.currentCategory = index
			this.loadData(true)
		},

		// ============================================================
		// 商品操作
		// ============================================================
		goDetail(drug) {
			uni.navigateTo({
				url: `/pages/store/drug-detail?drugId=${drug.product_id}`
			})
		},

		async handleAddCart(drug) {
			await addItem(drug, 1)
			uni.showToast({ title: '已加入购物车', icon: 'success' })
			// 角标弹跳
			this.badgeBounce = true
			setTimeout(() => { this.badgeBounce = false }, 400)
		},

		// ============================================================
		// 价格格式化
		// ============================================================
		priceInteger(price) {
			if (typeof price !== 'number') return '0'
			return Math.floor(price).toString()
		},

		priceDecimal(price) {
			if (typeof price !== 'number') return '00'
			return (price % 1).toFixed(2).substring(2)
		},

		formatPrice(amount) {
			if (typeof amount !== 'number') return '0.00'
			return amount.toFixed(2)
		},

		// ============================================================
		// 导航
		// ============================================================
		goBack() {
			uni.navigateBack()
		},

		// ============================================================
		// 购物车抽屉
		// ============================================================
		openCart() {
			this.renderDrawer = true
			this.$nextTick(() => {
				setTimeout(() => { this.cartOpen = true }, 16)
			})
		},

		closeCart() {
			this.cartOpen = false
			setTimeout(() => { this.renderDrawer = false }, 320)
		},

		async handleCheckout() {
			if (this.cartSelectedCount === 0) {
				uni.showToast({ title: '请先选择商品', icon: 'none' })
				return
			}
			uni.showLoading({ title: '正在下单...' })
			try {
				const cartItemIds = selectedItems.value.map(i => i.cart_item_id)
				const res = await createOrderFromCart(cartItemIds)
				if (res.code === 200) {
					await initCart()
					this.closeCart()
					uni.hideLoading()
					uni.showToast({ title: '下单成功', icon: 'success' })
					// 跳转订单详情
					setTimeout(() => {
						uni.navigateTo({
							url: '/pages/orders/order-detail?id=' + res.data.id
						})
					}, 500)
				} else {
					uni.hideLoading()
					uni.showToast({ title: res.msg || '下单失败', icon: 'none' })
				}
			} catch (e) {
				uni.hideLoading()
				uni.showToast({ title: '下单失败', icon: 'none' })
			}
		},

		// ============================================================
		// 购物车商品操作
		// ============================================================
		handleToggleSelect(cart_item_id) {
			toggleSelect(cart_item_id)
		},

		handleSelectAll() {
			selectAll(!this.cartAllSelected)
		},

		handleQuantity(item, delta) {
			updateQuantity(item.cart_item_id, delta)
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
		font-size: $font-size-xl;
		font-weight: $font-weight-semibold;
		color: $text-primary;
	}

	&__right {
		width: 72rpx;
		height: 72rpx;
	}
}

.back-icon {
	width: 18rpx;
	height: 18rpx;
	border-left: 4rpx solid $text-primary;
	border-bottom: 4rpx solid $text-primary;
	transform: rotate(45deg);
}

// ============================================================
// 搜索栏
// ============================================================
.search-bar {
	padding: 0 $spacing-lg $spacing-sm;

	&__inner {
		display: flex;
		align-items: center;
		height: 72rpx;
		background: $bg-elevated;
		border-radius: $radius-full;
		padding: 0 $spacing-md;
		gap: $spacing-sm;
	}

	&__icon {
		width: 28rpx;
		height: 28rpx;
		border: 3rpx solid $text-muted;
		border-radius: 50%;
		position: relative;
		flex-shrink: 0;

		&::after {
			content: '';
			position: absolute;
			bottom: -6rpx;
			right: -6rpx;
			width: 10rpx;
			height: 3rpx;
			background: $text-muted;
			transform: rotate(45deg);
			border-radius: 2rpx;
		}
	}

	&__input {
		flex: 1;
		font-size: $font-size-base;
		color: $text-primary;
	}

	&__clear {
		width: 36rpx;
		height: 36rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: $font-size-xs;
		color: $text-muted;
		background: rgba(0, 0, 0, 0.08);
		border-radius: 50%;
		flex-shrink: 0;
	}
}

// ============================================================
// 分类标签栏
// ============================================================
.category-bar {
	white-space: nowrap;
	padding-bottom: $spacing-sm;
	border-bottom: 1rpx solid $border-color-light;

	&__inner {
		display: inline-flex;
		gap: $spacing-sm;
		padding: 0 $spacing-lg;
	}
}

.category-pill {
	padding: 10rpx 28rpx;
	border-radius: $radius-full;
	background: $bg-elevated;
	transition: all 0.25s ease;

	&--active {
		background: rgba($color-primary, 0.12);
	}

	&__text {
		font-size: $font-size-sm;
		color: $text-secondary;
		white-space: nowrap;
	}

	&--active &__text {
		color: $color-primary;
		font-weight: $font-weight-semibold;
	}
}

// ============================================================
// 促销 Banner
// ============================================================
.promo-banner {
	padding: $spacing-lg $spacing-lg 0;

	&__card {
		display: flex;
		align-items: center;
		gap: $spacing-md;
		padding: $spacing-lg;
		background: linear-gradient(135deg, rgba($color-primary, 0.08) 0%, rgba(59, 158, 232, 0.12) 100%);
		border-radius: $radius-lg;
		border: 1rpx solid rgba($color-primary, 0.1);
	}

	&__icon {
		width: 80rpx;
		height: 80rpx;
		background: rgba($color-primary, 0.1);
		border-radius: $radius-md;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	&__emoji {
		font-size: 40rpx;
	}

	&__content {
		flex: 1;
	}

	&__title {
		font-size: $font-size-lg;
		font-weight: $font-weight-semibold;
		color: $color-primary;
		display: block;
	}

	&__desc {
		font-size: $font-size-sm;
		color: $text-secondary;
		margin-top: 4rpx;
		display: block;
	}
}

// ============================================================
// 商品网格
// ============================================================
.product-grid {
	display: flex;
	flex-wrap: wrap;
	gap: $spacing-md;
	padding: $spacing-lg;
}

.grid-card {
	width: calc(50% - #{$spacing-md} / 2);
	background: $bg-card;
	border-radius: $radius-lg;
	overflow: hidden;
	box-shadow: $shadow-sm;
	animation: fadeInUp 0.4s ease backwards;

	&:active {
		transform: scale(0.97);
	}

	&--skeleton {
		animation: none;
	}

	&__img-wrap {
		position: relative;
		width: 100%;
		height: 0;
		padding-bottom: 100%;
		background: $bg-elevated;
		overflow: hidden;
	}

	&__img {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}

	&__img-placeholder {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #f0f5fa 0%, #e8edf3 100%);
	}

	&__placeholder-icon {
		font-size: 72rpx;
		opacity: 0.6;
	}

	&__badge {
		position: absolute;
		top: $spacing-sm;
		left: $spacing-sm;
		padding: 4rpx 12rpx;
		border-radius: $radius-sm;
		font-size: 18rpx;

		&--rx {
			background: rgba(239, 68, 68, 0.9);
			color: #fff;
		}

		&--stock {
			background: rgba(245, 158, 11, 0.9);
			color: #fff;
		}
	}

	&__badge-text {
		font-size: 18rpx;
		font-weight: $font-weight-medium;
	}

	&__body {
		padding: $spacing-sm $spacing-md $spacing-md;
	}

	&__name {
		font-size: $font-size-base;
		font-weight: $font-weight-medium;
		color: $text-primary;
		line-height: $line-height-normal;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	&__spec-wrap {
		margin-top: 6rpx;
	}

	&__spec {
		font-size: $font-size-xs;
		color: $text-muted;
		background: $bg-elevated;
		padding: 2rpx 10rpx;
		border-radius: $radius-xs;
	}

	&__footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: $spacing-sm;
	}

	&__price {
		display: flex;
		align-items: baseline;
	}

	&__price-symbol {
		font-size: $font-size-xs;
		color: $color-accent;
		font-weight: $font-weight-semibold;
	}

	&__price-integer {
		font-size: $font-size-xl;
		color: $color-accent;
		font-weight: $font-weight-bold;
		font-family: $font-family-mono;
		line-height: 1;
	}

	&__price-decimal {
		font-size: $font-size-xs;
		color: $color-accent;
		font-weight: $font-weight-medium;
	}

	&__cart-btn {
		width: 48rpx;
		height: 48rpx;
		background: linear-gradient(135deg, #3B9EE8 0%, #60C3F5 100%);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4rpx 12rpx rgba(59, 158, 232, 0.3);

		&:active {
			transform: scale(0.9);
		}
	}

	&__cart-btn-text {
		font-size: $font-size-xl;
		color: #fff;
		font-weight: $font-weight-bold;
		line-height: 1;
	}

	&__sold-out {
		font-size: $font-size-xs;
		color: $text-muted;
	}
}

@keyframes fadeInUp {
	from {
		opacity: 0;
		transform: translateY(20rpx);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

// 骨架屏
.skeleton-block {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
}

.skeleton-line {
	height: 24rpx;
	border-radius: $radius-sm;
}

.skeleton-pulse {
	background: linear-gradient(90deg, $bg-elevated 25%, rgba($bg-elevated, 0.5) 50%, $bg-elevated 75%);
	background-size: 200% 100%;
	animation: skeletonPulse 1.5s ease-in-out infinite;
}

@keyframes skeletonPulse {
	0% { background-position: 200% 0; }
	100% { background-position: -200% 0; }
}

// ============================================================
// 空状态 + 加载
// ============================================================
.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: $spacing-2xl $spacing-lg;
	min-height: 400rpx;

	&__icon {
		margin-bottom: $spacing-lg;
	}

	&__emoji {
		font-size: 80rpx;
		opacity: 0.6;
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

.loading-more {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: $spacing-lg;

	&__text {
		font-size: $font-size-sm;
		color: $text-muted;
	}
}

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
// 悬浮购物车按钮
// ============================================================
.fab-cart {
	position: fixed;
	right: $spacing-lg;
	bottom: calc(120rpx + env(safe-area-inset-bottom));
	width: 96rpx;
	height: 96rpx;
	background: $bg-card;
	border-radius: 50%;
	box-shadow: $shadow-lg;
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 50;
	transition: transform 0.2s ease;

	&:active {
		transform: scale(0.92);
	}

	&__icon {
		width: 44rpx;
		height: 44rpx;
	}

	&__badge {
		position: absolute;
		top: 0;
		right: 0;
		min-width: 32rpx;
		height: 32rpx;
		padding: 0 8rpx;
		background: $color-accent;
		border-radius: $radius-full;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 3rpx solid $bg-card;

		&--bounce {
			animation: badgeBounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
		}
	}

	&__badge-text {
		font-size: 18rpx;
		color: #fff;
		font-weight: $font-weight-bold;
		line-height: 1;
	}
}

@keyframes badgeBounce {
	0%   { transform: scale(1); }
	40%  { transform: scale(1.4); }
	75%  { transform: scale(0.9); }
	100% { transform: scale(1); }
}

// ============================================================
// 购物车底部抽屉（复用 my-orders 样式）
// ============================================================
.cart-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 999;
}

.cart-mask {
	position: absolute;
	inset: 0;
	background: transparent;
	transition: background 300ms ease;

	&--open {
		background: rgba(0, 0, 0, 0.5);
	}
}

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
	padding-bottom: env(safe-area-inset-bottom);

	&--open {
		transform: translateY(0);
	}
}

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

.cart-drawer__list {
	flex: 1;
	height: 0;
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
	}
}

// ============================================================
// 深色模式
// ============================================================
.page--dark {
	background: $dark-bg-base;

	.fixed-header {
		background: $dark-bg-base;
	}

	.navbar__title {
		color: $dark-text-primary;
	}

	.back-icon {
		border-color: $dark-text-primary;
	}

	// 搜索栏
	.search-bar__inner {
		background: $dark-bg-card;
	}

	.search-bar__icon {
		border-color: $dark-text-muted;

		&::after {
			background: $dark-text-muted;
		}
	}

	.search-bar__input {
		color: $dark-text-primary;
	}

	.search-bar__clear {
		background: rgba(255, 255, 255, 0.1);
		color: $dark-text-muted;
	}

	// 分类栏
	.category-bar {
		border-bottom-color: $dark-border-color;
	}

	.category-pill {
		background: $dark-bg-card;

		&--active {
			background: rgba(74, 144, 217, 0.15);
		}

		&__text {
			color: $dark-text-secondary;
		}

		&--active .category-pill__text {
			color: $dark-color-primary;
		}
	}

	// 促销 Banner
	.promo-banner__card {
		background: linear-gradient(135deg, rgba(74, 144, 217, 0.1) 0%, rgba(59, 158, 232, 0.08) 100%);
		border-color: rgba(74, 144, 217, 0.15);
	}

	.promo-banner__icon {
		background: rgba(74, 144, 217, 0.12);
	}

	.promo-banner__title {
		color: $dark-color-primary;
	}

	.promo-banner__desc {
		color: $dark-text-secondary;
	}

	// 商品卡片
	.grid-card {
		background: $dark-bg-card;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.3);

		&__img-wrap {
			background: $dark-bg-elevated;
		}

		&__img-placeholder {
			background: linear-gradient(135deg, $dark-bg-elevated 0%, darken($dark-bg-elevated, 3%) 100%);
		}

		&__name {
			color: $dark-text-primary;
		}

		&__spec {
			color: $dark-text-muted;
			background: $dark-bg-elevated;
		}

		&__price-symbol,
		&__price-integer,
		&__price-decimal {
			color: $dark-color-accent;
		}

		&__sold-out {
			color: $dark-text-muted;
		}
	}

	// 骨架屏
	.skeleton-pulse {
		background: linear-gradient(90deg, $dark-bg-elevated 25%, rgba($dark-bg-elevated, 0.5) 50%, $dark-bg-elevated 75%);
		background-size: 200% 100%;
	}

	// 空状态
	.empty-state__title {
		color: $dark-text-primary;
	}

	.empty-state__desc {
		color: $dark-text-muted;
	}

	.loading-more__text,
	.list-end__text {
		color: $dark-text-muted;
	}

	// 悬浮购物车
	.fab-cart {
		background: $dark-bg-card;
		box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.4);

		&__icon {
			filter: brightness(0) saturate(100%) invert(1);
			opacity: 0.85;
		}

		&__badge {
			border-color: $dark-bg-card;
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
