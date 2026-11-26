# EyeAgent

**面向眼健康场景的 uni-app 客户端**，提供 AI 问诊、预约就诊、健康档案与患者服务等界面和对接能力。

[English](README.en.md) · [许可证](LICENSE) · [接口文档](docs/)

> 本仓库主要包含客户端，完整业务依赖兼容的后端及相关第三方服务。项目包含模拟数据和待完成的功能；AI 输出及示例内容不能替代专业医生的诊断或治疗。

## 功能概览

| 模块 | 页面和能力 |
| --- | --- |
| 用户与就诊人 | 登录、注册、个人资料、家庭就诊人管理 |
| AI 问诊 | 对话、历史记录及流式对话接口对接 |
| 预约就诊 | 医院、科室、医生、预约和详情 |
| 云上医院 | 在线咨询、远程复诊、视频会议页面 |
| 健康管理 | 健康档案、眼部健康数据、就诊记录、用药提醒、护眼锻炼 |
| 消息与资讯 | 通知、医生对话、健康资讯和评论 |
| 其他服务 | 药品展示、订单、手术进度、设置与聊天数据迁移 |

这些条目描述仓库中的页面及对接代码，不代表各功能均已端到端上线。健康资讯使用模拟数据；在线咨询有模拟医生数据回退；部分搜索等入口尚在开发。具体状态请结合代码和 [后端待实现接口清单](docs/后端待实现接口清单.md) 核实，该文档可能滞后于代码。

## 技术栈与运行环境

- [uni-app](https://uniapp.dcloud.net.cn/) + Vue 3，使用 HBuilderX 项目结构及条件编译。
- JavaScript、Vue 单文件组件，使用 `uni.request`、本地存储和 WebSocket。
- npm 依赖包括 `elliptic` 和 `node-forge`；`uni_modules/` 包含项目使用的 uni-app 模块。
- `manifest.json` 配置了 App、H5 和若干小程序目标；原生能力和第三方服务的可用性因平台及配置而异，需逐个平台验证。

## 快速开始

### 准备

1. 安装 [HBuilderX](https://www.dcloud.io/hbuilderx.html) 及其 uni-app 相关支持；运行 App 时准备 Android 设备/模拟器或 iOS 设备及对应开发环境。
2. 安装 Node.js 与 npm。仓库没有声明 Node 版本，建议使用与所安装 HBuilderX 兼容的版本。
3. 准备与客户端接口兼容、设备可访问的后端。后端源码和部署步骤不在本仓库中。

### 安装并运行

```bash
git clone https://github.com/wick2035/eyeagent-app.git
cd eyeagent-app
npm ci
```

1. 用 HBuilderX 的「文件 → 导入 → 从本地目录导入」打开项目根目录。
2. 修改 `utils/config.js` 中 `development` 和 `production` 的 `baseUrl`，指向自己的后端。当前两者都配置了项目已有的远程 HTTP 地址；不要假设该服务可用，也不要向不受信任的服务发送个人或医疗数据。
3. 在 HBuilderX 中选择「运行」，运行到浏览器或连接的手机/模拟器。真机访问本机后端时，请使用设备可访问的地址，而不是设备自身的 `localhost`。
4. 使用后端提供的账号登录或注册。`utils/api/user.js` 的 `MOCK_MODE` 默认为 `false`；本地测试可自行启用，但模拟登录不能替代后端功能。

本仓库没有 npm 开发、构建或有效测试脚本：`npm test` 只是占位并会失败。请通过 HBuilderX 运行和发行；原生打包还需要相应的平台证书、签名及服务配置。浏览器运行涉及跨域，需在后端正确配置 CORS；HTTPS 页面也不能直接请求不安全的 HTTP 服务。

## 配置与接口

- **请求配置**：`utils/config.js` 通过 `process.env.NODE_ENV` 选择环境，默认开发环境；超时为 30 秒。`utils/api/request.js` 为请求添加 `satoken` 和当前就诊人的 `X-Patient-Id`，HTTP 401 时清除登录状态并跳转登录页。
- **实时连接**：通知 WebSocket 从基础地址将 `http` / `https` 转为 `ws` / `wss`，路径为 `/ws/app/notify`。医生聊天另见 `utils/chatWebSocket.js` 与 `docs/app-e2ee-chat-api.md`。
- **平台配置**：在 `manifest.json` 中检查应用标识、权限、推送、定位、地图、语音和打包配置。相机、相册、麦克风、定位与通知等能力需要平台授权及适当的隐私说明；部分功能还需配置对应服务。
- **生产环境**：请使用受信任的 HTTPS/WSS 服务，核对隐私、数据存储、权限和医疗合规要求后再处理真实数据。客户端包含聊天加密相关代码，具体安全属性和适用范围应结合实现及后端独立审查。

接口资料见 [`docs/`](docs/)，包括 [AI 流式对话](docs/AI流式对话API.md)、[通知接口](docs/notification-api.md)、[加密聊天](docs/app-e2ee-chat-api.md) 和 [订单系统](docs/订单系统API文档.md)。文档记录了不同时期的接口约定，接入时以当前客户端和后端实现为准。

## 目录结构

```text
├── pages/           页面与业务流程
├── components/      可复用 UI 组件
├── store/           业务状态与本地数据
├── utils/           API、配置、WebSocket、加密与工具函数
├── static/          图标、字体、音频和静态资源
├── uni_modules/     uni-app 模块
├── docs/            接口及开发资料
├── App.vue          应用入口与生命周期
├── main.js          Vue 应用初始化
├── pages.json       页面、导航与 tabBar 配置
├── manifest.json    平台能力和发行配置
└── unpackage/       HBuilderX 构建及资源输出
```

## 常见问题

- **登录或请求失败**：检查后端地址、设备网络、接口兼容性和账号；浏览器还需检查 CORS 与混合内容限制。
- **通知不更新**：确认后端支持通知 WebSocket、网络及代理允许升级连接，并检查登录状态。
- **原生能力不可用**：检查目标平台的模块、权限、服务配置和设备授权；浏览器与模拟器可能不支持全部能力。
- **页面出现示例内容**：部分模块仍使用模拟数据或回退逻辑，请检查对应 `utils/api/`、`store/` 实现及接口清单。

## 参与贡献

欢迎通过 [Issues](https://github.com/wick2035/eyeagent-app/issues) 报告问题、提出建议，或通过 Pull Request 贡献代码和文档。提交前请说明复现步骤或变更目的，验证相关平台的行为，避免提交凭据、个人信息及无关构建产物。涉及第三方素材或依赖时，请保留其原有许可和版权声明。

## 许可证

本项目采用 [Apache License 2.0](LICENSE)。第三方依赖、模块及素材可能适用各自的许可证；使用和再分发前请分别核查。
