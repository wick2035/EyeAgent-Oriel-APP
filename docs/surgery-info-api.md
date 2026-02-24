# 手术信息 API 文档

> Base URL: `/api/app/extra`
>
> 认证方式: Sa-Token（所有接口均需登录，请求头携带 `satoken`）

---

## 1. 获取手术列表

### 基本信息

| 项目     | 值                       |
| -------- | ------------------------ |
| 接口路径 | `GET /get-surgery-info`  |
| 认证     | 需要登录                 |

### 请求参数

无（根据当前登录用户自动查询）

### 请求示例

```
GET /api/app/extra/get-surgery-info
```

### 响应示例

```json
{
  "code": 200,
  "msg": "success",
  "data": [
    {
      "id": "s1b2c3d4e5f6",
      "agendaId": "a1b2c3d4e5f6",
      "surgeryName": "白内障超声乳化术",
      "hospitalId": "h1b2c3d4e5f6",
      "hospitalName": "北京同仁医院",
      "doctorId": "d1b2c3d4e5f6",
      "doctorName": "张医生",
      "scheduledDate": "2026-03-01T09:00:00",
      "operatingRoom": "3号手术室",
      "tableNumber": 2,
      "status": "PRE_OP"
    }
  ]
}
```

### 响应字段说明

| 字段名         | 类型          | 说明                   |
| -------------- | ------------- | ---------------------- |
| id             | String        | 手术信息 ID            |
| agendaId       | String        | 关联日程 ID            |
| surgeryName    | String        | 手术名称               |
| hospitalId     | String        | 医院 ID                |
| hospitalName   | String        | 医院名称               |
| doctorId       | String        | 医生 ID                |
| doctorName     | String        | 医生姓名               |
| scheduledDate  | LocalDateTime | 预定手术日期           |
| operatingRoom  | String        | 手术室                 |
| tableNumber    | Integer       | 手术台次               |
| status         | String        | 手术状态（见枚举参考） |

### 错误响应

| 场景       | msg                    |
| ---------- | ---------------------- |
| 服务异常   | 获取手术信息失败: ... |

### 说明

- 返回当前患者所有手术记录，按预定手术日期升序排列
- 批量关联查询医院名称和医生姓名，未关联时对应字段为 `null`

---

## 2. 获取手术详细进度

### 基本信息

| 项目     | 值                          |
| -------- | --------------------------- |
| 接口路径 | `GET /get-surgery-process`  |
| 认证     | 需要登录                    |

### 请求参数（Query）

| 字段名        | 类型   | 必填 | 说明                                |
| ------------- | ------ | ---- | ----------------------------------- |
| surgeryInfoId | String | 是   | 手术信息 ID（即列表接口返回的 `id`）|

### 请求示例

```
GET /api/app/extra/get-surgery-process?surgeryInfoId=s1b2c3d4e5f6
```

### 响应示例

```json
{
  "code": 200,
  "msg": "success",
  "data": [
    {
      "id": "p001",
      "surgeryInfoId": "s1b2c3d4e5f6",
      "name": "PRE_OP_PREPARATION",
      "status": "COMPLETED",
      "startTime": "2026-03-01T08:00:00",
      "endTime": "2026-03-01T08:45:00",
      "order": 1
    },
    {
      "id": "p002",
      "surgeryInfoId": "s1b2c3d4e5f6",
      "name": "PATIENT_ENTERING",
      "status": "COMPLETED",
      "startTime": "2026-03-01T08:45:00",
      "endTime": "2026-03-01T09:00:00",
      "order": 2
    },
    {
      "id": "p003",
      "surgeryInfoId": "s1b2c3d4e5f6",
      "name": "ANESTHESIA_START",
      "status": "IN_PROGRESS",
      "startTime": "2026-03-01T09:00:00",
      "endTime": null,
      "order": 3
    },
    {
      "id": "p004",
      "surgeryInfoId": "s1b2c3d4e5f6",
      "name": "SURGERY_START",
      "status": "PENDING",
      "startTime": null,
      "endTime": null,
      "order": 4
    }
  ]
}
```

### 响应字段说明

| 字段名        | 类型          | 说明                       |
| ------------- | ------------- | -------------------------- |
| id            | String        | 进度记录 ID                |
| surgeryInfoId | String        | 关联手术信息 ID            |
| name          | String        | 进度阶段（见枚举参考）     |
| status        | String        | 阶段状态（见枚举参考）     |
| startTime     | LocalDateTime | 开始时间（未开始时为 null） |
| endTime       | LocalDateTime | 结束时间（未结束时为 null） |
| order         | Integer       | 阶段顺序（1-9）            |

### 错误响应

| 场景             | code | msg                    |
| ---------------- | ---- | ---------------------- |
| 手术信息不存在   | 500  | 手术信息不存在         |
| 关联日程不存在   | 500  | 关联日程不存在         |
| 非本人手术       | 500  | 无权查看该手术进度     |
| 服务异常         | 500  | 获取手术进度失败: ... |

### 说明

- 每台手术固定 9 个阶段，按 `order` 升序返回
- 接口会校验当前用户是否为该手术的患者，防止越权访问

---

## 枚举参考

### SurgeryStatus（手术状态）

| 枚举值         | 说明     |
| -------------- | -------- |
| `PRE_OP`       | 术前准备 |
| `IN_OPERATION` | 手术中   |
| `POST_OP`      | 术后恢复 |
| `COMPLETED`    | 已完成   |

### SurgeryProgressPhase（进度阶段）

| 枚举值               | 顺序 | 说明             |
| -------------------- | ---- | ---------------- |
| `PRE_OP_PREPARATION` | 1    | 术前准备         |
| `PATIENT_ENTERING`   | 2    | 患者进入手术室   |
| `ANESTHESIA_START`   | 3    | 麻醉开始         |
| `SURGERY_START`      | 4    | 手术开始         |
| `SURGERY_END`        | 5    | 手术结束         |
| `ANESTHESIA_END`     | 6    | 麻醉结束         |
| `PATIENT_LEAVING`    | 7    | 患者离开手术室   |
| `POST_OP_RECOVERY`   | 8    | 术后恢复(PACU)   |
| `COMPLETED`          | 9    | 完成             |

### SurgeryProgressStatus（阶段状态）

| 枚举值        | 说明   |
| ------------- | ------ |
| `PENDING`     | 未开始 |
| `IN_PROGRESS` | 进行中 |
| `COMPLETED`   | 已完成 |
