<template>
  <view class="help-page" :class="{ 'help-page--dark': isDark }">
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
        <text class="navbar__title">帮助中心</text>
        <view class="navbar__placeholder"></view>
      </view>

      <!-- 滚动区域 -->
      <scroll-view class="scroll-area" scroll-y>
        <!-- 搜索区域 -->
        <view class="search-section" :class="{ 'card--visible': pageReady }">
          <view
            class="search-bar"
            :class="{ 'search-bar--focused': searchFocused }"
          >
            <view class="search-icon"></view>
            <input
              class="search-input"
              placeholder="搜索常见问题..."
              :placeholder-style="
                isDark ? 'color: rgba(240,246,252,0.4)' : 'color: #999'
              "
              v-model="searchKeyword"
              @focus="searchFocused = true"
              @blur="searchFocused = false"
              :cursor-spacing="20"
            />
            <view
              class="search-clear"
              v-if="searchKeyword"
              @click="clearSearch"
            >
              <text class="search-clear__icon">×</text>
            </view>
          </view>
        </view>

        <!-- 快捷入口 -->
        <view
          class="quick-section"
          :class="{ 'card--visible': pageReady }"
          style="--delay: 0.1s"
        >
          <view class="quick-btn quick-btn--phone" @click="callService">
            <view class="quick-btn__icon quick-btn__icon--phone"></view>
            <text class="quick-btn__text">联系客服</text>
          </view>
          <view class="quick-btn quick-btn--feedback" @click="openFeedback">
            <view class="quick-btn__icon quick-btn__icon--feedback"></view>
            <text class="quick-btn__text">意见反馈</text>
          </view>
        </view>

        <!-- FAQ区域 -->
        <view
          class="faq-section"
          :class="{ 'card--visible': pageReady }"
          style="--delay: 0.2s"
        >
          <text class="section-title">常见问题</text>
          <view class="faq-list">
            <view
              class="faq-category"
              v-for="category in filteredFaqs"
              :key="category.id"
            >
              <!-- 分类头 -->
              <view
                class="faq-category__header"
                @click="toggleCategory(category.id)"
              >
                <view
                  class="faq-category__icon"
                  :class="`faq-category__icon--${category.icon}`"
                ></view>
                <text class="faq-category__name">{{ category.name }}</text>
                <text class="faq-category__count"
                  >{{ category.items.length }}个问题</text
                >
                <view
                  class="faq-category__arrow"
                  :class="{
                    'faq-category__arrow--expanded': category.expanded,
                  }"
                ></view>
              </view>
              <!-- 问题列表 -->
              <view
                class="faq-category__content"
                :class="{
                  'faq-category__content--expanded': category.expanded,
                }"
              >
                <view
                  class="faq-item"
                  v-for="item in category.items"
                  :key="item.id"
                  @click.stop="toggleFaqItem(category.id, item.id)"
                >
                  <view class="faq-item__question">
                    <view class="faq-item__q-badge">Q</view>
                    <text class="faq-item__q-text">{{ item.question }}</text>
                    <view
                      class="faq-item__q-arrow"
                      :class="{ 'faq-item__q-arrow--expanded': item.expanded }"
                    ></view>
                  </view>
                  <view
                    class="faq-item__answer"
                    :class="{ 'faq-item__answer--expanded': item.expanded }"
                  >
                    <view class="faq-item__a-badge">A</view>
                    <text class="faq-item__a-text">{{ item.answer }}</text>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 功能指南 -->
        <view
          class="tutorial-section"
          :class="{ 'card--visible': pageReady }"
          style="--delay: 0.3s"
        >
          <view class="section-header">
            <text class="section-title">功能指南</text>
          </view>
          <view class="tutorial-grid">
            <view
              class="tutorial-card"
              v-for="tutorial in tutorials"
              :key="tutorial.id"
              :style="{ background: tutorial.gradient }"
              @click="openTutorial(tutorial)"
            >
              <view
                class="tutorial-card__icon"
                :class="`tutorial-card__icon--${tutorial.icon}`"
              ></view>
              <text class="tutorial-card__title">{{ tutorial.title }}</text>
              <text class="tutorial-card__desc">{{ tutorial.desc }}</text>
            </view>
          </view>
        </view>

        <!-- 联系我们 -->
        <view
          class="contact-section"
          :class="{ 'card--visible': pageReady }"
          style="--delay: 0.4s"
        >
          <text class="section-title">联系我们</text>
          <view class="contact-card">
            <view class="contact-item" @click="callService">
              <view class="contact-item__icon contact-item__icon--phone"></view>
              <view class="contact-item__info">
                <text class="contact-item__label">客服电话</text>
                <text class="contact-item__value">+852 6188 8888</text>
              </view>
              <view class="contact-item__action">
                <text class="contact-item__action-text">拨打</text>
              </view>
            </view>
            <view
              class="contact-item contact-item--no-border"
              @click="copyEmail"
            >
              <view class="contact-item__icon contact-item__icon--email"></view>
              <view class="contact-item__info">
                <text class="contact-item__label">客服邮箱</text>
                <text class="contact-item__value">support@eyeagent.top</text>
              </view>
              <view class="contact-item__action">
                <text class="contact-item__action-text">复制</text>
              </view>
            </view>
          </view>
          <view class="contact-hours">
            <view class="contact-hours__icon"></view>
            <text class="contact-hours__text"
              >客服时间：周一至周日 9:00-21:00</text
            >
          </view>
        </view>

        <!-- 底部留白 -->
        <view class="bottom-space"></view>
      </scroll-view>
    </view>

    <!-- 反馈弹窗 -->
    <view
      class="feedback-modal"
      v-if="showFeedback"
      @click.self="closeFeedback"
    >
      <view
        class="feedback-modal__content"
        :class="{ 'feedback-modal__content--dark': isDark }"
      >
        <view class="feedback-modal__header">
          <text class="feedback-modal__title">意见反馈</text>
          <view class="feedback-modal__close" @click="closeFeedback">
            <text class="feedback-modal__close-icon">×</text>
          </view>
        </view>
        <view class="feedback-modal__body">
          <textarea
            class="feedback-textarea"
            placeholder="请描述您遇到的问题或建议..."
            :placeholder-style="
              isDark ? 'color: rgba(240,246,252,0.4)' : 'color: #999'
            "
            v-model="feedbackContent"
            maxlength="500"
            :cursor-spacing="20"
          ></textarea>
          <text class="feedback-counter">{{ feedbackContent.length }}/500</text>
        </view>
        <view class="feedback-modal__footer">
          <view
            class="feedback-btn feedback-btn--cancel"
            @click="closeFeedback"
          >
            <text class="feedback-btn__text">取消</text>
          </view>
          <view
            class="feedback-btn feedback-btn--submit"
            @click="submitFeedback"
          >
            <text class="feedback-btn__text">提交</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 顶部通知栏 -->
    <TopNotificationBar />
  </view>
</template>

<script>
import { isDarkMode } from "@/store/theme.js";
import TopNotificationBar from "@/components/TopNotificationBar.vue";

export default {
  components: {
    TopNotificationBar,
  },
  data() {
    return {
      statusBarHeight: 44,
      pageReady: false,
      searchKeyword: "",
      searchFocused: false,
      showFeedback: false,
      feedbackContent: "",
      faqCategories: [
        {
          id: "account",
          name: "账户相关",
          icon: "account",
          expanded: false,
          items: [
            {
              id: "a1",
              question: "如何修改登录密码？",
              answer:
                '进入"我的"-"设置"-"修改密码"，验证原密码后即可设置新密码。新密码需包含字母和数字，长度6-20位。',
              expanded: false,
            },
            {
              id: "a2",
              question: "忘记密码怎么办？",
              answer:
                '在登录页面点击"忘记密码"，通过绑定的手机号接收验证码，验证成功后即可重置密码。',
              expanded: false,
            },
            {
              id: "a3",
              question: "如何绑定/更换手机号？",
              answer:
                '进入"我的"-"设置"-"手机号绑定"，需先验证原手机号，再绑定新手机号。每个手机号只能绑定一个账户。',
              expanded: false,
            },
          ],
        },
        {
          id: "ai-consult",
          name: "AI问诊",
          icon: "consult",
          expanded: false,
          items: [
            {
              id: "b1",
              question: "AI问诊结果准确吗？",
              answer:
                "AI问诊基于先进的医学知识库和人工智能技术，可提供专业的健康建议。但AI建议仅供参考，如有严重症状请及时前往医院就诊。",
              expanded: false,
            },
            {
              id: "b2",
              question: "如何开始AI问诊？",
              answer:
                '点击底部导航"AI问诊"或首页"在线问诊"，在对话框中描述您的症状，AI医生会为您进行智能分析和建议。',
              expanded: false,
            },
            {
              id: "b3",
              question: "问诊记录在哪里查看？",
              answer:
                '进入"AI问诊"页面，点击右上角的历史记录图标，可查看所有历史问诊对话记录。',
              expanded: false,
            },
          ],
        },
        {
          id: "medication",
          name: "用药提醒",
          icon: "medicine",
          expanded: false,
          items: [
            {
              id: "c1",
              question: "如何设置用药提醒？",
              answer:
                '进入"我的"-"用药提醒"，点击右下角"+"添加提醒，填写药品名称、服药时间、剂量等信息，开启提醒即可按时收到通知。',
              expanded: false,
            },
            {
              id: "c2",
              question: "为什么收不到提醒通知？",
              answer:
                '请检查：1.应用通知权限是否开启；2."设置"中的"消息通知"是否打开；3.手机是否处于静音或勿扰模式；4.是否开启了省电模式限制后台运行。',
              expanded: false,
            },
          ],
        },
        {
          id: "appointment",
          name: "预约挂号",
          icon: "appointment",
          expanded: false,
          items: [
            {
              id: "d1",
              question: "如何预约挂号？",
              answer:
                '点击"预约"→选择科室→选择医生→选择就诊日期和时段→确认预约信息→完成支付即可预约成功。',
              expanded: false,
            },
            {
              id: "d2",
              question: "如何取消预约？",
              answer:
                '进入"我的"-"就诊记录"，找到需要取消的预约，点击"取消预约"。请注意：就诊当天无法取消，取消后费用将原路退回。',
              expanded: false,
            },
          ],
        },
        {
          id: "privacy",
          name: "隐私安全",
          icon: "shield",
          expanded: false,
          items: [
            {
              id: "e1",
              question: "我的健康数据安全吗？",
              answer:
                "我们采用银行级数据加密技术，严格遵守《个人信息保护法》和《健康医疗数据安全指南》。您的数据仅用于提供医疗服务，未经授权不会向第三方提供。",
              expanded: false,
            },
            {
              id: "e2",
              question: "如何注销账号？",
              answer:
                "请联系客服申请注销账号。注销前请确保无未完成的预约和服务。账号注销后，您的所有个人信息和健康数据将被永久删除，无法恢复。",
              expanded: false,
            },
          ],
        },
      ],
      tutorials: [
        {
          id: 1,
          title: "AI问诊指南",
          desc: "智能对话，专业建议",
          icon: "consult",
          gradient: "linear-gradient(135deg, #1E3A5F 0%, #4A90D9 100%)",
        },
        {
          id: 2,
          title: "预约挂号",
          desc: "快速预约专家门诊",
          icon: "appointment",
          gradient: "linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)",
        },
        {
          id: 3,
          title: "用药提醒",
          desc: "按时服药不遗忘",
          icon: "medicine",
          gradient: "linear-gradient(135deg, #10B981 0%, #34D399 100%)",
        },
        {
          id: 4,
          title: "健康档案",
          desc: "记录您的健康数据",
          icon: "record",
          gradient: "linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)",
        },
      ],
    };
  },
  computed: {
    isDark() {
      return isDarkMode();
    },
    filteredFaqs() {
      if (!this.searchKeyword.trim()) {
        return this.faqCategories;
      }
      const keyword = this.searchKeyword.toLowerCase();
      return this.faqCategories
        .map((cat) => ({
          ...cat,
          expanded: true,
          items: cat.items
            .filter(
              (item) =>
                item.question.toLowerCase().includes(keyword) ||
                item.answer.toLowerCase().includes(keyword)
            )
            .map((item) => ({ ...item, expanded: true })),
        }))
        .filter((cat) => cat.items.length > 0);
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

    clearSearch() {
      this.searchKeyword = "";
    },

    toggleCategory(categoryId) {
      const cat = this.faqCategories.find((c) => c.id === categoryId);
      if (cat) {
        cat.expanded = !cat.expanded;
      }
    },

    toggleFaqItem(categoryId, itemId) {
      const cat = this.faqCategories.find((c) => c.id === categoryId);
      if (cat) {
        const item = cat.items.find((i) => i.id === itemId);
        if (item) {
          item.expanded = !item.expanded;
        }
      }
    },

    callService() {
      uni.makePhoneCall({
        phoneNumber: "+852 6188 8888",
        fail: () => {
          uni.showToast({ title: "拨打失败", icon: "none" });
        },
      });
    },

    copyEmail() {
      uni.setClipboardData({
        data: "support@eyeagent.top",
        success: () => {
          uni.showToast({ title: "邮箱已复制", icon: "success" });
        },
      });
    },

    openFeedback() {
      this.showFeedback = true;
      this.feedbackContent = "";
    },

    closeFeedback() {
      this.showFeedback = false;
    },

    submitFeedback() {
      if (!this.feedbackContent.trim()) {
        uni.showToast({ title: "请输入反馈内容", icon: "none" });
        return;
      }
      // 模拟提交
      uni.showLoading({ title: "提交中..." });
      setTimeout(() => {
        uni.hideLoading();
        uni.showToast({ title: "感谢您的反馈", icon: "success" });
        this.closeFeedback();
      }, 800);
    },

    openTutorial(tutorial) {
      // TabBar页面需要使用switchTab
      const tabBarPages = {
        consult: "/pages/ai-consult/ai-consult",
        appointment: "/pages/appointment/appointment",
      };
      // 普通页面使用navigateTo
      const normalPages = {
        medicine: "/pages/medication/medication-reminder",
        record: "/pages/profile/health-record",
      };

      if (tabBarPages[tutorial.icon]) {
        uni.switchTab({ url: tabBarPages[tutorial.icon] });
      } else if (normalPages[tutorial.icon]) {
        uni.navigateTo({ url: normalPages[tutorial.icon] });
      }
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
$accent-blue: #3b82f6;
$accent-green: #10b981;
$accent-yellow: #f59e0b;

.help-page {
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
    left: 15%;
    top: 12%;
    animation-delay: -1s;
    animation-duration: 9s;
  }
  &--2 {
    left: 25%;
    top: 24%;
    animation-delay: -2s;
    animation-duration: 10s;
  }
  &--3 {
    left: 35%;
    top: 36%;
    animation-delay: -3s;
    animation-duration: 11s;
  }
  &--4 {
    left: 45%;
    top: 48%;
    animation-delay: -4s;
    animation-duration: 12s;
  }
  &--5 {
    left: 55%;
    top: 60%;
    animation-delay: -5s;
    animation-duration: 13s;
  }
  &--6 {
    left: 65%;
    top: 72%;
    animation-delay: -6s;
    animation-duration: 14s;
  }
  &--7 {
    left: 75%;
    top: 84%;
    animation-delay: -7s;
    animation-duration: 15s;
  }
  &--8 {
    left: 85%;
    top: 96%;
    animation-delay: -8s;
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

// ==================== 搜索区域 ====================
.search-section {
  margin-bottom: 24rpx;
}

.search-bar {
  display: flex;
  align-items: center;
  height: 80rpx;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 40rpx;
  padding: 0 32rpx;
  border: 2rpx solid transparent;
  transition: all 0.25s ease;

  &--focused {
    transform: scale(1.02);
    background: rgba(30, 58, 95, 0.05);
    border-color: rgba(30, 58, 95, 0.2);
    box-shadow: 0 4rpx 16rpx rgba(30, 58, 95, 0.1);
  }
}

.search-icon {
  width: 32rpx;
  height: 32rpx;
  border: 3rpx solid $light-text-muted;
  border-radius: 50%;
  position: relative;
  margin-right: 16rpx;

  &::after {
    content: "";
    position: absolute;
    width: 3rpx;
    height: 12rpx;
    background: $light-text-muted;
    border-radius: 2rpx;
    right: -4rpx;
    bottom: -6rpx;
    transform: rotate(-45deg);
  }
}

.search-input {
  flex: 1;
  height: 100%;
  font-size: 28rpx;
  color: $light-text-primary;
  background: transparent;
}

.search-clear {
  width: 40rpx;
  height: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 50%;

  &__icon {
    font-size: 28rpx;
    color: $light-text-muted;
    line-height: 1;
  }
}

// ==================== 快捷入口 ====================
.quick-section {
  display: flex;
  gap: 24rpx;
  margin-bottom: 32rpx;
}

.quick-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  border-radius: 20rpx;
  transition: all 0.2s ease;

  &:active {
    transform: scale(0.96);
    opacity: 0.9;
  }

  &--phone {
    background: linear-gradient(135deg, $light-accent 0%, #4a90d9 100%);
  }

  &--feedback {
    background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
  }

  &__icon {
    width: 36rpx;
    height: 36rpx;
    margin-right: 12rpx;
    position: relative;

    &--phone::before {
      content: "";
      width: 24rpx;
      height: 36rpx;
      border: 2rpx solid #fff;
      border-radius: 6rpx;
      position: absolute;
    }
    &--phone::after {
      content: "";
      width: 10rpx;
      height: 3rpx;
      background: #fff;
      border-radius: 2rpx;
      position: absolute;
      bottom: 6rpx;
      left: 7rpx;
    }

    &--feedback::before {
      content: "";
      width: 28rpx;
      height: 22rpx;
      border: 2rpx solid #fff;
      border-radius: 4rpx;
      position: absolute;
      top: 4rpx;
    }
    &--feedback::after {
      content: "";
      width: 16rpx;
      height: 2rpx;
      background: #fff;
      position: absolute;
      top: 14rpx;
      left: 6rpx;
    }
  }

  &__text {
    font-size: 28rpx;
    font-weight: 500;
    color: #fff;
  }
}

// ==================== 分区标题 ====================
.section-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: $light-text-primary;
  margin-bottom: 20rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

// ==================== FAQ区域 ====================
.faq-section {
  margin-bottom: 32rpx;
}

.faq-list {
  background: $light-bg-card;
  border-radius: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.faq-category {
  &__header {
    display: flex;
    align-items: center;
    padding: 28rpx 32rpx;
    border-bottom: 1rpx solid $light-border;
    transition: background 0.2s ease;

    &:active {
      background: #f5f5f5;
    }
  }

  &__icon {
    width: 40rpx;
    height: 40rpx;
    margin-right: 20rpx;
    border-radius: 10rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;

    &--account {
      background: rgba(59, 130, 246, 0.15);
      &::before {
        content: "";
        width: 16rpx;
        height: 16rpx;
        border: 2rpx solid $accent-blue;
        border-radius: 50%;
        position: absolute;
        top: 6rpx;
      }
      &::after {
        content: "";
        width: 24rpx;
        height: 12rpx;
        border: 2rpx solid $accent-blue;
        border-radius: 12rpx 12rpx 0 0;
        border-bottom: none;
        position: absolute;
        bottom: 4rpx;
      }
    }

    &--consult {
      background: rgba(30, 58, 95, 0.15);
      &::before {
        content: "AI";
        font-size: 14rpx;
        font-weight: 700;
        color: $light-accent;
      }
    }

    &--medicine {
      background: rgba(16, 185, 129, 0.15);
      &::before {
        content: "";
        width: 20rpx;
        height: 10rpx;
        border: 2rpx solid $accent-green;
        border-radius: 10rpx;
        position: absolute;
      }
      &::after {
        content: "";
        width: 8rpx;
        height: 16rpx;
        border: 2rpx solid $accent-green;
        border-radius: 4rpx;
        position: absolute;
        top: 12rpx;
      }
    }

    &--appointment {
      background: rgba(245, 158, 11, 0.15);
      &::before {
        content: "";
        width: 22rpx;
        height: 22rpx;
        border: 2rpx solid $accent-yellow;
        border-radius: 4rpx;
        position: absolute;
      }
      &::after {
        content: "";
        width: 22rpx;
        height: 2rpx;
        background: $accent-yellow;
        position: absolute;
        top: 12rpx;
      }
    }

    &--shield {
      background: rgba(139, 92, 246, 0.15);
      &::before {
        content: "";
        width: 20rpx;
        height: 24rpx;
        border: 2rpx solid #8b5cf6;
        border-radius: 4rpx 4rpx 10rpx 10rpx;
        position: absolute;
      }
    }
  }

  &__name {
    flex: 1;
    font-size: 30rpx;
    font-weight: 500;
    color: $light-text-primary;
  }

  &__count {
    font-size: 24rpx;
    color: $light-text-muted;
    margin-right: 16rpx;
  }

  &__arrow {
    width: 16rpx;
    height: 16rpx;
    border-right: 2rpx solid $light-text-muted;
    border-bottom: 2rpx solid $light-text-muted;
    transform: rotate(45deg);
    transition: transform 0.3s ease;

    &--expanded {
      transform: rotate(-135deg);
    }
  }

  &__content {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.4s cubic-bezier(0.16, 1, 0.3, 1);

    &--expanded {
      max-height: 2000rpx;
    }
  }

  &:last-child .faq-category__header {
    border-bottom: none;
  }
}

.faq-item {
  padding: 0 32rpx;
  background: rgba(0, 0, 0, 0.02);

  &__question {
    display: flex;
    align-items: center;
    padding: 24rpx 0;
    border-bottom: 1rpx solid $light-border;
  }

  &__q-badge {
    width: 36rpx;
    height: 36rpx;
    background: linear-gradient(135deg, $light-accent 0%, #4a90d9 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20rpx;
    font-weight: 700;
    color: #fff;
    margin-right: 16rpx;
    flex-shrink: 0;
  }

  &__q-text {
    flex: 1;
    font-size: 28rpx;
    color: $light-text-primary;
    line-height: 1.5;
  }

  &__q-arrow {
    width: 12rpx;
    height: 12rpx;
    border-right: 2rpx solid $light-text-muted;
    border-bottom: 2rpx solid $light-text-muted;
    transform: rotate(45deg);
    transition: transform 0.3s ease;
    margin-left: 16rpx;
    flex-shrink: 0;

    &--expanded {
      transform: rotate(-135deg);
    }
  }

  &__answer {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease, padding 0.3s ease;

    &--expanded {
      max-height: 500rpx;
      padding: 20rpx 0;
    }
  }

  &__a-badge {
    width: 36rpx;
    height: 36rpx;
    background: linear-gradient(135deg, $accent-coral 0%, #ff8a7a 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20rpx;
    font-weight: 700;
    color: #fff;
    margin-right: 16rpx;
    flex-shrink: 0;
    float: left;
    margin-top: 4rpx;
  }

  &__a-text {
    display: block;
    font-size: 26rpx;
    color: $light-text-secondary;
    line-height: 1.8;
    margin-left: 52rpx;
  }

  &:last-child .faq-item__question {
    border-bottom: none;
  }
}

// ==================== 功能指南 ====================
.tutorial-section {
  margin-bottom: 32rpx;
}

.tutorial-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}

.tutorial-card {
  height: 180rpx;
  border-radius: 20rpx;
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;

  &:active {
    transform: scale(0.96);
    opacity: 0.9;
  }

  &__icon {
    width: 48rpx;
    height: 48rpx;
    position: relative;

    &--consult::before {
      content: "AI";
      font-size: 18rpx;
      font-weight: 700;
      color: #fff;
      background: rgba(255, 255, 255, 0.3);
      padding: 6rpx 10rpx;
      border-radius: 8rpx;
    }

    &--appointment::before {
      content: "";
      width: 32rpx;
      height: 32rpx;
      border: 2rpx solid #fff;
      border-radius: 6rpx;
      position: absolute;
    }
    &--appointment::after {
      content: "";
      width: 32rpx;
      height: 2rpx;
      background: #fff;
      position: absolute;
      top: 12rpx;
    }

    &--medicine::before {
      content: "";
      width: 28rpx;
      height: 14rpx;
      border: 2rpx solid #fff;
      border-radius: 14rpx;
      position: absolute;
    }
    &--medicine::after {
      content: "";
      width: 10rpx;
      height: 20rpx;
      border: 2rpx solid #fff;
      border-radius: 5rpx;
      position: absolute;
      top: 16rpx;
      left: 9rpx;
    }

    &--record::before {
      content: "";
      width: 28rpx;
      height: 34rpx;
      border: 2rpx solid #fff;
      border-radius: 4rpx;
      position: absolute;
    }
    &--record::after {
      content: "";
      width: 16rpx;
      height: 2rpx;
      background: #fff;
      position: absolute;
      top: 14rpx;
      left: 6rpx;
      box-shadow: 0 8rpx 0 #fff;
    }
  }

  &__title {
    font-size: 28rpx;
    font-weight: 600;
    color: #fff;
  }

  &__desc {
    font-size: 22rpx;
    color: rgba(255, 255, 255, 0.8);
  }
}

// ==================== 联系我们 ====================
.contact-section {
  margin-bottom: 32rpx;
}

.contact-card {
  background: $light-bg-card;
  border-radius: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.contact-item {
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
    width: 48rpx;
    height: 48rpx;
    border-radius: 12rpx;
    margin-right: 20rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;

    &--phone {
      background: rgba(30, 58, 95, 0.1);
      &::before {
        content: "";
        width: 22rpx;
        height: 32rpx;
        border: 2rpx solid $light-accent;
        border-radius: 6rpx;
        position: absolute;
      }
      &::after {
        content: "";
        width: 8rpx;
        height: 3rpx;
        background: $light-accent;
        border-radius: 2rpx;
        position: absolute;
        bottom: 10rpx;
      }
    }

    &--email {
      background: rgba(255, 107, 91, 0.1);
      &::before {
        content: "";
        width: 28rpx;
        height: 20rpx;
        border: 2rpx solid $accent-coral;
        border-radius: 4rpx;
        position: absolute;
      }
      &::after {
        content: "";
        width: 0;
        height: 0;
        border-left: 12rpx solid transparent;
        border-right: 12rpx solid transparent;
        border-top: 10rpx solid $accent-coral;
        position: absolute;
        top: 16rpx;
      }
    }
  }

  &__info {
    flex: 1;
  }

  &__label {
    display: block;
    font-size: 24rpx;
    color: $light-text-muted;
    margin-bottom: 4rpx;
  }

  &__value {
    font-size: 28rpx;
    font-weight: 500;
    color: $light-text-primary;
  }

  &__action {
    padding: 12rpx 24rpx;
    background: rgba(30, 58, 95, 0.08);
    border-radius: 24rpx;
  }

  &__action-text {
    font-size: 24rpx;
    font-weight: 500;
    color: $light-accent;
  }
}

.contact-hours {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20rpx 0;
  margin-top: 16rpx;

  &__icon {
    width: 28rpx;
    height: 28rpx;
    border: 2rpx solid $light-text-muted;
    border-radius: 50%;
    margin-right: 12rpx;
    position: relative;

    &::before {
      content: "";
      position: absolute;
      width: 2rpx;
      height: 10rpx;
      background: $light-text-muted;
      top: 4rpx;
      left: 11rpx;
    }
    &::after {
      content: "";
      position: absolute;
      width: 8rpx;
      height: 2rpx;
      background: $light-text-muted;
      top: 12rpx;
      left: 11rpx;
    }
  }

  &__text {
    font-size: 24rpx;
    color: $light-text-muted;
  }
}

// 底部留白
.bottom-space {
  height: calc(60rpx + env(safe-area-inset-bottom));
}

// ==================== 反馈弹窗 ====================
.feedback-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 15vh;
  z-index: 1000;
  animation: fade-in 0.3s ease;

  &__content {
    width: 600rpx;
    background: $light-bg-card;
    border-radius: 32rpx;
    overflow: hidden;
    animation: scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 32rpx;
    border-bottom: 1rpx solid $light-border;
  }

  &__title {
    font-size: 32rpx;
    font-weight: 600;
    color: $light-text-primary;
  }

  &__close {
    width: 48rpx;
    height: 48rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__close-icon {
    font-size: 40rpx;
    color: $light-text-muted;
    line-height: 1;
  }

  &__body {
    padding: 32rpx;
  }

  &__footer {
    display: flex;
    padding: 24rpx 32rpx 32rpx;
    gap: 24rpx;
  }
}

.feedback-textarea {
  width: 100%;
  height: 240rpx;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 16rpx;
  padding: 24rpx;
  font-size: 28rpx;
  color: $light-text-primary;
  box-sizing: border-box;
}

.feedback-counter {
  display: block;
  text-align: right;
  font-size: 24rpx;
  color: $light-text-muted;
  margin-top: 12rpx;
}

.feedback-btn {
  flex: 1;
  height: 88rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:active {
    transform: scale(0.96);
  }

  &--cancel {
    background: rgba(0, 0, 0, 0.06);
  }

  &--submit {
    background: linear-gradient(135deg, $light-accent 0%, #4a90d9 100%);
  }

  &__text {
    font-size: 30rpx;
    font-weight: 500;
  }

  &--cancel &__text {
    color: $light-text-secondary;
  }

  &--submit &__text {
    color: #fff;
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

// ==================== 深色模式 ====================
.help-page--dark {
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

  .search-bar {
    background: $dark-glass-bg;
    border-color: $dark-glass-border;

    &--focused {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(74, 144, 217, 0.4);
    }
  }

  .search-icon {
    border-color: $dark-text-muted;
    &::after {
      background: $dark-text-muted;
    }
  }

  .search-input {
    color: $dark-text-light;
  }

  .search-clear {
    background: rgba(255, 255, 255, 0.15);
    &__icon {
      color: $dark-text-muted;
    }
  }

  .section-title {
    color: $dark-text-light;
  }

  .faq-list {
    background: $dark-glass-bg;
    border: 1rpx solid $dark-glass-border;
    box-shadow: none;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }

  .faq-category {
    &__header {
      border-bottom-color: rgba(255, 255, 255, 0.06);
      &:active {
        background: rgba(255, 255, 255, 0.04);
      }
    }

    &__name {
      color: $dark-text-light;
    }

    &__count {
      color: $dark-text-muted;
    }

    &__arrow {
      border-color: $dark-text-muted;
    }
  }

  .faq-item {
    background: rgba(255, 255, 255, 0.02);

    &__question {
      border-bottom-color: rgba(255, 255, 255, 0.06);
    }

    &__q-text {
      color: $dark-text-light;
    }

    &__q-arrow {
      border-color: $dark-text-muted;
    }

    &__a-text {
      color: $dark-text-muted;
    }
  }

  .tutorial-card {
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.3);
  }

  .contact-card {
    background: $dark-glass-bg;
    border: 1rpx solid $dark-glass-border;
    box-shadow: none;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }

  .contact-item {
    border-bottom-color: rgba(255, 255, 255, 0.06);
    &:active {
      background: rgba(255, 255, 255, 0.04);
    }

    &__label {
      color: $dark-text-muted;
    }

    &__value {
      color: $dark-text-light;
    }

    &__action {
      background: rgba(74, 144, 217, 0.15);
    }

    &__action-text {
      color: #4a90d9;
    }

    &__icon--phone {
      background: rgba(74, 144, 217, 0.15);
      &::before {
        border-color: #4a90d9;
      }
      &::after {
        background: #4a90d9;
      }
    }

    &__icon--email {
      background: rgba(255, 138, 122, 0.15);
      &::before {
        border-color: #ff8a7a;
      }
      &::after {
        border-top-color: #ff8a7a;
      }
    }
  }

  .contact-hours {
    &__icon {
      border-color: $dark-text-muted;
      &::before,
      &::after {
        background: $dark-text-muted;
      }
    }

    &__text {
      color: $dark-text-muted;
    }
  }

  .feedback-modal__content--dark {
    background: $dark-bg-mid;
    border: 1rpx solid $dark-glass-border;

    .feedback-modal__header {
      border-bottom-color: rgba(255, 255, 255, 0.06);
    }

    .feedback-modal__title {
      color: $dark-text-light;
    }

    .feedback-modal__close-icon {
      color: $dark-text-muted;
    }

    .feedback-textarea {
      background: rgba(255, 255, 255, 0.06);
      color: $dark-text-light;
    }

    .feedback-counter {
      color: $dark-text-muted;
    }

    .feedback-btn--cancel {
      background: rgba(255, 255, 255, 0.06);
    }

    .feedback-btn--cancel .feedback-btn__text {
      color: $dark-text-muted;
    }
  }
}
</style>
