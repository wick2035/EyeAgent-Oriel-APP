<template>
  <view class="page">
    <!-- 背景层 -->
    <view class="bg-layer"></view>

    <!-- 内容区 -->
    <view class="content">
      <!-- 状态栏占位 -->
      <view
        class="status-bar"
        :style="{ height: statusBarHeight + 'px' }"
      ></view>

      <!-- 导航栏 -->
      <view class="navbar">
        <view class="navbar__back" @click="goBack">
          <view class="back-icon"></view>
        </view>
        <text class="navbar__title">隐私政策</text>
        <view class="navbar__placeholder"></view>
      </view>

      <!-- 滚动内容 -->
      <scroll-view class="scroll-area" scroll-y>
        <view class="article">
          <!-- 标题 -->
          <view class="article__header">
            <text class="article__title">AI医问通隐私政策</text>
            <text class="article__update">更新日期：2025年1月1日</text>
            <text class="article__update">生效日期：2025年1月1日</text>
          </view>

          <!-- 导言 -->
          <view class="section">
            <text class="section__content"
              >AI医问通（以下简称"我们"）深知个人信息对您的重要性，我们将按照法律法规的规定，保护您的个人信息及隐私安全。我们制定本隐私政策并特别提示：希望您在使用本应用及相关服务前仔细阅读并理解本隐私政策，以便作出适当的选择。</text
            >
            <text class="section__content"
              >本隐私政策适用于我们提供的所有产品和服务。我们将严格遵守《中华人民共和国个人信息保护法》《中华人民共和国网络安全法》《中华人民共和国数据安全法》等相关法律法规的规定处理您的个人信息。</text
            >
          </view>

          <!-- 第一章 -->
          <view class="section">
            <text class="section__title"
              >一、我们如何收集和使用您的个人信息</text
            >
            <text class="section__content"
              >我们会遵循正当、合法、必要的原则，出于以下目的收集和使用您的个人信息：</text
            >

            <text class="section__subtitle">1.1 账号注册与登录</text>
            <text class="section__content"
              >当您注册账号时，我们需要收集您的手机号码用于创建账号、验证身份。您也可以选择使用微信账号登录，此时我们将获取您授权的微信昵称、头像等公开信息。</text
            >

            <text class="section__subtitle">1.2 AI智能问诊服务</text>
            <text class="section__content"
              >为向您提供AI问诊服务，我们需要收集您主动提供的健康咨询内容，包括症状描述、病史信息等。这些信息将用于AI分析并为您提供健康建议。</text
            >

            <text class="section__subtitle">1.3 预约挂号服务</text>
            <text class="section__content"
              >当您使用预约挂号功能时，我们需要收集您的姓名、身份证号、联系电话等信息，以便医疗机构为您安排就诊。</text
            >

            <text class="section__subtitle">1.4 健康档案管理</text>
            <text class="section__content"
              >您可以自愿填写个人健康档案，包括身高、体重、血型、过敏史、既往病史等信息，以获得更精准的健康服务。</text
            >

            <text class="section__subtitle">1.5 用药提醒服务</text>
            <text class="section__content"
              >为提供用药提醒功能，我们需要收集您设置的用药信息和提醒时间。</text
            >

            <text class="section__subtitle">1.6 消息推送</text>
            <text class="section__content"
              >为向您发送预约提醒、健康资讯等消息，我们可能需要收集您的设备标识信息。您可以在设置中关闭消息通知。</text
            >
          </view>

          <!-- 第二章 -->
          <view class="section">
            <text class="section__title"
              >二、我们如何存储和保护您的个人信息</text
            >

            <text class="section__subtitle">2.1 信息存储</text>
            <text class="section__content"
              >我们在中华人民共和国境内收集和产生的个人信息将存储在中国境内的服务器上。我们会采取加密等技术措施存储个人信息，确保数据安全。</text
            >
            <text class="section__content"
              >我们仅在为实现服务目的所必需的期限内保留您的个人信息，超出保留期限后，我们将删除或匿名化处理您的个人信息。</text
            >

            <text class="section__subtitle">2.2 信息安全</text>
            <text class="section__content"
              >我们采取以下措施保护您的个人信息安全：</text
            >
            <text class="section__content section__content--indent"
              >（1）采用加密技术对个人信息进行加密存储和传输；</text
            >
            <text class="section__content section__content--indent"
              >（2）建立严格的数据访问权限控制机制；</text
            >
            <text class="section__content section__content--indent"
              >（3）建立数据安全管理制度和操作规程；</text
            >
            <text class="section__content section__content--indent"
              >（4）对员工进行数据安全培训和考核；</text
            >
            <text class="section__content section__content--indent"
              >（5）建立个人信息安全事件应急处理机制。</text
            >
            <text class="section__content"
              >尽管我们采取了上述措施，但请您理解互联网环境并非百分之百安全，我们将尽力保护您的个人信息安全。</text
            >
          </view>

          <!-- 第三章 -->
          <view class="section">
            <text class="section__title"
              >三、我们如何共享、转让、公开披露您的个人信息</text
            >

            <text class="section__subtitle">3.1 共享</text>
            <text class="section__content"
              >我们不会与第三方共享您的个人信息，但以下情况除外：</text
            >
            <text class="section__content section__content--indent"
              >（1）获得您的明确同意后；</text
            >
            <text class="section__content section__content--indent"
              >（2）根据法律法规的规定或行政、司法机关的要求；</text
            >
            <text class="section__content section__content--indent"
              >（3）为完成预约挂号服务，需将您的信息提供给相应医疗机构；</text
            >
            <text class="section__content section__content--indent"
              >（4）与我们的关联公司共享，但仅限于提供服务所必需的范围。</text
            >

            <text class="section__subtitle">3.2 转让</text>
            <text class="section__content"
              >我们不会将您的个人信息转让给任何公司、组织和个人，但以下情况除外：</text
            >
            <text class="section__content section__content--indent"
              >（1）获得您的明确同意后；</text
            >
            <text class="section__content section__content--indent"
              >（2）在合并、分立、解散、被宣告破产时，如涉及个人信息转让，我们会告知您并要求新的持有方继续受本政策约束。</text
            >

            <text class="section__subtitle">3.3 公开披露</text>
            <text class="section__content"
              >我们仅会在以下情况下公开披露您的个人信息：</text
            >
            <text class="section__content section__content--indent"
              >（1）获得您的明确同意后；</text
            >
            <text class="section__content section__content--indent"
              >（2）根据法律法规的规定或行政、司法机关的强制性要求。</text
            >
          </view>

          <!-- 第四章 -->
          <view class="section">
            <text class="section__title">四、您的权利</text>
            <text class="section__content"
              >根据相关法律法规，您对个人信息享有以下权利：</text
            >

            <text class="section__subtitle">4.1 查阅和复制权</text>
            <text class="section__content"
              >您可以通过"我的-设置-编辑资料"和"我的-健康档案"查阅和复制您的个人信息。</text
            >

            <text class="section__subtitle">4.2 更正权</text>
            <text class="section__content"
              >当您发现我们处理的个人信息有错误时，您有权要求我们更正。您可以通过上述路径自行更正，或联系我们协助处理。</text
            >

            <text class="section__subtitle">4.3 删除权</text>
            <text class="section__content"
              >在以下情况下，您可以要求我们删除您的个人信息：</text
            >
            <text class="section__content section__content--indent"
              >（1）处理目的已实现、无法实现或不再必要；</text
            >
            <text class="section__content section__content--indent"
              >（2）我们停止提供服务或服务期限届满；</text
            >
            <text class="section__content section__content--indent"
              >（3）您撤回同意；</text
            >
            <text class="section__content section__content--indent"
              >（4）我们违反法律法规或协议约定处理个人信息。</text
            >

            <text class="section__subtitle">4.4 撤回同意权</text>
            <text class="section__content"
              >您可以通过关闭相应功能或注销账号的方式撤回同意。撤回同意不影响撤回前基于您的同意已进行的个人信息处理活动的合法性。</text
            >

            <text class="section__subtitle">4.5 注销账号</text>
            <text class="section__content"
              >您可以通过联系客服申请注销账号。注销后，我们将停止为您提供服务，并依法删除您的个人信息或进行匿名化处理。</text
            >
          </view>

          <!-- 第五章 -->
          <view class="section">
            <text class="section__title">五、未成年人保护</text>
            <text class="section__content"
              >我们非常重视对未成年人个人信息的保护。本应用主要面向成年人提供服务，如您是未满18周岁的未成年人，请在监护人指导下阅读本政策，并在征得监护人同意后使用我们的服务。</text
            >
            <text class="section__content"
              >对于经监护人同意使用我们服务的未成年人，我们会严格按照法律法规的规定保护其个人信息。监护人如发现未成年人个人信息被收集，可联系我们进行删除。</text
            >
          </view>

          <!-- 第六章 -->
          <view class="section">
            <text class="section__title">六、隐私政策的更新</text>
            <text class="section__content"
              >我们可能会适时更新本隐私政策。当隐私政策发生重大变更时，我们会通过应用内通知、弹窗等方式向您告知，您需要重新阅读并同意更新后的隐私政策方可继续使用我们的服务。</text
            >
          </view>

          <!-- 第七章 -->
          <view class="section">
            <text class="section__title">七、联系我们</text>
            <text class="section__content"
              >如您对本隐私政策有任何疑问、意见或建议，或需要行使上述权利，可通过以下方式联系我们：</text
            >
            <text class="section__content"
              >客服邮箱：support@aiyiwentong.com</text
            >
            <text class="section__content"
              >我们将在15个工作日内回复您的请求。</text
            >
          </view>

          <!-- 结尾 -->
          <view class="section section--footer">
            <text class="section__content section__content--center"
              >AI医问通运营团队</text
            >
          </view>
        </view>

        <!-- 底部留白 -->
        <view class="bottom-space"></view>
      </scroll-view>
    </view>
    <TopNotificationBar />
  </view>
</template>

<script>
import TopNotificationBar from '@/components/TopNotificationBar.vue'

export default {
	components: { TopNotificationBar },
  data() {
    return {
      statusBarHeight: 44,
    };
  },
  onLoad() {
    this.getStatusBarHeight();
  },
  methods: {
    getStatusBarHeight() {
      const sysInfo = uni.getSystemInfoSync();
      this.statusBarHeight = sysInfo.statusBarHeight || 44;
    },
    goBack() {
      uni.navigateBack();
    },
  },
};
</script>

<style lang="scss" scoped>
$bg-base: #fafbfd;
$bg-card: #ffffff;
$text-primary: #1a1a1a;
$text-secondary: #666666;
$text-muted: #999999;
$color-primary: #1e3a5f;

.page {
  min-height: 100vh;
  position: relative;
  background: $bg-base;
}

.bg-layer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 400rpx;
  background: linear-gradient(180deg, #e8f4fd 0%, $bg-base 100%);
  z-index: 0;
}

.content {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  width: 100%;
  overflow: hidden;
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
    color: $text-primary;
    letter-spacing: 2rpx;
  }

  &__placeholder {
    width: 72rpx;
  }
}

.back-icon {
  width: 20rpx;
  height: 20rpx;
  border-left: 3rpx solid $text-primary;
  border-bottom: 3rpx solid $text-primary;
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

// 文章内容
.article {
  background: $bg-card;
  border-radius: 24rpx;
  padding: 40rpx 32rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);

  &__header {
    text-align: center;
    padding-bottom: 32rpx;
    margin-bottom: 32rpx;
    border-bottom: 1rpx solid rgba(0, 0, 0, 0.06);
  }

  &__title {
    display: block;
    font-size: 36rpx;
    font-weight: 600;
    color: $text-primary;
    margin-bottom: 16rpx;
  }

  &__update {
    display: block;
    font-size: 24rpx;
    color: $text-muted;
    margin-top: 8rpx;
  }
}

// 章节
.section {
  margin-bottom: 32rpx;

  &--footer {
    margin-top: 48rpx;
    padding-top: 32rpx;
    border-top: 1rpx solid rgba(0, 0, 0, 0.06);
  }

  &__title {
    display: block;
    font-size: 30rpx;
    font-weight: 600;
    color: $text-primary;
    margin-bottom: 20rpx;
  }

  &__subtitle {
    display: block;
    font-size: 28rpx;
    font-weight: 500;
    color: $text-primary;
    margin-top: 24rpx;
    margin-bottom: 12rpx;
  }

  &__content {
    display: block;
    font-size: 28rpx;
    color: $text-secondary;
    line-height: 1.8;
    margin-bottom: 16rpx;
    text-align: justify;

    &--indent {
      padding-left: 32rpx;
    }

    &--center {
      text-align: center;
      color: $text-muted;
    }
  }
}

// 底部留白
.bottom-space {
  height: calc(60rpx + env(safe-area-inset-bottom));
}
</style>
