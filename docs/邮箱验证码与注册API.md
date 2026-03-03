# 邮箱验证码与注册 API 文档

## 概述

本文档描述了 App 端注册流程中涉及的两个接口：发送邮箱验证码和患者注册。注册流程要求用户先通过邮箱获取验证码，再携带验证码完成注册。

**控制器**: `AppBaseController`
**基础路径**: `/api/app/base`
**最后更新**: 2026-02-25

---

## 目录

1. [业务流程](#业务流程)
2. [发送邮箱验证码](#1-发送邮箱验证码)
3. [患者注册](#2-患者注册)
4. [安全机制](#安全机制)
5. [错误码参考](#错误码参考)

---

## 业务流程

```
┌──────────┐         ┌──────────┐         ┌───────┐         ┌──────────┐
│  客户端   │         │  后端服务  │         │ Redis │         │ 邮件服务  │
└────┬─────┘         └────┬─────┘         └───┬───┘         └────┬─────┘
     │  1. POST /send-email-code              │                   │
     │  {email}           │                   │                   │
     │───────────────────>│                   │                   │
     │                    │  检查频率限制      │                   │
     │                    │──────────────────>│                   │
     │                    │   生成6位验证码    │                   │
     │                    │   存储验证码(5min) │                   │
     │                    │──────────────────>│                   │
     │                    │   设置限流标记(60s)│                   │
     │                    │──────────────────>│                   │
     │                    │   MQ异步发送邮件   │                   │
     │                    │──────────────────────────────────────>│
     │  {code:200}        │                   │                   │
     │<───────────────────│                   │        发送验证码邮件
     │                    │                   │                   │
     │  2. POST /register │                   │                   │
     │  {..., emailCode}  │                   │                   │
     │───────────────────>│                   │                   │
     │                    │  校验验证码        │                   │
     │                    │──────────────────>│                   │
     │                    │  唯一性检查(手机号/身份证/邮箱)         │
     │                    │  创建患者 + 自动登录│                   │
     │  {code:200, token} │                   │                   │
     │<───────────────────│                   │                   │
```

**关键时序**:
1. 用户输入邮箱，调用发送验证码接口
2. 等待邮件到达（通常 5-15 秒）
3. 用户填写完整注册表单 + 验证码，调用注册接口
4. 注册成功后自动登录，返回 Token

---

## 1. 发送邮箱验证码

**接口**: `POST /api/app/base/send-email-code`

**描述**: 向指定邮箱发送 6 位数字验证码，用于后续注册时校验邮箱所有权。验证码有效期 5 分钟，同一邮箱 60 秒内仅可发送一次。

**权限**: 公开接口 (`@SaIgnore`)

**请求参数**:

```json
{
  "email": "zhangsan@example.com"
}
```

| 参数名 | 类型 | 必填 | 校验规则 | 说明 |
|--------|------|------|----------|------|
| email | String | 是 | `@NotBlank` `@Email` | 接收验证码的邮箱地址 |

**成功响应**:

```json
{
  "code": 200,
  "msg": "验证码已发送",
  "data": null
}
```

**错误响应**:

频率限制（60 秒内重复请求）:
```json
{
  "code": 500,
  "msg": "发送过于频繁，请稍后再试",
  "data": null
}
```

参数校验失败:
```json
{
  "code": 500,
  "msg": "邮箱格式不正确",
  "data": null
}
```

**注意事项**:
- 邮件通过 RabbitMQ 异步发送，接口返回成功仅代表验证码已生成并投递到消息队列，不代表邮件已送达
- 如用户未收到邮件，需等待 60 秒后方可重新发送
- 重新发送时会覆盖上一次的验证码，旧验证码立即失效

---

## 2. 患者注册

**接口**: `POST /api/app/base/register`

**描述**: 患者注册接口。注册前需先调用发送验证码接口获取邮箱验证码。注册成功后自动登录，返回认证 Token。

**权限**: 公开接口 (`@SaIgnore`)

**请求参数**:

```json
{
  "patientName": "张三",
  "gender": "male",
  "age": 35,
  "phone": "13800138000",
  "idNumber": "110101199001011234",
  "password": "yourPassword123",
  "email": "zhangsan@example.com",
  "emailCode": "586923",
  "address": "北京市朝阳区某某街道",
  "height": 175.5,
  "weight": 70.0,
  "bloodType": "A",
  "maritalStatus": "已婚",
  "careerType": "IT从业者",
  "nation": "汉族",
  "workUnit": "某某科技公司",
  "dateOfBirth": "1990-01-01T00:00:00",
  "emergencyContact": "李四",
  "emergencyContactPhone": "13900139000",
  "insuranceStatus": "正常",
  "insuranceCardNumber": "1234567890"
}
```

### 必填字段

| 参数名 | 类型 | 校验规则 | 说明 |
|--------|------|----------|------|
| patientName | String | `@NotBlank` | 患者姓名 |
| gender | Gender(枚举) | `@NotNull` | 性别，可选值：`male` / `female` |
| age | Integer | `@NotNull` | 年龄 |
| phone | String | `@NotBlank` `@Pattern(^1[3-9]\d{9}$)` | 11位手机号 |
| idNumber | String | `@NotBlank` `@Pattern(身份证正则)` | 18位身份证号 |
| password | String | `@NotBlank` | 密码（服务端 MD5 + 盐值加密后存储） |
| email | String | `@NotBlank` `@Email` | 邮箱地址，需与发送验证码时使用的邮箱一致 |
| emailCode | String | `@NotBlank` | 6位数字邮箱验证码 |

### 可选字段

| 参数名 | 类型 | 校验规则 | 说明 |
|--------|------|----------|------|
| address | String | - | 联系地址 |
| height | BigDecimal | - | 身高（cm） |
| weight | BigDecimal | - | 体重（kg） |
| bloodType | String | - | 血型 |
| maritalStatus | String | - | 婚姻状况 |
| careerType | String | - | 职业类型 |
| nation | String | - | 民族 |
| workUnit | String | - | 工作单位 |
| dateOfBirth | LocalDateTime | - | 出生日期，ISO 8601 格式 |
| emergencyContact | String | - | 紧急联系人姓名 |
| emergencyContactPhone | String | `@Pattern(^1[3-9]\d{9}$)` | 紧急联系人电话 |
| insuranceStatus | String | - | 保险状态 |
| insuranceCardNumber | String | - | 保险卡号 |

**成功响应**:

```json
{
  "code": 200,
  "msg": "注册成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "patientId": "1893456789012345678",
    "patientName": "张三",
    "phone": "13800138000"
  }
}
```

**响应数据结构说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| token | String | Sa-Token 认证令牌，后续请求需在请求头中携带 `satoken: <token>` |
| patientId | String | 系统生成的患者唯一 ID |
| patientName | String | 患者姓名 |
| phone | String | 注册手机号 |

**错误响应**:

验证码错误:
```json
{
  "code": 500,
  "msg": "验证码错误",
  "data": null
}
```

验证码过期:
```json
{
  "code": 500,
  "msg": "验证码已过期或不存在，请重新获取",
  "data": null
}
```

验证尝试次数过多（每日 ≤ 5 次）:
```json
{
  "code": 500,
  "msg": "验证尝试次数过多，请明天再试",
  "data": null
}
```

手机号已注册:
```json
{
  "code": 500,
  "msg": "手机号 '13800138000' 已被注册",
  "data": null
}
```

身份证号已使用:
```json
{
  "code": 500,
  "msg": "身份证号 '110101199001011234' 已被使用",
  "data": null
}
```

邮箱已注册:
```json
{
  "code": 500,
  "msg": "邮箱 'zhangsan@example.com' 已被注册",
  "data": null
}
```

**注意事项**:
- `email` 字段必须与调用 `/send-email-code` 时使用的邮箱完全一致，否则验证码校验将失败
- 验证码校验成功后立即从 Redis 中删除，无法复用
- 注册成功后自动执行登录，无需再调用登录接口
- 手机号、身份证号、邮箱三者均需全局唯一

---

## 安全机制

### 验证码安全策略

| 策略 | 规则 | 说明 |
|------|------|------|
| 验证码有效期 | 5 分钟（300 秒） | 超时后验证码自动从 Redis 过期删除 |
| 发送频率限制 | 同一邮箱 60 秒 / 次 | 防止短时间内大量请求消耗邮件配额 |
| 暴力破解防护 | 同一邮箱每日最多 5 次错误尝试 | 每日零点自动重置（Redis TTL 24h） |
| 一次性消费 | 验证成功后立即删除 | 同一验证码不可重复使用 |
| 覆盖机制 | 重新发送时覆盖旧验证码 | 旧验证码立即失效，以最后一次为准 |

### Redis Key 设计

| Key 模式 | 示例 | 值 | TTL | 用途 |
|----------|------|----|-----|------|
| `email:verify:code:{email}` | `email:verify:code:test@example.com` | `586923` | 300s | 验证码存储 |
| `email:verify:rate:{email}` | `email:verify:rate:test@example.com` | `1` | 60s | 发送频率限制 |
| `email:verify:attempt:{email}` | `email:verify:attempt:test@example.com` | `3` | 86400s | 错误尝试计数 |

---

## 错误码参考

| 错误码 (errorCode) | 消息 | 触发场景 |
|---------------------|------|----------|
| `EMAIL_RATE_LIMITED` | 发送过于频繁，请稍后再试 | 60 秒内重复调用 `/send-email-code` |
| `EMAIL_CODE_EXPIRED` | 验证码已过期或不存在，请重新获取 | 注册时验证码已过期或从未发送 |
| `EMAIL_CODE_INCORRECT` | 验证码错误 | 注册时输入的验证码与存储的不匹配 |
| `EMAIL_TOO_MANY_ATTEMPTS` | 验证尝试次数过多，请明天再试 | 同一邮箱当日错误尝试超过 5 次 |
| `EMAIL_SEND_FAILED` | 邮件发送失败：{reason} | SMTP 服务异常（不影响接口返回，异步发送） |
| _(无 errorCode)_ | 手机号 '{phone}' 已被注册 | 注册时手机号重复 |
| _(无 errorCode)_ | 身份证号 '{idNumber}' 已被使用 | 注册时身份证号重复 |
| _(无 errorCode)_ | 邮箱 '{email}' 已被注册 | 注册时邮箱重复 |

---

## 前端集成示例

### 发送验证码

```javascript
// 1. 发送验证码
const sendCode = async (email) => {
  const res = await fetch('/api/app/base/send-email-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  const data = await res.json();
  if (data.code === 200) {
    // 开始 60 秒倒计时，禁用发送按钮
    startCountdown(60);
  } else {
    showError(data.msg);
  }
};
```

### 注册

```javascript
// 2. 提交注册
const register = async (form) => {
  const res = await fetch('/api/app/base/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patientName: form.name,
      gender: form.gender,
      age: form.age,
      phone: form.phone,
      idNumber: form.idNumber,
      password: form.password,
      email: form.email,
      emailCode: form.emailCode
      // ...其他可选字段
    })
  });
  const data = await res.json();
  if (data.code === 200) {
    // 保存 token，跳转首页
    localStorage.setItem('satoken', data.data.token);
    router.push('/home');
  } else {
    showError(data.msg);
  }
};
```
