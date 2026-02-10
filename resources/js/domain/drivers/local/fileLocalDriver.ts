// resources/js/domain/drivers/local/fileLocalDriver.ts
import { db } from '@/utils/storage'
import type { FileRecord, CreateFileInput, FileRepository } from '@/domain/repositories/fileRepository'

export class FileLocalDriver implements FileRepository {
  async list(): Promise<FileRecord[]> {
    return db.getFiles() || []
  }

  async get(id: string): Promise<FileRecord | null> {
    const list = db.getFiles() || []
    return list.find(f => String(f.id) === String(id)) || null
  }

  async create(input: CreateFileInput): Promise<FileRecord> {
    const list = db.getFiles() || []

    const record: FileRecord = {
      id: Date.now() + '_' + Math.random().toString(36).slice(2),
      name: input.name,
      category: input.category,

      orderId: input.orderId,
      orderCode: input.orderCode,
customerName: input.customerName,

// ⭐企业版代理字段（只认新字段）
agent_company_id: input.agent_company_id || '',
agent_company_name: input.agent_company_name || '',
agent_contact_id: input.agent_contact_id || '',
agent_contact_name: input.agent_contact_name || '',


      fileType: input.fileType,
      mimeType: input.mimeType,
      size: input.size,

      dataUrl: '', 
blob: input.blob,
      url: '',

      uploadedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      uploadedBy: input.uploadedBy || 'system'
    }

    list.push(record)
    db.saveFiles(list)

    return record
  }

  async update(id: string, patch: Partial<FileRecord>): Promise<void> {
    const list = db.getFiles() || []
    const idx = list.findIndex(f => String(f.id) === String(id))
    if (idx === -1) return

    list[idx] = { ...list[idx], ...patch }
    db.saveFiles(list)
  }

  async delete(id: string): Promise<void> {
    const list = db.getFiles() || []
    const next = list.filter(f => String(f.id) !== String(id))
    db.saveFiles(next)
  }

  async restore(_id: string): Promise<void> {
    // LocalDriver 不负责 restore
    // restore 由 recycleService + adapter 完成
  }
  async getStatsBundle() {
  const list = db.getFiles() || []

  const agentSet = new Set<string>()
  const catMap = new Map<string, number>()
  const typeMap = new Map<string, number>()

  const today = new Date().toISOString().slice(0, 10)
  let todayCount = 0
  let brokenCount = 0

  for (const f of list) {
    const label = [f.agent_company_name, f.agent_contact_name].filter(Boolean).join(' - ').trim()
    if (label) agentSet.add(label)

    const cat = f.category || '未分类'
    catMap.set(cat, (catMap.get(cat) || 0) + 1)

    const ft = f.fileType || 'other'
    typeMap.set(ft, (typeMap.get(ft) || 0) + 1)

    if (String(f.uploadedAt || '').startsWith(today)) todayCount++
    if (!f.dataUrl && String(f.url || '').startsWith('blob:')) brokenCount++
  }

  const categories = Array.from(catMap.entries()).map(([key, count]) => ({
    id: key,
    label: `${key} (${count})`,
    key,
    count
  }))

  return {
    agents: Array.from(agentSet).sort((a, b) => a.localeCompare(b)),
    categories,
    global: {
      todayCount,
      brokenCount,
      typeStats: Array.from(typeMap.entries()).map(([key, count]) => ({ key, count }))
    }
  }
}

  
}
