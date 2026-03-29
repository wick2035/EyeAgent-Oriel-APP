<template>
	<view class="page" :class="{ 'page--dark': isDark }">
		<!-- 固定头部 -->
		<view class="fixed-header">
			<view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
			<view class="navbar">
				<view class="navbar__back" @click="goBack">
					<view class="back-icon"></view>
				</view>
				<text class="navbar__title">就诊人管理</text>
				<view class="navbar__placeholder"></view>
			</view>
		</view>

		<!-- 头部占位 -->
		<view class="header-placeholder" :style="{ height: (statusBarHeight + 44) + 'px' }"></view>

		<!-- 加载状态 -->
		<view v-if="loading && !initialized" class="loading-container">
			<view class="loading-spinner"></view>
			<text class="loading-text">加载中...</text>
		</view>

		<!-- 就诊人列表 -->
		<view v-else class="member-list">
			<view
				v-for="(member, index) in members"
				:key="member.id"
				class="member-card"
				:style="{ animationDelay: index * 0.06 + 's' }"
				@click="goToEdit(member)"
			>
				<view class="member-card__avatar" :style="{ background: getGradient(member.relation) }">
					<text class="member-card__initial">{{ getInitial(member.name) }}</text>
				</view>
				<view class="member-card__info">
					<view class="member-card__row">
						<text class="member-card__name">{{ member.name }}</text>
						<view v-if="member.isDefault" class="member-card__tag member-card__tag--self">
							<text class="member-card__tag-text">本人</text>
						</view>
						<view v-else class="member-card__tag">
							<text class="member-card__tag-text">{{ getRelation(member.relation) }}</text>
						</view>
					</view>
					<text class="member-card__sub" v-if="member.birthDate">{{ formatBirth(member.birthDate) }}</text>
				</view>
				<view class="member-card__arrow" v-if="!member.isDefault"></view>
			</view>
		</view>

		<!-- 底部添加按钮 -->
		<view class="bottom-area" v-if="members.length < maxMembers">
			<view class="add-btn" @click="goToAdd">
				<text class="add-btn__text">添加就诊人</text>
			</view>
		</view>
		<view v-else class="bottom-tip">
			<text class="bottom-tip__text">最多可添加{{ maxMembers }}位就诊人</text>
		</view>
	</view>
</template>

<script>
import { isDarkMode } from '@/store/theme.js'
import {
	familyState,
	fetchFamilyMembers,
	getRelationLabel,
	getAvatarColor,
	getNameInitial,
	MAX_MEMBERS
} from '@/store/family.js'

export default {
	data() {
		return {
			statusBarHeight: 44
		}
	},
	computed: {
		isDark() {
			return isDarkMode()
		},
		members() {
			return familyState.members
		},
		loading() {
			return familyState.loading
		},
		initialized() {
			return familyState.initialized
		},
		maxMembers() {
			return MAX_MEMBERS
		}
	},
	onLoad() {
		this.getStatusBarHeight()
	},
	onShow() {
		fetchFamilyMembers()
	},
	methods: {
		getStatusBarHeight() {
			const sysInfo = uni.getSystemInfoSync()
			this.statusBarHeight = sysInfo.statusBarHeight || 44
		},
		goBack() {
			uni.navigateBack()
		},
		getGradient(relation) {
			const color = getAvatarColor(relation)
			return `linear-gradient(135deg, ${color.from} 0%, ${color.to} 100%)`
		},
		getInitial(name) {
			return getNameInitial(name)
		},
		getRelation(relation) {
			return getRelationLabel(relation)
		},
		formatBirth(dateStr) {
			if (!dateStr) return ''
			const d = new Date(dateStr.replace(/-/g, '/'))
			return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
		},
		goToEdit(member) {
			if (member.isDefault) return
			uni.navigateTo({
				url: '/pages/family/family-add?id=' + member.id
			})
		},
		goToAdd() {
			uni.navigateTo({
				url: '/pages/family/family-add'
			})
		}
	}
}
</script>

<style lang="scss" scoped>
.page {
	min-height: 100vh;
	background: $bg-base;

	&--dark {
		background: $dark-bg-base;
	}
}

.fixed-header {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	z-index: 100;
	background: $bg-base;

	.page--dark & {
		background: $dark-bg-base;
	}
}

.status-bar {
	width: 100%;
}

.navbar {
	display: flex;
	align-items: center;
	height: 88rpx;
	padding: 0 $spacing-md;

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
		font-size: $font-size-lg;
		font-weight: $font-weight-semibold;
		color: $text-primary;

		.page--dark & {
			color: $dark-text-primary;
		}
	}

	&__placeholder {
		width: 72rpx;
	}
}

.back-icon {
	width: 20rpx;
	height: 20rpx;
	border-left: 4rpx solid $text-primary;
	border-bottom: 4rpx solid $text-primary;
	transform: rotate(45deg);

	.page--dark & {
		border-color: $dark-text-primary;
	}
}

.header-placeholder {
	width: 100%;
}

// 加载状态
.loading-container {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding-top: 200rpx;
}

.loading-spinner {
	width: 64rpx;
	height: 64rpx;
	border: 4rpx solid rgba(102, 126, 234, 0.2);
	border-top-color: #667EEA;
	border-radius: 50%;
	animation: spin 0.8s linear infinite;
}

.loading-text {
	margin-top: $spacing-md;
	font-size: $font-size-sm;
	color: $text-muted;
}

// 就诊人列表
.member-list {
	padding: $spacing-md $spacing-lg;
}

.member-card {
	display: flex;
	align-items: center;
	padding: $spacing-md $spacing-lg;
	background: $bg-card;
	border-radius: $radius-lg;
	box-shadow: $shadow-sm;
	margin-bottom: $spacing-md;
	animation: cardFadeIn 0.4s ease-out backwards;

	.page--dark & {
		background: $dark-bg-card;
	}

	&__avatar {
		width: 88rpx;
		height: 88rpx;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: $spacing-md;
		flex-shrink: 0;
	}

	&__initial {
		font-size: $font-size-xl;
		color: #fff;
		font-weight: $font-weight-bold;
	}

	&__info {
		flex: 1;
		overflow: hidden;
	}

	&__row {
		display: flex;
		align-items: center;
		margin-bottom: 4rpx;
	}

	&__name {
		font-size: $font-size-lg;
		font-weight: $font-weight-semibold;
		color: $text-primary;
		margin-right: $spacing-sm;

		.page--dark & {
			color: $dark-text-primary;
		}
	}

	&__tag {
		padding: 2rpx 12rpx;
		background: rgba(102, 126, 234, 0.1);
		border-radius: $radius-sm;

		&--self {
			background: rgba(30, 58, 95, 0.1);
		}
	}

	&__tag-text {
		font-size: 20rpx;
		color: $color-primary;
	}

	&__sub {
		font-size: $font-size-xs;
		color: $text-muted;

		.page--dark & {
			color: $dark-text-muted;
		}
	}

	&__arrow {
		width: 16rpx;
		height: 16rpx;
		border-top: 3rpx solid $text-muted;
		border-right: 3rpx solid $text-muted;
		transform: rotate(45deg);
		margin-left: $spacing-sm;
		flex-shrink: 0;

		.page--dark & {
			border-color: $dark-text-muted;
		}
	}
}

@keyframes cardFadeIn {
	from {
		opacity: 0;
		transform: translateY(16rpx);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

// 底部添加按钮
.bottom-area {
	padding: $spacing-xl $spacing-lg;
	padding-bottom: calc(#{$spacing-xl} + env(safe-area-inset-bottom));
}

.add-btn {
	height: 96rpx;
	background: $color-primary;
	border-radius: $radius-xl;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 8rpx 24rpx rgba(30, 58, 95, 0.25);
	transition: transform 150ms ease;

	&:active {
		transform: scale(0.97);
	}

	&__text {
		font-size: $font-size-lg;
		font-weight: $font-weight-semibold;
		color: #fff;
	}
}

.bottom-tip {
	padding: $spacing-xl;
	text-align: center;

	&__text {
		font-size: $font-size-sm;
		color: $text-muted;

		.page--dark & {
			color: $dark-text-muted;
		}
	}
}

@keyframes spin {
	to {
		transform: rotate(360deg);
	}
}
</style>
