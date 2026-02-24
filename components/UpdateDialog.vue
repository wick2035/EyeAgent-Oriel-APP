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
      <!-- 头部图标 -->
      <view class="dialog__header">
        <view class="dialog__icon">
          <view class="icon-update"></view>
        </view>
      </view>

      <!-- 标题 -->
      <text class="dialog__title">发现新版本</text>
      <text class="dialog__version">v{{ version }}</text>

      <!-- 更新说明 -->
      <scroll-view
        v-if="description"
        class="dialog__desc-scroll"
        scroll-y
      >
        <text class="dialog__desc">{{ description }}</text>
      </scroll-view>

      <!-- 下载进度 -->
      <view v-if="downloading" class="dialog__progress">
        <view class="progress-bar">
          <view
            class="progress-bar__fill"
            :style="{ width: progress + '%' }"
          ></view>
        </view>
        <text class="progress-text">
          {{ progress }}%
          <text v-if="installing"> 安装中...</text>
        </text>
      </view>

      <!-- 无下载地址提示 -->
      <view v-if="!updateUrl && !downloading" class="dialog__no-url">
        <text class="dialog__no-url-text">请前往应用商店更新</text>
      </view>

      <!-- 按钮组 -->
      <view class="dialog__buttons" v-if="!downloading">
        <view
          v-if="!forceUpdate"
          class="dialog__btn dialog__btn--cancel"
          @click="handleCancel"
        >
          <text class="dialog__btn-text">以后再说</text>
        </view>
        <view
          v-if="updateUrl"
          class="dialog__btn dialog__btn--confirm"
          :class="{ 'dialog__btn--full': forceUpdate }"
          @click="handleUpdate"
        >
          <text class="dialog__btn-text dialog__btn-text--confirm">立即更新</text>
        </view>
        <view
          v-if="!updateUrl && forceUpdate"
          class="dialog__btn dialog__btn--confirm dialog__btn--full"
          @click="handleUpdate"
        >
          <text class="dialog__btn-text dialog__btn-text--confirm">知道了</text>
        </view>
      </view>

      <!-- 下载中的取消（仅非强制） -->
      <view v-if="downloading && !forceUpdate && !installing" class="dialog__buttons">
        <view class="dialog__btn dialog__btn--cancel dialog__btn--full" @click="handleCancel">
          <text class="dialog__btn-text">取消下载</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { isDarkMode } from "@/store/theme.js";

export default {
  name: "UpdateDialog",
  data() {
    return {
      visible: false,
      showAnimation: false,
      version: "",
      description: "",
      updateUrl: "",
      forceUpdate: false,
      downloading: false,
      installing: false,
      progress: 0,
      downloadTask: null,
    };
  },
  computed: {
    isDark() {
      return isDarkMode();
    },
  },
  methods: {
    /**
     * 显示更新对话框
     * @param {object} options - { version, description, updateUrl, forceUpdate }
     */
    show(options = {}) {
      this.version = options.version || "";
      this.description = options.description || "";
      this.updateUrl = options.updateUrl || "";
      this.forceUpdate = options.forceUpdate || false;
      this.downloading = false;
      this.installing = false;
      this.progress = 0;
      this.downloadTask = null;

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
        this.downloading = false;
        this.installing = false;
        this.progress = 0;
      }, 200);
    },

    handleMaskClick() {
      if (!this.forceUpdate && !this.downloading) {
        this.handleCancel();
      }
    },

    handleCancel() {
      this.$emit("cancel", this.version);
      this.hide();
    },

    handleUpdate() {
      if (!this.updateUrl) {
        // 无下载地址，仅提示
        return;
      }

      // #ifdef APP-PLUS
      const platform = uni.getSystemInfoSync().platform;
      if (platform === "ios") {
        // iOS 直接跳转 App Store
        plus.runtime.openURL(this.updateUrl);
        return;
      }

      // Android: 检查是否为APK下载链接
      this.startDownload();
      // #endif

      // #ifndef APP-PLUS
      // 非APP环境，尝试打开URL
      uni.showToast({
        title: "请前往应用商店更新",
        icon: "none",
      });
      // #endif
    },

    startDownload() {
      // #ifdef APP-PLUS
      this.downloading = true;
      this.progress = 0;

      const task = plus.downloader.createDownload(
        this.updateUrl,
        {
          filename: "_downloads/update.apk",
        },
        (download, status) => {
          if (status === 200) {
            this.installing = true;
            this.progress = 100;
            const filePath = download.filename;
            plus.runtime.install(
              filePath,
              { force: true },
              () => {
                plus.runtime.restart();
              },
              (err) => {
                console.error("安装失败:", err);
                this.downloading = false;
                this.installing = false;
                uni.showToast({
                  title: "安装失败，请重试",
                  icon: "none",
                });
              }
            );
          } else {
            this.downloading = false;
            uni.showToast({
              title: "下载失败，请重试",
              icon: "none",
            });
          }
        }
      );

      task.addEventListener("statechanged", (download) => {
        if (download.downloadedSize > 0 && download.totalSize > 0) {
          this.progress = Math.round(
            (download.downloadedSize / download.totalSize) * 100
          );
        }
      });

      this.downloadTask = task;
      task.start();
      // #endif
    },
  },

  beforeDestroy() {
    // 清理下载任务
    if (this.downloadTask) {
      try {
        this.downloadTask.abort();
      } catch (e) {}
    }
  },
};
</script>

<style lang="scss" scoped>
// 颜色变量
$light-bg-card: #ffffff;
$light-text-primary: #1a1a1a;
$light-text-secondary: #666666;
$light-text-muted: #999999;
$light-border: rgba(0, 0, 0, 0.08);
$accent-blue: #3b82f6;
$accent-green: #10b981;

$dark-bg-deep: #0a1628;
$dark-bg-card: #122640;
$dark-text-light: #f0f6fc;
$dark-text-muted: rgba(240, 246, 252, 0.6);
$dark-glass-bg: rgba(255, 255, 255, 0.06);
$dark-glass-border: rgba(255, 255, 255, 0.1);

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
  z-index: 10000;
  transition: all 0.3s ease;

  &--show {
    background: rgba(30, 58, 95, 0.4);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
  }
}

.dialog {
  width: 600rpx;
  background: $light-bg-card;
  border-radius: 32rpx;
  padding: 48rpx 40rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 24rpx 80rpx rgba(30, 58, 95, 0.25),
    0 8rpx 24rpx rgba(30, 58, 95, 0.15);
  transform: scale(0.85) translateY(40rpx);
  opacity: 0;
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity 0.3s ease;

  &--show {
    transform: scale(1) translateY(0);
    opacity: 1;
  }

  &__header {
    margin-bottom: 24rpx;
  }

  &__icon {
    width: 120rpx;
    height: 120rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(16, 185, 129, 0.12) 100%);
    position: relative;

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
        rgba(59, 130, 246, 0.2) 0%,
        transparent 70%
      );
      opacity: 0;
      animation: iconGlow 2s ease-in-out infinite;
    }
  }

  &__title {
    font-size: 36rpx;
    font-weight: 600;
    color: $light-text-primary;
    margin-bottom: 8rpx;
  }

  &__version {
    font-size: 26rpx;
    color: $accent-blue;
    font-weight: 500;
    margin-bottom: 24rpx;
  }

  &__desc-scroll {
    max-height: 240rpx;
    width: 100%;
    margin-bottom: 32rpx;
  }

  &__desc {
    font-size: 28rpx;
    color: $light-text-secondary;
    line-height: 1.6;
    text-align: left;
    white-space: pre-wrap;
  }

  &__no-url {
    width: 100%;
    padding: 24rpx;
    background: rgba(59, 130, 246, 0.06);
    border-radius: 16rpx;
    margin-bottom: 32rpx;
    text-align: center;
  }

  &__no-url-text {
    font-size: 26rpx;
    color: $accent-blue;
  }

  &__progress {
    width: 100%;
    margin-bottom: 32rpx;
  }

  &__buttons {
    display: flex;
    width: 100%;
    gap: 20rpx;
  }

  &__btn {
    flex: 1;
    height: 88rpx;
    border-radius: 20rpx;
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
      background: #f5f7fa;
    }

    &--confirm {
      background: linear-gradient(135deg, $accent-blue 0%, #2563eb 100%);
      box-shadow: 0 8rpx 24rpx rgba(59, 130, 246, 0.35);

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
          rgba(255, 255, 255, 0.2) 50%,
          transparent 100%
        );
        animation: btnShimmer 3s ease-in-out infinite;
      }
    }

    &--full {
      flex: none;
      width: 100%;
    }
  }

  &__btn-text {
    font-size: 30rpx;
    font-weight: 500;
    color: $light-text-secondary;
    position: relative;
    z-index: 2;

    &--confirm {
      color: #fff;
    }
  }
}

// 进度条
.progress-bar {
  width: 100%;
  height: 12rpx;
  background: #f0f0f0;
  border-radius: 6rpx;
  overflow: hidden;
  margin-bottom: 12rpx;

  &__fill {
    height: 100%;
    background: linear-gradient(90deg, $accent-blue, $accent-green);
    border-radius: 6rpx;
    transition: width 0.3s ease;
  }
}

.progress-text {
  font-size: 24rpx;
  color: $light-text-muted;
  text-align: center;
  display: block;
}

// 更新图标
.icon-update {
  width: 48rpx;
  height: 48rpx;
  position: relative;

  // 向上箭头
  &::before {
    content: "";
    position: absolute;
    top: 8rpx;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 14rpx solid transparent;
    border-right: 14rpx solid transparent;
    border-bottom: 18rpx solid $accent-blue;
  }

  &::after {
    content: "";
    position: absolute;
    bottom: 6rpx;
    left: 50%;
    transform: translateX(-50%);
    width: 6rpx;
    height: 22rpx;
    background: $accent-blue;
    border-radius: 3rpx;
  }
}

// 动画
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

// 深色模式
.dialog--dark {
  background: $dark-bg-card;
  border: 1rpx solid $dark-glass-border;
  box-shadow: 0 24rpx 80rpx rgba(0, 0, 0, 0.5),
    0 8rpx 24rpx rgba(0, 0, 0, 0.3);

  .dialog__title {
    color: $dark-text-light;
  }

  .dialog__desc {
    color: $dark-text-muted;
  }

  .dialog__no-url {
    background: rgba(59, 130, 246, 0.1);
  }

  .dialog__btn--cancel {
    background: rgba(255, 255, 255, 0.06);
  }

  .dialog__btn--confirm {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    box-shadow: 0 8rpx 24rpx rgba(59, 130, 246, 0.4);
  }

  .dialog__btn-text {
    color: $dark-text-muted;
  }

  .progress-bar {
    background: rgba(255, 255, 255, 0.1);
  }

  .progress-text {
    color: $dark-text-muted;
  }
}
</style>
