// resources/js/domain/services/orderMigrationService.ts
import * as XLSX from 'xlsx'
import { db } from '@/utils/storage'
import { resolveAgent } from './agentMatchingService'

const createImportBatchId = () => {
  const now = new Date()
  return `IMPORT_${now.toISOString().replace(/[:.]/g,'-')}`
}


// ================== 工具 ==================
const uid = (p = 'id') => `${p}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

/** 多键名取值（对齐 Create.vue 的 findValueByKeys 思路） */
const pick = (row: any, keys: string[]) => {
  const rowKeys = Object.keys(row || {})
  for (const k of keys) {
    const target = String(k).toLowerCase().replace(/\s/g, '')
    const foundKey = rowKeys.find(rk =>
      String(rk).toLowerCase().replace(/\s/g, '').includes(target)
    )
    if (foundKey !== undefined && row[foundKey] !== '' && row[foundKey] !== undefined) {
      return row[foundKey]
    }
  }
  return ''
}

/** 金额安全解析：支持 $ 逗号 空格 等 */
const num = (v: any) => {
  if (v === null || v === undefined || v === '') return 0
  const s = String(v).replace(/[^\d.-]/g, '')
  const n = Number(s)
  return isNaN(n) ? 0 : n
}

/** Excel 序列号 → YYYY-MM-DD（避免时区导致前一天） */
const excelSerialToYMD = (serial: number) => {
  // Excel 以 1899-12-30 为 0（兼容常见算法）
  const utcDays = Math.floor(serial - 25569)
  const utcMs = utcDays * 86400 * 1000
  const d = new Date(utcMs)
  // 用 UTC 取年月日，避免 +07 推前一天
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** 日期格式化：支持 Excel 数字 / 中文 / 2026-02-04 / 2026/02/04 */
const formatExcelDate = (val: any) => {
  if (!val) return ''

  if (typeof val === 'number' && !isNaN(val)) {
    return excelSerialToYMD(val)
  }

  const str = String(val)
    .trim()
    .replace('年', '-')
    .replace('月', '-')
    .replace('日', '')
    .replace(/[./]/g, '-')

  const d = new Date(str)
  if (isNaN(d.getTime())) return ''

  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// ================== 第一列识别日期 or 订单号 ==================
export function resolveBusinessDate(anchor: any, lastDate?: string) {
  const raw = String(anchor || '').trim()
  if (!raw) return lastDate || null

  // Excel 数字日期（可能是数字或数字字符串）
  if (!isNaN(Number(raw))) {
    const n = Number(raw)
    if (n > 20000 && n < 60000) {
      return excelSerialToYMD(n)
    }
  }

  // 标准日期
  const direct = new Date(raw)
  if (!isNaN(direct.getTime())) {
    const y = direct.getFullYear()
    const m = String(direct.getMonth() + 1).padStart(2, '0')
    const d = String(direct.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  // 中文日期
  const zh = raw.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/)
  if (zh) {
    const [, y, m, d] = zh
    const dd = new Date(Number(y), Number(m) - 1, Number(d))
    const yy = dd.getFullYear()
    const mm = String(dd.getMonth() + 1).padStart(2, '0')
    const day = String(dd.getDate()).padStart(2, '0')
    return `${yy}-${mm}-${day}`
  }

  // 订单号反解 QXYYMMDDxxxx
  const code = raw.match(/QX(\d{6})/i)
  if (code) {
    const s = code[1]
    const y = 2000 + Number(s.slice(0, 2))
    const m = Number(s.slice(2, 4))
    const d = Number(s.slice(4, 6))
    const mm = String(m).padStart(2, '0')
    const dd = String(d).padStart(2, '0')
    return `${y}-${mm}-${dd}`
  }

  return lastDate || null
}

// ================== 订单号生成 ==================
const nextOrderCode = (date: string) => {
  const raw = db.getRaw('ORDERS') || []
  const prefix = `QX${date.replace(/-/g, '').slice(2)}`

  let max = 0
  raw.forEach(o => {
    if (String(o.code || '').startsWith(prefix)) {
      const m = String(o.code).match(/(\d{4})$/)
      if (m) max = Math.max(max, Number(m[1]))
    }
  })

  return `${prefix}${String(max + 1).padStart(4, '0')}`
}

// ================== 标准业务行模型（对齐 Create.vue 的字段） ==================
const createRow = (agentContact = '') => ({
  id: uid('row'),
  customer_id: uid('cust'),

  name: '',
  passport: '',
  alias_no: '',
  nationality: '',

  passport_expiry: '',
  entry_date: '',
  visa_expiry: '',

  has_work_permit: '无',
  agent_contact: agentContact,

  business_seq: 1,
  business_type: '',

  fee_visa: null,
  fee_work: null,
  fee_other: null,

  fine_entry: null,
  fine_overdue: null,
  fine_work: null,
  special_fee: null,

  actual_fee: null,
  is_settled: '否',
  row_remark: '',

  upstream_name: '',
  upstream_time: '',
  upstream_fee: null,
  upstream_is_settled: '否',
  upstream_remark: '',

  process_status: 'Pending',
  business_end_time: '',
  business_return_time: '',

  files: []
})

// ================== 解析文件 ==================
const parseFile = async (file: File) => {
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array' })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  return XLSX.utils.sheet_to_json(sheet, { defval: '' })
}

// ================== 预演 ==================
export async function dryRunMigrate(file: File) {
  const rows: any[] = await parseFile(file)

  let lastDate: string | null = null
  const groups = new Map<string, any>()

  rows.forEach((row, idx) => {
    const anchor = row[Object.keys(row)[0]]
    const date = resolveBusinessDate(anchor, lastDate)
    if (date) lastDate = date

    const agentRaw = pick(row, ['代理联系人', '代理'])
    const agent = resolveAgent(agentRaw)

    if (!date || !agent.company) return

    const key = `${date}__${agent.company}__${agent.contact}`
    if (!groups.has(key)) {
      groups.set(key, { date, agent, customers: [] })
    }

    groups.get(key).customers.push({ ...row, __rowIndex: idx })
  })

  return Array.from(groups.values()).map(g => ({
    date: g.date,
    agent: g.agent,
    preview_order_code: nextOrderCode(g.date),
    rows: g.customers.length
  }))
}

// ================== 提交写入 ==================
export async function commitMigrate(file: File) {
  const rows: any[] = await parseFile(file)

  let lastDate: string | null = null
  const groups = new Map<string, any>()

  rows.forEach((row) => {
    const anchor = row[Object.keys(row)[0]]
    const date = resolveBusinessDate(anchor, lastDate)
    if (date) lastDate = date

    const agentRaw = pick(row, ['代理联系人', '代理'])
    const agent = resolveAgent(agentRaw)

    if (!date || !agent.company) return

    const key = `${date}__${agent.company}__${agent.contact}`
    if (!groups.has(key)) {
      groups.set(key, { date, agent, customers: [] })
    }

    groups.get(key).customers.push(row)
  })

  const rawOrders = db.getRaw('ORDERS') || []
  const created: any[] = []

  for (const g of groups.values()) {
    const code = nextOrderCode(g.date)

 const batchId = createImportBatchId()

const order = {
  id: uid('order'),
  code,
  created_at: g.date,
  created_seq: Date.now(),

  // ⭐ 新增（非常关键）
  import_batch_id: batchId,
  imported_at: new Date().toISOString(),


      service_staff: '系统导入',

      agent_company: g.agent.company,
      agent_contact: g.agent.contact,
      agent_raw: g.agent.raw,
      agent_match_score: g.agent.confidence,

      // 🔥 对齐 Create.vue 的订单字段（最少必需）
      order_type: 'history-notify',
      status: 'Pending',

      customers: [],
      remark: '',
      deleted: false
    }

    g.customers.forEach((row, idx) => {
      // ====== 对齐“你导出的表头” ======
      const name = pick(row, ['护照名字', '客户姓名', '姓名', '名字', 'Name'])
      const passport = pick(row, ['护照号', '护照', 'Passport'])
      const aliasNo = pick(row, ['化名/员工编号', '化名', '员工编号', 'Alias'])
      const nationality = pick(row, ['国籍', '国家', 'Nationality'])

      const passportExpiry = formatExcelDate(pick(row, ['护照到期日', '护照到期', '护照有效']))
      const entryDate = formatExcelDate(pick(row, ['入境时间', '入境日期']))
      const visaExpiry = formatExcelDate(pick(row, ['签证到期时间', '签证到期', '签证有效']))

      const businessType = pick(row, ['业务类型', 'Type'])

      // ====== 费用列（对齐 handleExport 的列名） ======
      const feeVisa = num(pick(row, ['续签办理费', '签证费', 'Visa Fee']))
      const feeWork = num(pick(row, ['劳工证办理费', '劳工证费', 'Work Permit Fee']))
      const feeOther = num(pick(row, ['其他费用', '其他费', 'Other Fee']))
      const fineEntry = num(pick(row, ['入境罚款', 'Entry Fine']))
      const fineOverdue = num(pick(row, ['逾期罚款', 'Overdue Fine']))
      const fineWork = num(pick(row, ['劳工证罚款', 'Work Fine']))
      const specialFee = num(pick(row, ['特殊处理费用', '特殊费用', '特殊费', 'Special Fee']))

      const actualFee = num(pick(row, ['实收金额', '实收', 'Actual']))
      const isSettled = pick(row, ['是否结算', '结算', '已结']) || '否'
      const remark = pick(row, ['备注', 'Remark'])

      // ====== 进度/上游（对齐导出字段） ======
      const upstreamName = pick(row, ['上游端', '上游名称', 'Upstream'])
      const upstreamTime = formatExcelDate(pick(row, ['办理业务时间', '办理业务日期']))
      const upstreamFee = num(pick(row, ['上游端结算费用', '上游费用']))
      const upstreamIsSettled = pick(row, ['上游是否结算', '上游结算']) || '否'
      const upstreamRemark = pick(row, ['上游备注'])

      const processStatus = pick(row, ['办理状态', '状态']) || 'Pending'
      const businessEndTime = formatExcelDate(pick(row, ['业务结束时间']))
      const businessReturnTime = formatExcelDate(pick(row, ['业务返回时间']))

      const r = createRow(g.agent.contact)

      // customer_id：用 护照+姓名 做稳定 ID（对齐 Create.vue 的理念）
      const stableBase = `${passport || ''}_${name || ''}`
        .trim()
        .replace(/\s+/g, '_')
        .replace(/[^\w]/g, '')
      r.customer_id = stableBase ? `cust_${stableBase}` : r.customer_id

      order.customers.push({
        ...r,

        name,
        passport,
        alias_no: aliasNo,
        nationality,

        passport_expiry: passportExpiry,
        entry_date: entryDate,
        visa_expiry: visaExpiry,

        has_work_permit: pick(row, ['有无劳工证', '劳工证', 'Work Permit']) || '无',

        business_seq: idx + 1,
        business_type: businessType,

        fee_visa: feeVisa,
        fee_work: feeWork,
        fee_other: feeOther,
        fine_entry: fineEntry,
        fine_overdue: fineOverdue,
        fine_work: fineWork,
        special_fee: specialFee,

        actual_fee: actualFee,
        is_settled: isSettled,

        upstream_name: upstreamName,
        upstream_time: upstreamTime,
        upstream_fee: upstreamFee,
        upstream_is_settled: upstreamIsSettled,
        upstream_remark: upstreamRemark,

        process_status: processStatus,
        business_end_time: businessEndTime,
        business_return_time: businessReturnTime,

        row_remark: remark
      })
    })

    rawOrders.unshift(order)
    created.push(order)
  }

db.saveRaw('ORDERS', rawOrders)

return {
  batchId,
  orders: created
}
}
