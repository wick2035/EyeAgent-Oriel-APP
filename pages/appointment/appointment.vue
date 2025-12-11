<template>
  <view class="page" :class="{ 'page--dark': isDark }">
    <!-- 顶部渐变背景 -->
    <view class="page-bg"></view>

    <!-- 状态栏占位 -->
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>

    <!-- 顶部导航栏 -->
    <view class="navbar">
      <text class="navbar__title">预约挂号</text>
    </view>

    <!-- 搜索栏 -->
    <view class="search-section">
      <view class="search-bar">
        <view class="search-bar__icon"></view>
        <input
          class="search-bar__input"
          placeholder="搜索医院、科室、医生"
          placeholder-class="search-bar__placeholder"
          v-model="searchKeyword"
          @confirm="handleSearch"
        />
        <view
          v-if="searchKeyword"
          class="search-bar__clear"
          @click="clearSearch"
        ></view>
      </view>
    </view>

    <!-- 城市定位 -->
    <view class="location-bar">
      <view class="location-bar__left">
        <image class="location-bar__icon" src="@/static/location.svg" mode="aspectFit" />
        <text class="location-bar__city">{{ currentCity }}</text>
      </view>
      <view class="location-bar__action" @click="switchCity">
        <text>切换</text>
        <view class="location-bar__arrow"></view>
      </view>
    </view>

    <!-- 内容区域 -->
    <scroll-view class="content" scroll-y @scrolltolower="loadMore">
      <!-- 医院列表 -->
      <view class="hospital-section">
        <text class="section-title">附近医院</text>

        <!-- 骨架屏 -->
        <view v-if="loading" class="skeleton-list">
          <view v-for="i in 3" :key="i" class="skeleton-card">
            <view class="skeleton-avatar"></view>
            <view class="skeleton-content">
              <view class="skeleton-line skeleton-line--title"></view>
              <view class="skeleton-line skeleton-line--short"></view>
              <view class="skeleton-line skeleton-line--medium"></view>
            </view>
          </view>
        </view>

        <!-- 医院卡片列表 -->
        <view v-else class="hospital-list">
          <view
            v-for="hospital in hospitals"
            :key="hospital.id"
            class="hospital-card"
            @click="goToDepartments(hospital)"
          >
            <!-- 医院Logo -->
            <view class="hospital-card__logo">
              <text class="hospital-card__logo-text">{{
                hospital.name.charAt(0)
              }}</text>
            </view>

            <!-- 医院信息 -->
            <view class="hospital-card__info">
              <view class="hospital-card__header">
                <text class="hospital-card__name">{{ hospital.name }}</text>
                <view class="hospital-card__rating">
                  <view class="star-icon"></view>
                  <text class="hospital-card__rating-value">{{
                    hospital.rating
                  }}</text>
                </view>
              </view>

              <view class="hospital-card__meta">
                <view class="hospital-card__tag hospital-card__tag--level">{{
                  hospital.level
                }}</view>
                <view class="hospital-card__tag hospital-card__tag--type">{{
                  hospital.type
                }}</view>
                <text
                  v-if="hospital.distance > 0"
                  class="hospital-card__distance"
                  >{{ formatDistance(hospital.distance) }}</text
                >
              </view>

              <view class="hospital-card__tags">
                <text
                  v-for="(tag, idx) in hospital.tags.slice(0, 3)"
                  :key="idx"
                  class="hospital-card__label"
                  >{{ tag }}</text
                >
              </view>

              <text class="hospital-card__address">{{ hospital.address }}</text>
            </view>

            <!-- 预约按钮 -->
            <view class="hospital-card__action">
              <view
                class="hospital-card__btn"
                :class="{ 'hospital-card__btn--disabled': !hospital.isOpen }"
              >
                {{ hospital.isOpen ? "预约" : "暂停" }}
              </view>
              <text class="hospital-card__time">{{ hospital.openTime }}</text>
            </view>
          </view>

          <!-- 空状态 -->
          <view v-if="hospitals.length === 0 && !loading" class="empty-state">
            <view class="empty-state__icon"></view>
            <text class="empty-state__text">暂无医院数据</text>
          </view>
        </view>
      </view>

      <!-- 底部占位 -->
      <view class="tabbar-placeholder"></view>
    </scroll-view>

    <!-- 底部导航 -->
    <TabBar />

    <!-- 顶部通知栏 -->
    <TopNotificationBar />

    <!-- 城市选择弹窗 -->
    <view
      v-if="showCityPicker"
      class="city-picker"
      :class="{ 'city-picker--dark': isDark }"
    >
      <view
        class="city-picker__overlay"
        :class="{ 'city-picker__overlay--show': showCityContent }"
        @click="closeCityPicker"
      ></view>
      <view
        class="city-picker__container"
        :class="{ 'city-picker__container--show': showCityContent }"
      >
        <!-- 拖动条 -->
        <view class="city-picker__handle"></view>
        <!-- 标题栏 -->
        <view class="city-picker__header">
          <text class="city-picker__title">选择城市</text>
          <view class="city-picker__close" @click="closeCityPicker">
            <view class="close-icon"></view>
          </view>
        </view>
        <!-- 内容 -->
        <scroll-view class="city-picker__content" scroll-y>
          <view class="city-picker__inner">
            <!-- 当前定位 -->
            <view class="city-picker__section">
              <text class="city-picker__section-title">当前定位</text>
              <view
                class="city-picker__current"
                @click="selectCity(locatedCity)"
              >
                <image class="city-picker__location-icon" src="@/static/location.svg" mode="aspectFit" />
                <text>{{ locatedCity }}</text>
              </view>
            </view>
            <!-- 热门城市 -->
            <view class="city-picker__section">
              <text class="city-picker__section-title">热门城市</text>
              <view class="city-picker__grid">
                <view
                  v-for="city in hotCities"
                  :key="city"
                  class="city-picker__item"
                  :class="{ 'city-picker__item--active': currentCity === city }"
                  @click="selectCity(city)"
                >
                  <text>{{ city }}</text>
                </view>
              </view>
            </view>
            <!-- 按省份分组的城市列表 -->
            <view
              v-for="province in provinceList"
              :key="province.name"
              class="city-picker__section"
            >
              <text class="city-picker__section-title">{{
                province.name
              }}</text>
              <view class="city-picker__grid">
                <view
                  v-for="city in province.cities"
                  :key="city"
                  class="city-picker__item"
                  :class="{ 'city-picker__item--active': currentCity === city }"
                  @click="selectCity(city)"
                >
                  <text>{{ city }}</text>
                </view>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script>
import TabBar from "@/components/TabBar.vue";
import TopNotificationBar from "@/components/TopNotificationBar.vue";
import { isDarkMode } from "@/store/theme.js";
import { getHospitalList } from "@/utils/api/appointment.js";

export default {
  components: {
    TabBar,
    TopNotificationBar,
  },
  data() {
    return {
      statusBarHeight: 44,
      searchKeyword: "",
      currentCity: "深圳市",
      loading: true,
      hospitals: [],
      allHospitals: [], // 存储全部医院数据用于筛选
      page: 1,
      pageSize: 10,
      hasMore: true,
      // 城市选择器
      showCityPicker: false,
      showCityContent: false,
      locatedCity: "深圳市",
      hotCities: [
        "全国",
        "深圳市",
        "广州市",
        "北京市",
        "上海市",
        "杭州市",
        "成都市",
        "武汉市",
        "南京市",
        "西安市",
        "重庆市",
        "天津市",
        "苏州市",
        "东莞市",
        "佛山市",
        "长沙市",
      ],
      // 完整省市数据
      provinceList: [
        {
          name: "广东省",
          cities: [
            "广州市",
            "深圳市",
            "东莞市",
            "佛山市",
            "珠海市",
            "惠州市",
            "中山市",
            "江门市",
            "湛江市",
            "汕头市",
          ],
        },
        { name: "北京市", cities: ["北京市"] },
        { name: "上海市", cities: ["上海市"] },
        {
          name: "浙江省",
          cities: [
            "杭州市",
            "宁波市",
            "温州市",
            "嘉兴市",
            "绍兴市",
            "金华市",
            "台州市",
          ],
        },
        {
          name: "江苏省",
          cities: [
            "南京市",
            "苏州市",
            "无锡市",
            "常州市",
            "南通市",
            "扬州市",
            "镇江市",
            "徐州市",
          ],
        },
        {
          name: "四川省",
          cities: ["成都市", "绵阳市", "德阳市", "宜宾市", "泸州市", "南充市"],
        },
        {
          name: "湖北省",
          cities: ["武汉市", "宜昌市", "襄阳市", "荆州市", "黄冈市"],
        },
        {
          name: "湖南省",
          cities: ["长沙市", "株洲市", "湘潭市", "衡阳市", "岳阳市"],
        },
        {
          name: "陕西省",
          cities: ["西安市", "咸阳市", "宝鸡市", "渭南市", "榆林市"],
        },
        { name: "重庆市", cities: ["重庆市"] },
        { name: "天津市", cities: ["天津市"] },
        {
          name: "福建省",
          cities: ["福州市", "厦门市", "泉州市", "漳州市", "莆田市"],
        },
        {
          name: "山东省",
          cities: ["济南市", "青岛市", "烟台市", "潍坊市", "淄博市", "威海市"],
        },
        {
          name: "河南省",
          cities: ["郑州市", "洛阳市", "开封市", "南阳市", "新乡市"],
        },
        {
          name: "河北省",
          cities: ["石家庄市", "唐山市", "保定市", "廊坊市", "邯郸市"],
        },
        {
          name: "安徽省",
          cities: ["合肥市", "芜湖市", "蚌埠市", "马鞍山市", "安庆市"],
        },
        {
          name: "辽宁省",
          cities: ["沈阳市", "大连市", "鞍山市", "抚顺市", "锦州市"],
        },
        { name: "吉林省", cities: ["长春市", "吉林市", "四平市", "通化市"] },
        {
          name: "黑龙江省",
          cities: ["哈尔滨市", "齐齐哈尔市", "大庆市", "牡丹江市"],
        },
        {
          name: "江西省",
          cities: ["南昌市", "九江市", "赣州市", "景德镇市", "新余市"],
        },
        {
          name: "山西省",
          cities: ["太原市", "大同市", "临汾市", "长治市", "运城市"],
        },
        {
          name: "云南省",
          cities: ["昆明市", "大理市", "丽江市", "曲靖市", "玉溪市"],
        },
        { name: "贵州省", cities: ["贵阳市", "遵义市", "六盘水市", "安顺市"] },
        {
          name: "广西",
          cities: ["南宁市", "桂林市", "柳州市", "北海市", "玉林市"],
        },
        { name: "海南省", cities: ["海口市", "三亚市", "儋州市"] },
        { name: "甘肃省", cities: ["兰州市", "天水市", "白银市", "酒泉市"] },
        {
          name: "内蒙古",
          cities: ["呼和浩特市", "包头市", "鄂尔多斯市", "赤峰市"],
        },
        {
          name: "新疆",
          cities: ["乌鲁木齐市", "克拉玛依市", "吐鲁番市", "哈密市"],
        },
        { name: "宁夏", cities: ["银川市", "石嘴山市", "吴忠市"] },
        { name: "青海省", cities: ["西宁市", "海东市"] },
        { name: "西藏", cities: ["拉萨市", "日喀则市", "昌都市"] },
      ],
    };
  },
  computed: {
    isDark() {
      return isDarkMode();
    },
  },
  onLoad() {
    this.getStatusBarHeight();
    // 读取保存的城市
    const savedCity = uni.getStorageSync("selectedCity");
    if (savedCity) {
      this.currentCity = savedCity;
    }
    this.loadHospitals();
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

    async loadHospitals() {
      this.loading = true;
      try {
        const res = await getHospitalList({
          keyword: this.searchKeyword,
          page: 1,
          pageSize: 100, // 获取足够多的数据进行前端城市筛选
        });
        if (res.code === 200) {
          this.allHospitals = res.data.list || [];
          // 根据城市筛选
          this.filterHospitalsByCity();
          // 已加载全部数据，禁用加载更多
          this.hasMore = false;
        }
      } catch (e) {
        console.error("加载医院列表失败:", e);
      } finally {
        this.loading = false;
      }
    },

    handleSearch() {
      this.page = 1;
      this.loadHospitals();
    },

    clearSearch() {
      this.searchKeyword = "";
      this.handleSearch();
    },

    switchCity() {
      this.showCityPicker = true;
      setTimeout(() => {
        this.showCityContent = true;
      }, 50);
    },

    closeCityPicker() {
      this.showCityContent = false;
      setTimeout(() => {
        this.showCityPicker = false;
      }, 300);
    },

    selectCity(city) {
      this.currentCity = city;
      uni.setStorageSync("selectedCity", city);
      this.closeCityPicker();
      this.page = 1;
      this.filterHospitalsByCity();
    },

    filterHospitalsByCity() {
      let filtered = this.allHospitals;
      if (this.currentCity && this.currentCity !== "全国") {
        // 匹配城市名（兼容 "深圳市" 和 "深圳"）
        const cityName = this.currentCity.replace(/市$/, "");
        filtered = this.allHospitals.filter((h) => {
          const hCity = (h.address || "").replace(/市$/, "");
          return (
            hCity.includes(cityName) || h.address?.includes(this.currentCity)
          );
        });
      }
      this.hospitals = filtered;
    },

    loadMore() {
      if (this.hasMore && !this.loading) {
        this.page++;
        this.loadHospitals();
      }
    },

    formatDistance(meters) {
      if (meters < 1000) {
        return meters + "m";
      }
      return (meters / 1000).toFixed(1) + "km";
    },

    goToDepartments(hospital) {
      if (!hospital.isOpen) {
        uni.showToast({ title: "该医院暂停预约", icon: "none" });
        return;
      }
      uni.navigateTo({
        url: `/pages/appointment/departments?hospitalId=${
          hospital.id
        }&hospitalName=${encodeURIComponent(hospital.name)}`,
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.page {
  height: 100vh;
  overflow: hidden;
  background: $bg-base;
  display: flex;
  flex-direction: column;
  position: relative;
}

.page-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 400rpx;
  background: linear-gradient(180deg, #e8f4fd 0%, $bg-base 100%);
  pointer-events: none;
}

.status-bar {
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.navbar {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  padding: 0 $spacing-lg;
  flex-shrink: 0;
  position: relative;
  z-index: 1;

  &__title {
    font-size: $font-size-xl;
    font-weight: $font-weight-bold;
    color: $text-primary;
    letter-spacing: 2rpx;
  }
}

// 搜索栏
.search-section {
  padding: $spacing-md $spacing-lg;
  position: relative;
  z-index: 1;
}

.search-bar {
  display: flex;
  align-items: center;
  height: 80rpx;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: $radius-xl;
  padding: 0 $spacing-lg;
  box-shadow: $shadow-sm;

  &__icon {
    width: 36rpx;
    height: 36rpx;
    border: 4rpx solid $text-muted;
    border-radius: 50%;
    position: relative;
    margin-right: $spacing-md;

    &::after {
      content: "";
      position: absolute;
      width: 12rpx;
      height: 4rpx;
      background: $text-muted;
      border-radius: 2rpx;
      bottom: -6rpx;
      right: -6rpx;
      transform: rotate(45deg);
    }
  }

  &__input {
    flex: 1;
    font-size: $font-size-base;
    color: $text-primary;
  }

  &__placeholder {
    color: $text-muted;
  }

  &__clear {
    width: 36rpx;
    height: 36rpx;
    background: $bg-elevated;
    border-radius: 50%;
    position: relative;

    &::before,
    &::after {
      content: "";
      position: absolute;
      width: 16rpx;
      height: 3rpx;
      background: $text-muted;
      top: 50%;
      left: 50%;
      border-radius: 2rpx;
    }
    &::before {
      transform: translate(-50%, -50%) rotate(45deg);
    }
    &::after {
      transform: translate(-50%, -50%) rotate(-45deg);
    }
  }
}

// 定位栏
.location-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-sm $spacing-lg;
  position: relative;
  z-index: 1;

  &__left {
    display: flex;
    align-items: center;
  }

  &__icon {
    width: 28rpx;
    height: 36rpx;
    margin-right: $spacing-sm;
  }

  &__city {
    font-size: $font-size-base;
    font-weight: $font-weight-medium;
    color: $text-primary;
  }

  &__action {
    display: flex;
    align-items: center;
    color: $color-primary;
    font-size: $font-size-sm;
  }

  &__arrow {
    width: 16rpx;
    height: 16rpx;
    border-right: 3rpx solid $color-primary;
    border-bottom: 3rpx solid $color-primary;
    transform: rotate(-45deg);
    margin-left: 8rpx;
  }
}

// 内容区
.content {
  flex: 1;
  overflow: hidden;
  position: relative;
  z-index: 1;
}

.hospital-section {
  padding: $spacing-md $spacing-lg;
}

.section-title {
  font-size: $font-size-lg;
  font-weight: $font-weight-semibold;
  color: $text-primary;
  margin-bottom: $spacing-md;
  display: block;
}

// 骨架屏
.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.skeleton-card {
  display: flex;
  padding: $spacing-lg;
  background: $bg-card;
  border-radius: $radius-lg;
}

.skeleton-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: $radius-md;
  background: linear-gradient(
    90deg,
    $bg-elevated 25%,
    $bg-card 50%,
    $bg-elevated 75%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
}

.skeleton-content {
  flex: 1;
  margin-left: $spacing-md;
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.skeleton-line {
  height: 28rpx;
  border-radius: $radius-xs;
  background: linear-gradient(
    90deg,
    $bg-elevated 25%,
    $bg-card 50%,
    $bg-elevated 75%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;

  &--title {
    width: 60%;
  }
  &--short {
    width: 40%;
  }
  &--medium {
    width: 80%;
  }
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

// 医院卡片
.hospital-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.hospital-card {
  display: flex;
  padding: $spacing-lg;
  background: $bg-card;
  border-radius: $radius-lg;
  box-shadow: $shadow-sm;
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.25s ease;

  &:active {
    transform: scale(0.98);
  }

  &__logo {
    width: 120rpx;
    height: 120rpx;
    background: linear-gradient(135deg, #e8f4fd 0%, #d0e8f9 100%);
    border-radius: $radius-md;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border: 2rpx solid rgba(30, 58, 95, 0.08);
  }

  &__logo-text {
    font-size: $font-size-3xl;
    font-weight: $font-weight-bold;
    color: $color-primary;
  }

  &__info {
    flex: 1;
    margin: 0 $spacing-md;
    min-width: 0;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: $spacing-xs;
  }

  &__name {
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    color: $text-primary;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__rating {
    display: flex;
    align-items: center;
    margin-left: $spacing-sm;
  }

  &__rating-value {
    font-size: $font-size-sm;
    color: $color-warning;
    font-weight: $font-weight-semibold;
  }

  &__meta {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: $spacing-xs;
    margin-bottom: $spacing-xs;
  }

  &__tag {
    font-size: $font-size-xs;
    padding: 4rpx 12rpx;
    border-radius: $radius-xs;

    &--level {
      background: rgba(16, 185, 129, 0.1);
      color: $color-success;
    }

    &--type {
      background: rgba(59, 130, 246, 0.1);
      color: $color-info;
    }
  }

  &__distance {
    font-size: $font-size-sm;
    color: $color-accent;
    font-weight: $font-weight-medium;
    margin-left: $spacing-xs;
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-xs;
    margin-bottom: $spacing-xs;
  }

  &__label {
    font-size: $font-size-xs;
    color: $text-secondary;
    background: $bg-elevated;
    padding: 4rpx 12rpx;
    border-radius: $radius-xs;
  }

  &__address {
    font-size: $font-size-sm;
    color: $text-muted;
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__action {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__btn {
    padding: $spacing-sm $spacing-lg;
    background: linear-gradient(
      135deg,
      $color-primary 0%,
      $color-primary-light 100%
    );
    color: #fff;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    border-radius: $radius-md;
    margin-bottom: $spacing-xs;

    &--disabled {
      background: $text-muted;
    }
  }

  &__time {
    font-size: $font-size-xs;
    color: $text-muted;
  }
}

// 星星图标
.star-icon {
  width: 24rpx;
  height: 24rpx;
  position: relative;
  margin-right: 4rpx;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 12rpx solid transparent;
    border-right: 12rpx solid transparent;
    border-bottom: 8rpx solid $color-warning;
  }

  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 12rpx solid transparent;
    border-right: 12rpx solid transparent;
    border-top: 16rpx solid $color-warning;
  }
}

// 空状态
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $spacing-2xl 0;

  &__icon {
    width: 120rpx;
    height: 120rpx;
    background: $bg-elevated;
    border-radius: 50%;
    margin-bottom: $spacing-md;
  }

  &__text {
    font-size: $font-size-base;
    color: $text-muted;
  }
}

.tabbar-placeholder {
  height: calc(140rpx + env(safe-area-inset-bottom));
}

// ========== 深色模式 ==========
.page--dark {
  background: $dark-bg-base;

  .page-bg {
    background: linear-gradient(
      180deg,
      rgba(74, 144, 217, 0.1) 0%,
      $dark-bg-base 100%
    );
  }

  .navbar__title {
    color: $dark-text-primary;
  }

  .search-bar {
    background: rgba(22, 27, 34, 0.9);

    &__icon {
      border-color: $dark-text-muted;
      &::after {
        background: $dark-text-muted;
      }
    }

    &__input {
      color: $dark-text-primary;
    }
    &__placeholder {
      color: $dark-text-muted;
    }

    &__clear {
      background: $dark-bg-elevated;
      &::before,
      &::after {
        background: $dark-text-muted;
      }
    }
  }

  .location-bar {
    &__city {
      color: $dark-text-primary;
    }
    &__action {
      color: $dark-color-primary;
    }
    &__arrow {
      border-color: $dark-color-primary;
    }
  }

  .section-title {
    color: $dark-text-primary;
  }

  .skeleton-card {
    background: $dark-bg-card;
  }
  .skeleton-avatar,
  .skeleton-line {
    background: linear-gradient(
      90deg,
      $dark-bg-elevated 25%,
      $dark-bg-card 50%,
      $dark-bg-elevated 75%
    );
    background-size: 200% 100%;
  }

  .hospital-card {
    background: $dark-bg-card;

    &__logo {
      background: linear-gradient(
        135deg,
        rgba(74, 144, 217, 0.15) 0%,
        rgba(74, 144, 217, 0.1) 100%
      );
      border-color: rgba(74, 144, 217, 0.2);
    }
    &__logo-text {
      color: $dark-color-primary;
    }
    &__name {
      color: $dark-text-primary;
    }

    &__tag {
      &--level {
        background: rgba(16, 185, 129, 0.15);
      }
      &--type {
        background: rgba(59, 130, 246, 0.15);
      }
    }

    &__distance {
      color: $dark-color-accent;
    }
    &__label {
      background: $dark-bg-elevated;
      color: $dark-text-secondary;
    }
    &__address {
      color: $dark-text-muted;
    }

    &__btn {
      background: linear-gradient(
        135deg,
        $dark-color-primary 0%,
        lighten($dark-color-primary, 10%) 100%
      );
      &--disabled {
        background: $dark-text-muted;
      }
    }
    &__time {
      color: $dark-text-muted;
    }
  }

  .empty-state {
    &__icon {
      background: $dark-bg-elevated;
    }
    &__text {
      color: $dark-text-muted;
    }
  }

  .city-picker {
    &__overlay {
      background: rgba(0, 0, 0, 0.6);
    }
    &__container {
      background: $dark-bg-card;
    }
    &__handle {
      background: $dark-text-muted;
    }
    &__title {
      color: $dark-text-primary;
    }
    &__close .close-icon {
      &::before,
      &::after {
        background: $dark-text-muted;
      }
    }
    &__section-title {
      color: $dark-text-secondary;
    }
    &__current {
      background: $dark-bg-elevated;
      color: $dark-text-primary;
    }
    &__item {
      background: $dark-bg-elevated;
      color: $dark-text-primary;
      &--active {
        background: rgba(74, 144, 217, 0.2);
        color: $dark-color-primary;
        border-color: $dark-color-primary;
      }
    }
  }
}

// ========== 城市选择器样式 ==========
.city-picker {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10000;

  &__overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.4);
    opacity: 0;
    transition: opacity 0.3s ease;

    &--show {
      opacity: 1;
    }
  }

  &__container {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    background: $bg-card;
    border-radius: $radius-xl $radius-xl 0 0;
    transform: translateY(100%);
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    height: 70vh;
    display: flex;
    flex-direction: column;

    &--show {
      transform: translateY(0);
    }
  }

  &__handle {
    width: 60rpx;
    height: 8rpx;
    background: $text-muted;
    border-radius: 4rpx;
    margin: $spacing-md auto;
    opacity: 0.3;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 $spacing-lg $spacing-md;
    border-bottom: 1rpx solid $border-color;
  }

  &__title {
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    color: $text-primary;
  }

  &__close {
    width: 60rpx;
    height: 60rpx;
    display: flex;
    align-items: center;
    justify-content: center;

    .close-icon {
      width: 32rpx;
      height: 32rpx;
      position: relative;

      &::before,
      &::after {
        content: "";
        position: absolute;
        width: 100%;
        height: 4rpx;
        background: $text-muted;
        top: 50%;
        left: 0;
        border-radius: 2rpx;
      }
      &::before {
        transform: translateY(-50%) rotate(45deg);
      }
      &::after {
        transform: translateY(-50%) rotate(-45deg);
      }
    }
  }

  &__content {
    flex: 1;
    overflow: hidden;
  }

  &__inner {
    padding: $spacing-lg;
    padding-bottom: calc(#{$spacing-lg} + env(safe-area-inset-bottom));
  }

  &__section {
    margin-bottom: $spacing-lg;
  }

  &__section-title {
    font-size: $font-size-sm;
    color: $text-secondary;
    margin-bottom: $spacing-md;
    display: block;
  }

  &__current {
    display: inline-flex;
    align-items: center;
    padding: $spacing-sm $spacing-lg;
    background: $bg-elevated;
    border-radius: $radius-md;
    font-size: $font-size-base;
    color: $text-primary;
  }

  &__location-icon {
    width: 28rpx;
    height: 36rpx;
    margin-right: $spacing-sm;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: $spacing-sm;
  }

  &__item {
    padding: $spacing-sm 0;
    background: $bg-elevated;
    border-radius: $radius-md;
    text-align: center;
    font-size: $font-size-sm;
    color: $text-primary;
    border: 2rpx solid transparent;
    transition: all 0.2s ease;

    &--active {
      background: rgba(74, 144, 217, 0.1);
      color: $color-primary;
      border-color: $color-primary;
    }

    &:active {
      transform: scale(0.95);
    }
  }
}
</style>
