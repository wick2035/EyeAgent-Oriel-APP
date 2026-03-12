<template>
  <view class="about-page" :class="{ 'about-page--dark': isDark }">
    <!-- 背景层 -->
    <view class="bg-layer">
      <view class="bg-gradient"></view>
      <!-- 漂浮光点 -->
      <view class="particles">
        <view
          v-for="i in 8"
          :key="i"
          class="particle"
          :class="`particle--${i}`"
        ></view>
      </view>
    </view>

    <!-- 内容区 -->
    <view class="content">
      <!-- 状态栏占位 -->
      <view
        class="status-bar"
        :style="{ height: statusBarHeight + 'px' }"
      ></view>

      <!-- 导航栏 -->
      <view class="navbar" :class="{ 'navbar--visible': pageReady }">
        <view class="navbar__back" @click="goBack">
          <view class="back-icon"></view>
        </view>
        <text class="navbar__title">关于我们</text>
        <view class="navbar__placeholder"></view>
      </view>

      <!-- 滚动区域 -->
      <scroll-view class="scroll-area" scroll-y>
        <!-- 品牌展示区 -->
        <view class="brand-section" :class="{ 'card--visible': pageReady }">
          <!-- Logo -->
          <view class="brand-logo">
            <image
              class="brand-logo__image"
              src="/static/image@1x.png"
              mode="aspectFit"
            ></image>
            <view class="brand-logo__glow"></view>
          </view>
          <!-- 品牌名 -->
          <text class="brand-name">EyeAgent</text>
          <!-- 产品名 -->
          <text class="brand-product">「AI医问通」</text>
        </view>

        <!-- 版本信息 -->
        <view
          class="section"
          :class="{ 'card--visible': pageReady }"
          style="--delay: 0.15s"
        >
          <view class="section__card">
            <view class="menu-item" @click="checkUpdate">
              <view class="menu-item__icon menu-item__icon--version"></view>
              <text class="menu-item__text">当前版本</text>
              <text class="menu-item__value">v{{ appVersion }}</text>
              <view class="menu-item__arrow"></view>
            </view>
          </view>
        </view>

        <!-- 社交链接 -->
        <view
          class="section"
          :class="{ 'card--visible': pageReady }"
          style="--delay: 0.25s"
        >
          <view class="section__card">
            <view class="menu-item" @click="openWebsite">
              <view class="menu-item__icon menu-item__icon--web"></view>
              <text class="menu-item__text">官方网站</text>
              <text class="menu-item__value">eyeagent.top</text>
              <view class="menu-item__arrow"></view>
            </view>
            <view class="menu-item" @click="openWechat">
              <view class="menu-item__icon menu-item__icon--wechat"></view>
              <text class="menu-item__text">微信公众号</text>
              <view class="menu-item__arrow"></view>
            </view>
            <view class="menu-item" @click="openWeibo">
              <view class="menu-item__icon menu-item__icon--weibo"></view>
              <text class="menu-item__text">官方微博</text>
              <view class="menu-item__arrow"></view>
            </view>
            <view class="menu-item menu-item--no-border" @click="rateApp">
              <view class="menu-item__icon menu-item__icon--star"></view>
              <text class="menu-item__text">给我们评分</text>
              <view class="menu-item__arrow"></view>
            </view>
          </view>
        </view>

        <!-- 底部版权信息 -->
        <view
          class="footer"
          :class="{ 'card--visible': pageReady }"
          style="--delay: 0.35s"
        >
          <text class="footer__copyright">© 2026 EyeAgent</text>
          <text class="footer__slogan">用心守护每一双眼睛</text>
        </view>

        <!-- 底部留白 -->
        <view class="bottom-space"></view>
      </scroll-view>
    </view>

    <!-- 顶部通知栏 -->

    <!-- 版本更新弹窗 -->
    <UpdateDialog ref="updateDialog" />
    <TopNotificationBar />
  </view>
</template>

<script>
import { isDarkMode } from "@/store/theme.js";
import UpdateDialog from "@/components/UpdateDialog.vue";
import { checkForUpdate } from "@/utils/version.js";

import TopNotificationBar from '@/components/TopNotificationBar.vue'

export default {
  components: {
		TopNotificationBar,
    UpdateDialog,
  },
  data() {
    return {
      statusBarHeight: 44,
      pageReady: false,
      appVersion: "1.0.0",
    };
  },
  computed: {
    isDark() {
      return isDarkMode();
    },
  },
  onLoad() {
    this.getStatusBarHeight();
    this.getAppVersion();
    setTimeout(() => {
      this.pageReady = true;
    }, 100);
  },
  methods: {
    getStatusBarHeight() {
      const sysInfo = uni.getSystemInfoSync();
      this.statusBarHeight = sysInfo.statusBarHeight || 44;
    },

    getAppVersion() {
      // 获取应用版本号
      try {
        const sysInfo = uni.getSystemInfoSync();
        // 小程序环境使用 SDKVersion，APP 环境可以获取 appVersion
        if (sysInfo.appVersion) {
          this.appVersion = sysInfo.appVersion;
        }
      } catch (e) {
        console.log("获取版本号失败", e);
      }
    },

    goBack() {
      uni.navigateBack();
    },

    async checkUpdate() {
      uni.showLoading({ title: "检查中..." });
      try {
        const result = await checkForUpdate();
        uni.hideLoading();

        if (result.type === "none") {
          uni.showToast({
            title: "已是最新版本",
            icon: "success",
          });
        } else {
          // 手动检查时，无论是否已跳过，都显示更新弹窗
          if (this.$refs.updateDialog) {
            this.$refs.updateDialog.show(result);
          }
        }
      } catch (error) {
        uni.hideLoading();
        uni.showToast({
          title: "检查更新失败",
          icon: "none",
        });
      }
    },

    openWebsite() {
      // #ifdef H5
      window.open("https://eyeagent.top", "_blank");
      // #endif

      // #ifdef MP-WEIXIN
      uni.showModal({
        title: "官方网站",
        content: "eyeagent.top",
        showCancel: false,
        confirmText: "知道了",
      });
      // #endif

      // #ifdef APP-PLUS
      plus.runtime.openURL("https://eyeagent.top");
      // #endif
    },

    openWechat() {
      uni.showToast({
        title: "敬请期待",
        icon: "none",
      });
    },

    openWeibo() {
      uni.showToast({
        title: "敬请期待",
        icon: "none",
      });
    },

    rateApp() {
      // #ifdef APP-PLUS
      // 跳转应用商店评分
      const platform = uni.getSystemInfoSync().platform;
      if (platform === "ios") {
        // iOS App Store
        plus.runtime.openURL("https://apps.apple.com/app/idXXXXXXXXX");
      } else {
        // Android 应用市场
        plus.runtime.openURL("market://details?id=com.eyeagent.app");
      }
      // #endif

      // #ifndef APP-PLUS
      uni.showToast({
        title: "敬请期待",
        icon: "none",
      });
      // #endif
    },
  },
};
</script>

<style lang="scss" scoped>
// ==================== 浅色模式变量 ====================
$light-bg-base: #fafbfd;
$light-bg-card: #ffffff;
$light-text-primary: #1a1a1a;
$light-text-secondary: #666666;
$light-text-muted: #999999;
$light-border: rgba(0, 0, 0, 0.08);
$light-accent: #1e3a5f;

// ==================== 深色模式变量 ====================
$dark-bg-deep: #0a1628;
$dark-bg-mid: #122640;
$dark-bg-light: #1a365d;
$dark-text-light: #f0f6fc;
$dark-text-muted: rgba(240, 246, 252, 0.6);
$dark-glass-bg: rgba(255, 255, 255, 0.06);
$dark-glass-border: rgba(255, 255, 255, 0.1);

// 强调色
$accent-coral: #ff6b5b;
$accent-green: #10b981;
$accent-blue: #3b82f6;

.about-page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background: $light-bg-base;
}

// ==================== 背景层 ====================
.bg-layer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
}

.bg-gradient {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, #e8f4fd 0%, $light-bg-base 100%);
}

// 漂浮光点（浅色模式隐藏）
.particles {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  opacity: 0;
}

.particle {
  position: absolute;
  width: 4rpx;
  height: 4rpx;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  animation: float-particle 10s ease-in-out infinite;

  &--1 {
    left: 15%;
    top: 20%;
    animation-delay: -1s;
    animation-duration: 11s;
  }
  &--2 {
    left: 25%;
    top: 35%;
    animation-delay: -2s;
    animation-duration: 12s;
  }
  &--3 {
    left: 45%;
    top: 25%;
    animation-delay: -3s;
    animation-duration: 10s;
  }
  &--4 {
    left: 55%;
    top: 45%;
    animation-delay: -4s;
    animation-duration: 13s;
  }
  &--5 {
    left: 70%;
    top: 30%;
    animation-delay: -5s;
    animation-duration: 11s;
  }
  &--6 {
    left: 80%;
    top: 55%;
    animation-delay: -6s;
    animation-duration: 14s;
  }
  &--7 {
    left: 35%;
    top: 65%;
    animation-delay: -7s;
    animation-duration: 12s;
  }
  &--8 {
    left: 60%;
    top: 75%;
    animation-delay: -8s;
    animation-duration: 15s;
  }
}

@keyframes float-particle {
  0%,
  100% {
    transform: translateY(0) translateX(0);
    opacity: 0.3;
  }
  50% {
    transform: translateY(-40rpx) translateX(20rpx);
    opacity: 0.7;
  }
}

// ==================== 内容区 ====================
.content {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.status-bar {
  flex-shrink: 0;
}

// 导航栏
.navbar {
  display: flex;
  align-items: center;
  height: 88rpx;
  padding: 0 32rpx;
  opacity: 0;
  transform: translateY(-20rpx);
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);

  &--visible {
    opacity: 1;
    transform: translateY(0);
  }

  &__back {
    width: 72rpx;
    height: 72rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__title {
    flex: 1;
    text-align: center;
    font-size: 34rpx;
    font-weight: 600;
    color: $light-text-primary;
    letter-spacing: 2rpx;
  }

  &__placeholder {
    width: 72rpx;
  }
}

.back-icon {
  width: 20rpx;
  height: 20rpx;
  border-left: 3rpx solid $light-text-primary;
  border-bottom: 3rpx solid $light-text-primary;
  transform: rotate(45deg);
  margin-left: 8rpx;
}

// 滚动区域
.scroll-area {
  flex: 1;
  padding: 0 32rpx;
  box-sizing: border-box;
  width: 100%;
}

// 入场动画
.card--visible {
  animation: card-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) var(--delay, 0s) both;
}

@keyframes card-in {
  from {
    opacity: 0;
    transform: translateY(40rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// ==================== 品牌展示区 ====================
.brand-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 64rpx 32rpx 48rpx;
  margin-bottom: 32rpx;
}

.brand-logo {
  position: relative;
  width: 160rpx;
  height: 160rpx;
  margin-bottom: 32rpx;

  &__image {
    width: 100%;
    height: 100%;
    border-radius: 32rpx;
    position: relative;
    z-index: 1;
  }

  &__glow {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 180rpx;
    height: 180rpx;
    background: radial-gradient(
      circle,
      rgba(30, 58, 95, 0.15) 0%,
      transparent 70%
    );
    border-radius: 50%;
    animation: logo-breathe 3s ease-in-out infinite;
  }
}

@keyframes logo-breathe {
  0%,
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.6;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.1);
    opacity: 1;
  }
}

.brand-name {
  font-size: 48rpx;
  font-weight: 700;
  color: $light-accent;
  letter-spacing: 4rpx;
  margin-bottom: 12rpx;
}

.brand-product {
  font-size: 32rpx;
  font-weight: 500;
  color: $light-text-secondary;
  margin-bottom: 20rpx;
}

.brand-slogan {
  font-size: 26rpx;
  color: $light-text-muted;
  letter-spacing: 2rpx;
}

// ==================== 分组 ====================
.section {
  margin-bottom: 24rpx;

  &__card {
    background: $light-bg-card;
    border-radius: 24rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
    overflow: hidden;
  }
}

// ==================== 菜单项 ====================
.menu-item {
  display: flex;
  align-items: center;
  padding: 28rpx 32rpx;
  border-bottom: 1rpx solid $light-border;
  transition: background 0.2s ease;

  &:active {
    background: #f5f5f5;
  }

  &--no-border {
    border-bottom: none;
  }

  &__icon {
    width: 44rpx;
    height: 44rpx;
    margin-right: 24rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;

    // 版本图标
    &--version {
      border: 2rpx solid $accent-blue;
      border-radius: 50%;
      width: 32rpx;
      height: 32rpx;
    }
    &--version::before {
      content: "";
      width: 0;
      height: 0;
      border-left: 8rpx solid transparent;
      border-right: 8rpx solid transparent;
      border-bottom: 12rpx solid $accent-blue;
      position: absolute;
      top: 8rpx;
    }

    // 网站图标
    &--web {
      border: 2rpx solid $accent-green;
      border-radius: 50%;
      width: 32rpx;
      height: 32rpx;
    }
    &--web::before {
      content: "";
      width: 28rpx;
      height: 1rpx;
      background: $accent-green;
      position: absolute;
    }
    &--web::after {
      content: "";
      width: 1rpx;
      height: 28rpx;
      background: $accent-green;
      position: absolute;
    }

    // 微信图标
    &--wechat {
      width: 34rpx;
      height: 28rpx;
      background: #07c160;
      border-radius: 8rpx 8rpx 4rpx 8rpx;
      position: relative;
    }
    &--wechat::before {
      content: "";
      width: 6rpx;
      height: 6rpx;
      background: #fff;
      border-radius: 50%;
      position: absolute;
      top: 10rpx;
      left: 8rpx;
    }
    &--wechat::after {
      content: "";
      width: 6rpx;
      height: 6rpx;
      background: #fff;
      border-radius: 50%;
      position: absolute;
      top: 10rpx;
      right: 8rpx;
    }

    // 微博图标
    &--weibo {
      width: 32rpx;
      height: 32rpx;
      border: 2rpx solid #e6162d;
      border-radius: 50%;
    }
    &--weibo::before {
      content: "W";
      font-size: 20rpx;
      font-weight: 700;
      color: #e6162d;
    }

    // 评分图标
    &--star {
      width: 32rpx;
      height: 32rpx;
    }
    &--star::before {
      content: "";
      display: block;
      width: 0;
      height: 0;
      border-left: 16rpx solid transparent;
      border-right: 16rpx solid transparent;
      border-bottom: 24rpx solid #f59e0b;
      position: absolute;
      top: 2rpx;
    }
    &--star::after {
      content: "";
      display: block;
      width: 0;
      height: 0;
      border-left: 16rpx solid transparent;
      border-right: 16rpx solid transparent;
      border-top: 16rpx solid #f59e0b;
      position: absolute;
      bottom: 2rpx;
    }
  }

  &__text {
    flex: 1;
    font-size: 30rpx;
    color: $light-text-primary;
  }

  &__value {
    font-size: 26rpx;
    color: $light-text-muted;
    margin-right: 16rpx;
  }

  &__arrow {
    width: 14rpx;
    height: 14rpx;
    border-top: 2rpx solid $light-text-muted;
    border-right: 2rpx solid $light-text-muted;
    transform: rotate(45deg);
  }
}

// ==================== 底部版权 ====================
.footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48rpx 32rpx;
  margin-top: 16rpx;

  &__copyright {
    font-size: 24rpx;
    color: $light-text-muted;
    margin-bottom: 12rpx;
  }

  &__slogan {
    font-size: 22rpx;
    color: rgba(153, 153, 153, 0.6);
    letter-spacing: 1rpx;
  }
}

// 底部留白
.bottom-space {
  height: calc(40rpx + env(safe-area-inset-bottom));
}

// ==================== 深色模式 ====================
.about-page--dark {
  background: $dark-bg-deep;

  .bg-gradient {
    background: linear-gradient(
      165deg,
      $dark-bg-deep 0%,
      $dark-bg-mid 50%,
      $dark-bg-light 100%
    );
  }

  .particles {
    opacity: 1;
  }

  .navbar__title {
    color: $dark-text-light;
  }

  .back-icon {
    border-color: $dark-text-light;
  }

  .brand-name {
    color: $dark-text-light;
  }

  .brand-product {
    color: $dark-text-muted;
  }

  .brand-slogan {
    color: rgba(240, 246, 252, 0.4);
  }

  .brand-logo__glow {
    background: radial-gradient(
      circle,
      rgba(255, 107, 91, 0.2) 0%,
      transparent 70%
    );
  }

  .section__card {
    background: $dark-glass-bg;
    border: 1rpx solid $dark-glass-border;
    box-shadow: none;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }

  .menu-item {
    border-bottom-color: rgba(255, 255, 255, 0.06);

    &:active {
      background: rgba(255, 255, 255, 0.04);
    }

    &__text {
      color: $dark-text-light;
    }

    &__value {
      color: $dark-text-muted;
    }

    &__arrow {
      border-color: $dark-text-muted;
    }
  }

  .footer {
    &__copyright {
      color: $dark-text-muted;
    }

    &__slogan {
      color: rgba(240, 246, 252, 0.3);
    }
  }
}
</style>
