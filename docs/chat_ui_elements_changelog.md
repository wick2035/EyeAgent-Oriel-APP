# Chat 接口 UI Elements 变更说明（前端适配指南）

本次变更为 `/api/chat` 接口新增了 `ui_elements` 字段，使 HealthAgent、ReminderAgent、ReportAgent 在患者模式下也能返回交互选项（OPTIONS 选择框）。

## 一、受影响的接口

| 接口 | 是否变化 | 说明 |
| --- | --- | --- |
| `POST /api/chat` | **有变化** | 响应新增 `ui_elements` 字段 |
| `POST /api/chat/stream` | **有变化** | 新增 `ui_elements` SSE 事件 |
| `POST /api/recommendation/chat` | 无变化 | 仅内部重构，输出格式不变 |
| `POST /api/recommendation/chat/stream` | 无变化 | 仅内部重构，输出格式不变 |

---

## 二、`/api/chat` 同步接口 — 改前 vs 改后

### 改前

```json
{
  "response": "您好！请问您有什么眼科相关的问题需要咨询？",
  "session_id": "sess_abc123",
  "conversation_id": "xxx-xxx",
  "is_completed": false,
  "stage": "greeting",
  "agent_type": "health",
  "metadata": {
    "patient_id": "550e8400-...",
    "role": "patient",
    "thread_id": "...",
    "version": "langgraph"
  }
}
```

- 没有 `ui_elements` 字段
- `response` 是纯文本

### 改后（无选项时）

```json
{
  "response": "您好！请问您有什么眼科相关的问题需要咨询？",
  "session_id": "sess_abc123",
  "conversation_id": "xxx-xxx",
  "is_completed": false,
  "stage": "greeting",
  "agent_type": "health",
  "ui_elements": null,
  "metadata": {
    "patient_id": "550e8400-...",
    "role": "patient",
    "thread_id": "...",
    "version": "langgraph"
  }
}
```

- 新增了 `ui_elements` 字段，值为 `null`
- 其余字段完全不变

### 改后（有选项时）

```json
{
  "response": "您好！我是您的健康助手。请问您遇到了什么眼部问题？",
  "session_id": "sess_abc123",
  "conversation_id": "xxx-xxx",
  "is_completed": false,
  "stage": "greeting",
  "agent_type": "health",
  "ui_elements": {
    "ui_type": "options",
    "options": [
      {
        "option_id": "opt_1",
        "label": "眼睛干涩/疲劳",
        "value": "dry_eye",
        "description": "眼睛感觉干涩、酸胀、易疲劳",
        "icon": "eye-drop"
      },
      {
        "option_id": "opt_2",
        "label": "近视相关",
        "value": "myopia",
        "description": "视力下降、近视加深等问题"
      },
      {
        "option_id": "opt_3",
        "label": "眼睛红肿/充血",
        "value": "red_eye",
        "description": "眼白发红、有异物感"
      },
      {
        "option_id": "opt_4",
        "label": "眼睛瘙痒/异物感",
        "value": "itchy_eye",
        "description": "眼睛发痒、流泪"
      },
      {
        "option_id": "opt_5",
        "label": "其他症状",
        "value": "other",
        "description": "以上都不是，我有其他问题"
      }
    ]
  },
  "metadata": { ... }
}
```

关键变化：

- `ui_elements.ui_type` 固定为 `"options"`（chat 接口不会返回 `"product_cards"`）
- `response` 中的 `[OPTIONS]...[/OPTIONS]` 标记已被移除，是干净的纯文本
- `description` 和 `icon` 可能为 `null`（可选字段）

---

## 三、`/api/chat/stream` SSE 接口 — 改前 vs 改后

### 改前的事件序列

```text
data: {"event": "start", "session_id": "...", ...}

data: {"event": "token", "content": "您"}
data: {"event": "token", "content": "好"}
data: {"event": "token", "content": "！"}
...

data: {"event": "done", "response": "您好！...", "agent_type": "health", "stage": "greeting", "session_id": "...", "conversation_id": "..."}
```

### 改后的事件序列（有选项时）

```text
data: {"event": "start", "session_id": "...", ...}

data: {"event": "token", "content": "您"}
data: {"event": "token", "content": "好"}
...

data: {"event": "ui_elements", "ui_type": "options", "options": [...]}

data: {"event": "done", "response": "您好！...", "agent_type": "health", "stage": "greeting", "session_id": "...", "conversation_id": "...", "ui_elements": {"ui_type": "options", "options": [...]}}
```

变化点：

| 事件 | 改前 | 改后 |
| --- | --- | --- |
| `ui_elements` 事件 | 不存在 | **新增**，在 `done` 之前发送 |
| `done` 事件 | 无 `ui_elements` 字段 | **新增** `ui_elements` 字段（有选项时） |
| `done.response` | 可能包含 `[OPTIONS]` 原始标记 | 标记已清除，是干净文本 |

无选项时：不发送 `ui_elements` 事件，`done` 中也没有 `ui_elements` 字段，和改前一致。

---

## 四、`/api/recommendation/chat` 接口

**无变化**。输出格式、字段结构完全一致。仅内部将解析代码重构到了共享模块，不影响输入输出。

---

## 五、前端适配指南

### 5.1 最小改动（兼容处理）

如果前端只想兼容而不渲染选项，只需确保新字段不报错：

```javascript
// 忽略 ui_elements 即可，它是 null 时不会影响现有逻辑
const data = await response.json();
console.log(data.response);  // 正常使用，不受影响
```

### 5.2 完整适配（渲染选项）

```javascript
const data = await response.json();

// 显示文字
renderText(data.response);

// 渲染选项（如果有）
if (data.ui_elements && data.ui_elements.ui_type === "options") {
  renderOptions(data.ui_elements.options);
}
```

### 5.3 SSE 流式适配

```javascript
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);

  switch (data.event) {
    case "token":
      appendText(data.content);
      break;

    case "ui_elements":
      // 新增：渲染选项
      if (data.ui_type === "options") {
        renderOptions(data.options);
      }
      break;

    case "done":
      finalizeResponse(data.response);
      // 可选：从 done 中也能拿到 ui_elements
      if (data.ui_elements) {
        renderOptions(data.ui_elements.options);
      }
      break;
  }
};
```

### 5.4 选项点击回传

用户点击选项后，将 `option.value` 作为用户消息发回：

```javascript
function onOptionClick(option) {
  sendMessage({
    message: option.value,      // 如 "dry_eye"
    session_id: currentSessionId,
    conversation_id: currentConversationId,
    patient_id: patientId,
    agent_type: currentAgentType,
    role: "patient"
  });
}
```

### 5.5 TypeScript 接口更新

如果前端使用 TypeScript，需要更新接口定义：

```typescript
// 新增
interface OptionItem {
  option_id: string;
  label: string;
  value: string;
  description?: string | null;
  icon?: string | null;
}

interface UIElements {
  ui_type: "options" | "product_cards" | "none";
  options?: OptionItem[] | null;
  product_cards?: any[] | null;  // 仅 recommendation 接口使用
}

// 更新 ChatResponse
interface ChatResponse {
  response: string;
  session_id: string;
  conversation_id: string | null;
  is_completed: boolean;
  stage: string;
  agent_type: string;
  ui_elements: UIElements | null;  // ← 新增
  metadata: Record<string, any>;
}
```

---

## 六、各 Agent OPTIONS 场景一览

### HealthAgent（仅患者模式）

| 对话阶段 | 是否返回 OPTIONS | 选项内容 |
| --- | --- | --- |
| greeting / health_consultation | 是 | 眼睛干涩/疲劳、近视相关、眼睛红肿/充血、眼睛瘙痒/异物感、其他症状 |
| appointment_inquiry | 是 | 是，我想预约 / 暂不需要 |
| 医院/日期/时间选择 | **否** | 用文字对话收集 |
| 症状详细描述 | **否** | 用文字对话收集 |

### ReminderAgent（仅患者模式）

| 对话阶段 | 是否返回 OPTIONS | 选项内容 |
| --- | --- | --- |
| greeting / select_action | 是 | 查看提醒 / 创建提醒 / 管理设置 |
| create_reminder（选提醒类型） | 是 | 用药提醒 / 复诊提醒 / 预约提醒 / 体检提醒 |
| create_reminder（选药品剂型） | 是 | 滴剂(DROP) / 药片(PILL) / 胶囊(CAPSULE) / 注射(INJECT) |
| 时间/药品名/天数输入 | **否** | 用文字对话收集 |

### ReportAgent（仅患者模式）

| 对话阶段 | 是否返回 OPTIONS | 选项内容 |
| --- | --- | --- |
| greeting / select_action | 是 | 处方记录 / 就诊历史 / 检查对比 |
| 具体病历记录选择 | **否** | 展示列表让患者指定 |

### 医生模式

所有 Agent 的医生模式**不返回 OPTIONS**，即使 LLM 误输出了 `[OPTIONS]` 标记，路由层也不会解析（直接忽略）。

---

## 七、`ui_elements` 字段完整类型说明

```text
ui_elements: null | {
  ui_type: "options" | "product_cards" | "none",
  options: null | [
    {
      option_id: string,       // 选项唯一ID
      label: string,           // 按钮显示文本
      value: string,           // 点击后发回AI的值
      description: string?,    // 补充说明（可选）
      icon: string?            // 图标标识（可选）
    }
  ],
  product_cards: null          // chat 接口始终为 null（仅 recommendation 接口使用）
}
```

- `/api/chat` 接口：`ui_type` 只会是 `"options"` 或不返回（`ui_elements = null`）
- `/api/recommendation/chat` 接口：`ui_type` 可以是 `"options"` 或 `"product_cards"`
