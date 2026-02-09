export type BusinessScope = 'order' | 'biz'
export type BusinessTime = 'today' | 'history' | 'all'
export type BusinessMode = 'operate' | 'view'

export interface BusinessView {
  scope: BusinessScope
  time: BusinessTime
  status?: 'unfinished' | 'processing' | 'completed' | 'cancelled' | 'returned'
  mode: BusinessMode
  source?: 'dashboard' | 'system' | 'restore'
}
