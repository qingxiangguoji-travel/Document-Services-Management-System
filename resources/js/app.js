import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

const app = createApp(App)

// --- 专业增强：全局错误处理，防止渲染死锁导致的白屏 ---
app.config.errorHandler = (err, vm, info) => {
  console.error('Vue 全局错误拦截:', err, info)
  // 可以在这里根据需要决定是否给用户弹窗提示
}

// 1. 使用Pinia
const pinia = createPinia()
app.use(pinia)

// 2. 使用路由
app.use(router)

// 3. 使用Element Plus
app.use(ElementPlus)

// 4. 全局注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 5. 全局配置
app.config.globalProperties.$filters = {
  formatDate(value) {
    if (!value) return ''
    return new Date(value).toLocaleDateString('zh-CN')
  },
  formatCurrency(value) {
    if (!value) return '¥0.00'
    return `¥${parseFloat(value).toFixed(2)}`
  }
}

app.mount('#app')

if (import.meta.env.DEV) {
  console.log('🚀 应用已启动，环境：开发')
}