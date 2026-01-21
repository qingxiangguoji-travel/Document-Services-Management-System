// 完全复制这个内容到文件中
import axios from 'axios'
import { ElMessage } from 'element-plus'

/**
 * Axios实例配置
 * 关键：前后端分离时只需修改baseURL
 */
const http = axios.create({
  // ✅ 当前：指向当前Laravel项目的API路由
  // ✅ 未来独立部署：改为后端API地址，如 'https://api.yourdomain.com/api'
  baseURL: '/api',
  
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
})

// 请求拦截器
http.interceptors.request.use(
  (config) => {
    // 添加认证token
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // 添加语言头
    const lang = localStorage.getItem('app_lang') || 'zh'
    config.headers['Accept-Language'] = lang
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
http.interceptors.response.use(
  (response) => {
    // 直接返回数据部分
    return response.data
  },
  (error) => {
    const response = error.response
    const status = response?.status
    const message = response?.data?.message || error.message || '请求失败'
    
    // 统一错误处理
    switch (status) {
      case 401:
        ElMessage.error('登录已过期，请重新登录')
        localStorage.removeItem('auth_token')
        setTimeout(() => {
          window.location.href = '/login'
        }, 1500)
        break
        
      case 403:
        ElMessage.error('权限不足，无法访问此资源')
        break
        
      case 404:
        ElMessage.error('请求的资源不存在')
        break
        
      case 422:
        // 表单验证错误，在业务层处理
        break
        
      case 500:
        ElMessage.error('服务器内部错误，请稍后重试')
        break
        
      default:
        if (error.code === 'ECONNABORTED') {
          ElMessage.error('请求超时，请检查网络连接')
        } else {
          ElMessage.error(message)
        }
    }
    
    return Promise.reject(error)
  }
)

export default http