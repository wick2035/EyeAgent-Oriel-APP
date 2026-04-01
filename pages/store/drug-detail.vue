<template>
	<view class="page" :class="{ 'page--dark': isDark }">

		<!-- 顶部返回按钮（悬浮） -->
		<view class="float-back" :style="{ top: (statusBarHeight + 10) + 'px' }" @click="goBack">
			<view class="float-back__icon"></view>
		</view>

		<scroll-view class="content-scroll" scroll-y style="height: 100vh">

			<!-- 骨架屏 -->
			<template v-if="loading">
				<view class="hero-skeleton skeleton-pulse"></view>
				<view class="detail-skeleton">
					<view class="skeleton-line skeleton-pulse" style="width: 40%; height: 48rpx"></view>
					<view class="skeleton-line skeleton-pulse" style="width: 70%; margin-top: 24rpx"></view>
					<view class="skeleton-line skeleton-pulse" style="width: 90%; margin-top: 16rpx"></view>
					<view class="skeleton-line skeleton-pulse" style="width: 60%; margin-top: 16rpx"></view>
				</view>
			</template>

			<template v-else-if="drug">
				<!-- ①图片区 -->
				<view class="hero">
					<image
						v-if="drug.image_url"
						class="hero__img"
						:src="drug.image_url"
						mode="aspectFill"
					/>
					<view v-else class="hero__placeholder">
						<text class="hero__placeholder-icon">💊</text>
					</view>
					<view class="hero__fade"></view>
				</view>

				<!-- ②价格栏 -->
				<view class="price-bar">
					<view class="price-bar__price">
						<text class="price-bar__symbol">¥</text>
						<text class="price-bar__integer">{{ priceInteger(drug.unit_price) }}</text>
						<text class="price-bar__decimal">.{{ priceDecimal(drug.unit_price) }}</text>
					</view>
					<view class="price-bar__tags">
						<view v-if="drug.is_prescription" class="tag tag--rx">
							<text class="tag__text">处方药</text>
						</view>
						<view v-else class="tag tag--otc">
							<text class="tag__text">OTC</text>
						</view>
						<view v-if="drug.stock_status === 'LOW_STOCK'" class="tag tag--warn">
							<text class="tag__text">库存紧张</text>
						</view>
						<view v-if="drug.stock_status === 'OUT_OF_STOCK'" class="tag tag--out">
							<text class="tag__text">已售罄</text>
						</view>
					</view>
				</view>

				<!-- ③基本信息卡 -->
				<view class="info-card">
					<text class="info-card__name">{{ drug.product_name }}</text>
					<view v-if="drug.specification" class="info-card__spec-wrap">
						<text class="info-card__spec">{{ drug.specification }}</text>
					</view>
					<text v-if="drug.indications" class="info-card__desc">{{ drug.indications }}</text>
				</view>

				<!-- ④警告信息 -->
				<view v-if="drug.warning_info" class="warning-card">
					<text class="warning-card__icon">⚠️</text>
					<text class="warning-card__text">{{ drug.warning_info }}</text>
				</view>

				<!-- ⑤详细信息 -->
				<view class="detail-card">
					<text class="detail-card__title">药品信息</text>
					<view class="detail-row" v-if="drug.manufacturer">
						<text class="detail-row__label">生产厂家</text>
						<text class="detail-row__value">{{ drug.manufacturer }}</text>
					</view>
					<view class="detail-row" v-if="drug.dosage_form">
						<text class="detail-row__label">剂型</text>
						<text class="detail-row__value">{{ drug.dosage_form }}</text>
					</view>
					<view class="detail-row" v-if="drug.specification">
						<text class="detail-row__label">规格</text>
						<text class="detail-row__value">{{ drug.specification }}</text>
					</view>
					<view class="detail-row" v-if="drug.batch_number">
						<text class="detail-row__label">批号</text>
						<text class="detail-row__value">{{ drug.batch_number }}</text>
					</view>
					<view class="detail-row" v-if="drug.expiry_date">
						<text class="detail-row__label">有效期至</text>
						<text class="detail-row__value">{{ formatDate(drug.expiry_date) }}</text>
					</view>
					<view class="detail-row" v-if="drug.insurance_category">
						<text class="detail-row__label">医保类别</text>
						<text class="detail-row__value">{{ drug.insurance_category }}</text>
					</view>
					<view class="detail-row" v-if="drug.category">
						<text class="detail-row__label">药品分类</text>
						<text class="detail-row__value">{{ drug.category }}</text>
					</view>
				</view>

				<!-- 底部占位（为固定底栏留空间） -->
				<view style="height: calc(140rpx + env(safe-area-inset-bottom))"></view>
			</template>

			<!-- 错误状态 -->
			<view v-else class="empty-state">
				<text class="empty-state__emoji">😕</text>
				<text class="empty-state__title">药品信息加载失败</text>
				<text class="empty-state__desc">请返回重试</text>
			</view>
		</scroll-view>

		<!-- ⑥固定底部栏 -->
		<view v-if="drug && !loading" class="bottom-bar" :class="{ 'bottom-bar--dark': isDark }">
			<!-- 购物车图标 -->
			<view class="bottom-bar__cart" @click="openCart">
				<image class="bottom-bar__cart-icon" src="/static/shop.svg" mode="aspectFit" />
				<view v-if="cartBadge > 0" class="bottom-bar__cart-badge">
					<text class="bottom-bar__cart-badge-text">{{ cartBadge > 99 ? '99+' : cartBadge }}</text>
				</view>
			</view>
			<!-- 加入购物车 -->
			<view
				class="bottom-bar__btn bottom-bar__btn--secondary"
				:class="{ 'bottom-bar__btn--disabled': drug.is_prescription || drug.stock_status === 'OUT_OF_STOCK' }"
				@click="handleAddCart"
			>
				<text class="bottom-bar__btn-text">加入购物车</text>
			</view>
			<!-- 立即购买 -->
			<view
				class="bottom-bar__btn bottom-bar__btn--primary"
				:class="{ 'bottom-bar__btn--disabled': drug.is_prescription || drug.stock_status === 'OUT_OF_STOCK' }"
				@click="handleBuyNow"
			>
				<text class="bottom-bar__btn-text bottom-bar__btn-text--white">立即购买</text>
			</view>
		</view>

		<!-- 购物车抽屉 -->
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
import { getDrugDetail, mapDrugToProduct } from '@/utils/api/drug.js'
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
			drugId: '',
			drug: null,
			loading: true,
			// 购物车抽屉
			renderDrawer: false,
			cartOpen: false,
			removingId: null,
			bounceItemId: null
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
		const sysInfo = uni.getSystemInfoSync()
		this.statusBarHeight = sysInfo.statusBarHeight || 44
		this.drugId = options.drugId || ''
		initCart()
		this.loadDrug()
	},

	methods: {
		async loadDrug() {
			if (!this.drugId) {
				this.loading = false
				return
			}
			this.loading = true
			try {
				const res = await getDrugDetail(this.drugId)
				if (res.code === 200 && res.data) {
					this.drug = mapDrugToProduct(res.data)
				}
			} catch (e) {
				console.error('[drug-detail] 加载失败:', e)
			} finally {
				this.loading = false
			}
		},

		// ============================================================
		// 价格 & 日期格式化
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

		formatDate(dateStr) {
			if (!dateStr) return ''
			return dateStr.substring(0, 10)
		},

		// ============================================================
		// 购买操作
		// ============================================================
		async handleAddCart() {
			if (this.drug.is_prescription || this.drug.stock_status === 'OUT_OF_STOCK') return
			await addItem(this.drug, 1)
			uni.showToast({ title: '已加入购物车', icon: 'success' })
		},

		async handleBuyNow() {
			if (this.drug.is_prescription || this.drug.stock_status === 'OUT_OF_STOCK') return
			await addItem(this.drug, 1)
			this.openCart()
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
.page {
	min-height: 100vh;
	background: $bg-base;
}

// ============================================================
// 悬浮返回按钮
// ============================================================
.float-back {
	position: fixed;
	left: $spacing-lg;
	z-index: 100;
	width: 64rpx;
	height: 64rpx;
	background: rgba(255, 255, 255, 0.85);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
	backdrop-filter: blur(10px);

	&:active {
		transform: scale(0.9);
	}

	&__icon {
		width: 16rpx;
		height: 16rpx;
		border-left: 4rpx solid $text-primary;
		border-bottom: 4rpx solid $text-primary;
		transform: rotate(45deg) translate(2rpx, -2rpx);
	}
}

// ============================================================
// 图片区
// ============================================================
.hero {
	position: relative;
	width: 100%;
	height: 480rpx;
	background: $bg-elevated;

	&__img {
		width: 100%;
		height: 100%;
	}

	&__placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #f0f5fa 0%, #e4ecf5 100%);
	}

	&__placeholder-icon {
		font-size: 120rpx;
		opacity: 0.5;
	}

	&__fade {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 80rpx;
		background: linear-gradient(180deg, transparent 0%, $bg-base 100%);
	}
}

.hero-skeleton {
	width: 100%;
	height: 480rpx;
}

.detail-skeleton {
	padding: $spacing-lg;
}

// ============================================================
// 价格栏
// ============================================================
.price-bar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 $spacing-lg $spacing-md;

	&__price {
		display: flex;
		align-items: baseline;
	}

	&__symbol {
		font-size: $font-size-lg;
		color: $color-accent;
		font-weight: $font-weight-bold;
	}

	&__integer {
		font-size: 56rpx;
		color: $color-accent;
		font-weight: $font-weight-bold;
		font-family: $font-family-mono;
		line-height: 1;
	}

	&__decimal {
		font-size: $font-size-lg;
		color: $color-accent;
		font-weight: $font-weight-semibold;
	}

	&__tags {
		display: flex;
		gap: $spacing-xs;
	}
}

.tag {
	padding: 4rpx 14rpx;
	border-radius: $radius-sm;
	display: flex;
	align-items: center;

	&--rx {
		background: rgba(239, 68, 68, 0.1);
		border: 1rpx solid rgba(239, 68, 68, 0.2);
	}

	&--otc {
		background: rgba(16, 185, 129, 0.1);
		border: 1rpx solid rgba(16, 185, 129, 0.2);
	}

	&--warn {
		background: rgba(245, 158, 11, 0.1);
		border: 1rpx solid rgba(245, 158, 11, 0.2);
	}

	&--out {
		background: rgba(156, 163, 175, 0.1);
		border: 1rpx solid rgba(156, 163, 175, 0.2);
	}

	&__text {
		font-size: $font-size-xs;
		font-weight: $font-weight-medium;
	}

	&--rx &__text { color: $color-error; }
	&--otc &__text { color: $color-success; }
	&--warn &__text { color: $color-warning; }
	&--out &__text { color: $text-muted; }
}

// ============================================================
// 信息卡片
// ============================================================
.info-card {
	margin: 0 $spacing-lg $spacing-md;
	padding: $spacing-lg;
	background: $bg-card;
	border-radius: $radius-lg;
	box-shadow: $shadow-sm;

	&__name {
		font-size: $font-size-xl;
		font-weight: $font-weight-bold;
		color: $text-primary;
		line-height: $line-height-normal;
		display: block;
	}

	&__spec-wrap {
		margin-top: $spacing-sm;
	}

	&__spec {
		font-size: $font-size-sm;
		color: $text-muted;
		background: $bg-elevated;
		padding: 4rpx 14rpx;
		border-radius: $radius-xs;
	}

	&__desc {
		font-size: $font-size-base;
		color: $text-secondary;
		line-height: $line-height-relaxed;
		margin-top: $spacing-md;
		display: block;
	}
}

// ============================================================
// 警告卡片
// ============================================================
.warning-card {
	margin: 0 $spacing-lg $spacing-md;
	padding: $spacing-md $spacing-lg;
	background: rgba(245, 158, 11, 0.08);
	border: 1rpx solid rgba(245, 158, 11, 0.2);
	border-radius: $radius-lg;
	display: flex;
	align-items: flex-start;
	gap: $spacing-sm;

	&__icon {
		font-size: $font-size-lg;
		flex-shrink: 0;
	}

	&__text {
		font-size: $font-size-sm;
		color: $color-warning;
		line-height: $line-height-normal;
	}
}

// ============================================================
// 详情信息卡
// ============================================================
.detail-card {
	margin: 0 $spacing-lg $spacing-md;
	padding: $spacing-lg;
	background: $bg-card;
	border-radius: $radius-lg;
	box-shadow: $shadow-sm;

	&__title {
		font-size: $font-size-lg;
		font-weight: $font-weight-semibold;
		color: $text-primary;
		margin-bottom: $spacing-md;
		display: block;
	}
}

.detail-row {
	display: flex;
	padding: $spacing-sm 0;
	border-bottom: 1rpx solid $border-color-light;

	&:last-child {
		border-bottom: none;
	}

	&__label {
		width: 160rpx;
		font-size: $font-size-sm;
		color: $text-muted;
		flex-shrink: 0;
	}

	&__value {
		flex: 1;
		font-size: $font-size-sm;
		color: $text-primary;
	}
}

// ============================================================
// 固定底部栏
// ============================================================
.bottom-bar {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	display: flex;
	align-items: center;
	gap: $spacing-sm;
	padding: $spacing-md $spacing-lg;
	padding-bottom: calc(#{$spacing-md} + env(safe-area-inset-bottom));
	background: $bg-card;
	border-top: 1rpx solid $border-color-light;
	z-index: 50;

	&__cart {
		position: relative;
		width: 80rpx;
		height: 80rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	&__cart-icon {
		width: 48rpx;
		height: 48rpx;
	}

	&__cart-badge {
		position: absolute;
		top: 4rpx;
		right: 4rpx;
		min-width: 28rpx;
		height: 28rpx;
		padding: 0 6rpx;
		background: $color-accent;
		border-radius: $radius-full;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	&__cart-badge-text {
		font-size: 18rpx;
		color: #fff;
		font-weight: $font-weight-bold;
		line-height: 1;
	}

	&__btn {
		flex: 1;
		height: 80rpx;
		border-radius: $radius-full;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: transform 0.15s ease, opacity 0.15s ease;

		&:active {
			transform: scale(0.97);
			opacity: 0.9;
		}

		&--secondary {
			background: $bg-elevated;
			border: 1rpx solid $border-color;
		}

		&--primary {
			background: linear-gradient(135deg, #3B9EE8 0%, #60C3F5 100%);
			box-shadow: 0 4rpx 20rpx rgba(59, 158, 232, 0.35);
		}

		&--disabled {
			opacity: 0.4;
			pointer-events: none;
		}
	}

	&__btn-text {
		font-size: $font-size-base;
		font-weight: $font-weight-semibold;
		color: $text-primary;

		&--white {
			color: #fff;
		}
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
	padding: 200rpx $spacing-lg;

	&__emoji {
		font-size: 80rpx;
		margin-bottom: $spacing-lg;
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

// 骨架屏
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
// 购物车抽屉（与 drug-list 保持一致）
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

		&:active { opacity: 0.5; }
		&--disabled { color: $text-muted; pointer-events: none; }
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

	&:active { opacity: 0.5; }
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

	&__count { font-size: 20rpx; color: $text-muted; margin-bottom: 2rpx; }
	&__price { display: flex; align-items: baseline; gap: 2rpx; }
	&__label { font-size: $font-size-sm; color: $text-secondary; }
	&__symbol { font-size: $font-size-sm; color: $color-accent; font-weight: $font-weight-semibold; }
	&__amount { font-size: $font-size-2xl; color: $color-accent; font-weight: $font-weight-bold; font-family: $font-family-mono; line-height: 1; }
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

	&:active { transform: scale(0.97); opacity: 0.9; }

	&--disabled {
		background: $bg-elevated;
		box-shadow: none;
		pointer-events: none;
		.footer-checkout__text { color: $text-muted; }
	}

	&__text {
		font-size: $font-size-base;
		font-weight: $font-weight-semibold;
		color: #fff;
	}
}

.cart-empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: $spacing-2xl $spacing-lg;

	&__icon { width: 200rpx; height: 200rpx; opacity: 0.6; margin-bottom: $spacing-xl; }
	&__img { width: 100%; height: 100%; }
	&__title { font-size: $font-size-xl; font-weight: $font-weight-semibold; color: $text-primary; margin-bottom: $spacing-sm; }
	&__desc { font-size: $font-size-base; color: $text-muted; }
}

// ============================================================
// 深色模式
// ============================================================
.page--dark {
	background: $dark-bg-base;

	.float-back {
		background: rgba($dark-bg-card, 0.85);

		&__icon {
			border-color: $dark-text-primary;
		}
	}

	.hero {
		background: $dark-bg-elevated;

		&__placeholder {
			background: linear-gradient(135deg, $dark-bg-elevated 0%, darken($dark-bg-elevated, 3%) 100%);
		}

		&__fade {
			background: linear-gradient(180deg, transparent 0%, $dark-bg-base 100%);
		}
	}

	.price-bar {
		&__symbol, &__integer, &__decimal {
			color: $dark-color-accent;
		}
	}

	.info-card {
		background: $dark-bg-card;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.3);

		&__name { color: $dark-text-primary; }
		&__spec { color: $dark-text-muted; background: $dark-bg-elevated; }
		&__desc { color: $dark-text-secondary; }
	}

	.warning-card {
		background: rgba(245, 158, 11, 0.06);
		border-color: rgba(245, 158, 11, 0.15);
	}

	.detail-card {
		background: $dark-bg-card;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.3);

		&__title { color: $dark-text-primary; }
	}

	.detail-row {
		border-bottom-color: $dark-border-color;

		&__label { color: $dark-text-muted; }
		&__value { color: $dark-text-primary; }
	}

	.bottom-bar {
		background: $dark-bg-card;
		border-top-color: $dark-border-color;

		&__cart-icon {
			filter: brightness(0) saturate(100%) invert(1);
			opacity: 0.85;
		}

		&__btn--secondary {
			background: $dark-bg-elevated;
			border-color: $dark-border-color;
		}

		&__btn-text {
			color: $dark-text-primary;
		}
	}

	.skeleton-pulse {
		background: linear-gradient(90deg, $dark-bg-elevated 25%, rgba($dark-bg-elevated, 0.5) 50%, $dark-bg-elevated 75%);
		background-size: 200% 100%;
	}

	.empty-state__title { color: $dark-text-primary; }
	.empty-state__desc { color: $dark-text-muted; }

	// 购物车抽屉深色
	.cart-mask--open { background: rgba(0, 0, 0, 0.65); }
	.cart-drawer { background: $dark-bg-card; }
	.handle-bar { background: $dark-border-color; }
	.cart-drawer__header { border-bottom-color: $dark-border-color; }
	.cart-drawer__title { color: $dark-text-primary; }
	.cart-drawer__count { color: $dark-text-muted; }
	.cart-item { border-bottom-color: $dark-border-color; }
	.cart-item__check { border-color: $dark-border-color; &--checked { border-color: $dark-color-primary; background: linear-gradient(135deg, $dark-color-primary, lighten($dark-color-primary, 8%)); } }
	.cart-item__img-wrap { background: $dark-bg-elevated; }
	.cart-item__name { color: $dark-text-primary; }
	.cart-item__spec { color: $dark-text-muted; }
	.cart-item__price { color: $dark-color-accent; }
	.stepper { background: $dark-bg-elevated; &__btn { color: $dark-text-primary; &--disabled { color: $dark-text-muted; } } &__num { color: $dark-text-primary; } }
	.delete-icon { &::before, &::after { background: $dark-text-muted; } }
	.cart-footer { border-top-color: $dark-border-color; }
	.footer-select__label { color: $dark-text-secondary; }
	.footer-checkbox { border-color: $dark-border-color; &--checked { border-color: $dark-color-primary; background: linear-gradient(135deg, $dark-color-primary, lighten($dark-color-primary, 8%)); } }
	.footer-summary__count { color: $dark-text-muted; }
	.footer-summary__label { color: $dark-text-secondary; }
	.footer-summary__symbol, .footer-summary__amount { color: $dark-color-accent; }
	.footer-checkout--disabled { background: $dark-bg-elevated; }
	.cart-empty__title { color: $dark-text-primary; }
	.cart-empty__desc { color: $dark-text-muted; }
}
</style>
