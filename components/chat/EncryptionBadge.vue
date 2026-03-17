<template>
	<view class="badge" :class="{ 'badge--dark': isDark }">
		<text class="badge__icon">&#128274;</text>
		<text class="badge__text">端到端加密</text>
	</view>
</template>

<script>
import { isDarkMode } from '@/store/theme.js'

export default {
	name: 'EncryptionBadge',
	computed: {
		isDark() {
			return isDarkMode()
		}
	}
}
</script>

<style lang="scss" scoped>
.badge {
	display: flex;
	align-items: center;
	gap: 4rpx;

	&__icon {
		font-size: 18rpx;
	}

	&__text {
		font-size: 20rpx;
		color: $color-success;
		font-weight: $font-weight-medium;
	}
}

.badge--dark {
	.badge__text {
		color: #34D399;
	}
}
</style>
