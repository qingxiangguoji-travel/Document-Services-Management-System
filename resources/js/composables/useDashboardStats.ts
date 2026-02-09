import { computed, ref } from 'vue'
import { db } from '@/utils/storage'
import {
  ORDER_STATUSES,
  getStatusDef,
  getStatusGroup
} from '@/domain/orderStatus'

/**
 * 展平后的业务行
 */
export interface FlatRow {
  orderId: string
  orderNo: string
  agent: string
  businessType: string
  status: string
  statusGroup: string
  createdAt: string
}

/**
 * 工具
 */
const todayStr = () => new Date().toISOString().slice(0, 10)

const normalizeDate = (o: any) =>
  (o.created_at || o.date || '').slice(0, 10)

/**
 * 统一读取业务状态
 */
const normalizeStatus = (row: any) => {
  return (
    row.process_status ||
    row.order_status ||
    row.process_state ||
    row.status ||
    row.processStatus ||
    row.processStatusValue ||
    row.statusValue ||
    ORDER_STATUSES.created.systemValue
  )
}



/**
 * 把订单 → 业务行
 */
function flattenOrders(orders: any[]): FlatRow[] {
  const rows: FlatRow[] = []

  orders.forEach(order => {
    const customers = order.customers || []

    customers.forEach((c: any) => {
      const status = normalizeStatus(c)
      const def = getStatusDef(status)

      rows.push({
        orderId: order.id || order.code || order.order_no,
        orderNo: order.code || order.order_no || '-',
        agent: [order.agent_company, order.agent_contact]
          .filter(Boolean)
          .join(' - '),
        businessType: c.businessType || '未知业务',
        status: def.systemValue,
        statusGroup: getStatusGroup(def.systemValue),
        createdAt: normalizeDate(order)
      })
    })
  })

  return rows
}

/**
 * 主入口
 */
export function useDashboardStats() {
  const rawOrders = ref<any[]>([])

  const flatRows = computed(() =>
    flattenOrders(rawOrders.value)
  )

  const stats = computed(() => {
    const today = todayStr()
    const rows = flatRows.value

    const total = rows.length

    const todayNew = rows.filter(
      r => r.createdAt === today
    ).length

    const processing = rows.filter(
      r =>
        r.statusGroup !== 'paid_completed' &&
        r.statusGroup !== 'cancelled'
    ).length

const todayProcessing = rows.filter(
  r =>
    r.statusGroup !== 'paid_completed' &&
    r.statusGroup !== 'cancelled'
).length


    const todayUnfinished = rows.filter(
      r =>
        r.createdAt === today &&
        r.statusGroup !== 'paid_completed'
    ).length

    const completed = rows.filter(
      r => r.statusGroup === 'paid_completed'
    ).length

    return {
      total,
      completed,
      processing,
      todayNew,
      todayProcessing,
      todayUnfinished
    }
  })

  /**
   * 最近订单（按订单聚合，不按业务行）
   */
  const recentOrders = computed(() => {
    const map = new Map()

    flatRows.value.forEach(r => {
      if (!map.has(r.orderNo)) {
        map.set(r.orderNo, {
          code: r.orderNo,
          agent: r.agent,
          businessType: r.businessType,
          status: r.status,
          created_at: r.createdAt
        })
      }
    })

    return Array.from(map.values())
      .sort((a, b) =>
        b.created_at.localeCompare(a.created_at)
      )
      .slice(0, 8)
  })

  /**
   * 业务分布
   */
  const businessTypeStats = computed(() => {
    const map: Record<string, number> = {}

    flatRows.value.forEach(r => {
      map[r.businessType] =
        (map[r.businessType] || 0) + 1
    })

    return map
  })

  /**
   * 加载
   */
const load = () => {
  const primary = db.getRaw('BUSINESS_ORDERS_DATA') || []
  const fallback = db.getRaw('ORDERS') || []

  const all = primary.length ? primary : fallback

  rawOrders.value = all.filter((o: any) => !o.deleted)

  console.log('📦 RAW ORDERS:', rawOrders.value)
}


  return {
    rawOrders,
    flatRows,
    stats,
    recentOrders,
    businessTypeStats,
    load
  }
}
