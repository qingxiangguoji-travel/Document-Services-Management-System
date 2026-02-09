import { db } from '@/utils/storage'
import type { RecycleRecord } from '@/domain/recycleBin'

export function restoreRecord(record: RecycleRecord) {
  switch (record.module) {
    case 'order':
      return restoreOrder(record)
    case 'agent':
      return restoreAgent(record)
    case 'certificate':
      return restoreBusinessRow(record)
    case 'file':
      return restoreFile(record)
    default:
      throw new Error('未知模块，无法恢复')
  }
}

// =======================
// 订单恢复
// =======================
function restoreOrder(record: RecycleRecord) {
  const orders = db.getRaw('ORDERS') || []
  const exists = orders.some(o => o.id === record.sourceId)

  if (!exists) {
    orders.push(record.snapshot)
    db.saveRaw('ORDERS', orders)
  }

  // 如果你有业务拆表
  const business = db.getRaw('BUSINESS_ORDERS_DATA') || []
  const bizExists = business.some(b => b.order_id === record.sourceId)

  if (!bizExists && record.snapshot?.businessRows) {
    record.snapshot.businessRows.forEach(row => {
      business.push({
        ...row,
        order_id: record.sourceId
      })
    })
    db.saveRaw('BUSINESS_ORDERS_DATA', business)
  }
}

// =======================
// 代理恢复
// =======================
function restoreAgent(record: RecycleRecord) {
  const agents = db.getRaw('AGENTS') || []
  const exists = agents.some(a => a.id === record.sourceId)

  if (!exists) {
    agents.push(record.snapshot)
    db.saveRaw('AGENTS', agents)
  }
}

// =======================
// 业务行恢复
// =======================
function restoreBusinessRow(record: RecycleRecord) {
  const business = db.getRaw('BUSINESS_ORDERS_DATA') || []
  const exists = business.some(b => b.id === record.sourceId)

  if (!exists) {
    business.push(record.snapshot)
    db.saveRaw('BUSINESS_ORDERS_DATA', business)
  }
}

// =======================
// 文件恢复
// =======================
function restoreFile(record: RecycleRecord) {
  const files = db.getRaw('FILES_DATA') || []
  const exists = files.some(f => f.id === record.sourceId)

  if (!exists) {
    files.push(record.snapshot)
    db.saveRaw('FILES_DATA', files)
  }
}
