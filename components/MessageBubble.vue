<template>
	<view class="message" :class="[`message--${type}`, { 'message--dark': isDark, 'message--simple': !isDark && bubbleTheme === 'simple' }]">
		<!-- AI消息 -->
		<view v-if="type === 'ai'" class="message__avatar message__avatar--ai">
			<view class="ai-avatar">
				<view class="ai-petal ai-petal--1"></view>
				<view class="ai-petal ai-petal--2"></view>
				<view class="ai-petal ai-petal--3"></view>
				<view class="ai-petal ai-petal--4"></view>
				<view class="ai-petal ai-petal--5"></view>
			</view>
		</view>

		<view class="message__content">
			<view class="message__bubble">
				<!-- 打字机效果（AI思考中） -->
				<view v-if="loading && !streaming" class="typing-indicator">
					<view class="typing-dot"></view>
					<view class="typing-dot"></view>
					<view class="typing-dot"></view>
				</view>
				<!-- 消息文本（流式输出 / 完成） -->
				<template v-else>
					<!-- 流式输出中 / 用户消息：纯文本 + 光标 -->
					<text v-if="streaming || type === 'user'" class="message__text">{{ displayContent }}<text v-if="streaming" class="streaming-cursor">|</text></text>
					<!-- AI 消息完成：Markdown 富文本渲染 -->
					<view v-else class="md-body">
						<rich-text :nodes="renderedContent" />
					</view>
					<!-- 工具调用状态提示 -->
					<view v-if="statusText" class="tool-status">
						<text class="tool-status__text">{{ statusText }}</text>
					</view>
				</template>
			</view>

			<!-- 选项加载占位（标记已到达但 JSON 尚未完整，消除卡顿感） -->
			<view v-if="type === 'ai' && uiPending && !hasUI && !loading" class="options-loading">
				<view class="typing-dot"></view>
				<view class="typing-dot"></view>
				<view class="typing-dot"></view>
			</view>

			<!-- UI 元素（选项按钮 / 药品卡片） -->
			<template v-if="type === 'ai' && hasUI && !loading">
				<RecommendOptions
					v-if="uiType === 'options'"
					:options="uiElements.options"
					:streaming="streaming"
					@confirm="$emit('optionClick', $event)"
				/>
				<ProductCardList
					v-if="uiType === 'product_cards'"
					:products="uiElements.product_cards"
					@action="$emit('productAction', $event)"
				/>
			</template>

			<text v-if="time" class="message__time">{{ time }}</text>
		</view>

		<!-- 用户消息 -->
		<view v-if="type === 'user'" class="message__avatar message__avatar--user">
			<text class="user-avatar">我</text>
		</view>
	</view>
</template>

<script>
import { isDarkMode, themeState } from '@/store/theme.js'
import RecommendOptions from '@/components/RecommendOptions.vue'
import ProductCardList from '@/components/ProductCardList.vue'
import { markdownToHtml } from '@/utils/markdown.js'

export default {
	name: 'MessageBubble',
	components: {
		RecommendOptions,
		ProductCardList,
	},
	props: {
		type: {
			type: String,
			default: 'ai', // 'ai' | 'user'
			validator: val => ['ai', 'user'].includes(val)
		},
		content: {
			type: String,
			default: ''
		},
		time: {
			type: String,
			default: ''
		},
		loading: {
			type: Boolean,
			default: false
		},
		streaming: {
			type: Boolean,
			default: false
		},
		statusText: {
			type: String,
			default: ''
		},
		uiElements: {
			type: Object,
			default: null
		},
		uiPending: {
			type: Boolean,
			default: false
		}
	},
	computed: {
		isDark() {
			return isDarkMode()
		},
		bubbleTheme() {
			return themeState.bubbleTheme
		},
		uiType() {
			return this.uiElements?.ui_type || 'none'
		},
		hasUI() {
			return this.uiElements && this.uiType !== 'none'
		},
		renderedContent() {
			return markdownToHtml(this.displayContent)
		},
		displayContent() {
			if (!this.content) return ''
			let text = this.content
			// ── agent 路由 JSON 被 ```json 代码块包裹的情形 ──
			// 极早期：仅有 ```json 标记，{ 还未到达
			text = text.replace(/^\s*```json\s*\n?$/, '')
			// 完整代码块 + 完整 JSON + 闭合 ```
			text = text.replace(/^\s*```(?:json)?\s*\n?\{[^}]*"agent"\s*:\s*"[^"]*"[^}]*\}\s*\n?```\s*\n?/g, '')
			// 完整 JSON，闭合 ``` 还未到达
			text = text.replace(/^\s*```(?:json)?\s*\n?\{[^}]*"agent"\s*:\s*"[^"]*"[^}]*\}\s*\n?/g, '')
			// JSON 流式中（} 还未到达）
			text = text.replace(/^\s*```(?:json)?\s*\n?\{[^}]*"agent"[^}]*/g, '')
			// ── agent 路由 JSON 裸格式（原有逻辑） ──
			// 完整 agent 路由 JSON（有闭合 }）
			text = text.replace(/^\s*\{[^}]*"agent"\s*:\s*"[^"]*"[^}]*\}/g, '')
			// 不完整 agent 路由 JSON（流式中 } 还未到达，防止闪现）
			text = text.replace(/^\s*\{[^}]*"agent"[^}]*/g, '')
			// 完整 <tool_call> 块（含块内 JSON）
			text = text.replace(/<tool_call>[\s\S]*?<\/tool_call>/g, '')
			// 不完整 <tool_call> 块（流式中 </tool_call> 还未到达）
			text = text.replace(/<tool_call>[\s\S]*/g, '')
			// 孤立标签兜底
			text = text.replace(/<\/?tool_call>/g, '')
			// UI 标记：精确匹配（含 ]）
			text = text.replace(/\[OPTIONS\][\s\S]*/g, '')
			text = text.replace(/\[PRODUCTS\][\s\S]*/g, '')
			text = text.replace(/\[PRODUCT_CARDS\][\s\S]*/g, '')
			// UI 标记：前缀匹配（流式中 ] 还未到达，防止闪现）
			text = text.replace(/\[OPTIONS[\s\S]*/g, '')
			text = text.replace(/\[PRODUCTS[\s\S]*/g, '')
			text = text.replace(/\[PRODUCT_CARDS[\s\S]*/g, '')
			text = text.replace(/\n{3,}/g, '\n\n').trim()
			return text
		}
	}
}
</script>

<style lang="scss" scoped>
.message {
	display: flex;
	align-items: flex-start;
	padding: $spacing-md $spacing-lg;
	animation: messageIn 0.3s ease;

	&--user {
		justify-content: flex-end;

		.message__content {
			display: flex;
			flex-direction: column;
			align-items: flex-end;
		}

		.message__bubble {
			background: linear-gradient(135deg, #667EEA 0%, #764BA2 50%, #F093FB 100%);
			color: #fff;
			border-radius: 20rpx 20rpx 6rpx 20rpx;
			box-shadow: 0 4rpx 16rpx rgba(102, 126, 234, 0.3);
		}

		.message__text {
			color: #fff;
			letter-spacing: 0.5rpx;
		}

		.message__time {
			text-align: right;
		}

		.message__avatar {
			margin-left: $spacing-md;
			margin-right: 0;
			order: 1;
		}
	}

	// 简明主题：用户气泡优雅浅蓝色（仅浅色模式下生效）
	&--simple {
		&.message--user {
			.message__bubble {
				background: #D7E5FD;
				box-shadow: 0 2rpx 12rpx rgba(22, 80, 180, 0.12);
			}

			.message__text {
				color: #1A1A1A;
			}

			.message__avatar--user {
				background: #4A90E2;
			}
		}
	}

	&--ai {
		.message__bubble {
			background: #fff;
			border: 1rpx solid rgba(102, 126, 234, 0.1);
			border-radius: 20rpx 20rpx 20rpx 6rpx;
			box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
		}

		.message__text {
			color: #374151;
		}
	}

	&__avatar {
		width: 72rpx;
		height: 72rpx;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		margin-right: $spacing-md;

		&--user {
			background: linear-gradient(135deg, #667EEA 0%, #764BA2 50%, #F093FB 100%);
		}

		&--ai {
			background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(240, 147, 251, 0.1) 100%);
		}
	}

	&__content {
		max-width: calc(100% - 160rpx);
	}

	&__bubble {
		display: inline-block;
		padding: 16rpx 24rpx;
		max-width: 100%;
	}

	&__text {
		font-size: $font-size-base;
		line-height: $line-height-relaxed;
		word-break: break-word;
	}

	&__time {
		font-size: $font-size-xs;
		color: $text-muted;
		margin-top: $spacing-xs;
		display: block;
	}

	// 深色模式
	&--dark {
		&.message--ai .message__bubble {
			background: #1F2937;
			border-color: rgba(102, 126, 234, 0.15);
			box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.2);
		}

		&.message--ai .message__text {
			color: rgba(255, 255, 255, 0.92);
		}

		&.message--user .message__bubble {
			background: linear-gradient(135deg, #5A67D8 0%, #6B46A0 50%, #D53F8C 100%);
			box-shadow: 0 4rpx 16rpx rgba(102, 126, 234, 0.35);
		}

		&.message--user .message__text {
			color: #fff;
		}

		.message__time {
			color: $dark-text-muted;
		}

		.streaming-cursor {
			color: #8B9CF7;
		}

		.tool-status {
			border-top-color: rgba(255, 255, 255, 0.08);
		}

		.tool-status__text {
			color: #8B9CF7;
		}

		.message__avatar--user {
			background: linear-gradient(135deg, #5A67D8 0%, #6B46A0 50%, #D53F8C 100%);
		}
	}
}

// AI头像
.ai-avatar {
	width: 48rpx;
	height: 48rpx;
	position: relative;
	animation: ai-rotate 6s linear infinite;
}

.ai-petal {
	position: absolute;
	width: 10rpx;
	height: 18rpx;
	border-radius: 5rpx;
	top: 50%;
	left: 50%;
	transform-origin: center 14rpx;
	margin-left: -5rpx;
	margin-top: -14rpx;

	&--1 { background: #FF6B6B; transform: rotate(0deg); }
	&--2 { background: #4ECDC4; transform: rotate(72deg); }
	&--3 { background: #45B7D1; transform: rotate(144deg); }
	&--4 { background: #96CEB4; transform: rotate(216deg); }
	&--5 { background: #DDA0DD; transform: rotate(288deg); }
}

// 用户头像
.user-avatar {
	font-size: $font-size-sm;
	color: #fff;
	font-weight: $font-weight-semibold;
}

// 流式输出光标
.streaming-cursor {
	color: #667EEA;
	font-weight: 300;
	animation: cursor-blink 0.8s infinite;
}

@keyframes cursor-blink {
	0%, 50% { opacity: 1; }
	51%, 100% { opacity: 0; }
}

// 工具调用状态
.tool-status {
	margin-top: 12rpx;
	padding-top: 12rpx;
	border-top: 1rpx solid rgba(0, 0, 0, 0.06);
}

.tool-status__text {
	font-size: 24rpx;
	color: #667EEA;
}

// 打字指示器
.typing-indicator {
	display: flex;
	align-items: center;
	gap: 8rpx;
	padding: 8rpx 0;
}

.typing-dot {
	width: 12rpx;
	height: 12rpx;
	background: $text-muted;
	border-radius: 50%;
	animation: typingBounce 1.4s ease-in-out infinite;

	&:nth-child(2) { animation-delay: 0.2s; }
	&:nth-child(3) { animation-delay: 0.4s; }
}

@keyframes ai-rotate {
	from { transform: rotate(0deg); }
	to { transform: rotate(360deg); }
}

@keyframes messageIn {
	from {
		opacity: 0;
		transform: translateY(20rpx);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

@keyframes typingBounce {
	0%, 60%, 100% {
		transform: translateY(0);
	}
	30% {
		transform: translateY(-8rpx);
	}
}

// 选项/卡片加载占位
.options-loading {
	display: flex;
	align-items: center;
	gap: 8rpx;
	padding: 16rpx 4rpx 8rpx;
}

// ============================================================
// Markdown 富文本渲染区域
// ============================================================
.md-body {
	width: 100%;

	// 首尾元素消除多余外边距，与气泡 padding 完美贴合
	:deep(*:first-child) { margin-top: 0 !important; }
	:deep(*:last-child)  { margin-bottom: 0 !important; }

	// H2 — 主标题：重量感 + 品牌紫细线
	:deep(.md-h2) {
		font-size: $font-size-lg;
		font-weight: $font-weight-bold;
		color: $text-primary;
		line-height: $line-height-tight;
		margin: 20rpx 0 10rpx;
		padding-bottom: 8rpx;
		border-bottom: 2rpx solid rgba(102, 126, 234, 0.22);
		letter-spacing: -0.5rpx;
	}

	// H3 — 次标题：清晰但不喧宾夺主
	:deep(.md-h3) {
		font-size: $font-size-md;
		font-weight: $font-weight-semibold;
		color: $text-primary;
		line-height: $line-height-normal;
		margin: 16rpx 0 8rpx;
	}

	// H4 — 三级标题
	:deep(.md-h4) {
		font-size: $font-size-base;
		font-weight: $font-weight-semibold;
		color: $text-secondary;
		margin: 12rpx 0 6rpx;
	}

	// 正文段落
	:deep(.md-p) {
		font-size: $font-size-base;
		color: #374151;
		line-height: $line-height-relaxed;
		margin: 0 0 10rpx;
	}

	// 加粗
	:deep(strong) {
		font-weight: $font-weight-semibold;
		color: $text-primary;
	}

	// 斜体
	:deep(em) {
		font-style: italic;
		color: $text-secondary;
	}

	// 行内代码：品牌紫色系，轻盈徽标感
	:deep(.md-code-i) {
		font-family: $font-family-mono;
		font-size: 0.88em;
		color: #5A4FCF;
		background: #EEF2FF;
		padding: 2rpx 8rpx;
		border-radius: 6rpx;
	}

	// 代码块：沉稳的紫色调面板
	:deep(.md-pre) {
		background: #F5F3FF;
		border: 1rpx solid #DDD6FE;
		border-radius: $radius-md;
		padding: $spacing-md;
		margin: $spacing-sm 0;
		overflow-x: auto;

		code {
			font-family: $font-family-mono;
			font-size: $font-size-sm;
			color: #3730A3;
			white-space: pre-wrap;
			word-break: break-all;
		}
	}

	// 无序列表
	:deep(.md-ul) {
		margin: 6rpx 0 10rpx;
		padding: 0;
		list-style: none;
	}

	// 有序列表
	:deep(.md-ol) {
		margin: 6rpx 0 10rpx;
		padding-left: 40rpx;
	}

	:deep(.md-li) {
		font-size: $font-size-base;
		color: #374151;
		line-height: $line-height-relaxed;
		margin-bottom: 6rpx;
		display: flex;
		align-items: flex-start;
	}

	// 品牌紫圆点
	:deep(.md-dot) {
		color: #667EEA;
		font-weight: $font-weight-bold;
		margin-right: 10rpx;
		flex-shrink: 0;
		line-height: $line-height-relaxed;
	}

	// 引用块：品牌紫左边框 + 极淡背景
	:deep(.md-blockquote) {
		border-left: 4rpx solid #667EEA;
		background: rgba(102, 126, 234, 0.05);
		border-radius: 0 $radius-sm $radius-sm 0;
		padding: $spacing-sm $spacing-md;
		margin: $spacing-sm 0;

		p {
			font-size: $font-size-base;
			color: $text-secondary;
			font-style: italic;
			margin: 0;
			line-height: $line-height-relaxed;
		}
	}

	// 分割线
	:deep(.md-hr) {
		border: none;
		border-top: 1rpx solid $border-color;
		margin: $spacing-md 0;
	}
}

// 深色模式 Markdown 适配
.message--dark {
	.md-body {
		:deep(.md-h2) {
			color: $dark-text-primary;
			border-bottom-color: rgba(102, 126, 234, 0.2);
		}

		:deep(.md-h3),
		:deep(.md-h4) {
			color: $dark-text-primary;
		}

		:deep(.md-p),
		:deep(.md-li) {
			color: rgba(255, 255, 255, 0.88);
		}

		:deep(strong) { color: $dark-text-primary; }
		:deep(em)     { color: $dark-text-secondary; }

		:deep(.md-code-i) {
			color: #A5B4FC;
			background: #1E1B4B;
		}

		:deep(.md-pre) {
			background: #13111D;
			border-color: #2D2657;

			code { color: #C4B5FD; }
		}

		:deep(.md-blockquote) {
			background: rgba(102, 126, 234, 0.08);

			p { color: $dark-text-secondary; }
		}

		:deep(.md-hr) {
			border-top-color: rgba(255, 255, 255, 0.08);
		}
	}
}
</style>
