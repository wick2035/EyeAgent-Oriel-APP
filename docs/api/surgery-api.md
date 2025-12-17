# 手术进度模块 API 接口文档

## 概述

本文档定义手术进度模块所需的后端接口规范，供后端开发参考。

**基础路径**: `/api/v1`

**认证方式**: Bearer Token (在请求头中携带 `Authorization: Bearer <token>`)

---

## 1. 获取手术列表

### 请求

```
GET /api/v1/surgeries
```

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| status | string | 否 | 筛选状态: PRE_OP, IN_OPERATION, POST_OP, COMPLETED |
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页条数，默认 20 |

### 响应

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "total": 2,
    "list": [
      {
        "uuid": "surgery-001",
        "surgeryName": "白内障超声乳化吸除术+人工晶体植入术",
        "hospitalName": "北京协和医院",
        "scheduledDate": "2025-01-15T09:00:00",
        "status": "PRE_OP",
        "overallProgress": 12,
        "surgeon": {
          "name": "张明",
          "title": "主任医师"
        },
        "currentPhase": {
          "name": "术前准备",
          "status": "IN_PROGRESS"
        }
      }
    ]
  }
}
```

### 响应字段说明

| 字段 | 类型 | 必返回 | 说明 |
|------|------|--------|------|
| uuid | string | **是** | 手术唯一标识符 |
| surgeryName | string | 是 | 手术名称 |
| hospitalName | string | 是 | 医院名称 |
| scheduledDate | string | 是 | 预定手术时间 (ISO 8601格式) |
| status | string | 是 | 手术状态 |
| overallProgress | number | 是 | 总体进度 (0-100) |
| surgeon | object | 是 | 主刀医生信息 |
| surgeon.name | string | 是 | 医生姓名 |
| surgeon.title | string | 是 | 医生职称 |
| currentPhase | object | 否 | 当前进行中的阶段 (已完成时为null) |
| currentPhase.name | string | 是 | 阶段名称 |
| currentPhase.status | string | 是 | 阶段状态 |

---

## 2. 获取手术详情

### 请求

```
GET /api/v1/surgeries/:uuid
```

### 路径参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| uuid | string | 是 | 手术UUID |

### 响应

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "uuid": "surgery-001",
    "surgeryName": "白内障超声乳化吸除术+人工晶体植入术",
    "hospitalName": "北京协和医院",
    "hospitalAddress": "北京市东城区帅府园1号",
    "scheduledDate": "2025-01-15T09:00:00",
    "operatingRoom": "3号手术室",
    "tableNumber": "第2台",
    "status": "IN_OPERATION",
    "overallProgress": 45,
    "surgeon": {
      "name": "张明",
      "title": "主任医师",
      "hospital": "北京协和医院"
    },
    "phases": [
      {
        "id": "phase-1",
        "name": "术前准备",
        "status": "COMPLETED",
        "startTime": "2025-01-15T08:00:00",
        "endTime": "2025-01-15T08:30:00",
        "order": 1
      },
      {
        "id": "phase-2",
        "name": "患者进入手术室",
        "status": "COMPLETED",
        "startTime": "2025-01-15T08:30:00",
        "endTime": "2025-01-15T08:35:00",
        "order": 2
      },
      {
        "id": "phase-3",
        "name": "麻醉开始",
        "status": "COMPLETED",
        "startTime": "2025-01-15T08:35:00",
        "endTime": "2025-01-15T08:45:00",
        "order": 3
      },
      {
        "id": "phase-4",
        "name": "手术开始",
        "status": "IN_PROGRESS",
        "startTime": "2025-01-15T08:45:00",
        "endTime": null,
        "order": 4
      },
      {
        "id": "phase-5",
        "name": "手术结束",
        "status": "PENDING",
        "startTime": null,
        "endTime": null,
        "order": 5
      },
      {
        "id": "phase-6",
        "name": "麻醉结束",
        "status": "PENDING",
        "startTime": null,
        "endTime": null,
        "order": 6
      },
      {
        "id": "phase-7",
        "name": "患者离开手术室",
        "status": "PENDING",
        "startTime": null,
        "endTime": null,
        "order": 7
      },
      {
        "id": "phase-8",
        "name": "术后恢复(PACU)",
        "status": "PENDING",
        "startTime": null,
        "endTime": null,
        "order": 8
      },
      {
        "id": "phase-9",
        "name": "完成",
        "status": "PENDING",
        "startTime": null,
        "endTime": null,
        "order": 9
      }
    ],
    "createdAt": "2025-01-10T10:00:00",
    "updatedAt": "2025-01-15T08:45:00"
  }
}
```

### 响应字段说明

#### 基础信息

| 字段 | 类型 | 必返回 | 说明 |
|------|------|--------|------|
| uuid | string | **是** | 手术唯一标识符 |
| surgeryName | string | 是 | 手术名称 |
| hospitalName | string | 是 | 医院名称 |
| hospitalAddress | string | 否 | 医院地址 |
| scheduledDate | string | 是 | 预定手术时间 (ISO 8601) |
| operatingRoom | string | 否 | 手术室 |
| tableNumber | string | 否 | 手术台次 (如 "第2台") |
| status | string | 是 | 手术状态 |
| overallProgress | number | 是 | 总体进度 (0-100) |
| createdAt | string | 是 | 创建时间 |
| updatedAt | string | 是 | 最后更新时间 |

#### 主刀医生信息 (surgeon)

| 字段 | 类型 | 必返回 | 说明 |
|------|------|--------|------|
| name | string | 是 | 医生姓名 |
| title | string | 是 | 职称 (主任医师/副主任医师/主治医师等) |
| hospital | string | 是 | 所属医院 |

#### 手术阶段信息 (phases)

| 字段 | 类型 | 必返回 | 说明 |
|------|------|--------|------|
| id | string | 是 | 阶段ID |
| name | string | 是 | 阶段名称 |
| status | string | 是 | 阶段状态: PENDING/IN_PROGRESS/COMPLETED |
| startTime | string | 否 | 开始时间 (未开始时为null) |
| endTime | string | 否 | 结束时间 (未结束时为null) |
| order | number | 是 | 阶段顺序 (1-9) |

---

## 3. 枚举值定义

### 手术状态 (status)

| 值 | 说明 | 前端配色 |
|----|------|----------|
| PRE_OP | 术前准备 | #3B82F6 (医疗蓝) |
| IN_OPERATION | 手术中 | #3FD2C2 (青绿色) |
| POST_OP | 术后恢复 | #14B8A6 (薄荷绿) |
| COMPLETED | 已完成 | #10B981 (医疗绿) |

### 阶段状态 (phase status)

| 值 | 说明 |
|----|------|
| PENDING | 未开始 |
| IN_PROGRESS | 进行中 |
| COMPLETED | 已完成 |

### 手术阶段 (固定9个阶段)

| 顺序 | 阶段名称 | 说明 |
|------|----------|------|
| 1 | 术前准备 | 患者术前检查、准备 |
| 2 | 患者进入手术室 | 患者被送入手术室 |
| 3 | 麻醉开始 | 麻醉医生开始麻醉 |
| 4 | 手术开始 | 主刀医生开始手术 |
| 5 | 手术结束 | 手术操作完成 |
| 6 | 麻醉结束 | 麻醉药物停止，患者苏醒 |
| 7 | 患者离开手术室 | 患者被转出手术室 |
| 8 | 术后恢复(PACU) | 在恢复室观察 |
| 9 | 完成 | 整个手术流程结束 |

---

## 4. 错误码

| code | message | 说明 |
|------|---------|------|
| 0 | success | 成功 |
| 401 | unauthorized | 未授权，需要登录 |
| 403 | forbidden | 无权限访问该手术信息 |
| 404 | surgery not found | 手术不存在 |
| 500 | internal server error | 服务器内部错误 |

### 错误响应示例

```json
{
  "code": 404,
  "message": "surgery not found",
  "data": null
}
```

---

## 5. WebSocket 实时推送 (可选)

如需实现手术状态实时更新，可提供 WebSocket 接口：

### 连接

```
ws://api.example.com/ws/surgery/:uuid
```

### 推送消息格式

```json
{
  "type": "PHASE_UPDATE",
  "data": {
    "uuid": "surgery-001",
    "status": "IN_OPERATION",
    "overallProgress": 55,
    "currentPhase": {
      "id": "phase-5",
      "name": "手术结束",
      "status": "IN_PROGRESS",
      "startTime": "2025-01-15T09:30:00"
    },
    "updatedAt": "2025-01-15T09:30:00"
  }
}
```

### 消息类型 (type)

| 类型 | 说明 |
|------|------|
| PHASE_UPDATE | 阶段状态更新 |
| STATUS_CHANGE | 手术整体状态变更 |
| SURGERY_COMPLETE | 手术完成 |

---

## 6. 注意事项

1. **UUID 必返回**: 所有接口响应中，`uuid` 字段为必返回字段
2. **时间格式**: 所有时间字段使用 ISO 8601 格式 (如 `2025-01-15T09:00:00`)
3. **进度计算**: `overallProgress` 由后端根据已完成阶段数计算，范围 0-100
4. **阶段顺序**: phases 数组按 order 字段升序排列
5. **权限控制**: 用户只能查看自己关联的手术信息
6. **数据安全**: 涉及患者隐私，需确保接口安全性

---

## 7. 前端数据映射示例

```javascript
// store/surgery.js 中的数据转换
function mapApiToLocal(apiData) {
  return {
    id: apiData.uuid,  // 前端使用 id，对应后端 uuid
    surgeryName: apiData.surgeryName,
    hospitalName: apiData.hospitalName,
    scheduledDate: apiData.scheduledDate,
    status: apiData.status,
    overallProgress: apiData.overallProgress,
    surgeon: apiData.surgeon,
    phases: apiData.phases.map(p => ({
      id: p.id,
      name: p.name,
      status: p.status,
      time: p.startTime || p.endTime || null
    }))
  }
}
```
