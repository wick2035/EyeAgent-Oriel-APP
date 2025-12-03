"use strict";
const common_vendor = require("../common/vendor.js");
const store_theme = require("../store/theme.js");
const _sfc_main = {
  name: "ChatInput",
  props: {
    placeholder: {
      type: String,
      default: "描述您的症状或健康问题..."
    },
    disabled: {
      type: Boolean,
      default: false
    },
    value: {
      type: String,
      default: ""
    }
  },
  data() {
    return {
      inputValue: this.value,
      isFocused: false
    };
  },
  computed: {
    isDark() {
      return store_theme.isDarkMode();
    },
    canSend() {
      return this.inputValue.trim().length > 0 && !this.disabled;
    }
  },
  watch: {
    value(val) {
      this.inputValue = val;
    }
  },
  methods: {
    handleInput(e) {
      this.inputValue = e.detail.value;
      this.$emit("input", this.inputValue);
    },
    handleSend() {
      if (!this.canSend)
        return;
      this.$emit("send", this.inputValue.trim());
      this.inputValue = "";
    },
    handleVoice() {
      this.$emit("voice");
      common_vendor.index.showToast({ title: "语音功能开发中", icon: "none" });
    },
    handleFocus() {
      this.isFocused = true;
      this.$emit("focus");
    },
    handleBlur() {
      this.isFocused = false;
      this.$emit("blur");
    },
    // 外部调用清空输入
    clear() {
      this.inputValue = "";
    },
    // 外部调用设置值
    setValue(val) {
      this.inputValue = val;
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: $props.placeholder,
    b: $props.disabled,
    c: common_vendor.o([($event) => $data.inputValue = $event.detail.value, (...args) => $options.handleInput && $options.handleInput(...args)]),
    d: common_vendor.o((...args) => $options.handleSend && $options.handleSend(...args)),
    e: common_vendor.o((...args) => $options.handleFocus && $options.handleFocus(...args)),
    f: common_vendor.o((...args) => $options.handleBlur && $options.handleBlur(...args)),
    g: $data.inputValue,
    h: common_vendor.o((...args) => $options.handleVoice && $options.handleVoice(...args)),
    i: $options.canSend ? 1 : "",
    j: common_vendor.o((...args) => $options.handleSend && $options.handleSend(...args)),
    k: $options.isDark ? 1 : ""
  };
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-01e239dc"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../.sourcemap/mp-weixin/components/ChatInput.js.map
