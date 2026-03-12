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
            :style="{ filter: isFavorite ? 'invert(67%) sepia(54%) saturate(2293%) hue-rotate(360deg) brightness(101%) contrast(96%)' : darkIconFilter }"
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
      <view v-if="loading" class="skeleton-detail" :style="{ paddingTop: articlePaddingTop }">
        <view class="skeleton-title"></view>
        <view class="skeleton-meta"></view>
        <view class="skeleton-image"></view>
        <view class="skeleton-text"></view>
        <view class="skeleton-text"></view>
        <view class="skeleton-text skeleton-text--short"></view>
      </view>

      <view v-else-if="article" class="article" :style="{ paddingTop: articlePaddingTop }">
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
              :style="{ filter: isLiked ? 'invert(37%) sepia(93%) saturate(1719%) hue-rotate(335deg) brightness(101%) contrast(101%)' : darkIconFilter }"
            />
            <text class="action-btn__text" :style="{ color: isLiked ? '#FF6B5B' : '' }">{{ formatCount(article.likeCount) }}</text>
          </view>
          <view class="action-btn" @click="toggleFavorite">
            <image 
              class="action-btn__icon" 
              src="/static/shoucang.svg"
              mode="aspectFit"
              :style="{ filter: isFavorite ? 'invert(67%) sepia(54%) saturate(2293%) hue-rotate(360deg) brightness(101%) contrast(96%)' : darkIconFilter }"
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

        <!-- 评论预览区 -->
        <view class="comments-preview" v-if="!loading && article">
          <view class="comments-preview__header" @click="goToComments">
            <view class="comments-preview__title-wrap">
              <text class="comments-preview__title">评论</text>
              <text v-if="commentTotal > 0" class="comments-preview__count">{{ commentTotal }}</text>
            </view>
            <view class="comments-preview__more">
              <text class="comments-preview__more-text">全部 ›</text>
            </view>
          </view>

          <!-- 骨架（加载中） -->
          <view v-if="commentLoading" class="comments-preview__loading">
            <view class="comment-skeleton" v-for="i in 2" :key="i">
              <view class="comment-skeleton__avatar"></view>
              <view class="comment-skeleton__body">
                <view class="comment-skeleton__name"></view>
                <view class="comment-skeleton__text"></view>
              </view>
            </view>
          </view>

          <!-- 评论列表 -->
          <view v-else-if="commentPreview.length > 0" class="comments-preview__list">
            <view
              v-for="(comment, index) in commentPreview"
              :key="comment.id"
              class="comment-item"
              :class="{ 'comment-item--last': index === commentPreview.length - 1 }"
              @click="goToComments"
            >
              <image v-if="comment.avatar" class="comment-item__avatar" :src="comment.avatar" mode="aspectFill" />
              <view v-else class="comment-item__avatar comment-item__avatar--placeholder">
                <text class="comment-item__avatar-text">{{ comment.nickname.charAt(0) }}</text>
              </view>
              <view class="comment-item__body">
                <view class="comment-item__header">
                  <text class="comment-item__nickname">{{ comment.nickname }}</text>
                  <view class="comment-item__like">
                    <text class="comment-item__like-icon">♡</text>
                    <text class="comment-item__like-count">{{ comment.likeCount }}</text>
                  </view>
                </view>
                <text class="comment-item__content">{{ comment.content }}</text>
                <text class="comment-item__time">{{ formatCommentTime(comment.createTime) }}</text>
              </view>
            </view>
          </view>

          <!-- 空状态 -->
          <view v-else class="comments-preview__empty">
            <text class="comments-preview__empty-text">暂无评论，来说点什么吧～</text>
          </view>

          <!-- 查看全部按钮 -->
          <view class="comments-preview__view-all" @click="goToComments">
            <text class="comments-preview__view-all-text">
              查看全部{{ commentTotal > 0 ? ' ' + commentTotal + ' 条' : '' }}评论 ›
            </text>
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

    <!-- 底部评论栏 -->
    <view class="comment-bar" v-if="!loading && article" @click="goToComments">
      <image
        v-if="isLogin && currentUser && currentUser.avatar"
        class="comment-bar__avatar"
        :src="currentUser.avatar"
        mode="aspectFill"
      />
      <view v-else class="comment-bar__avatar comment-bar__avatar--placeholder">
        <text class="comment-bar__avatar-text">
          {{ isLogin && currentUser && currentUser.name ? currentUser.name.charAt(0) : '?' }}
        </text>
      </view>
      <view class="comment-bar__input-wrap">
        <text class="comment-bar__placeholder">说点什么，聊聊你的想法...</text>
      </view>
      <view class="comment-bar__badge">
        <text class="comment-bar__badge-icon">💬</text>
        <text v-if="commentTotal > 0" class="comment-bar__badge-count">{{ commentTotal }}</text>
      </view>
    </view>

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
    <TopNotificationBar />
  </view>
</template>

<script>
import { getNewsDetail, getRelatedNews, toggleLike, getComments } from '@/utils/api/news.js'
import { isFavorite, toggleFavorite as toggleFavoriteStore, addHistory } from '@/store/news.js'
import { isDarkMode } from '@/store/theme.js'
import { isLoggedIn, getUserInfo } from '@/store/user.js'

import TopNotificationBar from '@/components/TopNotificationBar.vue'

export default {
	components: { TopNotificationBar },
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
      previewImageUrl: '',
      commentPreview: [],
      commentTotal: 0,
      commentLoading: false
    }
  },
  computed: {
    isDark() {
      return isDarkMode()
    },
    articlePaddingTop() {
      return (this.statusBarHeight + 44 + 20) + 'px'
    },
    darkIconFilter() {
      return this.isDark ? 'brightness(0) invert(0.7)' : 'none'
    },
    isLogin() {
      return isLoggedIn()
    },
    currentUser() {
      return getUserInfo()
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
      this.loadCommentPreview()
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

    async loadCommentPreview() {
      if (!this.newsId) return
      this.commentLoading = true
      try {
        const res = await getComments(this.newsId, { page: 1, pageSize: 2 })
        if (res.code === 200) {
          this.commentPreview = res.data.list
          this.commentTotal = res.data.total
        }
      } catch (e) {
        // 静默处理，不影响主内容加载
      } finally {
        this.commentLoading = false
      }
    },

    goToComments() {
      uni.navigateTo({
        url: `/pages/news/news-comment?newsId=${this.newsId}&total=${this.commentTotal}`
      })
    },

    formatCommentTime(timeStr) {
      if (!timeStr) return ''
      const time = new Date(timeStr.replace(/-/g, '/'))
      const diff = Date.now() - time.getTime()
      const m = 60000, h = 3600000, d = 86400000
      if (diff < m) return '刚刚'
      if (diff < h) return Math.floor(diff / m) + '分钟前'
      if (diff < d) return Math.floor(diff / h) + '小时前'
      if (diff < 2 * d) return '昨天'
      if (diff < 7 * d) return Math.floor(diff / d) + '天前'
      return `${time.getMonth() + 1}月${time.getDate()}日`
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
  padding: 0 $spacing-lg $spacing-lg;

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
  padding: 0 $spacing-lg $spacing-lg;
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
  height: 200rpx;
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
  .status-bar {
    background: rgba(22, 27, 34, 0.95);
  }

  .navbar {
    background: rgba(22, 27, 34, 0.95);
  }

  .navbar__title {
    color: $dark-text-primary;
  }

  .navbar__back-icon {
    border-left-color: $dark-text-primary;
    border-bottom-color: $dark-text-primary;
  }

  .navbar__share-icon {
    filter: brightness(0) invert(0.7);
  }

  .action-btn__icon {
    filter: brightness(0) invert(0.7);
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

  // 评论预览深色
  .comments-preview {
    background: $dark-bg-card;

    &__header {
      border-bottom-color: $dark-border-color;

      &:active {
        background: $dark-bg-elevated;
      }
    }

    &__title {
      color: $dark-text-primary;
    }

    &__count,
    &__more-text {
      color: $dark-text-muted;
    }

    &__empty-text {
      color: $dark-text-muted;
    }

    &__view-all-text {
      color: $dark-color-primary;
      border-color: $dark-color-primary;
    }
  }

  .comment-skeleton {
    &__avatar,
    &__name,
    &__text {
      background: linear-gradient(90deg, #21262d 25%, #30363d 50%, #21262d 75%);
      background-size: 200% 100%;
    }
  }

  .comment-item {
    border-bottom-color: $dark-border-color;

    &:active {
      background: $dark-bg-elevated;
    }

    &__nickname {
      color: $dark-text-primary;
    }

    &__content {
      color: $dark-text-secondary;
    }

    &__like-icon,
    &__like-count,
    &__time {
      color: $dark-text-muted;
    }

    &__avatar--placeholder {
      background: $dark-bg-elevated;
    }

    &__avatar-text {
      color: $dark-text-secondary;
    }
  }

  // 底部评论栏深色
  .comment-bar {
    background: $dark-bg-card;
    border-top-color: $dark-border-color;
    box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.3);

    &:active {
      background: $dark-bg-elevated;
    }

    &__input-wrap {
      background: $dark-bg-elevated;
    }

    &__placeholder {
      color: $dark-text-muted;
    }

    &__badge-count {
      color: $dark-text-secondary;
    }

    &__avatar--placeholder {
      background: $dark-bg-elevated;
    }

    &__avatar-text {
      color: $dark-text-secondary;
    }
  }
}

// ==================== 评论预览区 ====================
.comments-preview {
  margin-bottom: $spacing-xl;
  background: $bg-card;
  border-radius: $radius-xl;
  box-shadow: $shadow-sm;
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $spacing-md $spacing-lg;
    border-bottom: 1rpx solid $border-color;
    transition: background 0.15s;

    &:active {
      background: $bg-elevated;
    }
  }

  &__title-wrap {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
  }

  &__title {
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    color: $text-primary;
  }

  &__count {
    font-size: $font-size-sm;
    color: $text-muted;
    margin-left: 4rpx;
  }

  &__more-text {
    font-size: $font-size-sm;
    color: $text-muted;
  }

  &__loading {
    padding: $spacing-md $spacing-lg;
  }

  &__empty {
    padding: $spacing-2xl $spacing-lg;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__empty-text {
    font-size: $font-size-base;
    color: $text-muted;
  }

  &__view-all {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: $spacing-md $spacing-lg $spacing-lg;

    &:active {
      opacity: 0.7;
    }
  }

  &__view-all-text {
    font-size: $font-size-base;
    color: $color-primary;
    font-weight: $font-weight-medium;
    border: 2rpx solid $color-primary;
    border-radius: $radius-full;
    padding: $spacing-xs $spacing-xl;
    letter-spacing: 1rpx;
  }
}

// 评论骨架屏
.comment-skeleton {
  display: flex;
  gap: $spacing-md;
  margin-bottom: $spacing-md;

  &__avatar {
    width: 64rpx;
    height: 64rpx;
    border-radius: $radius-full;
    flex-shrink: 0;
    background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }

  &__body {
    flex: 1;
  }

  &__name {
    width: 120rpx;
    height: 28rpx;
    border-radius: 8rpx;
    margin-bottom: $spacing-xs;
    background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }

  &__text {
    width: 100%;
    height: 40rpx;
    border-radius: 8rpx;
    background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }
}

// 单条评论
.comment-item {
  display: flex;
  align-items: flex-start;
  gap: $spacing-md;
  padding: $spacing-md $spacing-lg;
  border-bottom: 1rpx solid $border-color;
  transition: background 0.15s;

  &--last {
    border-bottom: none;
  }

  &:active {
    background: $bg-elevated;
  }

  &__avatar {
    width: 64rpx;
    height: 64rpx;
    border-radius: $radius-full;
    flex-shrink: 0;
    box-shadow: $shadow-sm;

    &--placeholder {
      background: $bg-elevated;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  &__avatar-text {
    font-size: $font-size-sm;
    color: $text-secondary;
    font-weight: $font-weight-semibold;
  }

  &__body {
    flex: 1;
    min-width: 0;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: $spacing-xs;
  }

  &__nickname {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $text-primary;
  }

  &__like {
    display: flex;
    align-items: center;
    gap: 4rpx;
  }

  &__like-icon {
    font-size: $font-size-base;
    color: $text-muted;
  }

  &__like-count {
    font-size: $font-size-xs;
    color: $text-muted;
  }

  &__content {
    font-size: $font-size-base;
    color: $text-secondary;
    line-height: $line-height-normal;
    word-break: break-all;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin-bottom: $spacing-xs;
  }

  &__time {
    font-size: $font-size-xs;
    color: $text-muted;
  }
}

// ==================== 底部评论栏 ====================
.comment-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-sm $spacing-lg;
  padding-bottom: calc(#{$spacing-sm} + env(safe-area-inset-bottom));
  background: $bg-card;
  border-top: 1rpx solid $border-color;
  box-shadow: 0 -2rpx 12rpx rgba(30, 58, 95, 0.06);
  transition: background 0.15s;

  &:active {
    background: $bg-elevated;
  }

  &__avatar {
    width: 64rpx;
    height: 64rpx;
    border-radius: $radius-full;
    flex-shrink: 0;

    &--placeholder {
      background: $bg-elevated;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  &__avatar-text {
    font-size: $font-size-sm;
    color: $text-secondary;
    font-weight: $font-weight-semibold;
  }

  &__input-wrap {
    flex: 1;
    height: 72rpx;
    background: $bg-elevated;
    border-radius: $radius-full;
    padding: 0 $spacing-md;
    display: flex;
    align-items: center;
  }

  &__placeholder {
    font-size: $font-size-sm;
    color: $text-muted;
  }

  &__badge {
    display: flex;
    align-items: center;
    gap: 6rpx;
    flex-shrink: 0;
  }

  &__badge-icon {
    font-size: $font-size-lg;
  }

  &__badge-count {
    font-size: $font-size-sm;
    color: $text-secondary;
    font-weight: $font-weight-medium;
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
