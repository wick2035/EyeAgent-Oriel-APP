<template>
  <view class="grid" :class="{ 'grid--dark': isDark }">
    <!-- 屈光数据 -->
    <view class="grid__group" :style="{ animationDelay: '0s' }">
      <text class="grid__group-title">屈光数据</text>
      <view class="grid__table">
        <view class="grid__row grid__row--header">
          <text class="grid__cell grid__cell--label"></text>
          <text class="grid__cell grid__cell--value">SPH</text>
          <text class="grid__cell grid__cell--value">CYL</text>
          <text class="grid__cell grid__cell--value">AXIS</text>
          <text class="grid__cell grid__cell--value">VA</text>
        </view>
        <view class="grid__row">
          <text class="grid__cell grid__cell--label grid__cell--od">OD</text>
          <text
            class="grid__cell grid__cell--value grid__cell--mono"
            :style="getSphStyle(examData.od.sph)"
            >{{ formatSph(examData.od.sph) }}</text
          >
          <text class="grid__cell grid__cell--value grid__cell--mono">{{
            formatCyl(examData.od.cyl)
          }}</text>
          <text class="grid__cell grid__cell--value grid__cell--mono"
            >{{ examData.od.axis }}°</text
          >
          <text class="grid__cell grid__cell--value grid__cell--mono">{{
            examData.od.va.toFixed(1)
          }}</text>
        </view>
        <view class="grid__row">
          <text class="grid__cell grid__cell--label grid__cell--os">OS</text>
          <text
            class="grid__cell grid__cell--value grid__cell--mono"
            :style="getSphStyle(examData.os.sph)"
            >{{ formatSph(examData.os.sph) }}</text
          >
          <text class="grid__cell grid__cell--value grid__cell--mono">{{
            formatCyl(examData.os.cyl)
          }}</text>
          <text class="grid__cell grid__cell--value grid__cell--mono"
            >{{ examData.os.axis }}°</text
          >
          <text class="grid__cell grid__cell--value grid__cell--mono">{{
            examData.os.va.toFixed(1)
          }}</text>
        </view>
      </view>
    </view>

    <!-- 角膜与眼轴 -->
    <view class="grid__group" :style="{ animationDelay: '0.08s' }">
      <text class="grid__group-title">角膜与眼轴</text>
      <view class="grid__table">
        <view class="grid__row grid__row--header">
          <text class="grid__cell grid__cell--label"></text>
          <text class="grid__cell grid__cell--value">AL(mm)</text>
          <text class="grid__cell grid__cell--value">K(D)</text>
          <text class="grid__cell grid__cell--value">IOP(mmHg)</text>
        </view>
        <view class="grid__row">
          <text class="grid__cell grid__cell--label grid__cell--od">OD</text>
          <text
            class="grid__cell grid__cell--value grid__cell--mono"
            :style="getAlStyle(examData.od.al)"
            >{{ examData.od.al.toFixed(2) }}</text
          >
          <text class="grid__cell grid__cell--value grid__cell--mono">{{
            examData.od.k.toFixed(2)
          }}</text>
          <text
            class="grid__cell grid__cell--value grid__cell--mono"
            :style="getIopStyle(examData.od.iop)"
            >{{ examData.od.iop }}</text
          >
        </view>
        <view class="grid__row">
          <text class="grid__cell grid__cell--label grid__cell--os">OS</text>
          <text
            class="grid__cell grid__cell--value grid__cell--mono"
            :style="getAlStyle(examData.os.al)"
            >{{ examData.os.al.toFixed(2) }}</text
          >
          <text class="grid__cell grid__cell--value grid__cell--mono">{{
            examData.os.k.toFixed(2)
          }}</text>
          <text
            class="grid__cell grid__cell--value grid__cell--mono"
            :style="getIopStyle(examData.os.iop)"
            >{{ examData.os.iop }}</text
          >
        </view>
      </view>
    </view>

    <!-- 裸眼视力 + 瞳距 -->
    <view class="grid__group" :style="{ animationDelay: '0.16s' }">
      <text class="grid__group-title">裸眼视力与瞳距</text>
      <view class="grid__inline">
        <view class="grid__inline-item">
          <text class="grid__inline-label">OD 裸眼</text>
          <text
            class="grid__inline-value grid__cell--mono"
            :style="getVisionStyle(examData.od.nakedVision)"
            >{{ examData.od.nakedVision.toFixed(1) }}</text
          >
        </view>
        <view class="grid__inline-divider"></view>
        <view class="grid__inline-item">
          <text class="grid__inline-label">OS 裸眼</text>
          <text
            class="grid__inline-value grid__cell--mono"
            :style="getVisionStyle(examData.os.nakedVision)"
            >{{ examData.os.nakedVision.toFixed(1) }}</text
          >
        </view>
        <view class="grid__inline-divider"></view>
        <view class="grid__inline-item">
          <text class="grid__inline-label">瞳距(PD)</text>
          <text class="grid__inline-value grid__cell--mono"
            >{{ examData.pd }}<text class="grid__unit">mm</text></text
          >
        </view>
      </view>
    </view>

    <!-- 数据更新日期 -->
    <view class="grid__footer">
      <text class="grid__footer-text"
        >数据更新日期：{{ examData.examDate }}</text
      >
    </view>
  </view>
</template>

<script>
import { isDarkMode } from "@/store/theme.js";
import { getMyopiaRisk } from "@/store/eyeHealth.js";

export default {
  name: "EyeDataGrid",
  props: {
    examData: {
      type: Object,
      required: true,
    },
  },
  computed: {
    isDark() {
      return isDarkMode();
    },
  },
  methods: {
    formatSph(v) {
      return v > 0 ? `+${v.toFixed(2)}` : v.toFixed(2);
    },
    formatCyl(v) {
      return v > 0 ? `+${v.toFixed(2)}` : v.toFixed(2);
    },
    getSphStyle(sph) {
      const risk = getMyopiaRisk(sph);
      return { color: risk.color };
    },
    getAlStyle(al) {
      // 眼轴 > 26mm 需关注
      if (al > 26.5) return { color: "#EF4444" };
      if (al > 26) return { color: "#F59E0B" };
      return {};
    },
    getIopStyle(iop) {
      // 眼压 > 21 需关注
      if (iop > 21) return { color: "#EF4444" };
      if (iop > 18) return { color: "#F59E0B" };
      return {};
    },
    getVisionStyle(v) {
      if (v < 4.5) return { color: "#EF4444" };
      if (v < 4.8) return { color: "#F59E0B" };
      return {};
    },
  },
};
</script>

<style lang="scss" scoped>
.grid {
  padding-top: 8rpx;

  &__group {
    margin-bottom: 20rpx;
    animation: grid-enter 0.4s cubic-bezier(0.16, 1, 0.3, 1) backwards;
  }

  &__group-title {
    font-size: 22rpx;
    color: #9aabbf;
    font-weight: 500;
    margin-bottom: 12rpx;
    display: block;
    letter-spacing: 1rpx;
  }

  &__table {
    background: rgba(0, 0, 0, 0.02);
    border-radius: 16rpx;
    overflow: hidden;
  }

  &__row {
    display: flex;
    align-items: center;
    padding: 16rpx 20rpx;
    border-bottom: 1rpx solid rgba(0, 0, 0, 0.04);

    &:last-child {
      border-bottom: none;
    }

    &--header {
      background: rgba(0, 0, 0, 0.02);

      .grid__cell--value {
        font-size: 20rpx;
        color: #9aabbf;
        font-weight: 500;
      }
    }
  }

  &__cell {
    flex: 1;
    text-align: center;
    font-size: 26rpx;
    color: #5a6b7c;

    &--label {
      flex: 0 0 60rpx;
      text-align: left;
      font-weight: 600;
      font-size: 22rpx;
    }

    &--od {
      color: #3b82f6;
    }

    &--os {
      color: #ff6b5b;
    }

    &--value {
      font-size: 26rpx;
    }

    &--mono {
      font-family: "SF Mono", "Menlo", "Consolas", monospace;
      font-weight: 600;
      color: #1a2b3c;
    }
  }

  // 裸眼视力 + 瞳距 内联布局
  &__inline {
    display: flex;
    align-items: center;
    background: rgba(0, 0, 0, 0.02);
    border-radius: 16rpx;
    padding: 20rpx;
  }

  &__inline-item {
    flex: 1;
    text-align: center;
  }

  &__inline-label {
    font-size: 20rpx;
    color: #9aabbf;
    display: block;
    margin-bottom: 8rpx;
  }

  &__inline-value {
    font-size: 34rpx;
    font-weight: 700;
    color: #1a2b3c;
    font-family: "SF Mono", "Menlo", "Consolas", monospace;
  }

  &__inline-divider {
    width: 2rpx;
    height: 56rpx;
    background: rgba(0, 0, 0, 0.06);
    flex-shrink: 0;
  }

  &__unit {
    font-size: 20rpx;
    color: #9aabbf;
    font-weight: 400;
    margin-left: 2rpx;
  }

  &__footer {
    text-align: center;
    padding-top: 8rpx;
  }

  &__footer-text {
    font-size: 20rpx;
    color: #9aabbf;
  }

  // 深色模式
  &--dark {
    .grid__group-title {
      color: #484f58;
    }

    .grid__table {
      background: rgba(255, 255, 255, 0.03);
    }

    .grid__row {
      border-bottom-color: rgba(255, 255, 255, 0.04);

      &--header {
        background: rgba(255, 255, 255, 0.02);

        .grid__cell--value {
          color: #484f58;
        }
      }
    }

    .grid__cell {
      color: #8b949e;

      &--mono {
        color: #f0f6fc;
      }
    }

    .grid__inline {
      background: rgba(255, 255, 255, 0.03);
    }

    .grid__inline-label {
      color: #484f58;
    }

    .grid__inline-value {
      color: #f0f6fc;
    }

    .grid__inline-divider {
      background: rgba(255, 255, 255, 0.06);
    }

    .grid__unit {
      color: #484f58;
    }

    .grid__footer-text {
      color: #484f58;
    }
  }
}

@keyframes grid-enter {
  from {
    opacity: 0;
    transform: translateY(16rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
