// ===============================
// Order Status Domain Model
// 系统唯一状态真理源
// ===============================

export type StatusColor =
  | 'yellow'
  | 'green'
  | 'cyan'
  | 'red'
  | 'gray'
  | null

export interface OrderStatusDef {
  label: string
  value: string
  color: StatusColor
  editable: boolean
  group: 'created' | 'unpaid' | 'paid' | 'cancelled' | 'returned' | 'other'
}

// ===============================
// 系统唯一状态表
// ===============================

export const ORDER_STATUSES: OrderStatusDef[] = [
  // 新录入
  {
    label: '已录入',
    value: 'created',
    color: 'yellow',
    editable: true,
    group: 'created'
  },

  // 未付
  {
    label: '未付未办理',
    value: 'unpaid_pending',
    color: 'cyan',
    editable: true,
    group: 'unpaid'
  },
  {
    label: '未付办理中',
    value: 'unpaid_processing',
    color: 'cyan',
    editable: true,
    group: 'unpaid'
  },
  {
    label: '未付已完成',
    value: 'unpaid_completed',
    color: 'cyan',
    editable: true,
    group: 'unpaid'
  },

  // 已付
  {
    label: '已付未办理',
    value: 'paid_pending',
    color: 'green',
    editable: true,
    group: 'paid'
  },
  {
    label: '已付办理中',
    value: 'paid_processing',
    color: 'green',
    editable: true,
    group: 'paid'
  },
  {
    label: '已付已完成',
    value: 'paid_completed',
    color: 'green',
    editable: true,
    group: 'paid'
  },

  // 特殊态
  {
    label: '已送回',
    value: 'returned',
    color: 'gray',
    editable: true,
    group: 'returned'
  },
  {
    label: '已取消',
    value: 'cancelled',
    color: 'red',
    editable: true,
    group: 'cancelled'
  }
]

// ===============================
// 工具函数
// ===============================

export function getStatusDef(code?: string) {
  return ORDER_STATUSES.find(s => s.value === code)
}

export function getStatusColor(code?: string): StatusColor {
  return getStatusDef(code)?.color || null
}

export function isStatusEditable(code?: string): boolean {
  const def = getStatusDef(code)
  return def ? def.editable : false
}

export function getStatusOptions() {
  return ORDER_STATUSES.map(s => ({
    label: s.label,
    value: s.value
  }))
}

/**
 * Orders.vue 统计用
 * 返回分组标识
 */
export function getStatusGroup(code?: string) {
  return getStatusDef(code)?.group || 'other'
}
