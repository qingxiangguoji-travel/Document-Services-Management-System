// 统一业务状态 → 行底色映射
// Create.vue / Orders.vue / OrderTable 共用

export type ProcessStatus =
  | 'created'
  | 'unpaid_processing'
  | 'unpaid_completed'
  | 'paid_processing'
  | 'paid_completed'
  | 'returned'
  | 'cancelled'
  | string

/**
 * 返回表格行 CSS class
 */
export function getStatusColor(status?: ProcessStatus): string {
  if (!status) return ''

  switch (status) {
    case 'created':
      return 'row-yellow'

    case 'paid_processing':
    case 'paid_completed':
      return 'row-green'

    case 'unpaid_processing':
    case 'unpaid_completed':
      return 'row-cyan'

    case 'cancelled':
      return 'row-red'

    case 'returned':
      return 'row-gray'

    default:
      return ''
  }
}

/**
 * 给 Orders.vue 用的统计分类
 */
export function getStatusGroup(status?: ProcessStatus) {
  if (!status) return 'unknown'

  if (status === 'created') return 'created'
  if (status === 'cancelled') return 'cancelled'
  if (status === 'returned') return 'returned'

  if (status?.startsWith('paid')) return 'paid'
  if (status?.startsWith('unpaid')) return 'unpaid'

  return 'unknown'
}
