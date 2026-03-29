/**
 * 护眼锻炼状态管理
 * AI医问通 - 锻炼记录、统计、提醒设置
 */

import { reactive } from 'vue'

const STORAGE_KEY = 'eyeExerciseData'

// 锻炼类型配置
export const EXERCISE_TYPES = {
	'eye-movement': {
		name: '眼球运动',
		desc: '跟随圆点转动眼球',
		duration: 60,
		tag: '放松',
		color: '#10B981',
		iconType: 'movement'
	},
	'blink': {
		name: '眨眼练习',
		desc: '有节奏地眨眼放松',
		duration: 45,
		tag: '舒缓',
		color: '#0EA5E9',
		iconType: 'blink'
	},
	'focus-shift': {
		name: '焦点切换',
		desc: '远近交替锻炼睫状肌',
		duration: 90,
		tag: '调节',
		color: '#8B5CF6',
		iconType: 'focus'
	},
	'twenty-rule': {
		name: '20-20-20',
		desc: '看向远处放松眼睛',
		duration: 20,
		tag: '休息',
		color: '#F59E0B',
		iconType: 'timer'
	}
}

// 状态
const state = reactive({
	records: {},
	reminder: {
		enabled: false,
		time: '09:00'
	},
	settings: {
		sound: true,
		vibration: true
	}
})

/**
 * 初始化（从本地存储恢复）
 */
export function initExerciseStore() {
	try {
		const data = uni.getStorageSync(STORAGE_KEY)
		if (data) {
			const parsed = JSON.parse(data)
			if (parsed.records) state.records = parsed.records
			if (parsed.reminder) Object.assign(state.reminder, parsed.reminder)
			if (parsed.settings) Object.assign(state.settings, parsed.settings)
		}
	} catch (e) {
		console.error('初始化护眼锻炼数据失败:', e)
	}
}

/**
 * 持久化保存
 */
function save() {
	try {
		uni.setStorageSync(STORAGE_KEY, JSON.stringify({
			records: state.records,
			reminder: state.reminder,
			settings: state.settings
		}))
	} catch (e) {
		console.error('保存护眼锻炼数据失败:', e)
	}
}

/**
 * 获取今天的日期字符串
 */
function getTodayKey() {
	const d = new Date()
	const y = d.getFullYear()
	const m = String(d.getMonth() + 1).padStart(2, '0')
	const day = String(d.getDate()).padStart(2, '0')
	return `${y}-${m}-${day}`
}

/**
 * 添加一条锻炼记录
 */
export function addRecord(type, duration) {
	const key = getTodayKey()
	if (!state.records[key]) {
		state.records[key] = { exercises: [], totalDuration: 0 }
	}

	const now = new Date()
	const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

	state.records[key].exercises.push({
		type,
		completedAt: timeStr,
		duration
	})
	state.records[key].totalDuration += duration
	save()
}

/**
 * 获取今日锻炼数据
 */
export function getTodayRecords() {
	const key = getTodayKey()
	return state.records[key] || { exercises: [], totalDuration: 0 }
}

/**
 * 获取今日已完成的锻炼类型列表
 */
export function getTodayCompletedTypes() {
	const today = getTodayRecords()
	return [...new Set(today.exercises.map(e => e.type))]
}

/**
 * 获取本周每日锻炼数据（周一到周日）
 */
export function getWeekData() {
	const now = new Date()
	const dayOfWeek = now.getDay() || 7 // 周日为7
	const result = []

	for (let i = 1; i <= 7; i++) {
		const d = new Date(now)
		d.setDate(now.getDate() - (dayOfWeek - i))
		const y = d.getFullYear()
		const m = String(d.getMonth() + 1).padStart(2, '0')
		const day = String(d.getDate()).padStart(2, '0')
		const key = `${y}-${m}-${day}`
		const record = state.records[key]

		result.push({
			key,
			label: ['一', '二', '三', '四', '五', '六', '日'][i - 1],
			count: record ? record.exercises.length : 0,
			duration: record ? record.totalDuration : 0,
			isToday: i === dayOfWeek
		})
	}
	return result
}

/**
 * 计算连续打卡天数
 */
export function getStreak() {
	let streak = 0
	const now = new Date()
	const todayKey = getTodayKey()

	// 如果今天有记录，从今天开始往前数
	// 如果今天没记录，从昨天开始往前数
	let startOffset = state.records[todayKey] ? 0 : 1

	for (let i = startOffset; i < 365; i++) {
		const d = new Date(now)
		d.setDate(now.getDate() - i)
		const y = d.getFullYear()
		const m = String(d.getMonth() + 1).padStart(2, '0')
		const day = String(d.getDate()).padStart(2, '0')
		const key = `${y}-${m}-${day}`

		if (state.records[key] && state.records[key].exercises.length > 0) {
			streak++
		} else {
			break
		}
	}
	return streak
}

/**
 * 获取累计统计
 */
export function getTotalStats() {
	let totalSessions = 0
	let totalDuration = 0

	Object.values(state.records).forEach(day => {
		totalSessions += day.exercises.length
		totalDuration += day.totalDuration
	})

	return { totalSessions, totalDuration }
}

/**
 * 更新提醒设置
 */
export function updateReminder(enabled, time) {
	state.reminder.enabled = enabled
	if (time !== undefined) state.reminder.time = time
	save()
	refreshExerciseReminder()
}

/**
 * 获取提醒设置
 */
export function getReminder() {
	return state.reminder
}

/**
 * 更新声音/震动设置
 */
export function updateSettings(key, value) {
	state.settings[key] = value
	save()
}

/**
 * 获取设置
 */
export function getSettings() {
	return state.settings
}

/**
 * 刷新本地通知提醒
 */
export function refreshExerciseReminder() {
	// #ifdef APP-PLUS
	try {
		// 清除旧的提醒
		plus.push.clear()

		if (!state.reminder.enabled) return

		const [h, m] = state.reminder.time.split(':').map(Number)
		const now = new Date()
		const target = new Date(now)
		target.setHours(h, m, 0, 0)

		// 如果今天的时间已过，设置明天的
		if (target <= now) {
			target.setDate(target.getDate() + 1)
		}

		const delay = Math.floor((target - now) / 1000)

		plus.push.createMessage('该做护眼锻炼啦！让眼睛休息一下', 'eye-exercise', {
			title: '护眼锻炼提醒',
			delay
		})
	} catch (e) {
		console.error('设置护眼锻炼提醒失败:', e)
	}
	// #endif
}

/**
 * 触发震动反馈
 */
export function vibrate(type = 'light') {
	if (!state.settings.vibration) return
	uni.vibrateShort({ type })
}

/**
 * 语音播报（使用系统TTS）
 */
let ttsReady = false
let ttsEngine = null
let ttsInitializing = false

function initTTS() {
	if (ttsReady || ttsInitializing) return
	ttsInitializing = true
	// #ifdef APP-PLUS
	try {
		const TextToSpeech = plus.android.importClass('android.speech.tts.TextToSpeech')
		const activity = plus.android.runtimeMainActivity()
		const listener = plus.android.implements('android.speech.tts.TextToSpeech$OnInitListener', {
			onInit(status) {
				if (status === 0) {
					const Locale = plus.android.importClass('java.util.Locale')
					ttsEngine.setLanguage(Locale.CHINA)
					ttsReady = true
				}
				ttsInitializing = false
			}
		})
		ttsEngine = new TextToSpeech(activity, listener)
	} catch (e) {
		console.warn('TTS初始化失败:', e)
		ttsInitializing = false
	}
	// #endif
}

export function speak(text) {
	if (!state.settings.sound) return
	if (!text) return

	// #ifdef APP-PLUS
	try {
		if (!ttsEngine && !ttsInitializing) initTTS()
		if (ttsReady && ttsEngine) {
			// Android API 21+ 使用新版 speak 方法
			const Build = plus.android.importClass('android.os.Build')
			if (Build.VERSION.SDK_INT >= 21) {
				ttsEngine.speak(text, 0, null, 'eye-exercise-' + Date.now())
			} else {
				const HashMap = plus.android.importClass('java.util.HashMap')
				ttsEngine.speak(text, 0, new HashMap())
			}
		}
	} catch (e) {
		console.warn('语音播报失败:', e)
	}
	// #endif

	// #ifdef H5
	try {
		if (window.speechSynthesis) {
			speechSynthesis.cancel()
			const utterance = new SpeechSynthesisUtterance(text)
			utterance.lang = 'zh-CN'
			utterance.rate = 1.1
			speechSynthesis.speak(utterance)
		}
	} catch (e) {}
	// #endif
}

/**
 * 停止语音播报
 */
export function stopSpeak() {
	// #ifdef APP-PLUS
	try {
		if (ttsEngine) ttsEngine.stop()
	} catch (e) {}
	// #endif
	// #ifdef H5
	try {
		if (window.speechSynthesis) speechSynthesis.cancel()
	} catch (e) {}
	// #endif
}

/**
 * 预初始化TTS（在进入锻炼页时调用，确保开始锻炼时已就绪）
 */
export function preInitTTS() {
	if (!state.settings.sound) return
	if (!ttsReady && !ttsInitializing) initTTS()
}
