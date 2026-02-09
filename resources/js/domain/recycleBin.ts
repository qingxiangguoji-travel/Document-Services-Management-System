function genId() {
  return 'rb_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8)
}

const STORAGE_KEY = 'RECYCLE_BIN_DATA'

export type RecycleModule =
  | 'order'
  | 'agent'
  | 'certificate'
  | 'file'

export interface RecycleRecord<T = any> {
  id: string
  module: RecycleModule
  sourceId: string
  snapshot: T
  deletedAt: number
  deletedBy: string
  reason?: string
}

function load(): RecycleRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function save(data: RecycleRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function listRecycleBin(
  module?: RecycleModule
): RecycleRecord[] {
  const data = load()
  return module
    ? data.filter(r => r.module === module)
    : data
}

export function moveToRecycle<T>(
  module: RecycleModule,
  sourceId: string,
  snapshot: T,
  options?: {
    deletedBy?: string
    reason?: string
  }
): RecycleRecord {
  const data = load()

  const record: RecycleRecord<T> = {
    id: genId(),
    module,
    sourceId,
    snapshot: JSON.parse(JSON.stringify(snapshot)), // 深拷贝
    deletedAt: Date.now(),
    deletedBy: options?.deletedBy || 'system',
    reason: options?.reason
  }

  data.unshift(record)
  save(data)

  return record
}

export function restoreFromRecycle(
  recycleId: string
): RecycleRecord | null {
  const data = load()
  const index = data.findIndex(r => r.id === recycleId)
  if (index === -1) return null

  const [record] = data.splice(index, 1)
  save(data)

  return record
}

export function hardDelete(
  recycleId: string
): boolean {
  const data = load()
  const next = data.filter(r => r.id !== recycleId)
  if (next.length === data.length) return false

  save(next)
  return true
}
