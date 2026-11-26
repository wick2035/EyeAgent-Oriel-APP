# EyeAgent Oriel

**A uni-app client for eye health**, with interfaces and integrations for AI consultations, appointments, health records, and patient services.

[简体中文](README.md) · [License](LICENSE) · [API documentation](docs/)

> This repository primarily contains the client. Complete workflows require a compatible backend and relevant third-party services. Some data is mocked and some features remain incomplete. AI output and sample content are not a substitute for diagnosis or treatment by a qualified clinician.

## Features

| Area | Pages and capabilities |
| --- | --- |
| Accounts and patients | Sign-in, registration, profile, and family patient management |
| AI consultations | Conversations, history, and streaming API integration |
| Appointments | Hospitals, departments, doctors, bookings, and details |
| Cloud hospital | Online consultation, remote follow-up, and video meeting pages |
| Health management | Health records, eye health data, visits, medication reminders, and eye exercises |
| Messages and information | Notifications, doctor chat, health articles, and comments |
| Other services | Medicine listings, orders, surgery progress, settings, and chat data migration |

These are pages and integration points in the repository, not a guarantee that every workflow is fully operational. Health articles use mock data; online consultation has a mock doctor fallback; some entry points, including search, are still under development. Check the implementation and the [pending backend API list](docs/后端待实现接口清单.md); that document may lag behind the code.

## Stack and requirements

- [uni-app](https://uniapp.dcloud.net.cn/) and Vue 3, using the HBuilderX project structure and conditional compilation.
- JavaScript and Vue single-file components, with `uni.request`, local storage, and WebSocket.
- npm dependencies include `elliptic` and `node-forge`; `uni_modules/` contains uni-app modules used by the project.
- `manifest.json` configures App, H5, and several mini-program targets. Native capabilities and third-party services vary by platform and configuration and need platform-specific verification.

## Getting started

### Prerequisites

1. Install [HBuilderX](https://www.dcloud.io/hbuilderx.html) with uni-app support. For native App development, prepare an Android device/emulator or an iOS device and the relevant development environment.
2. Install Node.js and npm. No Node version is specified in the repository; use a version compatible with your HBuilderX installation.
3. Prepare a compatible backend reachable from the target device. Backend source and deployment instructions are not included here.

### Install and run

```bash
git clone https://github.com/wick2035/eyeagent-app.git
cd eyeagent-app
npm ci
```

1. Import the project root from a local directory in HBuilderX.
2. Set the `development` and `production` `baseUrl` values in `utils/config.js` to your backend. Both default to a local example address; configure an accessible backend before use.
3. Use HBuilderX's Run menu to launch in a browser or on a connected device/emulator. When a physical device connects to a backend on your computer, use an address reachable from that device rather than the device's own `localhost`.
4. Sign in or register using the backend. `MOCK_MODE` in `utils/api/user.js` defaults to `false`; it can be enabled for local testing, but mock login does not replace backend functionality.

There are no npm development, build, or working test scripts in this repository: `npm test` is a failing placeholder. Use HBuilderX to run and build; native distribution also requires platform certificates, signing, and service configuration. Browser use requires appropriate backend CORS settings; an HTTPS page cannot directly call an insecure HTTP service.

## Configuration and APIs

- **Requests:** `utils/config.js` selects an environment using `process.env.NODE_ENV` and defaults to development; the timeout is 30 seconds. `utils/api/request.js` adds `satoken` and the selected patient's `X-Patient-Id`. An HTTP 401 clears the login state and returns to sign-in.
- **Real-time connections:** The notification WebSocket derives its URL from the base URL by converting `http` / `https` to `ws` / `wss`, with path `/ws/app/notify`. For doctor chat, see `utils/chatWebSocket.js` and `docs/app-e2ee-chat-api.md`.
- **Platform setup:** Review app identifiers, permissions, push, location, maps, speech, and distribution settings in `manifest.json`. Camera, photos, microphone, location, and notifications require platform permissions and suitable privacy descriptions; some features also need service configuration.
- **Production:** Use trusted HTTPS/WSS services and review privacy, data storage, permissions, and applicable healthcare requirements before handling real data. The client contains chat encryption code; independently review its implementation, backend, security properties, and scope.

See [`docs/`](docs/) for API material, including [AI streaming](docs/AI流式对话API.md), [notifications](docs/notification-api.md), [encrypted chat](docs/app-e2ee-chat-api.md), and [orders](docs/订单系统API文档.md). Documentation reflects different stages of development; verify contracts against the current client and backend. Much of the existing API documentation is in Chinese.

## Project structure

```text
├── pages/           Pages and business flows
├── components/      Reusable UI components
├── store/           Business state and local data
├── utils/           APIs, configuration, WebSocket, cryptography, and helpers
├── static/          Icons, fonts, audio, and static assets
├── uni_modules/     uni-app modules
├── docs/            API and development documentation
├── App.vue          Application entry and lifecycle
├── main.js          Vue initialization
├── pages.json       Page, navigation, and tab bar configuration
├── manifest.json    Platform capabilities and distribution configuration
└── unpackage/res/   App icon assets (other build output is not tracked)
```

## Troubleshooting

- **Sign-in or requests fail:** Check the backend URL, device network, API compatibility, and account. For browsers, also check CORS and mixed-content restrictions.
- **Notifications do not update:** Verify backend WebSocket support, proxy/network upgrade support, and login state.
- **Native capabilities are unavailable:** Check platform modules, permissions, service configuration, and device authorization. Browsers and emulators may not support every capability.
- **A page displays sample content:** Some modules use mock data or fallback logic. Inspect the relevant `utils/api/` and `store/` implementations and the pending API list.

## Contributing

Please use [Issues](https://github.com/wick2035/eyeagent-app/issues) for bugs and suggestions, and Pull Requests for code or documentation. Include reproduction steps or the reason for a change, verify behavior on the relevant platforms, and avoid committing credentials, personal data, or unrelated build output. Preserve third-party copyright and license notices.

## License

This project is licensed under the [Apache License 2.0](LICENSE). Third-party dependencies, modules, and assets may have their own licenses. See [third-party notices and provenance](THIRD_PARTY_NOTICES.md) for items that still require permission or verification before redistribution.
