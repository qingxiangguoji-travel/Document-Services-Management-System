// resources/js/domain/services/fileService.ts

import { softDelete } from '@/domain/recycleService'
import type {
  FileRepository,
  FileRecord,
  CreateFileInput
} from '@/domain/repositories/fileRepository'

import { FileIndexedDbDriver } from '@/domain/drivers/indexeddb/fileIndexedDbDriver'

// ==================================================
// 仓储切换点（只改这一行即可切存储）
// Local → IndexedDB → API → MySQL
// ==================================================
const repository: FileRepository = new FileIndexedDbDriver()

// ==================================================
// 回收站快照（只存元数据，永不存内容）
// ==================================================
const buildSnapshot = (file: FileRecord) => ({
  id: file.id,
  name: file.name,
  category: file.category,
  orderId: file.orderId,
  orderCode: file.orderCode,
  customerName: file.customerName,
  agentContact: file.agentContact,
  size: file.size,
  uploadedAt: file.uploadedAt,
  uploadedBy: file.uploadedBy,
  fileType: file.fileType
})
// ==================================================
// Service
// ==================================================
export const fileService = {
  // =========================
  // 基础读取
  // =========================
  async list(): Promise<FileRecord[]> {
    return repository.list()
  },

  // =========================
  // 分页读取（生产级接口，占位给 IndexedDB / API Driver）
// =========================
  async listPaged(options: {
    page: number
    pageSize: number
    sortBy?: string
    filters?: Record<string, any>
  }): Promise<{ items: FileRecord[]; total: number }> {
    const repo = repository as any
    if (typeof repo.listPaged === 'function') {
      return repo.listPaged(options)
    }

    // fallback：仓储没实现分页时，前端兜底分页
    const all = await repository.list()
    const start = (options.page - 1) * options.pageSize
    const items = all.slice(start, start + options.pageSize)

    return {
      items,
      total: all.length
    }
  },
  // =========================
// 恢复（回收站 → 真正数据源）
// =========================
async restore(snapshot: FileRecord): Promise<void> {
  const repo = repository as any

  if (typeof repo.restore !== 'function') {
    throw new Error('Repository does not support restore()')
  }

  // 写回 IndexedDB / API / MySQL
  await repo.restore(snapshot)
},

  // =========================
  // 创建 / 上传
  // =========================
  async upload(input: CreateFileInput): Promise<FileRecord> {
    return repository.create(input)
  },

  // =========================
  // 更新
  // =========================
  async update(id: string, patch: Partial<FileRecord>): Promise<void> {
    await repository.update(id, patch)
  },

  async updateCategory(id: string, category: string): Promise<void> {
    await repository.update(id, { category })
  },

  // =========================
  // 删除（原子性保障版）
  // 存储先删 → 再进回收站
  // =========================
  async delete(file: FileRecord, operator = '系统'): Promise<void> {
    // 1. 先删除真实数据（真理源）
    await repository.delete(file.id)

    // 2. 再写审计 / 回收站
    softDelete({
      module: 'file',
      sourceId: file.id,
      snapshot: buildSnapshot(file),
      operator,
      reason: '文件删除'
    })
  },

  // =========================
  // 批量删除（并发版）
  // =========================
  async batchDelete(files: FileRecord[], operator = '系统'): Promise<void> {
    await Promise.all(
      (files || []).map(f => this.delete(f, operator))
    )
  },

  // =========================
  // ZIP 导出（DataURL / Blob 双兼容）
  // =========================
  async exportZip(
    files: FileRecord[],
    zipName?: string
  ): Promise<Blob> {
    const JSZip = (await import('jszip')).default

    const zip = new JSZip()
    const root = zip.folder('客户资料')

    for (const f of files || []) {
      let base64: string | null = null

      // 优先 DataURL
      if (f.dataUrl && String(f.dataUrl).startsWith('data:')) {
        base64 = String(f.dataUrl).split(',')[1] || null
      }

      // Blob 兼容（IndexedDB 存 Blob 时）
      if (!base64 && (f as any).blob instanceof Blob) {
        const buf = await (f as any).blob.arrayBuffer()
        const bytes = new Uint8Array(buf)
        let binary = ''
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i])
        }
        base64 = btoa(binary)
      }

      if (!base64) continue

      root?.file(f.name, base64, { base64: true })
    }

    return zip.generateAsync({ type: 'blob' })
  },

  // =========================
  // 清理失效文件
  // =========================
  async clearBroken(): Promise<number> {
    const list = await repository.list()
    let removed = 0

    for (const f of list) {
      const broken =
        (!f.dataUrl || !String(f.dataUrl).startsWith('data:')) &&
        String(f.url || '').startsWith('blob:')

      if (broken) {
        await repository.delete(f.id)
        removed++
      }
    }

    return removed
  },

  // =========================
  // 内容读取（Blob / DataURL 统一出口）
  // =========================
  async getContent(id: string): Promise<string> {
    const file = await repository.get(id)
    if (!file) {
      throw new Error('文件不存在')
    }

    const anyFile = file as any

    // Blob 优先
    if (anyFile.blob instanceof Blob) {
      return URL.createObjectURL(anyFile.blob)
    }

    // DataURL fallback
    if (file.dataUrl) {
      return file.dataUrl
    }

    return ''
  }
}
