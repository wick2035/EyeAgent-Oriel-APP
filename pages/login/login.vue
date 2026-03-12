<template>
  <view class="login-page">
    <!-- 背景层 - 简洁浅蓝渐变 -->
    <view class="bg-layer"></view>

    <!-- 左上角 Logo -->
    <view class="top-logo" :style="{ top: statusBarHeight + 10 + 'px' }">
      <image class="top-logo__img" src="/static/logo@1x.png" mode="aspectFit" />
    </view>

    <!-- 内容区 -->
    <view class="content">
      <!-- 状态栏占位 -->
      <view
        class="status-bar"
        :style="{ height: statusBarHeight + 'px' }"
      ></view>

      <!-- 品牌区域 -->
      <view class="brand" :class="{ 'brand--visible': pageReady }">
        <text class="brand__title">AI医问通</text>
        <text class="brand__subtitle"
          >{{ displaySubtitle
          }}<text v-if="isTyping" class="typing-cursor">|</text></text
        >
      </view>

      <!-- 登录卡片 -->
      <view class="login-card" :class="{ 'login-card--visible': pageReady }">
        <!-- 账号输入 -->
        <view
          class="input-group"
          :class="{ 'input-group--focus': usernameFocus }"
        >
          <view class="input-icon">
            <image
              class="input-icon-img"
              src="/static/who.svg"
              mode="aspectFit"
            />
          </view>
          <input
            class="input-field"
            type="text"
            v-model="username"
            placeholder="请输入手机号/账号"
            placeholder-class="input-placeholder"
            @focus="usernameFocus = true"
            @blur="usernameFocus = false"
          />
        </view>

        <!-- 密码输入 -->
        <view
          class="input-group"
          :class="{ 'input-group--focus': passwordFocus }"
        >
          <view class="input-icon">
            <image
              class="input-icon-img"
              src="/static/passwd.svg"
              mode="aspectFit"
            />
          </view>
          <input
            class="input-field"
            :type="showPassword ? 'text' : 'password'"
            v-model="password"
            placeholder="请输入密码"
            placeholder-class="input-placeholder"
            @focus="passwordFocus = true"
            @blur="passwordFocus = false"
          />
          <view class="input-eye" @click="showPassword = !showPassword">
            <image
              class="input-eye-img"
              :src="
                showPassword ? '/static/eye-open.svg' : '/static/eye-off.svg'
              "
              mode="aspectFit"
            />
          </view>
        </view>

        <!-- 登录按钮 -->
        <view
          class="login-btn"
          :class="{
            'login-btn--loading': isLoading,
            'login-btn--disabled': !canLogin,
          }"
          @click="handleLogin"
        >
          <view v-if="isLoading" class="btn-loader"></view>
          <text v-else class="login-btn__text">登 录</text>
          <view
            class="btn-ripple"
            :class="{ 'btn-ripple--active': rippleActive }"
          ></view>
        </view>

        <!-- 分隔线 -->
        <view class="divider">
          <view class="divider__line"></view>
          <text class="divider__text">其他登录方式</text>
          <view class="divider__line"></view>
        </view>

        <!-- 微信登录 -->
        <view class="social-login">
          <view class="wx-btn" @click="handleWxLogin">
            <image
              class="wx-icon-img"
              src="/static/wechat.svg"
              mode="aspectFit"
            />
          </view>
        </view>
      </view>

      <!-- 注册入口 -->
      <view class="register-link" :class="{ 'register-link--visible': pageReady }">
        <text class="register-link__text">还没有账号？</text>
        <text class="register-link__btn" @click="goToRegister">立即注册</text>
      </view>

      <!-- 用户协议 -->
      <view class="agreement" :class="{ 'agreement--visible': pageReady }">
        <view
          class="checkbox"
          :class="{ 'checkbox--checked': agreedTerms }"
          @click="agreedTerms = !agreedTerms"
        >
          <view class="checkbox__inner">
            <view class="checkbox__tick"></view>
          </view>
        </view>
        <text class="agreement__text">
          已阅读并同意
          <text class="agreement__link" @click.stop="openUserAgreement"
            >《用户协议》</text
          >
          和
          <text class="agreement__link" @click.stop="openPrivacyPolicy"
            >《隐私政策》</text
          >
        </text>
      </view>
    </view>

    <TopNotificationBar />
  </view>
</template>

<script>
import { login, wxLogin, getWxLoginCode } from "@/utils/api/user.js";
export default {
  data() {
    return {
      statusBarHeight: 44,
      pageReady: false,
      username: "",
      password: "",
      showPassword: false,
      usernameFocus: false,
      passwordFocus: false,
      agreedTerms: false,
      isLoading: false,
      rippleActive: false,
      // 打字效果相关
      fullSubtitle: "您的专属智能健康管家！",
      displaySubtitle: "",
      isTyping: false,
      typingTimer: null,
    };
  },
  computed: {
    canLogin() {
      return this.username.trim() && this.password.trim() && this.agreedTerms;
    },
  },
  onLoad() {
    this.getStatusBarHeight();
    // 延迟显示动画
    setTimeout(() => {
      this.pageReady = true;
      // 品牌区域显示后开始打字效果
      setTimeout(() => {
        this.startTyping();
      }, 400);
    }, 100);
  },
  onUnload() {
    // 清理定时器
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
    }
  },
  methods: {
    getStatusBarHeight() {
      const sysInfo = uni.getSystemInfoSync();
      this.statusBarHeight = sysInfo.statusBarHeight || 44;
    },

    // 打字效果
    startTyping() {
      this.isTyping = true;
      this.displaySubtitle = "";
      let index = 0;
      const typeChar = () => {
        if (index < this.fullSubtitle.length) {
          this.displaySubtitle += this.fullSubtitle[index];
          index++;
          this.typingTimer = setTimeout(typeChar, 120);
        } else {
          this.isTyping = false;
        }
      };
      typeChar();
    },

    async handleLogin() {
      // 先检查用户协议
      if (!this.agreedTerms) {
        this.$toast.warning("请先同意用户协议");
        return;
      }

      if (!this.canLogin || this.isLoading) return;

      // 触发按钮涟漪动画
      this.rippleActive = true;
      setTimeout(() => {
        this.rippleActive = false;
      }, 600);

      this.isLoading = true;

      try {
        const result = await login(this.username, this.password);

        if (result.success) {
          this.$toast.success("登录成功");
          setTimeout(() => {
            uni.switchTab({ url: "/pages/index/index" });
          }, 1500);
        } else {
          this.$toast.error(result.message || "登录失败");
        }
      } catch (error) {
        this.$toast.error("网络异常，请稍后重试");
      } finally {
        this.isLoading = false;
      }
    },

    async handleWxLogin() {
      if (!this.agreedTerms) {
        this.$toast.warning("请先同意用户协议");
        return;
      }

      try {
        uni.showLoading({ title: "微信登录中..." });

        const code = await getWxLoginCode();
        const result = await wxLogin(code);

        uni.hideLoading();

        if (result.success) {
          this.$toast.success("登录成功");
          setTimeout(() => {
            uni.switchTab({ url: "/pages/index/index" });
          }, 1500);
        } else {
          this.$toast.error(result.message || "微信登录失败");
        }
      } catch (error) {
        uni.hideLoading();
        this.$toast.error(error.message || "微信登录失败");
      }
    },

    openUserAgreement() {
      uni.navigateTo({
        url: '/pages/settings/user-agreement'
      })
    },

    openPrivacyPolicy() {
      uni.navigateTo({
        url: '/pages/settings/privacy-policy'
      })
    },

    goToRegister() {
      uni.navigateTo({
        url: '/pages/login/register'
      })
    },
  },
};
</script>

<style lang="scss" scoped>
// ==================== 浅色主题变量 ====================
// 背景系统
$bg-page: #fafbfd;
$bg-gradient-top: #e8f4fd;
$bg-card: #ffffff;
$bg-input: #f5f7fa;

// 品牌色
$color-primary: #1e3a5f;
$color-primary-light: #2d5a87;
$color-accent: #ff6b5b;
$color-accent-light: #ff8a7a;

// 文本色
$text-primary: #1a2b3c;
$text-secondary: #5a6b7c;
$text-muted: #9aabbf;
$text-placeholder: #b8c5d4;

// 边框与阴影
$border-color: #e5e9ef;
$shadow-card: 0 4rpx 24rpx rgba(30, 58, 95, 0.08);
$shadow-button: 0 8rpx 24rpx rgba(255, 107, 91, 0.25);
$shadow-input-focus: 0 0 0 4rpx rgba(30, 58, 95, 0.06);

// 微信绿
$wx-green: #07c160;

.login-page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background: $bg-page;
}

// ==================== 左上角 Logo ====================
.top-logo {
  position: absolute;
  left: 32rpx;
  z-index: 10;

  &__img {
    width: 200rpx;
    height: 60rpx;
  }
}

// ==================== 背景层 - 简洁渐变 ====================
.bg-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, $bg-gradient-top 0%, $bg-page 50%);
  z-index: 0;
}

// ==================== 内容区 ====================
.content {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 0 40rpx;
}

.status-bar {
  flex-shrink: 0;
}

// ==================== 品牌区域 ====================
.brand {
  padding-top: 230rpx;
  text-align: center;
  opacity: 0;
  transform: translateY(-20rpx);
  transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);

  &--visible {
    opacity: 1;
    transform: translateY(0);
  }

  &__title {
    display: block;
    font-family: "PingFang SC", -apple-system, sans-serif;
    font-size: 62rpx;
    font-weight: 600;
    color: $text-primary;
    letter-spacing: 4rpx;
    margin-bottom: 16rpx;
  }

  &__subtitle {
    display: block;
    font-size: 28rpx;
    color: $text-secondary;
    letter-spacing: 2rpx;
  }
}

// 打字光标
.typing-cursor {
  display: inline;
  color: $color-primary;
  font-weight: 300;
  animation: cursor-blink 0.8s infinite;
}

@keyframes cursor-blink {
  0%,
  50% {
    opacity: 1;
  }
  51%,
  100% {
    opacity: 0;
  }
}

// ==================== 登录卡片 ====================
.login-card {
  margin-top: 56rpx;
  padding: 48rpx 36rpx;
  background: $bg-card;
  border-radius: 24rpx;
  box-shadow: $shadow-card;
  opacity: 0;
  transform: translateY(40rpx);
  transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.15s;

  &--visible {
    opacity: 1;
    transform: translateY(0);
  }
}

// 输入框组
.input-group {
  display: flex;
  align-items: center;
  height: 104rpx;
  padding: 0 28rpx;
  margin-bottom: 24rpx;
  background: $bg-input;
  border: 2rpx solid transparent;
  border-radius: 16rpx;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &--focus {
    background: $bg-card;
    border-color: $color-primary;
    box-shadow: $shadow-input-focus;
  }
}

.input-icon {
  width: 44rpx;
  height: 44rpx;
  margin-right: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

// SVG 图标样式
.input-icon-img {
  width: 36rpx;
  height: 36rpx;
  opacity: 0.45;
  transition: opacity 0.3s;

  .input-group--focus & {
    opacity: 0.8;
  }
}

.input-field {
  flex: 1;
  height: 100%;
  font-size: 30rpx;
  color: $text-primary;
  background: transparent;
}

.input-placeholder {
  color: $text-placeholder;
}

.input-eye {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: -12rpx;

  &:active {
    opacity: 0.7;
  }
}

// 眼睛 SVG 图标样式
.input-eye-img {
  width: 40rpx;
  height: 28rpx;
  opacity: 0.45;
  transition: opacity 0.2s;
}

// 登录按钮 - 医疗蓝主题
.login-btn {
  position: relative;
  height: 100rpx;
  margin-top: 24rpx;
  background: linear-gradient(
    135deg,
    $color-primary 0%,
    $color-primary-light 100%
  );
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: 0 8rpx 24rpx rgba(30, 58, 95, 0.25);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:active {
    transform: scale(0.98);
    box-shadow: 0 4rpx 16rpx rgba(30, 58, 95, 0.2);
  }

  &--disabled {
    background: linear-gradient(135deg, #c5d0dc 0%, #d8e0e8 100%);
    box-shadow: none;

    &:active {
      transform: none;
    }
  }

  &--loading {
    pointer-events: none;
  }

  &__text {
    font-size: 32rpx;
    font-weight: 600;
    color: #ffffff;
    letter-spacing: 8rpx;
    margin-left: 8rpx;
  }
}

.btn-loader {
  width: 36rpx;
  height: 36rpx;
  border: 3rpx solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.btn-ripple {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;

  &--active {
    animation: ripple-out 0.6s ease-out;
  }
}

@keyframes ripple-out {
  to {
    width: 400rpx;
    height: 400rpx;
    opacity: 0;
  }
}

// 分隔线
.divider {
  display: flex;
  align-items: center;
  margin: 48rpx 0 32rpx;

  &__line {
    flex: 1;
    height: 1rpx;
    background: $border-color;
  }

  &__text {
    padding: 0 24rpx;
    font-size: 24rpx;
    color: $text-muted;
  }
}

// 社交登录
.social-login {
  display: flex;
  justify-content: center;
}

.wx-btn {
  position: relative;
  width: 88rpx;
  height: 88rpx;
  background: $wx-green;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 16rpx rgba(7, 193, 96, 0.25);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:active {
    transform: scale(0.95);
  }
}

// 微信 SVG 图标 - 白色
.wx-icon-img {
  width: 56rpx;
  height: 44rpx;
  filter: brightness(0) invert(1);
}

// ==================== 注册入口 ====================
.register-link {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 40rpx;
  gap: 8rpx;
  opacity: 0;
  transition: opacity 0.6s ease 0.35s;

  &--visible {
    opacity: 1;
  }

  &__text {
    font-size: 26rpx;
    color: $text-muted;
  }

  &__btn {
    font-size: 26rpx;
    color: $color-primary;
    font-weight: 500;

    &:active {
      opacity: 0.7;
    }
  }
}

// ==================== 用户协议 ====================
.agreement {
  margin-top: auto;
  padding: 40rpx 32rpx;
  padding-bottom: calc(40rpx + env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.6s ease 0.4s;

  &--visible {
    opacity: 1;
  }

  &__text {
    font-size: 24rpx;
    color: $text-muted;
  }

  &__link {
    color: $color-primary;
  }
}

.checkbox {
  width: 36rpx;
  height: 36rpx;
  margin-right: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;

  &__inner {
    width: 28rpx;
    height: 28rpx;
    border: 2rpx solid $border-color;
    border-radius: 6rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  &__tick {
    width: 10rpx;
    height: 16rpx;
    border-right: 3rpx solid transparent;
    border-bottom: 3rpx solid transparent;
    transform: rotate(45deg) scale(0);
    margin-top: -4rpx;
    transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  &--checked {
    .checkbox__inner {
      background: $color-primary;
      border-color: $color-primary;
    }

    .checkbox__tick {
      border-color: #ffffff;
      transform: rotate(45deg) scale(1);
    }
  }
}
</style>
