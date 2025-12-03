"use strict";
const common_vendor = require("../common/vendor.js");
const store_theme = require("../store/theme.js");
const _sfc_main = {
  name: "TabBar",
  props: {
    current: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      currentIndex: this.current,
      tabs: [
        { icon: "home", text: "首页", path: "/pages/index/index" },
        { icon: "calendar", text: "预约", path: "/pages/appointment/appointment" },
        { icon: "ai", text: "AI问诊", path: "/pages/ai-consult/ai-consult" },
        { icon: "message", text: "消息", path: "/pages/messages/messages" },
        { icon: "user", text: "我的", path: "/pages/profile/profile" }
      ]
    };
  },
  computed: {
    isDark() {
      return store_theme.isDarkMode();
    }
  },
  watch: {
    current(val) {
      this.currentIndex = val;
    }
  },
  methods: {
    switchTab(index) {
      if (this.currentIndex === index)
        return;
      this.currentIndex = index;
      common_vendor.index.switchTab({
        url: this.tabs[index].path
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.f($data.tabs, (item, index, i0) => {
      return common_vendor.e({
        a: index === 2
      }, index === 2 ? {} : {
        b: common_vendor.n(`icon--${item.icon}`),
        c: common_vendor.n({
          "icon--active": $data.currentIndex === index
        })
      }, {
        d: common_vendor.t(item.text),
        e: $data.currentIndex === index ? 1 : "",
        f: $data.currentIndex === index && index !== 2
      }, $data.currentIndex === index && index !== 2 ? {} : {}, {
        g: index,
        h: $data.currentIndex === index ? 1 : "",
        i: index === 2 ? 1 : "",
        j: common_vendor.o(($event) => $options.switchTab(index), index)
      });
    }),
    b: $options.isDark ? 1 : ""
  };
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-89ca1f91"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../.sourcemap/mp-weixin/components/TabBar.js.map
