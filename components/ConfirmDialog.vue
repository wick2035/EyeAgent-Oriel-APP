<template>
  <view
    v-if="visible"
    class="dialog-mask"
    :class="{ 'dialog-mask--show': showAnimation }"
    @click="handleMaskClick"
  >
    <view
      class="dialog"
      :class="[{ 'dialog--show': showAnimation }, isDark ? 'dialog--dark' : '']"
      @click.stop
    >
      <!-- 图标 -->
      <view v-if="icon" class="dialog__icon">
        <view :class="`icon-${icon}`"></view>
      </view>

      <!-- 标题 -->
      <text class="dialog__title">{{ title }}</text>

      <!-- 内容 -->
      <text v-if="content" class="dialog__content">{{ content }}</text>

      <!-- 按钮组 -->
      <view class="dialog__buttons">
        <view class="dialog__btn dialog__btn--cancel" @click="handleCancel">
          <text class="dialog__btn-text">{{ cancelText }}</text>
        </view>
        <view class="dialog__btn dialog__btn--confirm" @click="handleConfirm">
          <text class="dialog__btn-text dialog__btn-text--confirm">{{
            confirmText
          }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { isDarkMode } from "@/store/theme.js";

export default {
  name: "ConfirmDialog",
  props: {
    title: {
      type: String,
      default: "提示",
    },
    content: {
      type: String,
      default: "",
    },
    confirmText: {
      type: String,
      default: "确定",
    },
    cancelText: {
      type: String,
      default: "取消",
    },
    icon: {
      type: String,
      default: "warning", // warning, success, error, info
    },
    closeOnMask: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      visible: false,
      showAnimation: false,
    };
  },
  computed: {
    isDark() {
      return isDarkMode();
    },
  },
  methods: {
    show() {
      this.visible = true;
      this.$nextTick(() => {
        setTimeout(() => {
          this.showAnimation = true;
        }, 10);
      });
    },
    hide() {
      this.showAnimation = false;
      setTimeout(() => {
        this.visible = false;
      }, 200);
    },
    handleConfirm() {
      this.$emit("confirm");
      this.hide();
    },
    handleCancel() {
      this.$emit("cancel");
      this.hide();
    },
    handleMaskClick() {
      if (this.closeOnMask) {
        this.handleCancel();
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.dialog-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  transition: all 0.3s ease;

  &--show {
    background: rgba(30, 58, 95, 0.4);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
  }
}

.dialog {
  width: 560rpx;
  background: $bg-card;
  border-radius: $radius-xl;
  padding: $spacing-xl $spacing-lg $spacing-lg;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 24rpx 80rpx rgba(30, 58, 95, 0.25),
    0 8rpx 24rpx rgba(30, 58, 95, 0.15);
  transform: scale(0.85) translateY(40rpx);
  opacity: 0;
  transition: transform 0.35s $ease-out-back, opacity 0.3s ease;

  &--show {
    transform: scale(1) translateY(0);
    opacity: 1;
  }

  &__icon {
    width: 120rpx;
    height: 120rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: $spacing-md;
    background: linear-gradient(
      135deg,
      rgba(255, 107, 91, 0.15) 0%,
      rgba(255, 107, 91, 0.25) 100%
    );
    position: relative;

    // 光晕动画
    &::after {
      content: "";
      position: absolute;
      top: -10rpx;
      left: -10rpx;
      right: -10rpx;
      bottom: -10rpx;
      border-radius: 50%;
      background: radial-gradient(
        circle,
        rgba(255, 107, 91, 0.3) 0%,
        transparent 70%
      );
      opacity: 0;
      animation: iconGlow 2s ease-in-out infinite;
    }
  }

  &__title {
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    color: $text-primary;
    margin-bottom: $spacing-sm;
  }

  &__content {
    font-size: $font-size-sm;
    color: $text-secondary;
    text-align: center;
    line-height: $line-height-normal;
    margin-bottom: $spacing-lg;
  }

  &__buttons {
    display: flex;
    width: 100%;
    gap: $spacing-md;
  }

  &__btn {
    flex: 1;
    height: 88rpx;
    border-radius: $radius-lg;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;

    &:active {
      transform: scale(0.96);
    }

    &--cancel {
      background: $bg-elevated;
    }

    &--confirm {
      background: linear-gradient(135deg, #ff6b5b 0%, #e85a4a 100%);
      box-shadow: 0 8rpx 24rpx rgba(255, 107, 91, 0.35);

      // 光泽扫过动画
      &::before {
        content: "";
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          90deg,
          transparent 0%,
          rgba(255, 255, 255, 0.25) 50%,
          transparent 100%
        );
        animation: btnShimmer 3s ease-in-out infinite;
      }
    }
  }

  &__btn-text {
    font-size: $font-size-base;
    font-weight: $font-weight-medium;
    color: $text-secondary;
    position: relative;
    z-index: 2;

    &--confirm {
      color: #fff;
    }
  }
}

// 动画定义
@keyframes iconGlow {
  0%,
  100% {
    opacity: 0;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes btnShimmer {
  0% {
    left: -100%;
  }
  50%,
  100% {
    left: 100%;
  }
}

// 图标样式
.icon-warning {
  width: 48rpx;
  height: 48rpx;
  position: relative;

  &::before {
    content: "";
    position: absolute;
    top: 8rpx;
    left: 50%;
    transform: translateX(-50%);
    width: 6rpx;
    height: 24rpx;
    background: $color-accent;
    border-radius: 3rpx;
  }

  &::after {
    content: "";
    position: absolute;
    bottom: 6rpx;
    left: 50%;
    transform: translateX(-50%);
    width: 6rpx;
    height: 6rpx;
    background: $color-accent;
    border-radius: 50%;
  }
}

.icon-success {
  width: 48rpx;
  height: 48rpx;
  position: relative;

  &::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    width: 12rpx;
    height: 24rpx;
    border: 4rpx solid $color-success;
    border-top: none;
    border-left: none;
    transform: translate(-50%, -60%) rotate(45deg);
  }
}

.icon-error {
  width: 48rpx;
  height: 48rpx;
  position: relative;

  &::before,
  &::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    width: 32rpx;
    height: 4rpx;
    background: $color-error;
    border-radius: 2rpx;
  }

  &::before {
    transform: translate(-50%, -50%) rotate(45deg);
  }

  &::after {
    transform: translate(-50%, -50%) rotate(-45deg);
  }
}

.icon-info {
  width: 48rpx;
  height: 48rpx;
  position: relative;

  &::before {
    content: "";
    position: absolute;
    top: 6rpx;
    left: 50%;
    transform: translateX(-50%);
    width: 6rpx;
    height: 6rpx;
    background: $color-info;
    border-radius: 50%;
  }

  &::after {
    content: "";
    position: absolute;
    bottom: 6rpx;
    left: 50%;
    transform: translateX(-50%);
    width: 6rpx;
    height: 24rpx;
    background: $color-info;
    border-radius: 3rpx;
  }
}

// 深色模式
.dialog--dark {
  background: $dark-bg-card;
  box-shadow: 0 24rpx 80rpx rgba(0, 0, 0, 0.5), 0 8rpx 24rpx rgba(0, 0, 0, 0.3);

  .dialog__title {
    color: $dark-text-primary;
  }

  .dialog__content {
    color: $dark-text-secondary;
  }

  .dialog__btn--cancel {
    background: $dark-bg-elevated;
  }

  .dialog__btn--confirm {
    background: linear-gradient(135deg, #ff8a7a 0%, #ff6b5b 100%);
    box-shadow: 0 8rpx 24rpx rgba(255, 138, 122, 0.4);
  }

  .dialog__btn-text {
    color: $dark-text-secondary;
  }
}

// 深色模式下毛玻璃蒙层优化
.dialog-mask--show {
  .dialog--dark & {
    background: rgba(13, 17, 23, 0.6);
    backdrop-filter: blur(24px) saturate(150%);
    -webkit-backdrop-filter: blur(24px) saturate(150%);
  }
}
</style>
