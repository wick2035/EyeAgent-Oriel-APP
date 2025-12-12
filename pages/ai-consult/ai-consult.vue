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
        <text class="welcome__title"
          >{{ displayTitle
          }}<text v-if="isTyping" class="typing-cursor">|</text></text
        >
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
        <template v-for="(msg, index) in messages" :key="index">
          <!-- 年份分隔符 -->
          <view v-if="showYearDivider(index)" class="year-divider">
            <view class="year-divider__line"></view>
            <text class="year-divider__text"
              >{{ getMessageYear(index) }}年</text
            >
            <view class="year-divider__line"></view>
          </view>
          <!-- 消息气泡 -->
          <MessageBubble
            :type="msg.type"
            :content="msg.content"
            :time="msg.time"
            :loading="msg.loading"
          />
        </template>
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
    <TabBar />

    <!-- 顶部通知栏 -->
    <TopNotificationBar />

    <!-- 退出确认弹窗 -->
    <ConfirmDialog
      ref="exitDialog"
      title="结束当前对话？"
      content="对话内容将被清空"
      confirmText="结束"
      cancelText="取消"
      icon="warning"
      @confirm="handleExitConfirm"
    />
  </view>
</template>

<script>
import TabBar from "@/components/TabBar.vue";
import TopNotificationBar from "@/components/TopNotificationBar.vue";
import ChatInput from "@/components/ChatInput.vue";
import QuickPrompt from "@/components/QuickPrompt.vue";
import MessageBubble from "@/components/MessageBubble.vue";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import { isDarkMode } from "@/store/theme.js";
import {
  sendMessage,
  getQuickPrompts,
  refreshQuickPrompts,
  getMessages,
} from "@/utils/api/chat.js";

export default {
  components: {
    TabBar,
    TopNotificationBar,
    ChatInput,
    QuickPrompt,
    MessageBubble,
    ConfirmDialog,
  },
  data() {
    return {
      statusBarHeight: 44,
      scrollTop: 0,
      messages: [],
      conversationId: null,
      isSending: false,
      quickActions: [
        { icon: "🩺", text: "症状自查", type: "symptom" },
        { icon: "💊", text: "用药咨询", type: "medicine" },
        { icon: "📋", text: "报告解读", type: "report" },
        { icon: "🏥", text: "科室推荐", type: "department" },
        { icon: "🍎", text: "健康建议", type: "health" },
      ],
      prompts: [],
      // 打字效果
      fullTitle: "我是小Eye，您的AI健康助手~",
      displayTitle: "",
      isTyping: false,
      typingTimer: null,
    };
  },
  computed: {
    isDark() {
      return isDarkMode();
    },
    hasMessages() {
      return this.messages.length > 0;
    },
  },
  onLoad(options) {
    this.getStatusBarHeight();
    this.loadPrompts();

    // 如果带有conversationId参数，加载历史消息（续聊）
    if (options && options.conversationId) {
      this.loadHistoryMessages(options.conversationId);
    } else {
      // 新对话时启动打字效果
      this.$nextTick(() => {
        this.startTyping();
      });
    }
  },
  onUnload() {
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
    }
  },
  onShow() {
    // #ifdef APP-PLUS
    uni.hideTabBar({ animation: false });
    // #endif
    // 检查是否有从历史记录页面传来的会话ID（tabBar 页面通过存储传参）
    const pendingId = uni.getStorageSync("pendingConversationId");
    if (pendingId) {
      uni.removeStorageSync("pendingConversationId");
      this.loadHistoryMessages(pendingId);
    }
  },
  methods: {
    getStatusBarHeight() {
      const sysInfo = uni.getSystemInfoSync();
      this.statusBarHeight = sysInfo.statusBarHeight || 44;
    },

    // 打字效果
    startTyping() {
      this.isTyping = true;
      this.displayTitle = "";
      let index = 0;
      const typeChar = () => {
        if (index < this.fullTitle.length) {
          this.displayTitle += this.fullTitle[index];
          index++;
          this.typingTimer = setTimeout(typeChar, 110);
        } else {
          this.isTyping = false;
        }
      };
      typeChar();
    },

    goBack() {
      if (this.hasMessages) {
        // 显示自定义确认弹窗
        this.$refs.exitDialog.show();
      } else {
        // 没有对话消息，返回首页
        uni.switchTab({
          url: "/pages/index/index",
        });
      }
    },

    handleExitConfirm() {
      // 清空对话
      this.messages = [];
      this.conversationId = null;
      this.scrollTop = 0;
    },

    showHistory() {
      uni.navigateTo({
        url: "/pages/chat-history/chat-history",
      });
    },

    async loadHistoryMessages(conversationId) {
      try {
        uni.showLoading({ title: "加载中..." });
        const { messages, conversation } = await getMessages(conversationId);

        // 保存会话ID
        this.conversationId = conversationId;

        // 转换消息格式并加载到界面
        this.messages = messages.map((msg) => ({
          type: msg.messageType === "user" ? "user" : "ai",
          content: msg.messageContent,
          time: this.extractTime(msg.createTime),
          createTime: msg.createTime, // 保存原始时间用于年份分隔符
          loading: false,
        }));

        // 滚动到底部
        this.$nextTick(() => {
          this.scrollToBottom();
        });
      } catch (e) {
        console.error("加载历史消息失败:", e);
        uni.showToast({ title: e.message || "加载失败", icon: "none" });
      } finally {
        uni.hideLoading();
      }
    },

    async loadPrompts() {
      try {
        this.prompts = await getQuickPrompts();
      } catch (e) {
        console.error("加载提示词失败:", e);
      }
    },

    async refreshPrompts() {
      try {
        this.prompts = await refreshQuickPrompts();
        uni.showToast({ title: "已刷新", icon: "none", duration: 1000 });
      } catch (e) {
        console.error("刷新提示词失败:", e);
      }
    },

    handleQuickAction(action) {
      const messages = {
        symptom: "我想进行症状自查，请帮我分析一下",
        medicine: "我有一些用药方面的问题想咨询",
        report: "我想解读一下我的体检报告",
        department: "我不知道应该挂什么科室",
        health: "请给我一些健康建议",
      };
      this.handleSend(messages[action.type] || action.text);
    },

    handlePromptClick(prompt) {
      this.handleSend(prompt.text);
    },

    async handleSend(message) {
      if (!message || this.isSending) return;

      const now = new Date();
      const createTime = this.formatDateTime(now);

      // 添加用户消息
      this.messages.push({
        type: "user",
        content: message,
        time: this.formatTime(now),
        createTime: createTime,
      });

      // 滚动到底部
      this.$nextTick(() => {
        this.scrollToBottom();
      });

      // 添加AI思考中状态
      this.messages.push({
        type: "ai",
        content: "",
        loading: true,
      });

      this.isSending = true;

      try {
        const response = await sendMessage({
          message,
          conversationId: this.conversationId,
        });

        // 更新AI消息
        const lastIndex = this.messages.length - 1;
        const aiNow = new Date();
        this.messages[lastIndex] = {
          type: "ai",
          content: response.response,
          time: this.formatTime(aiNow),
          createTime: this.formatDateTime(aiNow),
          loading: false,
        };

        // 保存会话ID
        if (response.conversationId) {
          this.conversationId = response.conversationId;
        }
      } catch (error) {
        // 显示错误消息
        const lastIndex = this.messages.length - 1;
        const errNow = new Date();
        this.messages[lastIndex] = {
          type: "ai",
          content: "抱歉，网络出现问题，请稍后再试。",
          time: this.formatTime(errNow),
          createTime: this.formatDateTime(errNow),
          loading: false,
        };
      } finally {
        this.isSending = false;
        this.$nextTick(() => {
          this.scrollToBottom();
        });
      }
    },

    handleVoice() {
      uni.showToast({ title: "语音功能开发中", icon: "none" });
    },

    handleStop() {
      // 中断当前请求
      this.isSending = false;
      // 移除最后一条 loading 状态的 AI 消息
      if (this.messages.length > 0) {
        const lastMsg = this.messages[this.messages.length - 1];
        if (lastMsg.type === "ai" && lastMsg.loading) {
          this.messages.pop();
        }
      }
      uni.showToast({ title: "已停止", icon: "none", duration: 1000 });
    },

    formatTime(date) {
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      return `${hours}:${minutes}`;
    },

    // 生成标准时间字符串 "YYYY-MM-DD HH:mm:ss"
    formatDateTime(date) {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      const seconds = date.getSeconds().toString().padStart(2, "0");
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    },

    extractTime(timeStr) {
      if (!timeStr) return "";

      // 解析日期
      const date = new Date(timeStr.replace(/-/g, "/"));
      const now = new Date();

      // 提取时间部分
      const time = timeStr.substring(11, 16) || "";

      // 检查 Date 是否有效
      if (isNaN(date.getTime())) {
        return time;
      }

      // 今天：只显示时间
      if (date.toDateString() === now.toDateString()) {
        return time;
      }

      // 非今天：显示 "M月D日 HH:mm"
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${month}月${day}日 ${time}`;
    },

    scrollToBottom() {
      this.scrollTop = this.scrollTop === 99999 ? 100000 : 99999;
    },

    onScrollToLower() {
      // 可以在这里加载更多历史消息
    },

    // 判断是否需要显示年份分隔符
    showYearDivider(index) {
      const msg = this.messages[index];
      if (!msg.createTime) return false;

      const msgYear = this.getMessageYear(index);
      const currentYear = new Date().getFullYear();

      if (index === 0) {
        // 第一条消息：如果不是今年，显示年份
        return msgYear !== currentYear;
      }

      // 当前消息和上一条消息年份不同时显示
      const prevYear = this.getMessageYear(index - 1);
      return msgYear !== prevYear;
    },

    // 获取消息的年份
    getMessageYear(index) {
      const msg = this.messages[index];
      if (!msg.createTime) return new Date().getFullYear();
      return parseInt(msg.createTime.substring(0, 4));
    },
  },
};
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

.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 88rpx;
  padding: 0 $spacing-lg;
  flex-shrink: 0;

  &__left,
  &__right {
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
    content: "";
    position: absolute;
    top: 8rpx;
    left: 6rpx;
    right: 6rpx;
    height: 3rpx;
    background: $text-secondary;
  }

  &::after {
    content: "";
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
    background: linear-gradient(
      135deg,
      rgba(102, 126, 234, 0.1) 0%,
      rgba(240, 147, 251, 0.1) 100%
    );
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

// 打字光标
.typing-cursor {
  display: inline;
  color: $color-primary;
  font-weight: 300;
  animation: cursor-blink 0.8s infinite;
}

@keyframes cursor-blink {
  0%,
  50% {
    opacity: 1;
  }
  51%,
  100% {
    opacity: 0;
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

  &--1 {
    background: #ff6b6b;
    transform: rotate(0deg);
  }
  &--2 {
    background: #4ecdc4;
    transform: rotate(72deg);
  }
  &--3 {
    background: #45b7d1;
    transform: rotate(144deg);
  }
  &--4 {
    background: #96ceb4;
    transform: rotate(216deg);
  }
  &--5 {
    background: #dda0dd;
    transform: rotate(288deg);
  }
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

// 年份分隔符
.year-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $spacing-lg $spacing-xl;

  &__line {
    flex: 1;
    height: 1rpx;
    background: $border-color-light;
    max-width: 120rpx;
  }

  &__text {
    padding: 0 $spacing-md;
    font-size: $font-size-xs;
    color: $text-muted;
  }
}

// 深色模式
.page--dark {
  .navbar__title {
    color: $dark-text-primary;
  }
  .back-icon {
    border-color: $dark-text-primary;
  }
  .history-icon {
    border-color: $dark-text-secondary;
    &::before,
    &::after {
      background: $dark-text-secondary;
    }
  }

  .welcome__hi {
    background: $dark-bg-elevated;
    color: $dark-text-primary;
  }
  .welcome__title {
    color: $dark-text-primary;
  }
  .welcome__subtitle {
    color: $dark-text-secondary;
  }

  .quick-action {
    background: $dark-bg-card;
    border-color: $dark-border-color;
    &__text {
      color: $dark-text-primary;
    }
  }

  .prompts__title {
    color: $dark-text-secondary;
  }
  .prompts__refresh-text {
    color: $dark-color-primary;
  }
  .refresh-icon {
    border-color: $dark-color-primary;
    border-right-color: transparent;
  }

  .year-divider__line {
    background: $dark-border-color;
  }
  .year-divider__text {
    color: $dark-text-muted;
  }
}

@keyframes ai-rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes refresh-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
