// resources/js/stores/business.store.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useBusinessStore = defineStore('business', () => {
  // 订单相关状态
  const currentOrder = ref(null)
  const orderDrafts = ref([])
  const orderStats = ref({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    cancelled: 0
  })

  // 数据字典（从服务器获取）
  const dictionaries = ref({
    countries: [],
    businessTypes: [],
    statusList: [],
    agents: [],
    departments: [],
    settlementStatus: []
  })

  // 客户缓存（避免重复请求）
  const clientCache = ref(new Map())
  const recentClients = ref([])

  // 表单历史（用于撤销/重做）
  const formHistory = ref([])
  const historyIndex = ref(-1)

  // 计算属性
  const hasOrderDrafts = computed(() => orderDrafts.value.length > 0)
  const orderStatsSummary = computed(() => {
    return `总计: ${orderStats.value.total} | 待处理: ${orderStats.value.pending}`
  })

  const countryOptions = computed(() => {
    return dictionaries.value.countries.map(c => ({
      value: c.code,
      label: c.name
    }))
  })

  const agentOptions = computed(() => {
    return dictionaries.value.agents.map(a => ({
      value: a.id,
      label: a.name
    }))
  })

  // Actions
  const setCurrentOrder = (order) => {
    currentOrder.value = order
    if (order) {
      localStorage.setItem('current_order', JSON.stringify(order))
    }
  }

  const addOrderDraft = (draft) => {
    const draftWithMeta = {
      ...draft,
      id: Date.now(),
      saveTime: new Date().toISOString(),
      customerCount: draft.customers?.length || 0
    }
    
    orderDrafts.value.unshift(draftWithMeta)
    
    // 只保留最近10个草稿
    if (orderDrafts.value.length > 10) {
      orderDrafts.value.pop()
    }
    
    localStorage.setItem('order_drafts', JSON.stringify(orderDrafts.value))
  }

  const removeOrderDraft = (id) => {
    const index = orderDrafts.value.findIndex(draft => draft.id === id)
    if (index !== -1) {
      orderDrafts.value.splice(index, 1)
      localStorage.setItem('order_drafts', JSON.stringify(orderDrafts.value))
    }
  }

  const clearCurrentOrder = () => {
    currentOrder.value = null
    localStorage.removeItem('current_order')
  }

  const addToFormHistory = (state) => {
    // 移除当前索引之后的历史
    formHistory.value = formHistory.value.slice(0, historyIndex.value + 1)
    formHistory.value.push(JSON.parse(JSON.stringify(state)))
    historyIndex.value++
    
    // 只保留最近50个历史记录
    if (formHistory.value.length > 50) {
      formHistory.value.shift()
      historyIndex.value--
    }
  }

  const undo = () => {
    if (historyIndex.value > 0) {
      historyIndex.value--
      return JSON.parse(JSON.stringify(formHistory.value[historyIndex.value]))
    }
    return null
  }

  const redo = () => {
    if (historyIndex.value < formHistory.value.length - 1) {
      historyIndex.value++
      return JSON.parse(JSON.stringify(formHistory.value[historyIndex.value]))
    }
    return null
  }

  const cacheClient = (client) => {
    if (client.passport) {
      clientCache.value.set(client.passport, {
        ...client,
        lastUsed: new Date().toISOString(),
        cacheTime: Date.now()
      })
    }
  }

  const getCachedClient = (passport) => {
    const cached = clientCache.value.get(passport)
    // 缓存有效期1小时
    if (cached && Date.now() - cached.cacheTime < 3600000) {
      return cached
    }
    return null
  }

  // 初始化数据字典
  const loadDictionaries = async () => {
    // 这里应该调用API获取数据字典
    // 暂时使用模拟数据
    dictionaries.value = {
      countries: [
        { code: 'CN', name: '中国' },
        { code: 'TH', name: '泰国' },
        { code: 'KH', name: '柬埔寨' }
      ],
      businessTypes: ['签证', '劳工证', '工作许可', '居留许可'],
      statusList: ['待处理', '受理中', '办理中', '完成', '拒签', '取消'],
      agents: [
        { id: 1, name: '张三' },
        { id: 2, name: '李四' }
      ],
      departments: [
        { id: 1, name: '签证部' },
        { id: 2, name: '劳工证部' }
      ],
      settlementStatus: ['未结算', '部分结算', '已结算']
    }
  }

  // 从本地存储恢复
  const initFromStorage = () => {
    const savedDrafts = localStorage.getItem('order_drafts')
    if (savedDrafts) {
      try {
        orderDrafts.value = JSON.parse(savedDrafts)
      } catch (e) {
        console.error('恢复草稿失败:', e)
      }
    }
    
    const savedOrder = localStorage.getItem('current_order')
    if (savedOrder) {
      try {
        currentOrder.value = JSON.parse(savedOrder)
      } catch (e) {
        console.error('恢复订单失败:', e)
      }
    }
  }

  return {
    // State
    currentOrder,
    orderDrafts,
    orderStats,
    dictionaries,
    clientCache,
    recentClients,
    formHistory,
    historyIndex,
    
    // Getters
    hasOrderDrafts,
    orderStatsSummary,
    countryOptions,
    agentOptions,
    
    // Actions
    setCurrentOrder,
    addOrderDraft,
    removeOrderDraft,
    clearCurrentOrder,
    addToFormHistory,
    undo,
    redo,
    cacheClient,
    getCachedClient,
    loadDictionaries,
    initFromStorage
  }
})