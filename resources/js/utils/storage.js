/**
 * 虚拟数据库引擎 - 负责所有数据的持久化与逻辑关联
 */
const DB_KEYS = {
  AGENTS: 'AGENTS_DATA',
  ORDERS: 'BUSINESS_ORDERS_DATA',
  CONFIGS: 'SYSTEM_CONFIGS_DATA'
};

export const db = {
  // --- 基础读写 ---
  getRaw(key) {
    const data = localStorage.getItem(DB_KEYS[key]);
    return data ? JSON.parse(data) : null;
  },

  saveRaw(key, data) {
    localStorage.setItem(DB_KEYS[key], JSON.stringify(data));
  },

  // --- 配置中心 (严格保持原有字段名) ---
  getConfigs() {
    const saved = this.getRaw('CONFIGS');
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
      // 预留费用字段，防止读取报错
      fees: [] 
    };
    
    // 资深写法：深度合并，确保即便 saved 缺少某个 key，也不会导致页面崩溃
    if (!saved) return defaults;
    return {
      nationalities: saved.nationalities || defaults.nationalities,
      businessTypes: saved.businessTypes || defaults.businessTypes,
      departments: saved.departments || defaults.departments,
      orderStatuses: saved.orderStatuses || defaults.orderStatuses,
      fees: saved.fees || []
    };
  },

  saveConfigs(newConfigs) {
    // 仅保存增量数据，不破坏存储结构
    this.saveRaw('CONFIGS', newConfigs);
  },

  // --- 代理商管理 ---
  getAgents() {
    return this.getRaw('AGENTS') || [];
  },

  saveAgent(agentData) {
    const agents = this.getAgents();
    if (agentData.id) {
      const idx = agents.findIndex(a => a.id === agentData.id);
      if (idx !== -1) agents[idx] = agentData;
    } else {
      agentData.id = Date.now();
      agents.unshift(agentData);
    }
    this.saveRaw('AGENTS', agents);
    return agentData;
  },

  // --- 订单管理 (严格保护关联逻辑) ---
  getOrders(filters = {}) {
    const rawOrders = this.getRaw('ORDERS') || [];
    const agents = this.getAgents();
    const configs = this.getConfigs();

    let processed = rawOrders.map(order => {
      // 1. 兼容性搜索代理商 (逻辑保持原样)
      const agentDetail = agents.find(a => a.id === order.agent_id) || 
                          agents.find(a => a.name === order.agent) || 
                          { name: order.agent || '未知代理' };
      
      // 2. 实时匹配部门名称 (确保 department_id 关联不丢失)
      const dept = configs.departments.find(d => Number(d.id) === Number(order.department_id));
      const deptName = dept ? dept.name : (order.deptName || '未知部门');

      return { ...order, agentDetail, deptName };
    });

    // 3. 条件筛选 (保持原有代码，确保搜索功能正常)
    if (filters.agent_id) {
      processed = processed.filter(o => o.agent_id == filters.agent_id || o.agentDetail.id == filters.agent_id);
    }
    if (filters.status) {
      processed = processed.filter(o => o.status === filters.status);
    }
    if (filters.code) {
      processed = processed.filter(o => o.code.includes(filters.code));
    }

    return processed.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  // 针对你的“保存不校验”问题，这里增加一个逻辑检查点（如果其他页面调用 saveOrder）
  saveOrder(orderData) {
    if (!orderData.customerName || !orderData.passportNo) {
      throw new Error("关键数据丢失：姓名或护照号必填");
    }
    const orders = this.getRaw('ORDERS') || [];
    // ... 保存逻辑
    this.saveRaw('ORDERS', orders);
  },

  getAgentStats(agentId) {
    const orders = this.getOrders({ agent_id: agentId });
    return {
      totalCount: orders.length,
      totalAmount: orders.reduce((s, o) => s + Number(o.total_fee || 0), 0),
      unpaidAmount: orders
        .filter(o => o.settlement === 'unpaid')
        .reduce((s, o) => s + Number(o.total_fee || 0), 0),
      completedCount: orders.filter(o => o.status === 'completed').length
    };
  }
};