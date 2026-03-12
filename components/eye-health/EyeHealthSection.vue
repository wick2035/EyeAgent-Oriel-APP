<template>
  <view class="eye-health" :class="{ 'eye-health--dark': isDark }">
    <!-- 标题栏 -->
    <view class="eye-health__header">
      <view class="eye-health__title-wrap">
        <text class="eye-health__title">眼部健康</text>
        <text v-if="ageGroupLabel" class="eye-health__badge">{{
          ageGroupLabel
        }}</text>
      </view>
      <text class="eye-health__more" @click="goToDetail">了解更多</text>
    </view>

    <!-- 横向滚动卡片 -->
    <scroll-view class="eye-health__scroll" scroll-x enable-flex>
      <view class="eye-health__cards">
        <EyeHealthCard
          v-for="(item, index) in healthData"
          :key="item.id"
          :title="item.title"
          :main-value="item.mainValue"
          :main-unit="item.mainUnit"
          :status="item.status"
          :delay="index * 0.08"
          @click="handleCardClick(item)"
        />
      </view>
    </scroll-view>
  </view>
</template>

<script>
import EyeHealthCard from "./EyeHealthCard.vue";
import { isDarkMode } from "@/store/theme.js";
import { getUserInfo } from "@/store/user.js";
import { getHealthDataByGroup } from "@/store/eyeHealth.js";
import { calculateAge, getAgeGroup, getAgeGroupLabel } from "@/utils/age.js";

export default {
  name: "EyeHealthSection",
  components: {
    EyeHealthCard,
  },
  data() {
    return {
      healthData: [],
    };
  },
  computed: {
    isDark() {
      return isDarkMode();
    },
    userBirthday() {
      const userInfo = getUserInfo();
      return userInfo?.birthday || null;
    },
    userAge() {
      return calculateAge(this.userBirthday);
    },
    ageGroup() {
      return getAgeGroup(this.userAge);
    },
    ageGroupLabel() {
      return getAgeGroupLabel(this.ageGroup);
    },
  },
  watch: {
    ageGroup: {
      handler(newGroup) {
        this.loadHealthData(newGroup);
      },
      immediate: true,
    },
  },
  methods: {
    loadHealthData(group) {
      this.healthData = getHealthDataByGroup(group);
    },
    goToDetail() {
      uni.navigateTo({
        url: `/pages/health/eye-health-detail?ageGroup=${this.ageGroup}`
      });
    },
    handleCardClick(item) {
      uni.navigateTo({
        url: `/pages/health/eye-health-detail?ageGroup=${this.ageGroup}`
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.eye-health {
  position: relative;
  z-index: 1;
  margin-bottom: 32rpx;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20rpx;
    padding: 0 32rpx;
  }

  &__title-wrap {
    display: flex;
    align-items: center;
  }

  &__title {
    font-size: 32rpx;
    font-weight: 600;
    color: #1a2b3c;
    letter-spacing: 1rpx;
  }

  &__badge {
    margin-left: 12rpx;
    padding: 4rpx 12rpx;
    background: linear-gradient(
      135deg,
      rgba(102, 126, 234, 0.15) 0%,
      rgba(118, 75, 162, 0.2) 100%
    );
    border-radius: 8rpx;
    font-size: 20rpx;
    color: #667eea;
    font-weight: 500;
  }

  &__more {
    font-size: 24rpx;
    color: #1e3a5f;
    opacity: 0.8;
    transition: opacity 150ms ease;

    &:active {
      opacity: 0.5;
    }
  }

  &__scroll {
    width: 100%;
    white-space: nowrap;
  }

  &__cards {
    display: inline-flex;
    gap: 20rpx;
    padding: 0 32rpx;
    padding-bottom: 8rpx; // 给阴影留空间
  }

  // 深色模式
  &--dark {
    .eye-health__title {
      color: #f0f6fc;
    }

    .eye-health__badge {
      background: linear-gradient(
        135deg,
        rgba(102, 126, 234, 0.25) 0%,
        rgba(118, 75, 162, 0.3) 100%
      );
      color: #a8b4f0;
    }

    .eye-health__more {
      color: #4a90d9;
    }
  }
}
</style>
