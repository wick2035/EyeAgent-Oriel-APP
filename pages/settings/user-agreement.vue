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
        <text class="navbar__title">用户协议</text>
        <view class="navbar__placeholder"></view>
      </view>

      <!-- 滚动内容 -->
      <scroll-view class="scroll-area" scroll-y>
        <view class="article">
          <!-- 标题 -->
          <view class="article__header">
            <text class="article__title">AI医问通用户服务协议</text>
            <text class="article__update">更新日期：2025年1月1日</text>
            <text class="article__update">生效日期：2025年1月1日</text>
          </view>

          <!-- 导言 -->
          <view class="section">
            <text class="section__content"
              >欢迎使用AI医问通！在使用本应用前，请您仔细阅读并充分理解本协议的全部内容。如您不同意本协议的任何条款，请勿注册或使用本服务。您一旦注册、登录、使用本服务，即视为您已阅读、理解并同意接受本协议的全部内容。</text
            >
          </view>

          <!-- 第一章 -->
          <view class="section">
            <text class="section__title">一、服务说明</text>
            <text class="section__content"
              >1.1
              AI医问通是一款智能健康咨询应用，提供AI智能问诊、预约挂号、健康档案管理、用药提醒等服务。</text
            >
            <text class="section__content"
              >1.2
              本应用提供的AI问诊服务仅供健康咨询参考，不构成医疗诊断或治疗建议。如您有健康问题，请及时前往正规医疗机构就诊。</text
            >
            <text class="section__content"
              >1.3
              本应用的预约挂号服务为信息中介服务，具体诊疗服务由合作医疗机构提供。</text
            >
          </view>

          <!-- 第二章 -->
          <view class="section">
            <text class="section__title">二、用户注册与账号管理</text>
            <text class="section__content"
              >2.1
              您在注册账号时应提供真实、准确、完整的个人信息，并在信息变更时及时更新。</text
            >
            <text class="section__content"
              >2.2
              您应妥善保管账号及密码，不得将账号转让、出借或与他人共用。因您保管不善造成的损失由您自行承担。</text
            >
            <text class="section__content"
              >2.3
              如发现账号被盗用或存在安全风险，请立即通知我们，我们将协助您采取措施保护账号安全。</text
            >
            <text class="section__content"
              >2.4
              我们有权对违规账号采取警告、限制功能、暂停使用、永久封禁等措施。</text
            >
          </view>

          <!-- 第三章 -->
          <view class="section">
            <text class="section__title">三、用户行为规范</text>
            <text class="section__content"
              >3.1
              您在使用本服务时应遵守中华人民共和国法律法规，不得利用本服务从事违法违规活动。</text
            >
            <text class="section__content">3.2 您不得发布、传播以下内容：</text>
            <text class="section__content section__content--indent"
              >（1）违反宪法或法律法规的内容；</text
            >
            <text class="section__content section__content--indent"
              >（2）危害国家安全、泄露国家秘密的内容；</text
            >
            <text class="section__content section__content--indent"
              >（3）损害国家荣誉和利益的内容；</text
            >
            <text class="section__content section__content--indent"
              >（4）煽动民族仇恨、破坏民族团结的内容；</text
            >
            <text class="section__content section__content--indent"
              >（5）破坏宗教政策、宣扬邪教迷信的内容；</text
            >
            <text class="section__content section__content--indent"
              >（6）散布谣言、扰乱社会秩序的内容；</text
            >
            <text class="section__content section__content--indent"
              >（7）传播淫秽、色情、暴力、恐怖的内容；</text
            >
            <text class="section__content section__content--indent"
              >（8）侮辱、诽谤他人，侵害他人合法权益的内容；</text
            >
            <text class="section__content section__content--indent"
              >（9）其他违反法律法规或公序良俗的内容。</text
            >
            <text class="section__content"
              >3.3
              您不得对本应用进行反向工程、反编译、破解或以其他方式获取源代码。</text
            >
            <text class="section__content"
              >3.4
              您不得干扰本应用的正常运行，不得使用任何自动化程序、脚本或其他手段获取服务。</text
            >
          </view>

          <!-- 第四章 -->
          <view class="section">
            <text class="section__title">四、知识产权</text>
            <text class="section__content"
              >4.1
              本应用的所有内容，包括但不限于文字、图片、音频、视频、软件、程序、界面设计、版面框架等，均受中华人民共和国著作权法、商标法、专利法等知识产权法律法规的保护。</text
            >
            <text class="section__content"
              >4.2
              未经我们书面许可，您不得复制、修改、传播、出售或利用本应用的任何内容。</text
            >
            <text class="section__content"
              >4.3
              您在使用本服务过程中提交的内容（如问诊记录、健康信息等），我们仅在提供服务所必需的范围内使用，不会侵犯您的合法权益。</text
            >
          </view>

          <!-- 第五章 -->
          <view class="section">
            <text class="section__title">五、服务变更与中断</text>
            <text class="section__content"
              >5.1
              我们保留随时修改、暂停或终止服务的权利，修改后的协议将在应用内公布，继续使用服务即视为接受修改后的协议。</text
            >
            <text class="section__content"
              >5.2
              因系统维护、升级或不可抗力等原因导致服务中断，我们将尽快恢复服务，但不承担由此造成的损失。</text
            >
            <text class="section__content"
              >5.3
              您理解并同意，移动互联网服务受多种因素影响，我们不保证服务不会中断。</text
            >
          </view>

          <!-- 第六章 -->
          <view class="section">
            <text class="section__title">六、免责声明</text>
            <text class="section__content"
              >6.1
              AI问诊服务由人工智能技术提供，仅供参考，不能替代专业医生的诊断和治疗。用户应根据自身情况谨慎使用，如有不适请及时就医。</text
            >
            <text class="section__content"
              >6.2
              本应用提供的健康资讯和科普内容仅供参考，不构成医疗建议。</text
            >
            <text class="section__content"
              >6.3
              因用户提供虚假信息或操作不当造成的损失，由用户自行承担。</text
            >
            <text class="section__content"
              >6.4
              对于因不可抗力、黑客攻击、系统故障、通讯故障等非我方原因造成的损失，我们不承担责任。</text
            >
          </view>

          <!-- 第七章 -->
          <view class="section">
            <text class="section__title">七、争议解决</text>
            <text class="section__content"
              >7.1
              本协议的订立、履行、解释及争议解决均适用中华人民共和国法律。</text
            >
            <text class="section__content"
              >7.2
              因本协议产生的争议，双方应友好协商解决；协商不成的，任何一方均可向我方所在地人民法院提起诉讼。</text
            >
          </view>

          <!-- 第八章 -->
          <view class="section">
            <text class="section__title">八、其他条款</text>
            <text class="section__content"
              >8.1
              本协议的任何条款被认定为无效或不可执行的，不影响其他条款的效力。</text
            >
            <text class="section__content"
              >8.2 我们未行使或延迟行使任何权利，不构成对该权利的放弃。</text
            >
            <text class="section__content"
              >8.3
              如您对本协议有任何疑问，请通过应用内的客服渠道联系我们。</text
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
