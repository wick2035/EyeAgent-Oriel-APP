<template>
  <view class="page" :class="{ 'page--dark': isDark }">
    <!-- 顶部渐变背景 -->
    <view class="page__bg"></view>

    <!-- 固定顶部栏 -->
    <view class="fixed-top" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="header">
        <view class="header__left">
          <text class="header__greeting">{{ greeting }}</text>
          <text class="header__name">欢迎使用AI医问通</text>
        </view>
        <view class="header__right">
          <view class="header__notify" @click="goToMessages">
            <image class="notify-icon" src="@/static/roll.svg" mode="aspectFit" />
            <view v-if="unreadCount > 0" class="notify-badge">{{
              unreadCount > 99 ? "99+" : unreadCount
            }}</view>
          </view>
        </view>
      </view>
    </view>

    <!-- 顶部占位 -->
    <view class="fixed-top-placeholder" :style="{ height: topBarHeight + 'px' }"></view>

    <!-- 搜索栏 -->
    <view class="search-bar" @click="goToSearch">
      <view class="search-bar__icon"></view>
      <text class="search-bar__placeholder">搜索症状、疾病、医生...</text>
    </view>

    <!-- 快捷服务 -->
    <view class="services">
      <view class="services__title">快捷服务</view>
      <view class="services__grid">
        <view
          v-for="(service, index) in services"
          :key="index"
          class="service-item"
          :style="{ animationDelay: index * 0.1 + 's' }"
          @click="handleService(service)"
        >
          <view
            class="service-item__icon"
            :class="[`service-item__icon--${service.type}`]"
          >
            <image
              v-if="service.icon === 'consult'"
              class="service-icon service-icon--consult"
              src="@/static/chat-online.svg"
              mode="aspectFit"
            />
            <image
              v-else-if="service.icon === 'appointment'"
              class="service-icon service-icon--appointment"
              src="@/static/book.svg"
              mode="aspectFit"
            />
            <image
              v-else-if="service.icon === 'cloud'"
              class="service-icon service-icon--cloud"
              src="@/static/cloud.svg"
              mode="aspectFit"
            />
            <image
              v-else-if="service.icon === 'medicine'"
              class="service-icon service-icon--medicine"
              src="@/static/medicine.svg"
              mode="aspectFit"
            />
            <view
              v-else
              class="service-icon"
              :class="[`service-icon--${service.icon}`]"
            ></view>
          </view>
          <text class="service-item__text">{{ service.name }}</text>
        </view>
      </view>
    </view>

    <!-- 眼部健康 -->
    <EyeHealthSection />

    <!-- 健康资讯 -->
    <view class="news">
      <view class="news__header">
        <text class="news__title">健康资讯</text>
        <text class="news__more" @click="goToNews">更多</text>
      </view>
      <view class="news__list">
        <view
          v-for="(item, index) in newsList"
          :key="index"
          class="news-item"
          @click="goToNewsDetail(item)"
        >
          <view class="news-item__content">
            <text class="news-item__title">{{ item.title }}</text>
            <text class="news-item__desc">{{ item.desc }}</text>
            <view class="news-item__meta">
              <text class="news-item__source">{{ item.source }}</text>
              <text class="news-item__time">{{ item.time }}</text>
            </view>
          </view>
          <image
            v-if="item.cover"
            class="news-item__cover"
            :src="item.cover"
            mode="aspectFill"
          ></image>
        </view>
      </view>
    </view>

    <!-- 底部占位（为TabBar留出空间） -->
    <view class="tabbar-placeholder"></view>

    <!-- 底部导航 -->
    <TabBar />

    <!-- 顶部通知栏 -->

    <!-- 版本更新弹窗 -->
    <UpdateDialog ref="updateDialog" @cancel="onUpdateDismiss" />
    <TopNotificationBar />
  </view>
</template>

<script>
import TabBar from "@/components/TabBar.vue";
import EyeHealthSection from "@/components/eye-health/EyeHealthSection.vue";
import UpdateDialog from "@/components/UpdateDialog.vue";
import { isDarkMode } from "@/store/theme.js";
import { getUnreadCount } from "@/store/notification.js";
import { getNewsList } from "@/utils/api/news.js";
import { dismissUpdate } from "@/utils/version.js";

import TopNotificationBar from '@/components/TopNotificationBar.vue'

export default {
  components: {
		TopNotificationBar,
    TabBar,
    EyeHealthSection,
    UpdateDialog,
  },
  data() {
    return {
      statusBarHeight: 44,
      topBarHeight: 0,
      services: [
        {
          name: "AI问诊",
          icon: "consult",
          type: "primary",
          path: "/pages/ai-consult/ai-consult",
        },
        {
          name: "预约挂号",
          icon: "appointment",
          type: "warning",
          path: "/pages/appointment/appointment",
        },
        {
          name: "云上医院",
          icon: "cloud",
          type: "info",
          path: "/pages/profile/telemedicine",
        },
        {
          name: "用药提醒",
          icon: "medicine",
          type: "success",
          path: "/pages/medication/medication-reminder",
        },
      ],
      newsList: [],
    };
  },
  computed: {
    isDark() {
      return isDarkMode();
    },
    unreadCount() {
      return getUnreadCount();
    },
    greeting() {
      const hour = new Date().getHours();
      if (hour < 6) return "夜深了";
      if (hour < 9) return "早上好";
      if (hour < 12) return "上午好";
      if (hour < 14) return "中午好";
      if (hour < 18) return "下午好";
      if (hour < 22) return "晚上好";
      return "夜深了";
    },
  },
  onLoad() {
    this.getStatusBarHeight();
    this.loadNews();

    // 监听全局更新弹窗事件
    uni.$on("show-update-dialog", this.showUpdateDialog);
  },
  onReady() {
    this.measureTopBar();
  },
  onUnload() {
    uni.$off("show-update-dialog", this.showUpdateDialog);
  },
  onShow() {
    // #ifdef APP-PLUS
    uni.hideTabBar({ animation: false });
    // #endif
  },
  methods: {
    getStatusBarHeight() {
      const sysInfo = uni.getSystemInfoSync();
      this.statusBarHeight = sysInfo.statusBarHeight || 44;
    },
    measureTopBar() {
      const query = uni.createSelectorQuery().in(this);
      query.select('.fixed-top').boundingClientRect((rect) => {
        if (rect) {
          this.topBarHeight = rect.height;
        }
      }).exec();
    },
    async loadNews() {
      try {
        const res = await getNewsList({
          category: "all",
          page: 1,
          pageSize: 2,
        });
        if (res.code === 200 && res.data.list) {
          this.newsList = res.data.list.map((item) => ({
            id: item.id,
            title: item.title,
            desc: item.summary,
            source: item.source,
            time: this.formatNewsTime(item.publishTime),
            cover: item.cover,
          }));
        }
      } catch (error) {
        console.error("加载健康资讯失败:", error);
      }
    },
    formatNewsTime(timeStr) {
      if (!timeStr) return "";
      const time = new Date(timeStr.replace(/-/g, "/"));
      const now = new Date();
      const diff = now - time;
      const minute = 60 * 1000;
      const hour = 60 * minute;
      const day = 24 * hour;

      if (diff < minute) {
        return "刚刚";
      } else if (diff < hour) {
        return Math.floor(diff / minute) + "分钟前";
      } else if (diff < day) {
        return Math.floor(diff / hour) + "小时前";
      } else if (diff < 7 * day) {
        return Math.floor(diff / day) + "天前";
      }
      const month = time.getMonth() + 1;
      const date = time.getDate();
      return `${month}月${date}日`;
    },
    goToMessages() {
      uni.switchTab({
        url: "/pages/messages/messages",
      });
    },
    goToSearch() {
      uni.showToast({ title: "搜索功能开发中", icon: "none" });
    },
    handleService(service) {
      if (service.path) {
        const tabBarPages = [
          "/pages/index/index",
          "/pages/appointment/appointment",
          "/pages/ai-consult/ai-consult",
          "/pages/messages/messages",
          "/pages/profile/profile",
        ];
        if (tabBarPages.includes(service.path)) {
          uni.switchTab({ url: service.path });
        } else {
          uni.navigateTo({ url: service.path });
        }
      } else {
        uni.showToast({ title: "功能开发中", icon: "none" });
      }
    },
    goToNews() {
      uni.navigateTo({
        url: "/pages/news/news-list",
      });
    },
    goToNewsDetail(item) {
      uni.navigateTo({
        url: `/pages/news/news-detail?id=${item.id}`,
      });
    },
    showUpdateDialog(data) {
      if (this.$refs.updateDialog) {
        this.$refs.updateDialog.show(data);
      }
    },
    onUpdateDismiss(version) {
      // 用户跳过可选更新，记住该版本
      if (version) {
        dismissUpdate(version);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: $bg-base;
  position: relative;

  &__bg {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 480rpx;
    background: linear-gradient(180deg, #e8f4fd 0%, $bg-base 100%);
    z-index: 0;
  }

  &--dark {
    background: $dark-bg-base;

    .page__bg {
      background: linear-gradient(
        180deg,
        rgba(74, 144, 217, 0.1) 0%,
        $dark-bg-base 100%
      );
    }
  }
}

.fixed-top {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  background: #e8f4fd;
  padding-bottom: 20rpx;

  &::after {
    content: '';
    position: absolute;
    bottom: -24rpx;
    left: 0;
    right: 0;
    height: 24rpx;
    background: linear-gradient(180deg, rgba(232, 244, 253, 0.6) 0%, transparent 100%);
    pointer-events: none;
  }
}

.fixed-top-placeholder {
  width: 100%;
}

.header {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-lg $spacing-lg 0;

  &__left {
    display: flex;
    flex-direction: column;
  }

  &__greeting {
    font-size: $font-size-sm;
    color: $text-secondary;
    margin-bottom: $spacing-xs;
  }

  &__name {
    font-size: $font-size-xl;
    font-weight: $font-weight-semibold;
    color: $text-primary;
  }

  &__notify {
    width: 80rpx;
    height: 80rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: $bg-card;
    border-radius: $radius-lg;
    box-shadow: $shadow-sm;
    position: relative;
  }
}

.notify-icon {
  width: 44rpx;
  height: 48rpx;
}

.notify-badge {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  min-width: 28rpx;
  height: 28rpx;
  padding: 0 6rpx;
  background: $color-accent;
  color: #fff;
  font-size: 18rpx;
  border-radius: 14rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-bar {
  position: relative;
  z-index: 1;
  margin: $spacing-lg;
  height: 88rpx;
  background: $bg-card;
  border-radius: $radius-xl;
  box-shadow: $shadow-sm;
  display: flex;
  align-items: center;
  padding: 0 $spacing-lg;

  &__icon {
    width: 36rpx;
    height: 36rpx;
    border: 3rpx solid $text-muted;
    border-radius: 50%;
    margin-right: $spacing-md;
    position: relative;

    &::after {
      content: "";
      position: absolute;
      bottom: -6rpx;
      right: -6rpx;
      width: 12rpx;
      height: 3rpx;
      background: $text-muted;
      transform: rotate(45deg);
    }
  }

  &__placeholder {
    font-size: $font-size-base;
    color: $text-muted;
  }
}

.services {
  position: relative;
  z-index: 1;
  padding: 0 $spacing-lg;
  margin-bottom: $spacing-lg;

  &__title {
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    color: $text-primary;
    margin-bottom: $spacing-md;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: $spacing-md;
  }
}

.service-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: fadeInUp 0.5s ease backwards;

  &__icon {
    width: 112rpx;
    height: 112rpx;
    border-radius: $radius-lg;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: $spacing-sm;
    transition: transform 0.25s $ease-out-back;

    &--primary {
      background: linear-gradient(
        135deg,
        rgba(30, 58, 95, 0.1) 0%,
        rgba(45, 90, 135, 0.15) 100%
      );
    }
    &--success {
      background: linear-gradient(
        135deg,
        rgba(16, 185, 129, 0.1) 0%,
        rgba(16, 185, 129, 0.15) 100%
      );
    }
    &--info {
      background: linear-gradient(
        135deg,
        rgba(59, 130, 246, 0.1) 0%,
        rgba(59, 130, 246, 0.15) 100%
      );
    }
    &--warning {
      background: linear-gradient(
        135deg,
        rgba(245, 158, 11, 0.1) 0%,
        rgba(245, 158, 11, 0.15) 100%
      );
    }

    &:active {
      transform: scale(0.92);
    }
  }

  &__text {
    font-size: $font-size-sm;
    color: $text-secondary;
  }
}

.service-icon {
  width: 48rpx;
  height: 48rpx;
  position: relative;

  &--consult {
    // 调整为更深的蓝色，与背景协调
    filter: invert(20%) sepia(50%) saturate(2000%) hue-rotate(200deg)
      brightness(90%) contrast(95%);
  }

  &--appointment {
    // 使用 filter 将黑色 SVG 转为 $color-warning 橙色（降低饱和度和亮度，避免iOS端过亮）
    filter: invert(63%) sepia(52%) saturate(1600%) hue-rotate(2deg)
      brightness(96%) contrast(93%);
  }

  &--cloud {
    // 使用 filter 将黑色 SVG 转为天空蓝 #0EA5E9
    filter: invert(52%) sepia(94%) saturate(1095%) hue-rotate(176deg)
      brightness(98%) contrast(92%);
  }

  &--medicine {
    // 使用 filter 将黑色 SVG 转为 $color-success 绿色
    filter: invert(56%) sepia(52%) saturate(563%) hue-rotate(109deg)
      brightness(95%) contrast(92%);
  }
}

.news {
  position: relative;
  z-index: 1;
  padding: 0 $spacing-lg;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-md;
  }

  &__title {
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    color: $text-primary;
  }

  &__more {
    font-size: $font-size-sm;
    color: $color-primary;
  }
}

.news-item {
  background: $bg-card;
  border-radius: $radius-lg;
  padding: $spacing-md;
  margin-bottom: $spacing-md;
  box-shadow: $shadow-sm;
  display: flex;

  &__content {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  &__title {
    font-size: $font-size-base;
    font-weight: $font-weight-medium;
    color: $text-primary;
    line-height: $line-height-normal;
    margin-bottom: $spacing-xs;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__desc {
    font-size: $font-size-sm;
    color: $text-secondary;
    line-height: $line-height-normal;
    margin-bottom: $spacing-sm;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__meta {
    display: flex;
    align-items: center;
    margin-top: auto;
  }

  &__source {
    font-size: $font-size-xs;
    color: $text-muted;
    margin-right: $spacing-md;
  }

  &__time {
    font-size: $font-size-xs;
    color: $text-muted;
  }

  &__cover {
    width: 180rpx;
    height: 120rpx;
    border-radius: $radius-md;
    margin-left: $spacing-md;
    flex-shrink: 0;
  }
}

.tabbar-placeholder {
  height: calc(140rpx + env(safe-area-inset-bottom));
}

// 深色模式适配
.page--dark {
  .fixed-top {
    background: $dark-bg-base;

    &::after {
      background: linear-gradient(180deg, rgba($dark-bg-base, 0.6) 0%, transparent 100%);
    }
  }
  .header__greeting {
    color: $dark-text-secondary;
  }
  .header__name {
    color: $dark-text-primary;
  }
  .header__notify {
    background: $dark-bg-card;
  }
  .notify-icon {
    filter: brightness(0) invert(1);
  }

  .search-bar {
    background: $dark-bg-card;
    &__icon {
      border-color: $dark-text-muted;
    }
    &__icon::after {
      background: $dark-text-muted;
    }
    &__placeholder {
      color: $dark-text-muted;
    }
  }

  .services__title {
    color: $dark-text-primary;
  }
  .service-item__text {
    color: $dark-text-secondary;
  }
  .service-item__icon--primary {
    background: linear-gradient(
      135deg,
      rgba(74, 144, 217, 0.15) 0%,
      rgba(74, 144, 217, 0.22) 100%
    );
  }
  .service-icon--consult {
    filter: invert(52%) sepia(94%) saturate(1095%) hue-rotate(176deg)
      brightness(98%) contrast(92%);
  }

  .news__title {
    color: $dark-text-primary;
  }
  .news__more {
    color: $dark-color-primary;
  }
  .news-item {
    background: $dark-bg-card;
    &__title {
      color: $dark-text-primary;
    }
    &__desc {
      color: $dark-text-secondary;
    }
    &__source,
    &__time {
      color: $dark-text-muted;
    }
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
