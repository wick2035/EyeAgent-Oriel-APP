<template>
  <view class="page" :class="{ 'page--dark': isDark }">
    <!-- 状态栏占位 -->
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>

    <!-- 导航栏 -->
    <view
      class="navbar"
      :style="{ top: statusBarHeight + 'px' }"
    >
      <view class="navbar__left">
        <view class="navbar__back" @click="goBack">
          <view class="navbar__back-icon"></view>
        </view>
      </view>
      <text class="navbar__title">资讯详情</text>
      <view class="navbar__actions">
        <view class="navbar__action" @click="toggleFavorite">
          <image 
            class="navbar__favorite-icon" 
            src="/static/shoucang.svg"
            mode="aspectFit"
            :style="{ filter: isFavorite ? 'invert(67%) sepia(54%) saturate(2293%) hue-rotate(360deg) brightness(101%) contrast(96%)' : 'none' }"
          />
        </view>
        <view class="navbar__action" @click="handleShare">
          <image 
            class="navbar__share-icon" 
            src="/static/share.svg"
            mode="aspectFit"
          />
        </view>
      </view>
    </view>

    <!-- 内容区域 -->
    <scroll-view
      class="content"
      scroll-y
      @scroll="handleScroll"
    >
      <view v-if="loading" class="skeleton-detail">
        <view class="skeleton-title"></view>
        <view class="skeleton-meta"></view>
        <view class="skeleton-image"></view>
        <view class="skeleton-text"></view>
        <view class="skeleton-text"></view>
        <view class="skeleton-text skeleton-text--short"></view>
      </view>

      <view v-else-if="article" class="article">
        <!-- 文章头部 -->
        <view class="article-header">
          <text class="article-header__title">{{ article.title }}</text>
          
          <view class="article-header__meta">
            <view class="meta-item">
              <text class="meta-item__label">{{ article.source }}</text>
              <text v-if="article.author" class="meta-item__value">
                · {{ article.author }}
              </text>
            </view>
            <view class="meta-item">
              <text class="meta-item__time">{{ formatTime(article.publishTime) }}</text>
            </view>
            <view class="meta-item">
              <text class="meta-item__stat">{{ formatCount(article.viewCount) }}阅读</text>
              <text class="meta-item__dot">·</text>
              <text class="meta-item__stat">{{ formatCount(article.likeCount) }}点赞</text>
            </view>
          </view>

          <view v-if="article.tags && article.tags.length" class="article-header__tags">
            <view
              v-for="(tag, index) in article.tags"
              :key="index"
              class="tag"
              :data-type="article.category"
            >
              #{{ tag }}
            </view>
          </view>
        </view>

        <!-- 文章正文 -->
        <view class="article-body">
          <rich-text :nodes="processedContent" @tap="handleRichTextTap"></rich-text>
        </view>

        <!-- 互动区域 -->
        <view class="article-actions">
          <view class="action-btn" @click="handleLike">
            <image 
              class="action-btn__icon" 
              src="/static/like.svg"
              mode="aspectFit"
              :style="{ filter: isLiked ? 'invert(37%) sepia(93%) saturate(1719%) hue-rotate(335deg) brightness(101%) contrast(101%)' : 'none' }"
            />
            <text class="action-btn__text" :style="{ color: isLiked ? '#FF6B5B' : '' }">{{ formatCount(article.likeCount) }}</text>
          </view>
          <view class="action-btn" @click="toggleFavorite">
            <image 
              class="action-btn__icon" 
              src="/static/shoucang.svg"
              mode="aspectFit"
              :style="{ filter: isFavorite ? 'invert(67%) sepia(54%) saturate(2293%) hue-rotate(360deg) brightness(101%) contrast(96%)' : 'none' }"
            />
            <text class="action-btn__text">收藏</text>
          </view>
          <view class="action-btn" @click="handleShare">
            <image 
              class="action-btn__icon" 
              src="/static/share.svg"
              mode="aspectFit"
            />
            <text class="action-btn__text">分享</text>
          </view>
        </view>

        <!-- 相关推荐 -->
        <view v-if="relatedNews.length" class="related-section">
          <text class="related-section__title">相关推荐</text>
          <view class="related-list">
            <view
              v-for="item in relatedNews"
              :key="item.id"
              class="related-item"
              @click="goToRelated(item)"
            >
              <view class="related-item__content">
                <text class="related-item__title">{{ item.title }}</text>
                <view class="related-item__meta">
                  <text class="related-item__source">{{ item.source }}</text>
                  <text class="related-item__dot">·</text>
                  <text class="related-item__view">{{ formatCount(item.viewCount) }}阅读</text>
                </view>
              </view>
              <image
                v-if="item.cover"
                class="related-item__cover"
                :src="item.cover"
                mode="aspectFill"
              />
            </view>
          </view>
        </view>

        <!-- 底部占位 -->
        <view class="bottom-placeholder"></view>
      </view>

      <!-- 加载失败 -->
      <view v-else class="error-state">
        <view class="error-state__icon"></view>
        <text class="error-state__text">加载失败</text>
        <view class="error-state__btn" @click="loadDetail">重新加载</view>
      </view>
    </scroll-view>

    <!-- 图片预览遮罩 -->
    <view v-if="showImagePreview" class="image-preview" @click="closeImagePreview">
      <image
        class="image-preview__img"
        :src="previewImageUrl"
        mode="aspectFit"
        @click.stop
      />
      <view class="image-preview__close" @click="closeImagePreview">
        <view class="close-icon"></view>
      </view>
    </view>
  </view>
</template>

<script>
import { getNewsDetail, getRelatedNews, toggleLike } from '@/utils/api/news.js'
import { isFavorite, toggleFavorite as toggleFavoriteStore, addHistory } from '@/store/news.js'
import { isDarkMode } from '@/store/theme.js'

export default {
  data() {
    return {
      statusBarHeight: 44,
      newsId: null,
      article: null,
      relatedNews: [],
      loading: true,
      isFavorite: false,
      isLiked: false,
      showImagePreview: false,
      previewImageUrl: ''
    }
  },
  computed: {
    isDark() {
      return isDarkMode()
    },
    processedContent() {
      if (!this.article || !this.article.content) {
        return ''
      }
      
      // 处理富文本内容，添加样式
      let content = this.article.content
      
      // 为图片添加点击事件标识
      content = content.replace(/<img/g, '<img class="content-image"')
      
      return content
    }
  },
  onLoad(options) {
    this.getStatusBarHeight()
    if (options.id) {
      this.newsId = parseInt(options.id)
      this.loadDetail()
      this.loadRelatedNews()
    }
  },
  onUnload() {
    // 记录阅读历史
    if (this.article) {
      addHistory(this.article.id, this.article.title)
    }
  },
  methods: {
    getStatusBarHeight() {
      const sysInfo = uni.getSystemInfoSync()
      this.statusBarHeight = sysInfo.statusBarHeight || 44
    },

    async loadDetail() {
      this.loading = true
      try {
        const res = await getNewsDetail(this.newsId)
        if (res.code === 200) {
          this.article = res.data
          this.isLiked = res.data.isLiked || false
          this.checkFavoriteStatus()
        }
      } catch (error) {
        console.error('加载详情失败:', error)
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },

    async loadRelatedNews() {
      try {
        const res = await getRelatedNews(this.newsId, 3)
        if (res.code === 200) {
          this.relatedNews = res.data
        }
      } catch (error) {
        console.error('加载相关推荐失败:', error)
      }
    },

    checkFavoriteStatus() {
      this.isFavorite = isFavorite(this.newsId)
    },

    toggleFavorite() {
      const newStatus = toggleFavoriteStore(this.newsId)
      this.isFavorite = newStatus
      
      // 动画效果
      const icon = newStatus ? '❤️' : '💔'
      uni.showToast({
        title: newStatus ? '收藏成功' : '取消收藏',
        icon: 'none'
      })
    },

    async handleLike() {
      try {
        const res = await toggleLike(this.newsId)
        if (res.code === 200) {
          this.isLiked = res.data.isLiked
          this.article.likeCount = res.data.likeCount
          
          if (this.isLiked) {
            uni.showToast({
              title: '点赞成功',
              icon: 'none'
            })
          }
        }
      } catch (error) {
        console.error('点赞失败:', error)
      }
    },

    handleShare() {
      uni.showShareMenu({
        title: this.article?.title || '健康资讯',
        path: `/pages/news/news-detail?id=${this.newsId}`,
        success: () => {
          uni.showToast({
            title: '分享成功',
            icon: 'success'
          })
        },
        fail: () => {
          // 降级方案：显示分享提示
          uni.showModal({
            title: '分享',
            content: '请点击右上角分享按钮',
            showCancel: false
          })
        }
      })
    },

    handleScroll(e) {
      // 保留方法以便未来扩展
    },

    handleRichTextTap(e) {
      // 处理富文本中的点击事件
      const target = e.detail
      if (target && target.className && target.className.includes('content-image')) {
        // 点击了图片
        const src = target.src
        if (src) {
          this.previewImage(src)
        }
      }
    },

    previewImage(url) {
      // 使用uni-app的图片预览
      uni.previewImage({
        urls: [url],
        current: url
      })
    },

    closeImagePreview() {
      this.showImagePreview = false
      this.previewImageUrl = ''
    },

    goToRelated(item) {
      uni.redirectTo({
        url: `/pages/news/news-detail?id=${item.id}`
      })
    },

    goBack() {
      uni.navigateBack()
    },

    formatTime(timeStr) {
      if (!timeStr) return ''
      
      const time = new Date(timeStr.replace(/-/g, '/'))
      const year = time.getFullYear()
      const month = time.getMonth() + 1
      const date = time.getDate()
      const hour = time.getHours()
      const minute = time.getMinutes()
      
      return `${year}-${this.pad(month)}-${this.pad(date)} ${this.pad(hour)}:${this.pad(minute)}`
    },

    pad(num) {
      return num < 10 ? '0' + num : num
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

  &--dark {
    background: $dark-bg-base;
  }
}

.status-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 998;
  background: #fff;
}

.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 88rpx;
  padding: 0 $spacing-lg;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20rpx);
  box-shadow: $shadow-sm;
  transition: all 0.3s;

  &__left {
    width: 120rpx;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    flex-shrink: 0;
  }

  &__back {
    width: 72rpx;
    height: 72rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-full;
    background: transparent;
    backdrop-filter: blur(10rpx);
    transition: transform 0.2s;

    &:active {
      transform: scale(0.92);
    }
  }

  &__back-icon {
    width: 20rpx;
    height: 20rpx;
    border-left: 4rpx solid #000;
    border-bottom: 4rpx solid #000;
    transform: rotate(45deg);
  }

  &__title {
    flex: 1;
    text-align: center;
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    color: $text-primary;
    margin: 0 $spacing-md;
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: $spacing-sm;
    width: 120rpx;
    flex-shrink: 0;
  }

  &__action {
    width: 64rpx;
    height: 64rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-full;
    background: transparent;
    backdrop-filter: blur(10rpx);
    transition: transform 0.2s;

    &:active {
      transform: scale(0.92);
    }
  }

  &__favorite-icon {
    width: 32rpx;
    height: 32rpx;
  }

  &__share-icon {
    width: 32rpx;
    height: 32rpx;
  }
}

.progress-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 4rpx;
  background: rgba(0, 0, 0, 0.05);
  z-index: 998;

  &__fill {
    height: 100%;
    background: $color-primary;
    transition: width 0.1s linear;
  }
}

.content {
  height: 100vh;
  overflow-y: auto;
}

.skeleton-detail {
  padding: 180rpx $spacing-lg $spacing-lg;

  .skeleton-title {
    width: 90%;
    height: 80rpx;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 8rpx;
    margin-bottom: $spacing-lg;
  }

  .skeleton-meta {
    width: 60%;
    height: 40rpx;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 8rpx;
    margin-bottom: $spacing-xl;
  }

  .skeleton-image {
    width: 100%;
    height: 400rpx;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: $radius-lg;
    margin-bottom: $spacing-lg;
  }

  .skeleton-text {
    width: 100%;
    height: 32rpx;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 8rpx;
    margin-bottom: $spacing-md;

    &--short {
      width: 70%;
    }
  }
}

.article {
  padding: 180rpx $spacing-lg $spacing-lg;
  animation: fadeIn 0.5s ease;
}

.article-header {
  margin-bottom: $spacing-xl;

  &__title {
    font-size: $font-size-2xl;
    font-weight: $font-weight-bold;
    color: $text-primary;
    line-height: $line-height-relaxed;
    display: block;
    margin-bottom: $spacing-lg;
  }

  &__meta {
    margin-bottom: $spacing-md;
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-sm;
  }
}

.meta-item {
  display: flex;
  align-items: center;
  font-size: $font-size-sm;
  color: $text-secondary;
  margin-bottom: $spacing-xs;

  &__label {
    color: $text-secondary;
    font-weight: $font-weight-medium;
  }

  &__value {
    color: $text-muted;
    margin-left: 8rpx;
  }

  &__time {
    color: $text-muted;
  }

  &__stat {
    color: $text-muted;
  }

  &__dot {
    margin: 0 8rpx;
    color: $text-muted;
  }
}

.tag {
  padding: 8rpx 16rpx;
  border-radius: $radius-sm;
  font-size: $font-size-xs;

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

.article-body {
  font-size: $font-size-base;
  color: $text-primary;
  line-height: $line-height-relaxed;
  margin-bottom: $spacing-xl;

  :deep(h2) {
    font-size: $font-size-xl;
    font-weight: $font-weight-semibold;
    color: $text-primary;
    margin: $spacing-xl 0 $spacing-md;
  }

  :deep(h3) {
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    color: $text-primary;
    margin: $spacing-lg 0 $spacing-sm;
  }

  :deep(h4) {
    font-size: $font-size-md;
    font-weight: $font-weight-medium;
    color: $text-primary;
    margin: $spacing-md 0 $spacing-sm;
  }

  :deep(p) {
    margin-bottom: $spacing-md;
  }

  :deep(img) {
    width: 100%;
    display: block;
    margin: $spacing-md 0;
    border-radius: $radius-lg;
    object-fit: cover;
  }

  :deep(ul),
  :deep(ol) {
    padding-left: $spacing-lg;
    margin-bottom: $spacing-md;
  }

  :deep(li) {
    margin-bottom: $spacing-xs;
    line-height: $line-height-relaxed;
  }

  :deep(blockquote) {
    padding: $spacing-md $spacing-lg;
    background: rgba(59, 130, 246, 0.05);
    border-left: 6rpx solid $color-info;
    border-radius: 0 $radius-md $radius-md 0;
    margin: $spacing-md 0;
    
    p {
      margin: 0;
      color: $text-secondary;
      font-style: italic;
    }
  }

  :deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin: $spacing-md 0;
    
    th,
    td {
      border: 1rpx solid $border-color;
      padding: $spacing-sm;
      text-align: left;
    }
    
    th {
      background: $bg-elevated;
      font-weight: $font-weight-semibold;
    }
  }
}

.article-actions {
  display: flex;
  justify-content: space-around;
  padding: $spacing-lg 0;
  border-top: 1rpx solid $border-color;
  border-bottom: 1rpx solid $border-color;
  margin-bottom: $spacing-xl;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-xs;
  transition: transform 0.2s;

  &:active {
    transform: scale(0.9);
  }

  &__icon {
    width: 48rpx;
    height: 48rpx;
  }

  &__text {
    font-size: $font-size-xs;
    color: $text-secondary;
  }
}

.related-section {
  margin-bottom: $spacing-xl;

  &__title {
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    color: $text-primary;
    display: block;
    margin-bottom: $spacing-md;
  }
}

.related-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.related-item {
  display: flex;
  background: $bg-card;
  border-radius: $radius-lg;
  padding: $spacing-md;
  box-shadow: $shadow-sm;
  transition: all 0.2s;

  &:active {
    transform: scale(0.98);
    box-shadow: $shadow-md;
  }

  &__content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  &__title {
    font-size: $font-size-base;
    font-weight: $font-weight-medium;
    color: $text-primary;
    line-height: $line-height-normal;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin-bottom: $spacing-sm;
  }

  &__meta {
    display: flex;
    align-items: center;
    font-size: $font-size-xs;
    color: $text-muted;
  }

  &__source {
    color: $text-muted;
  }

  &__dot {
    margin: 0 8rpx;
  }

  &__view {
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

.bottom-placeholder {
  height: 80rpx;
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 200rpx $spacing-lg;

  &__icon {
    width: 200rpx;
    height: 200rpx;
    background: $bg-elevated;
    border-radius: 50%;
    margin-bottom: $spacing-lg;
    position: relative;

    &::before {
      content: '!';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 120rpx;
      color: $color-error;
      font-weight: bold;
    }
  }

  &__text {
    font-size: $font-size-lg;
    color: $text-muted;
    margin-bottom: $spacing-lg;
  }

  &__btn {
    padding: $spacing-sm $spacing-xl;
    background: $color-primary;
    color: #fff;
    border-radius: $radius-full;
    font-size: $font-size-base;
    transition: all 0.2s;

    &:active {
      transform: scale(0.95);
      opacity: 0.8;
    }
  }
}

.image-preview {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease;

  &__img {
    width: 100%;
    height: 100%;
  }

  &__close {
    position: absolute;
    top: 80rpx;
    right: $spacing-lg;
    width: 80rpx;
    height: 80rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.close-icon {
  width: 48rpx;
  height: 48rpx;
  position: relative;

  &::before,
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 48rpx;
    height: 4rpx;
    background: #fff;
  }

  &::before {
    transform: translate(-50%, -50%) rotate(45deg);
  }

  &::after {
    transform: translate(-50%, -50%) rotate(-45deg);
  }
}

// 深色模式适配
.page--dark {
  .navbar {
    background: rgba(22, 27, 34, 0.95);
  }

  .navbar__title {
    color: $dark-text-primary;
  }

  .progress-bar__fill {
    background: $dark-color-primary;
  }

  .skeleton-title,
  .skeleton-meta,
  .skeleton-image,
  .skeleton-text {
    background: linear-gradient(90deg, #21262d 25%, #30363d 50%, #21262d 75%);
    background-size: 200% 100%;
  }

  .article-header__title {
    color: $dark-text-primary;
  }

  .meta-item {
    color: $dark-text-secondary;

    &__label {
      color: $dark-text-secondary;
    }

    &__value,
    &__time,
    &__stat,
    &__dot {
      color: $dark-text-muted;
    }
  }

  .article-body {
    color: $dark-text-primary;

    :deep(h2),
    :deep(h3),
    :deep(h4) {
      color: $dark-text-primary;
    }

    :deep(blockquote) {
      background: rgba(59, 130, 246, 0.1);
      
      p {
        color: $dark-text-secondary;
      }
    }

    :deep(table) {
      th,
      td {
        border-color: $dark-border-color;
      }

      th {
        background: $dark-bg-elevated;
      }
    }
  }

  .article-actions {
    border-color: $dark-border-color;
  }

  .action-btn__text {
    color: $dark-text-secondary;
  }

  .related-section__title {
    color: $dark-text-primary;
  }

  .related-item {
    background: $dark-bg-card;

    &__title {
      color: $dark-text-primary;
    }

    &__source,
    &__dot,
    &__view {
      color: $dark-text-muted;
    }
  }

  .error-state__icon {
    background: $dark-bg-elevated;
  }

  .error-state__text {
    color: $dark-text-muted;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
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
