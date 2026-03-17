<template>
	<view class="page" :class="{ 'page--dark': isDark }">
		<!-- 状态栏占位 -->
		<view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>

		<!-- 导航栏 -->
		<view class="navbar">
			<view class="navbar__back" @click="goBack">
				<view class="navbar__back-icon"></view>
			</view>
			<view class="navbar__center">
				<text class="navbar__title">{{ doctorName }}</text>
				<view class="navbar__sub-row">
					<text v-if="department" class="navbar__sub">{{ department }}</text>
					<EncryptionBadge />
				</view>
			</view>
			<view class="navbar__right"></view>
		</view>

		<!-- 输入状态指示 -->
		<TypingIndicator :visible="isTyping" />

		<!-- 会话关闭提示 -->
		<view v-if="sessionClosed" class="closed-banner">
			<text class="closed-banner__text">会话已关闭，仅可查看历史消息</text>
		</view>

		<!-- 聊天消息区域 -->
		<scroll-view
			class="chat-area"
			scroll-y
			:scroll-into-view="scrollToId"
			:scroll-with-animation="true"
			@scrolltoupper="loadMore"
		>
			<!-- 加载更多 -->
			<view v-if="hasMore" class="load-more" @click="loadMore">
				<view v-if="loadingMore" class="load-more__spinner"></view>
				<text v-else class="load-more__text">加载更早的消息</text>
			</view>

			<!-- 消息列表 -->
			<view v-for="(msg, index) in messages" :key="msg.id" :id="'msg-' + msg.id">
				<DoctorChatBubble
					:message="msg"
					:avatar="doctorAvatar"
					:show-time="shouldShowTime(msg, index)"
					@retry="handleRetry"
				/>
			</view>

			<!-- 底部锚点 -->
			<view id="chat-bottom" style="height: 20rpx;"></view>
		</scroll-view>

		<!-- 底部输入栏 -->
		<view class="input-bar" v-if="!sessionClosed">
			<view class="input-bar__inner">
				<!-- 图片选择 -->
				<view class="input-bar__action" @click="chooseImage">
					<view class="input-bar__action-icon input-bar__action-icon--image"></view>
				</view>

				<!-- 文本输入 -->
				<input
					class="input-bar__input"
					type="text"
					v-model="inputText"
					:placeholder="inputPlaceholder"
					:placeholder-style="isDark ? 'color: #484F58' : 'color: #9AABBF'"
					:confirm-type="'send'"
					:adjust-position="false"
					@input="onInput"
					@confirm="handleSend"
				/>

				<!-- 发送按钮 -->
				<view
					class="input-bar__send"
					:class="{ 'input-bar__send--active': inputText.trim() }"
					@click="handleSend"
				>
					<view class="input-bar__send-icon"></view>
				</view>
			</view>
			<!-- 安全区 -->
			<view class="input-bar__safe"></view>
		</view>

		<!-- 关闭会话时的底部占位 -->
		<view v-if="sessionClosed" class="closed-bottom">
			<view class="input-bar__safe"></view>
		</view>

		<TopNotificationBar />
	</view>
</template>

<script>
import { isDarkMode } from '@/store/theme.js'
import { getUserInfo } from '@/store/user.js'
import { ensureE2EEReady } from '@/utils/crypto/e2eeCrypto.js'
import {
	fetchMessages,
	sendTextMessage,
	sendImageMessage,
	retryMessage,
	markSessionRead,
	setActiveSession,
	clearActiveSession,
	getSessionMessages,
	getPaginationState,
	getTypingState,
	chatState
} from '@/store/chat.js'
import { sendTyping } from '@/utils/chatWebSocket.js'

import DoctorChatBubble from '@/components/chat/DoctorChatBubble.vue'
import TypingIndicator from '@/components/chat/TypingIndicator.vue'
import EncryptionBadge from '@/components/chat/EncryptionBadge.vue'
import TopNotificationBar from '@/components/TopNotificationBar.vue'

export default {
	components: {
		DoctorChatBubble,
		TypingIndicator,
		EncryptionBadge,
		TopNotificationBar
	},
	data() {
		return {
			statusBarHeight: 44,
			sessionId: '',
			doctorName: '',
			department: '',
			doctorAvatar: '',
			inputText: '',
			scrollToId: '',
			loadingMore: false,
			initLoading: true,
			sessionClosed: false,
			typingDebounce: null
		}
	},
	computed: {
		isDark() {
			return isDarkMode()
		},
		messages() {
			return getSessionMessages(this.sessionId)
		},
		hasMore() {
			const pag = getPaginationState(this.sessionId)
			return pag.hasMore
		},
		isTyping() {
			const state = getTypingState(this.sessionId)
			return state.isTyping
		},
		inputPlaceholder() {
			return this.initLoading ? '正在建立安全连接...' : '输入消息...'
		}
	},
	async onLoad(options) {
		this.sessionId = options.sessionId || ''
		this.doctorName = options.name || '医生'
		this.department = options.department || ''
		this.doctorAvatar = options.avatar || ''
		this.getStatusBarHeight()

		if (!this.sessionId) {
			uni.showToast({ title: '会话参数缺失', icon: 'none' })
			setTimeout(() => uni.navigateBack(), 1500)
			return
		}

		// 设置当前活跃会话
		setActiveSession(this.sessionId)

		try {
			// 确保 E2EE 就绪
			await ensureE2EEReady()

			// 检查会话状态
			const session = chatState.sessions[this.sessionId]
			if (session && session.status === 'CLOSED') {
				this.sessionClosed = true
			}

			// 加载第一页消息
			await fetchMessages(this.sessionId, 1)

			// 标记已读
			await markSessionRead(this.sessionId)

			this.initLoading = false

			// 滚动到底部
			this.$nextTick(() => {
				this.scrollToBottom()
			})
		} catch (err) {
			console.error('初始化聊天失败:', err)
			this.initLoading = false
			uni.showToast({ title: '加载聊天失败', icon: 'none' })
		}

		// 监听实时消息
		uni.$on(`chat-new-message-${this.sessionId}`, this.onNewMessage)
		// 监听已读回执
		uni.$on(`chat-read-receipt-${this.sessionId}`, this.onReadReceipt)
	},
	onShow() {
		if (this.sessionId) {
			setActiveSession(this.sessionId)
			markSessionRead(this.sessionId)
		}
	},
	onHide() {
		clearActiveSession()
	},
	onUnload() {
		clearActiveSession()
		// 停止输入状态
		if (this.sessionId) {
			sendTyping(this.sessionId, false)
		}
		// 清除定时器
		if (this.typingDebounce) {
			clearTimeout(this.typingDebounce)
		}
		// 取消事件监听
		uni.$off(`chat-new-message-${this.sessionId}`, this.onNewMessage)
		uni.$off(`chat-read-receipt-${this.sessionId}`, this.onReadReceipt)
	},
	methods: {
		getStatusBarHeight() {
			const sysInfo = uni.getSystemInfoSync()
			this.statusBarHeight = sysInfo.statusBarHeight || 44
		},

		goBack() {
			uni.navigateBack()
		},

		// 发送文本消息
		async handleSend() {
			const text = this.inputText.trim()
			if (!text) return

			this.inputText = ''

			try {
				await sendTextMessage(this.sessionId, text)
				this.$nextTick(() => this.scrollToBottom())
			} catch (err) {
				uni.showToast({ title: '发送失败', icon: 'none' })
			}
		},

		// 选择并发送图片
		chooseImage() {
			uni.chooseImage({
				count: 1,
				sizeType: ['compressed'],
				sourceType: ['album', 'camera'],
				success: async (res) => {
					const filePath = res.tempFilePaths[0]
					try {
						await sendImageMessage(this.sessionId, filePath)
						this.$nextTick(() => this.scrollToBottom())
					} catch (err) {
						uni.showToast({ title: '图片发送失败', icon: 'none' })
					}
				}
			})
		},

		// 输入事件（发送输入状态）
		onInput() {
			if (this.typingDebounce) {
				clearTimeout(this.typingDebounce)
			}
			sendTyping(this.sessionId, true)
			this.typingDebounce = setTimeout(() => {
				// 防抖结束后 chatWebSocket 会自动发送 isTyping: false
			}, 3000)
		},

		// 加载更多历史消息
		async loadMore() {
			if (this.loadingMore) return
			const pag = getPaginationState(this.sessionId)
			if (!pag.hasMore) return

			this.loadingMore = true
			try {
				await fetchMessages(this.sessionId, pag.page + 1)
			} catch (err) {
				console.error('加载更多失败:', err)
			} finally {
				this.loadingMore = false
			}
		},

		// 重试发送
		async handleRetry(messageId) {
			try {
				await retryMessage(this.sessionId, messageId)
				this.$nextTick(() => this.scrollToBottom())
			} catch (err) {
				uni.showToast({ title: '重试失败', icon: 'none' })
			}
		},

		// 收到新消息
		onNewMessage(msg) {
			// 标记已读
			markSessionRead(this.sessionId)
			// 滚动到底部
			this.$nextTick(() => this.scrollToBottom())
		},

		// 收到已读回执
		onReadReceipt() {
			// 消息状态已在 store 中更新，Vue 响应式自动刷新
		},

		// 滚动到底部
		scrollToBottom() {
			this.scrollToId = ''
			this.$nextTick(() => {
				this.scrollToId = 'chat-bottom'
			})
		},

		// 判断是否显示时间戳（与上一条消息间隔超过5分钟）
		shouldShowTime(msg, index) {
			if (index === 0) return true
			const prev = this.messages[index - 1]
			if (!prev || !prev.createTime || !msg.createTime) return false
			const diff = new Date(msg.createTime) - new Date(prev.createTime)
			return diff > 5 * 60 * 1000
		}
	}
}
</script>

<style lang="scss" scoped>
.page {
	height: 100vh;
	overflow: hidden;
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

// 导航栏
.navbar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	height: 88rpx;
	padding: 0 $spacing-lg;
	flex-shrink: 0;
	border-bottom: 1rpx solid $border-color-light;

	&__back {
		width: 64rpx;
		height: 64rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		transition: background 0.15s ease;

		&:active {
			background: rgba(30, 58, 95, 0.06);
		}
	}

	&__back-icon {
		width: 20rpx;
		height: 20rpx;
		border-left: 4rpx solid $text-primary;
		border-bottom: 4rpx solid $text-primary;
		transform: rotate(45deg);
		margin-left: 8rpx;
	}

	&__center {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	&__title {
		font-size: $font-size-lg;
		font-weight: $font-weight-semibold;
		color: $text-primary;
		line-height: $line-height-tight;
	}

	&__sub-row {
		display: flex;
		align-items: center;
		gap: 8rpx;
		margin-top: 2rpx;
	}

	&__sub {
		font-size: $font-size-xs;
		color: $text-muted;
	}

	&__right {
		width: 64rpx;
	}
}

// 会话关闭提示
.closed-banner {
	padding: $spacing-sm $spacing-lg;
	background: rgba(245, 158, 11, 0.08);
	border-bottom: 1rpx solid rgba(245, 158, 11, 0.15);
	flex-shrink: 0;

	&__text {
		font-size: $font-size-xs;
		color: #D97706;
		text-align: center;
		display: block;
	}
}

// 聊天区域
.chat-area {
	flex: 1;
	overflow: hidden;
}

// 加载更多
.load-more {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: $spacing-md;

	&__text {
		font-size: $font-size-xs;
		color: $text-muted;
	}

	&__spinner {
		width: 36rpx;
		height: 36rpx;
		border: 3rpx solid $border-color-light;
		border-top-color: $color-primary;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}
}

@keyframes spin {
	to { transform: rotate(360deg); }
}

// 底部输入栏
.input-bar {
	flex-shrink: 0;
	background: $bg-card;
	border-top: 1rpx solid $border-color-light;
	padding: $spacing-sm $spacing-lg;

	&__inner {
		display: flex;
		align-items: center;
		gap: $spacing-sm;
	}

	&__action {
		width: 64rpx;
		height: 64rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		flex-shrink: 0;

		&:active {
			background: $bg-elevated;
		}
	}

	&__action-icon {
		width: 40rpx;
		height: 40rpx;

		&--image {
			border: 3rpx solid $text-muted;
			border-radius: 6rpx;
			position: relative;

			&::before {
				content: '';
				position: absolute;
				top: 8rpx;
				right: 8rpx;
				width: 10rpx;
				height: 10rpx;
				border-radius: 50%;
				background: $text-muted;
			}

			&::after {
				content: '';
				position: absolute;
				bottom: 6rpx;
				left: 4rpx;
				width: 0;
				height: 0;
				border-left: 12rpx solid transparent;
				border-right: 12rpx solid transparent;
				border-bottom: 12rpx solid $text-muted;
			}
		}
	}

	&__input {
		flex: 1;
		height: 72rpx;
		background: $bg-elevated;
		border-radius: $radius-full;
		padding: 0 $spacing-md;
		font-size: $font-size-base;
		color: $text-primary;
	}

	&__send {
		width: 64rpx;
		height: 64rpx;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: $bg-elevated;
		flex-shrink: 0;
		opacity: 0.4;
		transition: all 0.2s ease;

		&--active {
			background: linear-gradient(135deg, #3388ff 0%, #5EAAFF 100%);
			opacity: 1;
			box-shadow: 0 4rpx 12rpx rgba(51, 136, 255, 0.3);
		}
	}

	&__send-icon {
		width: 0;
		height: 0;
		border-left: 16rpx solid $text-muted;
		border-top: 10rpx solid transparent;
		border-bottom: 10rpx solid transparent;
		margin-left: 4rpx;
	}

	&__send--active &__send-icon {
		border-left-color: #FFFFFF;
	}

	&__safe {
		height: env(safe-area-inset-bottom);
	}
}

.closed-bottom {
	flex-shrink: 0;
	padding: $spacing-md $spacing-lg;
}

// 深色模式
.page--dark {
	.navbar {
		border-bottom-color: $dark-border-color;
	}
	.navbar__back-icon {
		border-color: $dark-text-primary;
	}
	.navbar__back:active {
		background: rgba(255, 255, 255, 0.08);
	}
	.navbar__title {
		color: $dark-text-primary;
	}
	.navbar__sub {
		color: $dark-text-muted;
	}

	.closed-banner {
		background: rgba(245, 158, 11, 0.12);
		border-bottom-color: rgba(245, 158, 11, 0.2);

		&__text {
			color: #FBBF24;
		}
	}

	.load-more__text {
		color: $dark-text-muted;
	}

	.load-more__spinner {
		border-color: $dark-border-color;
		border-top-color: $dark-color-primary;
	}

	.input-bar {
		background: $dark-bg-card;
		border-top-color: $dark-border-color;
	}

	.input-bar__action:active {
		background: $dark-bg-elevated;
	}

	.input-bar__action-icon--image {
		border-color: $dark-text-muted;

		&::before {
			background: $dark-text-muted;
		}

		&::after {
			border-bottom-color: $dark-text-muted;
		}
	}

	.input-bar__input {
		background: $dark-bg-elevated;
		color: $dark-text-primary;
	}

	.input-bar__send {
		background: $dark-bg-elevated;
	}

	.input-bar__send-icon {
		border-left-color: $dark-text-muted;
	}

	.input-bar__send--active {
		background: linear-gradient(135deg, #2277ee 0%, #4499ff 100%);

		.input-bar__send-icon {
			border-left-color: #FFFFFF;
		}
	}
}
</style>
