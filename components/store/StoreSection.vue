<template>
	<view class="store-section" :class="{ 'store-section--dark': isDark }">
		<view class="store-section__header">
			<text class="store-section__title">网上商城</text>
			<text class="store-section__more" @click="goToStore">更多</text>
		</view>

		<!-- 促销Banner -->
		<view class="promo-banner" @click="goToStore">
			<view class="promo-banner__icon">
				<text class="promo-banner__emoji">🏥</text>
			</view>
			<view class="promo-banner__content">
				<text class="promo-banner__title">眼科用药专区</text>
				<text class="promo-banner__desc">非处方药自选 · 品质保障</text>
			</view>
			<text class="promo-banner__arrow">›</text>
		</view>

		<!-- 骨架屏（模仿健康资讯卡片形态） -->
		<view v-if="loading" class="store-section__list">
			<view v-for="i in 2" :key="'sk-' + i" class="drug-item drug-item--skeleton">
				<view class="drug-item__content">
					<view class="skeleton-line skeleton-pulse" style="width: 70%"></view>
					<view class="skeleton-line skeleton-pulse" style="width: 45%; margin-top: 12rpx"></view>
					<view class="skeleton-line skeleton-pulse" style="width: 30%; margin-top: 16rpx"></view>
				</view>
				<view class="drug-item__cover-placeholder skeleton-pulse"></view>
			</view>
		</view>

		<!-- 药品列表（与健康资讯同比例卡片） -->
		<view v-else-if="products.length" class="store-section__list">
			<view
				v-for="(item, index) in products"
				:key="item.product_id"
				class="drug-item"
				:style="{ animationDelay: index * 0.05 + 's' }"
				@click="goDetail(item)"
			>
				<view class="drug-item__content">
					<text class="drug-item__name">{{ item.product_name }}</text>
					<text v-if="item.specification" class="drug-item__spec">{{ item.specification }}</text>
					<view class="drug-item__meta">
						<view class="drug-item__price">
							<text class="drug-item__price-symbol">¥</text>
							<text class="drug-item__price-value">{{ formatPrice(item.unit_price) }}</text>
						</view>
						<text v-if="item.category" class="drug-item__category">{{ item.category }}</text>
					</view>
				</view>
				<view class="drug-item__cover-wrap">
					<image
						v-if="item.image_url"
						class="drug-item__cover"
						:src="item.image_url"
						mode="aspectFill"
					/>
					<view v-else class="drug-item__cover-fallback">
						<text class="drug-item__cover-emoji">💊</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 空状态 -->
		<view v-else class="store-section__empty">
			<text class="store-section__empty-text">暂无推荐商品</text>
		</view>
	</view>
</template>

<script>
import { getDrugPage, mapDrugToProduct } from '@/utils/api/drug.js'
import { isDarkMode } from '@/store/theme.js'

export default {
	name: 'StoreSection',
	data() {
		return {
			products: [],
			loading: true
		}
	},
	computed: {
		isDark() {
			return isDarkMode()
		}
	},
	mounted() {
		this.loadHotProducts()
	},
	methods: {
		async loadHotProducts() {
			this.loading = true
			try {
				const res = await getDrugPage({ pageNum: 1, pageSize: 3 })
				if (res.code === 200 && Array.isArray(res.data)) {
					this.products = res.data.map(mapDrugToProduct)
				}
			} catch (e) {
				console.error('[StoreSection] 加载热门商品失败:', e)
			} finally {
				this.loading = false
			}
		},

		formatPrice(price) {
			if (typeof price !== 'number') return '0.00'
			return price.toFixed(2)
		},

		goDetail(item) {
			uni.navigateTo({
				url: `/pages/store/drug-detail?drugId=${item.product_id}`
			})
		},

		goToStore() {
			uni.navigateTo({ url: '/pages/store/drug-list' })
		}
	}
}
</script>

<style lang="scss" scoped>
.store-section {
	position: relative;
	z-index: 1;
	padding: 0 $spacing-lg;
	margin-top: $spacing-lg;

	&__header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: $spacing-md;
	}

	&__title {
		font-size: $font-size-lg;
		font-weight: $font-weight-semibold;
		color: $text-primary;
	}

	&__more {
		font-size: $font-size-sm;
		color: $color-primary;
	}

	&__empty {
		text-align: center;
		padding: $spacing-xl 0;
	}

	&__empty-text {
		font-size: $font-size-sm;
		color: $text-muted;
	}
}

// ============================================================
// 促销 Banner
// ============================================================
.promo-banner {
	display: flex;
	align-items: center;
	gap: $spacing-md;
	padding: $spacing-md $spacing-lg;
	margin-bottom: $spacing-md;
	background: linear-gradient(135deg, rgba($color-primary, 0.08) 0%, rgba(59, 158, 232, 0.12) 100%);
	border-radius: $radius-lg;
	border: 1rpx solid rgba($color-primary, 0.1);

	&:active {
		opacity: 0.85;
	}

	&__icon {
		width: 72rpx;
		height: 72rpx;
		background: rgba($color-primary, 0.1);
		border-radius: $radius-md;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	&__emoji {
		font-size: 36rpx;
	}

	&__content {
		flex: 1;
	}

	&__title {
		font-size: $font-size-base;
		font-weight: $font-weight-semibold;
		color: $color-primary;
		display: block;
	}

	&__desc {
		font-size: $font-size-xs;
		color: $text-secondary;
		margin-top: 4rpx;
		display: block;
	}

	&__arrow {
		font-size: $font-size-2xl;
		color: $color-primary;
		opacity: 0.5;
		flex-shrink: 0;
	}
}

// ============================================================
// 药品卡片（与健康资讯 news-item 同结构同比例）
// ============================================================
.drug-item {
	background: $bg-card;
	border-radius: $radius-lg;
	padding: $spacing-md;
	margin-bottom: $spacing-md;
	box-shadow: $shadow-sm;
	display: flex;
	animation: fadeInUp 0.4s ease backwards;

	&:active {
		transform: scale(0.98);
		opacity: 0.9;
	}

	&__content {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	&__name {
		font-size: $font-size-base;
		font-weight: $font-weight-medium;
		color: $text-primary;
		line-height: $line-height-normal;
		margin-bottom: $spacing-xs;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	&__spec {
		font-size: $font-size-sm;
		color: $text-secondary;
		margin-bottom: $spacing-sm;
	}

	&__meta {
		display: flex;
		align-items: center;
		margin-top: auto;
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

	&__price-value {
		font-size: $font-size-lg;
		color: $color-accent;
		font-weight: $font-weight-bold;
		font-family: $font-family-mono;
		line-height: 1;
	}

	&__category {
		font-size: $font-size-xs;
		color: $text-muted;
		margin-left: $spacing-md;
	}

	// 右侧图片（与 news-item__cover 同尺寸）
	&__cover-wrap {
		width: 180rpx;
		height: 120rpx;
		border-radius: $radius-md;
		margin-left: $spacing-md;
		flex-shrink: 0;
		overflow: hidden;
	}

	&__cover {
		width: 100%;
		height: 100%;
	}

	&__cover-fallback {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #f0f5fa 0%, #e8edf3 100%);
	}

	&__cover-emoji {
		font-size: 48rpx;
		opacity: 0.5;
	}

	&__cover-placeholder {
		width: 180rpx;
		height: 120rpx;
		border-radius: $radius-md;
		margin-left: $spacing-md;
		flex-shrink: 0;
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
// 深色模式
// ============================================================
.store-section--dark {
	.store-section__title {
		color: $dark-text-primary;
	}

	.store-section__more {
		color: $dark-color-primary;
	}

	.store-section__empty-text {
		color: $dark-text-muted;
	}

	.promo-banner {
		background: linear-gradient(135deg, rgba(74, 144, 217, 0.1) 0%, rgba(59, 158, 232, 0.08) 100%);
		border-color: rgba(74, 144, 217, 0.15);

		&__icon {
			background: rgba(74, 144, 217, 0.12);
		}

		&__title {
			color: $dark-color-primary;
		}

		&__desc {
			color: $dark-text-secondary;
		}

		&__arrow {
			color: $dark-color-primary;
		}
	}

	.drug-item {
		background: $dark-bg-card;

		&__name {
			color: $dark-text-primary;
		}

		&__spec {
			color: $dark-text-secondary;
		}

		&__price-symbol,
		&__price-value {
			color: $dark-color-accent;
		}

		&__category {
			color: $dark-text-muted;
		}

		&__cover-fallback {
			background: linear-gradient(135deg, $dark-bg-elevated 0%, darken($dark-bg-elevated, 3%) 100%);
		}
	}

	.skeleton-pulse {
		background: linear-gradient(90deg, $dark-bg-elevated 25%, rgba($dark-bg-elevated, 0.5) 50%, $dark-bg-elevated 75%);
		background-size: 200% 100%;
	}
}
</style>
