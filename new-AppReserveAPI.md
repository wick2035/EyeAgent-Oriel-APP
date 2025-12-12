# App 预约相关 API 文档

## 概述

App 端预约相关接口，提供医生空闲时间查询、预约医生、医院列表查询、医院医生列表查询等功能。

- **Base URL**: `/api/app/base`
- **认证方式**: Sa-Token (需在请求头中携带 `satoken`)
- **权限要求**: 所有接口需要登录 (`@SaCheckLogin`)

---

## 目录

1. [获取医生空闲时间](#1-获取医生空闲时间)
2. [预约医生](#2-预约医生)
3. [获取患者预约列表](#3-获取患者预约列表)
4. [取消预约](#4-取消预约)
5. [分页查询医院信息](#5-分页查询医院信息)
6. [分页查询医院下的医生](#6-分页查询医院下的医生)

---

## 通用响应结构

所有接口返回 `SaResult` 格式：

```json
{
  "code": 200,
  "msg": "ok",
  "data": { ... }
}
```

### 分页响应结构

分页接口返回额外的分页信息：

```json
{
  "code": 200,
  "msg": "success",
  "data": [ ... ],
  "pageNum": 1,
  "pageSize": 10,
  "total": 100,
  "pages": 10
}
```

### 错误响应示例

```json
{
  "code": 500,
  "msg": "错误信息",
  "data": null
}
```

---

## 1. 获取医生空闲时间

查询指定医生未来 3 天的空闲预约时间段。

**请求**

```
GET /api/app/base/doctor-free-time
```

**权限要求**: 需要登录

**请求头**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| satoken | String | 是 | 用户认证 Token |

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| doctorId | String | 是 | 医生ID |

**响应体结构**

返回未来 3 天（包含今天）每天的空闲时间槽位列表。

| 参数 | 类型 | 说明 |
|------|------|------|
| date | String | 日期 (格式: yyyy-MM-dd) |
| hourlySlots | Array\<HourlySlot\> | 每小时预约槽位列表 |

**HourlySlot 结构**

| 参数 | 类型 | 说明 |
|------|------|------|
| startTime | String | 开始时间 (格式: HH:mm:ss)，可能是非整点（如 08:30:00） |
| endTime | String | 结束时间 (格式: HH:mm:ss)，可能是非整点（如 11:30:00） |
| capacity | Integer | 剩余可预约位置数 |
| canReserve | Boolean | 是否可预约（容量>0 且当前患者在该时段无预约时为 true） |
| agendaId | String | 当前患者在该时段的预约ID，无预约时为 null |

**响应示例**

```json
{
  "code": 200,
  "msg": "success",
  "data": [
    {
      "date": "2025-12-10",
      "hourlySlots": [
        {
          "startTime": "08:30:00",
          "endTime": "09:00:00",
          "capacity": 2,
          "canReserve": true,
          "agendaId": null
        },
        {
          "startTime": "09:00:00",
          "endTime": "10:00:00",
          "capacity": 4,
          "canReserve": false,
          "agendaId": "550e8400-e29b-41d4-a716-446655440010"
        },
        {
          "startTime": "10:00:00",
          "endTime": "11:00:00",
          "capacity": 5,
          "canReserve": true,
          "agendaId": null
        },
        {
          "startTime": "11:00:00",
          "endTime": "11:30:00",
          "capacity": 2,
          "canReserve": true,
          "agendaId": null
        }
      ]
    },
    {
      "date": "2025-12-11",
      "hourlySlots": [
        {
          "startTime": "08:30:00",
          "endTime": "09:00:00",
          "capacity": 2,
          "canReserve": true,
          "agendaId": null
        },
        {
          "startTime": "09:00:00",
          "endTime": "10:00:00",
          "capacity": 5,
          "canReserve": true,
          "agendaId": null
        }
      ]
    },
    {
      "date": "2025-12-12",
      "hourlySlots": []
    }
  ]
}
```

**错误码**

| 错误信息 | 说明 |
|----------|------|
| 医生不存在 | 指定的 doctorId 不存在 |
| 医生不可预约 | 医生未开启预约功能 |
| 医生未配置工作时间 | 医生未设置工作日或工作时间段 |

**cURL 示例**

```bash
curl -X GET 'http://localhost:8081/api/app/base/doctor-free-time?doctorId=DOC001' \
  -H 'satoken: your-token-here'
```

---

## 2. 预约医生

患者预约指定医生在指定时间的就诊。

**请求**

```
POST /api/app/base/reserve-doctor
```

**权限要求**: 需要登录

**请求头**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| satoken | String | 是 | 用户认证 Token |

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| doctorId | String | 是 | 医生ID |
| time | String | 是 | 预约时间 (ISO 8601 格式: yyyy-MM-ddTHH:mm:ss) |

**注意事项**
- 预约时间会自动对齐到整点，例如传入 `2025-12-10T09:30:00` 会被处理为 `09:00` 这个小时段
- 预约时间不能早于当前时间
- 系统会自动在该小时内找到第一个可用的时间段进行预约

**响应体结构**

| 参数 | 类型 | 说明 |
|------|------|------|
| data | Agenda | 预约日程对象 |
| position | Integer | 当前预约是该时段的第几个（从1开始） |

**Agenda 结构**

| 参数 | 类型 | 说明 |
|------|------|------|
| id | String | 日程ID (UUID) |
| userId | String | 医生ID |
| patientId | String | 患者ID |
| patientName | String | 患者姓名 |
| title | String | 日程标题 |
| classify | String | 日程分类 |
| startTime | String | 开始时间 |
| endTime | String | 结束时间 |
| resolved | Boolean | 是否已完成 |
| status | String | 日程状态 |
| category | String | 日程类别 |
| createTime | String | 创建时间 |
| updateTime | String | 更新时间 |

**日程分类枚举 (classify)**

| 值 | 说明 |
|------|------|
| normal | 普通日程 |
| operation | 手术日程 |

**日程状态枚举 (status)**

| 值 | 说明 |
|------|------|
| PENDING | 待诊断 |
| IN_PROGRESS | 正在诊断 |
| COMPLETED | 完成诊断 |

**响应示例**

```json
{
  "code": 200,
  "msg": "预约成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440010",
    "userId": "DOC001",
    "patientId": "PAT001",
    "patientName": "张三",
    "title": "患者 张三 预约就诊",
    "classify": "normal",
    "startTime": "2025-12-10T09:00:00",
    "endTime": "2025-12-10T09:20:00",
    "resolved": false,
    "status": "PENDING",
    "category": "APPOINTMENT",
    "createTime": "2025-12-10T08:30:00",
    "updateTime": "2025-12-10T08:30:00"
  },
  "position": 3
}
```

**position 说明**
- 表示当前预约是该时段的第几个预约（从1开始）
- 例如 `position: 3` 表示该小时段内已有2个预约，当前是第3个

**错误码**

| 错误信息 | 说明 |
|----------|------|
| 预约时间无效 | 预约时间早于当前时间 |
| 患者不存在 | 当前登录用户不是有效患者 |
| 医生不存在 | 指定的 doctorId 不存在 |
| 医生不可预约 | 医生未开启预约功能 |
| 非工作日 | 预约日期不是医生的工作日 |
| 非工作时间 | 预约时间不在医生的工作时间内 |
| 无可用时段 | 该时间段已满，无法预约 |
| 预约失败 | 系统保存预约信息失败 |

**cURL 示例**

```bash
curl -X POST 'http://localhost:8081/api/app/base/reserve-doctor?doctorId=DOC001&time=2025-12-10T09:00:00' \
  -H 'satoken: your-token-here'
```

---

## 3. 获取患者预约列表

获取当前登录患者的所有未来预约记录，包含医生和医院的详细信息。

**请求**

```
GET /api/app/base/patient-reserve-time
```

**权限要求**: 需要登录

**请求头**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| satoken | String | 是 | 用户认证 Token |

**请求参数**: 无

**响应体结构 (PatientReserveResponse)**

返回患者未来的预约列表（按开始时间升序排列），包含医生和医院信息。

| 参数 | 类型 | 说明 |
|------|------|------|
| reserveId | String | 预约ID (UUID) |
| startTime | String | 预约开始时间 |
| endTime | String | 预约结束时间 |
| status | String | 预约状态 (PENDING/IN_PROGRESS/COMPLETED) |
| patientName | String | 患者姓名 |
| queuePosition | Integer | 排队位置（同一医生同一小时内的顺序，从1开始） |
| doctorId | String | 医生ID |
| doctorName | String | 医生姓名 |
| doctorTitle | String | 医生职称 |
| doctorSpecialty | String | 医生专长 |
| department | String | 科室 |
| doctorAvatarUrl | String | 医生头像URL (可为空) |
| consultationRoom | String | 就诊室 (可为空) |
| hospitalId | String | 医院ID |
| hospitalName | String | 医院名称 |
| hospitalAddress | String | 医院地址 |
| hospitalLevel | String | 医院等级 |

**响应示例**

```json
{
  "code": 200,
  "msg": "success",
  "data": [
    {
      "reserveId": "550e8400-e29b-41d4-a716-446655440010",
      "startTime": "2025-12-12T09:00:00",
      "endTime": "2025-12-12T09:20:00",
      "status": "PENDING",
      "patientName": "张三",
      "queuePosition": 3,
      "doctorId": "DOC001",
      "doctorName": "李明",
      "doctorTitle": "主任医师",
      "doctorSpecialty": "白内障手术、青光眼治疗",
      "department": "眼科",
      "doctorAvatarUrl": "https://example.com/avatar/doc001.jpg",
      "consultationRoom": "A101",
      "hospitalId": "550e8400-e29b-41d4-a716-446655440001",
      "hospitalName": "北京协和医院",
      "hospitalAddress": "东城区帅府园1号",
      "hospitalLevel": "三级甲等"
    },
    {
      "reserveId": "550e8400-e29b-41d4-a716-446655440011",
      "startTime": "2025-12-15T14:00:00",
      "endTime": "2025-12-15T14:30:00",
      "status": "PENDING",
      "patientName": "张三",
      "queuePosition": 1,
      "doctorId": "DOC002",
      "doctorName": "王芳",
      "doctorTitle": "副主任医师",
      "doctorSpecialty": "近视矫正、眼底病变",
      "department": "眼科",
      "doctorAvatarUrl": "https://example.com/avatar/doc002.jpg",
      "consultationRoom": "B203",
      "hospitalId": "550e8400-e29b-41d4-a716-446655440002",
      "hospitalName": "北京同仁医院",
      "hospitalAddress": "东城区东交民巷1号",
      "hospitalLevel": "三级甲等"
    }
  ]
}
```

**cURL 示例**

```bash
curl -X GET 'http://localhost:8081/api/app/base/patient-reserve-time' \
  -H 'satoken: your-token-here'
```

---

## 4. 取消预约

患者取消已有的预约记录。

**请求**

```
POST /api/app/base/cancel-reserve
```

**权限要求**: 需要登录

**请求头**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| satoken | String | 是 | 用户认证 Token |
| Content-Type | String | 是 | application/json |

**请求体**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| reserveId | String | 是 | 预约ID (从获取预约列表接口获得) |

**请求体示例**

```json
{
  "reserveId": "550e8400-e29b-41d4-a716-446655440010"
}
```

**响应示例**

```json
{
  "code": 200,
  "msg": "success",
  "data": null
}
```

**错误码**

| 错误信息 | 说明 |
|----------|------|
| 预约不存在 | 指定的 reserveId 不存在 |
| 删除预约信息失败 | 系统删除预约记录失败 |

**cURL 示例**

```bash
curl -X POST 'http://localhost:8081/api/app/base/cancel-reserve' \
  -H 'satoken: your-token-here' \
  -H 'Content-Type: application/json' \
  -d '{
    "reserveId": "550e8400-e29b-41d4-a716-446655440010"
  }'
```

---

## 5. 分页查询医院信息

分页查询医院列表，支持按医院名称模糊搜索。

**请求**

```
GET /api/app/base/page-hospital-info
```

**权限要求**: 需要登录

**请求头**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| satoken | String | 是 | 用户认证 Token |

**查询参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| pageNum | Integer | 否 | 1 | 页码 |
| pageSize | Integer | 否 | 10 | 每页数量 |
| searchKey | String | 否 | - | 搜索关键字（按医院名称模糊匹配） |

**响应体结构 (Hospital)**

| 参数 | 类型 | 说明 |
|------|------|------|
| id | String | 医院ID (UUID) |
| hospitalName | String | 医院名称 |
| organizationCode | String | 机构码 |
| province | String | 省份 |
| city | String | 城市 |
| address | String | 详细地址 |
| logoUrl | String | Logo URL (可为空) |
| hospitalType | String | 医院类型 |
| hospitalLevel | String | 医院等级 |
| star | BigDecimal | 星级评分 (可为空) |
| createTime | String | 创建时间 |
| updateTime | String | 更新时间 |

**医院类型枚举 (hospitalType)**

| 值 | 说明 |
|------|------|
| 综合医院 | 综合医院 |
| 专科医院 | 专科医院 |

**医院等级枚举 (hospitalLevel)**

| 值 | 说明 |
|------|------|
| 三级特等 | 三级特等医院 |
| 三级甲等 | 三级甲等医院 |
| 三级乙等 | 三级乙等医院 |
| 三级丙等 | 三级丙等医院 |
| 二级甲等 | 二级甲等医院 |
| 二级乙等 | 二级乙等医院 |
| 二级丙等 | 二级丙等医院 |
| 一级甲等 | 一级甲等医院 |
| 一级乙等 | 一级乙等医院 |
| 一级丙等 | 一级丙等医院 |
| 未定级 | 未定级医院 |

**响应示例**

```json
{
  "code": 200,
  "msg": "success",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "hospitalName": "北京协和医院",
      "organizationCode": "ORG001",
      "province": "北京市",
      "city": "北京市",
      "address": "东城区帅府园1号",
      "logoUrl": "https://example.com/logo1.png",
      "hospitalType": "综合医院",
      "hospitalLevel": "三级甲等",
      "star": 4.9,
      "createTime": "2025-01-01T00:00:00",
      "updateTime": "2025-12-01T10:00:00"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "hospitalName": "北京同仁医院",
      "organizationCode": "ORG002",
      "province": "北京市",
      "city": "北京市",
      "address": "东城区东交民巷1号",
      "logoUrl": "https://example.com/logo2.png",
      "hospitalType": "综合医院",
      "hospitalLevel": "三级甲等",
      "star": 4.8,
      "createTime": "2025-01-01T00:00:00",
      "updateTime": "2025-12-01T10:00:00"
    }
  ],
  "pageNum": 1,
  "pageSize": 10,
  "total": 50,
  "pages": 5
}
```

**cURL 示例**

```bash
# 获取第一页医院列表
curl -X GET 'http://localhost:8081/api/app/base/page-hospital-info?pageNum=1&pageSize=10' \
  -H 'satoken: your-token-here'

# 按关键字搜索医院
curl -X GET 'http://localhost:8081/api/app/base/page-hospital-info?pageNum=1&pageSize=10&searchKey=协和' \
  -H 'satoken: your-token-here'
```

---

## 6. 分页查询医院下的医生

分页查询指定医院下已激活的医生列表。

**请求**

```
GET /api/app/base/page-doctor-by-hospital
```

**权限要求**: 需要登录

**请求头**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| satoken | String | 是 | 用户认证 Token |

**查询参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| pageNum | Integer | 否 | 1 | 页码 |
| pageSize | Integer | 否 | 10 | 每页数量 |
| hospitalId | String | 是 | - | 医院ID |

**响应体结构 (Doctor)**

| 参数 | 类型 | 说明 |
|------|------|------|
| id | String | 医生ID (UUID) |
| name | String | 医生姓名 |
| hospitalArea | String | 医院/科室 |
| title | String | 职称 |
| gender | String | 性别 |
| age | Integer | 年龄 |
| phoneNumber | String | 联系电话 |
| specialty | String | 专长 |
| createTime | String | 创建时间 |
| updateTime | String | 更新时间 |

**性别枚举 (gender)**

| 值 | 说明 |
|------|------|
| male | 男性 |
| female | 女性 |

**响应示例**

```json
{
  "code": 200,
  "msg": "success",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440101",
      "name": "李明",
      "hospitalArea": "眼科",
      "title": "主任医师",
      "gender": "male",
      "age": 45,
      "phoneNumber": "13800138001",
      "specialty": "白内障手术、青光眼治疗",
      "createTime": "2025-01-15T09:00:00",
      "updateTime": "2025-12-01T10:00:00"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440102",
      "name": "王芳",
      "hospitalArea": "眼科",
      "title": "副主任医师",
      "gender": "female",
      "age": 38,
      "phoneNumber": "13800138002",
      "specialty": "近视矫正、眼底病变",
      "createTime": "2025-02-01T09:00:00",
      "updateTime": "2025-12-01T10:00:00"
    }
  ],
  "pageNum": 1,
  "pageSize": 10,
  "total": 15,
  "pages": 2
}
```

**cURL 示例**

```bash
curl -X GET 'http://localhost:8081/api/app/base/page-doctor-by-hospital?hospitalId=550e8400-e29b-41d4-a716-446655440001&pageNum=1&pageSize=10' \
  -H 'satoken: your-token-here'
```

---

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 200 | 成功 |
| 401 | 未登录或 Token 已过期 |
| 500 | 服务器内部错误 |

---

## 更新日志

| 版本 | 日期 | 描述 |
|------|------|------|
| 1.5.0 | 2025-12-12 | 患者预约列表接口新增 queuePosition（排队位置）、hospitalId、consultationRoom 字段 |
| 1.4.0 | 2025-12-11 | 预约医生接口返回 position 字段，表示当前预约是该时段第几个 |
| 1.3.0 | 2025-12-11 | 获取医生空闲时间接口：HourlySlot 新增 canReserve、agendaId 字段，支持非整点时间 |
| 1.2.0 | 2025-12-11 | 完善患者预约列表接口，返回医生和医院详细信息 |
| 1.1.0 | 2025-12-11 | 添加获取患者预约列表和取消预约接口文档 |
| 1.0.0 | 2025-12-10 | 初始版本 |
