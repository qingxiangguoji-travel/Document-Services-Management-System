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
      agentContact: input.agentContact,

      fileType: input.fileType,
      mimeType: input.mimeType,
      size: input.size,

      dataUrl: input.dataUrl,
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
}
