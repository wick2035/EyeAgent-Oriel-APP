# AI 智能助手 API 文档

> 版本: v3.1.0
> 更新时间: 2026-03-24
> 作者: chengyiyang

---

## 目录

- [概述](#概述)
- [通用说明](#通用说明)
- [接口列表](#接口列表)
  - [1. 上传附件](#1-上传附件)
  - [2. 发送聊天消息（同步）](#2-发送聊天消息同步)
  - [3. 发送聊天消息（流式）](#3-发送聊天消息流式)
  - [4. 语音识别（ASR）](#4-语音识别asr)
- [数据模型](#数据模型)
  - [AttachmentRef 附件引用](#attachmentref-附件引用)
  - [PageImage PDF 页面图片](#pageimage-pdf-页面图片)
  - [AgentChatResponse 聊天响应](#agentchatresponse-聊天响应)
  - [AiChatChunk 流式事件块](#aichatChunk-流式事件块)
  - [AsrTranscribeResponse 语音识别响应](#asrtranscriberesponse-语音识别响应)
- [完整调用流程](#完整调用流程)
- [错误处理](#错误处理)

---

## 概述

AI 智能助手模块提供以下功能：

- **附件上传**：上传图片或 PDF 文件，用于多模态 AI 对话
- **同步聊天**：发送消息并等待完整 AI 回复（支持携带附件）
- **流式聊天**：发送消息并以 SSE 事件流方式接收 AI 回复（支持携带附件）
- **语音识别**：上传 WAV 音频文件，返回识别文字

---

## 通用说明

### 基础路径

```
同步接口: /api/app/agent
流式接口: /api/app/extra
```

### 认证方式

所有接口需要在请求头携带 Sa-Token：

```http
satoken: <your_token>
```

### 响应格式

```json
{
  "code": 200,
  "msg": "ok",
  "data": { ... }
}
```

---

## 接口列表

### 1. 上传附件

上传图片或 PDF 文件到 AI Agent 服务，返回附件引用数据，可直接用于聊天接口的 `attachments` 字段。

**请求**

```http
POST /api/app/agent/upload
Content-Type: multipart/form-data
```

| 参数名 | 位置 | 类型 | 必填 | 说明 |
|--------|------|------|------|------|
| `file` | Body（multipart） | File | 是 | 图片或 PDF 文件 |

**支持的文件类型**

| MIME 类型 | 大小上限 | 说明 |
|-----------|---------|------|
| `image/jpeg` | 10 MB | JPG 图片 |
| `image/png` | 10 MB | PNG 图片 |
| `image/webp` | 10 MB | WebP 图片 |
| `application/pdf` | 30 MB | PDF 文档（最多处理前 8 页） |

**响应（图片）**

```json
{
  "code": 200,
  "msg": "ok",
  "data": {
    "file_type": "image",
    "filename": "fundus.jpg",
    "minio_url": "http://minio.internal/...",
    "base64": "/9j/4AAQSkZJRgAB...",
    "mime_type": "image/jpeg",
    "page_images": null,
    "page_count": null
  }
}
```

**响应（PDF）**

```json
{
  "code": 200,
  "msg": "ok",
  "data": {
    "file_type": "pdf",
    "filename": "report.pdf",
    "minio_url": "http://minio.internal/...",
    "base64": null,
    "mime_type": null,
    "page_images": [
      {
        "base64": "/9j/4AAQSkZJRgAB...",
        "mime_type": "image/jpeg",
        "page": 1
      },
      {
        "base64": "/9j/4AAQSkZJRgAB...",
        "mime_type": "image/jpeg",
        "page": 2
      }
    ],
    "page_count": 2
  }
}
```

---

### 2. 发送聊天消息（同步）

发送消息到 AI Agent，等待完整回复。支持携带附件进行多模态对话。

**请求**

```http
POST /api/app/agent/chat
Content-Type: application/json
```

**请求体**

```json
{
  "message": "请帮我分析这张眼底图",
  "sessionId": "sess_abc123",
  "agentType": "health",
  "role": "patient",
  "conversationId": null,
  "attachments": [
    {
      "file_type": "image",
      "filename": "fundus.jpg",
      "minio_url": null,
      "base64": "/9j/4AAQSkZJRgAB...",
      "mime_type": "image/jpeg",
      "page_images": null,
      "page_count": null
    }
  ]
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `message` | string | 是 | 用户消息内容 |
| `sessionId` | string | 否 | Python 运行时会话 ID，首次对话为 null |
| `agentType` | string | 否 | Agent 类型，默认 `"health"`。可选：`health`、`report`、`compliance` |
| `role` | string | 否 | 用户角色，默认 `"patient"` |
| `conversationId` | string | 否 | 数据库会话 ID，首次对话为 null |
| `attachments` | array | 否 | 附件列表，元素为 [AttachmentRef](#attachmentref-附件引用)。直接放入上传接口的响应即可 |

> **推荐做法**：将 `/api/app/agent/upload` 的响应 `data` 原样放入 `attachments` 数组，无需任何字段映射。

**响应**

```json
{
  "code": 200,
  "msg": "ok",
  "data": {
    "response": "根据您上传的眼底图像，图像显示...",
    "session_id": "sess_abc123",
    "conversation_id": "550e8400-...",
    "is_completed": false,
    "stage": "health_consultation",
    "agent_type": "health",
    "metadata": {}
  }
}
```

---

### 3. 发送聊天消息（流式）

以 SSE（Server-Sent Events）方式发送消息并接收 AI 回复。支持携带附件。

> **注意**：有附件时，服务端会在开始推送 SSE token 之前完成附件视觉分析（约需 3~8 秒）。建议前端在"正在分析附件..."状态下等待 `start` 事件后再展示进度。

**请求**

```http
POST /api/app/extra/ai-chat-query
Content-Type: application/json
Accept: text/event-stream
```

**请求体**

```json
{
  "message": "请帮我分析这张眼底图",
  "conversationId": null,
  "sessionId": null,
  "attachments": [
    {
      "file_type": "image",
      "filename": "fundus.jpg",
      "base64": "/9j/4AAQSkZJRgAB...",
      "mime_type": "image/jpeg"
    }
  ]
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `message` | string | 是 | 用户消息内容 |
| `conversationId` | string | 否 | 数据库会话 ID，首次对话为 null |
| `sessionId` | string | 否 | Python 运行时会话 ID，首次对话为 null |
| `attachments` | array | 否 | 附件列表，元素为 [AttachmentRef](#attachmentref-附件引用) |

**SSE 事件流**

```
data: {"event":"start","session_id":"sess_abc123","conversation_id":"550e8400-..."}

data: {"event":"token","content":"根据您上传"}

data: {"event":"token","content":"的眼底图像..."}

data: {"event":"done","response":"完整回复文本","agent_type":"health","stage":"health_consultation"}
```

事件类型见 [AiChatChunk](#aichatChunk-流式事件块)。

---

### 4. 语音识别（ASR）

上传 WAV 音频文件进行语音识别，返回识别文字。适用于按住说话（Push-to-Talk）场景。

**请求**

```http
POST /api/app/agent/asr-transcribe
Content-Type: multipart/form-data
```

| 参数名 | 位置 | 类型 | 必填 | 说明 |
|--------|------|------|------|------|
| `audio` | Body（multipart） | File | 是 | WAV 格式音频文件 |

**音频要求**

| 参数 | 要求 | 说明 |
|------|------|------|
| 编码格式 | PCM | 16-bit 有符号整数，小端序 |
| 采样率 | **16000 Hz** | 必须是 16kHz |
| 声道数 | **单声道（Mono）** | 不接受立体声 |
| 封装格式 | WAV（RIFF 头 + PCM） | 标准 WAV 格式 |
| 最短时长 | **0.5 秒** | PCM 字节数 >= 16000 bytes |

**响应**

```json
{
  "code": 200,
  "msg": "ok",
  "data": {
    "text": "识别出的文字内容"
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `text` | string | 语音识别文字，已去除首尾空白 |

---

## 数据模型

### AttachmentRef 附件引用

上传接口的响应数据，同时作为聊天接口 `attachments` 数组的元素。

| 字段 | 类型 | 图片 | PDF | 说明 |
|------|------|------|-----|------|
| `file_type` | string | `"image"` | `"pdf"` | 附件类型 |
| `filename` | string | 有 | 有 | 原始文件名 |
| `minio_url` | string/null | 有 | 有 | MinIO 备份 URL，可为 null |
| `base64` | string/null | 有 | null | 图片 base64（不含 `data:...;base64,` 前缀） |
| `mime_type` | string/null | 有 | null | 图片 MIME 类型 |
| `page_images` | array/null | null | 有 | PDF 各页图片列表，元素为 [PageImage](#pageimage-pdf-页面图片) |
| `page_count` | int/null | null | 有 | PDF 实际处理的页数（最多 8 页） |

### PageImage PDF 页面图片

| 字段 | 类型 | 说明 |
|------|------|------|
| `base64` | string | JPEG 图片 base64 |
| `mime_type` | string | 固定 `"image/jpeg"` |
| `page` | int | 页码，从 1 开始 |

### AgentChatResponse 聊天响应

同步聊天接口的 `data` 字段。

| 字段 | 类型 | 说明 |
|------|------|------|
| `response` | string | AI 回复内容 |
| `session_id` | string | 运行时会话 ID |
| `conversation_id` | string | 数据库会话 ID |
| `is_completed` | boolean | 对话是否完成 |
| `stage` | string | 当前阶段 |
| `agent_type` | string | Agent 类型 |
| `metadata` | object | 元数据 |

### AiChatChunk 流式事件块

流式聊天接口的 SSE 事件数据。

| 字段 | 类型 | 说明 |
|------|------|------|
| `event` | string | 事件类型：`start`、`token`、`agent_switch`、`tool_call`、`done`、`error` |
| `content` | string | `token` 事件的文本片段 |
| `session_id` | string | 运行时会话 ID |
| `conversation_id` | string | 数据库会话 ID |
| `thread_id` | string | LangGraph thread ID |
| `response` | string | `done` 事件的完整回复 |
| `agent_type` | string | Agent 类型 |
| `stage` | string | 当前阶段 |
| `message` | string | `error` 事件的错误信息 |
| `metadata` | object | 附加元数据 |

**事件类型说明**

| 事件 | 说明 | 关键字段 |
|------|------|---------|
| `start` | 对话开始 | `session_id`、`conversation_id` |
| `token` | 文本片段 | `content` |
| `agent_switch` | Agent 切换 | `agent_type` |
| `tool_call` | 工具调用 | `metadata` |
| `done` | 对话结束 | `response`（完整回复）、`agent_type`、`stage` |
| `error` | 发生错误 | `message` |

### AsrTranscribeResponse 语音识别响应

| 字段 | 类型 | 说明 |
|------|------|------|
| `text` | string | 语音识别文字 |

---

## 完整调用流程

### 带附件的对话流程

```
① 用户选择文件（图片/PDF）
       ↓
② POST /api/app/agent/upload
   multipart/form-data: file=<binary>
       ↓
   Response.data: {file_type, filename, base64/page_images, ...}
       ↓
③ 前端将 Response.data 存入 pendingAttachments[]
   显示预览（图片缩略图 / PDF 页数）
       ↓
④ 用户输入文字并点击发送
       ↓
⑤ POST /api/app/agent/chat  或  POST /api/app/extra/ai-chat-query
   Body: {message, ..., attachments: [upload_response.data]}
       ↓
   Response: AI 回复（已融合附件分析）
```

### 语音输入对话流程

```
① 用户按住说话按钮，录制音频
       ↓
② 录音结束，生成 WAV 文件（16kHz, mono, 16-bit PCM）
       ↓
③ POST /api/app/agent/asr-transcribe
   multipart/form-data: audio=<wav_binary>
       ↓
   Response.data: {text: "识别出的文字"}
       ↓
④ 将识别文字填入聊天输入框（或自动发送）
       ↓
⑤ POST /api/app/agent/chat  或  POST /api/app/extra/ai-chat-query
   Body: {message: "识别出的文字", ...}
       ↓
   Response: AI 回复
```

---

## 错误处理

### 通用错误

| HTTP 状态码 | 说明 |
|------------|------|
| 401 | 未登录或 Token 过期 |
| 500 | 服务端内部错误 |

### 附件上传错误

| HTTP 状态码 | 说明 |
|------------|------|
| 413 | 文件超过大小限制 |
| 415 | 不支持的文件类型 |
| 422 | PDF 解析失败（文件损坏） |

### 语音识别错误码

| error_code | 说明 | 建议处理 |
|------------|------|---------|
| `NO_SPEECH_DETECTED` | 未检测到语音 | 提示用户重新录制 |
| `AUDIO_TOO_SHORT` | 音频时长 < 0.5 秒 | 提示用户延长录音 |
| `INVALID_FORMAT` | WAV 格式损坏 | 检查音频采集代码 |
| `ASR_API_ERROR` | 上游 ASR 服务异常 | 等待后重试 |
| `INTERNAL_ERROR` | 服务端内部异常 | 联系运维 |
