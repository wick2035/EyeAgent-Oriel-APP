<script>
import { initTheme } from "@/store/theme.js";
import { initUserState, isLoggedIn, clearLoginState } from "@/store/user.js";
import {
  connect as connectWebSocket,
  disconnect as disconnectWebSocket,
} from "@/utils/websocket.js";
import { fetchUnreadNotifications } from "@/store/notification.js";
import { checkTokenValid } from "@/utils/api/user.js";
import { checkForUpdate, isUpdateDismissed } from "@/utils/version.js";

export default {
  onLaunch: function () {
    console.log("AI医问通 启动");
    // #ifdef APP-PLUS
    // 隐藏原生 tabBar（仅 App 端需要）
    uni.hideTabBar();
    // #endif
    // 初始化主题
    initTheme();
    // 初始化用户状态
    initUserState();

    // 检查登录状态
    if (isLoggedIn()) {
      // 验证token有效性
      this.verifyTokenAndEnter();
    }
  },
  onShow: function () {
    console.log("App Show");
    // App恢复前台时，检查登录状态并重连WebSocket
    if (isLoggedIn()) {
      // 延迟连接，确保组件已挂载
      setTimeout(() => {
        connectWebSocket();
        // 刷新未读通知
        fetchUnreadNotifications();
      }, 500);
    }
  },
  onHide: function () {
    console.log("App Hide");
    // App进入后台时，断开WebSocket连接
    disconnectWebSocket();
  },
  methods: {
    /**
     * 验证token并进入应用
     */
    async verifyTokenAndEnter() {
      try {
        console.log("正在验证token有效性...");

        // 第一步：调用API验证token
        const isValid = await checkTokenValid();

        if (isValid) {
          console.log("Token验证成功，进入应用");

          // 第二步：异步连接WebSocket + 检查更新（不阻塞页面进入）
          setTimeout(() => {
            this.initNotificationService();
            this.checkAppUpdate();
          }, 1000);

          // 立即进入首页
          uni.switchTab({
            url: "/pages/index/index",
          });
        } else {
          // Token无效（401）
          console.log("Token验证失败");
          this.handleTokenInvalid();
        }
      } catch (error) {
        // 网络错误或其他异常
        console.error("Token验证异常:", error);
        this.handleNetworkError();
      }
    },

    /**
     * 处理token无效
     */
    handleTokenInvalid() {
      clearLoginState();
      uni.showToast({
        title: "登录已过期，请重新登录",
        icon: "none",
        duration: 1500,
      });

      setTimeout(() => {
        uni.reLaunch({
          url: "/pages/login/login",
        });
      }, 1500);
    },

    /**
     * 处理网络错误
     */
    handleNetworkError() {
      uni.showModal({
        title: "网络连接失败",
        content: "无法验证登录状态，请检查网络连接",
        confirmText: "重试",
        cancelText: "退出登录",
        success: (res) => {
          if (res.confirm) {
            // 用户选择重试
            console.log("用户选择重试验证");
            this.verifyTokenAndEnter();
          } else if (res.cancel) {
            // 用户选择退出
            console.log("用户选择退出登录");
            clearLoginState();
            uni.reLaunch({
              url: "/pages/login/login",
            });
          }
        },
      });
    },

    /**
     * 初始化通知服务
     */
    initNotificationService() {
      // 建立WebSocket连接
      connectWebSocket();
      // 获取未读通知
      fetchUnreadNotifications();
      // 请求 iOS 通知权限（首次调用会弹出系统权限对话框）
      // uni.getPushClientId 是 Push 模块初始化的标准入口，必须在 Push 模块启用后才有效
      // #ifdef APP-PLUS
      uni.getPushClientId({
        success: (res) => {
          console.log('[Push] 通知权限已获取, CID:', res.cid)
        },
        fail: (err) => {
          console.warn('[Push] 通知权限请求失败或被拒绝:', err)
        }
      })
      // #endif
    },

    /**
     * 检查App更新
     */
    async checkAppUpdate() {
      try {
        const result = await checkForUpdate();

        if (result.type === "none") {
          return;
        }

        if (result.type === "force") {
          // 强制更新，直接通知页面显示弹窗
          uni.$emit("show-update-dialog", result);
        } else if (result.type === "optional") {
          // 可选更新，检查用户是否已跳过该版本
          if (!isUpdateDismissed(result.version)) {
            uni.$emit("show-update-dialog", result);
          }
        }
      } catch (error) {
        // 自动检查更新失败，静默处理
        console.log("自动检查更新失败:", error);
      }
    },
  },
};
</script>

<style lang="scss">
/* AI医问通 - 全局公共样式 */

/* 重置默认样式 */
page {
  background-color: $bg-base;
  font-family: $font-family-body;
  font-size: $font-size-base;
  color: $text-primary;
  line-height: $line-height-normal;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  min-height: 100vh;
}

view,
text {
  box-sizing: border-box;
}

/* 隐藏滚动条 */
::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
  background: transparent;
}

/* 输入框placeholder样式 */
.uni-input-placeholder,
.uni-textarea-placeholder {
  color: $text-muted;
}

/* 安全区域 */
.safe-area-bottom {
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}

/* 文字省略 */
.text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.text-ellipsis-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Flex布局工具类 */
.flex {
  display: flex;
}

.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.flex-col {
  display: flex;
  flex-direction: column;
}

.flex-1 {
  flex: 1;
}

/* 间距工具类 */
.mt-sm {
  margin-top: $spacing-sm;
}
.mt-md {
  margin-top: $spacing-md;
}
.mt-lg {
  margin-top: $spacing-lg;
}
.mb-sm {
  margin-bottom: $spacing-sm;
}
.mb-md {
  margin-bottom: $spacing-md;
}
.mb-lg {
  margin-bottom: $spacing-lg;
}
.ml-sm {
  margin-left: $spacing-sm;
}
.ml-md {
  margin-left: $spacing-md;
}
.mr-sm {
  margin-right: $spacing-sm;
}
.mr-md {
  margin-right: $spacing-md;
}

.pt-sm {
  padding-top: $spacing-sm;
}
.pt-md {
  padding-top: $spacing-md;
}
.pb-sm {
  padding-bottom: $spacing-sm;
}
.pb-md {
  padding-bottom: $spacing-md;
}
.px-md {
  padding-left: $spacing-md;
  padding-right: $spacing-md;
}
.py-md {
  padding-top: $spacing-md;
  padding-bottom: $spacing-md;
}

/* 文字颜色 */
.text-primary {
  color: $text-primary;
}
.text-secondary {
  color: $text-secondary;
}
.text-muted {
  color: $text-muted;
}
.text-accent {
  color: $color-accent;
}

/* 背景颜色 */
.bg-base {
  background-color: $bg-base;
}
.bg-card {
  background-color: $bg-card;
}
.bg-primary {
  background-color: $color-primary;
}

/* 圆角 */
.rounded-sm {
  border-radius: $radius-sm;
}
.rounded-md {
  border-radius: $radius-md;
}
.rounded-lg {
  border-radius: $radius-lg;
}
.rounded-full {
  border-radius: $radius-full;
}

/* 阴影 */
.shadow-sm {
  box-shadow: $shadow-sm;
}
.shadow-md {
  box-shadow: $shadow-md;
}
.shadow-lg {
  box-shadow: $shadow-lg;
}

/* 动画类 */
.fade-in {
  animation: fadeIn 0.3s ease;
}

.slide-up {
  animation: slideUp 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 点击反馈 */
.clickable {
  transition: opacity 0.15s ease, transform 0.15s ease;

  &:active {
    opacity: 0.7;
    transform: scale(0.98);
  }
}

/* 禁用状态 */
.disabled {
  opacity: $uni-opacity-disabled;
  pointer-events: none;
}
</style>
