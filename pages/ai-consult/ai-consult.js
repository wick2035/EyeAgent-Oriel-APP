"use strict";
const common_vendor = require("../../common/vendor.js");
const store_theme = require("../../store/theme.js");
const utils_api_chat = require("../../utils/api/chat.js");
const TabBar = () => "../../components/TabBar.js";
const ChatInput = () => "../../components/ChatInput.js";
const QuickPrompt = () => "../../components/QuickPrompt.js";
const MessageBubble = () => "../../components/MessageBubble.js";
const _sfc_main = {
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
        { icon: "🩺", text: "症状自查", type: "symptom" },
        { icon: "💊", text: "用药咨询", type: "medicine" },
        { icon: "📋", text: "报告解读", type: "report" },
        { icon: "🏥", text: "科室推荐", type: "department" },
        { icon: "🍎", text: "健康建议", type: "health" }
      ],
      prompts: []
    };
  },
  computed: {
    isDark() {
      return store_theme.isDarkMode();
    },
    hasMessages() {
      return this.messages.length > 0;
    }
  },
  onLoad() {
    this.getStatusBarHeight();
    this.loadPrompts();
  },
  methods: {
    getStatusBarHeight() {
      const sysInfo = common_vendor.index.getSystemInfoSync();
      this.statusBarHeight = sysInfo.statusBarHeight || 44;
    },
    goBack() {
      if (this.hasMessages) {
        common_vendor.index.showModal({
          title: "提示",
          content: "确定要结束当前对话吗？",
          confirmText: "确定",
          cancelText: "取消",
          success: (res) => {
            if (res.confirm) {
              this.messages = [];
              this.conversationId = null;
              this.scrollTop = 0;
            }
          }
        });
      } else {
        common_vendor.index.switchTab({
          url: "/pages/index/index"
        });
      }
    },
    showHistory() {
      common_vendor.index.showToast({ title: "历史记录开发中", icon: "none" });
    },
    async loadPrompts() {
      try {
        this.prompts = await utils_api_chat.getQuickPrompts();
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/ai-consult/ai-consult.vue:187", "加载提示词失败:", e);
      }
    },
    async refreshPrompts() {
      try {
        this.prompts = await utils_api_chat.refreshQuickPrompts();
        common_vendor.index.showToast({ title: "已刷新", icon: "none", duration: 1e3 });
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/ai-consult/ai-consult.vue:196", "刷新提示词失败:", e);
      }
    },
    handleQuickAction(action) {
      const messages = {
        symptom: "我想进行症状自查，请帮我分析一下",
        medicine: "我有一些用药方面的问题想咨询",
        report: "我想解读一下我的体检报告",
        department: "我不知道应该挂什么科室",
        health: "请给我一些健康建议"
      };
      this.handleSend(messages[action.type] || action.text);
    },
    handlePromptClick(prompt) {
      this.handleSend(prompt.text);
    },
    async handleSend(message) {
      if (!message || this.isSending)
        return;
      this.messages.push({
        type: "user",
        content: message,
        time: this.formatTime(/* @__PURE__ */ new Date())
      });
      this.$nextTick(() => {
        this.scrollToBottom();
      });
      this.messages.push({
        type: "ai",
        content: "",
        loading: true
      });
      this.isSending = true;
      try {
        const response = await utils_api_chat.sendMessage({
          message,
          conversation_id: this.conversationId
        });
        const lastIndex = this.messages.length - 1;
        this.messages[lastIndex] = {
          type: "ai",
          content: response.response,
          time: this.formatTime(/* @__PURE__ */ new Date()),
          loading: false
        };
        if (response.conversation_id) {
          this.conversationId = response.conversation_id;
        }
      } catch (error) {
        const lastIndex = this.messages.length - 1;
        this.messages[lastIndex] = {
          type: "ai",
          content: "抱歉，网络出现问题，请稍后再试。",
          time: this.formatTime(/* @__PURE__ */ new Date()),
          loading: false
        };
      } finally {
        this.isSending = false;
        this.$nextTick(() => {
          this.scrollToBottom();
        });
      }
    },
    handleVoice() {
      common_vendor.index.showToast({ title: "语音功能开发中", icon: "none" });
    },
    formatTime(date) {
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      return `${hours}:${minutes}`;
    },
    scrollToBottom() {
      this.scrollTop = this.scrollTop === 99999 ? 1e5 : 99999;
    },
    onScrollToLower() {
    }
  }
};
if (!Array) {
  const _component_QuickPrompt = common_vendor.resolveComponent("QuickPrompt");
  const _component_MessageBubble = common_vendor.resolveComponent("MessageBubble");
  const _component_ChatInput = common_vendor.resolveComponent("ChatInput");
  const _component_TabBar = common_vendor.resolveComponent("TabBar");
  (_component_QuickPrompt + _component_MessageBubble + _component_ChatInput + _component_TabBar)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.statusBarHeight + "px",
    b: common_vendor.o((...args) => $options.goBack && $options.goBack(...args)),
    c: common_vendor.o((...args) => $options.showHistory && $options.showHistory(...args)),
    d: !$options.hasMessages
  }, !$options.hasMessages ? {
    e: common_vendor.f($data.quickActions, (action, index, i0) => {
      return {
        a: common_vendor.t(action.icon),
        b: common_vendor.t(action.text),
        c: index,
        d: common_vendor.o(($event) => $options.handleQuickAction(action), index)
      };
    }),
    f: common_vendor.o((...args) => $options.refreshPrompts && $options.refreshPrompts(...args)),
    g: common_vendor.f($data.prompts, (prompt, k0, i0) => {
      return {
        a: prompt.id,
        b: prompt.id,
        c: common_vendor.o($options.handlePromptClick, prompt.id),
        d: "78fd8d65-0-" + i0,
        e: common_vendor.p({
          id: prompt.id,
          text: prompt.text
        })
      };
    })
  } : {
    h: common_vendor.f($data.messages, (msg, index, i0) => {
      return {
        a: index,
        b: "78fd8d65-1-" + i0,
        c: common_vendor.p({
          type: msg.type,
          content: msg.content,
          time: msg.time,
          loading: msg.loading
        })
      };
    })
  }, {
    i: $data.scrollTop,
    j: common_vendor.o((...args) => $options.onScrollToLower && $options.onScrollToLower(...args)),
    k: common_vendor.sr("chatInput", "78fd8d65-2"),
    l: common_vendor.o($options.handleSend),
    m: common_vendor.o($options.handleVoice),
    n: common_vendor.p({
      disabled: $data.isSending
    }),
    o: common_vendor.p({
      current: 2
    }),
    p: $options.isDark ? 1 : ""
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-78fd8d65"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/ai-consult/ai-consult.js.map
