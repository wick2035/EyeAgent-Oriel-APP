<template>
	<view class="chat-image" @click="preview">
		<image
			:src="src"
			class="chat-image__img"
			mode="widthFix"
			:lazy-load="true"
			@error="onError"
		/>
		<view v-if="loadError" class="chat-image__error">
			<text class="chat-image__error-text">图片加载失败</text>
		</view>
	</view>
</template>

<script>
export default {
	name: 'ChatImageMessage',
	props: {
		src: {
			type: String,
			default: ''
		},
		allImages: {
			type: Array,
			default: () => []
		}
	},
	data() {
		return {
			loadError: false
		}
	},
	methods: {
		preview() {
			if (!this.src || this.loadError) return
			const urls = this.allImages.length > 0 ? this.allImages : [this.src]
			uni.previewImage({
				urls,
				current: this.src
			})
		},
		onError() {
			this.loadError = true
		}
	}
}
</script>

<style lang="scss" scoped>
.chat-image {
	max-width: 360rpx;
	border-radius: 12rpx;
	overflow: hidden;

	&__img {
		width: 100%;
		display: block;
	}

	&__error {
		width: 360rpx;
		height: 200rpx;
		background: $bg-elevated;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	&__error-text {
		font-size: $font-size-xs;
		color: $text-muted;
	}
}
</style>
