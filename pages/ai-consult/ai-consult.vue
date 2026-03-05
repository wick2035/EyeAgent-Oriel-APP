<template>
  <view class="page" :class="{ 'page--dark': isDark }">
    <!-- 固定头部 -->
    <view class="fixed-header">
      <!-- 状态栏占位 -->
      <view
        class="status-bar"
        :style="{ height: statusBarHeight + 'px' }"
      ></view>

      <!-- 顶部导航栏 -->
      <view class="navbar">
        <view class="navbar__left" @click="goBack" v-if="hasMessages">
          <view class="back-icon"></view>
        </view>
        <view class="navbar__left" v-else></view>
        <text class="navbar__title">AI问诊</text>
        <view class="navbar__right" @click="showHistory">
          <view class="history-icon"></view>
        </view>
      </view>
    </view>

    <!-- 头部占位（防止内容被遮挡） -->
    <view
      class="header-placeholder"
      :style="{ height: statusBarHeight + 44 + 'px' }"
    ></view>

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

        <!-- 快捷提示词 -->
        <view class="prompts">
          <view class="prompts__tags">
            <QuickPrompt
              v-for="prompt in prompts"
              :key="prompt.id"
              :id="prompt.id"
              :text="prompt.text"
              @click="handlePromptClick"
            />
            <view class="prompts__refresh" @click="refreshPrompts">
              <view class="refresh-icon"></view>
              <text class="prompts__refresh-text">换一换</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 对话消息列表 -->
      <view v-else class="messages">
        <template v-for="(msg, index) in messages" :key="index">
          <!-- 日期分隔符 -->
          <view v-if="showDateDivider(index)" class="time-divider">
            <text class="time-divider__text">{{ getDateLabel(index) }}</text>
          </view>
          <!-- 消息气泡 -->
          <MessageBubble
            :type="msg.type"
            :content="msg.content"
            :time="msg.time"
            :loading="msg.loading"
            :streaming="msg.streaming"
            :statusText="msg.statusText"
            :uiElements="msg.uiElements"
            :uiPending="msg.uiPending"
            @optionClick="handleOptionClick"
            @productAction="handleProductAction"
          />
        </template>
      </view>

      <!-- 底部占位 -->
      <view class="content__bottom-space"></view>
    </scroll-view>

    <!-- SSE 流式请求渲染层 -->
    <view
      :prop="sseParams"
      :change:prop="sse.onParamsChange"
      style="position:absolute;width:0;height:0;overflow:hidden"
    />

    <!-- 底部输入框 -->
    <ChatInput
      ref="chatInput"
      :disabled="isSending"
      :isSending="isSending"
      :quickActions="quickActions"
      :showQuickActions="!hasMessages"
      @send="handleSend"
      @stop="handleStop"
      @quickAction="handleQuickAction"
      @mediaSelect="handleMediaSelect"
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
import config from "@/utils/config.js";
import { clearLoginState } from "@/store/user.js";
import {
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
      sessionId: null,
      isSending: false,
      sseParams: null,
      sseBuffer: '',
      currentAiMsgIndex: -1,
      quickActions: [
        { icon: "🩺", text: "症状自查", type: "symptom" },
        { icon: "💊", text: "用药咨询", type: "medicine" },
        { icon: "📋", text: "报告解读", type: "report" },
        { icon: "🏥", text: "科室推荐", type: "department" },
        { icon: "🍎", text: "健康建议", type: "health" },
      ],
      prompts: [],
      // 打字效果
      fullTitle: "我是小Eye, 您的AI眼健康助手~",
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
    this.sseParams = { action: 'abort', _ts: Date.now() };
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
      this.sseParams = { action: 'abort', _ts: Date.now() };
      this.messages = [];
      this.conversationId = null;
      this.sessionId = null;
      this.isSending = false;
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
        const { messages } = await getMessages(conversationId);

        this.conversationId = conversationId;
        this.sessionId = null; // 历史续聊时始终传null，让服务端新建Python运行时会话

        // 转换消息格式并加载到界面
        this.messages = messages.map((msg) => ({
          type: msg.messageType === "user" ? "user" : "ai",
          content: msg.messageContent,
          time: this.extractTime(msg.createTime),
          createTime: msg.createTime,
          loading: false,
          streaming: false,
          statusText: "",
          uiElements: msg.uiElements || null,
        }));

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

    handleSend(message) {
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

      this.$nextTick(() => {
        this.scrollToBottom();
      });

      // 添加AI等待消息
      this.currentAiMsgIndex = this.messages.length;
      this.messages.push({
        type: "ai",
        content: "",
        loading: true,
        streaming: false,
        statusText: "",
        uiElements: null,
        uiPending: false,
      });

      this.isSending = true;
      this.sseBuffer = '';

      // 通过 sseParams 触发 renderjs 发起 SSE 请求
      const token = uni.getStorageSync(config.storageKeys.token);
      this.sseParams = {
        action: 'start',
        url: config.baseUrl + '/api/app/extra/ai-chat-query',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'satoken': token || ''
        },
        body: {
          message,
          conversationId: this.conversationId || null,
          sessionId: this.sessionId || null
        },
        _ts: Date.now()
      };
    },

    handleMediaSelect({ type, files }) {
      const typeNames = { camera: '拍照图片', album: '相册图片', file: '文件' }
      const name = typeNames[type] || '附件'
      // 占位实现：发送描述消息；后续对接上传接口后替换为真实 URL
      this.handleSend(`[已发送${name}，请帮我分析]`)
    },

    handleStop() {
      // 通过 sseParams 触发 renderjs 中断请求
      this.sseParams = { action: 'abort', _ts: Date.now() };
      this.isSending = false;

      // 处理最后一条AI消息
      if (this.messages.length > 0) {
        const lastMsg = this.messages[this.messages.length - 1];
        if (lastMsg.type === "ai") {
          if (lastMsg.loading && !lastMsg.content) {
            this.messages.pop();
          } else {
            lastMsg.loading = false;
            lastMsg.streaming = false;
            lastMsg.statusText = "";
            if (!lastMsg.time) {
              const now = new Date();
              lastMsg.time = this.formatTime(now);
              lastMsg.createTime = this.formatDateTime(now);
            }
          }
        }
      }

      uni.showToast({ title: "已停止", icon: "none", duration: 1000 });
    },

    cleanAIContent(text) {
      if (!text) return "";
      // ── agent 路由 JSON 被 ```json 代码块包裹的情形 ──
      // 极早期：仅有 ```json 标记，{ 还未到达
      text = text.replace(/^\s*```json\s*\n?$/, "");
      // 完整代码块 + 完整 JSON + 闭合 ```
      text = text.replace(/^\s*```(?:json)?\s*\n?\{[^}]*"agent"\s*:\s*"[^"]*"[^}]*\}\s*\n?```\s*\n?/g, "");
      // 完整 JSON，闭合 ``` 还未到达
      text = text.replace(/^\s*```(?:json)?\s*\n?\{[^}]*"agent"\s*:\s*"[^"]*"[^}]*\}\s*\n?/g, "");
      // JSON 流式中（} 还未到达）
      text = text.replace(/^\s*```(?:json)?\s*\n?\{[^}]*"agent"[^}]*/g, "");
      // ── agent 路由 JSON 裸格式（原有逻辑） ──
      // 过滤完整 agent 路由 JSON（有闭合 }）
      text = text.replace(/^\s*\{[^}]*"agent"\s*:\s*"[^"]*"[^}]*\}/g, "");
      // 过滤不完整 agent 路由 JSON（防止流式中途残留）
      text = text.replace(/^\s*\{[^}]*"agent"[^}]*/g, "");
      // 过滤完整 <tool_call> 块（含块内 JSON）
      text = text.replace(/<tool_call>[\s\S]*?<\/tool_call>/g, "");
      // 过滤不完整 <tool_call> 块（防止流式中途残留）
      text = text.replace(/<tool_call>[\s\S]*/g, "");
      // 孤立标签兜底
      text = text.replace(/<\/?tool_call>/g, "");
      // 过滤 UI 标记及其后的 JSON 数据
      text = text.replace(/\[OPTIONS\][\s\S]*/g, "");
      text = text.replace(/\[PRODUCTS\][\s\S]*/g, "");
      text = text.replace(/\[PRODUCT_CARDS\][\s\S]*/g, "");
      // 清理多余换行
      text = text.replace(/\n{3,}/g, "\n\n").trim();
      return text;
    },

    parseUIMarkers(text) {
      if (!text) return { cleanText: text, uiElements: null };

      const markers = [
        { tag: '[OPTIONS]', type: 'options' },
        { tag: '[PRODUCTS]', type: 'product_cards' },
        { tag: '[PRODUCT_CARDS]', type: 'product_cards' }
      ];

      for (const marker of markers) {
        const idx = text.indexOf(marker.tag);
        if (idx === -1) continue;

        const cleanText = text.substring(0, idx).trim();
        const afterMarker = text.substring(idx + marker.tag.length).trim();

        // 用括号匹配法提取 JSON（支持 [...] 或 {...}，忽略尾部多余文本）
        const jsonStr = this._extractJSON(afterMarker);
        if (!jsonStr) {
          return { cleanText, uiElements: null };
        }

        try {
          const parsed = JSON.parse(jsonStr);

          if (marker.type === 'options') {
            let options;
            if (Array.isArray(parsed)) {
              options = parsed;
            } else if (parsed && parsed.options && Array.isArray(parsed.options)) {
              options = parsed.options;
            } else {
              return { cleanText, uiElements: null };
            }
            return {
              cleanText,
              uiElements: { ui_type: 'options', options, product_cards: null }
            };
          } else {
            let products;
            if (Array.isArray(parsed)) {
              products = parsed;
            } else if (parsed && parsed.product_cards && Array.isArray(parsed.product_cards)) {
              products = parsed.product_cards;
            } else {
              return { cleanText, uiElements: null };
            }
            return {
              cleanText,
              uiElements: { ui_type: 'product_cards', product_cards: products, options: null }
            };
          }
        } catch (e) {
          return { cleanText, uiElements: null };
        }
      }

      return { cleanText: text, uiElements: null };
    },

    /** 括号计数法提取第一个完整 JSON（[...] 或 {...}），忽略尾部多余文本 */
    _extractJSON(text) {
      if (!text) return null;

      // 找到第一个 [ 或 {
      let startIdx = -1;
      let openChar = '';
      let closeChar = '';

      for (let i = 0; i < text.length; i++) {
        if (text[i] === '[') {
          startIdx = i; openChar = '['; closeChar = ']'; break;
        }
        if (text[i] === '{') {
          startIdx = i; openChar = '{'; closeChar = '}'; break;
        }
      }

      if (startIdx === -1) return null;

      let depth = 0;
      let inString = false;
      let escape = false;

      for (let i = startIdx; i < text.length; i++) {
        const ch = text[i];
        if (escape) { escape = false; continue; }
        if (ch === '\\' && inString) { escape = true; continue; }
        if (ch === '"') { inString = !inString; continue; }
        if (inString) continue;

        if (ch === openChar) depth++;
        else if (ch === closeChar) {
          depth--;
          if (depth === 0) return text.substring(startIdx, i + 1);
        }
      }

      // 未匹配到闭合括号，降级返回整段文本
      console.warn('[UI] 未找到匹配的闭合括号，尝试整段解析');
      return text;
    },

    /** 从流式传输中的不完整 JSON 数组里提取已完整的 {} 对象列表，实现逐个显示 */
    _extractPartialItems(content, markerTag) {
      const markerIdx = content.indexOf(markerTag);
      if (markerIdx === -1) return null;

      const afterMarker = content.substring(markerIdx + markerTag.length).trim();
      const arrStart = afterMarker.indexOf('[');
      if (arrStart === -1) return null;

      const inside = afterMarker.substring(arrStart + 1);
      const items = [];
      let i = 0;

      while (i < inside.length) {
        // 跳过空白和逗号
        while (i < inside.length && /[\s,]/.test(inside[i])) i++;
        if (i >= inside.length || inside[i] === ']') break;
        if (inside[i] !== '{') break;

        // 括号计数提取单个完整对象
        let depth = 0, inStr = false, esc = false, start = i, found = false;
        for (let j = i; j < inside.length; j++) {
          const ch = inside[j];
          if (esc) { esc = false; continue; }
          if (ch === '\\' && inStr) { esc = true; continue; }
          if (ch === '"') { inStr = !inStr; continue; }
          if (inStr) continue;
          if (ch === '{') depth++;
          else if (ch === '}') {
            depth--;
            if (depth === 0) {
              try { items.push(JSON.parse(inside.substring(start, j + 1))); } catch(e) {}
              i = j + 1;
              found = true;
              break;
            }
          }
        }
        if (!found) break;
      }

      return items.length > 0 ? items : null;
    },

    getToolCallLabel(toolName) {
      const labels = {
        get_doctor_free_time: "正在查询医生排班...",
        get_prescription: "正在查询处方信息...",
        book_appointment: "正在预约挂号...",
        search_products: "正在查询药品...",
      };
      return labels[toolName] || "正在查询中...";
    },

    handleOptionClick(selectedOptions) {
      if (!selectedOptions || selectedOptions.length === 0) return;
      const message = selectedOptions.map(opt => opt.label).join('、');
      this.handleSend(message);
    },

    handleProductAction(product) {
      const actionType = product._actionType || product.action_type
      switch (actionType) {
        case 'ADD_TO_CART':
          uni.showToast({ title: '已加入购物车', icon: 'success' });
          break;
        case 'VIEW_DETAIL':
          uni.navigateTo({ url: `/pages/orders/product-detail?id=${product.product_id}` });
          break;
        case 'PRESCRIBE':
          uni.showToast({ title: '请联系医生开具处方', icon: 'none' });
          break;
        default:
          uni.navigateTo({ url: `/pages/orders/product-detail?id=${product.product_id}` });
      }
    },

    // ===== renderjs 回调方法 =====

    onSSEChunk(text) {
      this.sseBuffer += text;
      this.processSSEBuffer();
    },

    onSSEComplete() {
      this.isSending = false;
      this.$nextTick(() => this.scrollToBottom());
    },

    onSSEError(errorMsg) {
      const msg = this.messages[this.currentAiMsgIndex];
      if (msg) {
        const now = new Date();
        msg.loading = false;
        msg.streaming = false;
        msg.statusText = "";
        msg.content = msg.content || "抱歉，网络出现问题，请稍后再试。";
        msg.time = this.formatTime(now);
        msg.createTime = this.formatDateTime(now);
      }
      this.isSending = false;
    },

    onSSEStatus(status) {
      if (status === 401) {
        clearLoginState();
        uni.showToast({ title: "登录已过期，请重新登录", icon: "none" });
        setTimeout(() => uni.reLaunch({ url: "/pages/login/login" }), 1500);
      }
    },

    processSSEBuffer() {
      const lines = this.sseBuffer.split('\n');
      this.sseBuffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const jsonStr = line.slice(5).trim();
        if (!jsonStr) continue;

        try {
          const chunk = JSON.parse(jsonStr);
          this.handleSSEEvent(chunk);
        } catch (e) {
          console.error('[SSE] JSON 解析错误:', e);
        }
      }
    },

    handleSSEEvent(chunk) {
      const msg = this.messages[this.currentAiMsgIndex];
      if (!msg) return;

      switch (chunk.event) {
        case 'start':
          this.sessionId = chunk.session_id;
          this.conversationId = chunk.conversation_id;
          break;
        case 'token':
          if (msg.loading) {
            msg.loading = false;
            msg.streaming = true;
          }
          msg.content += chunk.content;
          // 检测 UI 标记：支持完整解析和渐进（逐个）解析
          const c = msg.content;
          const markerMap = {
            '[OPTIONS]':       { type: 'options' },
            '[PRODUCTS]':      { type: 'product_cards' },
            '[PRODUCT_CARDS]': { type: 'product_cards' },
          };
          const markerTag = Object.keys(markerMap).find(k => c.includes(k));
          if (markerTag && (!msg.uiElements || msg.uiElements._partial)) {
            // 优先尝试完整解析
            const parsed = this.parseUIMarkers(c);
            if (parsed && parsed.uiElements) {
              this.$set(msg, 'uiElements', parsed.uiElements); // 完整，无 _partial
              if (msg.uiPending) this.$set(msg, 'uiPending', false);
            } else {
              // 渐进解析：提取已完整的 {} 对象，逐个显示
              const uiType = markerMap[markerTag].type;
              const partialItems = this._extractPartialItems(c, markerTag);
              const currentCount = uiType === 'options'
                ? (msg.uiElements?.options?.length || 0)
                : (msg.uiElements?.product_cards?.length || 0);
              if (partialItems && partialItems.length > currentCount) {
                const uiEl = uiType === 'options'
                  ? { ui_type: 'options', options: partialItems, product_cards: null, _partial: true }
                  : { ui_type: 'product_cards', product_cards: partialItems, options: null, _partial: true };
                this.$set(msg, 'uiElements', uiEl);
                if (msg.uiPending) this.$set(msg, 'uiPending', false);
              } else if (!msg.uiPending && !msg.uiElements) {
                // 连第一个对象都没到，用跳动点占位
                this.$set(msg, 'uiPending', true);
              }
            }
          }
          this.$nextTick(() => this.scrollToBottom());
          break;
        case 'tool_call':
          if (chunk.metadata?.status === 'start') {
            msg.statusText = this.getToolCallLabel(chunk.metadata.tool || '');
          } else {
            msg.statusText = '';
          }
          break;
        case 'ui_elements': {
          // Java 后端透传的 ui_elements 事件可能全部字段为 null，需验证
          const { event: _evt, ...uiData } = chunk;
          if (uiData.ui_type && uiData.ui_type !== 'none') {
            this.$set(msg, 'uiElements', uiData);
          }
          break;
        }
        case 'done': {
          const doneNow = new Date();
          const idx = this.currentAiMsgIndex;

          // 从 token 累积内容解析 UI 标记（唯一数据源）
          let uiElements = msg.uiElements || null;
          if (!uiElements && msg.content) {
            const parsed = this.parseUIMarkers(msg.content);
            if (parsed && parsed.uiElements) {
              uiElements = parsed.uiElements;
            }
          }

          const updatedMsg = {
            ...msg,
            streaming: false,
            loading: false,
            statusText: '',
            uiPending: false,
            time: this.formatTime(doneNow),
            createTime: this.formatDateTime(doneNow),
            // chunk.response 是服务端清洁文本；回退用 cleanAIContent
            content: chunk.response || this.cleanAIContent(msg.content),
            uiElements: uiElements,
          };

          this.$set(this.messages, idx, updatedMsg);

          if (chunk.session_id) this.sessionId = chunk.session_id;
          if (chunk.conversation_id) this.conversationId = chunk.conversation_id;
          break;
        }
        case 'error':
          msg.loading = false;
          msg.streaming = false;
          msg.statusText = '';
          msg.uiPending = false;
          msg.content = msg.content || (chunk.message || 'AI 服务异常');
          break;
      }
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

      // 双重解析：先原生（支持ISO 8601），再replace（支持 YYYY-MM-DD HH:mm:ss）
      let date = new Date(timeStr);
      if (isNaN(date.getTime())) {
        date = new Date(timeStr.replace(/-/g, "/"));
      }
      const now = new Date();

      // 提取时间部分
      const time = timeStr.substring(11, 16) || "";

      // 解析失败时回退到时间子串
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

    // 获取消息的日期标签
    getDateLabel(index) {
      const msg = this.messages[index];
      const timeStr = msg.createTime;
      if (!timeStr) return "";

      // 双重解析
      let date = new Date(timeStr);
      if (isNaN(date.getTime())) {
        date = new Date(timeStr.replace(/-/g, "/"));
      }
      if (isNaN(date.getTime())) return "";

      const now = new Date();

      if (date.toDateString() === now.toDateString()) return "今天";

      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) return "昨天";

      if (date.getFullYear() === now.getFullYear()) {
        return `${date.getMonth() + 1}月${date.getDate()}日`;
      }
      return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    },

    // 判断是否需要显示日期分隔符
    showDateDivider(index) {
      const msg = this.messages[index];
      if (!msg.createTime) return false;
      if (index === 0) return true;

      const prevMsg = this.messages[index - 1];
      if (!prevMsg.createTime) return true;

      // 双重解析
      let date = new Date(msg.createTime);
      if (isNaN(date.getTime())) date = new Date(msg.createTime.replace(/-/g, "/"));
      let prevDate = new Date(prevMsg.createTime);
      if (isNaN(prevDate.getTime())) prevDate = new Date(prevMsg.createTime.replace(/-/g, "/"));

      if (isNaN(date.getTime()) || isNaN(prevDate.getTime())) return true;
      return date.toDateString() !== prevDate.toDateString();
    },
  },
};
</script>

<script module="sse" lang="renderjs">
let abortController = null

export default {
  methods: {
    onParamsChange(newVal) {
      if (!newVal) return

      if (newVal.action === 'abort') {
        if (abortController) {
          abortController.abort()
          abortController = null
        }
        return
      }

      if (newVal.action === 'start') {
        this.startSSE(newVal)
      }
    },

    async startSSE(params) {
      if (abortController) {
        abortController.abort()
      }
      abortController = new AbortController()

      try {
        const response = await fetch(params.url, {
          method: 'POST',
          headers: params.headers,
          body: JSON.stringify(params.body),
          signal: abortController.signal
        })

        if (response.status === 401) {
          this.$ownerInstance.callMethod('onSSEStatus', 401)
          return
        }
        if (!response.ok) {
          this.$ownerInstance.callMethod('onSSEError', '请求失败 (' + response.status + ')')
          return
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const text = decoder.decode(value, { stream: true })
          this.$ownerInstance.callMethod('onSSEChunk', text)
        }

        this.$ownerInstance.callMethod('onSSEComplete')
      } catch (e) {
        if (e.name === 'AbortError') return
        this.$ownerInstance.callMethod('onSSEError', e.message || '网络连接失败')
      } finally {
        abortController = null
      }
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

// 固定头部容器
.fixed-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: $bg-base;
}

// 头部占位
.header-placeholder {
  flex-shrink: 0;
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
    font-size: $font-size-xl;
    font-weight: $font-weight-bold;
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
    margin-bottom: $spacing-lg;
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

// 快捷提示词
.prompts {
  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
    align-items: flex-end;
  }

  &__refresh {
    display: flex;
    align-items: center;
    padding: $spacing-xs $spacing-sm;
    margin-left: auto;
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

// 时间分割线
.time-divider {
  display: flex;
  justify-content: center;
  padding: $spacing-md 0 $spacing-sm;

  &__text {
    font-size: $font-size-xs;
    color: $text-muted;
    background: $bg-elevated;
    padding: 4rpx 24rpx;
    border-radius: $radius-full;
  }
}

// 深色模式
.page--dark {
  .fixed-header {
    background: $dark-bg-base;
  }
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

  .prompts__refresh-text {
    color: $dark-color-primary;
  }
  .refresh-icon {
    border-color: $dark-color-primary;
    border-right-color: transparent;
  }

  .time-divider__text {
    color: $dark-text-muted;
    background: $dark-bg-elevated;
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
