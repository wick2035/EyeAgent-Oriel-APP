/**
 * 全局 Toast 工具
 * 用于替代 uni.showToast，提供更精美的提示效果
 *
 * 使用方式：
 * import toast from '@/utils/toast.js'
 * toast.success('操作成功')
 * toast.error('操作失败')
 * toast.warning('请注意')
 * toast.info('提示信息')
 */

let toastInstance = null

/**
 * 检查 Toast 实例是否可用（未被销毁）
 */
function isInstanceValid() {
	return toastInstance && !toastInstance._isDestroyed
}

/**
 * 设置 Toast 实例
 * @param {Object} instance - CustomToast 组件实例
 */
export function setToastInstance(instance) {
	toastInstance = instance
}

/**
 * Toast 工具对象
 */
export const toast = {
	/**
	 * 显示成功提示
	 * @param {string} message - 提示文本
	 * @param {number} duration - 显示时长（毫秒），默认 2000
	 */
	success(message, duration = 2000) {
		if (isInstanceValid()) {
			toastInstance.success(message, duration)
		} else {
			// 降级为原生 Toast
			uni.showToast({ title: message, icon: 'success' })
		}
	},

	/**
	 * 显示错误提示
	 * @param {string} message - 提示文本
	 * @param {number} duration - 显示时长（毫秒），默认 2500
	 */
	error(message, duration = 2500) {
		if (isInstanceValid()) {
			toastInstance.error(message, duration)
		} else {
			uni.showToast({ title: message, icon: 'none' })
		}
	},

	/**
	 * 显示警告提示
	 * @param {string} message - 提示文本
	 * @param {number} duration - 显示时长（毫秒），默认 2500
	 */
	warning(message, duration = 2500) {
		if (isInstanceValid()) {
			toastInstance.warning(message, duration)
		} else {
			uni.showToast({ title: message, icon: 'none' })
		}
	},

	/**
	 * 显示信息提示
	 * @param {string} message - 提示文本
	 * @param {number} duration - 显示时长（毫秒），默认 2000
	 */
	info(message, duration = 2000) {
		if (isInstanceValid()) {
			toastInstance.info(message, duration)
		} else {
			uni.showToast({ title: message, icon: 'none' })
		}
	},

	/**
	 * 显示自定义 Toast
	 * @param {Object} options - 配置项
	 * @param {string} options.type - 类型：success | error | warning | info
	 * @param {string} options.message - 提示文本
	 * @param {string} options.position - 位置：top | center | bottom
	 * @param {number} options.duration - 显示时长（毫秒）
	 */
	show(options) {
		if (isInstanceValid()) {
			toastInstance.show(options)
		} else {
			uni.showToast({
				title: options.message,
				icon: options.type === 'success' ? 'success' : 'none'
			})
		}
	},

	/**
	 * 隐藏 Toast
	 */
	hide() {
		if (isInstanceValid()) {
			toastInstance.hide()
		} else {
			uni.hideToast()
		}
	}
}

export default toast
