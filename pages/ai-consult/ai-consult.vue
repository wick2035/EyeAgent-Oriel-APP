<template>
	<view class="page" :class="{ 'page--dark': isDark }">
		<!-- 状态栏占位 -->
		<view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>

		<!-- 顶部导航栏 -->
		<view class="navbar">
			<view class="navbar__left" @click="goBack">
				<view class="back-icon"></view>
			</view>
			<text class="navbar__title">AI问诊</text>
			<view class="navbar__right" @click="showHistory">
				<view class="history-icon"></view>
			</view>
		</view>

		<!-- 内容区域 -->
		<scroll-view
			class="content"
			scroll-y
			:scroll-top="scrollTop"
			@scrolltolower="onScrollToLower"
		>
			<!-- 欢迎区域（新对话时显示） -->
			<view v-if="!hasMessages" class="welcome">
				<!-- AI头像和问候 -->
				<view class="welcome__header">
					<view class="welcome__avatar">
						<view class="ai-icon-large">
							<view class="ai-petal ai-petal--1"></view>
							<view class="ai-petal ai-petal--2"></view>
							<view class="ai-petal ai-petal--3"></view>
							<view class="ai-petal ai-petal--4"></view>
							<view class="ai-petal ai-petal--5"></view>
						</view>
					</view>
					<view class="welcome__hi">Hi</view>
				</view>
				<text class="welcome__title">我是小Eye，您的AI健康助手</text>
				<text class="welcome__subtitle">有任何健康问题都可以问我</text>

				<!-- 快捷功能条 -->
				<scroll-view class="quick-actions" scroll-x show-scrollbar="false">
					<view
						v-for="(action, index) in quickActions"
						:key="index"
						class="quick-action"
						@click="handleQuickAction(action)"
					>
						<text class="quick-action__icon">{{ action.icon }}</text>
						<text class="quick-action__text">{{ action.text }}</text>
					</view>
				</scroll-view>

				<!-- 快捷提示词 -->
				<view class="prompts">
					<view class="prompts__header">
						<text class="prompts__title">这些问题我可以帮您</text>
						<view class="prompts__refresh" @click="refreshPrompts">
							<view class="refresh-icon"></view>
							<text class="prompts__refresh-text">换一换</text>
						</view>
					</view>
					<view class="prompts__list">
						<QuickPrompt
							v-for="prompt in prompts"
							:key="prompt.id"
							:id="prompt.id"
							:text="prompt.text"
							@click="handlePromptClick"
						/>
					</view>
				</view>
			</view>

			<!-- 对话消息列表 -->
			<view v-else class="messages">
				<MessageBubble
					v-for="(msg, index) in messages"
					:key="index"
					:type="msg.type"
					:content="msg.content"
					:time="msg.time"
					:loading="msg.loading"
				/>
			</view>

			<!-- 底部占位 -->
			<view class="content__bottom-space"></view>
		</scroll-view>

		<!-- 底部输入框 -->
		<ChatInput
			ref="chatInput"
			:disabled="isSending"
			:isSending="isSending"
			@send="handleSend"
			@voice="handleVoice"
			@stop="handleStop"
		/>

		<!-- 底部导航 -->
		<TabBar :current="2" />
	</view>
</template>

<script>
import TabBar from '@/components/TabBar.vue'
import ChatInput from '@/components/ChatInput.vue'
import QuickPrompt from '@/components/QuickPrompt.vue'
import MessageBubble from '@/components/MessageBubble.vue'
import { isDarkMode } from '@/store/theme.js'
import { sendMessage, getQuickPrompts, refreshQuickPrompts } from '@/utils/api/chat.js'

export default {
	components: {
		TabBar,
		ChatInput,
		QuickPrompt,
		MessageBubble
	},
	data() {
		return {
			statusBarHeight: 44,
			scrollTop: 0,
			messages: [],
			conversationId: null,
			isSending: false,
			quickActions: [
				{ icon: '🩺', text: '症状自查', type: 'symptom' },
				{ icon: '💊', text: '用药咨询', type: 'medicine' },
				{ icon: '📋', text: '报告解读', type: 'report' },
				{ icon: '🏥', text: '科室推荐', type: 'department' },
				{ icon: '🍎', text: '健康建议', type: 'health' }
			],
			prompts: []
		}
	},
	computed: {
		isDark() {
			return isDarkMode()
		},
		hasMessages() {
			return this.messages.length > 0
		}
	},
	onLoad() {
		this.getStatusBarHeight()
		this.loadPrompts()
	},
	methods: {
		getStatusBarHeight() {
			const sysInfo = uni.getSystemInfoSync()
			this.statusBarHeight = sysInfo.statusBarHeight || 44
		},

		goBack() {
			// 如果有对话消息，返回AI默认对话页面（清空消息）
			if (this.hasMessages) {
				uni.showModal({
					title: '提示',
					content: '确定要结束当前对话吗？',
					confirmText: '确定',
					cancelText: '取消',
					success: (res) => {
						if (res.confirm) {
							this.messages = []
							this.conversationId = null
							this.scrollTop = 0
						}
					}
				})
			} else {
				// 没有对话消息，返回首页
				uni.switchTab({
					url: '/pages/index/index'
				})
			}
		},

		showHistory() {
			uni.showToast({ title: '历史记录开发中', icon: 'none' })
		},

		async loadPrompts() {
			try {
				this.prompts = await getQuickPrompts()
			} catch (e) {
				console.error('加载提示词失败:', e)
			}
		},

		async refreshPrompts() {
			try {
				this.prompts = await refreshQuickPrompts()
				uni.showToast({ title: '已刷新', icon: 'none', duration: 1000 })
			} catch (e) {
				console.error('刷新提示词失败:', e)
			}
		},

		handleQuickAction(action) {
			const messages = {
				symptom: '我想进行症状自查，请帮我分析一下',
				medicine: '我有一些用药方面的问题想咨询',
				report: '我想解读一下我的体检报告',
				department: '我不知道应该挂什么科室',
				health: '请给我一些健康建议'
			}
			this.handleSend(messages[action.type] || action.text)
		},

		handlePromptClick(prompt) {
			this.handleSend(prompt.text)
		},

		async handleSend(message) {
			if (!message || this.isSending) return

			// 添加用户消息
			this.messages.push({
				type: 'user',
				content: message,
				time: this.formatTime(new Date())
			})

			// 滚动到底部
			this.$nextTick(() => {
				this.scrollToBottom()
			})

			// 添加AI思考中状态
			this.messages.push({
				type: 'ai',
				content: '',
				loading: true
			})

			this.isSending = true

			try {
				const response = await sendMessage({
					message,
					conversationId: this.conversationId
				})

				// 更新AI消息
				const lastIndex = this.messages.length - 1
				this.messages[lastIndex] = {
					type: 'ai',
					content: response.response,
					time: this.formatTime(new Date()),
					loading: false
				}

				// 保存会话ID
				if (response.conversationId) {
					this.conversationId = response.conversationId
				}
			} catch (error) {
				// 显示错误消息
				const lastIndex = this.messages.length - 1
				this.messages[lastIndex] = {
					type: 'ai',
					content: '抱歉，网络出现问题，请稍后再试。',
					time: this.formatTime(new Date()),
					loading: false
				}
			} finally {
				this.isSending = false
				this.$nextTick(() => {
					this.scrollToBottom()
				})
			}
		},

		handleVoice() {
			uni.showToast({ title: '语音功能开发中', icon: 'none' })
		},

		handleStop() {
			// 中断当前请求
			this.isSending = false
			// 移除最后一条 loading 状态的 AI 消息
			if (this.messages.length > 0) {
				const lastMsg = this.messages[this.messages.length - 1]
				if (lastMsg.type === 'ai' && lastMsg.loading) {
					this.messages.pop()
				}
			}
			uni.showToast({ title: '已停止', icon: 'none', duration: 1000 })
		},

		formatTime(date) {
			const hours = date.getHours().toString().padStart(2, '0')
			const minutes = date.getMinutes().toString().padStart(2, '0')
			return `${hours}:${minutes}`
		},

		scrollToBottom() {
			this.scrollTop = this.scrollTop === 99999 ? 100000 : 99999
		},

		onScrollToLower() {
			// 可以在这里加载更多历史消息
		}
	}
}
</script>

<style lang="scss" scoped>
.page {
	min-height: 100vh;
	background: $bg-base;
	display: flex;
	flex-direction: column;

	&--dark {
		background: $dark-bg-base;
	}
}

.status-bar {
	flex-shrink: 0;
}

.navbar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	height: 88rpx;
	padding: 0 $spacing-lg;
	flex-shrink: 0;

	&__left, &__right {
		width: 80rpx;
		height: 80rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	&__title {
		font-size: $font-size-lg;
		font-weight: $font-weight-semibold;
		color: $text-primary;
	}
}

.back-icon {
	width: 20rpx;
	height: 20rpx;
	border-left: 4rpx solid $text-primary;
	border-bottom: 4rpx solid $text-primary;
	transform: rotate(45deg);
}

.history-icon {
	width: 40rpx;
	height: 36rpx;
	border: 3rpx solid $text-secondary;
	border-radius: 6rpx;
	position: relative;

	&::before {
		content: '';
		position: absolute;
		top: 8rpx;
		left: 6rpx;
		right: 6rpx;
		height: 3rpx;
		background: $text-secondary;
	}

	&::after {
		content: '';
		position: absolute;
		top: 18rpx;
		left: 6rpx;
		width: 60%;
		height: 3rpx;
		background: $text-secondary;
	}
}

.content {
	flex: 1;
	overflow: hidden;

	&__bottom-space {
		height: calc(200rpx + env(safe-area-inset-bottom));
	}
}

// 欢迎区域
.welcome {
	padding: $spacing-xl $spacing-lg;

	&__header {
		display: flex;
		align-items: center;
		margin-bottom: $spacing-lg;
	}

	&__avatar {
		width: 96rpx;
		height: 96rpx;
		background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(240, 147, 251, 0.1) 100%);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: $spacing-md;
	}

	&__hi {
		background: $text-primary;
		color: #fff;
		padding: $spacing-xs $spacing-md;
		border-radius: $radius-lg;
		font-size: $font-size-base;
		font-weight: $font-weight-semibold;
	}

	&__title {
		display: block;
		font-size: $font-size-3xl;
		font-weight: $font-weight-bold;
		color: $text-primary;
		margin-bottom: $spacing-sm;
	}

	&__subtitle {
		display: block;
		font-size: $font-size-base;
		color: $text-secondary;
		margin-bottom: $spacing-xl;
	}
}

// AI大图标
.ai-icon-large {
	width: 56rpx;
	height: 56rpx;
	position: relative;
	animation: ai-rotate 8s linear infinite;
}

.ai-petal {
	position: absolute;
	width: 14rpx;
	height: 22rpx;
	border-radius: 7rpx;
	top: 50%;
	left: 50%;
	transform-origin: center 18rpx;
	margin-left: -7rpx;
	margin-top: -18rpx;

	&--1 { background: #FF6B6B; transform: rotate(0deg); }
	&--2 { background: #4ECDC4; transform: rotate(72deg); }
	&--3 { background: #45B7D1; transform: rotate(144deg); }
	&--4 { background: #96CEB4; transform: rotate(216deg); }
	&--5 { background: #DDA0DD; transform: rotate(288deg); }
}

// 快捷功能条
.quick-actions {
	white-space: nowrap;
	margin-bottom: $spacing-xl;
	padding: 0 $spacing-lg;

	// 确保内容可以水平滚动
	::-webkit-scrollbar {
		display: none;
	}
}

.quick-action {
	display: inline-flex;
	align-items: center;
	padding: $spacing-sm $spacing-lg;
	background: $bg-card;
	border: 2rpx solid $border-color;
	border-radius: $radius-full;
	margin-right: $spacing-md;
	transition: all 0.25s ease;
	flex-shrink: 0;

	&:active {
		transform: scale(0.95);
		background: $bg-elevated;
	}

	&__icon {
		font-size: $font-size-lg;
		margin-right: $spacing-xs;
	}

	&__text {
		font-size: $font-size-sm;
		color: $text-primary;
		font-weight: $font-weight-medium;
	}
}

// 快捷提示词
.prompts {
	&__header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: $spacing-md;
	}

	&__title {
		font-size: $font-size-base;
		color: $text-secondary;
	}

	&__refresh {
		display: flex;
		align-items: center;
		padding: $spacing-xs $spacing-sm;
	}

	&__refresh-text {
		font-size: $font-size-sm;
		color: $color-primary;
		margin-left: $spacing-xs;
	}
}

.refresh-icon {
	width: 28rpx;
	height: 28rpx;
	border: 3rpx solid $color-primary;
	border-radius: 50%;
	border-right-color: transparent;
	animation: none;

	.prompts__refresh:active & {
		animation: refresh-spin 0.5s ease;
	}
}

// 消息列表
.messages {
	padding: $spacing-md 0;
}

// 深色模式
.page--dark {
	.navbar__title { color: $dark-text-primary; }
	.back-icon { border-color: $dark-text-primary; }
	.history-icon {
		border-color: $dark-text-secondary;
		&::before, &::after { background: $dark-text-secondary; }
	}

	.welcome__hi { background: $dark-text-primary; }
	.welcome__title { color: $dark-text-primary; }
	.welcome__subtitle { color: $dark-text-secondary; }

	.quick-action {
		background: $dark-bg-card;
		border-color: $dark-border-color;
		&__text { color: $dark-text-primary; }
	}

	.prompts__title { color: $dark-text-secondary; }
	.prompts__refresh-text { color: $dark-color-primary; }
	.refresh-icon { border-color: $dark-color-primary; border-right-color: transparent; }
}

@keyframes ai-rotate {
	from { transform: rotate(0deg); }
	to { transform: rotate(360deg); }
}

@keyframes refresh-spin {
	from { transform: rotate(0deg); }
	to { transform: rotate(360deg); }
}
</style>
