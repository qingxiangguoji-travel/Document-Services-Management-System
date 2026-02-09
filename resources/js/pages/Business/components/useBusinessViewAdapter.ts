import type { BusinessView } from '@/domain/businessView'

export function useBusinessViewAdapter(filters, ui) {
  const applyView = (view: BusinessView) => {
    // 重置
    filters.before = ''
    filters.dateRange = []
    filters.__processStatus = ''

    // 时间
    const today = new Date().toISOString().slice(0, 10)

    if (view.time === 'today') {
      filters.dateRange = [today, today]
    }

    if (view.time === 'history') {
      filters.before = today
    }

    // 状态
    if (view.status) {
      filters.__processStatus = view.status
    }

    // 行为模式
    ui.mode = view.mode
    ui.scope = view.scope
  }

  return { applyView }
}
