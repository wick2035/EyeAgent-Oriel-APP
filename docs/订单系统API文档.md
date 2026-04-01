# 订单系统 API 文档

> 版本: v1.0.0
> 更新时间: 2026-04-01
> 作者: chengyiyang

---

## 目录

- [概述](#概述)
- [通用说明](#通用说明)
- [枚举定义](#枚举定义)
- [接口列表](#接口列表)
  - [药品浏览](#药品浏览)
    - [1. 分页浏览药品](#1-分页浏览药品)
    - [2. 药品详情](#2-药品详情)
  - [购物车](#购物车)
    - [3. 获取购物车列表](#3-获取购物车列表)
    - [4. 加入购物车](#4-加入购物车)
    - [5. 修改购物车数量](#5-修改购物车数量)
    - [6. 批量删除购物车项](#6-批量删除购物车项)
    - [7. 购物车商品数量](#7-购物车商品数量)
  - [订单](#订单)
    - [8. 从购物车创建订单](#8-从购物车创建订单)
    - [9. 支付订单](#9-支付订单)
    - [10. 取消订单](#10-取消订单)
    - [11. 确认收货](#11-确认收货)
    - [12. 订单列表](#12-订单列表)
    - [13. 订单详情](#13-订单详情)
- [数据模型](#数据模型)
  - [Drugs 药品信息](#drugs-药品信息)
  - [CartItemVO 购物车项](#cartitemvo-购物车项)
  - [OrderListVO 订单列表项](#orderlistvo-订单列表项)
  - [OrderDetailVO 订单详情](#orderdetailvo-订单详情)
  - [OrderItemVO 订单明细项](#orderitemvo-订单明细项)
- [业务流程](#业务流程)
- [错误码](#错误码)

---

## 概述

药品订单系统为患者端 App 提供以下功能：

- **药品浏览**：分页查看非处方药（OTC）列表，查看药品详情
- **购物车管理**：加入购物车（同药品自动合并）、修改数量、删除、查看角标数量
- **自选下单**：从购物车选中项创建订单，模拟支付，确认收货
- **处方订单**：查看医生为自己创建的处方订单，支付处方订单
- **订单管理**：按状态筛选订单列表，查看订单详情，取消未支付订单

---

## 通用说明

### 基础路径

```
/api/app/drugs    — 药品浏览
/api/app/cart     — 购物车
/api/app/order    — 订单
```

### 认证方式

所有接口需要登录，在请求头携带 Sa-Token：

```http
satoken: <your_token>
```

未携带 Token 或 Token 过期时返回：

```json
{
  "code": 401,
  "msg": "未提供登录凭证，请先登录",
  "data": null
}
```

### 统一响应格式

```json
{
  "code": 200,
  "msg": "success",
  "data": { ... }
}
```

业务异常时 `code` 为 `400`，`msg` 包含具体错误信息。

---

## 枚举定义

### OrderStatus 订单状态

| 值 | 说明 | 前端展示建议 |
|----|------|-------------|
| `PENDING_PAYMENT` | 待支付 | 显示支付按钮、取消按钮、倒计时 |
| `PAID` | 已支付（待自取） | 显示确认收货按钮 |
| `COMPLETED` | 已完成（已自取） | 无操作按钮 |
| `CANCELLED` | 已取消 | 灰色状态 |
| `EXPIRED` | 已过期（超时自动关闭） | 灰色状态 |

### OrderType 订单类型

| 值 | 说明 |
|----|------|
| `PRESCRIPTION` | 处方订单（医生创建） |
| `SELF_PURCHASE` | 自选订单（患者自购） |

### PaymentMethod 支付方式

| 值 | 说明 |
|----|------|
| `MOCK` | 模拟支付（当前） |
| `WECHAT` | 微信支付（预留） |
| `ALIPAY` | 支付宝（预留） |

---

## 接口列表

## 药品浏览

### 1. 分页浏览药品

仅返回**非处方药**且**有库存**的药品。

**请求**

```http
GET /api/app/drugs/page
```

| 参数名 | 位置 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|------|--------|------|
| `drugName` | Query | String | 否 | - | 模糊搜索药品名称 |
| `drugCategory` | Query | String | 否 | - | 精确筛选药品分类 |
| `pageNum` | Query | Integer | 否 | 1 | 页码 |
| `pageSize` | Query | Integer | 否 | 10 | 每页数量 |

**响应**

```json
{
  "code": 200,
  "msg": "success",
  "data": [
    {
      "id": "b6beafc32cdef7fa39bada705f41ff90",
      "drugId": "EYD0010",
      "drugName": "羟丙甲纤维素滴眼液",
      "drugCategory": "人工泪液",
      "drugSpecification": "15ml/支",
      "drugDosageForm": "滴眼液",
      "manufacturer": "Allergan",
      "price": 25.00,
      "stockQuantity": 620,
      "isPrescriptionDrug": false,
      "drugDescription": "用于缓解眼干症状..."
    }
  ],
  "total": 1,
  "pageNum": 1,
  "pages": 1
}
```

---

### 2. 药品详情

**请求**

```http
GET /api/app/drugs/detail
```

| 参数名 | 位置 | 类型 | 必填 | 说明 |
|--------|------|------|------|------|
| `drugId` | Query | String | 是 | 药品 ID（UUID 主键） |

**响应**

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "id": "b6beafc32cdef7fa39bada705f41ff90",
    "drugId": "EYD0010",
    "drugName": "羟丙甲纤维素滴眼液",
    "drugCategory": "人工泪液",
    "drugSpecification": "15ml/支",
    "drugDosageForm": "滴眼液",
    "manufacturer": "Allergan",
    "batchNumber": "BN20250921",
    "expiryDate": "2027-03-15T00:00:00",
    "price": 25.00,
    "stockQuantity": 620,
    "isPrescriptionDrug": false,
    "drugStatus": "active",
    "insuranceCategory": "乙类",
    "warningInfo": null,
    "drugDescription": "用于缓解眼干症状..."
  }
}
```

**错误**

| 场景 | code | msg |
|------|------|-----|
| 药品不存在 | 400 | `药品不存在: <drugId>` |

---

## 购物车

### 3. 获取购物车列表

返回当前用户的购物车列表，包含药品信息和小计金额。

**请求**

```http
GET /api/app/cart/list
```

无额外参数。

**响应**

```json
{
  "code": 200,
  "msg": "success",
  "data": [
    {
      "id": "39660bafb95e5f7b0d5e4941947b0cc5",
      "drugId": "b6beafc32cdef7fa39bada705f41ff90",
      "drugName": "羟丙甲纤维素滴眼液",
      "drugSpecification": "15ml/支",
      "price": 25.00,
      "quantity": 2,
      "subtotal": 50.00,
      "stockQuantity": 620,
      "isPrescriptionDrug": false
    }
  ]
}
```

> **前端提示**：当 `quantity > stockQuantity` 时应提示用户库存不足。

---

### 4. 加入购物车

将药品加入购物车。如果购物车中已有同一药品，**自动合并数量**。处方药不允许加入购物车。

**请求**

```http
POST /api/app/cart/add
Content-Type: application/json
```

**请求体**

```json
{
  "drugId": "b6beafc32cdef7fa39bada705f41ff90",
  "quantity": 2
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `drugId` | String | 是 | 药品 ID（UUID 主键） |
| `quantity` | Integer | 是 | 数量，最小值 1 |

**响应**

```json
{
  "code": 200,
  "msg": "success",
  "data": null
}
```

**错误**

| 场景 | code | msg |
|------|------|-----|
| 药品不存在 | 400 | `药品不存在: <drugId>` |
| 处方药 | 400 | `处方药需由医生开具处方，不可自行购买` |

---

### 5. 修改购物车数量

**请求**

```http
PUT /api/app/cart/update-quantity
Content-Type: application/json
```

**请求体**

```json
{
  "cartItemId": "39660bafb95e5f7b0d5e4941947b0cc5",
  "quantity": 5
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `cartItemId` | String | 是 | 购物车项 ID |
| `quantity` | Integer | 是 | 新数量，最小值 1 |

**响应**

```json
{
  "code": 200,
  "msg": "success",
  "data": null
}
```

**错误**

| 场景 | code | msg |
|------|------|-----|
| 购物车项不存在 | 400 | `购物车项不存在: <id>` |
| 不属于当前用户 | 400 | `无权操作该购物车项` |

---

### 6. 批量删除购物车项

**请求**

```http
DELETE /api/app/cart/remove
Content-Type: application/json
```

**请求体**

```json
{
  "cartItemIds": [
    "39660bafb95e5f7b0d5e4941947b0cc5",
    "abc123..."
  ]
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `cartItemIds` | String[] | 是 | 要删除的购物车项 ID 列表 |

**响应**

```json
{
  "code": 200,
  "msg": "success",
  "data": null
}
```

---

### 7. 购物车商品数量

用于购物车角标显示。返回购物车中**不同药品的种类数**（非总件数）。

**请求**

```http
GET /api/app/cart/count
```

**响应**

```json
{
  "code": 200,
  "msg": "success",
  "data": 3
}
```

---

## 订单

### 8. 从购物车创建订单

选中购物车中的若干项，一次性创建订单。创建成功后：
- 选中的购物车项自动清除
- 药品库存被扣减
- 订单状态为 `PENDING_PAYMENT`
- 未支付订单将在 **24 小时**后自动关闭并归还库存

**请求**

```http
POST /api/app/order/create-from-cart
Content-Type: application/json
```

**请求体**

```json
{
  "cartItemIds": [
    "39660bafb95e5f7b0d5e4941947b0cc5"
  ],
  "remark": "备注信息（可选）"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `cartItemIds` | String[] | 是 | 选中的购物车项 ID 列表 |
| `remark` | String | 否 | 订单备注 |

**响应**

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "id": "af9106e2a1ba8ebbad981ca11aea9527",
    "orderNo": "2026040119100200001",
    "patientId": "8edf8a2f2a7fde206767f4c10316aafa",
    "orderType": "SELF_PURCHASE",
    "prescriptionId": null,
    "doctorId": null,
    "totalAmount": 200.00,
    "orderStatus": "PENDING_PAYMENT",
    "paymentMethod": null,
    "paidTime": null,
    "expireTime": "2026-04-02T19:10:14",
    "remark": null
  }
}
```

**错误**

| 场景 | code | msg |
|------|------|-----|
| 购物车项为空 | 400 | `购物车项不存在: 选中项为空` |
| 不属于当前用户 | 400 | `无权操作该购物车项` |
| 库存不足 | 400 | `药品库存不足: <药品名称>` |

---

### 9. 支付订单

模拟支付，调用即成功。仅 `PENDING_PAYMENT` 状态的订单可支付。

**请求**

```http
POST /api/app/order/pay
```

| 参数名 | 位置 | 类型 | 必填 | 说明 |
|--------|------|------|------|------|
| `orderId` | Query | String | 是 | 订单 ID |

**响应**

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "id": "af9106e2a1ba8ebbad981ca11aea9527",
    "orderNo": "2026040119100200001",
    "orderType": "SELF_PURCHASE",
    "totalAmount": 200.00,
    "orderStatus": "PAID",
    "paymentMethod": "MOCK",
    "paidTime": "2026-04-01T19:10:14"
  }
}
```

**错误**

| 场景 | code | msg |
|------|------|-----|
| 订单不存在 | 400 | `订单不存在: <orderId>` |
| 不属于当前用户 | 400 | `无权操作该订单` |
| 非待支付状态 | 400 | `当前订单状态为「已支付」，无法执行「支付」操作` |

---

### 10. 取消订单

取消未支付的订单，库存自动归还。仅 `PENDING_PAYMENT` 状态可取消。

**请求**

```http
POST /api/app/order/cancel
```

| 参数名 | 位置 | 类型 | 必填 | 说明 |
|--------|------|------|------|------|
| `orderId` | Query | String | 是 | 订单 ID |

**响应**

```json
{
  "code": 200,
  "msg": "success",
  "data": null
}
```

**错误**

| 场景 | code | msg |
|------|------|-----|
| 非待支付状态 | 400 | `当前订单状态为「已支付」，无法执行「取消」操作` |

---

### 11. 确认收货

患者到院自取后确认收货。仅 `PAID` 状态可确认。

**请求**

```http
POST /api/app/order/confirm-receive
```

| 参数名 | 位置 | 类型 | 必填 | 说明 |
|--------|------|------|------|------|
| `orderId` | Query | String | 是 | 订单 ID |

**响应**

```json
{
  "code": 200,
  "msg": "success",
  "data": null
}
```

**错误**

| 场景 | code | msg |
|------|------|-----|
| 非已支付状态 | 400 | `当前订单状态为「待支付」，无法执行「确认收货」操作` |

---

### 12. 订单列表

分页查询当前用户的订单列表，支持按状态筛选。按创建时间倒序排列。

**请求**

```http
GET /api/app/order/list
```

| 参数名 | 位置 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|------|--------|------|
| `status` | Query | String | 否 | - | 筛选状态：`PENDING_PAYMENT` / `PAID` / `COMPLETED` / `CANCELLED` / `EXPIRED` |
| `pageNum` | Query | Integer | 否 | 1 | 页码 |
| `pageSize` | Query | Integer | 否 | 10 | 每页数量 |

**响应**

```json
{
  "code": 200,
  "msg": "success",
  "data": [
    {
      "id": "af9106e2a1ba8ebbad981ca11aea9527",
      "orderNo": "2026040119100200001",
      "orderType": "SELF_PURCHASE",
      "totalAmount": 200.00,
      "orderStatus": "COMPLETED",
      "createTime": "2026-04-01T19:10:14",
      "expireTime": "2026-04-02T19:10:14",
      "itemCount": 1,
      "firstDrugName": "羟丙甲纤维素滴眼液"
    },
    {
      "id": "c7b2f1e3...",
      "orderNo": "2026040119100100003",
      "orderType": "PRESCRIPTION",
      "totalAmount": 77.00,
      "orderStatus": "PAID",
      "createTime": "2026-04-01T19:10:35",
      "expireTime": "2026-04-02T19:10:35",
      "itemCount": 1,
      "firstDrugName": "玻璃酸钠滴眼液"
    }
  ],
  "total": 2,
  "pageNum": 1,
  "pages": 1
}
```

> **前端提示**：
> - `firstDrugName` + `itemCount` 可用于列表卡片展示，如 "羟丙甲纤维素滴眼液 等1件"
> - `PENDING_PAYMENT` 状态建议结合 `expireTime` 显示倒计时

---

### 13. 订单详情

获取订单完整信息及所有订单明细项。

**请求**

```http
GET /api/app/order/detail
```

| 参数名 | 位置 | 类型 | 必填 | 说明 |
|--------|------|------|------|------|
| `orderId` | Query | String | 是 | 订单 ID |

**响应**

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "id": "af9106e2a1ba8ebbad981ca11aea9527",
    "orderNo": "2026040119100200001",
    "orderType": "SELF_PURCHASE",
    "prescriptionId": null,
    "doctorId": null,
    "totalAmount": 200.00,
    "orderStatus": "COMPLETED",
    "paymentMethod": "MOCK",
    "paidTime": "2026-04-01T19:10:14",
    "expireTime": "2026-04-02T19:10:14",
    "remark": null,
    "createTime": "2026-04-01T19:10:14",
    "items": [
      {
        "drugId": "b6beafc32cdef7fa39bada705f41ff90",
        "drugName": "羟丙甲纤维素滴眼液",
        "drugSpecification": "15ml/支",
        "quantity": 8,
        "unitPrice": 25.00,
        "subtotal": 200.00
      }
    ]
  }
}
```

> **处方订单特有字段**：`prescriptionId` 和 `doctorId` 仅在 `orderType=PRESCRIPTION` 时有值。

---

## 数据模型

### Drugs 药品信息

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | String | 药品 UUID 主键 |
| `drugId` | String | 药品业务编号（如 EYD0010） |
| `drugName` | String | 药品名称 |
| `drugCategory` | String | 药品分类 |
| `drugSpecification` | String | 规格 |
| `drugDosageForm` | String | 剂型 |
| `manufacturer` | String | 生产厂家 |
| `batchNumber` | String | 批号 |
| `expiryDate` | DateTime | 过期日期 |
| `price` | Decimal | 单价 |
| `stockQuantity` | Integer | 库存数量 |
| `isPrescriptionDrug` | Boolean | 是否处方药 |
| `drugStatus` | String | 药品状态 |
| `insuranceCategory` | String | 医保类别 |
| `warningInfo` | String | 警告信息 |
| `drugDescription` | String | 药品描述 |

### CartItemVO 购物车项

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | String | 购物车项 ID |
| `drugId` | String | 药品 ID |
| `drugName` | String | 药品名称 |
| `drugSpecification` | String | 规格 |
| `price` | Decimal | 当前单价 |
| `quantity` | Integer | 数量 |
| `subtotal` | Decimal | 小计（price × quantity） |
| `stockQuantity` | Integer | 当前库存 |
| `isPrescriptionDrug` | Boolean | 是否处方药 |

### OrderListVO 订单列表项

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | String | 订单 ID |
| `orderNo` | String | 订单编号（19 位数字） |
| `orderType` | String | 订单类型枚举 |
| `totalAmount` | Decimal | 总金额 |
| `orderStatus` | String | 订单状态枚举 |
| `createTime` | DateTime | 创建时间 |
| `expireTime` | DateTime | 过期时间 |
| `itemCount` | Integer | 药品种类数 |
| `firstDrugName` | String | 首个药品名称（列表展示用） |

### OrderDetailVO 订单详情

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | String | 订单 ID |
| `orderNo` | String | 订单编号 |
| `orderType` | String | 订单类型枚举 |
| `prescriptionId` | String? | 处方 ID（处方订单时有值） |
| `doctorId` | String? | 医生 ID（处方订单时有值） |
| `totalAmount` | Decimal | 总金额 |
| `orderStatus` | String | 订单状态枚举 |
| `paymentMethod` | String? | 支付方式（支付后有值） |
| `paidTime` | DateTime? | 支付时间（支付后有值） |
| `expireTime` | DateTime | 过期时间 |
| `remark` | String? | 备注 |
| `createTime` | DateTime | 创建时间 |
| `items` | OrderItemVO[] | 订单明细列表 |

### OrderItemVO 订单明细项

| 字段 | 类型 | 说明 |
|------|------|------|
| `drugId` | String | 药品 ID |
| `drugName` | String | 药品名称（下单时快照） |
| `drugSpecification` | String? | 规格（下单时快照） |
| `quantity` | Integer | 数量 |
| `unitPrice` | Decimal | 单价（下单时快照） |
| `subtotal` | Decimal | 小计 |

---

## 业务流程

### 自选购买流程

```
浏览药品 → 加入购物车 → 管理购物车 → 选中结算
  → 创建订单(PENDING_PAYMENT)
    → 支付(PAID) → 到院自取 → 确认收货(COMPLETED)
    → 取消(CANCELLED) → 库存归还
    → 24小时未支付 → 自动过期(EXPIRED) → 库存归还
```

### 处方订单流程

```
医生开处方 → 医生发送订单 → 患者App收到订单(PENDING_PAYMENT)
  → 患者支付(PAID) → 到院自取 → 确认收货(COMPLETED)
  → 24小时未支付 → 自动过期(EXPIRED)
```

### 订单状态流转图

```
                ┌──── 用户取消 ───→ CANCELLED
                │
PENDING_PAYMENT ├──── 支付成功 ───→ PAID ──── 确认收货 ───→ COMPLETED
                │
                └──── 超时24h ────→ EXPIRED
```

---

## 错误码

| 错误码 | 说明 | 触发场景 |
|--------|------|---------|
| `DRUG_NOT_FOUND` | 药品不存在 | 查询/加购不存在的药品 |
| `PRESCRIPTION_DRUG_NOT_ALLOWED` | 处方药不可自购 | 将处方药加入购物车 |
| `DRUG_OUT_OF_STOCK` | 库存不足 | 创建订单时药品库存不够 |
| `CART_ITEM_NOT_FOUND` | 购物车项不存在 | 操作不存在的购物车项 |
| `CART_ITEM_ACCESS_DENIED` | 无权操作购物车 | 操作他人的购物车项 |
| `ORDER_NOT_FOUND` | 订单不存在 | 查询/操作不存在的订单 |
| `ORDER_ACCESS_DENIED` | 无权操作订单 | 操作他人的订单 |
| `ORDER_STATUS_INVALID` | 订单状态不允许 | 对非法状态执行操作（如重复支付） |
| `PAYMENT_FAILED` | 支付失败 | 支付服务返回失败 |
