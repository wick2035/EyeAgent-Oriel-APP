<template>
	<view class="eye-section" :class="{ 'eye-section--dark': isDark }">
		<view class="eye-section__card">
			<!-- 仪表盘区域 (始终可见) -->
			<view class="eye-section__gauges">
				<MyopiaGauge :degree="examData.od.sph" eye="OD" />
				<view class="eye-section__gauge-divider"></view>
				<MyopiaGauge :degree="examData.os.sph" eye="OS" />
			</view>

			<!-- 趋势图 (始终可见) -->
			<view class="eye-section__trend">
				<MyopiaTrendChart :trendData="trendData" />
			</view>

			<!-- 展开/收起按钮 -->
			<view class="eye-section__toggle" @click="toggleExpand">
				<view class="eye-section__toggle-line"></view>
				<view class="eye-section__toggle-btn">
					<text class="eye-section__toggle-text">{{ expanded ? '收起' : '查看详情' }}</text>
					<view class="eye-section__toggle-arrow" :class="{ 'eye-section__toggle-arrow--up': expanded }"></view>
				</view>
				<view class="eye-section__toggle-line"></view>
			</view>

			<!-- 可折叠详细数据区 -->
			<view class="eye-section__detail" :class="{ 'eye-section__detail--expanded': expanded }">
				<view class="eye-section__detail-inner">
					<EyeDataGrid :examData="examData" />
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { isDarkMode } from '@/store/theme.js'
import { getMockEyeExamData, getMockTrendData } from '@/store/eyeHealth.js'
import MyopiaGauge from './MyopiaGauge.vue'
import MyopiaTrendChart from './MyopiaTrendChart.vue'
import EyeDataGrid from './EyeDataGrid.vue'

export default {
	name: 'EyeDataSection',
	components: {
		MyopiaGauge,
		MyopiaTrendChart,
		EyeDataGrid
	},
	data() {
		return {
			expanded: false,
			examData: getMockEyeExamData(),
			trendData: getMockTrendData()
		}
	},
	computed: {
		isDark() {
			return isDarkMode()
		}
	},
	methods: {
		toggleExpand() {
			this.expanded = !this.expanded
		}
	}
}
</script>

<style lang="scss" scoped>
.eye-section {
	&__card {
		background: #FFFFFF;
		border-radius: 24rpx;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
		overflow: hidden;
		padding: 24rpx 24rpx 0;
	}

	&__gauges {
		display: flex;
		align-items: flex-start;
	}

	&__gauge-divider {
		width: 1rpx;
		align-self: stretch;
		margin: 28rpx 0;
		background: rgba(0, 0, 0, 0.06);
		flex-shrink: 0;
	}

	&__trend {
		padding: 0 8rpx;
	}

	// 展开/收起按钮
	&__toggle {
		display: flex;
		align-items: center;
		padding: 20rpx 0;
		margin-top: 8rpx;
	}

	&__toggle-line {
		flex: 1;
		height: 1rpx;
		background: rgba(0, 0, 0, 0.06);
	}

	&__toggle-btn {
		display: flex;
		align-items: center;
		padding: 8rpx 24rpx;
	}

	&__toggle-text {
		font-size: 22rpx;
		color: #9AABBF;
		font-weight: 500;
	}

	&__toggle-arrow {
		width: 12rpx;
		height: 12rpx;
		border-right: 2rpx solid #9AABBF;
		border-bottom: 2rpx solid #9AABBF;
		transform: rotate(45deg);
		transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
		margin-top: -4rpx;
		margin-left: 8rpx;

		&--up {
			transform: rotate(-135deg);
			margin-top: 4rpx;
		}
	}

	// 可折叠区域
	&__detail {
		max-height: 0;
		opacity: 0;
		overflow: hidden;
		transition: max-height 0.45s cubic-bezier(0.16, 1, 0.3, 1),
		            opacity 0.35s ease;

		&--expanded {
			max-height: 1200rpx;
			opacity: 1;
			padding-bottom: 24rpx;
		}
	}

	&__detail-inner {
		padding: 8rpx 8rpx 0;
	}

	// 深色模式
	&--dark {
		.eye-section__card {
			background: rgba(255, 255, 255, 0.06);
			border: 1rpx solid rgba(255, 255, 255, 0.1);
			box-shadow: none;
			backdrop-filter: blur(20px);
			-webkit-backdrop-filter: blur(20px);
		}

		.eye-section__gauge-divider {
			background: rgba(255, 255, 255, 0.06);
		}

		.eye-section__toggle-line {
			background: rgba(255, 255, 255, 0.06);
		}

		.eye-section__toggle-text {
			color: #484F58;
		}

		.eye-section__toggle-arrow {
			border-color: #484F58;
		}
	}
}
</style>
