import App from './App'
import toast from './utils/toast.js'
import { initRouteGuard } from './utils/routeGuard.js'

// 初始化路由守卫
initRouteGuard()

// #ifndef VUE3
import Vue from 'vue'
import './uni.promisify.adaptor'
Vue.config.productionTip = false

// 挂载全局 Toast 工具
Vue.prototype.$toast = toast

// 全局注册通知组件（所有页面模板中可直接使用，无需 import）
import TopNotificationBar from '@/components/TopNotificationBar.vue'
Vue.component('TopNotificationBar', TopNotificationBar)

App.mpType = 'app'
const app = new Vue({
  ...App
})
app.$mount()
// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue'
export function createApp() {
  const app = createSSRApp(App)
  return {
    app
  }
}
// #endif