// resources/js/domain/repositories/fileRepository.ts

export interface FileRecord {
  id: string
  name: string
  category: string

  orderId?: string
  orderCode?: string
  customerName?: string

  // ⭐ 新增代理正式字段（和订单完全一致）
  agent_company_id?: string
  agent_company_name?: string
  agent_contact_id?: string
  agent_contact_name?: string

  fileType: 'image' | 'pdf' | 'other'
  mimeType?: string
  size: number

  dataUrl?: string
  url?: string
  blob?: Blob   // ⭐新增

  uploadedAt: string
  uploadedBy: string
}

export interface FileQuery {
  keyword?: string
  customer?: string
  orderCode?: string
  agentContact?: string
  category?: string
  fileType?: string
  dateRange?: [string, string]
}

export interface CreateFileInput {
  name: string
  category: string

  orderId?: string
  orderCode?: string
  customerName?: string

  agent_company_id?: string
  agent_company_name?: string
  agent_contact_id?: string
  agent_contact_name?: string

  fileType: 'image' | 'pdf' | 'other'
  mimeType?: string
  size: number
  dataUrl: string
  blob?: Blob   // ⭐新增

  uploadedBy: string
}

export type FileCategoryNode = {
  id: string
  label: string
  key: string
  count: number
}

export type FileTypeStat = { key: 'image' | 'pdf' | 'other' | string; count: number }

export type FileGlobalStats = {
  todayCount: number
  brokenCount: number
  typeStats: FileTypeStat[]
}

export type FileStatsBundle = {
  agents: string[]
  categories: FileCategoryNode[]
  global: FileGlobalStats
}

export interface FileRepository {
  list(): Promise<FileRecord[]>
  get(id: string): Promise<FileRecord | null>
  create(input: CreateFileInput): Promise<FileRecord>
  update(id: string, patch: Partial<FileRecord>): Promise<void>
  delete(id: string): Promise<void>

  // ✅ 修正：restore 应该写回快照数据
  restore(file: FileRecord): Promise<void>

  // ✅ 专业扩展：一次扫描返回所有统计（避免页面打开扫库 3 次）
  getStatsBundle?: () => Promise<FileStatsBundle>

  // 兼容老调用（如果你别处还用）
  getAgentOptions?: () => Promise<string[]>
  getCategoryStats?: () => Promise<FileCategoryNode[]>
  getGlobalStats?: () => Promise<FileGlobalStats>
}
