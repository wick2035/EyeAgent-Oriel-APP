<template>
  <view class="register-page">
    <!-- 背景层 - 简洁浅蓝渐变 -->
    <view class="bg-layer"></view>

    <!-- 顶部导航 -->
    <view class="nav-bar" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="nav-bar__back" @click="goBack">
        <image
          class="nav-bar__back-icon"
          src="/static/arrow-left.svg"
          mode="aspectFit"
        />
      </view>
      <image class="nav-bar__logo" src="/static/logo@1x.png" mode="aspectFit" />
    </view>

    <!-- 可滚动内容区 -->
    <scroll-view
      class="scroll-content"
      scroll-y
      :style="{ paddingTop: statusBarHeight + 44 + 'px' }"
    >
      <view class="content-inner">
        <!-- 品牌区域 -->
        <view class="brand" :class="{ 'brand--visible': pageReady }">
          <text class="brand__title">创建账号</text>
          <text class="brand__subtitle">开启您的健康之旅</text>
        </view>

        <!-- 注册表单卡片 -->
        <view
          class="register-card"
          :class="{ 'register-card--visible': pageReady }"
        >
          <!-- 姓名输入 -->
          <view
            class="input-group"
            :class="{ 'input-group--focus': nameFocus }"
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
              v-model="formData.patientName"
              placeholder="请输入您的姓名"
              placeholder-class="input-placeholder"
              @focus="nameFocus = true"
              @blur="nameFocus = false"
            />
          </view>

          <!-- 手机号输入 -->
          <view
            class="input-group"
            :class="{ 'input-group--focus': phoneFocus }"
          >
            <view class="input-icon">
              <image
                class="input-icon-img"
                src="/static/phone.svg"
                mode="aspectFit"
              />
            </view>
            <input
              class="input-field"
              type="number"
              v-model="formData.phone"
              placeholder="请输入手机号"
              placeholder-class="input-placeholder"
              maxlength="11"
              @focus="phoneFocus = true"
              @blur="phoneFocus = false"
            />
          </view>

          <!-- 邮箱输入 + 验证码按钮 -->
          <view
            class="input-group"
            :class="{ 'input-group--focus': emailFocus }"
          >
            <view class="input-icon">
              <image
                class="input-icon-img"
                src="/static/email.svg"
                mode="aspectFit"
              />
            </view>
            <input
              class="input-field"
              type="text"
              v-model="formData.email"
              placeholder="请输入邮箱地址"
              placeholder-class="input-placeholder"
              @focus="emailFocus = true"
              @blur="emailFocus = false"
            />
            <view
              class="sms-btn"
              :class="{ 'sms-btn--disabled': !canSendCode }"
              @click="handleSendCode"
            >
              <text class="sms-btn__text">{{ sendCodeText }}</text>
            </view>
          </view>

          <!-- 邮箱验证码输入 -->
          <view
            class="input-group"
            :class="{ 'input-group--focus': codeFocus }"
          >
            <view class="input-icon">
              <image
                class="input-icon-img"
                src="/static/shield.svg"
                mode="aspectFit"
              />
            </view>
            <input
              class="input-field"
              type="number"
              v-model="formData.emailCode"
              placeholder="请输入邮箱验证码"
              placeholder-class="input-placeholder"
              maxlength="6"
              @focus="codeFocus = true"
              @blur="codeFocus = false"
            />
          </view>

          <!-- 身份证号输入 -->
          <view class="input-group" :class="{ 'input-group--focus': idFocus }">
            <view class="input-icon">
              <image
                class="input-icon-img"
                src="/static/id-card.svg"
                mode="aspectFit"
              />
            </view>
            <input
              class="input-field"
              type="idcard"
              v-model="formData.idNumber"
              placeholder="请输入身份证号"
              placeholder-class="input-placeholder"
              maxlength="18"
              @focus="idFocus = true"
              @blur="idFocus = false"
              @input="onIdCardInput"
            />
          </view>

          <!-- 身份证解析信息 -->
          <view class="id-info" v-if="idCardInfo.birthday">
            <text class="id-info__text">
              已识别：{{ idCardInfo.birthday }}，{{ idCardInfo.age }}岁
            </text>
          </view>

          <!-- 性别选择 -->
          <view
            class="input-group"
            :class="{ 'input-group--has-value': formData.gender }"
            @click="openGenderPicker"
          >
            <view class="input-icon">
              <image
                class="input-icon-img"
                src="/static/who.svg"
                mode="aspectFit"
              />
            </view>
            <view class="picker-field">
              <text v-if="formData.gender" class="picker-value">{{
                genderLabel
              }}</text>
              <text v-else class="picker-placeholder">请选择性别</text>
            </view>
            <view class="picker-arrow">
              <text class="arrow-icon">▼</text>
            </view>
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
              v-model="formData.password"
              placeholder="请设置密码（至少6位）"
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

          <!-- 密码强度指示器 -->
          <view class="strength-bar" v-if="formData.password">
            <view class="strength-track">
              <view
                class="strength-fill"
                :class="'strength-fill--' + passwordStrength.level"
                :style="{ width: passwordStrength.width }"
              ></view>
            </view>
            <text
              class="strength-text"
              :class="'strength-text--' + passwordStrength.level"
              >{{ passwordStrength.text }}</text
            >
          </view>

          <!-- 确认密码输入 -->
          <view
            class="input-group"
            :class="{ 'input-group--focus': confirmFocus }"
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
              :type="showConfirmPassword ? 'text' : 'password'"
              v-model="formData.confirmPassword"
              placeholder="请确认密码"
              placeholder-class="input-placeholder"
              @focus="confirmFocus = true"
              @blur="confirmFocus = false"
            />
            <view
              class="input-eye"
              @click="showConfirmPassword = !showConfirmPassword"
            >
              <image
                class="input-eye-img"
                :src="
                  showConfirmPassword
                    ? '/static/eye-open.svg'
                    : '/static/eye-off.svg'
                "
                mode="aspectFit"
              />
            </view>
          </view>

          <!-- 密码匹配状态 -->
          <view class="match-status" v-if="formData.confirmPassword">
            <view v-if="passwordMatch" class="match-status--success">
              <text class="match-icon">✓</text>
              <text class="match-text">密码一致</text>
            </view>
            <view v-else class="match-status--error">
              <text class="match-icon">✗</text>
              <text class="match-text">密码不一致</text>
            </view>
          </view>

          <!-- 用户协议 -->
          <view class="agreement">
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

          <!-- 注册按钮 -->
          <view
            class="register-btn"
            :class="{
              'register-btn--loading': isLoading,
              'register-btn--disabled': !canRegister,
            }"
            @click="handleRegister"
          >
            <view v-if="isLoading" class="btn-loader"></view>
            <text v-else class="register-btn__text">注 册</text>
            <view
              class="btn-ripple"
              :class="{ 'btn-ripple--active': rippleActive }"
            ></view>
          </view>

          <!-- 登录入口 -->
          <view class="login-link">
            <text class="login-link__text">已有账号？</text>
            <text class="login-link__btn" @click="goToLogin">立即登录</text>
          </view>
        </view>

        <!-- 底部安全区 -->
        <view class="safe-area-bottom"></view>
      </view>
    </scroll-view>

    <!-- 性别选择弹窗 -->
    <view
      class="picker-popup"
      v-if="showGenderPicker"
      @click="showGenderPicker = false"
    >
      <view class="picker-popup__mask"></view>
      <view class="picker-popup__content" @click.stop>
        <view class="picker-popup__header">
          <text class="picker-popup__cancel" @click="showGenderPicker = false"
            >取消</text
          >
          <text class="picker-popup__title">选择性别</text>
          <text class="picker-popup__confirm" @click="confirmGender">确定</text>
        </view>
        <view class="picker-popup__body">
          <view
            class="picker-popup__option"
            :class="{ 'picker-popup__option--active': tempGender === 'male' }"
            @click="tempGender = 'male'"
          >
            <text class="picker-popup__option-text">男</text>
            <text v-if="tempGender === 'male'" class="picker-popup__check"
              >✓</text
            >
          </view>
          <view
            class="picker-popup__option"
            :class="{ 'picker-popup__option--active': tempGender === 'female' }"
            @click="tempGender = 'female'"
          >
            <text class="picker-popup__option-text">女</text>
            <text v-if="tempGender === 'female'" class="picker-popup__check"
              >✓</text
            >
          </view>
        </view>
      </view>
    </view>

    <TopNotificationBar />
  </view>
</template>

<script>
import { sendEmailCode, register } from "@/utils/api/user.js";
import TopNotificationBar from '@/components/TopNotificationBar.vue'

export default {
	components: { TopNotificationBar },
  data() {
    return {
      statusBarHeight: 44,
      pageReady: false,
      formData: {
        patientName: "",
        phone: "",
        emailCode: "",
        idNumber: "",
        gender: "",
        email: "",
        password: "",
        confirmPassword: "",
      },
      // 焦点状态
      nameFocus: false,
      phoneFocus: false,
      codeFocus: false,
      idFocus: false,
      emailFocus: false,
      passwordFocus: false,
      confirmFocus: false,
      // 密码显示
      showPassword: false,
      showConfirmPassword: false,
      // 用户协议
      agreedTerms: false,
      // 加载状态
      isLoading: false,
      rippleActive: false,
      // 验证码倒计时
      countdown: 0,
      countdownTimer: null,
      // 身份证解析信息
      idCardInfo: {
        birthday: "",
        age: 0,
        gender: "",
      },
      // 性别选项
      genderOptions: [
        { label: "男", value: "male" },
        { label: "女", value: "female" },
      ],
      // 性别选择弹窗
      showGenderPicker: false,
      tempGender: "",
    };
  },
  computed: {
    // 手机号格式验证
    isValidPhone() {
      return /^1[3-9]\d{9}$/.test(this.formData.phone);
    },
    // 是否可以发送验证码
    canSendCode() {
      return this.countdown === 0 && this.formData.email && this.isValidEmail;
    },
    // 发送按钮文本
    sendCodeText() {
      return this.countdown > 0 ? `${this.countdown}s` : "获取验证码";
    },
    // 密码强度
    passwordStrength() {
      const pwd = this.formData.password;
      if (!pwd) return { level: "none", text: "", width: "0%" };

      let score = 0;
      if (pwd.length >= 6) score += 1;
      if (pwd.length >= 8) score += 1;
      if (/\d/.test(pwd)) score += 1;
      if (/[a-z]/.test(pwd)) score += 1;
      if (/[A-Z]/.test(pwd)) score += 1;
      if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) score += 2;

      if (score <= 4) return { level: "weak", text: "弱", width: "33%" };
      if (score <= 6) return { level: "medium", text: "中", width: "66%" };
      return { level: "strong", text: "强", width: "100%" };
    },
    // 密码匹配
    passwordMatch() {
      return (
        this.formData.password &&
        this.formData.confirmPassword &&
        this.formData.password === this.formData.confirmPassword
      );
    },
    // 邮箱格式验证
    isValidEmail() {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.formData.email);
    },
    // 性别显示文本
    genderLabel() {
      const option = this.genderOptions.find(
        (o) => o.value === this.formData.gender
      );
      return option ? option.label : "";
    },
    // 是否可以注册
    canRegister() {
      return (
        this.formData.patientName.trim().length >= 2 &&
        this.isValidPhone &&
        this.formData.emailCode.length === 6 &&
        this.validateIdCard(this.formData.idNumber) &&
        this.formData.gender &&
        this.isValidEmail &&
        this.formData.password.length >= 6 &&
        this.passwordMatch &&
        this.agreedTerms
      );
    },
  },
  onLoad() {
    this.getStatusBarHeight();
    setTimeout(() => {
      this.pageReady = true;
    }, 100);
  },
  onUnload() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
    }
  },
  methods: {
    getStatusBarHeight() {
      const sysInfo = uni.getSystemInfoSync();
      this.statusBarHeight = sysInfo.statusBarHeight || 44;
    },

    // 返回上一页
    goBack() {
      uni.navigateBack();
    },

    // 跳转登录
    goToLogin() {
      uni.navigateBack();
    },

    // 打开用户协议
    openUserAgreement() {
      uni.navigateTo({
        url: "/pages/settings/user-agreement",
      });
    },

    // 打开隐私政策
    openPrivacyPolicy() {
      uni.navigateTo({
        url: "/pages/settings/privacy-policy",
      });
    },

    // 打开性别选择弹窗
    openGenderPicker() {
      this.tempGender = this.formData.gender || "";
      this.showGenderPicker = true;
    },

    // 确认性别选择
    confirmGender() {
      if (this.tempGender) {
        this.formData.gender = this.tempGender;
      }
      this.showGenderPicker = false;
    },

    // 身份证号输入处理
    onIdCardInput(e) {
      const value = e.detail.value;
      if (value.length === 18 && this.validateIdCard(value)) {
        const info = this.parseIdCard(value);
        this.idCardInfo = info;
        // 自动选中性别
        if (!this.formData.gender) {
          this.formData.gender = info.gender;
        }
      } else {
        this.idCardInfo = { birthday: "", age: 0, gender: "" };
      }
    },

    // 解析身份证信息
    parseIdCard(idNumber) {
      const year = idNumber.substring(6, 10);
      const month = idNumber.substring(10, 12);
      const day = idNumber.substring(12, 14);
      const birthday = `${year}年${parseInt(month)}月${parseInt(day)}日`;
      const dateOfBirthISO = `${year}-${month}-${day}T00:00:00`;

      // 计算年龄
      const birthDate = new Date(year, parseInt(month) - 1, parseInt(day));
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }

      // 性别：第17位奇数为男，偶数为女
      const genderCode = parseInt(idNumber.charAt(16));
      const gender = genderCode % 2 === 1 ? "male" : "female";

      return { birthday, age, gender, dateOfBirthISO };
    },

    // 验证身份证号
    validateIdCard(idNumber) {
      if (!idNumber || idNumber.length !== 18) return false;
      if (!/^\d{17}[\dXx]$/.test(idNumber)) return false;

      const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
      const checkCodes = [
        "1",
        "0",
        "X",
        "9",
        "8",
        "7",
        "6",
        "5",
        "4",
        "3",
        "2",
      ];

      let sum = 0;
      for (let i = 0; i < 17; i++) {
        sum += parseInt(idNumber.charAt(i)) * weights[i];
      }

      const checkCode = checkCodes[sum % 11];
      return idNumber.charAt(17).toUpperCase() === checkCode;
    },

    // 发送邮箱验证码
    async handleSendCode() {
      if (!this.canSendCode) return;

      this.$toast.success("验证码已发送，请查收邮箱");
      this.startCountdown();

      // 后台调用发送接口
      sendEmailCode(this.formData.email).catch(() => {});
    },

    // 开始倒计时
    startCountdown() {
      this.countdown = 60;
      this.countdownTimer = setInterval(() => {
        this.countdown--;
        if (this.countdown <= 0) {
          clearInterval(this.countdownTimer);
          this.countdownTimer = null;
        }
      }, 1000);
    },

    // 注册
    async handleRegister() {
      // 先检查用户协议
      if (!this.agreedTerms) {
        this.$toast.warning("请先同意用户协议");
        return;
      }

      if (!this.canRegister || this.isLoading) return;

      // 触发按钮涟漪动画
      this.rippleActive = true;
      setTimeout(() => {
        this.rippleActive = false;
      }, 600);

      this.isLoading = true;

      try {
        const result = await register({
          patientName: this.formData.patientName,
          gender: this.formData.gender,
          age: this.idCardInfo.age,
          phone: this.formData.phone,
          idNumber: this.formData.idNumber,
          password: this.formData.password,
          email: this.formData.email,
          emailCode: this.formData.emailCode,
          dateOfBirth: this.idCardInfo.dateOfBirthISO,
        });

        if (result.success) {
          this.$toast.success("注册成功");
          setTimeout(() => {
            uni.switchTab({ url: "/pages/index/index" });
          }, 1500);
        } else {
          this.$toast.error(result.message || "注册失败");
        }
      } catch (error) {
        this.$toast.error("网络异常，请稍后重试");
      } finally {
        this.isLoading = false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
// ==================== 浅色主题变量 ====================
$bg-page: #fafbfd;
$bg-gradient-top: #e8f4fd;
$bg-card: #ffffff;
$bg-input: #f5f7fa;

$color-primary: #1e3a5f;
$color-primary-light: #2d5a87;
$color-accent: #ff6b5b;

$text-primary: #1a2b3c;
$text-secondary: #5a6b7c;
$text-muted: #9aabbf;
$text-placeholder: #b8c5d4;

$border-color: #e5e9ef;
$shadow-card: 0 4rpx 24rpx rgba(30, 58, 95, 0.08);
$shadow-input-focus: 0 0 0 4rpx rgba(30, 58, 95, 0.06);

$color-success: #10b981;
$color-warning: #f59e0b;
$color-error: #ef4444;

.register-page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background: $bg-page;
}

// ==================== 背景层 ====================
.bg-layer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, $bg-gradient-top 0%, $bg-page 50%);
  z-index: 0;
}

// ==================== 顶部导航 ====================
.nav-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  height: 56px;
  padding: 0 32rpx;
  padding-top: 20px;
  background: transparent;

  &__back {
    width: 72rpx;
    height: 72rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: -16rpx;

    &:active {
      opacity: 0.7;
    }
  }

  &__back-icon {
    width: 40rpx;
    height: 40rpx;
    opacity: 0.8;
  }

  &__logo {
    width: 160rpx;
    height: 48rpx;
    margin-left: auto;
  }
}

// ==================== 内容区 ====================
.scroll-content {
  position: relative;
  z-index: 1;
  min-height: 100vh;
}

.content-inner {
  padding: 0 40rpx;
}

// ==================== 品牌区域 ====================
.brand {
  padding-top: 40rpx;
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
    font-size: 52rpx;
    font-weight: 600;
    color: $text-primary;
    letter-spacing: 4rpx;
    margin-bottom: 12rpx;
  }

  &__subtitle {
    display: block;
    font-size: 28rpx;
    color: $text-secondary;
    letter-spacing: 2rpx;
  }
}

// ==================== 注册卡片 ====================
.register-card {
  margin-top: 40rpx;
  padding: 40rpx 32rpx;
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

// ==================== 输入框组 ====================
.input-group {
  display: flex;
  align-items: center;
  height: 100rpx;
  padding: 0 24rpx;
  margin-bottom: 20rpx;
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
  width: 40rpx;
  height: 40rpx;
  margin-right: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.input-icon-img {
  width: 32rpx;
  height: 32rpx;
  opacity: 0.45;
  transition: opacity 0.3s;

  .input-group--focus & {
    opacity: 0.8;
  }
}

.input-field {
  flex: 1;
  height: 100%;
  font-size: 28rpx;
  color: $text-primary;
  background: transparent;
}

.input-placeholder {
  color: $text-placeholder;
}

.input-eye {
  width: 52rpx;
  height: 52rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: -8rpx;

  &:active {
    opacity: 0.7;
  }
}

.input-eye-img {
  width: 36rpx;
  height: 26rpx;
  opacity: 0.45;
}

// ==================== 验证码按钮 ====================
.sms-btn {
  padding: 0 24rpx;
  height: 64rpx;
  background: $color-primary;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;

  &:active {
    transform: scale(0.96);
  }

  &--disabled {
    background: #c5d0dc;

    &:active {
      transform: none;
    }
  }

  &__text {
    font-size: 24rpx;
    color: #ffffff;
    white-space: nowrap;
  }
}

// ==================== 身份证解析信息 ====================
.id-info {
  margin-top: -8rpx;
  margin-bottom: 16rpx;
  text-align: center;

  &__text {
    font-size: 24rpx;
    color: $color-success;
  }
}

// ==================== Picker 选择器 ====================
.picker-field {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: center;
}

.picker-value {
  font-size: 28rpx;
  color: $text-primary;
}

.picker-placeholder {
  font-size: 28rpx;
  color: $text-placeholder;
}

.picker-arrow {
  width: 40rpx;
  height: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.arrow-icon {
  font-size: 20rpx;
  color: $text-muted;
  transition: transform 0.3s;
}

// ==================== 密码强度指示器 ====================
.strength-bar {
  display: flex;
  align-items: center;
  margin-top: -8rpx;
  margin-bottom: 16rpx;
  padding-left: 56rpx;
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

// ==================== 密码匹配状态 ====================
.match-status {
  margin-top: -8rpx;
  margin-bottom: 16rpx;
  padding-left: 56rpx;
  display: flex;
  align-items: center;
  gap: 8rpx;

  &--success {
    display: flex;
    align-items: center;
    gap: 8rpx;

    .match-icon,
    .match-text {
      color: $color-success;
    }
  }

  &--error {
    display: flex;
    align-items: center;
    gap: 8rpx;

    .match-icon,
    .match-text {
      color: $color-error;
    }
  }
}

.match-icon {
  font-size: 24rpx;
  font-weight: 600;
}

.match-text {
  font-size: 24rpx;
}

// ==================== 用户协议 ====================
.agreement {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 24rpx 0;

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

// ==================== 注册按钮 ====================
.register-btn {
  position: relative;
  height: 100rpx;
  margin-top: 16rpx;
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

// ==================== 登录入口 ====================
.login-link {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 32rpx;
  gap: 8rpx;

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

// ==================== 底部安全区 ====================
.safe-area-bottom {
  height: calc(40rpx + env(safe-area-inset-bottom));
}

// ==================== 性别选择弹窗 ====================
.picker-popup {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: flex-end;

  &__mask {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    animation: mask-in 0.3s ease-out;
  }

  &__content {
    position: relative;
    width: 100%;
    background: #ffffff;
    border-radius: 24rpx 24rpx 0 0;
    animation: popup-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    padding-bottom: env(safe-area-inset-bottom);
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 100rpx;
    padding: 0 32rpx;
    border-bottom: 1rpx solid $border-color;
  }

  &__cancel,
  &__confirm {
    font-size: 28rpx;
    padding: 16rpx;
  }

  &__cancel {
    color: $text-muted;
  }

  &__confirm {
    color: $color-primary;
    font-weight: 500;
  }

  &__title {
    font-size: 30rpx;
    font-weight: 600;
    color: $text-primary;
  }

  &__body {
    padding: 20rpx 0;
  }

  &__option {
    display: flex;
    align-items: center;
    height: 110rpx;
    margin: 8rpx 24rpx;
    padding: 0 28rpx;
    border-radius: 16rpx;
    transition: background-color 0.2s;

    &:active {
      background: rgba(0, 0, 0, 0.03);
    }

    &--active {
      background: rgba(30, 58, 95, 0.06);
    }
  }

  &__option-text {
    flex: 1;
    font-size: 32rpx;
    color: $text-primary;
  }

  &__check {
    font-size: 40rpx;
    color: $color-primary;
    font-weight: 500;
  }
}

@keyframes mask-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes popup-in {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
</style>
