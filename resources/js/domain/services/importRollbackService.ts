import { db } from '@/utils/storage'

export const getImportBatches = () => {
  const orders = db.getRaw('ORDERS') || []

  const batches = {}

  orders.forEach(o => {
    if (!o.import_batch_id) return

    if (!batches[o.import_batch_id]) {
      batches[o.import_batch_id] = {
        id: o.import_batch_id,
        time: o.imported_at,
        count: 0
      }
    }

    batches[o.import_batch_id].count++
  })

  return Object.values(batches).sort((a,b)=>
    new Date(b.time) - new Date(a.time)
  )
}

export const rollbackImportBatch = (batchId) => {
  const orders = db.getRaw('ORDERS') || []

  const filtered = orders.filter(o => o.import_batch_id !== batchId)

  const removed = orders.length - filtered.length

  db.saveRaw('ORDERS', filtered)

  return removed
}
