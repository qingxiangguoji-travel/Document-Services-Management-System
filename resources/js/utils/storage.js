/**
 * 虚拟数据库引擎 - 负责所有数据的持久化与逻辑关联
 * 
 * 数据存储规则：
 * - 代理/订单/配置 → localStorage（轻量级结构化数据）
 * - 文件资料 → IndexedDB（大容量二进制数据，通过 fileService 管理）
 */
const DB_KEYS = {
  AGENTS: 'AGENTS_DATA',
  ORDERS: 'BUSINESS_ORDERS_DATA',
  CONFIGS: 'SYSTEM_CONFIGS_DATA',
  STAFF_LIST: 'STAFF_LIST'
}

export const db = {
  // =========================
  // 基础读写
  // =========================
  
  getRaw(key) {
    const realKey = DB_KEYS[key]
    if (!realKey) {
      console.warn('[DB] 未注册的存储Key:', key)
      return null
    }

    const data = localStorage.getItem(realKey)
    if (!data) return null

    try {
      return JSON.parse(data)
    } catch (e) {
      console.warn('[DB] JSON损坏:', realKey, e)
      return null
    }
  },

  saveRaw(key, data) {
    const realKey = DB_KEYS[key]
    if (!realKey) {
      throw new Error(`[DB] 禁止写入未注册Key: ${key}`)
    }

    localStorage.setItem(realKey, JSON.stringify(data))
  },

  // =========================
  // 配置中心
  // =========================
  
  getConfigs() {
    const saved = this.getRaw('CONFIGS')
    const defaults = {
      nationalities: ['中国', '泰国', '越南', '缅甸', '老挝', '柬埔寨'],
      businessTypes: ['签证', '劳工证', '工作许可', '公司注册', '居留许可'],
      departments: [
        { id: 1, name: '签证中心' },
        { id: 2, name: '劳工中心' }
      ],
      orderStatuses: [
        { label: '已录入', value: 'created', color: 'info' },
        { label: '办理中', value: 'processing', color: 'warning' },
        { label: '已完成', value: 'completed', color: 'success' }
      ],
      fees: []
    }

    if (!saved) return defaults
    
    return {
      nationalities: saved.nationalities || defaults.nationalities,
      businessTypes: saved.businessTypes || defaults.businessTypes,
      departments: saved.departments || defaults.departments,
      orderStatuses: saved.orderStatuses || defaults.orderStatuses,
      fees: saved.fees || []
    }
  },

  saveConfigs(newConfigs) {
    this.saveRaw('CONFIGS', newConfigs)
  },

  // =========================
  // 代理商管理
  // =========================
  
  getAgents() {
    return this.getRaw('AGENTS') || []
  },

  saveAgent(agentData) {
    const agents = this.getAgents()

    if (!agentData.id) {
      agentData.id = Date.now()
      agents.unshift(agentData)
    } else {
      const idx = agents.findIndex(a => String(a.id) === String(agentData.id))

      if (idx !== -1) {
        agents[idx] = agentData
      } else {
        agents.unshift(agentData)
      }
    }

    this.saveRaw('AGENTS', agents)
    return agentData
  },

  // =========================
  // 订单管理
  // =========================
  
  getOrders(filters = {}) {
    const rawOrders = this.getRaw('ORDERS') || []
    const agents = this.getAgents()
    const configs = this.getConfigs()

    let processed = rawOrders.map(order => {
      // ✅ 通过新标准字段查找代理
      const agentDetail = agents.find(
        a => String(a.id) === String(order.agent_company_id)
      ) || {
        id: order.agent_company_id || '',
        name: order.agent_company_name || '未知代理'
      }

      const dept = configs.departments.find(
        d => Number(d.id) === Number(order.department_id)
      )

      const deptName = dept ? dept.name : (order.deptName || '未知部门')

      return { ...order, agentDetail, deptName }
    })

    // 状态筛选
    if (filters.status) {
      processed = processed.filter(o => o.status === filters.status)
    }

    // 编号筛选
    if (filters.code) {
      processed = processed.filter(o =>
        String(o.code || '').includes(filters.code)
      )
    }

    return processed.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    )
  },

  saveOrder(orderData) {
    const orders = this.getRaw('ORDERS') || []

    // ✅ 获取当前登录用户（用于审计）
    const currentUser = JSON.parse(
      localStorage.getItem('AUTH_USER_V1') || 'null'
    )

    // ✅ 新订单初始化
    if (!orderData.id) {
      orderData.id = Date.now()
      orderData.created_at = new Date().toISOString()

      // ✅ 审计字段：记录谁创建的订单
      orderData.created_by_user_id = currentUser?.id || null
      orderData.created_by_name = currentUser?.name || '未知用户'
    }

    // ✅ 保存逻辑（Create.vue 已填好 4 个代理字段，这里直接保存）
    if (!orderData.id) {
      orders.unshift(orderData)
    } else {
      const idx = orders.findIndex(o => String(o.id) === String(orderData.id))
      if (idx !== -1) {
        orders[idx] = orderData
      } else {
        orders.unshift(orderData)
      }
    }

    this.saveRaw('ORDERS', orders)
    return orderData
  },

  getAgentStats(agentId) {
    const orders = this.getOrders({ agent_id: agentId })
    
    return {
      totalCount: orders.length,
      totalAmount: orders.reduce(
        (s, o) => s + Number(o.total_fee || 0),
        0
      ),
      unpaidAmount: orders
        .filter(o => o.settlement === 'unpaid')
        .reduce((s, o) => s + Number(o.total_fee || 0), 0),
      completedCount: orders.filter(o => o.status === 'completed').length
    }
  }
}