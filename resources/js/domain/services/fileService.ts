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

  // ⭐正式代理模型
  agent_company_id: file.agent_company_id,
  agent_company_name: file.agent_company_name,
  agent_contact_id: file.agent_contact_id,
  agent_contact_name: file.agent_contact_name,

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
  // ⭐企业版：统一写入代理冗余字段
  const record: CreateFileInput = {
    ...input,

    agent_company_id: input.agent_company_id || '',
    agent_company_name: input.agent_company_name || '',
    agent_contact_id: input.agent_contact_id || '',
    agent_contact_name: input.agent_contact_name || ''
  }

  return repository.create(record)
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
  
  
  // ==================================================
// ⭐行业核心：保存订单时绑定草稿文件
// ==================================================
async bindDraftFilesToOrder(
  draftId: string,
  order: {
    id: string
    order_no: string
    customerName?: string
    agent_company_id?: string
    agent_company_name?: string
    agent_contact_id?: string
    agent_contact_name?: string
  }
): Promise<void> {
  if (!draftId) return

  const files = await repository.list()

  const draftFiles = files.filter(f => String(f.draftId) === String(draftId))
  if (!draftFiles.length) {
    console.log('[FileService] 没有找到草稿文件:', draftId)
    return
  }

  console.log(`[FileService] 正在绑定 ${draftFiles.length} 个草稿文件到订单 ${order.id}`)

  for (const f of draftFiles) {
    await repository.update(f.id, {
      // ⭐⭐⭐ 关键：清除草稿标记 ⭐⭐⭐
      draftId: '',

      // ⭐⭐⭐ 绑定到正式订单 ⭐⭐⭐
      orderId: order.id,
      orderCode: order.order_no,

      customerName: order.customerName || f.customerName || '',

      // ⭐⭐⭐ 补全代理字段（防止遗漏）⭐⭐⭐
      agent_company_id: order.agent_company_id || f.agent_company_id || '',
      agent_company_name: order.agent_company_name || f.agent_company_name || '',
      agent_contact_id: order.agent_contact_id || f.agent_contact_id || '',
      agent_contact_name: order.agent_contact_name || f.agent_contact_name || ''
    })
  }

  console.log('[FileService] 草稿文件绑定完成')
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
  },
// ✅ 新增：一次性拿到全部统计（优先走 repository.getStatsBundle）
async getStatsBundle() {
  const repo: any = repository

  if (typeof repo.getStatsBundle === 'function') {
    return repo.getStatsBundle()
  }

  // fallback：老仓储没实现 bundle，就退化成 3 次（但我们后面会让 driver 实现）
  const [agents, categories, global] = await Promise.all([
    repo.getAgentOptions?.() ?? Promise.resolve([]),
    repo.getCategoryStats?.() ?? Promise.resolve([]),
    repo.getGlobalStats?.() ?? Promise.resolve({ todayCount: 0, brokenCount: 0, typeStats: [] })
  ])

  return { agents, categories, global }
},

// ✅ 旧接口兼容：全部从 bundle 取，避免重复扫库
async getAgentOptions() {
  const b = await this.getStatsBundle()
  return b.agents
},

async getCategoryStats() {
  const b = await this.getStatsBundle()
  return b.categories
},

async getGlobalStats() {
  const b = await this.getStatsBundle()
  return b.global
},
// =========================
// 按订单读取（只取元数据）
// 专供 Drawer 使用（避免全库读取）
// =========================
async listByOrder(orderId?: string, orderCode?: string) {
  const res = await this.listPaged({
    page: 1,
    pageSize: 9999,
    filters: {
      orderCode: orderCode || '',
    }
  })

  // 再过滤 orderId（兼容旧数据）
  return (res.items || []).filter(f =>
    String(f.orderId || '') === String(orderId || '') ||
    String(f.orderCode || '') === String(orderCode || '')
  )
},
// =========================
// 删除草稿订单全部文件 ⭐
// =========================
async deleteDraftFiles(draftId: string) {
  if (!draftId) return

  const res = await this.listPaged({
    page: 1,
    pageSize: 9999
  })

  const draftFiles = (res.items || []).filter(f =>
    // ✅ 新数据：草稿字段
    String((f as any).draftId || '') === String(draftId) ||
    // ✅ 旧数据兼容：曾经把 draftId 写到 orderId
    String((f as any).orderId || '') === String(draftId)
  )

  if (!draftFiles.length) return

  await Promise.all(draftFiles.map(f => repository.delete(f.id)))
},

}
