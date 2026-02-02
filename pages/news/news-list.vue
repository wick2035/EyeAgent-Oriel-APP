<template>
  <view class="page" :class="{ 'page--dark': isDark }">
    <!-- 顶部渐变背景 -->
    <view class="page__bg"></view>

    <!-- 状态栏占位 -->
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>

    <!-- 导航栏 -->
    <view class="navbar">
      <view class="navbar__back" @click="goBack">
        <view class="navbar__back-icon"></view>
      </view>
      <text class="navbar__title">健康资讯</text>
      <view class="navbar__action" @click="toggleSearch">
        <view class="navbar__search-icon"></view>
      </view>
    </view>

    <!-- 搜索栏 -->
    <view v-if="showSearch" class="search-section">
      <view class="search-bar">
        <view class="search-bar__icon"></view>
        <input
          class="search-bar__input"
          v-model="searchKeyword"
          placeholder="搜索健康资讯..."
          placeholder-class="search-bar__placeholder"
          @input="handleSearchInput"
          @confirm="handleSearch"
          :focus="showSearch"
        />
        <view
          v-if="searchKeyword"
          class="search-bar__clear"
          @click="clearSearch"
        >
          <view class="clear-icon"></view>
        </view>
      </view>
      <view v-if="hotTags.length" class="hot-tags">
        <text class="hot-tags__label">热门：</text>
        <view
          v-for="(tag, index) in hotTags.slice(0, 5)"
          :key="index"
          class="hot-tag"
          @click="searchByTag(tag)"
        >
          {{ tag }}
        </view>
      </view>
    </view>

    <!-- 分类Tab -->
    <scroll-view
      class="category-tabs"
      scroll-x
      scroll-with-animation
      :scroll-left="tabScrollLeft"
    >
      <view class="category-tabs__track">
        <view
          v-for="(category, index) in categories"
          :key="category.id"
          class="category-tab"
          :class="{ 'category-tab--active': currentCategory === category.id }"
          @click="switchCategory(category.id, index)"
        >
          <text>{{ category.name }}</text>
          <view
            v-if="currentCategory === category.id"
            class="category-tab__indicator"
          ></view>
        </view>
      </view>
    </scroll-view>

    <!-- 内容区域 -->
    <scroll-view
      class="content"
      scroll-y
      @scrolltolower="loadMore"
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
      refresher-background="transparent"
    >
      <!-- 资讯列表 -->
      <view v-if="!loading || newsList.length" class="news-list">
        <view
          v-for="(item, index) in newsList"
          :key="item.id"
          class="news-card"
          :style="{ animationDelay: (index % 10) * 0.05 + 's' }"
          @click="goToDetail(item)"
        >
          <!-- 大图模式 -->
          <view v-if="item.cover" class="news-card--large">
            <image
              class="news-card__cover"
              :src="item.cover"
              mode="aspectFill"
              lazy-load
            />
            <view class="news-card__content">
              <text class="news-card__title">{{ item.title }}</text>
              <text class="news-card__summary">{{ item.summary }}</text>
              <view class="news-card__meta">
                <view class="news-card__category" :data-type="item.category">
                  {{ item.categoryName }}
                </view>
                <text class="news-card__source">{{ item.source }}</text>
                <text class="news-card__dot">·</text>
                <text class="news-card__time">{{ formatTime(item.publishTime) }}</text>
                <text class="news-card__dot">·</text>
                <text class="news-card__view">{{ formatCount(item.viewCount) }}阅读</text>
              </view>
            </view>
          </view>

          <!-- 无图模式 -->
          <view v-else class="news-card--text">
            <text class="news-card__title">{{ item.title }}</text>
            <text class="news-card__summary">{{ item.summary }}</text>
            <view class="news-card__meta">
              <view class="news-card__category" :data-type="item.category">
                {{ item.categoryName }}
              </view>
              <text class="news-card__source">{{ item.source }}</text>
              <text class="news-card__dot">·</text>
              <text class="news-card__time">{{ formatTime(item.publishTime) }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 骨架屏 -->
      <view v-if="loading && !newsList.length" class="skeleton-list">
        <view v-for="i in 5" :key="i" class="skeleton-card">
          <view class="skeleton-image"></view>
          <view class="skeleton-content">
            <view class="skeleton-line skeleton-line--title"></view>
            <view class="skeleton-line skeleton-line--text"></view>
            <view class="skeleton-line skeleton-line--text"></view>
            <view class="skeleton-line skeleton-line--short"></view>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view
        v-if="!loading && !newsList.length"
        class="empty-state"
      >
        <view class="empty-state__icon"></view>
        <text class="empty-state__text">{{ emptyText }}</text>
      </view>

      <!-- 加载更多 -->
      <view v-if="!loading && newsList.length" class="load-more">
        <text v-if="loadingMore" class="load-more__text">加载中...</text>
        <text v-else-if="hasMore" class="load-more__text">上拉加载更多</text>
        <text v-else class="load-more__text load-more__text--end">已经到底了</text>
      </view>

      <!-- 底部占位 -->
      <view class="bottom-placeholder"></view>
    </scroll-view>
  </view>
</template>

<script>
import { getNewsList, getCategories, getHotTags } from '@/utils/api/news.js'
import { isDarkMode } from '@/store/theme.js'

export default {
  data() {
    return {
      statusBarHeight: 44,
      showSearch: false,
      searchKeyword: '',
      searchTimer: null,
      currentCategory: 'all',
      tabScrollLeft: 0,
      categories: [],
      hotTags: [],
      newsList: [],
      loading: true,
      loadingMore: false,
      refreshing: false,
      hasMore: true,
      page: 1,
      pageSize: 10
    }
  },
  computed: {
    isDark() {
      return isDarkMode()
    },
    emptyText() {
      if (this.searchKeyword) {
        return '未找到相关资讯'
      }
      return '暂无资讯'
    }
  },
  onLoad() {
    this.getStatusBarHeight()
    this.initData()
  },
  onShow() {
    // 返回列表时，如有需要可在此同步收藏等状态，避免整页重新请求
    this.refreshFavoriteStatus()
  },
  methods: {
    getStatusBarHeight() {
      const sysInfo = uni.getSystemInfoSync()
      this.statusBarHeight = sysInfo.statusBarHeight || 44
    },
    
    async initData() {
      // 加载分类
      await this.loadCategories()
      // 加载热门标签
      await this.loadHotTags()
      // 加载资讯列表
      await this.loadNewsList()
    },

    async loadCategories() {
      try {
        const res = await getCategories()
        if (res.code === 200) {
          this.categories = res.data
        }
      } catch (error) {
        console.error('加载分类失败:', error)
      }
    },

    async loadHotTags() {
      try {
        const res = await getHotTags()
        if (res.code === 200) {
          this.hotTags = res.data
        }
      } catch (error) {
        console.error('加载热门标签失败:', error)
      }
    },

    async loadNewsList(isRefresh = false) {
      if (isRefresh) {
        this.page = 1
        this.hasMore = true
      }

      if (!isRefresh && !this.hasMore) {
        return
      }

      try {
        const params = {
          category: this.currentCategory,
          keyword: this.searchKeyword,
          page: this.page,
          pageSize: this.pageSize
        }

        const res = await getNewsList(params)
        if (res.code === 200) {
          if (isRefresh) {
            this.newsList = res.data.list
          } else {
            this.newsList = [...this.newsList, ...res.data.list]
          }
          
          this.hasMore = res.data.hasMore
          this.page++
        }
      } catch (error) {
        console.error('加载资讯列表失败:', error)
        uni.showToast({
          title: '加载失败，请重试',
          icon: 'none'
        })
      } finally {
        this.loading = false
        this.loadingMore = false
        this.refreshing = false
        uni.stopPullDownRefresh()
      }
    },

    async onRefresh() {
      this.refreshing = true
      this.loading = true
      await this.loadNewsList(true)
    },

    async loadMore() {
      if (this.loading || this.loadingMore || !this.hasMore) {
        return
      }
      this.loadingMore = true
      await this.loadNewsList(false)
    },

    switchCategory(categoryId, index) {
      if (this.currentCategory === categoryId) {
        return
      }
      
      this.currentCategory = categoryId
      this.newsList = []
      this.loading = true
      this.page = 1
      this.hasMore = true
      this.loadNewsList(true)

      // 计算滚动位置，使当前tab居中
      this.tabScrollLeft = Math.max(0, index * 120 - 150)
    },

    toggleSearch() {
      this.showSearch = !this.showSearch
      if (!this.showSearch && this.searchKeyword) {
        this.clearSearch()
      }
    },

    handleSearchInput(e) {
      // 防抖搜索
      clearTimeout(this.searchTimer)
      this.searchTimer = setTimeout(() => {
        this.handleSearch()
      }, 500)
    },

    handleSearch() {
      clearTimeout(this.searchTimer)
      this.newsList = []
      this.loading = true
      this.page = 1
      this.hasMore = true
      this.loadNewsList(true)
    },

    clearSearch() {
      this.searchKeyword = ''
      this.handleSearch()
    },

    searchByTag(tag) {
      this.searchKeyword = tag
      this.handleSearch()
    },

    goToDetail(item) {
      uni.navigateTo({
        url: `/pages/news/news-detail?id=${item.id}`
      })
    },

    goBack() {
      uni.navigateBack()
    },

    refreshFavoriteStatus() {
      // 刷新收藏状态（如果需要）
      // 这里可以从store中读取收藏状态，更新列表中的isFavorite字段
    },

    formatTime(timeStr) {
      if (!timeStr) return ''
      
      const time = new Date(timeStr.replace(/-/g, '/'))
      const now = new Date()
      const diff = now - time
      
      const minute = 60 * 1000
      const hour = 60 * minute
      const day = 24 * hour
      
      if (diff < minute) {
        return '刚刚'
      } else if (diff < hour) {
        return Math.floor(diff / minute) + '分钟前'
      } else if (diff < day) {
        return Math.floor(diff / hour) + '小时前'
      } else if (diff < 7 * day) {
        return Math.floor(diff / day) + '天前'
      } else {
        const month = time.getMonth() + 1
        const date = time.getDate()
        return `${month}月${date}日`
      }
    },

    formatCount(count) {
      if (count < 1000) {
        return count
      } else if (count < 10000) {
        return (count / 1000).toFixed(1) + 'k'
      } else {
        return (count / 10000).toFixed(1) + 'w'
      }
    }
  }
}
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
    height: 400rpx;
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

.status-bar {
  position: relative;
  z-index: 1;
}

.navbar {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 88rpx;
  padding: 0 $spacing-lg;

  &__back {
    width: 72rpx;
    height: 72rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-full;
    background: $bg-card;
    box-shadow: $shadow-sm;
    transition: transform 0.2s;

    &:active {
      transform: scale(0.92);
    }
  }

  &__back-icon {
    width: 18rpx;
    height: 18rpx;
    border-left: 3rpx solid $text-primary;
    border-bottom: 3rpx solid $text-primary;
    transform: rotate(45deg);
  }

  &__title {
    flex: 1;
    text-align: center;
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    color: $text-primary;
  }

  &__action {
    width: 72rpx;
    height: 72rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-full;
    background: $bg-card;
    box-shadow: $shadow-sm;
    transition: transform 0.2s;

    &:active {
      transform: scale(0.92);
    }
  }

  &__search-icon {
    width: 32rpx;
    height: 32rpx;
    border: 3rpx solid $text-primary;
    border-radius: 50%;
    position: relative;

    &::after {
      content: '';
      position: absolute;
      bottom: -8rpx;
      right: -8rpx;
      width: 12rpx;
      height: 3rpx;
      background: $text-primary;
      transform: rotate(45deg);
    }
  }
}

.search-section {
  position: relative;
  z-index: 1;
  padding: 0 $spacing-lg $spacing-md;
  animation: slideDown 0.3s ease;
}

.search-bar {
  display: flex;
  align-items: center;
  height: 72rpx;
  background: $bg-card;
  border-radius: $radius-xl;
  padding: 0 $spacing-md;
  box-shadow: $shadow-sm;

  &__icon {
    width: 32rpx;
    height: 32rpx;
    border: 3rpx solid $text-muted;
    border-radius: 50%;
    margin-right: $spacing-sm;
    position: relative;
    flex-shrink: 0;

    &::after {
      content: '';
      position: absolute;
      bottom: -6rpx;
      right: -6rpx;
      width: 10rpx;
      height: 3rpx;
      background: $text-muted;
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
    width: 40rpx;
    height: 40rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
}

.clear-icon {
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  background: $text-muted;
  position: relative;

  &::before,
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 16rpx;
    height: 2rpx;
    background: #fff;
  }

  &::before {
    transform: translate(-50%, -50%) rotate(45deg);
  }

  &::after {
    transform: translate(-50%, -50%) rotate(-45deg);
  }
}

.hot-tags {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  margin-top: $spacing-sm;
  padding: 0 $spacing-xs;

  &__label {
    font-size: $font-size-sm;
    color: $text-muted;
    margin-right: $spacing-sm;
  }
}

.hot-tag {
  padding: 8rpx 16rpx;
  background: rgba(59, 130, 246, 0.1);
  color: $color-info;
  font-size: $font-size-xs;
  border-radius: $radius-sm;
  margin-right: $spacing-sm;
  margin-bottom: $spacing-xs;
  transition: all 0.2s;

  &:active {
    background: rgba(59, 130, 246, 0.2);
    transform: scale(0.95);
  }
}

.category-tabs {
  position: relative;
  z-index: 1;
  white-space: nowrap;
  margin-bottom: $spacing-sm;
}

.category-tabs__track {
  display: inline-flex;
  padding: 0 $spacing-lg;
}

.category-tab {
  position: relative;
  padding: $spacing-sm $spacing-md;
  font-size: $font-size-base;
  color: $text-secondary;
  transition: all 0.25s;
  flex-shrink: 0;

  &--active {
    color: $color-primary;
    font-weight: $font-weight-semibold;
  }

  &__indicator {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 40rpx;
    height: 6rpx;
    background: $color-primary;
    border-radius: 3rpx;
    animation: scaleIn 0.25s ease;
  }
}

.content {
  position: relative;
  z-index: 1;
  height: calc(100vh - 88rpx - 120rpx);
}

.news-list {
  padding: 0 $spacing-lg;
}

.news-card {
  background: $bg-card;
  border-radius: $radius-lg;
  margin-bottom: $spacing-md;
  box-shadow: $shadow-sm;
  overflow: hidden;
  transition: all 0.25s;
  animation: fadeInUp 0.5s ease backwards;

  &:active {
    transform: scale(0.98);
    box-shadow: $shadow-md;
  }
}

.news-card--large {
  .news-card__cover {
    width: 100%;
    height: 360rpx;
    display: block;
  }

  .news-card__content {
    padding: $spacing-md;
  }

  .news-card__title {
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    color: $text-primary;
    line-height: $line-height-normal;
    margin-bottom: $spacing-xs;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .news-card__summary {
    font-size: $font-size-sm;
    color: $text-secondary;
    line-height: $line-height-relaxed;
    margin-bottom: $spacing-sm;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

.news-card--text {
  padding: $spacing-md;

  .news-card__title {
    font-size: $font-size-base;
    font-weight: $font-weight-semibold;
    color: $text-primary;
    line-height: $line-height-normal;
    margin-bottom: $spacing-xs;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .news-card__summary {
    font-size: $font-size-sm;
    color: $text-secondary;
    line-height: $line-height-relaxed;
    margin-bottom: $spacing-sm;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

.news-card__meta {
  display: flex;
  align-items: center;
  font-size: $font-size-xs;
  color: $text-muted;
}

.news-card__category {
  padding: 4rpx 12rpx;
  border-radius: $radius-xs;
  font-size: $font-size-xs;
  margin-right: $spacing-sm;

  &[data-type='eye'] {
    background: rgba(59, 130, 246, 0.1);
    color: $color-info;
  }

  &[data-type='internal'] {
    background: rgba(16, 185, 129, 0.1);
    color: $color-success;
  }

  &[data-type='surgery'] {
    background: rgba(245, 158, 11, 0.1);
    color: $color-warning;
  }

  &[data-type='health'] {
    background: rgba(139, 92, 246, 0.1);
    color: #8B5CF6;
  }

  &[data-type='nutrition'] {
    background: rgba(236, 72, 153, 0.1);
    color: #EC4899;
  }

  &[data-type='psychology'] {
    background: rgba(249, 115, 22, 0.1);
    color: $color-medium-risk;
  }
}

.news-card__source {
  color: $text-muted;
}

.news-card__dot {
  margin: 0 8rpx;
  color: $text-muted;
}

.news-card__time,
.news-card__view {
  color: $text-muted;
}

.skeleton-list {
  padding: 0 $spacing-lg;
}

.skeleton-card {
  background: $bg-card;
  border-radius: $radius-lg;
  padding: $spacing-md;
  margin-bottom: $spacing-md;
  box-shadow: $shadow-sm;
}

.skeleton-image {
  width: 100%;
  height: 360rpx;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: $radius-md;
  margin-bottom: $spacing-md;
}

.skeleton-content {
  .skeleton-line {
    height: 28rpx;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 4rpx;
    margin-bottom: $spacing-sm;

    &--title {
      width: 80%;
      height: 32rpx;
    }

    &--text {
      width: 100%;
    }

    &--short {
      width: 40%;
      height: 24rpx;
    }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx $spacing-lg;

  &__icon {
    width: 200rpx;
    height: 200rpx;
    background: $bg-elevated;
    border-radius: 50%;
    margin-bottom: $spacing-lg;
    position: relative;

    &::before,
    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }

    &::before {
      width: 80rpx;
      height: 80rpx;
      border: 4rpx solid $text-muted;
      border-radius: 50%;
    }

    &::after {
      width: 120rpx;
      height: 4rpx;
      background: $text-muted;
      top: 60%;
      transform: translate(-50%, -50%) rotate(45deg);
    }
  }

  &__text {
    font-size: $font-size-base;
    color: $text-muted;
  }
}

.load-more {
  padding: $spacing-lg;
  text-align: center;

  &__text {
    font-size: $font-size-sm;
    color: $text-muted;

    &--end {
      color: $text-muted;
    }
  }
}

.bottom-placeholder {
  height: 40rpx;
}

// 深色模式适配
.page--dark {
  .navbar__back,
  .navbar__action {
    background: $dark-bg-card;
  }

  .navbar__back-icon {
    border-color: $dark-text-primary;
  }

  .navbar__title {
    color: $dark-text-primary;
  }

  .navbar__search-icon {
    border-color: $dark-text-primary;

    &::after {
      background: $dark-text-primary;
    }
  }

  .search-bar {
    background: $dark-bg-card;

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
  }

  .hot-tags__label {
    color: $dark-text-muted;
  }

  .category-tab {
    color: $dark-text-secondary;

    &--active {
      color: $dark-color-primary;
    }

    &__indicator {
      background: $dark-color-primary;
    }
  }

  .news-card {
    background: $dark-bg-card;

    &__title {
      color: $dark-text-primary;
    }

    &__summary {
      color: $dark-text-secondary;
    }

    &__source,
    &__dot,
    &__time,
    &__view {
      color: $dark-text-muted;
    }
  }

  .skeleton-card {
    background: $dark-bg-card;
  }

  .skeleton-image,
  .skeleton-line {
    background: linear-gradient(90deg, #21262d 25%, #30363d 50%, #21262d 75%);
    background-size: 200% 100%;
  }

  .empty-state__icon {
    background: $dark-bg-elevated;

    &::before {
      border-color: $dark-text-muted;
    }

    &::after {
      background: $dark-text-muted;
    }
  }

  .empty-state__text {
    color: $dark-text-muted;
  }

  .load-more__text {
    color: $dark-text-muted;
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

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scaleIn {
  from {
    transform: translateX(-50%) scaleX(0);
  }
  to {
    transform: translateX(-50%) scaleX(1);
  }
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
</style>
