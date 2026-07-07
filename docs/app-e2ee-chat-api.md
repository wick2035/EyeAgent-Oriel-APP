# App 端 E2EE 加密聊天 — 前端设计与 API 文档

> 版本：v1.2 | 日期：2026-04-13 | 后端分支：feat/deploy-update

## v1.2 变更摘要（重要）

线上排查发现客户端本地 `keyVersion` 计数器长期与服务端脱钩，大量消息写入了服务端不存在的版本号（如 v17/v18），导致接收方永远无法解密。本次升级新增服务端强校验和协议字段：

1. **消息体新增必填字段 `receiverKeyVersion`** — 接收方 ECDH 解密需要确定性匹配本地私钥版本
2. **`sendMessage` 强校验** — `senderKeyVersion` 必须对应一条 ACTIVE 的发送者公钥记录，否则返回 `40903`
3. **`createSession` 前置校验** — 双方都必须已上传 ACTIVE 公钥，否则返回 `40904`
4. **`GET /keys/{userType}/{userId}` 支持 `?keyVersion=N`** — 可查 REVOKED 历史版本，用于解密历史消息
5. **新增诊断接口 `GET /keys/self/diag`** — 返回当前用户服务端所有密钥版本快照，便于启动时对账本地计数器
6. **`CHAT_MESSAGE` WebSocket payload 同步新增 `receiverKeyVersion` 字段**

**客户端必须升级行为：**

- 启动时调用 `GET /keys/self/diag`，若本地 `keyVersion` 与服务端最大 ACTIVE 版本不一致 → 强制重新生成密钥并 `POST /keys/rotate`
- 私钥按 `keyVersion` 持久化，**轮换时绝不可删除旧私钥**（否则旧消息永远解不开）
- 发送消息前必须获取对方当前 ACTIVE `keyVersion` 填入 `receiverKeyVersion`
- 遇到 `40903` → 重新拉取双方最新 `keyVersion` 重试；遇到 `40904` → 提示"加密聊天未完全开启"

## 目录

1. [概述与架构](#1-概述与架构)
2. [加密方案（前端实现要点）](#2-加密方案前端实现要点)
3. [认证方式](#3-认证方式)
4. [通用响应格式](#4-通用响应格式)
5. [REST API — 密钥管理](#5-rest-api--密钥管理)
6. [REST API — 会话管理](#6-rest-api--会话管理)
7. [REST API — 消息](#7-rest-api--消息)
8. [REST API — 文件上传](#8-rest-api--文件上传)
9. [WebSocket 实时通信](#9-websocket-实时通信)
10. [前端客户端设计建议](#10-前端客户端设计建议)
11. [错误码参考](#11-错误码参考)
12. [枚举值参考](#12-枚举值参考)

---

## 1. 概述与架构

### 功能概要

端到端加密（E2EE）医患一对一聊天。服务端只存储公钥和密文，**无法解密消息内容**。加解密全部在客户端完成。

### 通信架构

```
┌─────────────┐    REST API (HTTPS)    ┌─────────────┐    REST API (HTTPS)    ┌─────────────┐
│             │ ◄─────────────────────► │             │ ◄─────────────────────► │             │
│   患者 App   │                        │   后端服务    │                        │   医生 App   │
│             │ ◄─────────────────────► │  (密文转发)  │ ◄─────────────────────► │             │
└─────────────┘   WebSocket (实时推送)   └─────────────┘   WebSocket (实时推送)   └─────────────┘
```

- **REST API**：发送消息、拉取历史、管理会话、密钥操作
- **WebSocket**：实时接收新消息、正在输入、已读回执、密钥更新通知

### 数据流

```
发送消息：明文 → 客户端AES-GCM加密 → REST API上传密文 → 服务端存储密文 → WebSocket推送密文 → 接收端AES-GCM解密 → 明文
拉取历史：REST API获取密文列表 → 客户端逐条AES-GCM解密 → 明文
```

---

## 2. 加密方案（前端实现要点）

### 2.1 密钥生成

用户首次使用聊天时，客户端生成 ECDH 密钥对：

```
算法: ECDH
曲线: P-256 (secp256r1)
格式: 公钥导出为 Base64 编码的 SubjectPublicKeyInfo (SPKI)
```

**Web 端示例（Web Crypto API）：**

```javascript
// 生成密钥对
const keyPair = await crypto.subtle.generateKey(
  { name: 'ECDH', namedCurve: 'P-256' },
  true,  // 可导出
  ['deriveKey', 'deriveBits']
);

// 导出公钥为 Base64
const publicKeyBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey);
const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKeyBuffer)));

// 私钥存储到本地（IndexedDB / Android KeyStore）
// ⚠️ 私钥永远不上传服务端
```

**Android 端示例（KeyStore）：**

```kotlin
val keyPairGenerator = KeyPairGenerator.getInstance("EC")
keyPairGenerator.initialize(ECGenParameterSpec("secp256r1"))
val keyPair = keyPairGenerator.generateKeyPair()
val publicKeyBase64 = Base64.encodeToString(keyPair.public.encoded, Base64.NO_WRAP)
// 私钥存入 Android KeyStore
```

### 2.2 密钥协商（ECDH）

发起聊天前，通过 API 获取对方公钥，然后在本地完成密钥协商：

```javascript
// 1. 从服务端获取对方公钥
const peerKey = await fetchPublicKey(peerUserType, peerUserId);

// 2. 导入对方公钥
const peerPublicKey = await crypto.subtle.importKey(
  'spki',
  base64ToBuffer(peerKey.publicKey),
  { name: 'ECDH', namedCurve: 'P-256' },
  false, []
);

// 3. ECDH 协商共享密钥
const sharedBits = await crypto.subtle.deriveBits(
  { name: 'ECDH', public: peerPublicKey },
  myPrivateKey,
  256
);

// 4. HKDF 派生会话密钥（salt = sessionId）
const sessionKey = await crypto.subtle.deriveKey(
  {
    name: 'HKDF',
    hash: 'SHA-256',
    salt: new TextEncoder().encode(sessionId),
    info: new TextEncoder().encode('chat-session')
  },
  await crypto.subtle.importKey('raw', sharedBits, 'HKDF', false, ['deriveKey']),
  { name: 'AES-GCM', length: 256 },
  false,
  ['encrypt', 'decrypt']
);
```

**关键点：**
- 双方用各自私钥 + 对方公钥进行 ECDH，得到相同的 `sharedBits`
- `sessionId` 作为 HKDF 的 salt，确保不同会话派生不同密钥
- `sessionKey` 缓存在内存中，避免每次发消息重新计算

### 2.3 消息加密

```javascript
// 加密
async function encryptMessage(sessionKey, plaintext) {
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 12字节随机IV
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    sessionKey,
    encoded
  );
  return {
    encryptedContent: bufferToBase64(ciphertext), // 含 AuthTag
    iv: bufferToBase64(iv)
  };
}

// 解密
async function decryptMessage(sessionKey, encryptedContent, iv) {
  const ciphertext = base64ToBuffer(encryptedContent);
  const ivBytes = base64ToBuffer(iv);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBytes },
    sessionKey,
    ciphertext
  );
  return new TextDecoder().decode(decrypted);
}
```

### 2.4 密钥托管（可选但推荐）

上传公钥后，客户端应将私钥的加密副本托管到服务端，用于审计场景下的消息恢复：

```javascript
// 1. 获取医院托管方公钥（可内置或从配置获取）
const escrowPublicKey = await getEscrowPublicKey();

// 2. 用 RSA-OAEP 加密私钥
const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', myPrivateKey);
const encryptedPrivateKey = await crypto.subtle.encrypt(
  { name: 'RSA-OAEP' },
  escrowPublicKey,
  privateKeyBuffer
);

// 3. 上传到服务端
await uploadKeyEscrow({
  encryptedPrivateKey: bufferToBase64(encryptedPrivateKey),
  escrowPublicKeyId: 'hospital-escrow-key-001',
  keyVersion: 1
});
```

### 2.5 密钥轮换

收到 `CHAT_KEY_UPDATED` WebSocket 通知后，需要重新获取对方新公钥并重新协商密钥：

```javascript
// 收到 CHAT_KEY_UPDATED
ws.onmessage = (msg) => {
  const data = JSON.parse(msg.data);
  if (data.type === 'CHAT_KEY_UPDATED') {
    // 清除该用户的缓存 sessionKey
    sessionKeyCache.delete(data.userId);
    // 下次发消息时会自动重新获取公钥并协商
  }
};
```

---

## 3. 认证方式

所有 REST API 和 WebSocket 连接都需要 Sa-Token 认证。

**请求头：**
```
satoken: <登录返回的token>
```

**登录接口（参考）：**
- 患者：`POST /api/app/base/login` → `{ phone, password }`
- 医生：`POST /doctor/login` → `{ phoneNumber, password }`

---

## 4. 通用响应格式

```json
{
  "code": 200,
  "msg": "操作描述",
  "data": { ... }
}
```

| code | 含义 |
|------|------|
| 200 | 成功 |
| 400 | 参数校验失败 |
| 401 | 未登录 |
| 403 | 权限不足 |
| 40xxx | 业务错误（详见错误码表） |
| 500 | 服务器内部错误 |

---

## 5. REST API — 密钥管理

### 5.1 上传公钥

用户首次使用聊天时调用，上传 ECDH 公钥。

```
POST /api/app/chat/keys/upload
```

**请求体：**
```json
{
  "publicKey": "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE..."  // Base64 编码的 ECDH P-256 公钥 (SPKI 格式)
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| publicKey | string | 是 | Base64 编码的 ECDH 公钥 |

**成功响应：**
```json
{
  "code": 200,
  "msg": "公钥上传成功",
  "data": {
    "userType": "PATIENT",
    "userId": "8edf8a2f...",
    "publicKey": "MFkwEwYHKoZIzj0...",
    "keyVersion": 1
  }
}
```

**错误场景：**
| code | msg |
|------|-----|
| 400 | 参数校验失败：公钥不能为空 |
| 40902 | 当前用户已存在有效公钥，请使用轮换接口 |

---

### 5.2 获取对方公钥

发起聊天前获取对方公钥，用于 ECDH 密钥协商。

```
GET /api/app/chat/keys/{userType}/{userId}[?keyVersion=N]
```

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| userType | string | `DOCTOR` 或 `PATIENT` |
| userId | string | 对方用户 ID |

**查询参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| keyVersion | integer | 否 | 不传返回当前 ACTIVE 版本；指定时可查 REVOKED 历史版本，用于解密历史消息 |

**成功响应：**
```json
{
  "code": 200,
  "msg": "查询成功",
  "data": {
    "userType": "DOCTOR",
    "userId": "d45a035d...",
    "publicKey": "MFkwEwYHKoZIzj0...",
    "keyVersion": 1,
    "status": "REVOKED"
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| status | string | `ACTIVE` 或 `REVOKED`。按 keyVersion 查历史版本时用于识别公钥是否仍生效；仅出现在 v1.2+ |

**错误场景：**
| code | msg |
|------|-----|
| 40401 | 用户 [DOCTOR:xxx] 尚未上传公钥 / 指定版本不存在 |

> **前端处理建议：** 收到 40401 时，若是查询当前版本则提示"对方尚未开启加密聊天"并禁用发送按钮；若是按历史版本查则提示"此消息已无法解密"。

---

### 5.3 上传密钥托管

上传用托管方公钥加密后的私钥副本，用于审计场景。

```
POST /api/app/chat/keys/escrow
```

**请求体：**
```json
{
  "encryptedPrivateKey": "RSA-OAEP加密后的私钥Base64...",
  "escrowPublicKeyId": "hospital-escrow-key-001",
  "keyVersion": 1
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| encryptedPrivateKey | string | 是 | RSA-OAEP 加密后的 ECDH 私钥（Base64） |
| escrowPublicKeyId | string | 是 | 托管方公钥标识 |
| keyVersion | integer | 是 | 对应的公钥版本号（必须已上传该版本公钥） |

**成功响应：**
```json
{
  "code": 200,
  "msg": "密钥托管成功",
  "data": null
}
```

**错误场景：**
| code | msg |
|------|-----|
| 40401 | 用户 [PATIENT:xxx] 尚未上传公钥（密钥版本不存在） |

---

### 5.3.1 诊断当前用户的所有密钥版本（v1.2+）

客户端启动时用于对账本地 keyVersion 计数器；本地最大 ACTIVE 版本与服务端不一致时必须重新 `rotate`。

```
GET /api/app/chat/keys/self/diag
```

**成功响应：**
```json
{
  "code": 200,
  "msg": "查询成功",
  "data": {
    "userType": "DOCTOR",
    "userId": "d45a035d...",
    "keys": [
      {"keyVersion": 1, "status": "REVOKED", "createTime": "2026-04-13T00:08:30"},
      {"keyVersion": 2, "status": "REVOKED", "createTime": "2026-04-13T00:09:25"},
      {"keyVersion": 3, "status": "ACTIVE",  "createTime": "2026-04-13T10:03:08"}
    ]
  }
}
```

---

### 5.4 密钥轮换

生成新密钥对后调用，旧密钥自动吊销。

```
POST /api/app/chat/keys/rotate
```

**请求体：**
```json
{
  "publicKey": "新公钥Base64..."
}
```

**成功响应：**
```json
{
  "code": 200,
  "msg": "密钥轮换成功",
  "data": {
    "userType": "PATIENT",
    "userId": "8edf8a2f...",
    "publicKey": "新公钥Base64...",
    "keyVersion": 2
  }
}
```

> **副作用：** 服务端会通过 WebSocket 向所有活跃会话的对方发送 `CHAT_KEY_UPDATED` 通知。

---

## 6. REST API — 会话管理

### 6.1 创建会话

发起与医生/患者的一对一聊天。医生只能和患者聊，患者只能和医生聊。

```
POST /api/app/chat/sessions
```

**请求体：**
```json
{
  "targetUserId": "d45a035d...",
  "targetUserType": "DOCTOR"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| targetUserId | string | 是 | 对方用户 ID |
| targetUserType | string | 是 | 对方类型：`DOCTOR` 或 `PATIENT` |

**成功响应：**
```json
{
  "code": 200,
  "msg": "会话创建成功",
  "data": {
    "id": "c16e2e6a...",
    "doctorId": "d45a035d...",
    "doctorName": "方清茂",
    "patientId": "8edf8a2f...",
    "patientName": "王建国",
    "status": "ACTIVE",
    "lastMessageAt": null,
    "unreadCount": 0,
    "createTime": "2026-03-15T10:15:26"
  }
}
```

**错误场景：**
| code | msg |
|------|-----|
| 40001 | 不允许相同用户类型之间创建会话 |
| 40403 | 目标用户不存在 |
| 40901 | 会话已存在 |
| 40904 | 双方必须先上传公钥才能创建会话（当前用户或对方尚未调用过 `/keys/upload`） |

> **说明：** 如果之前关闭的会话再次创建，系统会自动重新激活原有会话（不会新建）。

---

### 6.2 获取会话列表

获取当前用户参与的所有聊天会话。

```
GET /api/app/chat/sessions
```

**成功响应：**
```json
{
  "code": 200,
  "msg": "查询成功",
  "data": [
    {
      "id": "c16e2e6a...",
      "doctorId": "d45a035d...",
      "doctorName": "方清茂",
      "patientId": "8edf8a2f...",
      "patientName": "王建国",
      "status": "ACTIVE",
      "lastMessageAt": "2026-03-15T10:16:29",
      "unreadCount": 3,
      "createTime": "2026-03-15T10:15:27"
    }
  ]
}
```

> **排序：** 按 `lastMessageAt` 降序（最新消息的会话在前）。

---

### 6.3 获取会话详情

```
GET /api/app/chat/sessions/{sessionId}
```

**响应格式同 6.2 中的单个会话对象。**

**错误场景：**
| code | msg |
|------|-----|
| 40402 | 会话不存在 |
| 40302 | 无权访问此会话 |

---

### 6.4 关闭会话

```
PUT /api/app/chat/sessions/{sessionId}/close
```

**成功响应：**
```json
{
  "code": 200,
  "msg": "会话已关闭",
  "data": null
}
```

> **说明：** 关闭后不可发消息和标记已读，但可以查看历史消息。重复关闭幂等返回 200。

---

## 7. REST API — 消息

### 7.1 发送加密消息

```
POST /api/app/chat/sessions/{sessionId}/messages
```

**请求体：**
```json
{
  "encryptedContent": "SGVsbG8gRG9jdG9yIQ==",
  "iv": "dGVzdGl2MTIz",
  "senderKeyVersion": 2,
  "receiverKeyVersion": 3,
  "messageType": "TEXT",
  "fileUrl": null
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| encryptedContent | string | 是 | AES-256-GCM 加密后的内容（Base64），含 AuthTag |
| iv | string | 是 | 12 字节随机初始化向量（Base64） |
| senderKeyVersion | integer | 是 | 发送方当前使用的公钥版本；必须为一条服务端 ACTIVE 记录 |
| receiverKeyVersion | integer | 是 | ECDH 加密时使用的**对方公钥版本**；必须为对方服务端已存在的记录（ACTIVE 或 REVOKED） |
| messageType | string | 否 | `TEXT`(默认) / `IMAGE` / `FILE` |
| fileUrl | string | 否 | 图片/文件的 MinIO URL（通过上传接口获取） |

**成功响应：**
```json
{
  "code": 200,
  "msg": "发送成功",
  "data": {
    "messageId": "06f23a63...",
    "createdAt": "2026-03-15T10:16:10"
  }
}
```

**错误场景：**
| code | msg |
|------|-----|
| 400 | 参数校验失败（encryptedContent/iv/receiverKeyVersion 为空等） |
| 40301 | 会话已关闭 |
| 40302 | 无权访问此会话 |
| 40402 | 会话不存在 |
| 40903 | 密钥版本与服务端不一致（senderKeyVersion 非 ACTIVE，或 receiverKeyVersion 不存在）。客户端需调用 `GET /keys/self/diag` 和 `GET /keys/{peer}` 重新同步版本 |

> **副作用：** 服务端通过 WebSocket 将密文推送给接收方（详见 9.2）。

### 发送图片/文件消息的流程

```
1. POST /api/app/chat/upload        → 上传文件获取 fileUrl
2. 客户端加密文件名/描述             → encryptedContent
3. POST /messages                    → 发送消息，携带 fileUrl + encryptedContent
```

---

### 7.2 分页查询历史消息

```
GET /api/app/chat/sessions/{sessionId}/messages?page=1&size=20
```

**查询参数：**
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | int | 1 | 页码（从 1 开始） |
| size | int | 20 | 每页条数 |

**成功响应：**
```json
{
  "code": 200,
  "msg": "查询成功",
  "data": {
    "records": [
      {
        "id": "de03af4e...",
        "sessionId": "c16e2e6a...",
        "senderType": "DOCTOR",
        "senderId": "d45a035d...",
        "messageType": "TEXT",
        "encryptedContent": "ZG9jdG9yTXNn3",
        "iv": "ZGl23",
        "senderKeyVersion": 1,
        "fileUrl": null,
        "readStatus": 0,
        "createTime": "2026-03-15T10:16:29"
      },
      {
        "id": "e14c2f11...",
        "sessionId": "c16e2e6a...",
        "senderType": "PATIENT",
        "senderId": "8edf8a2f...",
        "messageType": "IMAGE",
        "encryptedContent": "ZW5jcnlwdGVkRmlsZU5hbWU=",
        "iv": "dGVzdGl2NDU2",
        "senderKeyVersion": 2,
        "fileUrl": "https://minio.example.com/chat/image.jpg",
        "readStatus": 1,
        "createTime": "2026-03-15T10:16:18"
      }
    ],
    "total": 5,
    "pages": 3,
    "current": 1,
    "size": 2
  }
}
```

**排序：** 按 `createTime` **降序**（最新消息在前）。

> **前端处理：** 拉取后需在客户端逐条调用 `decryptMessage(sessionKey, encryptedContent, iv)` 解密。

---

### 7.3 标记已读

将会话中所有对方发送的未读消息标记为已读。

```
POST /api/app/chat/sessions/{sessionId}/messages/read
```

**请求体：** 无（空 body）

**成功响应：**
```json
{
  "code": 200,
  "msg": "标记已读成功",
  "data": null
}
```

> **副作用：** 通过 WebSocket 向对方推送 `CHAT_READ_RECEIPT`（详见 9.4）。
>
> **注意：** 仅对 `ACTIVE` 会话有效，`CLOSED` 会话返回 40301。

---

## 8. REST API — 文件上传

### 8.1 上传聊天文件

上传图片或文件到 MinIO，获取 URL 后用于发送文件消息。

```
POST /api/app/chat/upload
Content-Type: multipart/form-data
```

**表单参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file | File | 是 | 上传的文件（图片/文档等） |

**成功响应：**
```json
{
  "code": 200,
  "msg": "上传成功",
  "data": "http://minio.example.com/image-bucket/images/2026-03-15T10-25-13_image.png"
}
```

> `data` 直接是文件的公开访问 URL 字符串。

**文件限制：**
- 单文件最大 5MB（Spring 配置 `spring.servlet.multipart.max-file-size`）
- 支持格式：jpg, jpeg, png, gif, bmp, webp

---

## 9. WebSocket 实时通信

### 9.1 连接与认证

**端点：**
```
ws://{host}:{port}/ws/app/notify
```

**认证流程：**

```
客户端                              服务端
  │                                   │
  ├── 建立 WebSocket 连接 ───────────►│
  │                                   │
  ├── {"type":"AUTH","satoken":"xxx"} ►│
  │                                   │  验证 token
  │◄── {"type":"AUTH_OK"} ────────────┤  成功
  │  或                               │
  │◄── {"type":"AUTH_FAIL","msg":"..."} 失败后断开
```

**心跳保活：**

```json
// 客户端每 30 秒发送
{"type": "PING"}

// 服务端回复
{"type": "PONG"}
```

> 60 秒无活动（无 PING 也无其他消息）连接会被服务端主动断开。

---

### 9.2 接收新消息 — CHAT_MESSAGE

当对方通过 REST API 发送消息时，服务端自动推送：

```json
{
  "type": "CHAT_MESSAGE",
  "messageId": "cab570e8...",
  "sessionId": "c16e2e6a...",
  "senderType": "PATIENT",
  "senderId": "8edf8a2f...",
  "messageType": "TEXT",
  "encryptedContent": "d3NfdGVzdF9tc2c=",
  "iv": "d3NfaXY=",
  "senderKeyVersion": 2,
  "receiverKeyVersion": 3,
  "fileUrl": null,
  "createdAt": "2026-03-15T10:20:35"
}
```

**前端处理：**
1. 用 `sessionKey` 解密 `encryptedContent`
2. 根据 `messageType` 渲染（TEXT / IMAGE / FILE）
3. 如果 `senderKeyVersion` 与缓存的对方密钥版本不一致，重新获取公钥并协商

---

### 9.3 正在输入 — CHAT_TYPING

**发送（客户端 → 服务端 → 对方）：**

```json
// 开始输入
{"type": "CHAT_TYPING", "sessionId": "c16e2e6a...", "isTyping": true}

// 停止输入（3秒无操作后发送）
{"type": "CHAT_TYPING", "sessionId": "c16e2e6a...", "isTyping": false}
```

**接收（对方收到）：**

```json
{
  "type": "CHAT_TYPING",
  "sessionId": "c16e2e6a...",
  "userId": "8edf8a2f...",
  "isTyping": true
}
```

**前端实现建议：**
- 用户开始输入时发送 `isTyping: true`
- 用户停止输入 3 秒后发送 `isTyping: false`
- 使用防抖，避免每次按键都发送
- 显示"对方正在输入..."提示，收到 `isTyping: false` 或超过 5 秒未收到更新则隐藏

---

### 9.4 已读回执 — CHAT_READ_RECEIPT

有两个触发通道（互补）：

**通道 A — REST API 触发（推荐）：** 调用 `POST /messages/read` 后，服务端自动推送

**通道 B — WebSocket 直接发送：** 适用于需要即时 UI 反馈的场景

```json
// 客户端通过 WebSocket 发送
{"type": "CHAT_READ_RECEIPT", "sessionId": "c16e2e6a..."}
```

**接收（对方收到）：**

```json
{
  "type": "CHAT_READ_RECEIPT",
  "sessionId": "c16e2e6a...",
  "readBy": "d45a035d..."
}
```

**区别：**
| 通道 | 是否更新数据库 | WebSocket 推送 | 适用场景 |
|------|---------------|---------------|---------|
| REST API (`POST /messages/read`) | 是 | 是 | 主要使用，保证持久化 |
| WebSocket 直接发送 | 否 | 是 | 即时 UI 反馈补充 |

> **建议：** 进入聊天页面时调用 REST API 标记已读（持久化 + 通知对方）。

---

### 9.5 密钥更新通知 — CHAT_KEY_UPDATED

当对方执行密钥轮换时自动推送：

```json
{
  "type": "CHAT_KEY_UPDATED",
  "userId": "8edf8a2f...",
  "newKeyVersion": 3
}
```

**前端处理：**
1. 清除该用户的缓存 `sessionKey`
2. 下次发消息前重新调用 `GET /keys/{userType}/{userId}` 获取新公钥
3. 重新 ECDH 协商 → 派生新 `sessionKey`

---

### 9.6 WebSocket 消息类型汇总

| type | 方向 | 说明 |
|------|------|------|
| `AUTH` | 客户端→服务端 | 认证请求 |
| `AUTH_OK` | 服务端→客户端 | 认证成功 |
| `AUTH_FAIL` | 服务端→客户端 | 认证失败 |
| `PING` | 客户端→服务端 | 心跳请求 |
| `PONG` | 服务端→客户端 | 心跳响应 |
| `CHAT_MESSAGE` | 服务端→客户端 | 新加密消息推送 |
| `CHAT_TYPING` | 双向转发 | 正在输入状态 |
| `CHAT_READ_RECEIPT` | 双向转发 | 已读回执 |
| `CHAT_KEY_UPDATED` | 服务端→客户端 | 对方密钥更新通知 |

---

## 10. 前端客户端设计建议

### 10.1 本地存储

| 数据 | 存储位置 | 说明 |
|------|---------|------|
| ECDH 私钥 | Android KeyStore / IndexedDB | 最敏感数据，不可明文存储 |
| 缓存的 sessionKey | 内存 | 按 sessionId 缓存，退出清除 |
| 对方公钥 + keyVersion | 内存或本地缓存 | 收到 KEY_UPDATED 时失效 |
| 解密后的消息 | 本地 DB（可选） | 避免每次打开都重新解密 |

### 10.2 首次使用流程

```
用户首次进入聊天模块
    │
    ▼
客户端生成 ECDH 密钥对
    │
    ├── 私钥 → 本地安全存储
    ├── 公钥 → POST /keys/upload
    └── 加密私钥 → POST /keys/escrow（可选）
    │
    ▼
用户可以开始聊天
```

### 10.3 发送消息流程

```
用户输入消息 → 点击发送
    │
    ▼
检查 sessionKey 缓存
    │
    ├── 有缓存 → 直接使用
    └── 无缓存 → GET /keys/{userType}/{userId}
                → ECDH 协商
                → HKDF 派生 sessionKey
                → 缓存
    │
    ▼
AES-256-GCM 加密（sessionKey + 随机 IV）
    │
    ▼
POST /sessions/{id}/messages
    │
    ▼
UI 显示发送成功（使用本地明文）
```

### 10.4 接收消息流程

```
WebSocket 收到 CHAT_MESSAGE
    │
    ▼
检查 sessionKey 缓存
    │
    ├── 有缓存 → 直接解密
    └── 无缓存 → GET /keys → ECDH → HKDF → 缓存
    │
    ▼
AES-256-GCM 解密
    │
    ├── 成功 → 显示明文
    └── 失败 → 显示"消息无法解密"占位符
```

### 10.5 进入聊天页面流程

```
打开某个会话
    │
    ├── GET /sessions/{id}/messages?page=1&size=20  拉取最新消息
    ├── 逐条解密并渲染
    ├── POST /sessions/{id}/messages/read            标记已读
    └── 建立/复用 WebSocket 连接监听实时消息
```

### 10.6 离线消息处理

无需特殊处理。离线期间的消息已持久化在服务端，用户上线后通过 `GET /messages` 拉取即可。

---

## 11. 错误码参考

| 错误码 | 含义 | 处理建议 |
|--------|------|---------|
| 400 | 参数校验失败 | 检查请求参数 |
| 401 | 未登录 | 跳转登录页 |
| 403 | 权限不足 | 提示无权限 |
| 40001 | 不允许相同用户类型创建会话 | 检查 targetUserType |
| 40301 | 会话已关闭 | 提示会话已结束，禁用输入 |
| 40302 | 无权访问此会话 | 不应出现，检查 sessionId |
| 40401 | 用户尚未上传公钥 / 指定版本不存在 | 提示"对方尚未开启加密聊天"或"历史消息无法解密" |
| 40402 | 会话不存在 | 检查 sessionId |
| 40403 | 目标用户不存在 | 检查 targetUserId |
| 40901 | 会话已存在 | 直接跳转到已有会话 |
| 40902 | 已存在有效公钥 | 使用轮换接口 |
| 40903 | 密钥版本与服务端不一致 | 调用 `/keys/self/diag` 对账本地 keyVersion，或重新 `rotate` |
| 40904 | 双方必须先上传公钥才能创建会话 | 提示"加密聊天未完全开启"，若本方未上传先调用 `/keys/upload` |

---

## 12. 枚举值参考

### ChatUserType — 用户类型

| 值 | 说明 |
|----|------|
| `DOCTOR` | 医生 |
| `PATIENT` | 患者 |

### ChatMessageType — 消息类型

| 值 | 说明 |
|----|------|
| `TEXT` | 文本消息（默认） |
| `IMAGE` | 图片消息 |
| `FILE` | 文件消息 |

### ChatSessionStatus — 会话状态

| 值 | 说明 |
|----|------|
| `ACTIVE` | 进行中，可收发消息 |
| `CLOSED` | 已关闭，仅可查看历史 |

### readStatus — 已读状态

| 值 | 说明 |
|----|------|
| `0` | 未读 |
| `1` | 已读 |
