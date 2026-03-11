<template>
  <view class="page" :class="{ 'page--dark': isDark }">
    <!-- 状态栏 -->
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>

    <!-- 导航栏 -->
    <view class="navbar">
      <view class="navbar__back" @click="goBack">
        <view class="navbar__back-icon"></view>
      </view>
      <text class="navbar__title">
        评论<text v-if="total > 0" class="navbar__count"> {{ total }}条</text>
      </text>
      <view class="navbar__right"></view>
    </view>

    <!-- 评论列表 -->
    <scroll-view
      class="comment-scroll"
      scroll-y
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
      @scrolltolower="onScrollToLower"
      :lower-threshold="100"
    >
      <!-- 骨架屏（首次加载） -->
      <view v-if="loading && page === 1" class="skeleton-list">
        <view class="card-skeleton" v-for="i in 5" :key="i">
          <view class="card-skeleton__avatar"></view>
          <view class="card-skeleton__body">
            <view class="card-skeleton__name"></view>
            <view class="card-skeleton__line"></view>
            <view class="card-skeleton__line card-skeleton__line--short"></view>
          </view>
        </view>
      </view>

      <!-- 评论列表 -->
      <view v-else-if="comments.length > 0" class="comment-list">
        <view v-for="comment in comments" :key="comment.id" class="comment-card">
          <!-- 主评论 -->
          <view class="comment-card__main">
            <image
              v-if="comment.avatar"
              class="comment-card__avatar"
              :src="comment.avatar"
              mode="aspectFill"
            />
            <view v-else class="comment-card__avatar comment-card__avatar--placeholder">
              <text class="comment-card__avatar-text">{{ comment.nickname.charAt(0) }}</text>
            </view>
            <view class="comment-card__body">
              <view class="comment-card__meta">
                <text class="comment-card__nickname">{{ comment.nickname }}</text>
                <text class="comment-card__time">{{ formatCommentTime(comment.createTime) }}</text>
              </view>
              <text class="comment-card__content">{{ comment.content }}</text>
              <view class="comment-card__actions">
                <view class="comment-card__reply-btn" @click="handleReply(comment)">
                  <text class="comment-card__reply-icon">💬</text>
                  <text class="comment-card__reply-text">
                    {{ comment.replyCount > 0 ? comment.replyCount : '回复' }}
                  </text>
                </view>
                <view
                  class="comment-card__like-btn"
                  :class="{ 'comment-card__like-btn--liked': comment.isLiked }"
                  @click="handleLikeComment(comment)"
                >
                  <text class="comment-card__like-icon">{{ comment.isLiked ? '❤️' : '♡' }}</text>
                  <text class="comment-card__like-count">{{ comment.likeCount || '' }}</text>
                </view>
              </view>
            </view>
          </view>

          <!-- 回复区域 -->
          <view
            v-if="comment.replies && comment.replies.length > 0"
            class="replies-block"
          >
            <view
              v-for="reply in (comment.repliesExpanded ? comment.replies : comment.replies.slice(0, 2))"
              :key="reply.id"
              class="reply-item"
            >
              <view class="reply-item__content-row">
                <text class="reply-item__name">{{ reply.nickname }}</text>
                <template v-if="reply.replyToNickname">
                  <text class="reply-item__to"> 回复 </text>
                  <text class="reply-item__to-name">@{{ reply.replyToNickname }}</text>
                </template>
                <text class="reply-item__colon">：</text>
                <text class="reply-item__content">{{ reply.content }}</text>
              </view>
              <view class="reply-item__meta">
                <text class="reply-item__time">{{ formatCommentTime(reply.createTime) }}</text>
                <view
                  class="reply-item__like"
                  :class="{ 'reply-item__like--liked': reply.isLiked }"
                  @click="handleLikeReply(reply)"
                >
                  <text class="reply-item__like-icon">{{ reply.isLiked ? '❤️' : '♡' }}</text>
                  <text class="reply-item__like-count">{{ reply.likeCount || '' }}</text>
                </view>
              </view>
            </view>

            <!-- 展开更多回复 -->
            <view
              v-if="!comment.repliesExpanded && comment.replyCount > 2"
              class="expand-replies"
              @click="expandReplies(comment)"
            >
              <text class="expand-replies__text">展开{{ comment.replyCount - 2 }}条回复 ›</text>
            </view>
          </view>
        </view>

        <!-- 加载状态 -->
        <view class="load-status">
          <view v-if="loading && page > 1" class="load-status__loading">
            <text class="load-status__text">加载中...</text>
          </view>
          <view v-else-if="!hasMore" class="load-status__end">
            <text class="load-status__text">— 已显示全部评论 —</text>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-else class="empty-state">
        <text class="empty-state__icon">💬</text>
        <text class="empty-state__title">还没有评论</text>
        <text class="empty-state__desc">来说点什么吧，说不定能帮助更多人～</text>
      </view>

      <!-- 底部安全区 -->
      <view class="scroll-bottom-placeholder"></view>
    </scroll-view>

    <!-- 底部输入栏 -->
    <view class="input-bar">
      <!-- 回复提示条 -->
      <view v-if="replyTarget" class="input-bar__reply-hint">
        <text class="input-bar__reply-hint-text">回复 @{{ replyTarget.nickname }}</text>
        <view class="input-bar__reply-close" @click="clearReplyTarget">
          <text class="input-bar__reply-close-icon">✕</text>
        </view>
      </view>

      <!-- 输入行 -->
      <view class="input-bar__row">
        <image
          v-if="isLogin && currentUser && currentUser.avatar"
          class="input-bar__avatar"
          :src="currentUser.avatar"
          mode="aspectFill"
        />
        <view v-else class="input-bar__avatar input-bar__avatar--placeholder">
          <text class="input-bar__avatar-text">
            {{ isLogin && currentUser && currentUser.name ? currentUser.name.charAt(0) : '?' }}
          </text>
        </view>
        <input
          class="input-bar__input"
          v-model="inputContent"
          :focus="inputFocus"
          :placeholder="inputPlaceholder"
          :placeholder-style="isDark ? 'color: #484F58' : 'color: #9AABBF'"
          :adjust-position="true"
          :maxlength="500"
          confirm-type="send"
          @confirm="sendComment"
          @focus="inputFocus = true"
          @blur="inputFocus = false"
        />
        <view
          class="input-bar__send"
          :class="{
            'input-bar__send--active': inputContent.trim().length > 0,
            'input-bar__send--loading': submitting
          }"
          @click="sendComment"
        >
          <text class="input-bar__send-text">发送</text>
        </view>
      </view>

      <!-- 安全区 -->
      <view class="input-bar__safe"></view>
    </view>
  </view>
</template>

<script>
import { getComments, postComment, likeComment, replyComment } from '@/utils/api/news.js'
import { isDarkMode } from '@/store/theme.js'
import { isLoggedIn, getUserInfo } from '@/store/user.js'

export default {
  data() {
    return {
      statusBarHeight: 44,
      newsId: null,
      totalFromParam: 0,
      comments: [],
      total: 0,
      page: 1,
      pageSize: 20,
      hasMore: true,
      loading: false,
      refreshing: false,
      inputContent: '',
      inputFocus: false,
      submitting: false,
      replyTarget: null
    }
  },

  computed: {
    isDark() {
      return isDarkMode()
    },
    isLogin() {
      return isLoggedIn()
    },
    currentUser() {
      return getUserInfo()
    },
    inputPlaceholder() {
      return this.replyTarget ? `回复 @${this.replyTarget.nickname}:` : '说点什么...'
    }
  },

  onLoad(options) {
    this.getStatusBarHeight()
    this.newsId = parseInt(options.newsId) || null
    this.totalFromParam = parseInt(options.total) || 0
    this.total = this.totalFromParam
    if (this.newsId) {
      this.loadComments()
    }
  },

  methods: {
    getStatusBarHeight() {
      const sysInfo = uni.getSystemInfoSync()
      this.statusBarHeight = sysInfo.statusBarHeight || 44
    },

    async loadComments(isRefresh = false) {
      if (this.loading) return
      if (isRefresh) {
        this.page = 1
        this.hasMore = true
        this.refreshing = true
      }
      this.loading = true
      try {
        const res = await getComments(this.newsId, {
          page: this.page,
          pageSize: this.pageSize
        })
        if (res.code === 200) {
          const { list, total, hasMore } = res.data
          this.total = total
          if (isRefresh || this.page === 1) {
            this.comments = list
          } else {
            this.comments = [...this.comments, ...list]
          }
          this.hasMore = hasMore
        }
      } catch (error) {
        console.error('加载评论失败:', error)
        uni.showToast({ title: '加载失败，请重试', icon: 'none' })
      } finally {
        this.loading = false
        this.refreshing = false
      }
    },

    onScrollToLower() {
      if (!this.hasMore || this.loading) return
      this.page++
      this.loadComments()
    },

    onRefresh() {
      this.loadComments(true)
    },

    handleReply(comment) {
      if (!this.checkLogin()) return
      this.replyTarget = { commentId: comment.id, nickname: comment.nickname }
      this.inputFocus = true
    },

    clearReplyTarget() {
      this.replyTarget = null
      this.inputFocus = false
      this.inputContent = ''
    },

    async handleLikeComment(comment) {
      if (!this.checkLogin()) return
      try {
        const res = await likeComment(comment.id)
        if (res.code === 200) {
          comment.isLiked = res.data.isLiked
          comment.likeCount = res.data.likeCount
        }
      } catch (error) {
        console.error('点赞失败:', error)
      }
    },

    async handleLikeReply(reply) {
      if (!this.checkLogin()) return
      try {
        const res = await likeComment(reply.id)
        if (res.code === 200) {
          reply.isLiked = res.data.isLiked
          reply.likeCount = res.data.likeCount
        }
      } catch (error) {
        console.error('点赞回复失败:', error)
      }
    },

    expandReplies(comment) {
      this.$set(comment, 'repliesExpanded', true)
    },

    async sendComment() {
      if (!this.checkLogin()) return
      const content = this.inputContent.trim()
      if (!content) {
        uni.showToast({ title: '请输入内容', icon: 'none' })
        return
      }
      if (this.submitting) return
      this.submitting = true
      try {
        if (this.replyTarget) {
          const res = await replyComment(this.replyTarget.commentId, {
            content,
            replyToNickname: this.replyTarget.nickname
          })
          if (res.code === 200) {
            const parent = this.comments.find(c => c.id === this.replyTarget.commentId)
            if (parent) {
              if (!parent.replies) this.$set(parent, 'replies', [])
              parent.replies.push(res.data)
              parent.replyCount++
              this.$set(parent, 'repliesExpanded', true)
            }
            uni.showToast({ title: '回复成功', icon: 'success' })
          }
        } else {
          const res = await postComment(this.newsId, { content })
          if (res.code === 200) {
            this.comments.unshift(res.data)
            this.total++
            uni.showToast({ title: '评论成功', icon: 'success' })
          }
        }
        this.inputContent = ''
        this.replyTarget = null
        this.inputFocus = false
      } catch (error) {
        console.error('发送失败:', error)
        uni.showToast({ title: '发送失败，请重试', icon: 'none' })
      } finally {
        this.submitting = false
      }
    },

    checkLogin() {
      if (!this.isLogin) {
        uni.showModal({
          title: '请先登录',
          content: '登录后才能发表评论和互动',
          confirmText: '去登录',
          success: (res) => {
            if (res.confirm) {
              uni.navigateTo({ url: '/pages/login/login' })
            }
          }
        })
        return false
      }
      return true
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

    goBack() {
      uni.navigateBack()
    }
  }
}
</script>

<style lang="scss" scoped>
.page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: $bg-base;
  overflow: hidden;

  &--dark {
    background: $dark-bg-base;
  }
}

// ==================== 状态栏 ====================
.status-bar {
  flex-shrink: 0;
  background: $bg-card;

  .page--dark & {
    background: $dark-bg-card;
  }
}

// ==================== 导航栏 ====================
.navbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 88rpx;
  padding: 0 $spacing-lg;
  background: $bg-card;
  border-bottom: 1rpx solid $border-color;

  .page--dark & {
    background: $dark-bg-card;
    border-bottom-color: $dark-border-color;
  }

  &__back {
    width: 72rpx;
    height: 72rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-full;
    transition: background 0.15s;

    &:active {
      background: rgba(30, 58, 95, 0.06);
    }
  }

  &__back-icon {
    width: 20rpx;
    height: 20rpx;
    border-left: 4rpx solid $text-primary;
    border-bottom: 4rpx solid $text-primary;
    transform: rotate(45deg);
    margin-left: 8rpx;

    .page--dark & {
      border-left-color: $dark-text-primary;
      border-bottom-color: $dark-text-primary;
    }
  }

  &__title {
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    color: $text-primary;

    .page--dark & {
      color: $dark-text-primary;
    }
  }

  &__count {
    font-size: $font-size-base;
    font-weight: $font-weight-normal;
    color: $text-muted;

    .page--dark & {
      color: $dark-text-muted;
    }
  }

  &__right {
    width: 72rpx;
  }
}

// ==================== 评论列表滚动区 ====================
.comment-scroll {
  flex: 1;
  overflow: hidden;
}

// 骨架屏
.skeleton-list {
  padding: $spacing-lg;
}

.card-skeleton {
  display: flex;
  gap: $spacing-md;
  margin-bottom: $spacing-xl;

  &__avatar {
    width: 72rpx;
    height: 72rpx;
    border-radius: $radius-full;
    background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    flex-shrink: 0;

    .page--dark & {
      background: linear-gradient(90deg, #21262d 25%, #30363d 50%, #21262d 75%);
      background-size: 200% 100%;
    }
  }

  &__body {
    flex: 1;
  }

  &__name {
    width: 140rpx;
    height: 28rpx;
    background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 8rpx;
    margin-bottom: $spacing-sm;

    .page--dark & {
      background: linear-gradient(90deg, #21262d 25%, #30363d 50%, #21262d 75%);
      background-size: 200% 100%;
    }
  }

  &__line {
    width: 100%;
    height: 28rpx;
    background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 8rpx;
    margin-bottom: $spacing-xs;

    &--short {
      width: 60%;
    }

    .page--dark & {
      background: linear-gradient(90deg, #21262d 25%, #30363d 50%, #21262d 75%);
      background-size: 200% 100%;
    }
  }
}

.comment-list {
  padding: 0 $spacing-lg;
}

// 评论卡片
.comment-card {
  padding: $spacing-lg 0;
  border-bottom: 1rpx solid $border-color;

  .page--dark & {
    border-bottom-color: $dark-border-color;
  }

  &__main {
    display: flex;
    gap: $spacing-md;
    align-items: flex-start;
  }

  &__avatar {
    width: 72rpx;
    height: 72rpx;
    border-radius: $radius-full;
    flex-shrink: 0;

    &--placeholder {
      background: $bg-elevated;
      display: flex;
      align-items: center;
      justify-content: center;

      .page--dark & {
        background: $dark-bg-elevated;
      }
    }
  }

  &__avatar-text {
    font-size: $font-size-base;
    color: $text-secondary;
    font-weight: $font-weight-semibold;

    .page--dark & {
      color: $dark-text-secondary;
    }
  }

  &__body {
    flex: 1;
    min-width: 0;
  }

  &__meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: $spacing-xs;
  }

  &__nickname {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $text-primary;

    .page--dark & {
      color: $dark-text-primary;
    }
  }

  &__time {
    font-size: $font-size-xs;
    color: $text-muted;

    .page--dark & {
      color: $dark-text-muted;
    }
  }

  &__content {
    font-size: $font-size-base;
    color: $text-secondary;
    line-height: $line-height-relaxed;
    word-break: break-all;
    display: block;
    margin-bottom: $spacing-sm;

    .page--dark & {
      color: $dark-text-secondary;
    }
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: $spacing-lg;
  }

  &__reply-btn,
  &__like-btn {
    display: flex;
    align-items: center;
    gap: 6rpx;
    padding: $spacing-xs $spacing-sm;
    border-radius: $radius-full;
    transition: all 0.15s;

    &:active {
      background: rgba(30, 58, 95, 0.06);
      transform: scale(0.95);

      .page--dark & {
        background: rgba(255, 255, 255, 0.06);
      }
    }
  }

  &__reply-icon {
    font-size: $font-size-base;
  }

  &__reply-text {
    font-size: $font-size-xs;
    color: $text-muted;

    .page--dark & {
      color: $dark-text-muted;
    }
  }

  &__like-btn--liked {
    .comment-card__like-icon {
      animation: likeScale 0.3s $ease-out-back;
    }
  }

  &__like-icon {
    font-size: $font-size-base;
  }

  &__like-count {
    font-size: $font-size-xs;
    color: $text-muted;

    .page--dark & {
      color: $dark-text-muted;
    }
  }
}

// ==================== 回复区域 ====================
.replies-block {
  margin-left: 88rpx;
  margin-top: $spacing-sm;
  background: $bg-elevated;
  border-radius: $radius-md;
  padding: $spacing-sm $spacing-md;
  border-left: 4rpx solid $color-primary;

  .page--dark & {
    background: $dark-bg-elevated;
    border-left-color: $dark-color-primary;
  }
}

.reply-item {
  padding: $spacing-xs 0;

  &__content-row {
    line-height: $line-height-relaxed;
  }

  &__name {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $color-primary;

    .page--dark & {
      color: $dark-color-primary;
    }
  }

  &__to {
    font-size: $font-size-sm;
    color: $text-muted;

    .page--dark & {
      color: $dark-text-muted;
    }
  }

  &__to-name {
    font-size: $font-size-sm;
    color: $color-primary;

    .page--dark & {
      color: $dark-color-primary;
    }
  }

  &__colon {
    font-size: $font-size-sm;
    color: $text-secondary;

    .page--dark & {
      color: $dark-text-secondary;
    }
  }

  &__content {
    font-size: $font-size-sm;
    color: $text-secondary;
    word-break: break-all;

    .page--dark & {
      color: $dark-text-secondary;
    }
  }

  &__meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 6rpx;
  }

  &__time {
    font-size: $font-size-xs;
    color: $text-muted;

    .page--dark & {
      color: $dark-text-muted;
    }
  }

  &__like {
    display: flex;
    align-items: center;
    gap: 4rpx;
    padding: 4rpx $spacing-xs;
    border-radius: $radius-full;
    transition: all 0.15s;

    &:active {
      transform: scale(0.9);
    }

    &--liked .reply-item__like-icon {
      animation: likeScale 0.3s $ease-out-back;
    }
  }

  &__like-icon {
    font-size: $font-size-sm;
  }

  &__like-count {
    font-size: $font-size-xs;
    color: $text-muted;

    .page--dark & {
      color: $dark-text-muted;
    }
  }
}

.expand-replies {
  padding: $spacing-xs 0;
  transition: opacity 0.15s;

  &:active {
    opacity: 0.7;
  }

  &__text {
    font-size: $font-size-sm;
    color: $color-primary;

    .page--dark & {
      color: $dark-color-primary;
    }
  }
}

// ==================== 加载状态 ====================
.load-status {
  padding: $spacing-xl $spacing-lg;
  display: flex;
  justify-content: center;

  &__text {
    font-size: $font-size-sm;
    color: $text-muted;

    .page--dark & {
      color: $dark-text-muted;
    }
  }
}

.scroll-bottom-placeholder {
  height: 200rpx;
}

// ==================== 空状态 ====================
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 200rpx $spacing-2xl;

  &__icon {
    font-size: 120rpx;
    margin-bottom: $spacing-lg;
    opacity: 0.4;
    display: block;
  }

  &__title {
    font-size: $font-size-xl;
    font-weight: $font-weight-semibold;
    color: $text-secondary;
    margin-bottom: $spacing-sm;
    display: block;

    .page--dark & {
      color: $dark-text-secondary;
    }
  }

  &__desc {
    font-size: $font-size-base;
    color: $text-muted;
    text-align: center;
    line-height: $line-height-relaxed;
    display: block;

    .page--dark & {
      color: $dark-text-muted;
    }
  }
}

// ==================== 底部输入栏 ====================
.input-bar {
  flex-shrink: 0;
  background: $bg-card;
  border-top: 1rpx solid $border-color;
  box-shadow: 0 -2rpx 16rpx rgba(30, 58, 95, 0.06);
  transition: background 0.3s;

  .page--dark & {
    background: $dark-bg-card;
    border-top-color: $dark-border-color;
    box-shadow: 0 -2rpx 16rpx rgba(0, 0, 0, 0.3);
  }

  &__reply-hint {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $spacing-xs $spacing-lg;
    background: rgba(30, 58, 95, 0.04);
    border-bottom: 1rpx solid $border-color;

    .page--dark & {
      background: rgba(74, 144, 217, 0.08);
      border-bottom-color: $dark-border-color;
    }
  }

  &__reply-hint-text {
    font-size: $font-size-sm;
    color: $color-primary;

    .page--dark & {
      color: $dark-color-primary;
    }
  }

  &__reply-close {
    width: 40rpx;
    height: 40rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__reply-close-icon {
    font-size: $font-size-sm;
    color: $text-muted;

    .page--dark & {
      color: $dark-text-muted;
    }
  }

  &__row {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-sm $spacing-lg;
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

      .page--dark & {
        background: $dark-bg-elevated;
      }
    }
  }

  &__avatar-text {
    font-size: $font-size-sm;
    color: $text-secondary;
    font-weight: $font-weight-semibold;

    .page--dark & {
      color: $dark-text-secondary;
    }
  }

  &__input {
    flex: 1;
    height: 72rpx;
    background: $bg-elevated;
    border-radius: $radius-full;
    padding: 0 $spacing-md;
    font-size: $font-size-base;
    color: $text-primary;
    line-height: 72rpx;
    border: none;
    outline: none;

    .page--dark & {
      background: $dark-bg-elevated;
      color: $dark-text-primary;
    }
  }

  &__send {
    flex-shrink: 0;
    height: 72rpx;
    min-width: 100rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-full;
    background: $bg-elevated;
    padding: 0 $spacing-md;
    transition: all 0.2s;
    opacity: 0.5;

    &--active {
      background: $color-primary;
      opacity: 1;

      .page--dark & {
        background: $dark-color-primary;
      }
    }

    &--loading {
      opacity: 0.7;
    }

    &:active {
      transform: scale(0.95);
    }

    .page--dark & {
      background: $dark-bg-elevated;
    }
  }

  &__send-text {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $text-muted;

    .input-bar__send--active & {
      color: #fff;
    }

    .page--dark & {
      color: $dark-text-muted;
    }

    .page--dark .input-bar__send--active & {
      color: #fff;
    }
  }

  &__safe {
    height: env(safe-area-inset-bottom);
  }
}

// ==================== 动画 ====================
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes likeScale {
  0% { transform: scale(1); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}
</style>
