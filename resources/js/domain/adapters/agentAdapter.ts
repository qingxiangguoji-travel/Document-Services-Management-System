import { db } from '@/utils/storage'

function normalizeId(id: any): string {
  return String(id ?? '').trim()
}

function ensureId(snapshot: any) {
  if (!snapshot.id) {
    snapshot.id = Date.now()
    console.warn('[agentAdapter] 快照缺少ID，已自动补ID:', snapshot.id)
  }
}

export const agentAdapter = {
  // =========================
  // 恢复代理
  // =========================
  restore(snapshot: any): boolean {
    if (!snapshot) {
      console.error('[agentAdapter] 恢复失败：快照为空')
      return false
    }

    try {
      ensureId(snapshot)

      const agents = db.getAgents()
      const sid = normalizeId(snapshot.id)

      const exists = agents.some(a => normalizeId(a.id) === sid)
      if (exists) {
        console.warn('[agentAdapter] 已存在代理，跳过恢复:', sid)
        return true
      }

      // 统一走系统标准写入逻辑
      db.saveAgent(snapshot)

      console.log('[agentAdapter] 恢复成功:', snapshot)
      return true
    } catch (e) {
      console.error('[agentAdapter] 恢复异常', e, snapshot)
      return false
    }
  },

  // =========================
  // 删除代理（软删除前的业务删除）
  // =========================
  delete(sourceId: string): boolean {
    if (!sourceId) {
      console.error('[agentAdapter] 删除失败：sourceId 为空')
      return false
    }

    try {
      const agents = db.getAgents()
      const sid = normalizeId(sourceId)

      const next = agents.filter(a => normalizeId(a.id) !== sid)

      // 如果长度没变，说明没删到
      if (next.length === agents.length) {
        console.warn('[agentAdapter] 未找到要删除的代理:', sid)
        return false
      }

      // ✅ 永远通过 DB_KEYS 映射写入
      db.saveRaw('AGENTS', next)

      console.log('[agentAdapter] 删除成功:', sid)
      return true
    } catch (e) {
      console.error('[agentAdapter] 删除异常', e, sourceId)
      return false
    }
  }
}
