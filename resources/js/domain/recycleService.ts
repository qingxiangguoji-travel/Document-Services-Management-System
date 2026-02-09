import { moveToRecycle, hardDelete } from './recycleBin'
import { agentAdapter } from './adapters/agentAdapter'
import { orderAdapter } from './adapters/orderAdapter'
import { fileAdapter } from './adapters/fileAdapter'
import { db } from '@/utils/storage'




// =======================
// ⭐订单删除快照构建器（正式版）
// =======================
function buildOrderSnapshot(order: any) {
  return {
    ...order,

    // ⭐统一代理字段（兼容所有历史字段）
    agent_company_id: order.agent_company_id || '',
    agent_contact_id: order.agent_contact_id || '',

    agent_company_name:
      order.agent_company_name ||
      order.agent_company ||
      '',

    agent_contact_name:
      order.agent_contact_name ||
      order.agent_contact ||
      ''
  }
}




const adapterMap: Record<string, any> = {
  agent: agentAdapter,
  order: orderAdapter,
  certificate: orderAdapter, // 证件和订单共用存储
  file: fileAdapter
}

// =======================
// 软删除
// =======================
export function softDelete(payload: {
  module: 'agent' | 'order' | 'certificate' | 'file'
  sourceId: string
  snapshot: any
  operator?: string
  reason?: string
}) {
  const adapter = adapterMap[payload.module]
  if (!adapter) throw new Error(`未注册模块: ${payload.module}`)

let snapshot = payload.snapshot

// ⭐订单模块必须使用正式快照
if (payload.module === 'order') {
  snapshot = buildOrderSnapshot(payload.snapshot)
}


  // 1. 写入回收站
  moveToRecycle(
    payload.module,
    payload.sourceId,
    snapshot,
    {
      deletedBy: payload.operator || 'system',
      reason: payload.reason
    }
  )

  // 2. 从业务系统删除
  const ok = adapter.delete(payload.sourceId)
  if (!ok) {
    throw new Error(`[recycleService] 删除失败: ${payload.module} ${payload.sourceId}`)
  }
}

// =======================
// 恢复
// =======================
export function restoreRecycleRecord(record: any): boolean {
  const adapter = adapterMap[record.module]
  if (!adapter) throw new Error(`未注册模块: ${record.module}`)

  try {
    // 1️⃣ 写回 Adapter
    const ok = adapter.restore(record.snapshot)
    if (ok === false) return false

    // ⭐⭐⭐ 2️⃣ 关键补丁：写回 ORDERS 主库 ⭐⭐⭐
    if (record.module === 'order') {
      const raw = db.getRaw('ORDERS') || []

      const existIndex = raw.findIndex(
        o => String(o.id) === String(record.snapshot.id)
      )

      if (existIndex === -1) {
        raw.push({
          ...record.snapshot,
          deleted: false
        })
      } else {
        raw[existIndex] = {
          ...record.snapshot,
          deleted: false
        }
      }

      db.saveRaw('ORDERS', raw)
    }

    // 3️⃣ 从回收站移除
    hardDelete(record.id)

    return true
  } catch (e) {
    console.error('[restoreRecycleRecord] failed', e)
    return false
  }
}



// =======================
// 彻底删除（给 UI 用）
// =======================
export function softHardDelete(recycleId: string): boolean {
  return hardDelete(recycleId)
}
