<template>
	<view class="page">
		<view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
		<!-- Navbar -->
		<view class="navbar" :class="{ 'navbar--visible': pageReady }" :style="{ top: statusBarHeight + 'px' }">
			<view class="navbar__back" @click="goBack">
				<view class="back-icon"></view>
			</view>
			<view class="navbar__title-wrap">
				<text class="navbar__title">眼部健康详情{{ patientSuffix }}</text>
				<text v-if="ageGroupLabel" class="navbar__badge">{{ ageGroupLabel }}</text>
			</view>
			<view class="navbar__right"></view>
		</view>

		<scroll-view class="scroll" scroll-y :style="{ top: scrollTop }">

			<!-- ===== SECTION 0: 三张健康卡片 ===== -->
			<view class="cards-wrap" :class="{ 'cards-wrap--visible': pageReady }">
				<view class="cards-row">
					<view class="card-slot" v-for="(item, i) in healthCards" :key="item.id">
						<EyeHealthCard
							:title="item.title"
							:main-value="item.mainValue"
							:main-unit="item.mainUnit"
							:status="item.status"
							:delay="i * 0.08"
						/>
					</view>
				</view>
			</view>

			<!-- ===== SECTION 1: Sankey 评分解析 ===== -->
			<view class="section sankey-card" :class="{ 'section--visible': pageReady }" style="--i:1">
				<view class="card-header">
					<view class="card-header__bar"></view>
					<text class="card-header__title">评分解析</text>
				</view>

				<view class="sankey-col-headers">
					<text class="col-hdr col-hdr--left">检测指标</text>
					<text class="col-hdr col-hdr--mid">分析</text>
					<text class="col-hdr col-hdr--right">疑似眼病</text>
				</view>

				<view class="sankey-body" id="sankeyBody" :style="{ height: canvasHeight + 'px' }">

					<!-- 层 0: 行背景色带（左+中区域） -->
					<view class="row-bands">
						<view
							v-for="(node, i) in sankeyData.leftNodes"
							:key="'band' + i"
							class="row-band"
							:style="{ height: rowHeight + 'px', background: hexToRgba(node.color, 0.09) }"
						></view>
					</view>

					<!-- 层 1: Canvas 丝带 -->
					<view class="row-fade"></view>

					<canvas
						canvas-id="sankeyCanvas"
						id="sankeyCanvas"
						class="sankey-canvas"
						:style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }"
					></canvas>

					<!-- 层 4: 白色遮罩（揭开动画） -->
					<view
						class="sankey-cover"
						:style="{ width: coverWidth, transition: coverTransition }"
					></view>

					<!-- 层 2: 左列 -->
					<view class="col col--left">
						<view
							v-for="(node, i) in sankeyData.leftNodes"
							:key="'l' + i"
							class="left-node"
							:style="{ height: rowHeight + 'px' }"
						>
							<view class="left-bar" :style="{ background: node.color }"></view>
							<view class="left-content">
								<text class="left-label">{{ node.label }}</text>
								<text class="left-value" :style="{ color: node.color }">{{ node.value }}</text>
							</view>
						</view>
					</view>

					<!-- 层 2: 中列 -->
					<view class="col col--mid">
						<view
							v-for="(txt, i) in sankeyData.middleNodes"
							:key="'m' + i"
							class="mid-node"
							:style="{ height: rowHeight + 'px' }"
						>
							<view class="mid-dot" :style="{ background: sankeyData.leftNodes[i] ? sankeyData.leftNodes[i].color : '#ccc' }"></view>
							<text class="mid-text">{{ txt }}</text>
						</view>
					</view>

					<!-- 层 2: 右列（绝对定位，高度由 JS 计算） -->
					<view class="col col--right">
						<view
							v-for="(node, i) in sankeyData.rightNodes"
							:key="'r' + i"
							class="right-node"
							:style="{
								top: rightBlockYs[i] + 'px',
								height: rightBlockHs[i] + 'px',
								background: hexToRgba(node.color, 0.12)
							}"
						>
							<view class="right-content">
								<text class="right-label" :style="{ color: node.color }">{{ node.label }}</text>
								<text class="right-risk" :style="{ color: node.color }">{{ node.risk }}</text>
							</view>
							<view class="right-bar" :style="{ background: node.color }"></view>
						</view>
					</view>

				</view>

				<view class="sankey-legend">
					<view class="legend-bar"></view>
					<text class="legend-text">连线粗细代表关联强度</text>
				</view>
			</view>

			<!-- ===== SECTION 2: 健康建议 ===== -->
			<view class="section tips-card" :class="{ 'section--visible': pageReady }" style="--i:2">
				<view class="card-header">
					<view class="card-header__bar"></view>
					<text class="card-header__title">健康建议</text>
				</view>
				<view
					v-for="(tip, i) in sankeyData.tips"
					:key="'tip' + i"
					class="tip-item"
					:style="{ '--tip-i': i }"
				>
					<view class="tip-icon">
						<text class="tip-icon__emoji" :style="tip.iconSize ? { fontSize: tip.iconSize } : {}">{{ tip.icon }}</text>
					</view>
					<view class="tip-body">
						<text class="tip-title">{{ tip.title }}</text>
						<text class="tip-desc">{{ tip.desc }}</text>
					</view>
				</view>
			</view>

			<view class="bottom-safe"></view>
		</scroll-view>
    <TopNotificationBar />
	</view>
</template>

<script>
import { getSankeyDataByGroup, getHealthDataByGroup } from '@/store/eyeHealth.js'
import { getAgeGroupLabel } from '@/utils/age.js'
import EyeHealthCard from '@/components/eye-health/EyeHealthCard.vue'
import { getCurrentPatient, isCurrentSelf } from '@/store/family.js'

// Layout constants (rpx)
const ROW_HEIGHT_RPX  = 104
const LEFT_BAR_W_RPX  = 40   // solid colored bar on far left

import TopNotificationBar from '@/components/TopNotificationBar.vue'

export default {
	name: 'EyeHealthDetail',

	components: { TopNotificationBar, EyeHealthCard },

	data() {
		return {
			statusBarHeight: 44,
			pageReady: false,
			ageGroup: 'adult',
			healthCards: [],
			sankeyData: {
				leftNodes: [],
				middleNodes: [],
				rightNodes: [],
				connections: [],
				tips: []
			},
			canvasWidth: 0,
			canvasHeight: 0,
			rowHeight: 0,
			// right blocks positioning (computed in drawSankeyRibbons)
			rightBlockHs: [],
			rightBlockYs: [],
			// wipe animation
			coverWidth: '100%',
			coverTransition: 'none'
		}
	},

	computed: {
		ageGroupLabel() { return getAgeGroupLabel(this.ageGroup) },
		scrollTop() { return `calc(${this.statusBarHeight}px + 88rpx)` },
		patientSuffix() {
			if (isCurrentSelf()) return ''
			const patient = getCurrentPatient()
			return patient ? ' -- ' + patient.name : ''
		}
	},

	onLoad(options) {
		const sysInfo = uni.getSystemInfoSync()
		this.statusBarHeight = sysInfo.statusBarHeight || 44
		this.ageGroup = (options && options.ageGroup) || 'adult'
		this.sankeyData  = getSankeyDataByGroup(this.ageGroup)
		this.healthCards = getHealthDataByGroup(this.ageGroup)

		this._scale  = sysInfo.windowWidth / 750
		this.rowHeight = Math.round(ROW_HEIGHT_RPX * this._scale)

		// Pre-estimate canvas height so sankey-body isn't 0px tall initially
		this.canvasHeight = this.sankeyData.leftNodes.length * this.rowHeight
		this.canvasWidth  = Math.round(sysInfo.windowWidth - 2 * 24 * this._scale - 2 * 32 * this._scale)
	},

	onReady() {
		setTimeout(() => {
			this.initSankeyCanvas()
			this.pageReady = true
		}, 150)
	},

	methods: {
		goBack() { uni.navigateBack() },

		hexToRgba(hex, alpha) {
			if (!hex || hex.length < 7) return `rgba(0,0,0,${alpha})`
			const r = parseInt(hex.slice(1, 3), 16)
			const g = parseInt(hex.slice(3, 5), 16)
			const b = parseInt(hex.slice(5, 7), 16)
			return `rgba(${r},${g},${b},${alpha})`
		},

		initSankeyCanvas() {
			const query = uni.createSelectorQuery().in(this)
			query.select('#sankeyBody').boundingClientRect(rect => {
				const scale = this._scale
				const w = rect && rect.width > 0 ? Math.round(rect.width) : this.canvasWidth
				const h = this.sankeyData.leftNodes.length * this.rowHeight

				this.canvasWidth  = w
				this.canvasHeight = h

				this.$nextTick(() => {
					setTimeout(() => {
						this.drawSankeyRibbons(w, h)
						setTimeout(() => {
							this.coverTransition = 'width 1000ms cubic-bezier(0.4,0,0.2,1) 100ms'
							this.coverWidth = '0%'
						}, 60)
					}, 80)
				})
			}).exec()
		},

		drawSankeyRibbons(w, h) {
			if (!w || !h) return
			const scale = this._scale
			const data  = this.sankeyData
			const nLeft  = data.leftNodes.length
			const nRight = data.rightNodes.length
			const conns  = data.connections
			const rowH   = this.rowHeight
			const leftBarW = Math.round(LEFT_BAR_W_RPX * scale)

			// Pre-compute total outgoing / incoming weights
			const totalOut = Array(nLeft).fill(0)
			const totalIn  = Array(nRight).fill(0)
			conns.forEach(([li, ri, w]) => { totalOut[li] += w; totalIn[ri] += w })
			const allIn = totalIn.reduce((a, b) => a + b, 0)

			// Right block heights (proportional) + y positions
			const usableH = h * 0.80
			const rhArr   = totalIn.map(inc => (inc / allIn) * usableH)
			const totalRH = rhArr.reduce((a, b) => a + b, 0)
			const gap     = (h - totalRH) / (nRight + 1)
			const ryArr   = []
			let ry = gap
			for (let j = 0; j < nRight; j++) {
				ryArr.push(ry)
				ry += rhArr[j] + gap
			}
			// Store for HTML template binding
			this.rightBlockHs = rhArr
			this.rightBlockYs = ryArr

			// X boundaries
			const srcX = leftBarW
			const dstX = w * 0.705
			const midX = srcX + (dstX - srcX) * 0.5

			// Draw ribbons
			const ctx = uni.createCanvasContext('sankeyCanvas', this)
			ctx.clearRect(0, 0, w, h)

			// Offset trackers (how much of each node's slot is already used)
			const leftOffsets  = Array(nLeft).fill(0)
			const rightOffsets = Array(nRight).fill(0)

			// Sort: left index ASC, then right index ASC → deterministic, non-crossing within a source
			const sorted = [...conns].sort((a, b) => a[0] - b[0] || a[1] - b[1])

			sorted.forEach(([li, ri, wt]) => {
				// Source band: proportional slice of this row's usable height
				const srcUsable = rowH * 0.65
				const srcMargin = (rowH - srcUsable) / 2
				const rHsrc = (wt / totalOut[li]) * srcUsable
				const sY1   = li * rowH + srcMargin + leftOffsets[li]
				const sY2   = sY1 + rHsrc
				leftOffsets[li] += rHsrc

				// Dest band: proportional slice of this right block's usable height
				const dstUsable = rhArr[ri] * 0.72
				const dstMargin = (rhArr[ri] - dstUsable) / 2
				const rHdst = (wt / totalIn[ri]) * dstUsable
				const dY1   = ryArr[ri] + dstMargin + rightOffsets[ri]
				const dY2   = dY1 + rHdst
				rightOffsets[ri] += rHdst

				// Bezier ribbon path
				ctx.beginPath()
				ctx.moveTo(srcX, sY1)
				ctx.bezierCurveTo(midX, sY1, midX, dY1, dstX, dY1)
				ctx.lineTo(dstX, dY2)
				ctx.bezierCurveTo(midX, dY2, midX, sY2, srcX, sY2)
				ctx.closePath()

				const lc   = data.leftNodes[li].color
				const rc   = data.rightNodes[ri].color
				const grad = ctx.createLinearGradient(srcX, 0, dstX, 0)
				grad.addColorStop(0, this.hexToRgba(lc, 0.38))
				grad.addColorStop(1, this.hexToRgba(rc, 0.28))
				ctx.setFillStyle(grad)
				ctx.fill()
			})

			// Entry connectors: solid fill rectangles bridging canvas→right blocks (消除割裂感)
			for (let j = 0; j < nRight; j++) {
				const connH = rhArr[j] * 0.72
				const connY = ryArr[j] + (rhArr[j] - connH) / 2
				const rc = data.rightNodes[j].color
				ctx.setFillStyle(this.hexToRgba(rc, 0.30))
				ctx.fillRect(dstX - 4 * scale, connY, 6 * scale, connH)
			}

			ctx.draw()
		}
	}
}
</script>

<style lang="scss" scoped>
.page {
	min-height: 100vh;
	background: #F0F4FA;
}

.status-bar {
	position: fixed;
	top: 0; left: 0; right: 0;
	z-index: 101;
	background: rgba(250, 251, 253, 0.95);
	backdrop-filter: blur(24px);
	-webkit-backdrop-filter: blur(24px);
}

// ===== Navbar =====
.navbar {
	position: fixed;
	left: 0; right: 0;
	z-index: 100;
	display: flex;
	align-items: center;
	height: 88rpx;
	padding: 0 24rpx;
	background: rgba(250, 251, 253, 0.95);
	backdrop-filter: blur(24px);
	-webkit-backdrop-filter: blur(24px);
	border-bottom: 1rpx solid rgba(30, 58, 95, 0.06);
	opacity: 0;
	transform: translateY(-16rpx);
	transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);

	&--visible { opacity: 1; transform: translateY(0); }

	&__back {
		width: 72rpx; height: 72rpx;
		display: flex; align-items: center;
		&:active { opacity: 0.5; }
	}

	&__title-wrap {
		flex: 1;
		display: flex; align-items: center; justify-content: center;
		gap: 12rpx;
	}

	&__title {
		font-size: 34rpx; font-weight: 600;
		color: #1A2B3C; letter-spacing: 1rpx;
	}

	&__badge {
		padding: 4rpx 12rpx;
		background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.2) 100%);
		border-radius: 8rpx;
		font-size: 20rpx;
		color: #667eea;
		font-weight: 500;
	}

	&__right { width: 72rpx; }
}

.back-icon {
	width: 18rpx; height: 18rpx;
	border-left: 3rpx solid #1A2B3C;
	border-bottom: 3rpx solid #1A2B3C;
	transform: rotate(45deg) translateY(-2rpx);
	margin-left: 8rpx;
}

.scroll {
	position: fixed;
	left: 0; right: 0; bottom: 0;
}

// ===== Section 入场动画 =====
.section {
	margin: 0 24rpx 20rpx;
	background: #FFFFFF;
	border-radius: 28rpx;
	box-shadow: 0 2rpx 20rpx rgba(30, 58, 95, 0.06), 0 1rpx 4rpx rgba(30, 58, 95, 0.04);
	opacity: 0;
	transform: translateY(28rpx);
	transition:
		opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1) calc(var(--i, 0) * 80ms + 100ms),
		transform 0.5s cubic-bezier(0.16, 1, 0.3, 1) calc(var(--i, 0) * 80ms + 100ms);

	&--visible { opacity: 1; transform: translateY(0); }
}

// ===== Section 0: 卡片区（浮动卡片，无外壳） =====
.cards-wrap {
	margin: 20rpx 24rpx 20rpx;
	padding-bottom: 8rpx;
	opacity: 0;
	transform: translateY(24rpx);
	transition: opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1) 100ms, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1) 100ms;

	&--visible { opacity: 1; transform: translateY(0); }
}


.cards-row {
	display: flex;
	gap: 20rpx;
}

.card-slot {
	flex: 1;
	min-width: 0;
	display: flex;
}

// Force EyeHealthCard to fill its slot
.card-slot ::v-deep .eye-card {
	width: 100%;
	flex-shrink: 1;
}

// ===== Card header =====
.card-header {
	display: flex; align-items: center; gap: 14rpx;
	margin-bottom: 22rpx;
	padding: 0 32rpx;

	&__bar {
		width: 6rpx; height: 28rpx; border-radius: 3rpx;
		background: linear-gradient(180deg, #1E3A5F 0%, #26C6DA 100%);
		flex-shrink: 0;
	}

	&__title { font-size: 30rpx; font-weight: 600; color: #1A2B3C; letter-spacing: 1rpx; }
}

// ===== Section 1: Sankey =====
.sankey-card {
	padding: 28rpx 0 24rpx;
}

.sankey-col-headers {
	display: flex;
	padding: 0 32rpx;
	margin-bottom: 10rpx;
}

.col-hdr {
	font-size: 22rpx; color: #9AABBF; font-weight: 500;
	&--left  { flex: 0 0 42%; }
	&--mid   { flex: 0 0 28%; text-align: center; }
	&--right { flex: 0 0 30%; text-align: right; padding-right: 32rpx; }
}

// Sankey body container
.sankey-body {
	position: relative;
	margin: 0 32rpx;
}

// Row background bands (spans left+mid area)
.row-bands {
	position: absolute;
	top: 0; left: 0;
	width: 73%;
	z-index: 0;
	display: flex;
	flex-direction: column;
}

.row-band { width: 100%; }

// Gradient fade-out overlay softening the row-bands right edge (z between bands and canvas)
.row-fade {
	position: absolute;
	top: 0; bottom: 0;
	left: 60%; width: 14%;
	z-index: 0;
	background: linear-gradient(90deg, transparent 0%, #FFFFFF 100%);
	pointer-events: none;
}

// Canvas (ribbons only)
.sankey-canvas {
	position: absolute;
	top: 0; left: 0;
	z-index: 1;
	pointer-events: none;
}

// White wipe cover
.sankey-cover {
	position: absolute;
	top: 0; right: 0; bottom: 0;
	background: #FFFFFF;
	z-index: 4;
	pointer-events: none;
}

// Columns
.col {
	position: absolute;
	top: 0;
	display: flex;
	flex-direction: column;
	z-index: 2;

	&--left  { left: 0; width: 42%; }
	&--mid   { left: 42%; width: 28%; }
	&--right { right: 0; top: 0; bottom: 0; width: 30%; }
}

// Left nodes
.left-node {
	position: relative;
	display: flex;
	align-items: center;
}

.left-bar {
	position: absolute;
	left: 0; top: 0; bottom: 0;
	width: 40rpx;
	flex-shrink: 0;
}

.left-content {
	padding-left: 50rpx;
	padding-right: 8rpx;
	display: flex;
	flex-direction: column;
	justify-content: center;
	gap: 4rpx;
	min-width: 0;
}

.left-tag {
	align-self: flex-start;
	padding: 5rpx 10rpx;
	border-radius: 8rpx;
	font-size: 19rpx;
	font-weight: 600;
	line-height: 1;
}

.left-label {
	font-size: 22rpx;
	color: #5A6B7C;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.left-value {
	font-size: 24rpx;
	font-weight: 700;
	font-family: 'Menlo', 'SF Mono', 'Consolas', monospace;
	white-space: nowrap;
}

// Middle nodes
.mid-node {
	display: flex;
	align-items: center;
	gap: 8rpx;
	padding: 0 10rpx;
}

.mid-dot {
	width: 8rpx;
	height: 40rpx;
	border-radius: 4rpx;
	flex-shrink: 0;
	opacity: 0.85;
}

.mid-text {
	font-size: 23rpx;
	color: #5A6B7C;
	font-weight: 500;
	line-height: 1.4;
}

// Right nodes (absolutely positioned, heights from JS)
.right-node {
	position: absolute;
	left: 0; right: 0;
	border-radius: 0 10rpx 10rpx 0;
	display: flex;
	align-items: center;
	overflow: hidden;
}

.right-content {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 10rpx 8rpx 10rpx 12rpx;
	gap: 6rpx;
}

.right-label {
	font-size: 23rpx;
	font-weight: 700;
	text-align: center;
	line-height: 1.3;
}

.right-risk {
	font-size: 20rpx;
	font-weight: 400;
	opacity: 0.85;
}

.right-bar {
	width: 14rpx;
	align-self: stretch;
	flex-shrink: 0;
}

// Legend
.sankey-legend {
	display: flex; align-items: center; gap: 10rpx;
	margin: 16rpx 32rpx 0;
	padding-top: 14rpx;
	border-top: 1rpx solid rgba(30, 58, 95, 0.06);
}

.legend-bar {
	width: 20rpx; height: 8rpx;
	border-radius: 4rpx;
	background: linear-gradient(90deg, #607D9C, #26C6DA);
	opacity: 0.5;
}

.legend-text { font-size: 22rpx; color: #9AABBF; }

// ===== Section 2: Tips =====
.tips-card { padding: 28rpx 32rpx; }

.tip-item {
	display: flex; align-items: flex-start; gap: 22rpx;
	padding: 18rpx 0;
	border-bottom: 1rpx solid rgba(30, 58, 95, 0.05);
	opacity: 0;
	transform: translateX(16rpx);

	&:last-child { border-bottom: none; padding-bottom: 0; }
}

.section--visible .tip-item {
	opacity: 1; transform: translateX(0);
	transition:
		opacity 0.45s ease calc(var(--tip-i, 0) * 70ms + 360ms),
		transform 0.45s ease calc(var(--tip-i, 0) * 70ms + 360ms);
}

.tip-icon {
	width: 72rpx; height: 72rpx;
	border-radius: 20rpx;
	background: linear-gradient(135deg, rgba(30, 58, 95, 0.07), rgba(38, 198, 218, 0.10));
	display: flex; align-items: center; justify-content: center;
	flex-shrink: 0;

	&__emoji { font-size: 34rpx; line-height: 1; }
}

.tip-body { flex: 1; min-width: 0; }

.tip-title {
	font-size: 28rpx; font-weight: 600; color: #1A2B3C;
	display: block; margin-bottom: 8rpx;
}

.tip-desc {
	font-size: 24rpx; color: #5A6B7C; line-height: 1.65;
	display: block;
}

.bottom-safe { height: calc(32rpx + env(safe-area-inset-bottom)); }
</style>
