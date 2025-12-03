"use strict";
const common_vendor = require("../common/vendor.js");
const utils_config = require("../utils/config.js");
const THEME_LIGHT = "light";
const THEME_DARK = "dark";
const THEME_SYSTEM = "system";
const themeState = common_vendor.reactive({
  // 用户设置的主题（light/dark/system）
  setting: THEME_LIGHT,
  // 实际应用的主题（light/dark）
  current: THEME_LIGHT
});
function getSystemTheme() {
  try {
    const res = common_vendor.index.getSystemInfoSync();
    return res.theme || THEME_LIGHT;
  } catch (e) {
    return THEME_LIGHT;
  }
}
function initTheme() {
  const savedTheme = common_vendor.index.getStorageSync(utils_config.config.storageKeys.theme);
  if (savedTheme) {
    themeState.setting = savedTheme;
  }
  applyTheme();
  common_vendor.index.onThemeChange && common_vendor.index.onThemeChange((res) => {
    if (themeState.setting === THEME_SYSTEM) {
      themeState.current = res.theme;
      updateStatusBar();
    }
  });
}
function applyTheme() {
  if (themeState.setting === THEME_SYSTEM) {
    themeState.current = getSystemTheme();
  } else {
    themeState.current = themeState.setting;
  }
  updateStatusBar();
}
function setTheme(theme) {
  themeState.setting = theme;
  common_vendor.index.setStorageSync(utils_config.config.storageKeys.theme, theme);
  applyTheme();
}
function updateStatusBar() {
  themeState.current === THEME_DARK;
}
function isDarkMode() {
  return themeState.current === THEME_DARK;
}
exports.THEME_DARK = THEME_DARK;
exports.THEME_LIGHT = THEME_LIGHT;
exports.initTheme = initTheme;
exports.isDarkMode = isDarkMode;
exports.setTheme = setTheme;
//# sourceMappingURL=../../.sourcemap/mp-weixin/store/theme.js.map
