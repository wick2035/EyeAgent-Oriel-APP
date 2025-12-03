"use strict";
const store_theme = require("../store/theme.js");
const common_vendor = require("../common/vendor.js");
const _sfc_main = {
  name: "MessageBubble",
  props: {
    type: {
      type: String,
      default: "ai",
      // 'ai' | 'user'
      validator: (val) => ["ai", "user"].includes(val)
    },
    content: {
      type: String,
      default: ""
    },
    time: {
      type: String,
      default: ""
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    isDark() {
      return store_theme.isDarkMode();
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $props.type === "ai"
  }, $props.type === "ai" ? {} : {}, {
    b: $props.loading
  }, $props.loading ? {} : {
    c: common_vendor.t($props.content)
  }, {
    d: $props.time
  }, $props.time ? {
    e: common_vendor.t($props.time)
  } : {}, {
    f: $props.type === "user"
  }, $props.type === "user" ? {} : {}, {
    g: common_vendor.n(`message--${$props.type}`),
    h: common_vendor.n({
      "message--dark": $options.isDark
    })
  });
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-537f4398"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../.sourcemap/mp-weixin/components/MessageBubble.js.map
