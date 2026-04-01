<template>
	<view class="page" :class="{ 'page--dark': isDark }">

		<!-- 固定头部 -->
		<view class="fixed-header" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="navbar" :class="{ 'navbar--visible': showNavbar }">
				<view class="navbar__back" @click="goBack">
					<view class="back-icon"></view>
				</view>
				<text class="navbar__title">订单详情</text>
				<view class="navbar__placeholder"></view>
			</view>
		</view>

		<!-- 头部占位 -->
		<view class="header-placeholder" :style="{ height: (statusBarHeight + 44) + 'px' }"></view>

		<!-- 加载状态 -->
		<view v-if="loading" class="loading-wrap">
			<view v-for="i in 3" :key="i" class="skeleton-section">
				<view class="skeleton-bar skeleton-bar--title"></view>
				<view class="skeleton-bar skeleton-bar--line"></view>
				<view class="skeleton-bar skeleton-bar--line skeleton-bar--short"></view>
			</view>
		</view>

		<!-- 详情内容 -->
		<scroll-view v-else-if="order" class="content" scroll-y>

			<!-- ① 订单状态卡片 -->
			<view class="status-card" :class="'status-card--' + order.orderStatus.toLowerCase()"
			      :style="{ '--i': 0 }" ref="section0">
				<view class="status-card__icon-wrap">
					<view class="status-card__icon" :class="'status-card__icon--' + order.orderStatus.toLowerCase()">
						<!-- 待支付 -->
						<text v-if="order.orderStatus === 'PENDING_PAYMENT'" class="status-icon-text">¥</text>
						<!-- 已支付 -->
						<view v-else-if="order.orderStatus === 'PAID'" class="status-icon-pickup"></view>
						<!-- 已完成 -->
						<view v-else-if="order.orderStatus === 'COMPLETED'" class="status-icon-check"></view>
						<!-- 已取消/已过期 -->
						<view v-else class="status-icon-x"></view>
					</view>
				</view>
				<view class="status-card__info">
					<text class="status-card__title">{{ getStatusText(order.orderStatus) }}</text>
					<text class="status-card__desc">{{ getStatusDesc(order) }}</text>
				</view>
				<!-- 待支付倒计时 -->
				<view v-if="order.orderStatus === 'PENDING_PAYMENT' && countdownText" class="status-card__countdown">
					<text class="countdown-text">{{ countdownText }}</text>
				</view>
			</view>

			<!-- ② 药品清单 -->
			<view class="section" :style="{ '--i': 1 }" ref="section1">
				<view class="section__header">
					<view class="section__bar"></view>
					<text class="section__title">药品清单</text>
					<text class="section__badge">{{ order.items.length }}种</text>
				</view>

				<view class="drug-list">
					<view v-for="(item, index) in order.items" :key="item.drugId"
					      class="drug-item" :style="{ '--drug-i': index }">
						<view class="drug-item__img-wrap">
							<image class="drug-item__img" src="/static/medicine.svg" mode="aspectFit" />
						</view>
						<view class="drug-item__info">
							<text class="drug-item__name">{{ item.drugName }}</text>
							<text v-if="item.drugSpecification" class="drug-item__spec">{{ item.drugSpecification }}</text>
						</view>
						<view class="drug-item__right">
							<text class="drug-item__price">¥{{ formatPrice(item.unitPrice) }}</text>
							<text class="drug-item__qty">×{{ item.quantity }}</text>
						</view>
						<view class="drug-item__subtotal">
							<text class="drug-item__subtotal-text">¥{{ formatPrice(item.subtotal) }}</text>
						</view>
					</view>
				</view>

				<!-- 合计 -->
				<view class="total-bar">
					<text class="total-bar__label">合计</text>
					<view class="total-bar__amount">
						<text class="total-bar__symbol">¥</text>
						<text class="total-bar__value">{{ formatPrice(order.totalAmount) }}</text>
					</view>
				</view>
			</view>

			<!-- ③ 订单信息 -->
			<view class="section" :style="{ '--i': 2 }" ref="section2">
				<view class="section__header">
					<view class="section__bar"></view>
					<text class="section__title">订单信息</text>
				</view>

				<view class="info-group">
					<view class="info-row">
						<text class="info-row__label">订单编号</text>
						<view class="info-row__value-wrap">
							<text class="info-row__value">{{ order.orderNo }}</text>
							<view class="copy-btn" @click="copyOrderNo">
								<text class="copy-btn__text">复制</text>
							</view>
						</view>
					</view>
					<view class="info-row">
						<text class="info-row__label">订单类型</text>
						<text class="info-row__value">{{ order.orderType === 'PRESCRIPTION' ? '处方订单' : '自选订单' }}</text>
					</view>
					<view class="info-row">
						<text class="info-row__label">创建时间</text>
						<text class="info-row__value">{{ formatTime(order.createTime) }}</text>
					</view>
					<view v-if="order.paymentMethod" class="info-row">
						<text class="info-row__label">支付方式</text>
						<text class="info-row__value">{{ getPaymentText(order.paymentMethod) }}</text>
					</view>
					<view v-if="order.paidTime" class="info-row">
						<text class="info-row__label">支付时间</text>
						<text class="info-row__value">{{ formatTime(order.paidTime) }}</text>
					</view>
					<view v-if="order.expireTime && order.orderStatus === 'PENDING_PAYMENT'" class="info-row">
						<text class="info-row__label">过期时间</text>
						<text class="info-row__value info-row__value--warn">{{ formatTime(order.expireTime) }}</text>
					</view>
					<view v-if="order.remark" class="info-row info-row--last">
						<text class="info-row__label">备注</text>
						<text class="info-row__value">{{ order.remark }}</text>
					</view>
				</view>
			</view>

			<!-- ④ 处方信息（处方订单才显示） -->
			<view v-if="order.orderType === 'PRESCRIPTION'" class="section" :style="{ '--i': 3 }">
				<view class="section__header">
					<view class="section__bar section__bar--rx"></view>
					<text class="section__title">处方信息</text>
				</view>
				<view class="info-group">
					<view v-if="order.prescriptionId" class="info-row">
						<text class="info-row__label">处方编号</text>
						<text class="info-row__value">{{ order.prescriptionId }}</text>
					</view>
					<view v-if="order.doctorId" class="info-row info-row--last">
						<text class="info-row__label">开方医生</text>
						<text class="info-row__value">{{ order.doctorId }}</text>
					</view>
				</view>
			</view>

			<view class="safe-area"></view>
		</scroll-view>

		<!-- 错误状态 -->
		<view v-else-if="!loading" class="error-wrap">
			<text class="error-text">订单不存在或已失效</text>
			<view class="error-btn" @click="goBack">
				<text class="error-btn__text">返回</text>
			</view>
		</view>

		<!-- ⑤ 底部操作栏 -->
		<view v-if="order && showBottomBar" class="bottom-bar">
			<!-- 待支付 -->
			<template v-if="order.orderStatus === 'PENDING_PAYMENT'">
				<view class="bottom-btn bottom-btn--ghost" @click="handleCancel">
					<text class="bottom-btn__text">取消订单</text>
				</view>
				<view class="bottom-btn bottom-btn--primary" @click="handlePay">
					<text class="bottom-btn__text">立即支付</text>
					<text class="bottom-btn__amount">¥{{ formatPrice(order.totalAmount) }}</text>
				</view>
			</template>

			<!-- 已支付 -->
			<template v-else-if="order.orderStatus === 'PAID'">
				<view class="bottom-btn bottom-btn--primary bottom-btn--full" @click="handleConfirmReceive">
					<text class="bottom-btn__text">确认收货</text>
				</view>
			</template>

			<!-- 已完成 -->
			<template v-else-if="order.orderStatus === 'COMPLETED'">
				<view class="bottom-btn bottom-btn--primary bottom-btn--full" @click="handleRebuy">
					<text class="bottom-btn__text">再次购买</text>
				</view>
			</template>
		</view>

		<!-- 顶部通知栏 -->
		<TopNotificationBar />
	</view>
</template>

<script>
import { isDarkMode } from '@/store/theme.js'
import { getOrderDetail, payOrder, cancelOrder, confirmReceive } from '@/utils/api/order.js'
import { addCartItem } from '@/utils/api/cart.js'
import { initCart } from '@/store/cart.js'
import TopNotificationBar from '@/components/TopNotificationBar.vue'

export default {
	components: { TopNotificationBar },
	data() {
		return {
			statusBarHeight: 44,
			showNavbar: false,
			loading: true,
			orderId: '',
			order: null,
			countdownText: '',
			countdownTimer: null
		}
	},

	computed: {
		isDark() {
			return isDarkMode()
		},
		showBottomBar() {
			if (!this.order) return false
			return ['PENDING_PAYMENT', 'PAID', 'COMPLETED'].includes(this.order.orderStatus)
		}
	},

	onLoad(options) {
		this.orderId = options.id || ''
		const sysInfo = uni.getSystemInfoSync()
		this.statusBarHeight = sysInfo.statusBarHeight || 44
		this.loadDetail()
	},

	onUnload() {
		if (this.countdownTimer) clearInterval(this.countdownTimer)
	},

	methods: {
		async loadDetail() {
			this.loading = true
			try {
				const res = await getOrderDetail(this.orderId)
				if (res.code === 200 && res.data) {
					this.order = res.data
					// 启动倒计时
					if (this.order.orderStatus === 'PENDING_PAYMENT' && this.order.expireTime) {
						this.startCountdown()
					}
				} else {
					this.order = null
				}
			} catch (e) {
				console.error('[order-detail] 加载失败:', e)
				this.order = null
			} finally {
				this.loading = false
				this.$nextTick(() => {
					setTimeout(() => { this.showNavbar = true }, 50)
				})
			}
		},

		startCountdown() {
			const update = () => {
				const now = Date.now()
				const expire = new Date(this.order.expireTime).getTime()
				const diff = expire - now
				if (diff <= 0) {
					this.countdownText = '已超时'
					clearInterval(this.countdownTimer)
					return
				}
				const h = Math.floor(diff / 3600000)
				const m = Math.floor((diff % 3600000) / 60000)
				const s = Math.floor((diff % 60000) / 1000)
				this.countdownText = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
			}
			update()
			this.countdownTimer = setInterval(update, 1000)
		},

		getStatusText(status) {
			const map = {
				PENDING_PAYMENT: '等待支付',
				PAID: '待自取',
				COMPLETED: '交易完成',
				CANCELLED: '已取消',
				EXPIRED: '已过期'
			}
			return map[status] || status
		},

		getStatusDesc(order) {
			const map = {
				PENDING_PAYMENT: '请在有效期内完成支付，超时订单将自动关闭',
				PAID: '请前往医院药房凭订单号取药',
				COMPLETED: '感谢您的信赖，祝您早日康复',
				CANCELLED: '订单已取消，库存已自动归还',
				EXPIRED: '订单超时未支付，已自动关闭'
			}
			return map[order.orderStatus] || ''
		},

		getPaymentText(method) {
			const map = { MOCK: '模拟支付', WECHAT: '微信支付', ALIPAY: '支付宝' }
			return map[method] || method
		},

		formatPrice(amount) {
			if (typeof amount !== 'number') return '0.00'
			return amount.toFixed(2)
		},

		formatTime(timeStr) {
			if (!timeStr) return '--'
			return timeStr.replace('T', ' ').slice(0, 19)
		},

		copyOrderNo() {
			uni.setClipboardData({
				data: this.order.orderNo,
				success: () => {
					uni.showToast({ title: '已复制', icon: 'success' })
				}
			})
		},

		// ---- 操作 ----
		async handlePay() {
			uni.showLoading({ title: '支付中...' })
			try {
				const res = await payOrder(this.order.id)
				uni.hideLoading()
				if (res.code === 200) {
					uni.showToast({ title: '支付成功', icon: 'success' })
					if (this.countdownTimer) clearInterval(this.countdownTimer)
					this.loadDetail()
				} else {
					uni.showToast({ title: res.msg || '支付失败', icon: 'none' })
				}
			} catch (e) {
				uni.hideLoading()
				uni.showToast({ title: '支付失败', icon: 'none' })
			}
		},

		handleCancel() {
			uni.showModal({
				title: '取消订单',
				content: '确认取消该订单吗？取消后不可恢复。',
				confirmText: '确认取消',
				confirmColor: '#EF4444',
				success: async ({ confirm }) => {
					if (!confirm) return
					const res = await cancelOrder(this.order.id)
					if (res.code === 200) {
						uni.showToast({ title: '订单已取消', icon: 'success' })
						if (this.countdownTimer) clearInterval(this.countdownTimer)
						this.loadDetail()
					} else {
						uni.showToast({ title: res.msg || '操作失败', icon: 'none' })
					}
				}
			})
		},

		handleConfirmReceive() {
			uni.showModal({
				title: '确认收货',
				content: '确认已取到商品吗？',
				success: async ({ confirm }) => {
					if (!confirm) return
					const res = await confirmReceive(this.order.id)
					if (res.code === 200) {
						uni.showToast({ title: '已确认收货', icon: 'success' })
						this.loadDetail()
					} else {
						uni.showToast({ title: res.msg || '操作失败', icon: 'none' })
					}
				}
			})
		},

		async handleRebuy() {
			uni.showLoading({ title: '加入购物车中...' })
			try {
				for (const item of this.order.items) {
					await addCartItem(item.drugId, item.quantity)
				}
				await initCart()
				uni.hideLoading()
				uni.showToast({ title: '已加入购物车', icon: 'success' })
			} catch (e) {
				uni.hideLoading()
				uni.showToast({ title: '操作失败', icon: 'none' })
			}
		},

		goBack() {
			uni.navigateBack()
		}
	}
}
</script>

<style lang="scss" scoped>
// ============================================================
// 页面基础
// ============================================================
.page {
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

.navbar {
	display: flex;
	align-items: center;
	height: 88rpx;
	padding: 0 $spacing-md;
	opacity: 0;
	transform: translateY(-16rpx);
	transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);

	&--visible {
		opacity: 1;
		transform: translateY(0);
	}

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

	&__placeholder {
		width: 72rpx;
	}
}

.back-icon {
	width: 20rpx;
	height: 20rpx;
	border-left: 4rpx solid $text-primary;
	border-bottom: 4rpx solid $text-primary;
	transform: rotate(45deg);
}

// ============================================================
// 加载骨架屏
// ============================================================
.loading-wrap {
	padding: $spacing-lg;
	display: flex;
	flex-direction: column;
	gap: $spacing-lg;
}

.skeleton-section {
	background: $bg-card;
	border-radius: $radius-lg;
	padding: $spacing-xl;
	display: flex;
	flex-direction: column;
	gap: $spacing-md;
}

.skeleton-bar {
	border-radius: $radius-sm;
	background: $bg-elevated;
	animation: shimmer 1.5s infinite;

	&--title {
		width: 40%;
		height: 36rpx;
	}

	&--line {
		width: 80%;
		height: 28rpx;
	}

	&--short {
		width: 55%;
	}
}

@keyframes shimmer {
	0%, 100% { opacity: 0.5; }
	50% { opacity: 1; }
}

// ============================================================
// 内容区
// ============================================================
.content {
	height: calc(100vh - var(--header-h, 88px));
}

// ============================================================
// ① 订单状态卡片
// ============================================================
.status-card {
	margin: $spacing-md $spacing-lg;
	padding: $spacing-xl $spacing-lg;
	border-radius: $radius-lg;
	display: flex;
	align-items: center;
	gap: $spacing-lg;
	position: relative;
	overflow: hidden;
	// 入场动画
	opacity: 0;
	transform: translateY(28rpx);
	animation: section-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) calc(var(--i, 0) * 80ms + 100ms) forwards;

	// 默认渐变（待支付）
	background: linear-gradient(135deg, #1E3A5F 0%, #2D6A9F 60%, #4A90D9 100%);

	&--paid {
		background: linear-gradient(135deg, #D97706 0%, #F59E0B 60%, #FBBF24 100%);
	}

	&--completed {
		background: linear-gradient(135deg, #047857 0%, #10B981 60%, #34D399 100%);
	}

	&--cancelled, &--expired {
		background: linear-gradient(135deg, #4B5563 0%, #6B7280 60%, #9CA3AF 100%);
	}

	// 装饰性光斑
	&::before {
		content: '';
		position: absolute;
		top: -40%;
		right: -10%;
		width: 240rpx;
		height: 240rpx;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.08);
	}

	&::after {
		content: '';
		position: absolute;
		bottom: -60%;
		left: 20%;
		width: 300rpx;
		height: 300rpx;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.05);
	}

	&__icon-wrap {
		flex-shrink: 0;
		z-index: 1;
	}

	&__icon {
		width: 88rpx;
		height: 88rpx;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.2);
		display: flex;
		align-items: center;
		justify-content: center;
		backdrop-filter: blur(8px);
	}

	&__info {
		flex: 1;
		min-width: 0;
		z-index: 1;
	}

	&__title {
		display: block;
		font-size: $font-size-xl;
		font-weight: $font-weight-bold;
		color: #fff;
		margin-bottom: 6rpx;
	}

	&__desc {
		display: block;
		font-size: $font-size-xs;
		color: rgba(255, 255, 255, 0.75);
		line-height: $line-height-normal;
	}

	&__countdown {
		flex-shrink: 0;
		z-index: 1;
		padding: 8rpx 20rpx;
		background: rgba(255, 255, 255, 0.2);
		border-radius: $radius-sm;
		backdrop-filter: blur(8px);
	}
}

.countdown-text {
	font-size: $font-size-base;
	font-weight: $font-weight-bold;
	color: #fff;
	font-family: $font-family-mono;
	letter-spacing: 2rpx;
}

// 状态图标内容
.status-icon-text {
	font-size: 44rpx;
	font-weight: $font-weight-bold;
	color: #fff;
}

.status-icon-check {
	width: 28rpx;
	height: 42rpx;
	border-right: 6rpx solid #fff;
	border-bottom: 6rpx solid #fff;
	transform: rotate(40deg) translate(-4rpx, -4rpx);
}

.status-icon-pickup {
	width: 36rpx;
	height: 36rpx;
	border: 5rpx solid #fff;
	border-radius: $radius-sm;
	position: relative;

	&::after {
		content: '';
		position: absolute;
		top: -12rpx;
		left: 50%;
		transform: translateX(-50%);
		width: 24rpx;
		height: 12rpx;
		border: 4rpx solid #fff;
		border-bottom: none;
		border-radius: 12rpx 12rpx 0 0;
	}
}

.status-icon-x {
	width: 32rpx;
	height: 32rpx;
	position: relative;

	&::before, &::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		width: 32rpx;
		height: 5rpx;
		background: #fff;
		border-radius: 3rpx;
	}

	&::before { transform: translate(-50%, -50%) rotate(45deg); }
	&::after  { transform: translate(-50%, -50%) rotate(-45deg); }
}

// ============================================================
// 通用 Section
// ============================================================
.section {
	margin: 0 $spacing-lg $spacing-md;
	background: $bg-card;
	border-radius: $radius-lg;
	box-shadow: $shadow-sm;
	overflow: hidden;
	// 入场动画
	opacity: 0;
	transform: translateY(28rpx);
	animation: section-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) calc(var(--i, 0) * 80ms + 100ms) forwards;

	&__header {
		display: flex;
		align-items: center;
		gap: $spacing-sm;
		padding: $spacing-lg $spacing-lg $spacing-md;
	}

	&__bar {
		width: 6rpx;
		height: 28rpx;
		border-radius: 3rpx;
		background: linear-gradient(180deg, $color-primary 0%, #4A90D9 100%);

		&--rx {
			background: linear-gradient(180deg, $color-error 0%, #F97316 100%);
		}
	}

	&__title {
		font-size: $font-size-md;
		font-weight: $font-weight-bold;
		color: $text-primary;
	}

	&__badge {
		font-size: $font-size-xs;
		color: $text-muted;
		margin-left: auto;
	}
}

@keyframes section-in {
	from {
		opacity: 0;
		transform: translateY(28rpx);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

// ============================================================
// ② 药品清单
// ============================================================
.drug-list {
	padding: 0 $spacing-lg;
}

.drug-item {
	display: flex;
	align-items: center;
	gap: $spacing-md;
	padding: $spacing-md 0;
	border-bottom: 1rpx solid $border-color-light;
	// 入场动画
	opacity: 0;
	transform: translateX(16rpx);
	animation: drug-in 0.45s ease calc(var(--drug-i, 0) * 70ms + 360ms) forwards;

	&:last-child {
		border-bottom: none;
	}

	&__img-wrap {
		width: 96rpx;
		height: 96rpx;
		border-radius: $radius-md;
		background: $bg-elevated;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	&__img {
		width: 64rpx;
		height: 64rpx;
		opacity: 0.6;
	}

	&__info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 4rpx;
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

	&__right {
		flex-shrink: 0;
		text-align: right;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 4rpx;
	}

	&__price {
		font-size: $font-size-sm;
		color: $text-secondary;
		font-weight: $font-weight-medium;
	}

	&__qty {
		font-size: $font-size-xs;
		color: $text-muted;
	}

	&__subtotal {
		flex-shrink: 0;
		min-width: 120rpx;
		text-align: right;
	}

	&__subtotal-text {
		font-size: $font-size-base;
		color: $color-accent;
		font-weight: $font-weight-bold;
		font-family: $font-family-mono;
	}
}

@keyframes drug-in {
	from {
		opacity: 0;
		transform: translateX(16rpx);
	}
	to {
		opacity: 1;
		transform: translateX(0);
	}
}

// 合计行
.total-bar {
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: $spacing-md;
	padding: $spacing-md $spacing-lg;
	border-top: 2rpx solid $border-color-light;
	background: $bg-elevated;

	&__label {
		font-size: $font-size-base;
		color: $text-secondary;
		font-weight: $font-weight-medium;
	}

	&__amount {
		display: flex;
		align-items: baseline;
		gap: 2rpx;
	}

	&__symbol {
		font-size: $font-size-base;
		color: $color-accent;
		font-weight: $font-weight-bold;
	}

	&__value {
		font-size: $font-size-3xl;
		color: $color-accent;
		font-weight: $font-weight-bold;
		font-family: $font-family-mono;
		line-height: 1;
	}
}

// ============================================================
// ③ 订单信息
// ============================================================
.info-group {
	padding: 0 $spacing-lg $spacing-md;
}

.info-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: $spacing-sm 0;
	border-bottom: 1rpx solid $border-color-light;

	&--last, &:last-child {
		border-bottom: none;
	}

	&__label {
		font-size: $font-size-base;
		color: $text-muted;
		flex-shrink: 0;
	}

	&__value-wrap {
		display: flex;
		align-items: center;
		gap: $spacing-sm;
	}

	&__value {
		font-size: $font-size-base;
		color: $text-primary;
		text-align: right;

		&--warn {
			color: $color-warning;
		}
	}
}

.copy-btn {
	padding: 4rpx 16rpx;
	border: 1rpx solid $border-color;
	border-radius: $radius-sm;
	transition: opacity $transition-fast;

	&:active {
		opacity: 0.5;
	}

	&__text {
		font-size: 20rpx;
		color: $text-muted;
	}
}

// ============================================================
// ⑤ 底部操作栏
// ============================================================
.bottom-bar {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	display: flex;
	align-items: center;
	gap: $spacing-md;
	padding: $spacing-md $spacing-lg;
	padding-bottom: calc($spacing-md + env(safe-area-inset-bottom));
	background: $bg-card;
	box-shadow: 0 -4rpx 20rpx rgba(30, 58, 95, 0.08);
	z-index: 50;
}

.bottom-btn {
	height: 88rpx;
	border-radius: $radius-md;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: $spacing-xs;
	transition: transform $transition-fast, opacity $transition-fast;

	&:active {
		transform: scale(0.97);
		opacity: 0.9;
	}

	&--ghost {
		flex: 1;
		border: 2rpx solid $border-color;
		background: transparent;

		.bottom-btn__text {
			color: $text-secondary;
			font-size: $font-size-base;
			font-weight: $font-weight-medium;
		}
	}

	&--primary {
		flex: 2;
		background: linear-gradient(135deg, #1E3A5F 0%, #2D6A9F 60%, #4A90D9 100%);
		box-shadow: 0 6rpx 24rpx rgba(30, 58, 95, 0.3);

		.bottom-btn__text {
			color: #fff;
			font-size: $font-size-md;
			font-weight: $font-weight-bold;
		}

		.bottom-btn__amount {
			color: rgba(255, 255, 255, 0.8);
			font-size: $font-size-sm;
			font-family: $font-family-mono;
		}
	}

	&--full {
		flex: 1;
	}
}

// ============================================================
// 错误 / 空状态
// ============================================================
.error-wrap {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: $spacing-2xl;
	min-height: 60vh;
}

.error-text {
	font-size: $font-size-lg;
	color: $text-muted;
	margin-bottom: $spacing-xl;
}

.error-btn {
	padding: $spacing-sm $spacing-2xl;
	background: $bg-elevated;
	border-radius: $radius-md;

	&__text {
		font-size: $font-size-base;
		color: $text-secondary;
	}
}

// ============================================================
// 安全区
// ============================================================
.safe-area {
	height: calc(180rpx + env(safe-area-inset-bottom));
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

	// 骨架屏
	.skeleton-section {
		background: $dark-bg-card;
	}

	.skeleton-bar {
		background: $dark-bg-elevated;
	}

	// Section
	.section {
		background: $dark-bg-card;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.4);
	}

	.section__title {
		color: $dark-text-primary;
	}

	.section__badge {
		color: $dark-text-muted;
	}

	// 药品
	.drug-item {
		border-bottom-color: $dark-border-color;
	}

	.drug-item__img-wrap {
		background: $dark-bg-elevated;
	}

	.drug-item__name {
		color: $dark-text-primary;
	}

	.drug-item__spec {
		color: $dark-text-muted;
	}

	.drug-item__price {
		color: $dark-text-secondary;
	}

	.drug-item__qty {
		color: $dark-text-muted;
	}

	.drug-item__subtotal-text {
		color: $dark-color-accent;
	}

	// 合计行
	.total-bar {
		background: $dark-bg-elevated;
		border-top-color: $dark-border-color;
	}

	.total-bar__label {
		color: $dark-text-secondary;
	}

	.total-bar__symbol, .total-bar__value {
		color: $dark-color-accent;
	}

	// 信息行
	.info-row {
		border-bottom-color: $dark-border-color;
	}

	.info-row__label {
		color: $dark-text-muted;
	}

	.info-row__value {
		color: $dark-text-primary;
	}

	.copy-btn {
		border-color: $dark-border-color;
	}

	.copy-btn__text {
		color: $dark-text-muted;
	}

	// 底部栏
	.bottom-bar {
		background: $dark-bg-card;
		box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.5);
	}

	.bottom-btn--ghost {
		border-color: $dark-border-color;

		.bottom-btn__text {
			color: $dark-text-secondary;
		}
	}

	// 错误状态
	.error-text {
		color: $dark-text-muted;
	}

	.error-btn {
		background: $dark-bg-elevated;
	}

	.error-btn__text {
		color: $dark-text-secondary;
	}
}
</style>
