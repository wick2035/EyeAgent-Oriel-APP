"use strict";
const utils_api_request = require("./request.js");
function sendMessage(data) {
  const sessionId = utils_api_request.getSessionId();
  const patientId = utils_api_request.getPatientId();
  return utils_api_request.post("/api/chat", {
    message: data.message,
    patient_id: patientId,
    session_id: sessionId,
    agent_type: data.agent_type || "health",
    role: data.role || "patient",
    conversation_id: data.conversation_id || null
  });
}
function getQuickPrompts() {
  return Promise.resolve([
    { id: 1, text: "最近总是头痛是怎么回事？", icon: "headache" },
    { id: 2, text: "体检报告中的指标异常怎么看？", icon: "report" },
    { id: 3, text: "感冒了应该吃什么药？", icon: "medicine" },
    { id: 4, text: "如何改善睡眠质量？", icon: "sleep" },
    { id: 5, text: "眼睛干涩疲劳怎么缓解？", icon: "eye" },
    { id: 6, text: "血压偏高需要注意什么？", icon: "heart" }
  ]);
}
function refreshQuickPrompts() {
  const allPrompts = [
    { id: 1, text: "最近总是头痛是怎么回事？", icon: "headache" },
    { id: 2, text: "体检报告中的指标异常怎么看？", icon: "report" },
    { id: 3, text: "感冒了应该吃什么药？", icon: "medicine" },
    { id: 4, text: "如何改善睡眠质量？", icon: "sleep" },
    { id: 5, text: "眼睛干涩疲劳怎么缓解？", icon: "eye" },
    { id: 6, text: "血压偏高需要注意什么？", icon: "heart" },
    { id: 7, text: "腰酸背痛是什么原因？", icon: "back" },
    { id: 8, text: "胃不舒服应该怎么调理？", icon: "stomach" },
    { id: 9, text: "皮肤过敏了怎么处理？", icon: "skin" },
    { id: 10, text: "最近容易疲劳是怎么回事？", icon: "fatigue" }
  ];
  const shuffled = allPrompts.sort(() => Math.random() - 0.5);
  return Promise.resolve(shuffled.slice(0, 4));
}
exports.getQuickPrompts = getQuickPrompts;
exports.refreshQuickPrompts = refreshQuickPrompts;
exports.sendMessage = sendMessage;
//# sourceMappingURL=../../../.sourcemap/mp-weixin/utils/api/chat.js.map
