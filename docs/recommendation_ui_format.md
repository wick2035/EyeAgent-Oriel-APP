# 药品推荐 AI 前端 UI 适配文档

## 一、API 响应总体结构

接口返回 `RecommendationChatResponse`，结构如下：

```json
{
  "response": "AI的纯文本回复内容（已清除标记）",
  "session_id": "会话ID",
  "conversation_id": "数据库会话ID（可选）",
  "is_completed": false,
  "stage": "当前对话阶段",
  "agent_type": "recommendation",
  "ui_elements": {
    "ui_type": "product_cards | options | none",
    "product_cards": [],
    "options": []
  },
  "metadata": {}
}
```

前端核心逻辑：根据 `ui_elements.ui_type` 决定渲染哪种组件。

| ui_type | 渲染方式 |
|---------|---------|
| `product_cards` | 渲染药品卡片列表 |
| `options` | 渲染可点击选项按钮组 |
| `none` | 仅展示 `response` 文本 |

---

## 二、药品卡片（ProductCard）

当 `ui_type = "product_cards"` 时，`product_cards` 为非空数组。

### 完整 JSON 示例

```json
{
  "ui_type": "product_cards",
  "product_cards": [
    {
      "product_id": "prod-003-levofloxacin",
      "product_name": "左氧氟沙星滴眼液",
      "generic_name": "左氧氟沙星",
      "product_type": "PRESCRIPTION",
      "category": "眼科用药",
      "image_url": "https://img.example.com/product/levofloxacin.jpg",
      "unit_price": 28.00,
      "specification": "5ml:24.4mg",
      "stock_status": "IN_STOCK",
      "indications": "细菌性结膜炎、角膜炎、泪囊炎",
      "is_prescription": true,
      "action_type": "PRESCRIBE",
      "action_label": "开具处方"
    },
    {
      "product_id": "prod-001-hyaluronate",
      "product_name": "玻璃酸钠滴眼液",
      "generic_name": "玻璃酸钠",
      "product_type": "OTC",
      "category": "眼科用药",
      "image_url": "https://img.example.com/product/hyaluronate.jpg",
      "unit_price": 32.50,
      "specification": "5ml:5mg",
      "stock_status": "IN_STOCK",
      "indications": "干眼症、角结膜上皮损伤",
      "is_prescription": false,
      "action_type": "ADD_TO_CART",
      "action_label": "加入购物车"
    }
  ],
  "options": null
}
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `product_id` | string | 是 | 产品唯一标识 |
| `product_name` | string | 是 | 产品名称（展示用） |
| `generic_name` | string \| null | 否 | 通用名 / 化学名 |
| `product_type` | string | 是 | 枚举：`PRESCRIPTION` / `OTC` / `DEVICE` |
| `category` | string | 是 | 产品分类（如"眼科用药"） |
| `image_url` | string \| null | 否 | 产品图片 URL |
| `unit_price` | float | 是 | 单价（元） |
| `specification` | string \| null | 否 | 规格（如"5ml:5mg"） |
| `stock_status` | string | 是 | 枚举：`IN_STOCK` / `LOW_STOCK` / `OUT_OF_STOCK` |
| `indications` | string \| null | 否 | 适应症描述 |
| `is_prescription` | bool | 是 | 是否为处方药 |
| `action_type` | string | 是 | 按钮行为类型，见下方枚举表 |
| `action_label` | string | 是 | 按钮显示文本 |

### action_type 枚举

| 场景 | action_type | action_label | 前端行为 |
|------|-------------|--------------|---------|
| 医生端（所有药品） | `PRESCRIBE` | `"开具处方"` | 调用处方接口 |
| 患者端（OTC 产品） | `ADD_TO_CART` | `"加入购物车"` | 调用加购接口 |
| 患者端（处方药） | `VIEW_DETAIL` | `"需医生处方"` | 跳转详情页，禁止直接购买 |

### product_type 枚举

| 值 | 含义 |
|----|------|
| `PRESCRIPTION` | 处方药 |
| `OTC` | 非处方药（可直接购买） |
| `DEVICE` | 医疗器械 |

### stock_status 枚举

| 值 | 含义 | 前端建议 |
|----|------|---------|
| `IN_STOCK` | 有货 | 按钮正常可用 |
| `LOW_STOCK` | 库存紧张 | 显示"库存紧张"提示 |
| `OUT_OF_STOCK` | 缺货 | 禁用按钮，灰显 |

---

## 三、交互选项（OptionItem）

当 `ui_type = "options"` 时，`options` 为非空数组。用于症状引导、确认操作等交互场景。

### 完整 JSON 示例

```json
{
  "ui_type": "options",
  "product_cards": null,
  "options": [
    {
      "option_id": "opt_dry_eye",
      "label": "眼睛干涩/疲劳",
      "value": "dry_eye",
      "description": "眼睛感觉干涩、酸胀、易疲劳",
      "icon": "eye-drop"
    },
    {
      "option_id": "opt_red_eye",
      "label": "眼睛红肿/充血",
      "value": "red_eye",
      "description": "眼白发红、有异物感",
      "icon": "eye-red"
    },
    {
      "option_id": "opt_itchy_eye",
      "label": "眼睛瘙痒",
      "value": "itchy_eye",
      "description": "眼睛发痒、流泪",
      "icon": "eye-itch"
    },
    {
      "option_id": "opt_other",
      "label": "其他症状",
      "value": "other",
      "description": "以上都不是，我有其他问题",
      "icon": "more"
    }
  ]
}
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `option_id` | string | 是 | 选项唯一标识 |
| `label` | string | 是 | 显示文本（按钮上的文字） |
| `value` | string | 是 | 选择后发回 AI 的值 |
| `description` | string \| null | 否 | 补充说明文字 |
| `icon` | string \| null | 否 | 图标标识符（前端自行映射图标资源） |

### 交互逻辑

用户点击选项后，将 `value` 字段的值作为用户消息内容发送回 AI 对话接口。

---

## 四、流式响应（SSE）事件格式

流式接口通过 Server-Sent Events 推送，事件类型如下：

| event 类型 | 说明 | data 内容 |
|-----------|------|-----------|
| `start` | 开始处理 | `{"session_id": "xxx"}` |
| `chunk` | 文本片段 | `{"content": "文本块"}` |
| `tool_call` | 工具调用通知 | `{"tool": "search_products", "args": {...}}` |
| `ui_elements` | UI 结构化数据 | 完整的 `UIElements` JSON 对象 |
| `done` | 完成 | 完整的 `RecommendationChatResponse` |
| `error` | 错误 | `{"message": "错误信息"}` |

### 前端处理流程

```
1. 收到 start      → 显示加载状态
2. 收到 chunk      → 逐步拼接显示文本
3. 收到 tool_call  → 可选：显示"正在查询药品..."等提示
4. 收到 ui_elements → 渲染卡片或选项组件
5. 收到 done       → 结束加载，展示完整结果
6. 收到 error      → 显示错误提示
```

---

## 五、前端适配要点

### 1. 渲染分支逻辑

```
if ui_elements.ui_type == "product_cards":
    渲染药品卡片列表
elif ui_elements.ui_type == "options":
    渲染选项按钮组
else:
    仅显示文本
```

### 2. 卡片按钮事件绑定

```
switch action_type:
    case "ADD_TO_CART":  → 调用加入购物车接口
    case "PRESCRIBE":    → 调用开具处方接口
    case "VIEW_DETAIL":  → 跳转产品详情页
```

### 3. 库存状态处理

- `OUT_OF_STOCK`：禁用操作按钮，灰显卡片
- `LOW_STOCK`：正常可操作，附加"库存紧张"标签
- `IN_STOCK`：正常展示

### 4. 处方药标识

当 `is_prescription = true` 时，建议在卡片上显示"处方药"标签（如红色角标），提醒用户该药品需要医生处方。

### 5. 选项点击回传

用户点击选项后，将 `option.value` 作为用户输入文本发送到对话接口：

```
POST /api/recommendation/chat
{
  "session_id": "当前会话ID",
  "message": "dry_eye"   // 即 option.value
}
```

---

## 六、相关源码文件

| 文件 | 用途 |
|------|------|
| `presentation/schemas/recommendation_schemas.py` | Pydantic 数据模型定义 |
| `presentation/routers/recommendation_router.py` | API 路由、标记解析逻辑 |
| `agents/prompts/recommendation_prompts.py` | AI Prompt 及标记格式定义 |
| `agents/tools/recommendation_tools.py` | 推荐工具（搜索/加购/处方） |
| `agents/graph/state.py` | 全局状态定义 |
| `agents/graph/nodes/recommendation_node.py` | Agent 节点实现 |
