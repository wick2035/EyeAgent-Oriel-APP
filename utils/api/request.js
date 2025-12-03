"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_config = require("../config.js");
function generateSessionId() {
  return "sess-" + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}
function getSessionId() {
  let sessionId = common_vendor.index.getStorageSync(utils_config.config.storageKeys.sessionId);
  if (!sessionId) {
    sessionId = generateSessionId();
    common_vendor.index.setStorageSync(utils_config.config.storageKeys.sessionId, sessionId);
  }
  return sessionId;
}
function getPatientId() {
  return common_vendor.index.getStorageSync(utils_config.config.storageKeys.patientId) || null;
}
function request(options) {
  return new Promise((resolve, reject) => {
    const token = common_vendor.index.getStorageSync(utils_config.config.storageKeys.token);
    const header = {
      ...utils_config.config.headers,
      ...options.header
    };
    if (token) {
      header["Authorization"] = `Bearer ${token}`;
    }
    common_vendor.index.request({
      url: options.url.startsWith("http") ? options.url : utils_config.config.baseUrl + options.url,
      method: options.method || "GET",
      data: options.data,
      header,
      timeout: options.timeout || utils_config.config.timeout,
      success: (res) => {
        const { statusCode, data } = res;
        if (statusCode >= 200 && statusCode < 300) {
          resolve(data);
        } else if (statusCode === 401) {
          common_vendor.index.removeStorageSync(utils_config.config.storageKeys.token);
          common_vendor.index.showToast({
            title: "登录已过期，请重新登录",
            icon: "none"
          });
          reject({ code: 401, message: "未授权" });
        } else {
          const errorMsg = (data == null ? void 0 : data.message) || `请求失败 (${statusCode})`;
          common_vendor.index.showToast({
            title: errorMsg,
            icon: "none"
          });
          reject({ code: statusCode, message: errorMsg, data });
        }
      },
      fail: (err) => {
        common_vendor.index.__f__("error", "at utils/api/request.js:86", "请求失败:", err);
        common_vendor.index.showToast({
          title: "网络连接失败，请检查网络",
          icon: "none"
        });
        reject({ code: -1, message: "网络错误", error: err });
      }
    });
  });
}
function post(url, data = {}, options = {}) {
  return request({
    url,
    method: "POST",
    data,
    ...options
  });
}
exports.getPatientId = getPatientId;
exports.getSessionId = getSessionId;
exports.post = post;
//# sourceMappingURL=../../../.sourcemap/mp-weixin/utils/api/request.js.map
