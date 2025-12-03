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
      currentDept: 0,
      departments: ["全部", "眼科", "内科", "外科", "皮肤科", "儿科", "妇科", "骨科", "神经科"],
      doctors: [
        {
          id: 1,
          name: "张明华",
          title: "主任医师",
          department: "眼科",
          intro: "擅长白内障、青光眼、眼底病变等眼部疾病的诊断与治疗，从医30年经验丰富。",
          rating: 4.9,
          consultCount: 2847,
          available: true
        },
        {
          id: 2,
          name: "李婷婷",
          title: "副主任医师",
          department: "眼科",
          intro: "专注于近视防控、角膜塑形镜验配及干眼症治疗。",
          rating: 4.8,
          consultCount: 1562,
          available: true
        },
        {
          id: 3,
          name: "王建国",
          title: "主任医师",
          department: "内科",
          intro: "心血管内科专家，擅长高血压、冠心病、心律失常等疾病诊治。",
          rating: 4.9,
          consultCount: 3421,
          available: false
        },
        {
          id: 4,
          name: "陈晓燕",
          title: "副主任医师",
          department: "皮肤科",
          intro: "皮肤美容、过敏性皮肤病、痤疮等常见皮肤问题诊疗专家。",
          rating: 4.7,
          consultCount: 1893,
          available: true
        },
        {
          id: 5,
          name: "刘伟强",
          title: "主治医师",
          department: "骨科",
          intro: "运动损伤、关节疾病、脊柱退行性病变的微创治疗。",
          rating: 4.6,
          consultCount: 982,
          available: true
        }
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
    selectDept(index) {
      this.currentDept = index;
    },
    selectDoctor(doctor) {
      if (!doctor.available) {
        common_vendor.index.showToast({ title: "该医生暂无可预约时段", icon: "none" });
        return;
      }
      common_vendor.index.showToast({ title: "预约详情页开发中", icon: "none" });
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
    b: common_vendor.f($data.departments, (dept, index, i0) => {
      return {
        a: common_vendor.t(dept),
        b: index,
        c: $data.currentDept === index ? 1 : "",
        d: common_vendor.o(($event) => $options.selectDept(index), index)
      };
    }),
    c: common_vendor.f($data.doctors, (doctor, index, i0) => {
      return {
        a: common_vendor.t(doctor.name.charAt(0)),
        b: common_vendor.t(doctor.name),
        c: common_vendor.t(doctor.title),
        d: common_vendor.t(doctor.department),
        e: common_vendor.t(doctor.intro),
        f: common_vendor.t(doctor.rating),
        g: common_vendor.t(doctor.consultCount),
        h: common_vendor.t(doctor.available ? "预约" : "约满"),
        i: !doctor.available ? 1 : "",
        j: index,
        k: common_vendor.o(($event) => $options.selectDoctor(doctor), index)
      };
    }),
    d: common_vendor.p({
      current: 1
    }),
    e: $options.isDark ? 1 : ""
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-ef2dfbea"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/appointment/appointment.js.map
