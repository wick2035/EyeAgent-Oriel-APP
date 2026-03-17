## 查询 E2EE 已启用医生列表

### 基本信息

| 项目         | 说明                                                         |
| ------------ | ------------------------------------------------------------ |
| **URL**      | `GET /api/app/chat/keys/e2ee-doctors`                        |
| **认证**     | 需要登录（Header 携带 `satoken`）                            |
| **请求参数** | 无                                                           |
| **用途**     | 获取所有已上传公钥、支持 E2EE 加密聊天的医生列表，用于前端展示"可发起加密聊天"的医生 |

### 请求示例

```http
GET /api/app/chat/keys/e2ee-doctors HTTP/1.1
satoken: your-token-here
```

### 响应

#### 成功（有数据）

```json
{
  "code": 200,
  "msg": "查询成功",
  "data": [
    {
      "doctorId": "d45a035d6632ce236d0e8c363fdc5564",
      "name": "方医生",
      "title": "主任医师",
      "avatarUrl": "https://example.com/avatars/doctor1.jpg",
      "keyVersion": 3
    },
    {
      "doctorId": "a12b034c5678de90f1234567890abcde",
      "name": "李医生",
      "title": "副主任医师",
      "avatarUrl": null,
      "keyVersion": 1
    }
  ]
}
```

#### 成功（无数据）

```json
{
  "code": 200,
  "msg": "查询成功",
  "data": []
}
```

### 响应字段说明

| 字段         | 类型    | 可空 | 说明                                   |
| ------------ | ------- | ---- | -------------------------------------- |
| `doctorId`   | String  | 否   | 医生唯一 ID                            |
| `name`       | String  | 是   | 医生姓名（医生记录被删除时为 null）    |
| `title`      | String  | 是   | 职称，如"主任医师"、"副主任医师"       |
| `avatarUrl`  | String  | 是   | 头像 URL，未设置时为 null              |
| `keyVersion` | Integer | 否   | 当前生效的公钥版本号，用于后续密钥协商 |

### 前端使用场景

1. **发起新聊天页面**：调用此接口获取可发起 E2EE 聊天的医生列表
2. 用户选择医生后，用 `doctorId` 调用 `POST /api/app/chat/sessions` 创建会话
3. 用 `keyVersion` + `GET /api/app/chat/keys/DOCTOR/{doctorId}` 获取医生公钥进行 ECDH 密钥协商