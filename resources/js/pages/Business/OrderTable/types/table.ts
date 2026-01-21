// 表格行数据类型
export interface TableRow {
  id: string
  customer_id: string
  name: string
  passport: string
  alias_no: string
  nationality: string
  passport_expiry: string
  entry_date: string
  visa_expiry: string
  has_work_permit: string
  agent_contact: string

  fee_visa: number | null
  fee_work: number | null
  fee_other: number | null
  fine_entry: number | null
  fine_overdue: number | null
  fine_work: number | null
  special_fee: number | null
  actual_fee: number | null

  // ✅ 新增：给 TableBody/单元格组件一个稳定可绑定的费用对象
  // 不影响你现有的扁平字段（fee_visa 等仍然保留）
  business_fees?: {
    fee_visa: number | null
    fee_work: number | null
    fee_other: number | null
    fine_entry: number | null
    fine_overdue: number | null
    fine_work: number | null
    special_fee: number | null
  }

  business_seq: number
  business_type: string
  row_remark: string
  is_settled: string

  upstream_name: string
  upstream_time: string
  upstream_fee: number | null
  upstream_is_settled: string
  process_status: string
  upstream_remark: string
  business_end_time: string
  business_return_time: string

  _customerId: string
  _customerSeq: number
  _businessIndex: number
  _isFirstRow: boolean
  _isMerged: boolean
  _displayNo: string
}

// 客户嵌套结构
export interface CustomerData {
  customer_id: string
  name: string
  passport: string
  alias_no: string
  nationality: string
  passport_expiry: string
  entry_date: string
  visa_expiry: string
  has_work_permit: string
  agent_contact: string
  customer_fees: {
    actual_fee: number | null
  }
  businesses: BusinessData[]
}

// 业务数据
export interface BusinessData {
  id: string
  business_seq: number
  business_type: string
  row_remark: string
  is_settled: string
  business_fees: {
    fee_visa: number | null
    fee_work: number | null
    fee_other: number | null
    fine_entry: number | null
    fine_overdue: number | null
    fine_work: number | null
    special_fee: number | null
  }
  upstream_name: string
  upstream_time: string
  upstream_fee: number | null
  upstream_is_settled: string
  process_status: string
  upstream_remark: string
  business_end_time: string
  business_return_time: string
  files: any[]
}

// 列定义
export interface ColumnDefinition {
  key: string
  label: string
  width: number
  fixed?: boolean | 'left' | 'right'
  align?: 'left' | 'center' | 'right'
  columnKey?: string
  group?: string
  component?: string
  componentProps?: Record<string, any>
  canHide?: boolean
}

// 模块类型
export type ModuleType = 'all' | 'confirm' | 'process'
