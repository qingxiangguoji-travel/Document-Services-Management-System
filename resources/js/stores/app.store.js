// 完全复制这个内容到文件中
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAppStore = defineStore('app', () => {
  // 应用状态
  const isLoading = ref(false)
  const pageTitle = ref('证件业务管理系统')
  const sidebarCollapsed = ref(false)
  const currentTheme = ref('light') // 'light' | 'dark'
  
  // 用户信息
  const userInfo = ref({
    id: null,
    name: '',
    email: '',
    avatar: '',
    role: '',
    permissions: []
  })
  
  // 应用配置
  const appConfig = ref({
    version: '1.0.0',
    companyName: '证件业务公司',
    supportEmail: 'support@certificate.com',
    enableNotification: true
  })
  
  // 计算属性
  const isAuthenticated = computed(() => !!userInfo.value.id)
  const userInitial = computed(() => userInfo.value.name?.charAt(0) || 'U')
  const fullPageTitle = computed(() => {
    return `${pageTitle.value} - ${appConfig.value.companyName}`
  })
  
  // Actions
  const setLoading = (loading) => {
    isLoading.value = loading
  }
  
  const setPageTitle = (title) => {
    pageTitle.value = title
    document.title = fullPageTitle.value
  }
  
  const setUserInfo = (info) => {
    userInfo.value = { ...userInfo.value, ...info }
  }
  
  const toggleTheme = () => {
    currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light'
    // 这里可以添加主题切换的逻辑
  }
  
  const logout = () => {
    userInfo.value = {
      id: null,
      name: '',
      email: '',
      avatar: '',
      role: '',
      permissions: []
    }
    localStorage.removeItem('auth_token')
  }
  
  return {
    // State
    isLoading,
    pageTitle,
    sidebarCollapsed,
    currentTheme,
    userInfo,
    appConfig,
    
    // Getters
    isAuthenticated,
    userInitial,
    fullPageTitle,
    
    // Actions
    setLoading,
    setPageTitle,
    setUserInfo,
    toggleTheme,
    logout
  }
})