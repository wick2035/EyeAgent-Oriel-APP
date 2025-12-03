"use strict";
const common_vendor = require("../../common/vendor.js");
const store_theme = require("../../store/theme.js");
const TabBar = () => "../../components/TabBar.js";
const _sfc_main = {
  components: {
    TabBar
  },
  data() {
    return {
      statusBarHeight: 44,
      serviceMenus: [
        { title: "就诊记录", icon: "record", bgColor: "rgba(30, 58, 95, 0.1)" },
        { title: "我的收藏", icon: "star", bgColor: "rgba(245, 158, 11, 0.1)" },
        { title: "用药提醒", icon: "medicine", bgColor: "rgba(16, 185, 129, 0.1)" }
      ],
      settingMenus: [
        { title: "深色模式", icon: "theme", bgColor: "rgba(102, 126, 234, 0.1)", type: "switch" },
        { title: "帮助中心", icon: "help", bgColor: "rgba(59, 130, 246, 0.1)" },
        { title: "关于我们", icon: "about", bgColor: "rgba(139, 148, 158, 0.1)" }
      ]
    };
  },
  computed: {
    isDark() {
      return store_theme.isDarkMode();
    }
  },
  onLoad() {
    this.getStatusBarHeight();
  },
  methods: {
    getStatusBarHeight() {
      const sysInfo = common_vendor.index.getSystemInfoSync();
      this.statusBarHeight = sysInfo.statusBarHeight || 44;
    },
    goToSettings() {
      common_vendor.index.showToast({ title: "设置页开发中", icon: "none" });
    },
    goToHealthRecord() {
      common_vendor.index.showToast({ title: "健康档案开发中", icon: "none" });
    },
    handleMenu(item) {
      if (item.type === "switch")
        return;
      common_vendor.index.showToast({ title: `${item.title}开发中`, icon: "none" });
    },
    toggleTheme(e) {
      const isDarkMode = e.detail.value;
      store_theme.setTheme(isDarkMode ? store_theme.THEME_DARK : store_theme.THEME_LIGHT);
    }
  }
};
if (!Array) {
  const _component_TabBar = common_vendor.resolveComponent("TabBar");
  _component_TabBar();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: $data.statusBarHeight + "px",
    b: common_vendor.o((...args) => $options.goToSettings && $options.goToSettings(...args)),
    c: common_vendor.o((...args) => $options.goToHealthRecord && $options.goToHealthRecord(...args)),
    d: common_vendor.f($data.serviceMenus, (item, index, i0) => {
      return {
        a: common_vendor.n(`menu-icon--${item.icon}`),
        b: item.bgColor,
        c: common_vendor.t(item.title),
        d: index,
        e: common_vendor.o(($event) => $options.handleMenu(item), index)
      };
    }),
    e: common_vendor.f($data.settingMenus, (item, index, i0) => {
      return common_vendor.e({
        a: common_vendor.n(`menu-icon--${item.icon}`),
        b: item.bgColor,
        c: common_vendor.t(item.title),
        d: item.type === "switch"
      }, item.type === "switch" ? {
        e: $options.isDark,
        f: common_vendor.o((...args) => $options.toggleTheme && $options.toggleTheme(...args), index)
      } : {}, {
        g: index,
        h: common_vendor.o(($event) => $options.handleMenu(item), index)
      });
    }),
    f: common_vendor.p({
      current: 4
    }),
    g: $options.isDark ? 1 : ""
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-dd383ca2"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/profile/profile.js.map
