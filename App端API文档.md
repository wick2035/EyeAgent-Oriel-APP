# App 端 API 文档

## 概述

本文档描述 App 移动端相关接口，包括患者登录和 AI 聊天功能。

**基础路径**: `/api/app`

---

## 认证说明

### Token 机制

本系统使用 Sa-Token 进行身份认证。登录成功后，服务端返回 `token`，前端需要在后续请求中携带此 token。

### 前端携带 Token 的方式

**方式一：请求头（推荐）**

```http
GET /api/app/agent/chat HTTP/1.1
Host: your-server.com
satoken: xxxxx-xxxxx-xxxxx-xxxxx
```

**方式二：Cookie**

```http
GET /api/app/agent/chat HTTP/1.1
Host: your-server.com
Cookie: satoken=xxxxx-xxxxx-xxxxx-xxxxx
```

**方式三：URL 参数**

```
GET /api/app/agent/chat?satoken=xxxxx-xxxxx-xxxxx-xxxxx
```

> **注意**：Token 名称为 `satoken`，有效期 24 小时，活动超时 12 小时。

---

## 1. 患者登录

### 基本信息

| 项目 | 说明 |
|------|------|
| 接口路径 | `POST /api/app/base/login` |
| 是否需要认证 | 否 |
| Content-Type | application/json |

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| phone | String | 是 | 手机号 |
| password | String | 是 | 密码 |

### 请求示例

```json
{
  "phone": "13800138000",
  "password": "123456"
}
```

### 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| code | Integer | 状态码，200 表示成功 |
| msg | String | 提示信息 |
| data | Object | 响应数据 |
| data.token | String | 认证令牌 |
| data.patientId | String | 患者ID |
| data.patientName | String | 患者姓名 |
| data.phone | String | 手机号 |

### 响应示例

**成功响应**

```json
{
  "code": 200,
  "msg": "登录成功",
  "data": {
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "patientId": "550e8400-e29b-41d4-a716-446655440000",
    "patientName": "张三",
    "phone": "13800138000"
  }
}
```

**失败响应 - 手机号未注册**

```json
{
  "code": 500,
  "msg": "手机号 '13800138000' 未注册",
  "data": null
}
```

**失败响应 - 密码错误**

```json
{
  "code": 500,
  "msg": "密码错误",
  "data": null
}
```

### 前端集成示例

```javascript
// 登录请求
async function login(phone, password) {
  const response = await fetch('/api/app/base/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ phone, password })
  });

  const result = await response.json();

  if (result.code === 200) {
    // 保存 token 到本地存储
    localStorage.setItem('satoken', result.data.token);
    localStorage.setItem('patientInfo', JSON.stringify(result.data));
  }

  return result;
}

// 后续请求携带 token
async function authorizedRequest(url, options = {}) {
  const token = localStorage.getItem('satoken');

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'satoken': token,  // 在请求头中携带 token
      'Content-Type': 'application/json'
    }
  });
}
```

---

## 2. AI 聊天

### 基本信息

| 项目 | 说明 |
|------|------|
| 接口路径 | `POST /api/app/agent/chat` |
| 是否需要认证 | 是（需携带 satoken） |
| Content-Type | application/json |

### 请求头

| 参数名 | 必填 | 说明 |
|--------|------|------|
| satoken | 是 | 登录返回的认证令牌 |

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| message | String | 是 | 用户发送的消息内容 |
| sessionId | String | 否 | 会话ID，首次对话可为空 |
| agentType | String | 否 | Agent 类型，如 "health" |
| role | String | 否 | 角色，默认 "patient" |
| conversationId | String | 否 | 对话ID，首次对话可为空 |

### 请求示例

```bash
curl -X POST 'http://localhost:8081/api/app/agent/chat' \
  -H 'Content-Type: application/json' \
  -H 'satoken: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...' \
  -d '{
    "message": "我眼睛最近很干涩，想预约医生",
    "sessionId": "sess-abc123",
    "agentType": "health",
    "role": "patient",
    "conversationId": null
  }'
```

### 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| code | Integer | 状态码，200 表示成功 |
| msg | String | 提示信息 |
| data | Object | 响应数据 |
| data.response | String | AI 回复内容 |
| data.sessionId | String | 会话ID |
| data.conversationId | String | 对话ID |
| data.isCompleted | Boolean | 对话是否完成 |
| data.stage | String | 当前阶段 |
| data.agentType | String | Agent 类型 |
| data.metadata | Object | 元数据 |

### 响应示例

**成功响应**

```json
{
  "code": 200,
  "msg": "ok",
  "data": {
    "response": "您好！我是小Eye，很高兴为您服务。您提到眼睛干涩，请问这种情况持续多长时间了？",
    "sessionId": "sess-abc123",
    "conversationId": "660e8400-e29b-41d4-a716-446655440099",
    "isCompleted": false,
    "stage": "health_consultation",
    "agentType": "health",
    "metadata": {
      "patient_id": "550e8400-e29b-41d4-a716-446655440000",
      "message_count": 2,
      "role": "patient"
    }
  }
}
```

**失败响应 - 未登录**

```json
{
  "code": 401,
  "msg": "未能读取到有效 token",
  "data": null
}
```

**失败响应 - AI 服务不可用**

```json
{
  "code": 500,
  "msg": "AI 服务暂时不可用，请稍后重试",
  "data": null
}
```

### 前端集成示例

```javascript
// 发送聊天消息
async function sendChat(message, sessionId = null, conversationId = null) {
  const token = localStorage.getItem('satoken');

  const response = await fetch('/api/app/agent/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'satoken': token
    },
    body: JSON.stringify({
      message,
      sessionId,
      agentType: 'health',
      role: 'patient',
      conversationId
    })
  });

  const result = await response.json();

  // 处理 token 过期
  if (result.code === 401) {
    // 跳转登录页
    window.location.href = '/login';
    return;
  }

  return result;
}

// 使用示例
const chatResult = await sendChat('我眼睛最近很干涩');
if (chatResult.code === 200) {
  console.log('AI 回复:', chatResult.data.response);
  // 保存 conversationId 用于后续对话
  const conversationId = chatResult.data.conversationId;
}
```

---

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未登录或 token 已过期 |
| 403 | 权限不足 |
| 500 | 服务器内部错误 |

---

*文档更新日期：2025-12-03*
