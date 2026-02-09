// resources/js/domain/repositories/fileRepository.ts

export interface FileRecord {
  id: string
  name: string
  category: string

  orderId?: string
  orderCode?: string
  customerName?: string
  agentContact?: string

  fileType: 'image' | 'pdf' | 'other'
  mimeType?: string
  size: number

  dataUrl?: string
  url?: string

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
  agentContact?: string

  fileType: 'image' | 'pdf' | 'other'
  mimeType?: string
  size: number
  dataUrl: string

  uploadedBy: string
}

export interface FileRepository {
  list(): Promise<FileRecord[]>

  get(id: string): Promise<FileRecord | null>

  create(input: CreateFileInput): Promise<FileRecord>

  update(id: string, patch: Partial<FileRecord>): Promise<void>

  delete(id: string): Promise<void>

  restore(id: string): Promise<void>
}
