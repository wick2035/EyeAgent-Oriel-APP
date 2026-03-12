# App 端视频问诊 API 文档（患者端）

> **版本**: v1.1
> **更新日期**: 2026-03-12
> **控制器**: `AppVideoController`
> **基础路径**: `/api/app/video`
> **认证方式**: Sa-Token（所有接口均需登录）

---

## 目录

1. [概述](#1-概述)
2. [通用说明](#2-通用说明)
3. [接口列表](#3-接口列表)
   - [3.1 预约视频问诊](#31-预约视频问诊)
   - [3.2 获取我的会议列表](#32-获取我的会议列表)
   - [3.3 获取会议详情](#33-获取会议详情)
   - [3.4 获取会议加入信息](#34-获取会议加入信息)
   - [3.5 取消会议](#35-取消会议)
4. [数据模型](#4-数据模型)
5. [会议状态说明](#5-会议状态说明)
6. [会议分类说明](#6-会议分类说明)
7. [错误码](#7-错误码)
8. [cURL 示例](#8-curl-示例)
9. [版本历史](#9-版本历史)

---

## 1. 概述

本模块为 **患者端** 提供视频问诊相关功能，包括预约视频问诊、查询会议列表与详情、获取加入会议的凭证以及取消会议。视频会议底层基于 EA-Video 服务与 Jitsi 实现。

---

## 2. 通用说明

### 2.1 认证

所有接口均使用 `@SaCheckLogin` 注解保护，请求时需在请求头中携带 Sa-Token：

```
Header: satoken: <token_value>
```

未登录时返回：

```json
{
  "code": 401,
  "msg": "未登录",
  "data": null
}
```

### 2.2 响应格式

所有接口统一使用 `SaResult` 封装响应：

| 字段   | 类型     | 说明                           |
|--------|----------|--------------------------------|
| `code` | Integer  | 状态码，`200` 表示成功          |
| `msg`  | String   | 提示信息                        |
| `data` | Object   | 响应数据，具体结构见各接口说明   |

### 2.3 时间格式

所有时间字段采用 ISO 8601 格式：`yyyy-MM-ddTHH:mm:ss`

示例：`"2026-03-15T14:30:00"`

---

## 3. 接口列表

### 3.1 预约视频问诊

患者向指定医生发起视频问诊预约。

**基本信息**

| 项目     | 值                        |
|----------|---------------------------|
| URL      | `/api/app/video/reserve`  |
| Method   | `POST`                    |
| 认证     | 需要登录                   |
| Content-Type | `application/json`    |

**请求参数（Body）**

| 参数名        | 类型           | 必填 | 校验规则                | 说明             |
|---------------|----------------|------|------------------------|------------------|
| `doctorId`    | String         | 是   | `@NotBlank` 不能为空    | 目标医生的用户ID  |
| `scheduledAt` | LocalDateTime  | 是   | `@NotNull` 不能为空     | 预约时间          |
| `classify`    | String         | 否   | 见[会议分类说明](#6-会议分类说明) | 会议分类，不传默认 `video` |
| `notes`       | String         | 否   | 无                     | 患者备注信息      |

**请求示例**

```json
{
  "doctorId": "doctor-uuid-001",
  "scheduledAt": "2026-03-15T14:30:00",
  "classify": "video_consultation",
  "notes": "近期视力下降，希望进行远程复查"
}
```

**成功响应**

```json
{
  "code": 200,
  "msg": "预约成功",
  "data": {
    "id": "meeting-uuid-001",
    "agendaId": "agenda-uuid-001",
    "doctorId": "doctor-uuid-001",
    "patientId": "patient-uuid-001",
    "roomName": "room-abc123",
    "classify": "video_consultation",
    "status": "SCHEDULED",
    "scheduledAt": "2026-03-15T14:30:00",
    "startedAt": null,
    "endedAt": null,
    "durationMinutes": null,
    "maxDurationMinutes": 30,
    "notes": "近期视力下降，希望进行远程复查",
    "cancelReason": null,
    "createTime": "2026-03-12T10:00:00"
  }
}
```

**业务逻辑**

1. 从 Sa-Token 获取当前登录患者 ID
2. 校验预约时间是否合法（不能是过去的时间）
3. 校验目标医生是否可用
4. 调用 EA-Video 服务创建会议
5. 返回会议详情

**可能的错误**

| 错误场景         | 错误信息               |
|-----------------|------------------------|
| 预约时间已过去    | 预约时间不能早于当前时间  |
| 医生不存在/不可用 | 该医生当前不可预约       |
| 参数校验失败     | 医生ID不能为空 / 预约时间不能为空 |

---

### 3.2 获取我的会议列表

查询当前患者的所有视频问诊记录。

**基本信息**

| 项目     | 值                          |
|----------|-----------------------------|
| URL      | `/api/app/video/meetings`   |
| Method   | `GET`                       |
| 认证     | 需要登录                     |

**请求参数**

无

**成功响应**

```json
{
  "code": 200,
  "msg": "查询成功",
  "data": [
    {
      "id": "meeting-uuid-001",
      "meetingTitle": "视频就诊",
      "doctorId": "doctor-uuid-001",
      "doctorName": "张三",
      "doctorTitle": "主任医师",
      "patientId": "patient-uuid-001",
      "patientName": "李四",
      "hospitalName": "北京协和医院",
      "departmentName": "眼科",
      "classify": "video_consultation",
      "status": "SCHEDULED",
      "scheduledAt": "2026-03-15T14:30:00",
      "startedAt": null,
      "maxDurationMinutes": 30,
      "notes": "近期视力下降，希望进行远程复查"
    },
    {
      "id": "meeting-uuid-002",
      "meetingTitle": "视频复诊",
      "doctorId": "doctor-uuid-002",
      "doctorName": "王五",
      "doctorTitle": "副主任医师",
      "patientId": "patient-uuid-001",
      "patientName": "李四",
      "hospitalName": "北京同仁医院",
      "departmentName": "眼底病科",
      "classify": "video_follow_up",
      "status": "COMPLETED",
      "scheduledAt": "2026-03-08T10:00:00",
      "startedAt": "2026-03-08T10:02:00",
      "maxDurationMinutes": 30,
      "notes": "术后复查"
    }
  ]
}
```

**响应字段说明（列表项）**

| 字段名              | 类型           | 说明                                         |
|---------------------|----------------|----------------------------------------------|
| `id`                | String         | 会议唯一标识                                  |
| `meetingTitle`      | String         | 会议名称（如"视频就诊"、"视频复诊"）            |
| `doctorId`          | String         | 医生ID                                       |
| `doctorName`        | String         | 医生姓名                                     |
| `doctorTitle`       | String         | 医生职称（如"主任医师"）                       |
| `patientId`         | String         | 患者ID                                       |
| `patientName`       | String         | 患者姓名                                     |
| `hospitalName`      | String         | 医院名称                                     |
| `departmentName`    | String         | 科室名称                                     |
| `classify`          | String         | 会议分类代码，见[会议分类说明](#6-会议分类说明)  |
| `status`            | String         | 会议状态，见[会议状态说明](#5-会议状态说明)      |
| `scheduledAt`       | LocalDateTime  | 预约时间                                      |
| `startedAt`         | LocalDateTime  | 实际开始时间（未开始则为 null）                 |
| `maxDurationMinutes`| Integer        | 最大允许时长（分钟）                           |
| `notes`             | String         | 备注信息                                      |

**业务逻辑**

1. 从 Sa-Token 获取当前登录患者 ID
2. 查询该患者的所有会议记录
3. 批量查询关联的医生、科室、医院信息（避免 N+1 查询）
4. 返回会议列表

---

### 3.3 获取会议详情

根据会议 ID 查询单个会议的完整详情。

**基本信息**

| 项目     | 值                                      |
|----------|-----------------------------------------|
| URL      | `/api/app/video/meeting/{meetingId}`    |
| Method   | `GET`                                   |
| 认证     | 需要登录                                 |

**路径参数**

| 参数名      | 类型   | 必填 | 说明        |
|-------------|--------|------|-------------|
| `meetingId` | String | 是   | 会议唯一标识 |

**成功响应**

```json
{
  "code": 200,
  "msg": "查询成功",
  "data": {
    "id": "meeting-uuid-001",
    "agendaId": "agenda-uuid-001",
    "doctorId": "doctor-uuid-001",
    "patientId": "patient-uuid-001",
    "roomName": "room-abc123",
    "classify": "video_consultation",
    "status": "SCHEDULED",
    "scheduledAt": "2026-03-15T14:30:00",
    "startedAt": null,
    "endedAt": null,
    "durationMinutes": null,
    "maxDurationMinutes": 30,
    "notes": "近期视力下降，希望进行远程复查",
    "cancelReason": null,
    "createTime": "2026-03-12T10:00:00"
  }
}
```

**响应字段说明（会议详情）**

| 字段名              | 类型           | 说明                                         |
|---------------------|----------------|----------------------------------------------|
| `id`                | String         | 会议唯一标识                                  |
| `agendaId`          | String         | 关联的日程ID                                  |
| `doctorId`          | String         | 医生ID                                       |
| `patientId`         | String         | 患者ID                                       |
| `roomName`          | String         | Jitsi 视频房间名                              |
| `classify`          | String         | 会议分类代码，见[会议分类说明](#6-会议分类说明)  |
| `status`            | String         | 会议状态，见[会议状态说明](#5-会议状态说明)      |
| `scheduledAt`       | LocalDateTime  | 预约时间                                      |
| `startedAt`         | LocalDateTime  | 实际开始时间（未开始则为 null）                 |
| `endedAt`           | LocalDateTime  | 实际结束时间（未结束则为 null）                 |
| `durationMinutes`   | Integer        | 实际持续时长（分钟），会议结束后计算             |
| `maxDurationMinutes`| Integer        | 最大允许时长（分钟）                           |
| `notes`             | String         | 备注信息                                      |
| `cancelReason`      | String         | 取消原因（未取消则为 null）                     |
| `createTime`        | LocalDateTime  | 记录创建时间                                   |

**业务逻辑**

1. 从 Sa-Token 获取当前登录患者 ID
2. 根据 meetingId 查询会议记录
3. 校验当前用户是否有权限访问该会议（必须是该会议的参与者）
4. 返回会议详情

**可能的错误**

| 错误场景          | 错误信息             |
|------------------|----------------------|
| 会议不存在        | 会议不存在            |
| 无权限访问        | 无权访问该会议        |

---

### 3.4 获取会议加入信息

获取加入视频会议所需的 URL 和 Token，用于前端打开 Jitsi 视频房间。

**基本信息**

| 项目     | 值                                           |
|----------|----------------------------------------------|
| URL      | `/api/app/video/meeting/{meetingId}/join`    |
| Method   | `GET`                                        |
| 认证     | 需要登录                                      |

**路径参数**

| 参数名      | 类型   | 必填 | 说明        |
|-------------|--------|------|-------------|
| `meetingId` | String | 是   | 会议唯一标识 |

**成功响应**

```json
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "joinUrl": "https://video.example.com/room-abc123?jwt=eyJhbGciOi...",
    "jitsiToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "roomName": "room-abc123"
  }
}
```

**响应字段说明**

| 字段名        | 类型   | 说明                                    |
|---------------|--------|-----------------------------------------|
| `joinUrl`     | String | 完整的加入会议 URL（含鉴权参数）          |
| `jitsiToken`  | String | Jitsi JWT Token，用于前端 SDK 直接接入    |
| `roomName`    | String | Jitsi 房间名，用于前端 SDK 指定房间       |

**使用说明**

前端可通过以下两种方式加入会议：
- **方式一**：直接使用 `joinUrl` 在 WebView 或新窗口中打开
- **方式二**：使用 `roomName` + `jitsiToken` 通过 Jitsi SDK 接入

**可能的错误**

| 错误场景          | 错误信息             |
|------------------|----------------------|
| 会议不存在        | 会议不存在            |
| 无权限访问        | 无权访问该会议        |
| 会议已取消        | 会议状态不允许加入     |

---

### 3.5 取消会议

患者取消已预约的视频问诊。

**基本信息**

| 项目     | 值                                             |
|----------|------------------------------------------------|
| URL      | `/api/app/video/meeting/{meetingId}/cancel`    |
| Method   | `POST`                                         |
| 认证     | 需要登录                                        |
| Content-Type | `application/json`（可选）                  |

**路径参数**

| 参数名      | 类型   | 必填 | 说明        |
|-------------|--------|------|-------------|
| `meetingId` | String | 是   | 会议唯一标识 |

**请求参数（Body，可选）**

请求体为可选参数（`required = false`），可以不传或传空对象。

| 参数名    | 类型   | 必填 | 说明       |
|-----------|--------|------|------------|
| `reason`  | String | 否   | 取消原因    |

**请求示例**

```json
{
  "reason": "时间冲突，需要改期"
}
```

**成功响应**

```json
{
  "code": 200,
  "msg": "取消成功",
  "data": null
}
```

**业务逻辑**

1. 从 Sa-Token 获取当前登录患者 ID
2. 根据 meetingId 查询会议记录
3. 校验当前用户是否有权限操作该会议
4. 校验会议是否允许被取消（仅 `SCHEDULED`、`WAITING` 状态可取消）
5. 执行取消操作，记录取消原因和取消人
6. 会议状态变更为 `CANCELLED`

**可能的错误**

| 错误场景           | 错误信息               |
|-------------------|------------------------|
| 会议不存在         | 会议不存在              |
| 无权限操作         | 无权访问该会议          |
| 会议状态不允许取消  | 当前状态不允许取消会议   |

---

## 4. 数据模型

### 4.1 请求模型

#### CreateVideoMeetingRequest（预约请求）

| 字段名        | 类型           | 必填 | 说明                                          |
|---------------|----------------|------|-----------------------------------------------|
| `doctorId`    | String         | 是   | 医生ID                                        |
| `scheduledAt` | LocalDateTime  | 是   | 预约时间                                       |
| `classify`    | String         | 否   | 会议分类，见[会议分类说明](#6-会议分类说明)，不传默认 `video` |
| `notes`       | String         | 否   | 备注信息                                       |

#### CancelVideoMeetingRequest（取消请求）

| 字段名    | 类型   | 必填 | 说明     |
|-----------|--------|------|----------|
| `reason`  | String | 否   | 取消原因  |

### 4.2 响应模型

#### VideoMeetingResponse（会议详情）

| 字段名              | 类型           | 说明                                         |
|---------------------|----------------|----------------------------------------------|
| `id`                | String         | 会议唯一标识                                  |
| `agendaId`          | String         | 关联日程ID                                    |
| `doctorId`          | String         | 医生ID                                       |
| `patientId`         | String         | 患者ID                                       |
| `roomName`          | String         | Jitsi 房间名                                  |
| `classify`          | String         | 会议分类代码，见[会议分类说明](#6-会议分类说明)  |
| `status`            | String         | 会议状态                                      |
| `scheduledAt`       | LocalDateTime  | 预约时间                                      |
| `startedAt`         | LocalDateTime  | 开始时间                                      |
| `endedAt`           | LocalDateTime  | 结束时间                                      |
| `durationMinutes`   | Integer        | 持续时长（分钟）                               |
| `maxDurationMinutes`| Integer        | 最大时长（分钟）                               |
| `notes`             | String         | 备注信息                                      |
| `cancelReason`      | String         | 取消原因                                      |
| `createTime`        | LocalDateTime  | 创建时间                                      |

#### VideoMeetingListResponse（会议列表项）

| 字段名              | 类型           | 说明                                         |
|---------------------|----------------|----------------------------------------------|
| `id`                | String         | 会议唯一标识                                  |
| `meetingTitle`      | String         | 会议名称（如"视频就诊"、"视频复诊"）            |
| `doctorId`          | String         | 医生ID                                       |
| `doctorName`        | String         | 医生姓名                                     |
| `doctorTitle`       | String         | 医生职称                                     |
| `patientId`         | String         | 患者ID                                       |
| `patientName`       | String         | 患者姓名                                     |
| `hospitalName`      | String         | 医院名称                                     |
| `departmentName`    | String         | 科室名称                                     |
| `classify`          | String         | 会议分类代码，见[会议分类说明](#6-会议分类说明)  |
| `status`            | String         | 会议状态                                      |
| `scheduledAt`       | LocalDateTime  | 预约时间                                      |
| `startedAt`         | LocalDateTime  | 开始时间                                      |
| `maxDurationMinutes`| Integer        | 最大时长（分钟）                               |
| `notes`             | String         | 备注信息                                      |

#### VideoJoinResponse（加入信息）

| 字段名        | 类型   | 说明                |
|---------------|--------|---------------------|
| `joinUrl`     | String | 完整加入 URL         |
| `jitsiToken`  | String | Jitsi JWT Token      |
| `roomName`    | String | Jitsi 房间名         |

---

## 5. 会议状态说明

| 状态码          | 中文描述 | 说明                               |
|----------------|----------|------------------------------------|
| `SCHEDULED`    | 已预约   | 会议已创建，等待到达预约时间          |
| `WAITING`      | 等待中   | 预约时间已到，等待双方加入            |
| `IN_PROGRESS`  | 进行中   | 医生已开始会议，双方可进行视频问诊     |
| `COMPLETED`    | 已完成   | 会议已正常结束                       |
| `CANCELLED`    | 已取消   | 会议被患者或医生取消                  |

### 状态流转

```
SCHEDULED → WAITING → IN_PROGRESS → COMPLETED
    ↓          ↓
 CANCELLED  CANCELLED
```

- `SCHEDULED` → `WAITING`：到达预约时间，系统自动切换
- `WAITING` → `IN_PROGRESS`：医生手动开始会议
- `IN_PROGRESS` → `COMPLETED`：医生手动结束会议，或到达最大时长自动结束
- `SCHEDULED` / `WAITING` → `CANCELLED`：患者或医生取消会议

---

## 6. 会议分类说明

| 分类代码              | 中文描述   | DB 值 | 说明                   |
|-----------------------|-----------|-------|------------------------|
| `video`               | 视频问诊  | 3     | 通用视频问诊（默认值）   |
| `video_consultation`  | 视频就诊  | 4     | 初次视频就诊             |
| `video_follow_up`     | 视频复诊  | 5     | 复诊类视频会议           |

- 创建会议时 `classify` 为可选字段，不传默认为 `video`
- `meetingTitle` 字段值由 `classify` 的中文描述自动生成

---

## 7. 错误码

### 7.1 通用错误

| HTTP 状态码 | code | 说明         |
|------------|------|--------------|
| 200        | 401  | 未登录        |
| 200        | 500  | 服务器内部错误 |

### 7.2 业务错误

| 错误信息                   | 触发场景                            |
|---------------------------|-------------------------------------|
| 医生ID不能为空             | `doctorId` 为空或空白字符串           |
| 预约时间不能为空            | `scheduledAt` 为 null               |
| 预约时间不能早于当前时间     | `scheduledAt` 早于服务器当前时间      |
| 该医生当前不可预约          | 医生不存在或不在可预约状态            |
| 会议不存在                 | `meetingId` 对应的记录不存在          |
| 无权访问该会议             | 当前用户不是该会议的参与方（医生或患者）|
| 当前状态不允许取消会议      | 会议处于 `IN_PROGRESS` 或 `COMPLETED` 状态 |

---

## 8. cURL 示例

### 8.1 预约视频问诊

```bash
curl -X POST 'http://localhost:8081/api/app/video/reserve' \
  -H 'Content-Type: application/json' \
  -H 'satoken: your-token-here' \
  -d '{
    "doctorId": "doctor-uuid-001",
    "scheduledAt": "2026-03-15T14:30:00",
    "classify": "video_consultation",
    "notes": "近期视力下降，希望进行远程复查"
  }'
```

### 8.2 获取我的会议列表

```bash
curl -X GET 'http://localhost:8081/api/app/video/meetings' \
  -H 'satoken: your-token-here'
```

### 8.3 获取会议详情

```bash
curl -X GET 'http://localhost:8081/api/app/video/meeting/meeting-uuid-001' \
  -H 'satoken: your-token-here'
```

### 8.4 获取会议加入信息

```bash
curl -X GET 'http://localhost:8081/api/app/video/meeting/meeting-uuid-001/join' \
  -H 'satoken: your-token-here'
```

### 8.5 取消会议

```bash
# 带取消原因
curl -X POST 'http://localhost:8081/api/app/video/meeting/meeting-uuid-001/cancel' \
  -H 'Content-Type: application/json' \
  -H 'satoken: your-token-here' \
  -d '{
    "reason": "时间冲突，需要改期"
  }'

# 不带取消原因
curl -X POST 'http://localhost:8081/api/app/video/meeting/meeting-uuid-001/cancel' \
  -H 'satoken: your-token-here'
```

---

## 9. 版本历史

| 版本  | 日期       | 变更说明                                                        |
|-------|------------|----------------------------------------------------------------|
| v1.0  | 2026-03-10 | 初始版本，包含患者端全部5个接口                                    |
| v1.1  | 2026-03-12 | 预约请求新增 `classify` 字段；会议列表新增 `meetingTitle`、`doctorName`、`doctorTitle`、`hospitalName`、`departmentName`、`classify` 字段；会议详情新增 `classify` 字段 |
