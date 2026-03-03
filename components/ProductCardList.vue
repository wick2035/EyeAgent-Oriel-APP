<template>
	<view v-if="products && products.length" class="product-list" :class="{ 'product-list--dark': isDark }">
		<scroll-view
			class="product-list__scroll"
			scroll-x
			:show-scrollbar="false"
			enhanced
			:bounces="true"
		>
			<view class="product-list__inner">
				<view
					v-for="(product, index) in products"
					:key="product.product_id"
					class="product-card"
					:class="{
						'product-card--out-of-stock': product.stock_status === 'OUT_OF_STOCK'
					}"
					:style="{ animationDelay: Math.min(index * 0.1, 0.4) + 's' }"
					@click="handleViewDetail(product)"
				>
					<!-- 图片区域 -->
					<view class="product-card__image-section">
						<image
							v-if="product.image_url"
							class="product-card__image"
							:src="product.image_url"
							mode="aspectFill"
							lazy-load
						/>
						<view v-else class="product-card__image-placeholder">
							<text class="product-card__placeholder-icon">💊</text>
						</view>
						<!-- 底部渐变过渡 -->
						<view class="product-card__image-fade"></view>
						<!-- 徽章 -->
						<view class="product-card__badges">
							<view v-if="product.is_prescription" class="product-card__badge product-card__badge--rx">
								<text class="product-card__badge-text">处方药</text>
							</view>
							<view v-if="product.stock_status === 'LOW_STOCK'" class="product-card__badge product-card__badge--stock">
								<text class="product-card__badge-text">库存紧张</text>
							</view>
						</view>
					</view>

					<!-- 内容区域 -->
					<view class="product-card__content">
						<text class="product-card__name">{{ product.product_name }}</text>
						<view v-if="product.specification" class="product-card__spec-wrap">
							<text class="product-card__spec">{{ product.specification }}</text>
						</view>
						<text v-if="product.indications" class="product-card__indications">{{ product.indications }}</text>
					</view>

					<!-- 价格区域 -->
					<view class="product-card__price-section">
						<view class="product-card__price">
							<text class="product-card__price-symbol">¥</text>
							<text class="product-card__price-integer">{{ priceInteger(product.unit_price) }}</text>
							<text class="product-card__price-decimal">.{{ priceDecimal(product.unit_price) }}</text>
						</view>
						<text v-if="product.stock_status === 'OUT_OF_STOCK'" class="product-card__sold-out">已售罄</text>
					</view>

					<!-- 操作按钮 -->
					<view class="product-card__actions">
						<view
							class="product-card__action product-card__action--secondary"
							@click.stop="handleAction(product, 'VIEW_DETAIL')"
						>
							<text class="product-card__action-text product-card__action-text--secondary">查看详情</text>
						</view>
						<view
							class="product-card__action product-card__action--primary"
							:class="{
								'product-card__action--disabled': product.stock_status === 'OUT_OF_STOCK'
							}"
							@click.stop="handlePrimaryAction(product)"
						>
							<text class="product-card__action-text product-card__action-text--primary">
								{{ getPrimaryLabel(product) }}
							</text>
						</view>
					</view>
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script>
import { isDarkMode } from '@/store/theme.js'

export default {
	name: 'ProductCardList',
	props: {
		products: {
			type: Array,
			required: true
		}
	},
	computed: {
		isDark() {
			return isDarkMode()
		}
	},
	methods: {
		handlePrimaryAction(product) {
			if (product.stock_status === 'OUT_OF_STOCK') return
			this.$emit('action', {
				...product,
				_actionType: product.action_type
			})
		},

		handleAction(product, actionType) {
			this.$emit('action', {
				...product,
				_actionType: actionType
			})
		},

		handleViewDetail(product) {
			this.$emit('action', {
				...product,
				_actionType: 'VIEW_DETAIL'
			})
		},

		getPrimaryLabel(product) {
			if (product.stock_status === 'OUT_OF_STOCK') return '暂时缺货'
			switch (product.action_type) {
				case 'ADD_TO_CART': return '立即购买'
				case 'PRESCRIBE': return '开具处方'
				case 'VIEW_DETAIL': return '立即购买'
				default: return product.action_label || '立即购买'
			}
		},

		priceInteger(price) {
			if (typeof price !== 'number') return '0'
			return Math.floor(price).toString()
		},

		priceDecimal(price) {
			if (typeof price !== 'number') return '00'
			return (price % 1).toFixed(2).substring(2)
		}
	}
}
</script>

<style lang="scss" scoped>
.product-list {
	margin-top: $spacing-md;

	&__scroll {
		white-space: nowrap;
	}

	&__inner {
		display: inline-flex;
		gap: $spacing-md;
		padding: $spacing-xs $spacing-xs $spacing-sm;
	}

	// ============ 深色模式 ============
	&--dark {
		.product-card {
			background: rgba(22, 27, 34, 0.95);
			border-color: rgba(255, 255, 255, 0.06);
			box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.4);
		}

		.product-card__name {
			color: $dark-text-primary;
		}

		.product-card__spec {
			background: rgba(255, 255, 255, 0.08);
			color: $dark-text-secondary;
		}

		.product-card__indications {
			color: $dark-text-muted;
		}

		.product-card__price-symbol,
		.product-card__price-integer,
		.product-card__price-decimal {
			color: $dark-color-accent;
		}

		.product-card__price-section {
			border-top-color: rgba(255, 255, 255, 0.04);
		}

		.product-card__image-section {
			background: $dark-bg-elevated;
		}

		.product-card__image-placeholder {
			background: linear-gradient(135deg, #1a2332 0%, #1f2d3d 100%);
		}

		.product-card__image-fade {
			background: linear-gradient(
				to bottom,
				transparent 0%,
				rgba(22, 27, 34, 0.95) 100%
			);
		}

		.product-card__badge--rx {
			background: rgba(239, 68, 68, 0.25);
			border-color: rgba(239, 68, 68, 0.3);
		}

		.product-card__badge--stock {
			background: rgba(245, 158, 11, 0.25);
			border-color: rgba(245, 158, 11, 0.3);
		}

		.product-card__action--primary {
			background: linear-gradient(135deg, #5A67D8 0%, #6B46A0 100%);
		}

		.product-card__action--secondary {
			border-color: rgba(255, 255, 255, 0.12);
		}

		.product-card__action-text--secondary {
			color: $dark-text-secondary;
		}

		.product-card__action--disabled {
			background: $dark-bg-elevated;
		}

		.product-card__sold-out {
			color: $dark-text-muted;
		}
	}
}

.product-card {
	display: inline-flex;
	flex-direction: column;
	width: 340rpx;
	flex-shrink: 0;
	background: #FFFFFF;
	border: 1rpx solid rgba(0, 0, 0, 0.04);
	border-radius: $radius-xl;
	box-shadow: 0 4rpx 24rpx rgba(30, 58, 95, 0.06),
				0 1rpx 4rpx rgba(30, 58, 95, 0.04);
	overflow: hidden;
	position: relative;
	white-space: normal;
	animation: cardSlideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) backwards;
	transition: transform $transition-normal, box-shadow $transition-normal;

	&:active {
		transform: scale(0.97);
		box-shadow: 0 2rpx 12rpx rgba(30, 58, 95, 0.08);
	}

	&--out-of-stock {
		opacity: 0.55;

		.product-card__image {
			filter: grayscale(0.6);
		}
	}

	// ======== 图片区域 ========
	&__image-section {
		position: relative;
		width: 100%;
		height: 220rpx;
		background: $bg-elevated;
		overflow: hidden;
	}

	&__image {
		width: 100%;
		height: 100%;
	}

	&__image-placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #F0F5FA 0%, #E8EDF5 100%);
	}

	&__placeholder-icon {
		font-size: 72rpx;
	}

	&__image-fade {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 60rpx;
		background: linear-gradient(
			to bottom,
			transparent 0%,
			rgba(255, 255, 255, 0.95) 100%
		);
		pointer-events: none;
	}

	// ======== 徽章 ========
	&__badges {
		position: absolute;
		top: $spacing-sm;
		left: $spacing-sm;
		display: flex;
		gap: $spacing-xs;
		z-index: 2;
	}

	&__badge {
		padding: 4rpx 14rpx;
		border-radius: $radius-sm;
		backdrop-filter: blur(8px);
	}

	&__badge--rx {
		background: rgba(239, 68, 68, 0.12);
		border: 1rpx solid rgba(239, 68, 68, 0.15);
	}

	&__badge--stock {
		background: rgba(245, 158, 11, 0.12);
		border: 1rpx solid rgba(245, 158, 11, 0.15);
	}

	&__badge-text {
		font-size: 20rpx;
		font-weight: $font-weight-medium;
		line-height: 1.4;
	}

	&__badge--rx &__badge-text {
		color: $color-error;
	}

	&__badge--stock &__badge-text {
		color: $color-warning;
	}

	// ======== 内容区域 ========
	&__content {
		padding: $spacing-md $spacing-md $spacing-sm;
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	&__name {
		display: -webkit-box;
		font-size: $font-size-base;
		font-weight: $font-weight-semibold;
		color: $text-primary;
		line-height: $line-height-tight;
		overflow: hidden;
		text-overflow: ellipsis;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		margin-bottom: $spacing-xs;
	}

	&__spec-wrap {
		margin-bottom: $spacing-xs;
	}

	&__spec {
		display: inline;
		font-size: 20rpx;
		color: $text-secondary;
		background: rgba(30, 58, 95, 0.05);
		padding: 2rpx 12rpx;
		border-radius: $radius-xs;
		line-height: 1.6;
	}

	&__indications {
		display: block;
		font-size: $font-size-xs;
		color: $text-muted;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		margin-top: 4rpx;
		line-height: 1.5;
	}

	// ======== 价格区域 ========
	&__price-section {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		padding: $spacing-sm $spacing-md;
		border-top: 1rpx solid rgba(0, 0, 0, 0.03);
	}

	&__price {
		display: flex;
		align-items: baseline;
	}

	&__price-symbol {
		font-size: $font-size-sm;
		color: $color-accent;
		font-weight: $font-weight-semibold;
		margin-right: 2rpx;
	}

	&__price-integer {
		font-size: 36rpx;
		color: $color-accent;
		font-weight: $font-weight-bold;
		font-family: $font-family-mono;
		line-height: 1;
	}

	&__price-decimal {
		font-size: $font-size-xs;
		color: $color-accent;
		font-weight: $font-weight-medium;
		font-family: $font-family-mono;
	}

	&__sold-out {
		font-size: $font-size-xs;
		color: $text-muted;
		font-weight: $font-weight-medium;
	}

	// ======== 操作按钮 ========
	&__actions {
		display: flex;
		gap: $spacing-sm;
		padding: 0 $spacing-md $spacing-md;
	}

	&__action {
		flex: 1;
		height: 60rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: $radius-md;
		transition: all $transition-fast;
		position: relative;
		overflow: hidden;

		&:active {
			transform: scale(0.96);
		}
	}

	&__action--primary {
		background: $gradient-ai;

		&::after {
			content: '';
			position: absolute;
			top: 0;
			left: -100%;
			width: 100%;
			height: 100%;
			background: linear-gradient(
				90deg,
				transparent 0%,
				rgba(255, 255, 255, 0.15) 50%,
				transparent 100%
			);
			animation: btnShimmer 4s ease-in-out infinite;
		}
	}

	&__action--secondary {
		background: transparent;
		border: 1rpx solid rgba(0, 0, 0, 0.08);
	}

	&__action--disabled {
		background: $bg-elevated;
		opacity: 0.5;

		&::after {
			display: none;
		}

		.product-card__action-text--primary {
			color: $text-muted;
		}
	}

	&__action-text {
		font-size: $font-size-xs;
		font-weight: $font-weight-medium;
		position: relative;
		z-index: 1;
	}

	&__action-text--primary {
		color: #FFFFFF;
	}

	&__action-text--secondary {
		color: $text-secondary;
	}
}

@keyframes cardSlideIn {
	from {
		opacity: 0;
		transform: translateX(40rpx) scale(0.95);
	}
	to {
		opacity: 1;
		transform: translateX(0) scale(1);
	}
}

@keyframes btnShimmer {
	0% { left: -100%; }
	40%, 100% { left: 100%; }
}
</style>
