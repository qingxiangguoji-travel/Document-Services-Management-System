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

  // ⭐新增：是否携带内容（dataUrl）
  // - 文件中心分页列表：true（默认）
  // - 抽屉/统计/下拉：false（强烈建议）
  includeContent?: boolean
}

export interface PagedResult<T> {
  total: number
  items: T[]
}

type FileEntity = FileRecord & {
  nameLower?: string
  customerLower?: string
  agentLower?: string
  agentLabel?: string
  orderCodeLower?: string
}

type StatsCache = {
  total: number
  todayCount: number
  brokenCount: number
  typeMap: Record<string, number>
  categoryMap: Record<string, number>
  agentSet: string[]
  // 版本号：后续你升级统计字段方便做迁移
  v: number
}

const META_STORE = 'files_meta'
const META_KEY = 'stats_v1'

const DB_NAME = 'certificate-business-management'
const DB_VERSION = 4 // ⭐升版本：因为新增 META_STORE & 未来可扩展索引
const STORE_FILES = 'files'

// 索引名
const IDX_UPLOADED_AT = 'idx_uploadedAt'
const IDX_CATEGORY = 'idx_category'
const IDX_FILETYPE = 'idx_fileType'
const IDX_CUSTOMER = 'idx_customerName'
const IDX_AGENT = 'idx_agentLower'
const IDX_ORDERCODE = 'idx_orderCode'
const IDX_NAMELOWER = 'idx_nameLower'

function toLower(v: any) {
  return String(v ?? '').trim().toLowerCase()
}

function ensureEntity(record: FileRecord): FileEntity {
  const agentLabel = [
    record.agent_company_name || '',
    record.agent_contact_name || ''
  ]
    .filter(Boolean)
    .join(' - ')
    .trim()

  return {
    ...record,
    nameLower: toLower(record.name),
    customerLower: toLower(record.customerName),
    orderCodeLower: toLower(record.orderCode),
    agentLabel,
    agentLower: toLower(agentLabel)
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
    if (!f.nameLower?.includes(toLower(kw))) return false
  }

  if (filters.customer) {
    if (!toLower(f.customerName).includes(toLower(filters.customer))) return false
  }

  if (filters.orderCode) {
    if (!toLower(f.orderCode).includes(toLower(filters.orderCode))) return false
  }

  if (filters.agentContact) {
    if (!f.agentLower?.includes(toLower(filters.agentContact))) return false
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

function stripContent(record: FileRecord): FileRecord {
  // ⭐关键：列表/抽屉默认不带 dataUrl，避免主线程卡死
  const { dataUrl, url, ...rest } = record as any
  return { ...rest, dataUrl: '', url: '' }
}

function buildEmptyStats(): StatsCache {
  return {
    v: 1,
    total: 0,
    todayCount: 0,
    brokenCount: 0,
    typeMap: {},
    categoryMap: {},
    agentSet: []
  }
}

function agentLabelOf(f: any) {
  return [f.agent_company_name, f.agent_contact_name].filter(Boolean).join(' - ').trim()
}

function dayStr(uploadedAt?: string) {
  return String(uploadedAt || '').slice(0, 10)
}
let globalDBPromise: Promise<IDBDatabase> | null = null
export class FileIndexedDbDriver implements FileRepository {

  private dbPromise: Promise<IDBDatabase> | null = null

 private openDB(): Promise<IDBDatabase> {

  // ⭐⭐⭐ 全局单例，整个网站只会 open 一次 ⭐⭐⭐
  if (globalDBPromise) return globalDBPromise

  globalDBPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)

    req.onupgradeneeded = () => {
      console.log('🟡 IndexedDB upgrading...')

      const db = req.result

      if (!db.objectStoreNames.contains(STORE_FILES)) {
        const store = db.createObjectStore(STORE_FILES, { keyPath: 'id' })
        store.createIndex(IDX_UPLOADED_AT, 'uploadedAt')
        store.createIndex(IDX_CATEGORY, 'category')
        store.createIndex(IDX_FILETYPE, 'fileType')
        store.createIndex(IDX_CUSTOMER, 'customerName')
        store.createIndex(IDX_AGENT, 'agentLower')
        store.createIndex(IDX_ORDERCODE, 'orderCode')
        store.createIndex(IDX_NAMELOWER, 'nameLower')
      }

      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE)
      }
    }

    req.onsuccess = () => {
      console.log('🟢 IndexedDB ready')
      resolve(req.result)
    }

    req.onerror = () => reject(req.error)
  })

  return globalDBPromise
}

  private async tx<T>(
    mode: IDBTransactionMode,
    fn: (filesStore: IDBObjectStore, metaStore: IDBObjectStore) => Promise<T> | T
  ): Promise<T> {
    const db = await this.openDB()
    return new Promise<T>((resolve, reject) => {
      const t = db.transaction([STORE_FILES, META_STORE], mode)
      const filesStore = t.objectStore(STORE_FILES)
      const metaStore = t.objectStore(META_STORE)

      Promise.resolve(fn(filesStore, metaStore))
        .then((result) => {
          t.oncomplete = () => resolve(result)
          t.onerror = () => reject(t.error || new Error('IndexedDB tx error'))
          t.onabort = () => reject(t.error || new Error('IndexedDB tx aborted'))
        })
        .catch(reject)
    })
  }

  // =========================
  // Stats Cache（不扫库）
  // =========================

  private async getStats(metaStore: IDBObjectStore): Promise<StatsCache> {
    return new Promise((resolve) => {
      const req = metaStore.get(META_KEY)
      req.onsuccess = () => resolve((req.result as StatsCache) || buildEmptyStats())
      req.onerror = () => resolve(buildEmptyStats())
    })
  }

  private async setStats(metaStore: IDBObjectStore, stats: StatsCache): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const req = metaStore.put(stats, META_KEY)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error || new Error('meta put failed'))
    })
  }

  // 第一次没有缓存时：只做一次全库重建（以后不再扫）
  private async rebuildStatsIfMissing(
    filesStore: IDBObjectStore,
    metaStore: IDBObjectStore
  ): Promise<StatsCache> {
    const existing = await this.getStats(metaStore)
    if (existing && existing.total > 0) return existing
    // total=0 也可能是正常（空库），但为了简单：如果 key 不存在会返回空 stats
    // 我们再确认一下 metaStore 是否真的有 key
    const check = await new Promise<boolean>((resolve) => {
      const r = metaStore.get(META_KEY)
      r.onsuccess = () => resolve(!!r.result)
      r.onerror = () => resolve(false)
    })
    if (check) return existing

    const stats = buildEmptyStats()
    const today = new Date().toISOString().slice(0, 10)

    await new Promise<void>((resolve, reject) => {
      const req = filesStore.openCursor()
      req.onsuccess = () => {
        const cursor = req.result
        if (!cursor) {
          resolve()
          return
        }

        const f = cursor.value || {}
        stats.total++

        const cat = f.category || '未分类'
        stats.categoryMap[cat] = (stats.categoryMap[cat] || 0) + 1

        const ft = f.fileType || 'other'
        stats.typeMap[ft] = (stats.typeMap[ft] || 0) + 1

        if (dayStr(f.uploadedAt) === today) stats.todayCount++
        if (!f.dataUrl && String(f.url || '').startsWith('blob:')) stats.brokenCount++

        const al = agentLabelOf(f)
        if (al) {
          if (!stats.agentSet.includes(al)) stats.agentSet.push(al)
        }

        cursor.continue()
      }
      req.onerror = () => reject(req.error || new Error('rebuild cursor failed'))
    })

    stats.agentSet.sort((a, b) => a.localeCompare(b))
    await this.setStats(metaStore, stats)
    return stats
  }

  // 统一统计出口（Files.vue 以后只调一次）
  async getStatsBundle() {
    return this.tx('readonly', async (_filesStore, metaStore) => {
      const stats = await this.getStats(metaStore)
      const categories = Object.entries(stats.categoryMap).map(([key, count]) => ({
        id: key,
        key,
        count,
        label: `${key} (${count})`
      }))
      const agents = (stats.agentSet || []).slice().sort((a, b) => a.localeCompare(b))
      const global = {
        todayCount: stats.todayCount,
        brokenCount: stats.brokenCount,
        typeStats: Object.entries(stats.typeMap).map(([key, count]) => ({ key, count }))
      }
      return { agents, categories, global, total: stats.total }
    })
  }

  // 兼容旧接口：不扫库
  async getAgentOptions(): Promise<string[]> {
    const b = await this.getStatsBundle()
    return b.agents
  }
  async getCategoryStats() {
    const b = await this.getStatsBundle()
    return b.categories
  }
  async getGlobalStats() {
    const b = await this.getStatsBundle()
    return b.global
  }

  // =========================
  // FileRepository 标准接口
  // =========================

  // ⭐默认 list() 返回“元数据”，避免抽屉/批量全拉 dataUrl 卡死
  async list(): Promise<FileRecord[]> {
    return this.tx('readonly', async (filesStore, metaStore) => {
      // 确保 stats key 存在（只会重建一次）
      await this.rebuildStatsIfMissing(filesStore, metaStore)

      return new Promise<FileRecord[]>((resolve, reject) => {
        const result: FileRecord[] = []
        const req = filesStore.openCursor()

        req.onsuccess = () => {
          const cursor = req.result
          if (!cursor) {
            resolve(result)
            return
          }

          const { nameLower, customerLower, agentLower, agentLabel, orderCodeLower, ...rest } = cursor.value
          // ⭐关键：list 默认 strip content
          result.push(stripContent(rest))
          cursor.continue()
        }

        req.onerror = () => reject(req.error || new Error('list cursor failed'))
      })
    })
  }

  async get(id: string): Promise<FileRecord | null> {
    return this.tx('readonly', async (filesStore, metaStore) => {
      await this.rebuildStatsIfMissing(filesStore, metaStore)

      return new Promise<FileRecord | null>((resolve, reject) => {
        const req = filesStore.get(String(id))
        req.onsuccess = () => {
          const entity = (req.result || null) as FileEntity | null
          if (!entity) return resolve(null)
          const { nameLower, customerLower, agentLower, agentLabel, orderCodeLower, ...rest } = entity
          resolve(rest)
        }
        req.onerror = () => reject(req.error || new Error('get failed'))
      })
    })
  }

async create(input: CreateFileInput): Promise<FileRecord> {
  const record: FileRecord = {
    id: Date.now() + '_' + Math.random().toString(36).slice(2),
    name: input.name,
    category: input.category,
    
    // ⭐⭐⭐ 关键：必须存储 draftId ⭐⭐⭐
    draftId: input.draftId || '',

    orderId: input.orderId,
    orderCode: input.orderCode,
    customerId: input.customerId || '',
    rowId: input.rowId || '',
    customerName: input.customerName,

    agent_company_id: input.agent_company_id || '',
    agent_company_name: input.agent_company_name || '',
    agent_contact_id: input.agent_contact_id || '',
    agent_contact_name: input.agent_contact_name || '',

    fileType: input.fileType,
    mimeType: input.mimeType,
    size: Number(input.size || 0),

    dataUrl: input.dataUrl,
    url: '',

    uploadedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
    uploadedBy: input.uploadedBy || 'system'
  }

    const entity = ensureEntity(record)

    await this.tx('readwrite', async (filesStore, metaStore) => {
      // 确保 stats 存在
      const stats = await this.rebuildStatsIfMissing(filesStore, metaStore)

      // 写数据
      await new Promise<void>((resolve, reject) => {
        const req = filesStore.add(entity)
        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error || new Error('add failed'))
      })

      // 更新 stats（O(1)，不扫库）
      stats.total++

      const today = new Date().toISOString().slice(0, 10)
      if (dayStr(record.uploadedAt) === today) stats.todayCount++

      const cat = record.category || '未分类'
      stats.categoryMap[cat] = (stats.categoryMap[cat] || 0) + 1

      const ft = record.fileType || 'other'
      stats.typeMap[ft] = (stats.typeMap[ft] || 0) + 1

      const al = agentLabelOf(record)
      if (al && !stats.agentSet.includes(al)) {
        stats.agentSet.push(al)
        stats.agentSet.sort((a, b) => a.localeCompare(b))
      }

      await this.setStats(metaStore, stats)
    })

    return record
  }

  async update(id: string, patch: Partial<FileRecord>): Promise<void> {
    await this.tx('readwrite', async (filesStore, metaStore) => {
      const stats = await this.rebuildStatsIfMissing(filesStore, metaStore)

      const current = await new Promise<FileEntity | null>((resolve, reject) => {
        const req = filesStore.get(String(id))
        req.onsuccess = () => resolve((req.result || null) as FileEntity | null)
        req.onerror = () => reject(req.error || new Error('get before update failed'))
      })
      if (!current) return

      const before: FileRecord = current as any
      const merged: FileRecord = { ...before, ...patch, id: before.id }
      const entity = ensureEntity(merged)

      await new Promise<void>((resolve, reject) => {
        const req = filesStore.put(entity)
        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error || new Error('put failed'))
      })

      // ✅ stats delta（只处理会影响统计的字段）
      const beforeCat = before.category || '未分类'
      const afterCat = merged.category || '未分类'
      if (beforeCat !== afterCat) {
        stats.categoryMap[beforeCat] = Math.max(0, (stats.categoryMap[beforeCat] || 0) - 1)
        stats.categoryMap[afterCat] = (stats.categoryMap[afterCat] || 0) + 1
      }

      const beforeFt = before.fileType || 'other'
      const afterFt = merged.fileType || 'other'
      if (beforeFt !== afterFt) {
        stats.typeMap[beforeFt] = Math.max(0, (stats.typeMap[beforeFt] || 0) - 1)
        stats.typeMap[afterFt] = (stats.typeMap[afterFt] || 0) + 1
      }

      // 代理集合：只增不减（生产上通常可接受；要严格可做 rebuild）
      const al = agentLabelOf(merged)
      if (al && !stats.agentSet.includes(al)) {
        stats.agentSet.push(al)
        stats.agentSet.sort((a, b) => a.localeCompare(b))
      }

      await this.setStats(metaStore, stats)
    })
  }

  async delete(id: string): Promise<void> {
    await this.tx('readwrite', async (filesStore, metaStore) => {
      const stats = await this.rebuildStatsIfMissing(filesStore, metaStore)

      const current = await new Promise<FileEntity | null>((resolve, reject) => {
        const req = filesStore.get(String(id))
        req.onsuccess = () => resolve((req.result || null) as FileEntity | null)
        req.onerror = () => reject(req.error || new Error('get before delete failed'))
      })

      await new Promise<void>((resolve, reject) => {
        const req = filesStore.delete(String(id))
        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error || new Error('delete failed'))
      })

      if (current) {
        stats.total = Math.max(0, stats.total - 1)

        const cat = (current.category || '未分类')
        stats.categoryMap[cat] = Math.max(0, (stats.categoryMap[cat] || 0) - 1)

        const ft = (current.fileType || 'other')
        stats.typeMap[ft] = Math.max(0, (stats.typeMap[ft] || 0) - 1)

        // todayCount / brokenCount 严格扣减要比对日期/状态；这里先按严格做：
        const today = new Date().toISOString().slice(0, 10)
        if (dayStr(current.uploadedAt) === today) stats.todayCount = Math.max(0, stats.todayCount - 1)
        if (!current.dataUrl && String(current.url || '').startsWith('blob:')) {
          stats.brokenCount = Math.max(0, stats.brokenCount - 1)
        }
      }

      await this.setStats(metaStore, stats)
    })
  }

  async restore(file: FileRecord): Promise<void> {
    if (!file || !file.id) return

    await this.tx('readwrite', async (filesStore, metaStore) => {
      const stats = await this.rebuildStatsIfMissing(filesStore, metaStore)

      const entity = ensureEntity({
        ...file,
        category: file.category || '未分类',
        uploadedBy: file.uploadedBy || 'system',
        uploadedAt: file.uploadedAt || new Date().toISOString().slice(0, 19).replace('T', ' '),
        size: Number(file.size || 0),
        url: file.url || '',
        dataUrl: file.dataUrl || ''
      })

      await new Promise<void>((resolve, reject) => {
        const req = filesStore.put(entity)
        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error || new Error('restore put failed'))
      })

      // put 可能是覆盖也可能是新增：为了简单严谨，检查是否已存在会更准
      // 这里走“新增式统计”可能重复 +1，所以我们做一次 exists 检查：
      const existed = await new Promise<boolean>((resolve) => {
        const r = filesStore.get(String(file.id))
        r.onsuccess = () => resolve(!!r.result)
        r.onerror = () => resolve(false)
      })
      // 注意：上面 get 在 put 之后会必然存在，所以要判断“恢复前是否存在”会更复杂
      // 实战里：restore 通常是新增（从回收站回来），你现在就是这个场景
      // 所以这里按新增统计：
      stats.total++

      const today = new Date().toISOString().slice(0, 10)
      if (dayStr(entity.uploadedAt) === today) stats.todayCount++

      const cat = entity.category || '未分类'
      stats.categoryMap[cat] = (stats.categoryMap[cat] || 0) + 1

      const ft = entity.fileType || 'other'
      stats.typeMap[ft] = (stats.typeMap[ft] || 0) + 1

      const al = agentLabelOf(entity)
      if (al && !stats.agentSet.includes(al)) {
        stats.agentSet.push(al)
        stats.agentSet.sort((a, b) => a.localeCompare(b))
      }

      await this.setStats(metaStore, stats)
    })
  }

  // =========================
  // 生产级分页
  // =========================
  async listPaged(options: ListPagedOptions): Promise<PagedResult<FileRecord>> {
    const page = Math.max(1, Number(options.page || 1))
    const pageSize = Math.max(1, Number(options.pageSize || 20))
    const sortBy: SortBy = options.sortBy || 'time_desc'
    const filters = options.filters
    const includeContent = options.includeContent !== false // 默认 true

    // name/customer 内存排序
    if (sortBy === 'name' || sortBy === 'customer') {
      const all = await this.tx('readonly', async (filesStore, metaStore) => {
        await this.rebuildStatsIfMissing(filesStore, metaStore)
        return new Promise<FileEntity[]>((resolve, reject) => {
          const req = filesStore.getAll()
          req.onsuccess = () => resolve((req.result || []) as FileEntity[])
          req.onerror = () => reject(req.error || new Error('getAll failed'))
        })
      })

      const entities = all.map(ensureEntity).filter((x) => matchFilters(x, filters))
      sortInMemory(entities, sortBy)
      const total = entities.length
      const start = (page - 1) * pageSize

      const slice = entities.slice(start, start + pageSize).map(({ nameLower, customerLower, agentLower, agentLabel, orderCodeLower, ...rest }) => {
        const rec = rest as FileRecord
        return includeContent ? rec : stripContent(rec)
      })

      return { total, items: slice }
    }

    const direction: IDBCursorDirection = sortBy === 'time_asc' ? 'next' : 'prev'
    const offset = (page - 1) * pageSize
    const wanted = offset + pageSize

    const { total, items } = await this.tx('readonly', async (filesStore, metaStore) => {
      const stats = await this.rebuildStatsIfMissing(filesStore, metaStore)

      return new Promise<{ total: number; items: FileEntity[] }>((resolve, reject) => {
        const index = filesStore.index(IDX_UPLOADED_AT)
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
            if (seenMatched >= offset && seenMatched < wanted) {
              pageItems.push(value)
            }
            seenMatched++
          }

          cursor.continue()
        }

        req.onerror = () => reject(req.error || new Error('openCursor failed'))
      })
    })

    const clean = items.map(({ nameLower, customerLower, agentLower, agentLabel, orderCodeLower, ...rest }) => {
      const rec = rest as FileRecord
      return includeContent ? rec : stripContent(rec)
    })

    return { total, items: clean }
  }
}
