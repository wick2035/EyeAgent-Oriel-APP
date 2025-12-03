"use strict";
var _a;
const ENV = {
  development: {
    baseUrl: "http://localhost:8000"
  },
  production: {
    baseUrl: "https://api.example.com"
  }
};
const currentEnv = "development";
const config = {
  // API基础地址
  baseUrl: (_a = ENV[currentEnv]) == null ? void 0 : _a.baseUrl,
  // 请求超时时间(ms)
  timeout: 3e4,
  // 默认请求头
  headers: {
    "Content-Type": "application/json"
  },
  // 存储键名
  storageKeys: {
    token: "auth_token",
    userInfo: "user_info",
    patientId: "patient_id",
    sessionId: "session_id",
    theme: "app_theme"
  }
};
exports.config = config;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/config.js.map
