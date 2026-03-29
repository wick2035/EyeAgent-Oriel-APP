<template>
	<view class="patient-selector" :class="{ 'patient-selector--dark': isDark }">
		<!-- 标题行 -->
		<view class="patient-selector__header">
			<text class="patient-selector__title">当前就诊人</text>
			<text class="patient-selector__manage" @click="goToManage">管理</text>
		</view>

		<!-- 横向滚动就诊人列表 -->
		<scroll-view class="patient-selector__scroll" scroll-x enable-flex>
			<view class="patient-selector__list">
				<!-- 就诊人头像 -->
				<view
					v-for="(member, index) in members"
					:key="member.id"
					class="patient-item"
					:style="{ animationDelay: index * 0.06 + 's' }"
					@click="handleSelect(member)"
				>
					<view
						class="patient-item__avatar"
						:class="{ 'patient-item__avatar--active': member.id === currentId }"
						:style="{ background: getGradient(member.relation) }"
					>
						<text class="patient-item__initial">{{ getInitial(member.name) }}</text>
					</view>
					<view
						class="patient-item__dot"
						:class="{ 'patient-item__dot--visible': member.id === currentId }"
					></view>
					<text
						class="patient-item__name"
						:class="{ 'patient-item__name--active': member.id === currentId }"
					>{{ member.name }}</text>
					<text class="patient-item__relation">{{ getRelation(member) }}</text>
				</view>

				<!-- 添加按钮 -->
				<view class="patient-item patient-item--add" @click="goToAdd" v-if="members.length < maxMembers">
					<view class="patient-item__avatar patient-item__avatar--add">
						<text class="patient-item__add-icon">+</text>
					</view>
					<view class="patient-item__dot"></view>
					<text class="patient-item__name patient-item__name--muted">添加</text>
					<text class="patient-item__relation"> </text>
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script>
import { isDarkMode } from '@/store/theme.js'
import {
	familyState,
	switchPatient,
	getRelationLabel,
	getAvatarColor,
	getNameInitial,
	MAX_MEMBERS
} from '@/store/family.js'

export default {
	name: 'PatientSelector',
	computed: {
		isDark() {
			return isDarkMode()
		},
		members() {
			return familyState.members
		},
		currentId() {
			return familyState.currentId
		},
		maxMembers() {
			return MAX_MEMBERS
		}
	},
	methods: {
		handleSelect(member) {
			switchPatient(member.id)
		},
		getGradient(relation) {
			const color = getAvatarColor(relation)
			return `linear-gradient(135deg, ${color.from} 0%, ${color.to} 100%)`
		},
		getInitial(name) {
			return getNameInitial(name)
		},
		getRelation(member) {
			if (member.isDefault || member.relation === 'self') return '本人'
			return getRelationLabel(member.relation)
		},
		goToManage() {
			uni.navigateTo({ url: '/pages/family/family-manage' })
		},
		goToAdd() {
			uni.navigateTo({ url: '/pages/family/family-add' })
		}
	}
}
</script>

<style lang="scss" scoped>
.patient-selector {
	position: relative;
	z-index: 1;
	margin: 0 $spacing-lg $spacing-lg;

	&__header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: $spacing-sm;
		padding: 0 $spacing-sm;
	}

	&__title {
		font-size: $font-size-sm;
		color: $text-muted;
	}

	&__manage {
		font-size: $font-size-sm;
		color: $color-primary;
		opacity: 0.8;

		&:active {
			opacity: 0.5;
		}
	}

	&__scroll {
		width: 100%;
		white-space: nowrap;
	}

	&__list {
		display: inline-flex;
		gap: $spacing-lg;
		padding: $spacing-xs $spacing-sm;
	}
}

.patient-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	animation: itemFadeIn 0.4s ease-out backwards;

	&:active {
		.patient-item__avatar {
			transform: scale(0.95);
		}
	}

	&__avatar {
		width: 96rpx;
		height: 96rpx;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 4rpx solid transparent;
		transition: border-color 250ms ease, transform 150ms ease;
		box-sizing: border-box;

		&--active {
			border-color: $color-primary;
		}

		&--add {
			background: none !important;
			border: 3rpx dashed $border-color-light;
		}
	}

	&__initial {
		font-size: $font-size-lg;
		color: #fff;
		font-weight: $font-weight-bold;
	}

	&__add-icon {
		font-size: $font-size-2xl;
		color: $text-muted;
		font-weight: $font-weight-normal;
		line-height: 1;
	}

	&__dot {
		width: 8rpx;
		height: 8rpx;
		border-radius: 50%;
		background: $color-primary;
		margin-top: $spacing-xs;
		opacity: 0;
		transform: scale(0);
		transition: opacity 250ms ease, transform 250ms $ease-out-back;

		&--visible {
			opacity: 1;
			transform: scale(1);
		}
	}

	&__name {
		font-size: $font-size-xs;
		color: $text-primary;
		margin-top: 4rpx;
		max-width: 96rpx;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		text-align: center;
		transition: color 250ms ease;

		&--active {
			color: $color-primary;
			font-weight: $font-weight-medium;
		}

		&--muted {
			color: $text-muted;
		}
	}

	&__relation {
		font-size: 20rpx;
		color: $text-muted;
		margin-top: 2rpx;
	}
}

@keyframes itemFadeIn {
	from {
		opacity: 0;
		transform: translateY(12rpx);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

// 暗色模式
.patient-selector--dark {
	.patient-selector__title {
		color: $dark-text-muted;
	}

	.patient-selector__manage {
		color: $dark-color-primary;
	}

	.patient-item__avatar--active {
		border-color: $dark-color-primary;
	}

	.patient-item__avatar--add {
		border-color: $dark-border-color;
	}

	.patient-item__add-icon {
		color: $dark-text-muted;
	}

	.patient-item__dot--visible {
		background: $dark-color-primary;
	}

	.patient-item__name {
		color: $dark-text-primary;

		&--active {
			color: $dark-color-primary;
		}

		&--muted {
			color: $dark-text-muted;
		}
	}

	.patient-item__relation {
		color: $dark-text-muted;
	}
}
</style>
