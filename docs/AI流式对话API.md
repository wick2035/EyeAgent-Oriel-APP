# App 流式 AI 对话接口文档

> 基础路径：`/api/app/extra`
>
> 本文档描述 App 端流式 AI 对话接口，基于 SSE（Server-Sent Events）实现实时流式响应。

---

## 目录

- [概述](#概述)
- [接口详情](#接口详情)
- [SSE 事件类型](#sse-事件类型)
- [前端对接指南](#前端对接指南)
- [错误处理](#错误处理)
- [完整对接示例](#完整对接示例)

---

## 概述

该接口将用户消息转发至 Python AI Agent 后端，以 SSE 流式方式实时返回 AI 回复。前端通过监听 SSE 事件流，实现逐字/逐段输出的对话体验。

**核心流程**：

```
前端 → Java 后端 (透传) → Python Agent 后端
                                    ↓
前端 ← Java 后端 (SSE 透传) ← Python Agent (SSE 事件流)
```

---

## 接口详情

### 流式 AI 对话

发送消息并以 SSE 流接收 AI 回复。

**请求**

```
POST /api/app/extra/ai-chat-query
```

**请求 Headers**

| Header         | 值                          | 必填 | 说明              |
|----------------|-----------------------------|------|-------------------|
| Content-Type   | `application/json`          | 是   | 请求体格式        |
| Accept         | `text/event-stream`         | 是   | 声明接收 SSE 流   |
| satoken        | `{token}`                   | 是   | Sa-Token 登录凭证 |

**请求体**

```json
{
  "message": "我眼睛最近很干涩，怎么回事？",
  "conversationId": null,
  "sessionId": null
}
```

**请求参数说明**

| 参数             | 类型   | 必填 | 说明                                                                 |
|------------------|--------|------|----------------------------------------------------------------------|
| message          | String | 是   | 用户消息内容，不能为空                                               |
| conversationId   | String | 否   | 数据库会话 ID。首次对话传 `null`，后续传 `start`/`done` 事件返回的值 |
| sessionId        | String | 否   | Python 运行时会话 ID。首次对话传 `null`，后续传 `start` 事件返回的值 |

> **首次对话**：`conversationId` 和 `sessionId` 都传 `null`，Python 后端会自动生成。
>
> **后续对话**：必须传回之前收到的 `conversationId` 和 `sessionId`，以维持上下文连续性。

**响应格式**

```
Content-Type: text/event-stream
Cache-Control: no-cache
```

响应体为 SSE 事件流，每个事件格式：

```
data: {JSON 对象}

```

---

## SSE 事件类型

### 1. `start` — 会话初始化

对话开始时发送，携带会话标识信息。**前端必须保存这些 ID 用于后续请求。**

```json
{
  "event": "start",
  "session_id": "sess_abc123",
  "conversation_id": "conv_def456",
  "thread_id": "thread_ghi789"
}
```

| 字段              | 类型   | 说明                                  |
|-------------------|--------|---------------------------------------|
| event             | String | 固定值 `"start"`                      |
| session_id        | String | Python 运行时会话 ID，后续请求需回传  |
| conversation_id   | String | 数据库会话 ID，后续请求需回传         |
| thread_id         | String | LangGraph thread ID                   |

---

### 2. `token` — 文本片段

AI 生成的文本片段，逐段推送。前端应将 `content` 依次拼接显示。

```json
{
  "event": "token",
  "content": "您好！"
}
```

```json
{
  "event": "token",
  "content": "根据您描述的症状，"
}
```

| 字段    | 类型   | 说明                 |
|---------|--------|----------------------|
| event   | String | 固定值 `"token"`     |
| content | String | 文本片段，逐段拼接   |

---

### 3. `agent_switch` — Agent 切换通知

系统在 Agent 之间切换时发送（如从健康咨询切换到报告分析）。

```json
{
  "event": "agent_switch",
  "metadata": {
    "from": "health",
    "to": "report"
  }
}
```

| 字段     | 类型   | 说明                     |
|----------|--------|--------------------------|
| event    | String | 固定值 `"agent_switch"`  |
| metadata | Object | 包含 `from` 和 `to` 字段 |

---

### 4. `tool_call` — 工具调用

AI 调用外部工具（如查询医生空闲时间、查询处方等）时发送。可用于前端展示"正在查询..."等加载状态。

**工具调用开始**：
```json
{
  "event": "tool_call",
  "metadata": {
    "tool": "get_doctor_free_time",
    "status": "start",
    "input": { "date": "2026-03-05", "hospitalKey": "眼科医院" }
  }
}
```

**工具调用结束**：
```json
{
  "event": "tool_call",
  "metadata": {
    "tool": "get_doctor_free_time",
    "status": "end",
    "output": "..."
  }
}
```

| 字段     | 类型   | 说明                                              |
|----------|--------|---------------------------------------------------|
| event    | String | 固定值 `"tool_call"`                              |
| metadata | Object | 包含 `tool`(工具名)、`status`(start/end)、`input`/`output` |

---

### 5. `done` — 对话完成

AI 回复结束时发送，包含完整回复和会话元信息。

```json
{
  "event": "done",
  "response": "根据您描述的眼睛干涩症状，这可能是干眼症的表现...",
  "agent_type": "health",
  "stage": "health_consultation",
  "session_id": "sess_abc123",
  "conversation_id": "conv_def456"
}
```

| 字段              | 类型   | 说明                                    |
|-------------------|--------|-----------------------------------------|
| event             | String | 固定值 `"done"`                         |
| response          | String | 完整的 AI 回复文本                      |
| agent_type        | String | 处理该请求的 Agent 类型（见下表）       |
| stage             | String | 当前对话阶段（见下表）                  |
| session_id        | String | 运行时会话 ID                           |
| conversation_id   | String | 数据库会话 ID                           |

**Agent 类型**

| agent_type      | 说明     |
|-----------------|----------|
| `health`        | 健康咨询 |
| `report`        | 报告分析 |
| `reminder`      | 提醒管理 |
| `recommendation`| 产品推荐 |

**常见对话阶段 (stage)**

| 阶段                    | 说明         |
|-------------------------|--------------|
| `greeting`              | 初次问候     |
| `health_consultation`   | 健康咨询中   |
| `symptom_assessment`    | 症状评估     |
| `ophthalmology_triage`  | 眼科分诊     |
| `appointment_inquiry`   | 询问预约意向 |
| `appointment_booking`   | 预约确认中   |
| `processing`            | 处理中       |
| `completed`             | 对话完成     |

---

### 6. `error` — 错误

处理出错时发送。

```json
{
  "event": "error",
  "message": "AI 服务暂时不可用，请稍后重试"
}
```

| 字段    | 类型   | 说明                 |
|---------|--------|----------------------|
| event   | String | 固定值 `"error"`     |
| message | String | 错误描述信息         |

---

## 前端对接指南

### 状态管理

前端需要维护以下状态：

```
conversationId: String | null   // 从 start/done 事件获取，后续请求回传
sessionId: String | null        // 从 start 事件获取，后续请求回传
currentResponse: String         // 拼接 token 事件的 content
isStreaming: Boolean             // 流式输出中标志
```

### 事件处理流程

```
收到 start  → 保存 session_id、conversation_id
收到 token  → 拼接 content 到当前回复，实时渲染
收到 tool_call (status=start) → 显示"正在查询..."
收到 tool_call (status=end)   → 隐藏加载状态
收到 done   → 标记回复结束，更新 session_id/conversation_id
收到 error  → 显示错误提示，停止流式输出
```

### 关键注意事项

1. **ID 回传**：首次对话后，后续每次请求必须传回 `conversationId` 和 `sessionId`，否则 Python 后端会创建新的会话上下文
2. **重复内容**：`done` 事件的 `response` 是完整回复，与 `token` 拼接结果一致，可用于校验或替换
3. **连接超时**：SSE 连接最长保持 5 分钟，超时后连接自动断开
4. **未登录**：未携带有效 `satoken` 时返回 HTTP 401

---

## 错误处理

### HTTP 层错误

| HTTP 状态码 | 说明                                  |
|-------------|---------------------------------------|
| 401         | 未登录或 token 已过期                 |
| 400         | 请求参数校验失败（如 message 为空）   |
| 500         | 服务端内部错误                        |

**参数校验失败示例**（HTTP 400）：
```json
{
  "code": 400,
  "msg": "消息内容不能为空"
}
```

### SSE 流内错误

当 Python Agent 服务不可用或处理异常时，SSE 流中会推送一个 `error` 事件后终止：

```
data: {"event":"error","message":"AI 服务暂时不可用，请稍后重试"}

```

---

## 完整对接示例

### cURL 测试

```bash
curl -X POST http://localhost:8081/api/app/extra/ai-chat-query \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -H "satoken: your-token-here" \
  -d '{"message": "我眼睛最近很干涩", "conversationId": null, "sessionId": null}' \
  --no-buffer
```

### JavaScript (EventSource 不适用 POST，使用 fetch)

```javascript
async function streamChat(message, conversationId, sessionId) {
  const response = await fetch('/api/app/extra/ai-chat-query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
      'satoken': getToken(),
    },
    body: JSON.stringify({ message, conversationId, sessionId }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullContent = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop(); // 保留不完整的行

    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const jsonStr = line.slice(5).trim();
      if (!jsonStr) continue;

      const chunk = JSON.parse(jsonStr);

      switch (chunk.event) {
        case 'start':
          // 保存会话 ID，后续请求回传
          this.sessionId = chunk.session_id;
          this.conversationId = chunk.conversation_id;
          break;

        case 'token':
          fullContent += chunk.content;
          // 实时渲染到 UI
          updateUI(fullContent);
          break;

        case 'tool_call':
          if (chunk.metadata?.status === 'start') {
            showLoading(`正在调用 ${chunk.metadata.tool}...`);
          } else {
            hideLoading();
          }
          break;

        case 'done':
          // 回复完成，可用 chunk.response 校验完整性
          this.sessionId = chunk.session_id;
          this.conversationId = chunk.conversation_id;
          break;

        case 'error':
          showError(chunk.message);
          return;
      }
    }
  }
}
```

### 完整事件流示例

首次对话：`{"message": "我眼睛最近很干涩", "conversationId": null, "sessionId": null}`

```
data: {"event":"start","session_id":"sess_a1b2c3","conversation_id":"conv_d4e5f6","thread_id":"thread_g7h8i9"}

data: {"event":"token","content":"您好！"}

data: {"event":"token","content":"根据您描述的"}

data: {"event":"token","content":"眼睛干涩症状，"}

data: {"event":"token","content":"这可能与以下原因有关：\n\n"}

data: {"event":"token","content":"1. **干眼症** — 泪液分泌不足或蒸发过快\n"}

data: {"event":"token","content":"2. **用眼过度** — 长时间注视屏幕导致眨眼频率降低\n"}

data: {"event":"token","content":"3. **环境因素** — 空调、干燥环境\n\n"}

data: {"event":"token","content":"建议您先尝试使用人工泪液缓解，如果持续不改善，建议到眼科就诊。需要帮您预约医生吗？"}

data: {"event":"done","response":"您好！根据您描述的眼睛干涩症状，这可能与以下原因有关：\n\n1. **干眼症** — 泪液分泌不足或蒸发过快\n2. **用眼过度** — 长时间注视屏幕导致眨眼频率降低\n3. **环境因素** — 空调、干燥环境\n\n建议您先尝试使用人工泪液缓解，如果持续不改善，建议到眼科就诊。需要帮您预约医生吗？","agent_type":"health","stage":"health_consultation","session_id":"sess_a1b2c3","conversation_id":"conv_d4e5f6"}

```

后续对话：`{"message": "帮我预约明天的医生", "conversationId": "conv_d4e5f6", "sessionId": "sess_a1b2c3"}`

```
data: {"event":"start","session_id":"sess_a1b2c3","conversation_id":"conv_d4e5f6","thread_id":"thread_g7h8i9"}

data: {"event":"token","content":"好的，我来帮您查询明天可用的医生。"}

data: {"event":"tool_call","metadata":{"tool":"get_doctor_free_time","status":"start","input":{"date":"2026-03-02","hospitalKey":"眼科医院"}}}

data: {"event":"tool_call","metadata":{"tool":"get_doctor_free_time","status":"end","output":"..."}}

data: {"event":"token","content":"\n\n明天有以下医生可预约：\n1. 张医生 — 上午 9:00-11:00\n2. 李医生 — 下午 14:00-16:00\n\n请问您选择哪位医生？"}

data: {"event":"done","response":"好的，我来帮您查询明天可用的医生。\n\n明天有以下医生可预约：\n1. 张医生 — 上午 9:00-11:00\n2. 李医生 — 下午 14:00-16:00\n\n请问您选择哪位医生？","agent_type":"health","stage":"appointment_inquiry","session_id":"sess_a1b2c3","conversation_id":"conv_d4e5f6"}

```

---

## 更新日志

| 日期       | 版本 | 说明                  |
|------------|------|-----------------------|
| 2026-03-01 | 1.0  | 初版，流式 AI 对话接口 |
