"use strict";
const store_theme = require("../store/theme.js");
const common_vendor = require("../common/vendor.js");
const _sfc_main = {
  name: "QuickPrompt",
  props: {
    text: {
      type: String,
      required: true
    },
    id: {
      type: [String, Number],
      default: ""
    }
  },
  computed: {
    isDark() {
      return store_theme.isDarkMode();
    }
  },
  methods: {
    handleClick() {
      this.$emit("click", { id: this.id, text: this.text });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.t($props.text),
    b: $options.isDark ? 1 : "",
    c: common_vendor.o((...args) => $options.handleClick && $options.handleClick(...args))
  };
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-1fafe24b"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../.sourcemap/mp-weixin/components/QuickPrompt.js.map
