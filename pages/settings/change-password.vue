<template>
  <view class="page" :class="{ 'page--dark': isDark }">
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
        <text class="navbar__title">修改密码</text>
        <view class="navbar__placeholder"></view>
      </view>

      <!-- 滚动区域 -->
      <scroll-view class="scroll-area" scroll-y>
        <!-- 锁图标区域 -->
        <view class="lock-section" :class="{ 'section--visible': pageReady }">
          <view
            class="lock-icon"
            :class="{ 'lock-icon--success': showSuccess }"
          >
            <view class="lock-body">
              <view class="lock-keyhole"></view>
            </view>
            <view
              class="lock-shackle"
              :class="{ 'lock-shackle--open': showSuccess }"
            ></view>
          </view>
        </view>

        <!-- 密码表单卡片 -->
        <view
          class="form-card"
          :class="{ 'section--visible': pageReady }"
          style="--delay: 0.1s"
        >
          <!-- 当前密码 -->
          <view class="input-group">
            <text class="input-label">当前密码</text>
            <view
              class="input-wrapper"
              :class="{ 'input-wrapper--focus': focusField === 'old' }"
            >
              <input
                class="input-field"
                :type="showOldPassword ? 'text' : 'password'"
                v-model="oldPassword"
                placeholder="请输入当前密码"
                placeholder-class="input-placeholder"
                @focus="focusField = 'old'"
                @blur="focusField = ''"
              />
              <view
                class="eye-toggle"
                @click="showOldPassword = !showOldPassword"
              >
                <image
                  class="eye-icon"
                  :src="
                    showOldPassword
                      ? '/static/eye-open.svg'
                      : '/static/eye-off.svg'
                  "
                  mode="aspectFit"
                />
              </view>
            </view>
          </view>

          <!-- 新密码 -->
          <view class="input-group">
            <text class="input-label">新密码</text>
            <view
              class="input-wrapper"
              :class="{ 'input-wrapper--focus': focusField === 'new' }"
            >
              <input
                class="input-field"
                :type="showNewPassword ? 'text' : 'password'"
                v-model="newPassword"
                placeholder="请输入新密码"
                placeholder-class="input-placeholder"
                :cursor-spacing="20"
                @focus="focusField = 'new'"
                @blur="focusField = ''"
              />
              <view
                class="eye-toggle"
                @click="showNewPassword = !showNewPassword"
              >
                <image
                  class="eye-icon"
                  :src="
                    showNewPassword
                      ? '/static/eye-open.svg'
                      : '/static/eye-off.svg'
                  "
                  mode="aspectFit"
                />
              </view>
            </view>
            <!-- 密码强度指示器 -->
            <view class="strength-bar" v-if="newPassword">
              <view class="strength-track">
                <view
                  class="strength-fill"
                  :class="[`strength-fill--${passwordStrength.level}`]"
                  :style="{ width: passwordStrength.width }"
                ></view>
              </view>
              <text
                class="strength-text"
                :class="[`strength-text--${passwordStrength.level}`]"
              >
                {{ passwordStrength.text }}
              </text>
            </view>
          </view>

          <!-- 确认密码 -->
          <view class="input-group input-group--last">
            <text class="input-label">确认密码</text>
            <view
              class="input-wrapper"
              :class="{
                'input-wrapper--focus': focusField === 'confirm',
                'input-wrapper--error': confirmPassword && !passwordMatch,
                'input-wrapper--success': confirmPassword && passwordMatch,
              }"
            >
              <input
                class="input-field"
                :type="showConfirmPassword ? 'text' : 'password'"
                v-model="confirmPassword"
                placeholder="请再次输入新密码"
                placeholder-class="input-placeholder"
                :cursor-spacing="20"
                @focus="focusField = 'confirm'"
                @blur="focusField = ''"
              />
              <view
                class="eye-toggle"
                @click="showConfirmPassword = !showConfirmPassword"
              >
                <image
                  class="eye-icon"
                  :src="
                    showConfirmPassword
                      ? '/static/eye-open.svg'
                      : '/static/eye-off.svg'
                  "
                  mode="aspectFit"
                />
              </view>
            </view>
            <view class="match-hint" v-if="confirmPassword">
              <view
                class="match-icon"
                :class="{ 'match-icon--success': passwordMatch }"
              >
                <view v-if="passwordMatch" class="check-mark"></view>
                <view v-else class="cross-mark"></view>
              </view>
              <text
                class="match-text"
                :class="{ 'match-text--success': passwordMatch }"
              >
                {{ passwordMatch ? "密码一致" : "密码不一致" }}
              </text>
            </view>
          </view>
        </view>

        <!-- 提交按钮 -->
        <view
          class="submit-section"
          :class="{ 'section--visible': pageReady }"
          style="--delay: 0.2s"
        >
          <view
            class="submit-btn"
            :class="{
              'submit-btn--disabled': !canSubmit,
              'submit-btn--loading': isLoading,
            }"
            @click="handleSubmit"
          >
            <view v-if="isLoading" class="loading-spinner">
              <view class="spinner-ring"></view>
            </view>
            <text v-else class="submit-btn__text">确认修改</text>
          </view>
        </view>

        <!-- 底部留白 -->
        <view class="bottom-space"></view>
      </scroll-view>
    </view>

    <!-- 成功弹窗 -->
    <view class="success-modal" :class="{ 'success-modal--show': showSuccess }">
      <view class="success-modal__overlay" @click="closeSuccess"></view>
      <view class="success-modal__content">
        <view class="success-icon">
          <view class="success-check"></view>
          <view class="success-circle"></view>
        </view>
        <text class="success-title">密码修改成功</text>
        <text class="success-desc">您的密码已更新，请使用新密码登录</text>
        <view class="success-btn" @click="closeSuccess">
          <text class="success-btn__text">我知道了</text>
        </view>
      </view>
    </view>

    <!-- 顶部通知栏 -->
    <TopNotificationBar />
  </view>
</template>

<script>
import { isDarkMode } from "@/store/theme.js";
import { clearLoginState } from "@/store/user.js";
import { changePassword } from "@/utils/api/user.js";

export default {
  components: {
  },
  data() {
    return {
      statusBarHeight: 44,
      pageReady: false,
      focusField: "",
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
      showOldPassword: false,
      showNewPassword: false,
      showConfirmPassword: false,
      isLoading: false,
      showSuccess: false,
    };
  },
  computed: {
    isDark() {
      return isDarkMode();
    },
    passwordStrength() {
      const pwd = this.newPassword;
      if (!pwd) return { level: "none", text: "", width: "0%" };

      let score = 0;
      // 长度
      if (pwd.length >= 6) score += 1;
      if (pwd.length >= 8) score += 1;
      // 包含数字
      if (/\d/.test(pwd)) score += 1;
      // 包含小写
      if (/[a-z]/.test(pwd)) score += 1;
      // 包含大写
      if (/[A-Z]/.test(pwd)) score += 1;
      // 包含特殊字符
      if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) score += 2;

      if (score <= 4) return { level: "weak", text: "弱", width: "33%" };
      if (score <= 6) return { level: "medium", text: "中", width: "66%" };
      return { level: "strong", text: "强", width: "100%" };
    },
    passwordMatch() {
      return (
        this.newPassword &&
        this.confirmPassword &&
        this.newPassword === this.confirmPassword
      );
    },
    canSubmit() {
      return (
        this.oldPassword &&
        this.newPassword &&
        this.newPassword.length >= 6 &&
        this.passwordMatch &&
        !this.isLoading
      );
    },
  },
  onLoad() {
    this.getStatusBarHeight();
    setTimeout(() => {
      this.pageReady = true;
    }, 100);
  },
  methods: {
    getStatusBarHeight() {
      const sysInfo = uni.getSystemInfoSync();
      this.statusBarHeight = sysInfo.statusBarHeight || 44;
    },
    goBack() {
      uni.navigateBack();
    },
    async handleSubmit() {
      if (!this.canSubmit) return;

      this.isLoading = true;
      try {
        const result = await changePassword(this.oldPassword, this.newPassword);
        if (result.success) {
          this.showSuccess = true;
        } else {
          uni.showToast({
            title: result.message || "修改失败",
            icon: "none",
          });
        }
      } catch (e) {
        uni.showToast({
          title: "网络错误，请重试",
          icon: "none",
        });
      } finally {
        this.isLoading = false;
      }
    },
    closeSuccess() {
      this.showSuccess = false;
      // 清除登录状态并跳转到登录页
      clearLoginState();
      setTimeout(() => {
        uni.reLaunch({
          url: "/pages/login/login",
        });
      }, 300);
    },
  },
};
</script>

<style lang="scss" scoped>
// ==================== 颜色变量 ====================
$light-bg-base: #fafbfd;
$light-bg-card: #ffffff;
$light-text-primary: #1a1a1a;
$light-text-secondary: #666666;
$light-text-muted: #999999;
$light-border: rgba(0, 0, 0, 0.08);
$light-accent: #1e3a5f;

$dark-bg-deep: #0a1628;
$dark-bg-mid: #122640;
$dark-bg-light: #1a365d;
$dark-text-light: #f0f6fc;
$dark-text-muted: rgba(240, 246, 252, 0.6);
$dark-glass-bg: rgba(255, 255, 255, 0.06);
$dark-glass-border: rgba(255, 255, 255, 0.1);

$accent-primary: #1e3a5f;
$accent-gradient: linear-gradient(135deg, #1e3a5f 0%, #4a90d9 100%);
$color-success: #10b981;
$color-warning: #f59e0b;
$color-error: #ef4444;

.page {
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
    left: 20%;
    top: 17%;
    animation-delay: -1.2s;
    animation-duration: 9s;
  }
  &--2 {
    left: 30%;
    top: 29%;
    animation-delay: -2.4s;
    animation-duration: 10s;
  }
  &--3 {
    left: 40%;
    top: 41%;
    animation-delay: -3.6s;
    animation-duration: 11s;
  }
  &--4 {
    left: 50%;
    top: 53%;
    animation-delay: -4.8s;
    animation-duration: 12s;
  }
  &--5 {
    left: 60%;
    top: 65%;
    animation-delay: -6s;
    animation-duration: 13s;
  }
  &--6 {
    left: 70%;
    top: 77%;
    animation-delay: -7.2s;
    animation-duration: 14s;
  }
  &--7 {
    left: 80%;
    top: 89%;
    animation-delay: -8.4s;
    animation-duration: 15s;
  }
  &--8 {
    left: 90%;
    top: 100%;
    animation-delay: -9.6s;
    animation-duration: 16s;
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
.section--visible {
  animation: section-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) var(--delay, 0s) both;
}

@keyframes section-in {
  from {
    opacity: 0;
    transform: translateY(40rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// ==================== 锁图标 ====================
.lock-section {
  display: flex;
  justify-content: center;
  padding: 60rpx 0 40rpx;
}

.lock-icon {
  position: relative;
  width: 120rpx;
  height: 120rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: lock-breathe 3s ease-in-out infinite;

  &--success {
    animation: lock-success 0.5s ease-out forwards;
  }
}

@keyframes lock-breathe {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

@keyframes lock-success {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

.lock-body {
  width: 64rpx;
  height: 52rpx;
  background: $accent-gradient;
  border-radius: 12rpx;
  position: relative;
  box-shadow: 0 8rpx 24rpx rgba(30, 58, 95, 0.3);
}

.lock-keyhole {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 12rpx;
  height: 12rpx;
  background: #fff;
  border-radius: 50%;

  &::after {
    content: "";
    position: absolute;
    top: 10rpx;
    left: 50%;
    transform: translateX(-50%);
    width: 8rpx;
    height: 14rpx;
    background: #fff;
    border-radius: 0 0 4rpx 4rpx;
  }
}

.lock-shackle {
  position: absolute;
  top: 14rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 40rpx;
  height: 32rpx;
  border: 6rpx solid $accent-primary;
  border-bottom: none;
  border-radius: 20rpx 20rpx 0 0;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);

  &--open {
    transform: translateX(-50%) rotate(-30deg);
    transform-origin: left bottom;
  }
}

// ==================== 表单卡片 ====================
.form-card {
  background: $light-bg-card;
  border-radius: 24rpx;
  padding: 8rpx 32rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
  margin-bottom: 32rpx;
}

.input-group {
  padding: 24rpx 0;
  border-bottom: 1rpx solid $light-border;

  &--last {
    border-bottom: none;
  }
}

.input-label {
  display: block;
  font-size: 26rpx;
  color: $light-text-muted;
  margin-bottom: 16rpx;
  letter-spacing: 1rpx;
}

.input-wrapper {
  display: flex;
  align-items: center;
  height: 88rpx;
  padding: 0 24rpx;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 16rpx;
  border: 2rpx solid transparent;
  transition: all 0.3s ease;

  &--focus {
    background: rgba(30, 58, 95, 0.05);
    border-color: rgba(30, 58, 95, 0.3);
    box-shadow: 0 0 0 4rpx rgba(30, 58, 95, 0.1);
  }

  &--error {
    border-color: rgba(239, 68, 68, 0.5);
    background: rgba(239, 68, 68, 0.05);
  }

  &--success {
    border-color: rgba(16, 185, 129, 0.5);
    background: rgba(16, 185, 129, 0.05);
  }
}

.input-field {
  flex: 1;
  height: 100%;
  font-size: 30rpx;
  color: $light-text-primary;
}

.input-placeholder {
  color: $light-text-muted;
}

// 眼睛图标
.eye-toggle {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 8rpx;
}

.eye-icon {
  width: 40rpx;
  height: 40rpx;
  // 将黑色SVG转为灰色
  filter: invert(60%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(90%)
    contrast(90%);
  transition: filter 0.3s ease;
}

// ==================== 密码强度 ====================
.strength-bar {
  display: flex;
  align-items: center;
  margin-top: 16rpx;
  gap: 16rpx;
}

.strength-track {
  flex: 1;
  height: 6rpx;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 3rpx;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  border-radius: 3rpx;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);

  &--weak {
    background: $color-error;
  }

  &--medium {
    background: $color-warning;
  }

  &--strong {
    background: $color-success;
  }
}

.strength-text {
  font-size: 22rpx;
  font-weight: 500;
  min-width: 40rpx;

  &--weak {
    color: $color-error;
  }
  &--medium {
    color: $color-warning;
  }
  &--strong {
    color: $color-success;
  }
}

// ==================== 密码匹配提示 ====================
.match-hint {
  display: flex;
  align-items: center;
  margin-top: 16rpx;
  gap: 8rpx;
}

.match-icon {
  width: 28rpx;
  height: 28rpx;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  &--success {
    background: rgba(16, 185, 129, 0.1);
  }
}

.check-mark {
  width: 12rpx;
  height: 8rpx;
  border-left: 2rpx solid $color-success;
  border-bottom: 2rpx solid $color-success;
  transform: rotate(-45deg);
  margin-top: -2rpx;
}

.cross-mark {
  width: 12rpx;
  height: 12rpx;
  position: relative;

  &::before,
  &::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 0;
    width: 100%;
    height: 2rpx;
    background: $color-error;
  }

  &::before {
    transform: rotate(45deg);
  }
  &::after {
    transform: rotate(-45deg);
  }
}

.match-text {
  font-size: 22rpx;
  color: $color-error;

  &--success {
    color: $color-success;
  }
}

// ==================== 提交按钮 ====================
.submit-section {
  padding: 16rpx 0;
}

.submit-btn {
  height: 96rpx;
  background: $accent-gradient;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(30, 58, 95, 0.3);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    transition: left 0.5s ease;
  }

  &:active:not(.submit-btn--disabled):not(.submit-btn--loading) {
    transform: scale(0.98);
    box-shadow: 0 4rpx 16rpx rgba(30, 58, 95, 0.4);

    &::before {
      left: 100%;
    }
  }

  &--disabled {
    opacity: 0.5;
    box-shadow: none;
  }

  &--loading {
    pointer-events: none;
  }

  &__text {
    font-size: 32rpx;
    font-weight: 600;
    color: #fff;
    letter-spacing: 4rpx;
  }
}

// 加载动画
.loading-spinner {
  width: 40rpx;
  height: 40rpx;
}

.spinner-ring {
  width: 100%;
  height: 100%;
  border: 3rpx solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// 底部留白
.bottom-space {
  height: calc(60rpx + env(safe-area-inset-bottom));
}

// ==================== 成功弹窗 ====================
.success-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;

  &--show {
    opacity: 1;
    visibility: visible;

    .success-modal__content {
      transform: scale(1);
    }
  }

  &__overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(8px);
  }

  &__content {
    position: relative;
    width: 560rpx;
    background: $light-bg-card;
    border-radius: 32rpx;
    padding: 60rpx 40rpx 40rpx;
    text-align: center;
    transform: scale(0.8);
    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
}

.success-icon {
  width: 120rpx;
  height: 120rpx;
  margin: 0 auto 32rpx;
  position: relative;
}

.success-circle {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 4rpx solid $color-success;
  border-radius: 50%;
  animation: circle-draw 0.5s ease-out forwards;
}

@keyframes circle-draw {
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.success-check {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 40rpx;
  height: 24rpx;
  border-left: 6rpx solid $color-success;
  border-bottom: 6rpx solid $color-success;
  transform: translate(-50%, -60%) rotate(-45deg);
  animation: check-draw 0.3s ease-out 0.3s forwards;
  opacity: 0;
}

@keyframes check-draw {
  from {
    opacity: 0;
    transform: translate(-50%, -60%) rotate(-45deg) scale(0);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -60%) rotate(-45deg) scale(1);
  }
}

.success-title {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  color: $light-text-primary;
  margin-bottom: 16rpx;
}

.success-desc {
  display: block;
  font-size: 26rpx;
  color: $light-text-muted;
  margin-bottom: 40rpx;
  line-height: 1.5;
}

.success-btn {
  height: 88rpx;
  background: $accent-gradient;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 20rpx rgba(30, 58, 95, 0.25);
  transition: all 0.2s ease;

  &:active {
    transform: scale(0.98);
  }

  &__text {
    font-size: 30rpx;
    font-weight: 500;
    color: #fff;
    letter-spacing: 2rpx;
  }
}

// ==================== 深色模式 ====================
.page--dark {
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

  .lock-body {
    background: linear-gradient(135deg, #4a90d9 0%, #6ba3e0 100%);
  }

  .lock-shackle {
    border-color: #4a90d9;
  }

  .form-card {
    background: $dark-glass-bg;
    border: 1rpx solid $dark-glass-border;
    box-shadow: none;
    backdrop-filter: blur(20px);
  }

  .input-label {
    color: $dark-text-muted;
  }

  .input-wrapper {
    background: rgba(255, 255, 255, 0.05);

    &--focus {
      background: rgba(74, 144, 217, 0.1);
      border-color: rgba(74, 144, 217, 0.4);
      box-shadow: 0 0 0 4rpx rgba(74, 144, 217, 0.15);
    }

    &--error {
      background: rgba(239, 68, 68, 0.1);
      border-color: rgba(239, 68, 68, 0.4);
    }

    &--success {
      background: rgba(16, 185, 129, 0.1);
      border-color: rgba(16, 185, 129, 0.4);
    }
  }

  .input-field {
    color: $dark-text-light;
  }

  .input-placeholder {
    color: $dark-text-muted;
  }

  .eye-icon {
    // 深色模式下将SVG转为浅色
    filter: invert(70%) sepia(10%) saturate(200%) hue-rotate(180deg)
      brightness(95%) contrast(85%);
  }

  .strength-track {
    background: rgba(255, 255, 255, 0.1);
  }

  .match-icon {
    background: rgba(239, 68, 68, 0.15);

    &--success {
      background: rgba(16, 185, 129, 0.15);
    }
  }

  .submit-btn {
    background: linear-gradient(135deg, #4a90d9 0%, #6ba3e0 100%);
    box-shadow: 0 8rpx 24rpx rgba(74, 144, 217, 0.3);
  }

  .success-modal__content {
    background: $dark-bg-mid;
    border: 1rpx solid $dark-glass-border;
  }

  .success-title {
    color: $dark-text-light;
  }

  .success-desc {
    color: $dark-text-muted;
  }

  .success-btn {
    background: linear-gradient(135deg, #4a90d9 0%, #6ba3e0 100%);
    box-shadow: 0 8rpx 20rpx rgba(74, 144, 217, 0.3);
  }
}
</style>
