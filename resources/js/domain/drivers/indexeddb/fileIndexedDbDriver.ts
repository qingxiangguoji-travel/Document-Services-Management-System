// resources/js/domain/drivers/indexeddb/fileIndexedDbDriver.ts
import type {
  FileRepository,
  FileRecord,
  CreateFileInput,
  FileQuery
} from '@/domain/repositories/fileRepository'

type SortBy = 'time_desc' | 'time_asc' | 'name' | 'customer'

export interface ListPagedOptions {
  page: number
  pageSize: number
  sortBy?: SortBy
  filters?: FileQuery
}

export interface PagedResult<T> {
  total: number
  items: T[]
}

type FileEntity = FileRecord & {
  // 为了更快的过滤/排序（不改变对外结构）
  nameLower?: string
  customerLower?: string
  agentLower?: string
  orderCodeLower?: string
}

const DB_NAME = 'certificate-business-management'
const DB_VERSION = 2
const STORE_FILES = 'files'

// 索引名
const IDX_UPLOADED_AT = 'idx_uploadedAt'
const IDX_CATEGORY = 'idx_category'
const IDX_FILETYPE = 'idx_fileType'
const IDX_CUSTOMER = 'idx_customerName'
const IDX_AGENT = 'idx_agentContact'
const IDX_ORDERCODE = 'idx_orderCode'
const IDX_NAMELOWER = 'idx_nameLower'

function toLower(v: any) {
  return String(v ?? '').trim().toLowerCase()
}

function ensureEntity(record: FileRecord): FileEntity {
  return {
    ...record,
    nameLower: toLower(record.name),
    customerLower: toLower(record.customerName),
    agentLower: toLower(record.agentContact),
    orderCodeLower: toLower(record.orderCode)
  }
}

function inDateRange(uploadedAt: string, range?: any): boolean {
  if (!range || !Array.isArray(range) || range.length < 2) return true
  const [start, end] = range
  if (!start || !end) return true
  const d = String(uploadedAt || '').slice(0, 10)
  return d >= start && d <= end
}

function matchFilters(f: FileEntity, filters?: FileQuery): boolean {
  if (!filters) return true

  if (filters.keyword) {
    const kw = String(filters.keyword)
    // 你原逻辑是 includes（大小写敏感），这里升级为不区分大小写，更稳
    if (!f.nameLower?.includes(toLower(kw))) return false
  }

  if (filters.customer) {
    if (!toLower(f.customerName).includes(toLower(filters.customer))) return false
  }

  if (filters.orderCode) {
    if (!toLower(f.orderCode).includes(toLower(filters.orderCode))) return false
  }

  if (filters.agentContact) {
    if (!toLower(f.agentContact).includes(toLower(filters.agentContact))) return false
  }

  if (filters.category) {
    if (String(f.category || '') !== String(filters.category)) return false
  }

  if (filters.fileType) {
    if (String(f.fileType || '') !== String(filters.fileType)) return false
  }

  if (!inDateRange(f.uploadedAt, filters.dateRange)) return false

  return true
}

function sortInMemory(list: FileEntity[], sortBy: SortBy) {
  // 为了保证与你现有 Files.vue sortBy 行为一致
  if (sortBy === 'time_desc') {
    list.sort((a, b) => String(b.uploadedAt).localeCompare(String(a.uploadedAt)))
  } else if (sortBy === 'time_asc') {
    list.sort((a, b) => String(a.uploadedAt).localeCompare(String(b.uploadedAt)))
  } else if (sortBy === 'name') {
    list.sort((a, b) => String(a.name).localeCompare(String(b.name)))
  } else if (sortBy === 'customer') {
    list.sort((a, b) => String(a.customerName).localeCompare(String(b.customerName)))
  }
}

export class FileIndexedDbDriver implements FileRepository {
  private dbPromise: Promise<IDBDatabase> | null = null

  // -------------------------
  // DB 初始化 / 迁移
  // -------------------------
  private openDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise

    this.dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION)

      req.onupgradeneeded = () => {
        const db = req.result

        // v1：创建 files store
        if (!db.objectStoreNames.contains(STORE_FILES)) {
          const store = db.createObjectStore(STORE_FILES, { keyPath: 'id' })
          // 索引：用于时间游标分页/过滤
          store.createIndex(IDX_UPLOADED_AT, 'uploadedAt', { unique: false })
          store.createIndex(IDX_CATEGORY, 'category', { unique: false })
          store.createIndex(IDX_FILETYPE, 'fileType', { unique: false })
          store.createIndex(IDX_CUSTOMER, 'customerName', { unique: false })
          store.createIndex(IDX_AGENT, 'agentContact', { unique: false })
          store.createIndex(IDX_ORDERCODE, 'orderCode', { unique: false })
          store.createIndex(IDX_NAMELOWER, 'nameLower', { unique: false })
        } else {
          // v2：补齐索引（防止老库缺字段/缺索引）
          const tx = req.transaction
          const store = tx.objectStore(STORE_FILES)

          const ensureIndex = (name: string, keyPath: string) => {
            if (!store.indexNames.contains(name)) {
              store.createIndex(name, keyPath, { unique: false })
            }
          }

          ensureIndex(IDX_UPLOADED_AT, 'uploadedAt')
          ensureIndex(IDX_CATEGORY, 'category')
          ensureIndex(IDX_FILETYPE, 'fileType')
          ensureIndex(IDX_CUSTOMER, 'customerName')
          ensureIndex(IDX_AGENT, 'agentContact')
          ensureIndex(IDX_ORDERCODE, 'orderCode')
          ensureIndex(IDX_NAMELOWER, 'nameLower')
        }
      }

      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error || new Error('IndexedDB open failed'))
    })

    return this.dbPromise
  }

  private async tx<T>(
    mode: IDBTransactionMode,
    fn: (store: IDBObjectStore) => Promise<T> | T
  ): Promise<T> {
    const db = await this.openDB()
    return new Promise<T>((resolve, reject) => {
      const t = db.transaction(STORE_FILES, mode)
      const store = t.objectStore(STORE_FILES)

      Promise.resolve(fn(store))
        .then((result) => {
          t.oncomplete = () => resolve(result)
          t.onerror = () => reject(t.error || new Error('IndexedDB tx error'))
          t.onabort = () => reject(t.error || new Error('IndexedDB tx aborted'))
        })
        .catch(reject)
    })
  }

  // -------------------------
  // FileRepository 标准接口
  // -------------------------
  async list(): Promise<FileRecord[]> {
    // 注意：这里为了不推翻你现有 UI（需要 dataUrl 直接预览），返回全量数据
    // 如果未来你要“真正分页 + 只取元数据”，就用 listPaged()
    const items = await this.tx('readonly', (store) => {
      return new Promise<FileEntity[]>((resolve, reject) => {
        const req = store.getAll()
        req.onsuccess = () => resolve((req.result || []) as FileEntity[])
        req.onerror = () => reject(req.error || new Error('getAll failed'))
      })
    })

    // 去掉内部字段（保持 FileRecord 纯净）
    return items.map(({ nameLower, customerLower, agentLower, orderCodeLower, ...rest }) => rest)
  }

  async get(id: string): Promise<FileRecord | null> {
    const entity = await this.tx('readonly', (store) => {
      return new Promise<FileEntity | null>((resolve, reject) => {
        const req = store.get(String(id))
        req.onsuccess = () => resolve((req.result || null) as FileEntity | null)
        req.onerror = () => reject(req.error || new Error('get failed'))
      })
    })

    if (!entity) return null
    const { nameLower, customerLower, agentLower, orderCodeLower, ...rest } = entity
    return rest
  }

  async create(input: CreateFileInput): Promise<FileRecord> {
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
      size: Number(input.size || 0),

      dataUrl: input.dataUrl,
      url: '',

      uploadedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      uploadedBy: input.uploadedBy || 'system'
    }

    const entity = ensureEntity(record)

    await this.tx('readwrite', (store) => {
      return new Promise<void>((resolve, reject) => {
        const req = store.add(entity)
        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error || new Error('add failed'))
      })
    })

    return record
  }

  async update(id: string, patch: Partial<FileRecord>): Promise<void> {
    await this.tx('readwrite', async (store) => {
      const current = await new Promise<FileEntity | null>((resolve, reject) => {
        const req = store.get(String(id))
        req.onsuccess = () => resolve((req.result || null) as FileEntity | null)
        req.onerror = () => reject(req.error || new Error('get before update failed'))
      })
      if (!current) return

      const merged: FileRecord = { ...current, ...patch, id: current.id }
      const entity = ensureEntity(merged)

      await new Promise<void>((resolve, reject) => {
        const req = store.put(entity)
        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error || new Error('put failed'))
      })
    })
  }

  async delete(id: string): Promise<void> {
    await this.tx('readwrite', (store) => {
      return new Promise<void>((resolve, reject) => {
        const req = store.delete(String(id))
        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error || new Error('delete failed'))
      })
    })
  }

  async restore(file: FileRecord): Promise<void> {
  if (!file || !file.id) return

  const entity = ensureEntity({
    // 兜底补齐
    ...file,
    category: file.category || '未分类',
    uploadedBy: file.uploadedBy || 'system',
    uploadedAt: file.uploadedAt || new Date().toISOString().slice(0, 19).replace('T', ' '),
    size: Number(file.size || 0),
    url: file.url || '',
    dataUrl: file.dataUrl || ''
  })

  await this.tx('readwrite', (store) => {
    return new Promise<void>((resolve, reject) => {
      const req = store.put(entity) // put = 存在则覆盖，不存在则新增
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error || new Error('restore put failed'))
    })
  })
}


  // -------------------------
  // 生产级扩展：游标分页 listPaged
  // -------------------------
  async listPaged(options: ListPagedOptions): Promise<PagedResult<FileRecord>> {
    const page = Math.max(1, Number(options.page || 1))
    const pageSize = Math.max(1, Number(options.pageSize || 20))
    const sortBy: SortBy = options.sortBy || 'time_desc'
    const filters = options.filters

    // 说明：
    // - 时间分页用 uploadedAt 索引 cursor（next/prev）
    // - name/customer 排序目前用内存排序（避免复杂索引组合）
    //   （未来数据量更大再做专门索引/冗余字段）
    if (sortBy === 'name' || sortBy === 'customer') {
      const all = await this.list()
      const entities = all.map(ensureEntity).filter((x) => matchFilters(x, filters))
      sortInMemory(entities, sortBy)
      const total = entities.length
      const start = (page - 1) * pageSize
      const slice = entities.slice(start, start + pageSize).map(({ nameLower, customerLower, agentLower, orderCodeLower, ...rest }) => rest)
      return { total, items: slice }
    }

    const direction: IDBCursorDirection = sortBy === 'time_asc' ? 'next' : 'prev'
    const offset = (page - 1) * pageSize
    const wanted = offset + pageSize

    // 先用 cursor 走一遍：拿到 total + page items（一次遍历，生产级，避免双遍历）
    const { total, items } = await this.tx('readonly', (store) => {
      return new Promise<{ total: number; items: FileEntity[] }>((resolve, reject) => {
        const index = store.index(IDX_UPLOADED_AT)
        const req = index.openCursor(null, direction)

        let seenMatched = 0
        let totalMatched = 0
        const pageItems: FileEntity[] = []

        req.onsuccess = () => {
          const cursor = req.result
          if (!cursor) {
            resolve({ total: totalMatched, items: pageItems })
            return
          }

          const value = cursor.value as FileEntity
          if (matchFilters(value, filters)) {
            totalMatched++

            // 跳过 offset
            if (seenMatched >= offset && seenMatched < wanted) {
              pageItems.push(value)
            }
            seenMatched++
          }

          // 已经收集满一页，但 total 还要继续统计？
          // 生产权衡：这里仍继续跑到末尾统计 total（UI 分页需要 total）
          cursor.continue()
        }

        req.onerror = () => reject(req.error || new Error('openCursor failed'))
      })
    })

    const clean = items.map(({ nameLower, customerLower, agentLower, orderCodeLower, ...rest }) => rest)
    return { total, items: clean }
  }

  // -------------------------
  // 生产级扩展：迁移（从旧存储导入）
  // -------------------------
  /**
   * 把旧数据一次性导入 IndexedDB。
   * 你可以传入：db.getFiles() 的结果（旧 localStorage）
   *
   * 建议：
   * - 导入后你就可以把 localStorage 里的 FILES_CENTER 清空（或保留备份）
   */
  async importFromLegacy(files: FileRecord[]): Promise<{ imported: number; skipped: number }> {
    const list = Array.isArray(files) ? files : []
    let imported = 0
    let skipped = 0

    await this.tx('readwrite', async (store) => {
      for (const f of list) {
        if (!f || !f.id) {
          skipped++
          continue
        }

        const entity = ensureEntity({
          // 兜底补齐
          ...f,
          category: f.category || '未分类',
          uploadedBy: f.uploadedBy || 'system',
          uploadedAt: f.uploadedAt || new Date().toISOString().slice(0, 19).replace('T', ' '),
          size: Number(f.size || 0),
          url: f.url || '',
          dataUrl: f.dataUrl || (String(f.url || '').startsWith('data:') ? f.url : '')
        })

        // put：存在则覆盖（更适合迁移）
        // eslint-disable-next-line no-await-in-loop
        await new Promise<void>((resolve, reject) => {
          const req = store.put(entity)
          req.onsuccess = () => resolve()
          req.onerror = () => reject(req.error || new Error('import put failed'))
        })

        imported++
      }
    })

    return { imported, skipped }
  }

  // -------------------------
  // 运维：清库 / 统计
  // -------------------------
  async countAll(): Promise<number> {
    const total = await this.tx('readonly', (store) => {
      return new Promise<number>((resolve, reject) => {
        const req = store.count()
        req.onsuccess = () => resolve(Number(req.result || 0))
        req.onerror = () => reject(req.error || new Error('count failed'))
      })
    })
    return total
  }

  async clearAll(): Promise<void> {
    await this.tx('readwrite', (store) => {
      return new Promise<void>((resolve, reject) => {
        const req = store.clear()
        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error || new Error('clear failed'))
      })
    })
  }
}
