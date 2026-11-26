# App 端基础功能 API 文档

## 概述

本文档描述了 Eye-Agent-Backend 系统中 App 端基础功能的所有 API 接口。这些接口涵盖了用户认证、患者信息管理、通知提醒管理和医生预约等核心功能。

**控制器**: `AppBaseController`
**基础路径**: `/api/app/base`
**版本**: 1.0
**最后更新**: 2025-12-13

---

## 目录

1. [认证相关](#认证相关)
2. [患者信息管理](#患者信息管理)
3. [通知提醒管理](#通知提醒管理)
4. [医生预约管理](#医生预约管理)
5. [医院与医生信息](#医院与医生信息)
6. [数据模型](#数据模型)
7. [错误处理](#错误处理)

---

## 通用说明

### 认证机制

除登录接口外，所有接口都需要进行身份认证。系统使用 Sa-Token 进行认证管理。

**认证方式**:
- 在请求头中携带 Token: `satoken: <your-token-value>`
- Token 有效期: 24小时 (86400秒)
- 活动超时: 12小时 (43200秒)

### 响应格式

所有接口返回统一的 `SaResult` 格式:

```json
{
  "code": 200,
  "msg": "操作成功",
  "data": { ... }
}
```

### 分页参数

涉及分页的接口统一使用以下参数:
- `pageNum`: 页码，默认值为 1
- `pageSize`: 每页大小，默认值为 10

### 分页响应格式

所有分页接口(如 `get-read-notification`、`page-hospital-info`、`page-doctor-by-hospital`)统一使用扁平化的分页响应格式:

```json
{
  "code": 200,
  "msg": "success",
  "data": [
    // 数据数组 - 当前页的记录列表
  ],
  "pageNum": 1,      // 当前页码
  "pageSize": 10,    // 每页大小
  "total": 100,      // 总记录数
  "pages": 10        // 总页数
}
```

**字段说明**:
- `data`: 数组类型,包含当前页的数据记录
- `pageNum`: 当前页码,从1开始
- `pageSize`: 每页显示的记录数
- `total`: 符合查询条件的总记录数
- `pages`: 总页数,由 `total` 和 `pageSize` 计算得出

**注意**: 本系统采用扁平化分页格式,分页信息与数据并列,而非嵌套在 `data` 对象中。

---

## 认证相关

### 1. 用户登录

**接口**: `POST /api/app/base/login`

**描述**: 患者登录接口，使用手机号和密码进行认证。

**权限**: 公开接口 (`@SaIgnore`)

**请求参数**:

```json
{
  "phone": "10000000000",
  "password": "password123"
}
```

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| phone | String | 是 | 手机号 |
| password | String | 是 | 密码 |

**响应示例**:

```json
{
  "code": 200,
  "msg": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "patientId": "123456",
    "patientName": "张三",
    "phone": "10000000000"
  }
}
```

**响应数据结构说明**:
- `token` (String): 认证令牌,后续请求需在请求头中携带
- `patientId` (String): 患者ID
- `patientName` (String): 患者姓名
- `phone` (String): 手机号

**错误示例**:

```json
{
  "code": 401,
  "msg": "手机号或密码错误",
  "data": null
}
```

---

### 2. 用户登出

**接口**: `POST /api/app/base/logout`

**描述**: 患者登出接口，清除当前用户的登录状态。

**权限**: 需要登录 (`@SaCheckLogin`)

**请求参数**: 无

**响应示例**:

```json
{
  "code": 200,
  "msg": "success",
  "data": null
}
```

---

## 患者信息管理

### 3. 获取患者信息

**接口**: `GET /api/app/base/patient-info`

**描述**: 获取当前登录患者的详细信息。

**权限**: 需要登录 (`@SaCheckLogin`)

**请求参数**: 无

**响应示例**:

```json
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "id": "123456",
    "patientName": "张三",
    "gender": "male",
    "age": 35,
    "phone": "10000000000",
    "idNumber": "110101199001011234",
    "address": "北京市朝阳区某某街道",
    "height": 175.5,
    "weight": 70.0,
    "bloodType": "A",
    "maritalStatus": "已婚",
    "careerType": "IT从业者",
    "nation": "汉族",
    "workUnit": "某某科技公司",
    "dateOfBirth": "1990-01-01T00:00:00",
    "email": "user@example.com",
    "emergencyContact": "李四",
    "emergencyContactPhone": "10000000000",
    "insuranceStatus": "正常",
    "insuranceCardNumber": "1234567890",
    "createTime": "2020-01-01T00:00:00",
    "updateTime": "2025-12-13T10:00:00"
  }
}
```

**响应数据结构说明**: 返回完整的 Patient 对象(20个字段 + BaseModel)。详细字段说明请参考[数据模型 - Patient实体](#patient-实体)。

**注意**:
- 字段名为 `id` 而非 `patientId`
- `password` 字段不会在响应中返回 (@JsonIgnore)

---

### 4. 修改患者信息

**接口**: `POST /api/app/base/modify-patient-info`

**描述**: 修改当前登录患者的个人信息。所有字段均为可选，只提交需要修改的字段。

**权限**: 需要登录 (`@SaCheckLogin`)

**请求参数**:

```json
{
  "patientName": "张三",
  "gender": "male",
  "age": 36,
  "phone": "10000000000",
  "idNumber": "110101199001011234",
  "address": "北京市朝阳区新地址",
  "height": 176.0,
  "weight": 71.5,
  "bloodType": "A",
  "maritalStatus": "已婚",
  "careerType": "IT从业者",
  "nation": "汉族",
  "workUnit": "新公司",
  "dateOfBirth": "1990-01-01T00:00:00",
  "email": "user@example.com",
  "emergencyContact": "王五",
  "emergencyContactPhone": "10000000000",
  "insuranceStatus": "正常",
  "insuranceCardNumber": "9876543210"
}
```

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| patientName | String | 否 | 患者姓名 |
| gender | String | 否 | 性别 (male/female) |
| age | Integer | 否 | 年龄 |
| phone | String | 否 | 联系电话 |
| idNumber | String | 否 | 身份证号 |
| address | String | 否 | 联系地址 |
| height | BigDecimal | 否 | 身高(cm) |
| weight | BigDecimal | 否 | 体重(kg) |
| bloodType | String | 否 | 血型 |
| maritalStatus | String | 否 | 婚姻状况 |
| careerType | String | 否 | 职业类型 |
| nation | String | 否 | 民族 |
| workUnit | String | 否 | 工作单位 |
| dateOfBirth | LocalDateTime | 否 | 出生日期 (ISO 8601格式) |
| email | String | 否 | 邮箱 |
| emergencyContact | String | 否 | 紧急联系人 |
| emergencyContactPhone | String | 否 | 紧急联系人电话 |
| insuranceStatus | String | 否 | 医保状态 |
| insuranceCardNumber | String | 否 | 医保卡号 |

**响应示例**:

```json
{
  "code": 200,
  "msg": "修改成功",
  "data": {
    "id": "123456",
    "patientName": "张三",
    "gender": "male",
    "age": 36,
    "phone": "10000000000",
    "idNumber": "110101199001011234",
    "address": "北京市朝阳区新地址",
    "height": 176.0,
    "weight": 71.5,
    "bloodType": "A",
    "maritalStatus": "已婚",
    "careerType": "IT从业者",
    "nation": "汉族",
    "workUnit": "新公司",
    "dateOfBirth": "1990-01-01T00:00:00",
    "email": "user@example.com",
    "emergencyContact": "王五",
    "emergencyContactPhone": "10000000000",
    "insuranceStatus": "正常",
    "insuranceCardNumber": "9876543210",
    "createTime": "2020-01-01T00:00:00",
    "updateTime": "2025-12-13T16:30:00"
  }
}
```

**响应数据结构说明**: 返回修改后的完整 Patient 对象(20个字段 + BaseModel),而非 null。详细字段说明请参考[数据模型 - Patient实体](#patient-实体)。

---

### 5. 修改密码

**接口**: `POST /api/app/base/change-password`

**描述**: 修改当前登录患者的密码。

**权限**: 需要登录 (`@SaCheckLogin`)

**请求参数**:

```json
{
  "oldPassword": "oldPassword123",
  "newPassword": "newPassword456"
}
```

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| oldPassword | String | 是 | 旧密码 |
| newPassword | String | 是 | 新密码 |

**响应示例**:

```json
{
  "code": 200,
  "msg": "密码修改成功",
  "data": null
}
```

**错误示例**:

```json
{
  "code": 400,
  "msg": "旧密码错误",
  "data": null
}
```

---

## 通知提醒管理

### 6. 获取未读通知

**接口**: `GET /api/app/base/get-unread-notification`

**描述**: 获取当前患者的所有未读通知列表,按类型分组返回。

**权限**: 需要登录 (`@SaCheckLogin`)

**请求参数**: 无

**响应示例**:

```json
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "system": [
      {
        "id": "reminder001",
        "patientId": "patient123",
        "medicalRecordId": null,
        "appointmentId": null,
        "prescriptionId": null,
        "reminderType": "SYSTEM",
        "medicalType": null,
        "reminderTitle": "系统维护通知",
        "reminderContent": "系统将于今晚22:00-23:00进行维护",
        "scheduledTime": "2025-12-13T22:00:00",
        "advanceDays": null,
        "sentTime": null,
        "completedTime": null,
        "cancelledTime": null,
        "status": "PENDING",
        "priority": "MEDIUM",
        "repeatType": null,
        "repeatCount": 0,
        "maxRepeatCount": null,
        "notificationMethod": "APP",
        "createdBy": "system",
        "notes": null,
        "createTime": "2025-12-13T10:00:00",
        "updateTime": "2025-12-13T10:00:00"
      }
    ],
    "reserve": [
      {
        "id": "reminder002",
        "patientId": "patient123",
        "medicalRecordId": null,
        "appointmentId": "apt001",
        "prescriptionId": null,
        "reminderType": "RESERVE",
        "medicalType": null,
        "reminderTitle": "预约提醒",
        "reminderContent": "您预约的张医生门诊将于明天上午10:00开始",
        "scheduledTime": "2025-12-14T10:00:00",
        "advanceDays": 1,
        "sentTime": null,
        "completedTime": null,
        "cancelledTime": null,
        "status": "PENDING",
        "priority": "HIGH",
        "repeatType": null,
        "repeatCount": 0,
        "maxRepeatCount": null,
        "notificationMethod": "APP",
        "createdBy": "system",
        "notes": null,
        "createTime": "2025-12-13T09:00:00",
        "updateTime": "2025-12-13T09:00:00"
      }
    ],
    "medication": [
      {
        "id": "reminder003",
        "patientId": "patient123",
        "medicalRecordId": null,
        "appointmentId": null,
        "prescriptionId": "presc001",
        "reminderType": "MEDICATION",
        "medicalType": "PILL",
        "reminderTitle": "降压药提醒",
        "reminderContent": "每天早上服用降压药1片",
        "scheduledTime": "2025-12-14T08:00:00",
        "advanceDays": null,
        "sentTime": null,
        "completedTime": null,
        "cancelledTime": null,
        "status": "PENDING",
        "priority": "HIGH",
        "repeatType": "DAILY",
        "repeatCount": 5,
        "maxRepeatCount": 30,
        "notificationMethod": "APP",
        "createdBy": "doctor456",
        "notes": "饭后服用",
        "createTime": "2025-12-01T08:00:00",
        "updateTime": "2025-12-13T08:00:00"
      }
    ]
  }
}
```

**响应数据结构说明**:
- `system`: 系统通知列表 (Reminder数组)
- `reserve`: 预约提醒列表 (Reminder数组)
- `medication`: 用药提醒列表 (Reminder数组)

每个 Reminder 对象包含完整的24个字段(详见[数据模型 - Reminder实体](#reminder-实体))。

---

### 7. 获取已读通知（分页）

**接口**: `GET /api/app/base/get-read-notification`

**描述**: 分页获取当前患者的已读通知列表，可按通知类型筛选。

**权限**: 需要登录 (`@SaCheckLogin`)

**请求参数**:

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| reminderType | String | 是 | - | 通知类型 (SYSTEM/RESERVE/MEDICATION) |
| pageNum | Integer | 否 | 1 | 页码 |
| pageSize | Integer | 否 | 10 | 每页大小 |

**示例**: `GET /api/app/base/get-read-notification?reminderType=SYSTEM&pageNum=1&pageSize=10`

**响应示例**:

```json
{
  "code": 200,
  "msg": "获取成功",
  "data": [
    {
      "id": "reminder100",
      "patientId": "patient123",
      "medicalRecordId": null,
      "appointmentId": null,
      "prescriptionId": null,
      "reminderType": "SYSTEM",
      "medicalType": null,
      "reminderTitle": "系统公告",
      "reminderContent": "新功能上线通知",
      "scheduledTime": "2025-12-10T10:00:00",
      "advanceDays": null,
      "sentTime": "2025-12-10T10:00:00",
      "completedTime": "2025-12-10T11:30:00",
      "cancelledTime": null,
      "status": "COMPLETED",
      "priority": "MEDIUM",
      "repeatType": null,
      "repeatCount": 0,
      "maxRepeatCount": null,
      "notificationMethod": "APP",
      "createdBy": "system",
      "notes": null,
      "createTime": "2025-12-09T10:00:00",
      "updateTime": "2025-12-10T11:30:00"
    }
  ],
  "pageNum": 1,
  "pageSize": 10,
  "total": 50,
  "pages": 5
}
```

**响应数据结构说明**:
- `data`: Reminder 对象数组(当前页的已读通知列表)
- `pageNum`: 当前页码
- `pageSize`: 每页大小
- `total`: 总记录数
- `pages`: 总页数

每个 Reminder 对象包含完整的24个字段(详见[数据模型 - Reminder实体](#reminder-实体))。

---

### 8. 标记通知为已读

**接口**: `POST /api/app/base/mark-notification-as-read`

**描述**: 将指定通知标记为已读。

**权限**: 需要登录 (`@SaCheckLogin`)

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| reminderId | String | 是 | 通知ID (Query参数) |

**示例**: `POST /api/app/base/mark-notification-as-read?reminderId=reminder001`

**响应示例**:

```json
{
  "code": 200,
  "msg": "标记成功",
  "data": {
    "id": "reminder001",
    "patientId": "patient123",
    "medicalRecordId": null,
    "appointmentId": null,
    "prescriptionId": null,
    "reminderType": "SYSTEM",
    "medicalType": null,
    "reminderTitle": "系统维护通知",
    "reminderContent": "系统将于今晚22:00-23:00进行维护",
    "scheduledTime": "2025-12-13T22:00:00",
    "advanceDays": null,
    "sentTime": "2025-12-13T10:00:00",
    "completedTime": "2025-12-13T15:45:00",
    "cancelledTime": null,
    "status": "COMPLETED",
    "priority": "MEDIUM",
    "repeatType": null,
    "repeatCount": 0,
    "maxRepeatCount": null,
    "notificationMethod": "APP",
    "createdBy": "system",
    "notes": null,
    "createTime": "2025-12-13T10:00:00",
    "updateTime": "2025-12-13T15:45:00"
  }
}
```

**响应数据结构说明**: 返回已标记为已读的完整 Reminder 对象(24个字段),而非 null。详细字段说明请参考[数据模型 - Reminder实体](#reminder-实体)。

---

### 9. 标记所有通知为已读

**接口**: `POST /api/app/base/mark-all-notification-as-read`

**描述**: 将当前患者的所有未读通知标记为已读。

**权限**: 需要登录 (`@SaCheckLogin`)

**请求参数**: 无

**响应示例**:

```json
{
  "code": 200,
  "msg": "全部标记成功",
  "data": null
}
```

---

### 10. 创建通知

**接口**: `POST /api/app/base/create-notification`

**描述**: 创建一个新的通知提醒（普通提醒）。

**权限**: 需要登录 (`@SaCheckLogin`)

**请求参数**:

```json
{
  "reminderType": "SYSTEM",
  "reminderTitle": "个人提醒",
  "reminderContent": "记得明天复查",
  "scheduledTime": "2025-12-14T09:00:00"
}
```

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| reminderType | String | 是 | 通知类型 (SYSTEM/RESERVE/MEDICATION) |
| reminderTitle | String | 是 | 通知标题 |
| reminderContent | String | 否 | 通知内容 |
| scheduledTime | LocalDateTime | 是 | 定时时间 (ISO 8601格式) |

**响应示例**:

```json
{
  "code": 200,
  "msg": "创建成功",
  "data": {
    "id": "reminder999",
    "patientId": "patient123",
    "medicalRecordId": null,
    "appointmentId": null,
    "prescriptionId": null,
    "reminderType": "SYSTEM",
    "medicalType": null,
    "reminderTitle": "个人提醒",
    "reminderContent": "记得明天复查",
    "scheduledTime": "2025-12-14T09:00:00",
    "advanceDays": null,
    "sentTime": null,
    "completedTime": null,
    "cancelledTime": null,
    "status": "PENDING",
    "priority": "MEDIUM",
    "repeatType": null,
    "repeatCount": 0,
    "maxRepeatCount": null,
    "notificationMethod": "APP",
    "createdBy": "patient123",
    "notes": null,
    "createTime": "2025-12-13T16:00:00",
    "updateTime": "2025-12-13T16:00:00"
  }
}
```

**响应数据结构说明**: 返回新创建的完整 Reminder 对象(24个字段),而非仅包含 reminderId。详细字段说明请参考[数据模型 - Reminder实体](#reminder-实体)。

---

### 11. 修改通知

**接口**: `POST /api/app/base/modify-notification`

**描述**: 修改已存在的通知信息。

**权限**: 需要登录 (`@SaCheckLogin`)

**请求参数**:

```json
{
  "reminderId": "reminder999",
  "reminderType": "SYSTEM",
  "reminderTitle": "更新后的标题",
  "reminderContent": "更新后的内容",
  "scheduledTime": "2025-12-15T09:00:00"
}
```

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| reminderId | String | 是 | 通知ID |
| reminderType | String | 否 | 通知类型 |
| reminderTitle | String | 否 | 通知标题 |
| reminderContent | String | 否 | 通知内容 |
| scheduledTime | LocalDateTime | 否 | 定时时间 |

**响应示例**:

```json
{
  "code": 200,
  "msg": "修改成功",
  "data": {
    "id": "reminder999",
    "patientId": "patient123",
    "medicalRecordId": null,
    "appointmentId": null,
    "prescriptionId": null,
    "reminderType": "SYSTEM",
    "medicalType": null,
    "reminderTitle": "更新后的标题",
    "reminderContent": "更新后的内容",
    "scheduledTime": "2025-12-15T09:00:00",
    "advanceDays": null,
    "sentTime": null,
    "completedTime": null,
    "cancelledTime": null,
    "status": "PENDING",
    "priority": "MEDIUM",
    "repeatType": null,
    "repeatCount": 0,
    "maxRepeatCount": null,
    "notificationMethod": "APP",
    "createdBy": "patient123",
    "notes": null,
    "createTime": "2025-12-13T16:00:00",
    "updateTime": "2025-12-13T17:00:00"
  }
}
```

**响应数据结构说明**: 返回修改后的完整 Reminder 对象(24个字段),而非 null。详细字段说明请参考[数据模型 - Reminder实体](#reminder-实体)。

---

### 12. 删除通知

**接口**: `POST /api/app/base/remove-notification`

**描述**: 删除指定的通知。

**权限**: 需要登录 (`@SaCheckLogin`)

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| reminderId | String | 是 | 通知ID (Query参数) |

**示例**: `POST /api/app/base/remove-notification?reminderId=reminder999`

**响应示例**:

```json
{
  "code": 200,
  "msg": "删除成功",
  "data": null
}
```

---

### 13. 创建用药提醒

**接口**: `POST /api/app/base/create-medical-notification`

**描述**: 创建用药提醒，支持定时和周期性提醒。

**权限**: 需要登录 (`@SaCheckLogin`)

**请求参数**:

```json
{
  "title": "降压药提醒",
  "content": "每天早上服用降压药1片",
  "medicalType": "PILL",
  "time": "08:00:00",
  "duration": 30
}
```

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| title | String | 是 | 提醒标题 |
| content | String | 否 | 提醒内容 |
| medicalType | String | 是 | 药品类型 (DROP/PILL/CAPSULE/INJECT) |
| time | LocalTime | 是 | 提醒时间 (HH:mm:ss格式) |
| duration | Integer | 是 | 持续天数 |

**药品类型说明**:
- `DROP`: 滴剂
- `PILL`: 药片
- `CAPSULE`: 胶囊
- `INJECT`: 注射

**响应示例**:

```json
{
  "code": 200,
  "msg": "创建成功",
  "data": null
}
```

**说明**: 创建成功后返回 data 为 null。用药提醒已在后台创建,系统会按照设定的时间和周期自动推送。

---

### 14. 修改用药提醒

**接口**: `POST /api/app/base/modify-medical-notification`

**描述**: 修改已存在的用药提醒。

**权限**: 需要登录 (`@SaCheckLogin`)

**请求参数**:

```json
{
  "reminderId": "medical001",
  "title": "新的用药提醒标题",
  "content": "新的用药说明",
  "medicalType": "CAPSULE",
  "scheduledTime": "2025-12-14T08:00:00"
}
```

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| reminderId | String | 是 | 用药提醒ID |
| title | String | 否 | 提醒标题 |
| content | String | 否 | 提醒内容 |
| medicalType | String | 是 | 药品类型 |
| scheduledTime | LocalDateTime | 是 | 定时时间 (ISO 8601格式) |

**响应示例**:

```json
{
  "code": 200,
  "msg": "修改成功",
  "data": {
    "id": "medical001",
    "patientId": "patient123",
    "medicalRecordId": null,
    "appointmentId": null,
    "prescriptionId": "presc001",
    "reminderType": "MEDICATION",
    "medicalType": "CAPSULE",
    "reminderTitle": "新的用药提醒标题",
    "reminderContent": "新的用药说明",
    "scheduledTime": "2025-12-14T08:00:00",
    "advanceDays": null,
    "sentTime": null,
    "completedTime": null,
    "cancelledTime": null,
    "status": "PENDING",
    "priority": "HIGH",
    "repeatType": "DAILY",
    "repeatCount": 3,
    "maxRepeatCount": 30,
    "notificationMethod": "APP",
    "createdBy": "doctor456",
    "notes": "饭后服用",
    "createTime": "2025-12-01T08:00:00",
    "updateTime": "2025-12-13T18:00:00"
  }
}
```

**响应数据结构说明**: 返回修改后的完整 Reminder 对象(24个字段),而非 null。详细字段说明请参考[数据模型 - Reminder实体](#reminder-实体)。

---

## 医生预约管理

### 15. 获取医生空闲时间

**接口**: `GET /api/app/base/doctor-free-time`

**描述**: 获取指定医生的可预约时间段列表,按日期分组展示每小时的可预约情况。

**权限**: 需要登录 (`@SaCheckLogin`)

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| doctorId | String | 是 | 医生ID (Query参数) |

**示例**: `GET /api/app/base/doctor-free-time?doctorId=doctor123`

**响应示例**:

```json
{
  "code": 200,
  "msg": "获取成功",
  "data": [
    {
      "date": "2025-12-14",
      "hourlySlots": [
        {
          "startTime": "09:00:00",
          "endTime": "10:00:00",
          "capacity": 3,
          "canReserve": true,
          "agendaId": null
        },
        {
          "startTime": "10:00:00",
          "endTime": "11:00:00",
          "capacity": 2,
          "canReserve": true,
          "agendaId": "agenda123"
        },
        {
          "startTime": "14:00:00",
          "endTime": "15:00:00",
          "capacity": 0,
          "canReserve": false,
          "agendaId": null
        }
      ]
    },
    {
      "date": "2025-12-15",
      "hourlySlots": [
        {
          "startTime": "09:00:00",
          "endTime": "10:00:00",
          "capacity": 5,
          "canReserve": true,
          "agendaId": null
        }
      ]
    }
  ]
}
```

**响应数据结构说明**:

data 是 `DoctorDailyFreeTimeResponse` 数组,每个对象包含:
- `date` (LocalDate): 日期
- `hourlySlots` (HourlySlot数组): 该日期的小时时间槽列表

每个 HourlySlot 对象包含:
- `startTime` (LocalTime): 时间槽开始时间
- `endTime` (LocalTime): 时间槽结束时间
- `capacity` (Integer): 剩余可预约位置数
- `canReserve` (Boolean): 是否可以预约 (capacity > 0)
- `agendaId` (String): 如果当前用户已预约该时间槽,返回预约的议程ID;否则为 null

---

### 16. 预约医生

**接口**: `POST /api/app/base/reserve-doctor`

**描述**: 预约指定医生的指定时间段。

**权限**: 需要登录 (`@SaCheckLogin`)

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| doctorId | String | 是 | 医生ID (Query参数) |
| time | LocalDateTime | 是 | 预约时间 (Query参数, ISO 8601格式) |

**示例**: `POST /api/app/base/reserve-doctor?doctorId=doctor123&time=2025-12-14T09:00:00`

**响应示例**:

```json
{
  "code": 200,
  "msg": "预约成功",
  "data": {
    "position": 5,
    "agenda": {
      "id": "agenda001",
      "userId": "doctor123",
      "patientId": "patient123",
      "patientName": "张三",
      "title": "眼科门诊预约",
      "classify": "RESERVE",
      "remark": null,
      "resolved": false,
      "startTime": "2025-12-14T09:00:00",
      "endTime": "2025-12-14T10:00:00",
      "color": "#1890ff",
      "medicalRecordId": null,
      "severityLevel": null,
      "status": "PENDING",
      "timeChangeRecord": null,
      "category": "APPOINTMENT",
      "createTime": "2025-12-13T15:30:00",
      "updateTime": "2025-12-13T15:30:00"
    }
  }
}
```

**响应数据结构说明**:
- `position` (Integer): 当前排队位置
- `agenda` (Agenda对象): 完整的日程对象(17个字段 + BaseModel),包含预约的详细信息

详细的 Agenda 字段说明请参考[数据模型 - Agenda实体](#agenda-实体)。

**错误示例**:

```json
{
  "code": 400,
  "msg": "该时间段已被预约",
  "data": null
}
```

---

### 17. 获取患者预约时间

**接口**: `GET /api/app/base/patient-reserve-time`

**描述**: 获取当前患者的所有预约记录。

**权限**: 需要登录 (`@SaCheckLogin`)

**请求参数**: 无

**响应示例**:

```json
{
  "code": 200,
  "msg": "获取成功",
  "data": [
    {
      "reserveId": "agenda001",
      "startTime": "2025-12-14T09:00:00",
      "endTime": "2025-12-14T10:00:00",
      "status": "PENDING",
      "patientName": "张三",
      "queuePosition": 5,
      "doctorId": "doctor123",
      "doctorName": "张医生",
      "doctorTitle": "主任医师",
      "doctorSpecialty": "白内障、青光眼",
      "department": "眼科",
      "doctorAvatarUrl": "https://example.com/avatar/doctor123.jpg",
      "consultationRoom": "门诊楼3楼301室",
      "hospitalId": "hospital001",
      "hospitalName": "北京人民医院",
      "hospitalAddress": "北京市朝阳区某某路123号",
      "hospitalLevel": "三级甲等"
    },
    {
      "reserveId": "agenda002",
      "startTime": "2025-12-15T14:00:00",
      "endTime": "2025-12-15T15:00:00",
      "status": "CONFIRMED",
      "patientName": "张三",
      "queuePosition": 3,
      "doctorId": "doctor456",
      "doctorName": "李医生",
      "doctorTitle": "副主任医师",
      "doctorSpecialty": "视网膜疾病",
      "department": "眼科",
      "doctorAvatarUrl": "https://example.com/avatar/doctor456.jpg",
      "consultationRoom": "门诊楼3楼302室",
      "hospitalId": "hospital001",
      "hospitalName": "北京人民医院",
      "hospitalAddress": "北京市朝阳区某某路123号",
      "hospitalLevel": "三级甲等"
    }
  ]
}
```

**响应数据结构说明**:

data 是 `PatientReserveResponse` 数组,每个对象包含16个字段:

**预约信息** (6个字段):
- `reserveId` (String): 预约ID (对应 Agenda 的 id)
- `startTime` (LocalDateTime): 预约开始时间
- `endTime` (LocalDateTime): 预约结束时间
- `status` (String): 预约状态
- `patientName` (String): 患者姓名
- `queuePosition` (Integer): 排队位置

**医生信息** (7个字段):
- `doctorId` (String): 医生ID
- `doctorName` (String): 医生姓名
- `doctorTitle` (String): 医生职称
- `doctorSpecialty` (String): 医生专长
- `department` (String): 所属科室
- `doctorAvatarUrl` (String): 医生头像URL
- `consultationRoom` (String): 就诊室

**医院信息** (4个字段):
- `hospitalId` (String): 医院ID
- `hospitalName` (String): 医院名称
- `hospitalAddress` (String): 医院地址
- `hospitalLevel` (String): 医院等级

---

### 18. 取消预约

**接口**: `POST /api/app/base/cancel-reserve`

**描述**: 取消指定的预约。

**权限**: 需要登录 (`@SaCheckLogin`)

**请求参数**:

```json
{
  "reserveId": "reserve001"
}
```

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| reserveId | String | 是 | 预约ID |

**响应示例**:

```json
{
  "code": 200,
  "msg": "取消成功",
  "data": null
}
```

**错误示例**:

```json
{
  "code": 400,
  "msg": "预约不存在或已过期",
  "data": null
}
```

---

## 医院与医生信息

### 19. 分页查询医院信息

**接口**: `GET /api/app/base/page-hospital-info`

**描述**: 分页获取医院列表，支持关键字搜索。

**权限**: 需要登录 (`@SaCheckLogin`)

**请求参数**:

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| pageNum | Integer | 否 | 1 | 页码 |
| pageSize | Integer | 否 | 10 | 每页大小 |
| searchKey | String | 否 | - | 搜索关键字（医院名称） |

**示例**: `GET /api/app/base/page-hospital-info?pageNum=1&pageSize=10&searchKey=人民医院`

**响应示例**:

```json
{
  "code": 200,
  "msg": "获取成功",
  "data": [
    {
      "id": "hospital001",
      "hospitalName": "北京人民医院",
      "organizationCode": "ORG123456",
      "province": "北京市",
      "city": "北京市",
      "address": "北京市朝阳区某某路123号",
      "logoUrl": "https://example.com/logo/hospital001.png",
      "hospitalType": "GENERAL",
      "hospitalLevel": "TERTIARY_A",
      "star": 4.8,
      "createTime": "2020-01-01T00:00:00",
      "updateTime": "2025-12-10T10:00:00"
    },
    {
      "id": "hospital002",
      "hospitalName": "上海眼科医院",
      "organizationCode": "ORG789012",
      "province": "上海市",
      "city": "上海市",
      "address": "上海市黄浦区某某路456号",
      "logoUrl": "https://example.com/logo/hospital002.png",
      "hospitalType": "SPECIALIZED",
      "hospitalLevel": "TERTIARY_A",
      "star": 4.9,
      "createTime": "2019-05-15T00:00:00",
      "updateTime": "2025-12-08T15:00:00"
    }
  ],
  "pageNum": 1,
  "pageSize": 10,
  "total": 100,
  "pages": 10
}
```

**响应数据结构说明**:
- `data`: Hospital 对象数组(当前页的医院列表)
- `pageNum`: 当前页码
- `pageSize`: 每页大小
- `total`: 总记录数
- `pages`: 总页数

每个 Hospital 对象包含10个字段 + BaseModel:
- `id` (String): 医院ID
- `hospitalName` (String): 医院名称
- `organizationCode` (String): 机构代码
- `province` (String): 省份
- `city` (String): 城市
- `address` (String): 详细地址
- `logoUrl` (String): 医院Logo URL
- `hospitalType` (HospitalType枚举): 医院类型
- `hospitalLevel` (HospitalLevel枚举): 医院等级
- `star` (BigDecimal): 星级评分
- `createTime`, `updateTime`: 时间戳字段

详细的枚举值定义请参考[数据模型 - Hospital实体](#hospital-实体)。

---

### 20. 分页查询医院医生

**接口**: `GET /api/app/base/page-doctor-by-hospital`

**描述**: 分页获取指定医院的医生列表。

**权限**: 需要登录 (`@SaCheckLogin`)

**请求参数**:

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| hospitalId | String | 是 | - | 医院ID |
| pageNum | Integer | 否 | 1 | 页码 |
| pageSize | Integer | 否 | 10 | 每页大小 |

**示例**: `GET /api/app/base/page-doctor-by-hospital?hospitalId=hospital001&pageNum=1&pageSize=10`

**响应示例**:

```json
{
  "code": 200,
  "msg": "获取成功",
  "data": [
    {
      "id": "doctor123",
      "name": "张医生",
      "hospitalArea": "眼科",
      "title": "主任医师",
      "gender": "male",
      "age": 45,
      "phoneNumber": "10000000000",
      "specialty": "白内障、青光眼",
      "avatarUrl": "https://example.com/avatar/doctor123.jpg",
      "consultationRoom": "门诊楼3楼301室",
      "createTime": "2020-06-01T00:00:00",
      "updateTime": "2025-12-10T08:00:00"
    },
    {
      "id": "doctor456",
      "name": "李医生",
      "hospitalArea": "眼科",
      "title": "副主任医师",
      "gender": "female",
      "age": 38,
      "phoneNumber": "10000000000",
      "specialty": "视网膜疾病",
      "avatarUrl": "https://example.com/avatar/doctor456.jpg",
      "consultationRoom": "门诊楼3楼302室",
      "createTime": "2021-03-15T00:00:00",
      "updateTime": "2025-12-09T16:00:00"
    }
  ],
  "pageNum": 1,
  "pageSize": 10,
  "total": 50,
  "pages": 5
}
```

**响应数据结构说明**:
- `data`: Doctor 对象数组(当前页的医生列表)
- `pageNum`: 当前页码
- `pageSize`: 每页大小
- `total`: 总记录数
- `pages`: 总页数

每个 Doctor 对象包含11个字段 + BaseModel:
- `id` (String): 医生ID
- `name` (String): 医生姓名
- `hospitalArea` (String): 医院/科室
- `title` (String): 职称
- `gender` (Gender枚举): 性别
- `age` (Integer): 年龄
- `phoneNumber` (String): 联系电话
- `specialty` (String): 专长
- `avatarUrl` (String): 头像URL
- `consultationRoom` (String): 就诊室
- `createTime`, `updateTime`: 时间戳字段

**注意**: password 字段不会在响应中返回。详细信息请参考[数据模型 - Doctor实体](#doctor-实体)。

---

## 数据模型

本章节详细描述了系统中使用的所有数据实体和枚举类型。

### 实体模型

#### Reminder 实体

提醒任务实体,包含24个字段(21个业务字段 + 3个BaseModel字段):

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | String | 提醒ID (继承自BaseModel) |
| patientId | String | 患者ID |
| medicalRecordId | String | 病历ID |
| appointmentId | String | 预约ID |
| prescriptionId | String | 处方ID |
| reminderType | ReminderType | 提醒类型(SYSTEM/RESERVE/MEDICATION) |
| medicalType | MedicalType | 药物类型(DROP/PILL/CAPSULE/INJECT) |
| reminderTitle | String | 提醒标题 |
| reminderContent | String | 提醒内容 |
| scheduledTime | LocalDateTime | 计划提醒时间 |
| advanceDays | Integer | 提前天数 |
| sentTime | LocalDateTime | 发送时间 |
| completedTime | LocalDateTime | 完成时间 |
| cancelledTime | LocalDateTime | 取消时间 |
| status | ReminderStatus | 状态(PENDING/SENT/COMPLETED/CANCELLED) |
| priority | String | 优先级(LOW/MEDIUM/HIGH) |
| repeatType | String | 重复类型(DAILY/WEEKLY/MONTHLY) |
| repeatCount | Integer | 已重复次数 |
| maxRepeatCount | Integer | 最大重复次数 |
| notificationMethod | String | 通知方式(APP/SMS/EMAIL) |
| createdBy | String | 创建人ID |
| notes | String | 备注信息 |
| createTime | LocalDateTime | 创建时间 (继承自BaseModel) |
| updateTime | LocalDateTime | 更新时间 (继承自BaseModel) |
| deleted | Integer | 逻辑删除标记 (继承自BaseModel,不返回) |

#### Patient 实体

患者信息实体,包含23个字段(20个业务字段 + 3个BaseModel字段):

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | String | 患者ID (继承自BaseModel) |
| patientName | String | 患者姓名 |
| gender | Gender | 性别(male/female) |
| age | Integer | 年龄 |
| phone | String | 手机号 |
| password | String | 密码 (@JsonIgnore,不返回) |
| idNumber | String | 身份证号 |
| address | String | 联系地址 |
| height | BigDecimal | 身高(cm) |
| weight | BigDecimal | 体重(kg) |
| bloodType | String | 血型 |
| maritalStatus | String | 婚姻状况 |
| careerType | String | 职业类型 |
| nation | String | 民族 |
| workUnit | String | 工作单位 |
| dateOfBirth | LocalDateTime | 出生日期 |
| email | String | 邮箱地址 |
| emergencyContact | String | 紧急联系人 |
| emergencyContactPhone | String | 紧急联系人电话 |
| insuranceStatus | String | 医保状态 |
| insuranceCardNumber | String | 医保卡号 |
| createTime | LocalDateTime | 创建时间 (继承自BaseModel) |
| updateTime | LocalDateTime | 更新时间 (继承自BaseModel) |
| deleted | Integer | 逻辑删除标记 (继承自BaseModel,不返回) |

#### Hospital 实体

医院信息实体,包含13个字段(10个业务字段 + 3个BaseModel字段):

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | String | 医院ID (继承自BaseModel) |
| hospitalName | String | 医院名称 |
| organizationCode | String | 机构代码 |
| province | String | 省份 |
| city | String | 城市 |
| address | String | 详细地址 |
| logoUrl | String | 医院Logo URL |
| hospitalType | HospitalType | 医院类型枚举 |
| hospitalLevel | HospitalLevel | 医院等级枚举 |
| star | BigDecimal | 星级评分 |
| createTime | LocalDateTime | 创建时间 (继承自BaseModel) |
| updateTime | LocalDateTime | 更新时间 (继承自BaseModel) |
| deleted | Integer | 逻辑删除标记 (继承自BaseModel,不返回) |

#### Doctor 实体

医生信息实体,包含14个字段(11个业务字段 + 3个BaseModel字段):

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | String | 医生ID (继承自BaseModel) |
| name | String | 医生姓名 |
| hospitalArea | String | 医院/科室 |
| title | String | 职称 |
| gender | Gender | 性别(male/female) |
| age | Integer | 年龄 |
| password | String | 密码 (@JsonIgnore,不返回) |
| phoneNumber | String | 联系电话 |
| specialty | String | 专长 |
| avatarUrl | String | 头像URL |
| consultationRoom | String | 就诊室 |
| createTime | LocalDateTime | 创建时间 (继承自BaseModel) |
| updateTime | LocalDateTime | 更新时间 (继承自BaseModel) |
| deleted | Integer | 逻辑删除标记 (继承自BaseModel,不返回) |

#### Agenda 实体

日程/预约实体,包含20个字段(17个业务字段 + 3个BaseModel字段):

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | String | 日程ID (继承自BaseModel) |
| userId | String | 用户ID(医生ID) |
| patientId | String | 患者ID |
| patientName | String | 患者姓名 |
| title | String | 日程标题 |
| classify | AgendaClassify | 日程分类枚举 |
| remark | String | 备注信息 |
| resolved | Boolean | 是否已解决 |
| startTime | LocalDateTime | 开始时间 |
| endTime | LocalDateTime | 结束时间 |
| color | String | 日历显示颜色 |
| medicalRecordId | String | 病历ID |
| severityLevel | String | 严重程度 |
| status | AgendaStatus | 日程状态枚举 |
| timeChangeRecord | String | 时间变更记录 |
| category | String | 类别 |
| createTime | LocalDateTime | 创建时间 (继承自BaseModel) |
| updateTime | LocalDateTime | 更新时间 (继承自BaseModel) |
| deleted | Integer | 逻辑删除标记 (继承自BaseModel,不返回) |

### DTO模型

#### AppLoginResponse

登录响应DTO,包含4个字段:

| 字段名 | 类型 | 说明 |
|--------|------|------|
| token | String | 认证令牌 |
| patientId | String | 患者ID |
| patientName | String | 患者姓名 |
| phone | String | 手机号 |

**注意**: 这是扁平结构,不包含嵌套的 patientInfo 对象。

#### GetUnreadNotificationResponse

未读通知分组响应DTO,包含3个字段:

| 字段名 | 类型 | 说明 |
|--------|------|------|
| system | List\<Reminder\> | 系统通知列表 |
| reserve | List\<Reminder\> | 预约提醒列表 |
| medication | List\<Reminder\> | 用药提醒列表 |

#### PatientReserveResponse

患者预约响应DTO,包含16个字段:

**预约信息** (6个字段):
| 字段名 | 类型 | 说明 |
|--------|------|------|
| reserveId | String | 预约ID(对应Agenda.id) |
| startTime | LocalDateTime | 预约开始时间 |
| endTime | LocalDateTime | 预约结束时间 |
| status | String | 预约状态 |
| patientName | String | 患者姓名 |
| queuePosition | Integer | 排队位置 |

**医生信息** (7个字段):
| 字段名 | 类型 | 说明 |
|--------|------|------|
| doctorId | String | 医生ID |
| doctorName | String | 医生姓名 |
| doctorTitle | String | 医生职称 |
| doctorSpecialty | String | 医生专长 |
| department | String | 所属科室 |
| doctorAvatarUrl | String | 医生头像URL |
| consultationRoom | String | 就诊室 |

**医院信息** (4个字段):
| 字段名 | 类型 | 说明 |
|--------|------|------|
| hospitalId | String | 医院ID |
| hospitalName | String | 医院名称 |
| hospitalAddress | String | 医院地址 |
| hospitalLevel | String | 医院等级 |

#### DoctorDailyFreeTimeResponse

医生每日空闲时间响应DTO,包含2个字段:

| 字段名 | 类型 | 说明 |
|--------|------|------|
| date | LocalDate | 日期 |
| hourlySlots | List\<HourlySlot\> | 小时时间槽列表 |

#### HourlySlot

小时时间槽DTO,包含5个字段:

| 字段名 | 类型 | 说明 |
|--------|------|------|
| startTime | LocalTime | 时间槽开始时间 |
| endTime | LocalTime | 时间槽结束时间 |
| capacity | Integer | 剩余可预约位置数 |
| canReserve | Boolean | 是否可以预约(capacity > 0) |
| agendaId | String | 如果当前用户已预约该时间槽,返回预约的议程ID;否则为null |

### 枚举类型

#### Gender 枚举

性别枚举类型:

| 值 | 说明 | 数据库存储值 |
|----|------|--------------|
| male | 男性 | true |
| female | 女性 | false |

#### ReminderType 枚举

通知类型枚举:

| 值 | 说明 |
|----|------|
| SYSTEM | 系统通知 |
| RESERVE | 预约提醒 |
| MEDICATION | 用药提醒 |

#### ReminderStatus 枚举

提醒状态枚举:

| 值 | 说明 |
|----|------|
| PENDING | 待发送 |
| SENT | 已发送 |
| COMPLETED | 已完成 |
| CANCELLED | 已取消 |

#### MedicalType 枚举

药品类型枚举:

| 值 | 说明 |
|----|------|
| DROP | 滴剂 |
| PILL | 药片 |
| CAPSULE | 胶囊 |
| INJECT | 注射 |

#### HospitalType 枚举

医院类型枚举:

| 值 | 说明 |
|----|------|
| GENERAL | 综合医院 |
| SPECIALIZED | 专科医院 |

#### HospitalLevel 枚举

医院等级枚举:

| 值 | 说明 |
|----|------|
| TERTIARY_A | 三级甲等 |
| TERTIARY_B | 三级乙等 |
| SECONDARY_A | 二级甲等 |
| SECONDARY_B | 二级乙等 |
| PRIMARY | 一级医院 |

#### AgendaClassify 枚举

日程分类枚举:

| 值 | 说明 |
|----|------|
| RESERVE | 预约 |
| CONSULTATION | 咨询 |
| FOLLOW_UP | 随访 |

#### AgendaStatus 枚举

日程状态枚举:

| 值 | 说明 |
|----|------|
| PENDING | 待处理 |
| CONFIRMED | 已确认 |
| COMPLETED | 已完成 |
| CANCELLED | 已取消 |

### 时间格式说明

**LocalDateTime 格式**: ISO 8601 标准格式
- 示例: `2025-12-14T09:00:00`
- 格式: `yyyy-MM-ddTHH:mm:ss`

**LocalTime 格式**: 24小时制时间格式
- 示例: `08:00:00`
- 格式: `HH:mm:ss`

**LocalDate 格式**: ISO 8601 日期格式
- 示例: `2025-12-14`
- 格式: `yyyy-MM-dd`

---

## 错误处理

### 常见错误码

| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| 200 | 成功 | - |
| 400 | 请求参数错误 | 检查请求参数格式和必填项 |
| 401 | 未认证或认证失败 | 检查 Token 是否有效 |
| 403 | 权限不足 | 检查用户权限 |
| 404 | 资源不存在 | 检查请求的资源ID是否正确 |
| 500 | 服务器内部错误 | 联系技术支持 |

### 错误响应格式

```json
{
  "code": 400,
  "msg": "错误描述信息",
  "data": null
}
```

### 认证错误处理

当 Token 失效或不存在时，会返回：

```json
{
  "code": 401,
  "msg": "未登录或登录已过期",
  "data": null
}
```

此时客户端应引导用户重新登录。

---

## 最佳实践

### 1. Token 管理

- 登录成功后保存 Token
- 每次请求在 Header 中携带 Token
- Token 过期后提示用户重新登录
- 退出登录时清除本地 Token

### 2. 错误处理

- 始终检查响应的 `code` 字段
- 根据不同错误码进行相应处理
- 向用户展示友好的错误提示信息

### 3. 分页查询

- 使用合理的 `pageSize` 避免单次请求数据量过大
- 实现下拉加载或分页组件提升用户体验

### 4. 时间处理

- 使用 ISO 8601 标准格式传输时间
- 客户端根据用户时区进行转换和展示

### 5. 输入验证

- 客户端进行基础的输入验证
- 必填字段在提交前检查
- 格式化数据（如手机号、身份证号）进行验证

---

## 附录

### A. 完整请求示例（使用 curl）

**登录请求**:

```bash
curl -X POST http://localhost:8081/api/app/base/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "10000000000",
    "password": "password123"
  }'
```

**获取患者信息**:

```bash
curl -X GET http://localhost:8081/api/app/base/patient-info \
  -H "satoken: your-token-value"
```

**预约医生**:

```bash
curl -X POST "http://localhost:8081/api/app/base/reserve-doctor?doctorId=doctor123&time=2025-12-14T09:00:00" \
  -H "satoken: your-token-value"
```

### B. 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 1.0 | 2025-12-13 | 初始版本，包含所有基础功能接口 |

---

## 技术支持

如有问题或建议，请联系开发团队：

- **项目地址**: Eye-Agent-Backend
- **作者**: chengyiyang
- **技术栈**: Spring Boot 3.5.7 + Java 21 + Sa-Token

---

**文档结束**
