# 通知系统 API 文档

> 版本: v1.0
> 更新时间: 2025-12-05


---

## 目录

- [概述](#概述)
- [通用说明](#通用说明)
- [HTTP 接口](#http-接口)
  - [获取未读通知](#1-获取未读通知)
  - [获取已读通知（分页）](#2-获取已读通知分页)
  - [标记单条通知为已读](#3-标记单条通知为已读)
  - [标记全部通知为已读](#4-标记全部通知为已读)
- [WebSocket 接口](#websocket-接口)
  - [连接地址](#连接地址)
  - [认证流程](#认证流程)
  - [心跳保活](#心跳保活)
  - [接收通知](#接收通知)
- [数据模型](#数据模型)
- [枚举定义](#枚举定义)
- [错误码](#错误码)

---

## 概述

通知系统提供以下功能：
- **HTTP 接口**：获取通知列表、标记已读
- **WebSocket 推送**：实时接收新通知

### 通知类型

| 类型 | 代码 | 说明 |
|------|------|------|
| 系统通知 | `SYSTEM` | 系统级消息 |
| 预约提醒 | `RESERVE` | 就诊预约提醒 |
| 用药提醒 | `MEDICATION` | 用药时间提醒 |

---

## 通用说明

### 基础路径

```
HTTP: /api/app/base
WebSocket: /ws/app/notify
```

### 认证方式

所有接口（除登录外）需要在请求头携带 Token：

```http
satoken: <your_token>
```

### 响应格式

```json
{
  "code": 200,
  "msg": "success",
  "data": { ... }
}
```

---

## HTTP 接口

### 1. 获取未读通知

获取当前用户的所有未读通知，按类型分组返回。

**请求**

```http
GET /api/app/base/get-unread-notification
```

**响应**

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "system": [
      {
        "id": "rem_001",
        "patientId": "pat_001",
        "reminderType": "SYSTEM",
        "reminderTitle": "系统维护通知",
        "reminderContent": "系统将于今晚 22:00 进行维护",
        "scheduledTime": "2025-12-05T10:00:00",
        "sentTime": "2025-12-05T10:00:00",
        "status": "UNREAD",
        "priority": "HIGH"
      }
    ],
    "reserve": [
      {
        "id": "rem_002",
        "patientId": "pat_001",
        "appointmentId": "apt_001",
        "reminderType": "RESERVE",
        "reminderTitle": "就诊提醒",
        "reminderContent": "您明天 09:00 有眼科门诊预约",
        "scheduledTime": "2025-12-05T09:00:00",
        "sentTime": "2025-12-05T09:00:00",
        "status": "UNREAD",
        "advanceDays": 1
      }
    ],
    "medication": [
      {
        "id": "rem_003",
        "patientId": "pat_001",
        "prescriptionId": "prs_001",
        "reminderType": "MEDICATION",
        "reminderTitle": "用药提醒",
        "reminderContent": "请按时服用左氧氟沙星眼药水",
        "scheduledTime": "2025-12-05T08:00:00",
        "sentTime": "2025-12-05T08:00:00",
        "status": "UNREAD"
      }
    ]
  }
}
```

---

### 2. 获取已读通知（分页）

按类型分页获取已读通知列表。

**请求**

```http
GET /api/app/base/get-read-notification?reminderType=SYSTEM&pageNum=1&pageSize=10
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `reminderType` | string | 是 | 通知类型：`SYSTEM` / `RESERVE` / `MEDICATION` |
| `pageNum` | int | 否 | 页码，默认 1 |
| `pageSize` | int | 否 | 每页数量，默认 10 |

**响应**

```json
{
  "code": 200,
  "msg": "success",
  "data": [
    {
      "id": "rem_001",
      "reminderType": "SYSTEM",
      "reminderTitle": "系统维护通知",
      "reminderContent": "维护已完成",
      "scheduledTime": "2025-12-04T10:00:00",
      "status": "READ"
    }
  ],
  "pageNum": 1,
  "pageSize": 10,
  "total": 25,
  "pages": 3
}
```

---

### 3. 标记单条通知为已读

将指定通知标记为已读状态。

**请求**

```http
POST /api/app/base/mark-notification-as-read?reminderId=rem_001
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `reminderId` | string | 是 | 通知 ID |

**响应**

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "id": "rem_001",
    "reminderType": "SYSTEM",
    "reminderTitle": "系统维护通知",
    "status": "READ"
  }
}
```

**错误响应**

```json
{
  "code": 500,
  "msg": "通知不存在"
}
```

```json
{
  "code": 500,
  "msg": "通知不属于用户"
}
```

```json
{
  "code": 500,
  "msg": "通知不可标为已读"
}
```

---

### 4. 标记全部通知为已读

将当前用户的所有未读通知标记为已读。

**请求**

```http
POST /api/app/base/mark-all-notification-as-read
```

**响应**

```json
{
  "code": 200,
  "msg": "全部标记为已读成功"
}
```

或

```json
{
  "code": 200,
  "msg": "无未读通知"
}
```

---

## WebSocket 接口

### 连接地址

```
ws://<host>:<port>/ws/app/notify
```

### 认证流程

连接建立后，必须在 **60 秒内** 发送认证消息，否则连接将被关闭。

**1. 发送认证请求**

```json
{
  "type": "AUTH",
  "satoken": "<your_token>"
}
```

**2. 认证成功响应**

```json
{
  "type": "AUTH_OK"
}
```

**3. 认证失败响应**

```json
{
  "type": "AUTH_FAIL",
  "msg": "无效的token"
}
```

> 认证失败后连接会被服务端主动关闭

---

### 心跳保活

为保持连接活跃，客户端应定时发送心跳消息。

**发送心跳**

```json
{
  "type": "PING"
}
```

**心跳响应**

```json
{
  "type": "PONG"
}
```

**建议**：
- 心跳间隔：30 秒
- 超时断开：60 秒无活动

---

### 接收通知

服务端推送新通知时，消息格式如下：

```json
{
  "type": "NOTIFICATION",
  "data": {
    "id": "rem_004",
    "patientId": "pat_001",
    "reminderType": "RESERVE",
    "reminderTitle": "就诊提醒",
    "reminderContent": "您后天有眼科门诊预约",
    "scheduledTime": "2025-12-07T09:00:00",
    "sentTime": "2025-12-05T15:30:00",
    "status": "UNREAD",
    "appointmentId": "apt_002",
    "advanceDays": 2,
    "priority": "NORMAL"
  }
}
```

---

## 数据模型

### Reminder（通知对象）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 通知唯一标识 |
| `patientId` | string | 患者 ID |
| `medicalRecordId` | string | 病历 ID（可选） |
| `appointmentId` | string | 预约 ID（预约提醒时有值） |
| `prescriptionId` | string | 处方 ID（用药提醒时有值） |
| `reminderType` | string | 通知类型 |
| `reminderTitle` | string | 通知标题 |
| `reminderContent` | string | 通知内容 |
| `scheduledTime` | datetime | 计划发送时间 |
| `sentTime` | datetime | 实际发送时间 |
| `completedTime` | datetime | 完成时间（可选） |
| `status` | string | 通知状态 |
| `priority` | string | 优先级（可选） |
| `advanceDays` | int | 提前天数（预约提醒） |
| `repeatType` | string | 重复类型（可选） |
| `repeatCount` | int | 已重复次数（可选） |
| `maxRepeatCount` | int | 最大重复次数（可选） |
| `notes` | string | 备注（可选） |
| `createTime` | datetime | 创建时间 |
| `updateTime` | datetime | 更新时间 |

---

## 枚举定义

### ReminderType（通知类型）

| 值 | 说明 |
|------|------|
| `SYSTEM` | 系统通知 |
| `RESERVE` | 预约提醒 |
| `MEDICATION` | 用药提醒 |

### ReminderStatus（通知状态）

| 值 | 说明 |
|------|------|
| `SCHEDULED` | 计划中（未发送） |
| `UNREAD` | 未读（已发送） |
| `READ` | 已读 |

---

## 错误码

| 错误码 | 说明 |
|--------|------|
| 200 | 成功 |
| 401 | 未登录或 Token 无效 |
| 500 | 服务器内部错误 |

---

## 前端集成示例

### WebSocket 连接示例（JavaScript）

```javascript
class NotificationWebSocket {
  constructor(token) {
    this.token = token;
    this.ws = null;
    this.heartbeatTimer = null;
  }

  connect() {
    this.ws = new WebSocket('ws://localhost:8081/ws/app/notify');

    this.ws.onopen = () => {
      console.log('WebSocket 已连接');
      // 发送认证
      this.ws.send(JSON.stringify({
        type: 'AUTH',
        satoken: this.token
      }));
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case 'AUTH_OK':
          console.log('认证成功');
          this.startHeartbeat();
          break;
        case 'AUTH_FAIL':
          console.error('认证失败:', message.msg);
          break;
        case 'PONG':
          console.log('心跳响应');
          break;
        case 'NOTIFICATION':
          this.onNotification(message.data);
          break;
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket 已断开');
      this.stopHeartbeat();
    };
  }

  startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'PING' }));
      }
    }, 30000); // 30秒发送一次心跳
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  onNotification(data) {
    // 处理收到的通知
    console.log('收到新通知:', data);
    // 可以在这里更新 UI、播放提示音等
  }

  disconnect() {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
    }
  }
}

// 使用示例
const notifyWs = new NotificationWebSocket('your_satoken_here');
notifyWs.connect();
```

---

## 更新日志

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| v1.0 | 2025-12-05 | 初始版本 |
