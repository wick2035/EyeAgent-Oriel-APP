# 用药提醒 API 文档

> Base URL: `/api/app/extra`
>
> 认证方式: Sa-Token（所有接口均需登录，请求头携带 `satoken`）

---

## 1. 创建用药提醒

### 基本信息

| 项目     | 值                             |
| -------- | ------------------------------ |
| 接口路径 | `POST /create-medical-reminder` |
| 认证     | 需要登录                       |
| Content-Type | `application/json`         |

### 请求参数（Body）

| 字段名       | 类型         | 必填 | 说明                                          |
| ------------ | ------------ | ---- | --------------------------------------------- |
| title        | String       | 是   | 提醒标题                                      |
| content      | String       | 否   | 提醒内容                                      |
| medicalType  | String       | 是   | 用药类型，枚举值：`DROP`(滴剂)、`PILL`(药片)、`CAPSULE`(胶囊)、`INJECT`(注射) |
| time         | String       | 是   | 每日用药时间，格式 `HH:mm:ss`，如 `08:00:00`  |
| duration     | Integer      | 是   | 持续天数                                      |

### 请求示例

```json
{
  "title": "左氧氟沙星滴眼液",
  "content": "每次1-2滴，滴入结膜囊内",
  "medicalType": "DROP",
  "time": "08:00:00",
  "duration": 7
}
```

### 响应示例

```json
{
  "code": 200,
  "msg": "已成功添加 7 个用药提醒",
  "data": null
}
```

### 错误响应

| 场景         | msg                    |
| ------------ | ---------------------- |
| 参数校验失败 | 字段级校验错误信息     |
| 服务异常     | 创建用药提醒失败: ... |

---

## 2. 获取用药提醒

### 基本信息

| 项目     | 值                           |
| -------- | ---------------------------- |
| 接口路径 | `GET /get-medical-reminder`  |
| 认证     | 需要登录                     |

### 请求参数（Query）

| 字段名     | 类型          | 必填 | 说明                                                       |
| ---------- | ------------- | ---- | ---------------------------------------------------------- |
| isComplete | Boolean       | 否   | 完成状态过滤：`true`=已完成，`false`=未完成，不传=全部     |
| startTime  | LocalDateTime | 是   | 开始时间，ISO 格式，如 `2026-02-14T00:00:00`               |
| endTime    | LocalDateTime | 是   | 结束时间，ISO 格式，如 `2026-02-21T23:59:59`               |

### 请求示例

```
GET /api/app/extra/get-medical-reminder?startTime=2026-02-14T00:00:00&endTime=2026-02-21T23:59:59
GET /api/app/extra/get-medical-reminder?isComplete=false&startTime=2026-02-14T00:00:00&endTime=2026-02-21T23:59:59
```

### 响应示例

```json
{
  "code": 200,
  "msg": "success",
  "data": [
    {
      "id": "a1b2c3d4e5f6",
      "reminderId": "r1b2c3d4e5f6",
      "userId": "u1b2c3d4e5f6",
      "title": "左氧氟沙星滴眼液",
      "remark": "每次1-2滴，滴入结膜囊内",
      "resolved": false,
      "startTime": "2026-02-14T08:00:00",
      "endTime": "2026-02-14T08:00:00"
    }
  ]
}
```

### 响应字段说明

| 字段名     | 类型          | 说明                    |
| ---------- | ------------- | ----------------------- |
| id         | String        | 日程 ID（agendaId）     |
| reminderId | String        | 关联的提醒记录 ID       |
| userId     | String        | 用户 ID                 |
| title      | String        | 提醒标题                |
| remark     | String        | 备注/提醒内容           |
| resolved   | Boolean       | 是否已完成              |
| startTime  | LocalDateTime | 开始时间                |
| endTime    | LocalDateTime | 结束时间                |

### 错误响应

| 场景                 | msg                      |
| -------------------- | ------------------------ |
| startTime > endTime  | 获取用药提醒失败: 开始时间不能大于结束时间 |
| 服务异常             | 获取用药提醒失败: ...   |

---

## 3. 删除用药提醒

### 基本信息

| 项目     | 值                             |
| -------- | ------------------------------ |
| 接口路径 | `POST /remove-medical-reminder` |
| 认证     | 需要登录                       |
| Content-Type | `application/json`         |

### 请求参数（Body）

| 字段名      | 类型           | 必填 | 说明                  |
| ----------- | -------------- | ---- | --------------------- |
| reminderIds | List\<String\> | 是   | 要删除的提醒 ID 列表  |

### 请求示例

```json
{
  "reminderIds": [
    "r1b2c3d4e5f6",
    "r7a8b9c0d1e2"
  ]
}
```

### 响应示例

```json
{
  "code": 200,
  "msg": "已成功删除 2 个用药提醒",
  "data": null
}
```

### 错误响应

| 场景               | code | msg                    |
| ------------------ | ---- | ---------------------- |
| 列表为空           | 500  | 提醒ID列表不能为空    |
| 部分 ID 不存在     | 500  | 部分提醒不存在        |
| 包含他人的提醒     | 500  | 删除用药提醒失败: 存在不属于用户的提醒 |
| 服务异常           | 500  | 删除用药提醒失败: ... |

### 说明

- 该接口会同时删除 `reminder` 记录和关联的 `agenda` 日程记录
- 操作在事务中执行，任一步骤失败会整体回滚

---

## 4. 切换用药提醒完成状态

### 基本信息

| 项目     | 值                                    |
| -------- | ------------------------------------- |
| 接口路径 | `POST /toggle-medical-reminder-state` |
| 认证     | 需要登录                              |

### 请求参数（Query）

| 字段名   | 类型   | 必填 | 说明                        |
| -------- | ------ | ---- | --------------------------- |
| agendaId | String | 是   | 日程 ID（即获取接口返回的 `id` 字段） |

### 请求示例

```
POST /api/app/extra/toggle-medical-reminder-state?agendaId=a1b2c3d4e5f6
```

### 响应示例

```json
{
  "code": 200,
  "msg": "已标记为已完成",
  "data": null
}
```

```json
{
  "code": 200,
  "msg": "已标记为未完成",
  "data": null
}
```

### 错误响应

| 场景           | code | msg                        |
| -------------- | ---- | -------------------------- |
| 日程不存在     | 500  | 日程不存在                 |
| 非本人日程     | 500  | 无权操作该日程             |
| 服务异常       | 500  | 切换用药提醒状态失败: ... |

### 说明

- 该接口为 **toggle** 操作：已完成 → 未完成，未完成 → 已完成
- `resolved` 为 `null` 时视为未完成，切换后变为已完成

---

## 枚举参考

### MedicalType（用药类型）

| 枚举值    | 说明 |
| --------- | ---- |
| `DROP`    | 滴剂 |
| `PILL`    | 药片 |
| `CAPSULE` | 胶囊 |
| `INJECT`  | 注射 |
