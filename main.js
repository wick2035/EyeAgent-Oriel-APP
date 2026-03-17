import './utils/crypto/cryptoPolyfill.js'
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
  // 挂载全局 Toast 工具
  app.config.globalProperties.$toast = toast
  return {
    app
  }
}
// #endif