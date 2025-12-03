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
      unreadCount: 3,
      services: [
        { name: "在线问诊", icon: "consult", type: "primary", path: "/pages/ai-consult/ai-consult" },
        { name: "预约挂号", icon: "appointment", type: "success", path: "/pages/appointment/appointment" },
        { name: "健康档案", icon: "record", type: "info", path: "" },
        { name: "用药提醒", icon: "medicine", type: "warning", path: "" }
      ],
      healthData: {
        steps: "6,482",
        heartRate: "72",
        sleep: "7.5h"
      },
      newsList: [
        {
          id: 1,
          title: "秋冬季节如何预防流感？专家给你支招",
          desc: "随着气温下降，流感病毒开始活跃，专家建议从以下几个方面做好预防...",
          source: "健康时报",
          time: "2小时前",
          cover: ""
        },
        {
          id: 2,
          title: "每天喝多少水才健康？这个数字你要记住",
          desc: "正确的饮水习惯对健康至关重要，但喝水也有讲究...",
          source: "医学科普",
          time: "5小时前",
          cover: ""
        }
      ]
    };
  },
  computed: {
    isDark() {
      return store_theme.isDarkMode();
    },
    greeting() {
      const hour = (/* @__PURE__ */ new Date()).getHours();
      if (hour < 6)
        return "夜深了";
      if (hour < 9)
        return "早上好";
      if (hour < 12)
        return "上午好";
      if (hour < 14)
        return "中午好";
      if (hour < 18)
        return "下午好";
      if (hour < 22)
        return "晚上好";
      return "夜深了";
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
    goToMessages() {
      common_vendor.index.switchTab({
        url: "/pages/messages/messages"
      });
    },
    goToSearch() {
      common_vendor.index.showToast({ title: "搜索功能开发中", icon: "none" });
    },
    handleService(service) {
      if (service.path) {
        common_vendor.index.switchTab({ url: service.path });
      } else {
        common_vendor.index.showToast({ title: "功能开发中", icon: "none" });
      }
    },
    goToHealth() {
      common_vendor.index.showToast({ title: "健康详情开发中", icon: "none" });
    },
    goToNews() {
      common_vendor.index.showToast({ title: "资讯列表开发中", icon: "none" });
    },
    goToNewsDetail(item) {
      common_vendor.index.showToast({ title: "资讯详情开发中", icon: "none" });
    }
  }
};
if (!Array) {
  const _component_TabBar = common_vendor.resolveComponent("TabBar");
  _component_TabBar();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.statusBarHeight + "px",
    b: common_vendor.t($options.greeting),
    c: $data.unreadCount > 0
  }, $data.unreadCount > 0 ? {
    d: common_vendor.t($data.unreadCount > 99 ? "99+" : $data.unreadCount)
  } : {}, {
    e: common_vendor.o((...args) => $options.goToMessages && $options.goToMessages(...args)),
    f: common_vendor.o((...args) => $options.goToSearch && $options.goToSearch(...args)),
    g: common_vendor.f($data.services, (service, index, i0) => {
      return {
        a: common_vendor.n(`service-icon--${service.icon}`),
        b: common_vendor.n(`service-item__icon--${service.type}`),
        c: common_vendor.t(service.name),
        d: index,
        e: index * 0.1 + "s",
        f: common_vendor.o(($event) => $options.handleService(service), index)
      };
    }),
    h: common_vendor.o((...args) => $options.goToHealth && $options.goToHealth(...args)),
    i: common_vendor.t($data.healthData.steps),
    j: common_vendor.t($data.healthData.heartRate),
    k: common_vendor.t($data.healthData.sleep),
    l: common_vendor.o((...args) => $options.goToNews && $options.goToNews(...args)),
    m: common_vendor.f($data.newsList, (item, index, i0) => {
      return common_vendor.e({
        a: common_vendor.t(item.title),
        b: common_vendor.t(item.desc),
        c: common_vendor.t(item.source),
        d: common_vendor.t(item.time),
        e: item.cover
      }, item.cover ? {
        f: item.cover
      } : {}, {
        g: index,
        h: common_vendor.o(($event) => $options.goToNewsDetail(item), index)
      });
    }),
    n: common_vendor.p({
      current: 0
    }),
    o: $options.isDark ? 1 : ""
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-1cf27b2a"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
