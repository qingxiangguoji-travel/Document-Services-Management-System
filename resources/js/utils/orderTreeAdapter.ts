import { calcRowFinance, calcOrderFinance } from '@/utils/finance'

/**
 * 展平后的业务行（用于列表页渲染）
 */
export interface FlatBizRow {
  __rowType: 'order' | 'row'
  __orderId: string
  __orderCode: string
  __agentCompany: string
  __agentContact: string
  __createdAt: string
  __statusInfo?: { lines: string[]; type: string }

  // 客户字段
  customer_id?: string
  name?: string
  passport?: string
  alias_no?: string
  nationality?: string
  passport_expiry?: string
  visa_expiry?: string
  has_work_permit?: string
  business_type?: string

  // 费用
  fee_visa?: number
  fee_work?: number
  fee_other?: number
  fine_entry?: number
  fine_overdue?: number
  fine_work?: number
  special_fee?: number
  upstream_fee?: number
  agent_commission?: number
  staff_commission?: number
  settlement?: string
  row_remark?: string
  process_status?: string

  // 汇总
  finance: {
    amount: number
    upstream_fee: number
    agent_commission: number
    staff_commission: number
    profit: number
  }
}

/**
 * 生成费用明细字符串（只显示有值的项）
 */
export function buildFeeDetail(row: any): string {
  const parts: string[] = []

  const push = (label: string, val: any) => {
    const n = Number(val) || 0
    if (n > 0) parts.push(`${label} $${n}`)
  }

  push('签证费', row.fee_visa)
  push('劳工证费', row.fee_work)
  push('其他费', row.fee_other)
  push('入境罚款', row.fine_entry)
  push('逾期罚款', row.fine_overdue)
  push('劳工证罚款', row.fine_work)
  push('特殊费用', row.special_fee)

  return parts.join(' | ') || '-'
}

/**
 * 订单 → 扁平行
 * 第一行 = 订单行（用于折叠显示）
 * 后续 = 业务行（谷歌表格风格）
 */
export function buildFlatOrderRows(
  orders: any[],
  getStatusInfo: (rows: any[]) => { lines: string[]; type: string },
  getSettlement: (rows: any[]) => string
): FlatBizRow[] {
  const result: FlatBizRow[] = []

  orders.forEach(order => {
    if (order.deleted) return

    const rows = order.customers || []
    const orderFinance = calcOrderFinance(rows)
    const statusInfo = getStatusInfo(rows)

    // 订单行
    result.push({
      __rowType: 'order',
      __orderId: order.id,
      __orderCode: order.code,
      __agentCompany: order.agent_company,
      __agentContact: order.agent_contact,
      __createdAt: order.created_at,
      __statusInfo: statusInfo,
      settlement: getSettlement(rows),
      finance: {
        amount: orderFinance.total_fee,
        upstream_fee: orderFinance.upstream_fee,
        agent_commission: orderFinance.agent_commission,
        staff_commission: orderFinance.staff_commission,
        profit: orderFinance.profit
      }
    })

    // 业务行
    rows.forEach(r => {
      const f = calcRowFinance(r)

      result.push({
        __rowType: 'row',
        __orderId: order.id,
        __orderCode: order.code,
        __agentCompany: order.agent_company,
        __agentContact: order.agent_contact,
        __createdAt: order.created_at,

        customer_id: r.customer_id,
        name: r.name,
        passport: r.passport,
        alias_no: r.alias_no,
        nationality: r.nationality,
        passport_expiry: r.passport_expiry,
        visa_expiry: r.visa_expiry,
        has_work_permit: r.has_work_permit,
        business_type: r.business_type,

        fee_visa: r.fee_visa,
        fee_work: r.fee_work,
        fee_other: r.fee_other,
        fine_entry: r.fine_entry,
        fine_overdue: r.fine_overdue,
        fine_work: r.fine_work,
        special_fee: r.special_fee,

        upstream_fee: r.upstream_fee,
        agent_commission: r.agent_commission || 0,
        staff_commission: r.staff_commission || 0,
        settlement: r.settlement || r.is_settled,
        row_remark: r.row_remark,
        process_status: r.process_status,

        finance: {
          amount: f.feeTotal,
          upstream_fee: f.upstream,
          agent_commission: f.agent,
          staff_commission: f.staff,
          profit: f.profit
        }
      })
    })
  })

  return result
}
