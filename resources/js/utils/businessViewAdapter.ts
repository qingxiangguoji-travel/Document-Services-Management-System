// resources/js/utils/businessViewAdapter.ts

// 你现有 Orders.vue 的 filters 字段结构
type OrdersFilters = {
  dateRange: any[]
  before: string
  __processStatus: string
  agent?: string
  // 以后你想扩展更多筛选，就在这里补
}

type BusinessView = {
  scope?: 'order' | 'biz'                 // 预留：目前不强制用
  time?: 'today' | 'history' | 'all'
  status?: 'unfinished' | 'processing' | 'completed' | 'cancelled' | 'returned'
  agent?: string
  dateRange?: string                      // "YYYY-MM-DD,YYYY-MM-DD"（来自 Dashboard）
  before?: string                         // "YYYY-MM-DD"（来自 Dashboard）
}

const todayYmd = () => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

// 把 Dashboard 的 query → 映射到 Orders filters
export function applyDashboardQueryToOrdersFilters(
  q: any,
  filters: OrdersFilters
) {
  // ✅ 不动你现有过滤系统：只负责“填值”
  // 1) 先清理（只清理我们要控制的字段，别动你其他筛选）
  filters.before = ''
  filters.dateRange = []
  filters.__processStatus = ''

  // 2) 兼容你现有 query 格式（dateRange / before / processStatus）
  if (q.agent) filters.agent = String(q.agent)

  if (q.dateRange && typeof q.dateRange === 'string') {
    const [start, end] = String(q.dateRange).split(',')
    if (start && end) filters.dateRange = [start, end]
  }

  if (q.before) {
    filters.before = String(q.before)
  }

  if (q.processStatus) {
    filters.__processStatus = String(q.processStatus)
  }

  // 3) ✅ 新增统一语义 view（可选：你后面慢慢迁移 Dashboard 卡片就用它）
  // 形式：?view=base64(JSON)
  if (q.view) {
    try {
      const raw = atob(String(q.view))
      const view = JSON.parse(raw) as BusinessView

      // time → 映射到 dateRange/before
      const t = view.time
      const today = todayYmd()

      if (t === 'today') {
        filters.dateRange = [today, today]
        filters.before = ''
      } else if (t === 'history') {
        filters.before = today
        filters.dateRange = []
      } else if (t === 'all') {
        filters.before = ''
        filters.dateRange = []
      }

      // status → __processStatus
      if (view.status) {
        filters.__processStatus = view.status
      }

      // agent
      if (view.agent) {
        filters.agent = view.agent
      }

      // 也允许 view 直接传 dateRange/before
      if (view.dateRange) {
        const [s, e] = view.dateRange.split(',')
        if (s && e) filters.dateRange = [s, e]
      }
      if (view.before) {
        filters.before = view.before
      }
    } catch (e) {
      console.warn('Invalid view in query:', e)
    }
  }
}
