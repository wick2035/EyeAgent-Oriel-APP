<template>
	<view class="trend" :class="{ 'trend--dark': isDark }">
		<view class="trend__header">
			<text class="trend__title">近视进展趋势</text>
			<view class="trend__legend">
				<view class="trend__legend-item">
					<view class="trend__legend-dot trend__legend-dot--od"></view>
					<text class="trend__legend-text">右眼</text>
				</view>
				<view class="trend__legend-item">
					<view class="trend__legend-dot trend__legend-dot--os"></view>
					<text class="trend__legend-text">左眼</text>
				</view>
				<view class="trend__legend-item">
					<view class="trend__legend-line"></view>
					<text class="trend__legend-text">预测</text>
				</view>
			</view>
		</view>

		<view class="trend__chart-area">
			<view class="trend__y-axis">
				<text v-for="tick in yTicks" :key="'yl-' + tick" class="trend__y-label">
					{{ tick === 0 ? '0' : '-' + tick }}
				</text>
			</view>

			<view class="trend__canvas-wrap">
				<canvas canvas-id="trendCanvas" id="trendCanvas" class="trend__canvas"></canvas>
			</view>
		</view>

		<view class="trend__x-axis">
			<text v-for="(item, i) in allData" :key="'x-' + i" class="trend__x-label"
				:class="{ 'trend__x-label--pred': i >= historyLen }">
				{{ formatDate(item.date) }}
			</text>
		</view>
	</view>
</template>

<script>
import { isDarkMode } from '@/store/theme.js'

const OD_COLOR = '#3B82F6'
const OS_COLOR = '#FF6B5B'
const BAND_COLORS = [
	{ min: 0, max: 3, color: '#10B981', alpha: 0.03 },
	{ min: 3, max: 6, color: '#3B82F6', alpha: 0.03 },
	{ min: 6, max: 9, color: '#F59E0B', alpha: 0.025 }
]

export default {
	name: 'MyopiaTrendChart',
	props: {
		trendData: {
			type: Object,
			required: true
		}
	},
	data() {
		return {
			canvasW: 0,
			canvasH: 0,
			padT: 0,
			padB: 0,
			padL: 0,
			padR: 0
		}
	},
	computed: {
		isDark() {
			return isDarkMode()
		},
		allData() {
			return [...(this.trendData.history || []), ...(this.trendData.prediction || [])]
		},
		historyLen() {
			return (this.trendData.history || []).length
		},
		yMax() { return 9 },
		yTicks() {
			return [0, 3, 6, 9]
		}
	},
	watch: {
		trendData: {
			deep: true,
			handler() {
				this.drawChart()
			}
		},
		isDark() {
			this.drawChart()
		}
	},
	mounted() {
		this.$nextTick(() => {
			this.initCanvas()
		})
	},
	methods: {
		initCanvas() {
			const query = uni.createSelectorQuery().in(this)
			query.select('#trendCanvas').boundingClientRect(rect => {
				if (rect) {
					this.canvasW = rect.width
					this.canvasH = rect.height
				} else {
					const sysInfo = uni.getSystemInfoSync()
					const scale = sysInfo.windowWidth / 750
					this.canvasW = Math.round(560 * scale)
					this.canvasH = Math.round(280 * scale)
				}
				const sysInfo = uni.getSystemInfoSync()
				const scale = sysInfo.windowWidth / 750
				this.padT = Math.round(10 * scale)
				this.padB = Math.round(6 * scale)
				this.padL = Math.round(12 * scale)
				this.padR = Math.round(12 * scale)
				setTimeout(() => {
					this.drawChart()
				}, 100)
			}).exec()
		},

		getChartH() {
			return this.canvasH - this.padT - this.padB
		},

		getX(index) {
			const total = this.allData.length - 1
			if (total <= 0) return this.padL
			return this.padL + (index / total) * (this.canvasW - this.padL - this.padR)
		},

		getY(absValue) {
			const ratio = absValue / this.yMax
			return this.padT + this.getChartH() * (1 - ratio)
		},

		drawChart() {
			const ctx = uni.createCanvasContext('trendCanvas', this)
			const w = this.canvasW
			const h = this.canvasH
			if (!w || !h) return

			const dark = this.isDark
			const hist = this.trendData.history || []
			const pred = this.trendData.prediction || []

			ctx.clearRect(0, 0, w, h)

			BAND_COLORS.forEach(band => {
				const y1 = this.getY(band.max)
				const y2 = this.getY(band.min)
				ctx.setGlobalAlpha(band.alpha)
				ctx.setFillStyle(band.color)
				ctx.fillRect(this.padL, y1, w - this.padL - this.padR, y2 - y1)
			})
			ctx.setGlobalAlpha(1)

			this.yTicks.forEach(tick => {
				const y = this.getY(tick)
				ctx.setStrokeStyle(dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)')
				ctx.setLineWidth(0.5)
				ctx.setLineDash([3, 3])
				ctx.beginPath()
				ctx.moveTo(this.padL, y)
				ctx.lineTo(w - this.padR, y)
				ctx.stroke()
			})
			ctx.setLineDash([])

			if (!hist.length) {
				ctx.draw()
				return
			}

			this.drawAreaFill(ctx, hist, 'od', OD_COLOR)
			this.drawAreaFill(ctx, hist, 'os', OS_COLOR)

			this.drawLine(ctx, hist.map((d, i) => ({
				x: this.getX(i),
				y: this.getY(Math.abs(d.od))
			})), OD_COLOR, 2, false, 1)

			this.drawLine(ctx, hist.map((d, i) => ({
				x: this.getX(i),
				y: this.getY(Math.abs(d.os))
			})), OS_COLOR, 2, false, 1)

			if (pred.length && hist.length) {
				const lastIdx = hist.length - 1
				const odPredPts = [
					{ x: this.getX(lastIdx), y: this.getY(Math.abs(hist[lastIdx].od)) },
					...pred.map((d, i) => ({
						x: this.getX(hist.length + i),
						y: this.getY(Math.abs(d.od))
					}))
				]
				const osPredPts = [
					{ x: this.getX(lastIdx), y: this.getY(Math.abs(hist[lastIdx].os)) },
					...pred.map((d, i) => ({
						x: this.getX(hist.length + i),
						y: this.getY(Math.abs(d.os))
					}))
				]
				this.drawLine(ctx, odPredPts, OD_COLOR, 1.5, true, 0.45)
				this.drawLine(ctx, osPredPts, OS_COLOR, 1.5, true, 0.45)
			}

			const dotBg = dark ? '#161B22' : '#FFFFFF'
			hist.forEach((d, i) => {
				this.drawDot(ctx, this.getX(i), this.getY(Math.abs(d.od)), 3, OD_COLOR, dotBg, 1.5, 1)
				this.drawDot(ctx, this.getX(i), this.getY(Math.abs(d.os)), 3, OS_COLOR, dotBg, 1.5, 1)
			})

			pred.forEach((d, i) => {
				const idx = hist.length + i
				this.drawHollowDot(ctx, this.getX(idx), this.getY(Math.abs(d.od)), 3, OD_COLOR, dotBg, 1.5, 0.45)
				this.drawHollowDot(ctx, this.getX(idx), this.getY(Math.abs(d.os)), 3, OS_COLOR, dotBg, 1.5, 0.45)
			})

			ctx.draw()
		},

		drawAreaFill(ctx, hist, key, color) {
			const baseline = this.getY(0)
			ctx.beginPath()
			ctx.moveTo(this.getX(0), baseline)
			hist.forEach((d, i) => {
				ctx.lineTo(this.getX(i), this.getY(Math.abs(d[key])))
			})
			ctx.lineTo(this.getX(hist.length - 1), baseline)
			ctx.closePath()

			const topY = this.padT
			const grad = ctx.createLinearGradient(0, topY, 0, baseline)
			grad.addColorStop(0, this.hexToRgba(color, 0.15))
			grad.addColorStop(1, this.hexToRgba(color, 0.01))
			ctx.setFillStyle(grad)
			ctx.fill()
		},

		drawLine(ctx, points, color, width, dashed, alpha) {
			if (points.length < 2) return
			ctx.setGlobalAlpha(alpha)
			ctx.setStrokeStyle(color)
			ctx.setLineWidth(width)
			ctx.setLineCap('round')
			ctx.setLineJoin('round')
			if (dashed) {
				ctx.setLineDash([5, 4])
			} else {
				ctx.setLineDash([])
			}
			ctx.beginPath()
			ctx.moveTo(points[0].x, points[0].y)
			for (let i = 1; i < points.length; i++) {
				ctx.lineTo(points[i].x, points[i].y)
			}
			ctx.stroke()
			ctx.setGlobalAlpha(1)
			ctx.setLineDash([])
		},

		drawDot(ctx, x, y, r, fillColor, strokeColor, strokeW, alpha) {
			ctx.setGlobalAlpha(alpha)
			ctx.beginPath()
			ctx.arc(x, y, r + strokeW / 2, 0, Math.PI * 2)
			ctx.setFillStyle(strokeColor)
			ctx.fill()
			ctx.beginPath()
			ctx.arc(x, y, r, 0, Math.PI * 2)
			ctx.setFillStyle(fillColor)
			ctx.fill()
			ctx.setGlobalAlpha(1)
		},

		drawHollowDot(ctx, x, y, r, color, bgColor, strokeW, alpha) {
			ctx.setGlobalAlpha(alpha)
			ctx.beginPath()
			ctx.arc(x, y, r + strokeW / 2, 0, Math.PI * 2)
			ctx.setFillStyle(bgColor)
			ctx.fill()
			ctx.setStrokeStyle(color)
			ctx.setLineWidth(strokeW)
			ctx.beginPath()
			ctx.arc(x, y, r, 0, Math.PI * 2)
			ctx.stroke()
			ctx.setGlobalAlpha(1)
		},

		hexToRgba(hex, alpha) {
			const r = parseInt(hex.slice(1, 3), 16)
			const g = parseInt(hex.slice(3, 5), 16)
			const b = parseInt(hex.slice(5, 7), 16)
			return `rgba(${r},${g},${b},${alpha})`
		},

		formatDate(dateStr) {
			if (!dateStr) return ''
			const parts = dateStr.split('-')
			return (parts[1] || '') + '/' + (parts[0] ? parts[0].slice(2) : '')
		}
	}
}
</script>

<style lang="scss" scoped>
.trend {
	margin-top: 16rpx;

	&__header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 10rpx;
		padding: 0 8rpx;
	}

	&__title {
		font-size: 24rpx;
		color: #5A6B7C;
		font-weight: 500;
	}

	&__legend {
		display: flex;
		align-items: center;
	}

	&__legend-item {
		display: flex;
		align-items: center;
		margin-left: 16rpx;
	}

	&__legend-dot {
		width: 12rpx;
		height: 12rpx;
		border-radius: 50%;
		margin-right: 6rpx;

		&--od {
			background: #3B82F6;
		}

		&--os {
			background: #FF6B5B;
		}
	}

	&__legend-line {
		width: 20rpx;
		height: 0;
		border-top: 3rpx dashed #9AABBF;
		margin-right: 6rpx;
	}

	&__legend-text {
		font-size: 20rpx;
		color: #9AABBF;
	}

	&__chart-area {
		display: flex;
		align-items: stretch;
	}

	&__y-axis {
		width: 50rpx;
		display: flex;
		flex-direction: column-reverse;
		justify-content: space-between;
		padding: 8rpx 0 4rpx;
		flex-shrink: 0;
	}

	&__y-label {
		font-size: 18rpx;
		color: #9AABBF;
		text-align: right;
		font-family: 'Menlo', 'Consolas', monospace;
	}

	&__canvas-wrap {
		flex: 1;
		height: 280rpx;
		overflow: hidden;
		position: relative;
	}

	&__canvas {
		position: absolute;
		left: 0;
		top: 0;
		width: 100%;
		height: 100%;
	}

	&__x-axis {
		display: flex;
		justify-content: space-between;
		padding: 6rpx 0 0;
		margin-left: 50rpx;
	}

	&__x-label {
		font-size: 18rpx;
		color: #9AABBF;
		text-align: center;
		font-family: 'Menlo', 'Consolas', monospace;
		flex: 1;

		&--pred {
			color: #C4C4C4;
			font-style: italic;
		}
	}

	&--dark {
		.trend__title {
			color: #8B949E;
		}

		.trend__legend-text {
			color: #484F58;
		}

		.trend__legend-line {
			border-top-color: #484F58;
		}

		.trend__y-label {
			color: #484F58;
		}

		.trend__x-label {
			color: #484F58;

			&--pred {
				color: #3A3A3A;
			}
		}
	}
}
</style>
