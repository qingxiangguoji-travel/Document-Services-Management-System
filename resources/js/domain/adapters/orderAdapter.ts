import { db } from '@/utils/storage'

export const orderAdapter = {
  restore(snapshot: any): boolean {
    if (!snapshot) {
      console.error('[orderAdapter] 快照为空')
      return false
    }

    try {
      const orders = db.getRaw('ORDERS') || []
      const exists = orders.some(o => String(o.id) === String(snapshot.id))

      if (!exists) {
        orders.push(snapshot)
        db.saveRaw('ORDERS', orders)
      }

      return true
    } catch (e) {
      console.error('[orderAdapter] 恢复失败', e)
      return false
    }
  },

  delete(sourceId: string): boolean {
    try {
      const orders = db.getRaw('ORDERS') || []
      const next = orders.filter(o => String(o.id) !== String(sourceId))

      if (next.length === orders.length) {
        console.warn('[orderAdapter] 删除失败，未找到ID:', sourceId)
        return false
      }

      db.saveRaw('ORDERS', next)
      return true
    } catch (e) {
      console.error('[orderAdapter] 删除异常', e)
      return false
    }
  }
}
