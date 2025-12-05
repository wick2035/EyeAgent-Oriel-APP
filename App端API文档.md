# App 端 API 文档

## 概述

本文档描述 App 移动端相关接口，包括患者登录、会话管理和 AI 聊天功能。

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

## 2. 获取会话列表

### 基本信息

| 项目 | 说明 |
|------|------|
| 接口路径 | `GET /api/app/agent/get-conversation` |
| 是否需要认证 | 是（需携带 satoken） |
| Content-Type | application/json |

### 请求头

| 参数名 | 必填 | 说明 |
|--------|------|------|
| satoken | 是 | 登录返回的认证令牌 |

### 请求参数

无

### 请求示例

```bash
curl -X GET 'http://localhost:8081/api/app/agent/get-conversation' \
  -H 'satoken: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...'
```

### 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| code | Integer | 状态码，200 表示成功 |
| msg | String | 提示信息 |
| data | Array | 会话列表 |
| data[].id | String | 会话ID |
| data[].hostId | String | 会话所属用户ID |
| data[].userType | String | 用户类型 |
| data[].title | String | 会话标题 |
| data[].summary | String | 会话摘要 |
| data[].totalMessages | Integer | 消息总数 |
| data[].createTime | String | 创建时间 |
| data[].updateTime | String | 更新时间 |

### 响应示例

**成功响应**

```json
{
  "code": 200,
  "msg": "success",
  "data": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "hostId": "550e8400-e29b-41d4-a716-446655440000",
      "userType": "patient",
      "title": "眼睛干涩咨询",
      "summary": "关于眼睛干涩的健康咨询对话",
      "totalMessages": 6,
      "createTime": "2025-12-03 10:30:00",
      "updateTime": "2025-12-03 11:15:00"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440002",
      "hostId": "550e8400-e29b-41d4-a716-446655440000",
      "userType": "patient",
      "title": "预约挂号咨询",
      "summary": "咨询医生预约相关问题",
      "totalMessages": 4,
      "createTime": "2025-12-02 14:20:00",
      "updateTime": "2025-12-02 14:45:00"
    }
  ]
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

### 前端集成示例

```javascript
// 获取会话列表
async function getConversations() {
  const token = localStorage.getItem('satoken');

  const response = await fetch('/api/app/agent/get-conversation', {
    method: 'GET',
    headers: {
      'satoken': token
    }
  });

  const result = await response.json();

  if (result.code === 200) {
    return result.data;  // 返回会话列表
  }

  return [];
}
```

---

## 3. 分页查询会话列表

### 基本信息

| 项目 | 说明 |
|------|------|
| 接口路径 | `GET /api/app/agent/page-conversation` |
| 是否需要认证 | 是（需携带 satoken） |
| Content-Type | application/json |

### 请求头

| 参数名 | 必填 | 说明 |
|--------|------|------|
| satoken | 是 | 登录返回的认证令牌 |

### 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| searchKey | String | 否 | - | 搜索关键词，匹配会话标题或摘要 |
| pageNum | Integer | 否 | 1 | 页码，从 1 开始 |
| pageSize | Integer | 否 | 10 | 每页记录数 |

### 请求示例

```bash
# 获取第一页，每页10条
curl -X GET 'http://localhost:8081/api/app/agent/page-conversation?pageNum=1&pageSize=10' \
  -H 'satoken: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...'

# 搜索包含"眼睛"的会话
curl -X GET 'http://localhost:8081/api/app/agent/page-conversation?searchKey=眼睛&pageNum=1&pageSize=10' \
  -H 'satoken: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...'
```

### 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| code | Integer | 状态码，200 表示成功 |
| msg | String | 提示信息 |
| data | Array | 当前页会话列表 |
| data[].id | String | 会话ID |
| data[].hostId | String | 会话所属用户ID |
| data[].userType | String | 用户类型 |
| data[].title | String | 会话标题 |
| data[].summary | String | 会话摘要 |
| data[].totalMessages | Integer | 消息总数 |
| data[].createTime | String | 创建时间 |
| data[].updateTime | String | 更新时间 |
| pageNum | Long | 当前页码 |
| total | Long | 总记录数 |
| pages | Long | 总页数 |

### 响应示例

**成功响应**

```json
{
  "code": 200,
  "msg": "success",
  "data": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "hostId": "550e8400-e29b-41d4-a716-446655440000",
      "userType": "patient",
      "title": "眼睛干涩咨询",
      "summary": "关于眼睛干涩的健康咨询对话",
      "totalMessages": 6,
      "createTime": "2025-12-03 10:30:00",
      "updateTime": "2025-12-03 11:15:00"
    }
  ],
  "pageNum": 1,
  "total": 15,
  "pages": 2
}
```

**空结果响应**

```json
{
  "code": 200,
  "msg": "success",
  "data": [],
  "pageNum": 1,
  "total": 0,
  "pages": 0
}
```

### 前端集成示例

```javascript
// 分页获取会话列表
async function pageConversations(searchKey = '', pageNum = 1, pageSize = 10) {
  const token = localStorage.getItem('satoken');

  const params = new URLSearchParams({
    pageNum: pageNum.toString(),
    pageSize: pageSize.toString()
  });

  if (searchKey) {
    params.append('searchKey', searchKey);
  }

  const response = await fetch(`/api/app/agent/page-conversation?${params}`, {
    method: 'GET',
    headers: {
      'satoken': token
    }
  });

  const result = await response.json();

  if (result.code === 200) {
    return {
      list: result.data,
      pageNum: result.pageNum,
      total: result.total,
      pages: result.pages
    };
  }

  return { list: [], pageNum: 1, total: 0, pages: 0 };
}

// 使用示例
const { list, total, pages } = await pageConversations('眼睛', 1, 10);
console.log(`共 ${total} 条记录，${pages} 页`);
```

---

## 4. 获取会话消息列表

### 基本信息

| 项目 | 说明 |
|------|------|
| 接口路径 | `GET /api/app/agent/get-messages` |
| 是否需要认证 | 是（需携带 satoken） |
| Content-Type | application/json |

### 请求头

| 参数名 | 必填 | 说明 |
|--------|------|------|
| satoken | 是 | 登录返回的认证令牌 |

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| chatConversationId | String | 是 | 会话ID |

### 请求示例

```bash
curl -X GET 'http://localhost:8081/api/app/agent/get-messages?chatConversationId=660e8400-e29b-41d4-a716-446655440001' \
  -H 'satoken: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...'
```

### 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| code | Integer | 状态码，200 表示成功 |
| msg | String | 提示信息 |
| data | Array | 消息列表（按消息顺序升序排列） |
| data[].id | String | 消息ID |
| data[].chatId | String | 所属会话ID |
| data[].messageOrder | Integer | 消息顺序号 |
| data[].messageContent | String | 消息内容 |
| data[].messageType | String | 消息类型（如 "user"、"assistant"） |
| data[].senderId | String | 发送者ID |
| data[].context | String | 上下文信息 |
| data[].tokenUsed | Integer | 消耗的 Token 数量 |
| data[].createTime | String | 创建时间 |
| conversation | Object | 会话详情 |
| conversation.id | String | 会话ID |
| conversation.title | String | 会话标题 |
| conversation.summary | String | 会话摘要 |
| conversation.totalMessages | Integer | 消息总数 |

### 响应示例

**成功响应**

```json
{
  "code": 200,
  "msg": "success",
  "data": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440001",
      "chatId": "660e8400-e29b-41d4-a716-446655440001",
      "messageOrder": 1,
      "messageContent": "我眼睛最近很干涩，想预约医生",
      "messageType": "user",
      "senderId": "550e8400-e29b-41d4-a716-446655440000",
      "context": null,
      "tokenUsed": 15,
      "createTime": "2025-12-03 10:30:00"
    },
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "chatId": "660e8400-e29b-41d4-a716-446655440001",
      "messageOrder": 2,
      "messageContent": "您好！我是小Eye，很高兴为您服务。您提到眼睛干涩，请问这种情况持续多长时间了？",
      "messageType": "assistant",
      "senderId": "agent",
      "context": "{\"stage\": \"health_consultation\"}",
      "tokenUsed": 45,
      "createTime": "2025-12-03 10:30:05"
    }
  ],
  "conversation": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "hostId": "550e8400-e29b-41d4-a716-446655440000",
    "userType": "patient",
    "title": "眼睛干涩咨询",
    "summary": "关于眼睛干涩的健康咨询对话",
    "totalMessages": 6,
    "createTime": "2025-12-03 10:30:00",
    "updateTime": "2025-12-03 11:15:00"
  }
}
```

**失败响应 - 会话不存在**

```json
{
  "code": 500,
  "msg": "会话 660e8400-e29b-41d4-a716-446655440099 不存在",
  "data": null
}
```

**失败响应 - 无权访问**

```json
{
  "code": 500,
  "msg": "无权访问会话 660e8400-e29b-41d4-a716-446655440001",
  "data": null
}
```

### 前端集成示例

```javascript
// 获取会话消息列表
async function getMessages(conversationId) {
  const token = localStorage.getItem('satoken');

  const response = await fetch(
    `/api/app/agent/get-messages?chatConversationId=${conversationId}`,
    {
      method: 'GET',
      headers: {
        'satoken': token
      }
    }
  );

  const result = await response.json();

  if (result.code === 200) {
    return {
      messages: result.data,
      conversation: result.conversation
    };
  }

  // 处理错误
  if (result.code === 500) {
    console.error('获取消息失败:', result.msg);
  }

  return { messages: [], conversation: null };
}

// 使用示例：进入会话详情页面
async function enterConversation(conversationId) {
  const { messages, conversation } = await getMessages(conversationId);

  if (conversation) {
    document.title = conversation.title;

    // 渲染消息列表
    messages.forEach(msg => {
      renderMessage(msg.messageContent, msg.messageType);
    });
  }
}
```

---

## 5. AI 聊天

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

*文档更新日期：2025-12-05*
