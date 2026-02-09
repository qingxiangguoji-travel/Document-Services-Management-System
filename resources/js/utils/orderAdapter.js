// =========================
// 财务列定义（全系统唯一源）
// =========================
export const FINANCE_COLUMNS = [
  'amount',
  'upstream_fee',
  'agent_commission',
  'staff_commission',
  'profit',
  'settlement',
  'remark'
]

// =========================
// 行级财务计算
// =========================
function calcRowFinance(row) {
  const amount =
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

  const profit = amount - upstream - agent - staff

  return {
    amount,
    upstream_fee: upstream,
    agent_commission: agent,
    staff_commission: staff,
    profit,
    settlement: row.is_settled === '是' ? 'paid' : 'unpaid',
    remark: row.row_remark || ''
  }
}

// =========================
// 订单级汇总
// =========================
function calcOrderFinance(rows = []) {
  const total = {
    amount: 0,
    upstream_fee: 0,
    agent_commission: 0,
    staff_commission: 0,
    profit: 0
  }

  rows.forEach(r => {
    const f = r.finance
    total.amount += f.amount
    total.upstream_fee += f.upstream_fee
    total.agent_commission += f.agent_commission
    total.staff_commission += f.staff_commission
  })

  total.profit =
    total.amount -
    total.upstream_fee -
    total.agent_commission -
    total.staff_commission

  return total
}

// =========================
// 保存适配器（页面 → DB）
// =========================
// =========================
// 保存适配器（页面 / DB 对象 → DB）
// =========================
export function normalizeOrderForSave(input) {
  const form = input || {}

  const cleanCustomers = (form.customers || []).map(row => {
    const { _displayNo, __temp, finance, ...rest } = row
    return {
      ...rest,
      fee_visa: Number(row.fee_visa) || 0,
      fee_work: Number(row.fee_work) || 0,
      fee_other: Number(row.fee_other) || 0,
      fine_entry: Number(row.fine_entry) || 0,
      fine_overdue: Number(row.fine_overdue) || 0,
      fine_work: Number(row.fine_work) || 0,
      special_fee: Number(row.special_fee) || 0,
      actual_fee: Number(row.actual_fee) || 0,
      upstream_fee: Number(row.upstream_fee) || 0,
      agent_commission: Number(row.agent_commission) || 0,
      staff_commission: Number(row.staff_commission) || 0
    }
  })

  // ✅ 兼容：页面用 order_no，DB/转单对象可能用 code
  const code = form.code || form.order_no || ''

  return {
    // ===== 基础 =====
    id: form.id,
    code,
    created_at: form.created_at,

    agent_company: form.agent_company || '',
    agent_contact: form.agent_contact || form.agent_id || '',
    service_staff: form.service_staff || '',
    remark: form.remark || '',
    status: form.status || 'Pending',
    customers: cleanCustomers,

    // ✅ 一定要保留：订单流转字段（你转单/列表展示全靠它）
    order_type: form.order_type || 'notify', // notify | confirmed | history
    source_notify_id: form.source_notify_id || null,
    linked_order_id: form.linked_order_id || null,
    converted_at: form.converted_at || null,
    confirmed_at: form.confirmed_at || null,

    // ✅ 可选：保留删除字段（否则删除/回收站也会乱）
    deleted: !!form.deleted,
    deleted_at: form.deleted_at || null
  }
}

// =========================
// 展示适配器（DB → 页面）
// =========================
export function normalizeOrderForView(order) {
  const customers = (order.customers || []).map(row => {
    const finance = calcRowFinance(row)
    return {
      ...row,
      businessType: row.business_type,
      status: row.process_status,
      finance
    }
  })

  const orderFinance = calcOrderFinance(customers)

  return {
    ...order,
    agent: [order.agent_company, order.agent_contact]
      .filter(Boolean)
      .join(' - '),

    customers,
    finance: orderFinance
  }
}
