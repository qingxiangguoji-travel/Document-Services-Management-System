// resources/js/utils/finance.ts

/**
 * 统一财务计算引擎
 * 所有页面必须从这里取金额和利润
 */

export function calcRowFinance(row: any) {
  const feeTotal =
    (Number(row.fee_visa) || 0) +
    (Number(row.fee_work) || 0) +
    (Number(row.fee_other) || 0) +
    (Number(row.fine_entry) || 0) +
    (Number(row.fine_overdue) || 0) +
    (Number(row.fine_work) || 0) +
    (Number(row.special_fee) || 0)

  const upstream = Number(row.upstream_fee) || 0
  const agent = Number(row.agent_commission) || 0
  const staff = Number(row.staff_commission) || 0

  return {
    feeTotal,
    upstream,
    agent,
    staff,
    profit: feeTotal - upstream - agent - staff
  }
}

export function calcOrderFinance(customers: any[] = []) {
  return customers.reduce(
    (acc, row) => {
      const f = calcRowFinance(row)
      acc.total_fee += f.feeTotal
      acc.upstream_fee += f.upstream
      acc.agent_commission += f.agent
      acc.staff_commission += f.staff
      acc.profit += f.profit
      return acc
    },
    {
      total_fee: 0,
      upstream_fee: 0,
      agent_commission: 0,
      staff_commission: 0,
      profit: 0
    }
  )
}

/**
 * 保证每一行都有财务字段
 * 老数据不崩
 */
export function normalizeFinanceRow(row: any) {
  return {
    ...row,
    agent_commission: Number(row.agent_commission) || 0,
    staff_commission: Number(row.staff_commission) || 0
  }
}

/**
 * 构建订单视图模型（列表页用）
 */
export function buildOrderFinanceView(order: any) {
  const customers = (order.customers || []).map(normalizeFinanceRow)
  const finance = calcOrderFinance(customers)

  return {
    ...order,
    customers,
    finance
  }
}

/**
 * 构建客户视图模型（搜索客户用）
 */
export function buildCustomerFinanceView(order: any, row: any) {
  const f = calcRowFinance(row)

  return {
    ...order,
    finance: {
      total_fee: f.feeTotal,
      upstream_fee: f.upstream,
      agent_commission: f.agent,
      staff_commission: f.staff,
      profit: f.profit
    }
  }
}
