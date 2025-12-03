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
      currentTab: 0,
      tabs: ["全部", "系统通知", "问诊回复"],
      messages: [
        {
          id: 1,
          type: "system",
          title: "系统通知",
          desc: "您的账号已完成实名认证，可以享受更多服务",
          time: "今天 14:30",
          unread: true
        },
        {
          id: 2,
          type: "consult",
          title: "问诊回复",
          desc: "小Eye回复了您的问诊：根据您描述的症状，建议您...",
          time: "今天 10:15",
          unread: true
        },
        {
          id: 3,
          type: "system",
          title: "预约提醒",
          desc: "您预约的张明华医生明天上午9:00有诊，请准时就诊",
          time: "昨天 18:00",
          unread: false
        },
        {
          id: 4,
          type: "notify",
          title: "健康提示",
          desc: "根据您的健康数据分析，建议您增加每日饮水量",
          time: "昨天 09:30",
          unread: false
        },
        {
          id: 5,
          type: "consult",
          title: "问诊回复",
          desc: "感谢您的咨询，您的问题已解答完毕，祝您身体健康",
          time: "3天前",
          unread: false
        }
      ]
    };
  },
  computed: {
    isDark() {
      return store_theme.isDarkMode();
    },
    filteredMessages() {
      if (this.currentTab === 0)
        return this.messages;
      if (this.currentTab === 1)
        return this.messages.filter((m) => m.type === "system" || m.type === "notify");
      if (this.currentTab === 2)
        return this.messages.filter((m) => m.type === "consult");
      return this.messages;
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
    switchTab(index) {
      this.currentTab = index;
    },
    openMessage(msg) {
      msg.unread = false;
      common_vendor.index.showToast({ title: "消息详情开发中", icon: "none" });
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
    b: common_vendor.f($data.tabs, (tab, index, i0) => {
      return common_vendor.e({
        a: common_vendor.t(tab),
        b: $data.currentTab === index
      }, $data.currentTab === index ? {} : {}, {
        c: index,
        d: $data.currentTab === index ? 1 : "",
        e: common_vendor.o(($event) => $options.switchTab(index), index)
      });
    }),
    c: $options.filteredMessages.length === 0
  }, $options.filteredMessages.length === 0 ? {} : {
    d: common_vendor.f($options.filteredMessages, (msg, index, i0) => {
      return common_vendor.e({
        a: msg.type === "system"
      }, msg.type === "system" ? {} : msg.type === "consult" ? {} : {}, {
        b: msg.type === "consult",
        c: common_vendor.n(`message-item__avatar--${msg.type}`),
        d: common_vendor.t(msg.title),
        e: common_vendor.t(msg.time),
        f: common_vendor.t(msg.desc),
        g: msg.unread
      }, msg.unread ? {} : {}, {
        h: index,
        i: common_vendor.o(($event) => $options.openMessage(msg), index)
      });
    })
  }, {
    e: common_vendor.p({
      current: 3
    }),
    f: $options.isDark ? 1 : ""
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-ecc172b4"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/messages/messages.js.map
