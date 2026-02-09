import type { ColumnDefinition } from '../types/table'

export const columnDefinitions: ColumnDefinition[] = [
  {
    key: 'seq',
    label: '序号',
    width: 115,
    fixed: 'left',
    align: 'center',
    columnKey: 'seq',
    canHide: false
  },
  {
    key: 'agent_contact',
    label: '代理联系人',
    width: 95,
    fixed: 'left',
    align: 'center',
    columnKey: 'agent_contact',
    canHide: true
  },
  {
    key: 'name',
    label: '护照名字',
    width: 100,
    fixed: 'left',
    align: 'center',
    columnKey: 'name',
    canHide: true
  },
  {
    key: 'passport',
    label: '护照号',
    width: 100,
    fixed: 'left',
    align: 'center',
    columnKey: 'passport',
    canHide: true
  },
  {
    key: 'alias_no',
    label: '化名/员工编号',
    width: 90,
    fixed: 'left',
    align: 'center',
    columnKey: 'alias_no',
    canHide: true,
	isFixedEnd: true,
    class: 'sticky-last-marker'
  },
  // 护照信息分组
  {
    key: 'nationality',
    label: '国籍',
    width: 85,
    align: 'center',
    columnKey: 'nationality',
    group: 'passport',
    canHide: true
  },
  {
    key: 'passport_expiry',
    label: '护照到期日',
    width: 100,
    align: 'center',
    columnKey: 'passport_expiry',
    group: 'passport',
    canHide: true
  },
  {
    key: 'entry_date',
    label: '入境时间',
    width: 100,
    align: 'center',
    columnKey: 'entry_date',
    group: 'passport',
    canHide: true
  },
  {
    key: 'visa_expiry',
    label: '签证到期时间',
    width: 100,
    align: 'center',
    columnKey: 'visa_expiry',
    group: 'passport',
    canHide: true
  },
  {
    key: 'has_work_permit',
    label: '有无劳工证',
    width: 85,
    align: 'center',
    columnKey: 'has_work_permit',
    group: 'passport',
    canHide: true
  },
  // 业务分类
  {
    key: 'business_type',
    label: '业务类型',
    width: 110,
    align: 'center',
    columnKey: 'business_type',
    group: 'business',
    canHide: true
  },
  // 费用与结算
  {
    key: 'fee_visa',
    label: '续签办理费',
    width: 90,
    align: 'center',
    columnKey: 'fee_visa',
    group: 'fee',
    canHide: true
  },
  {
    key: 'fee_work',
    label: '劳工证办理费',
    width: 95,
    align: 'center',
    columnKey: 'fee_work',
    group: 'fee',
    canHide: true
  },
  {
    key: 'fee_other',
    label: '其他费用',
    width: 85,
    align: 'center',
    columnKey: 'fee_other',
    group: 'fee',
    canHide: true
  },
  {
    key: 'fine_entry',
    label: '入境罚款',
    width: 80,
    align: 'center',
    columnKey: 'fine_entry',
    group: 'fee',
    canHide: true
  },
  {
    key: 'fine_overdue',
    label: '逾期罚款',
    width: 80,
    align: 'center',
    columnKey: 'fine_overdue',
    group: 'fee',
    canHide: true
  },
  {
    key: 'fine_work',
    label: '劳工证罚款',
    width: 90,
    align: 'center',
    columnKey: 'fine_work',
    group: 'fee',
    canHide: true
  },
  {
    key: 'special_fee',
    label: '特殊处理费用',
    width: 95,
    align: 'center',
    columnKey: 'special_fee',
    group: 'fee',
    canHide: true
  },
  {
    key: 'total',
    label: '应收合计',
    width: 90,
    align: 'center',
    columnKey: 'total',
    group: 'fee',
    canHide: true
  },
  {
    key: 'actual_fee',
    label: '实收金额',
    width: 90,
    align: 'center',
    columnKey: 'actual_fee',
    group: 'fee',
    canHide: true
  },
  {
    key: 'is_settled',
    label: '是否结算',
    width: 85,
    align: 'center',
    columnKey: 'is_settled',
    group: 'fee',
    canHide: true
  },
  {
    key: 'row_remark',
    label: '备注',
    width: 120,
    align: 'center',
    columnKey: 'row_remark',
    group: 'fee',
    canHide: true
  },
  // 上游端及办理进度
  {
    key: 'upstream_name',
    label: '上游端',
    width: 110,
    align: 'center',
    columnKey: 'upstream_name',
    group: 'upstream',
    canHide: true
  },
  {
    key: 'upstream_time',
    label: '办理业务时间',
    width: 100,
    align: 'center',
    columnKey: 'upstream_time',
    group: 'upstream',
    canHide: true
  },
  {
    key: 'upstream_fee',
    label: '上游端结算费用',
    width: 110,
    align: 'center',
    columnKey: 'upstream_fee',
    group: 'upstream',
    canHide: true
  },
  {
    key: 'upstream_is_settled',
    label: '是否结算',
    width: 85,
    align: 'center',
    columnKey: 'upstream_is_settled',
    group: 'upstream',
    canHide: true
  },
  {
    key: 'process_status',
    label: '办理状态',
    width: 110,
    align: 'center',
    columnKey: 'process_status',
    group: 'upstream',
    canHide: true
  },
  {
    key: 'upstream_remark',
    label: '备注',
    width: 120,
    align: 'center',
    columnKey: 'upstream_remark',
    group: 'upstream',
    canHide: true
  },
  {
    key: 'business_end_time',
    label: '业务结束时间',
    width: 100,
    align: 'center',
    columnKey: 'business_end_time',
    group: 'upstream',
    canHide: true
  },
  {
    key: 'business_return_time',
    label: '业务返回时间',
    width: 100,
    align: 'center',
    columnKey: 'business_return_time',
    group: 'upstream',
    canHide: true
  },
  // 操作列
  {
    key: 'action',
    label: '照片/删除',
    width: 90,
    fixed: 'right',
    align: 'center',
    columnKey: 'action',
    canHide: true
  }
]

// 根据模块获取列
export const getColumnsByModule = (module: string): ColumnDefinition[] => {
  const confirmColumns = [
    'seq', 'agent_contact', 'name', 'passport', 'alias_no',
    'nationality', 'passport_expiry', 'entry_date', 'visa_expiry', 'has_work_permit',
    'business_type', 'fee_visa', 'fee_work', 'fee_other', 'fine_entry',
    'fine_overdue', 'fine_work', 'special_fee', 'total', 'actual_fee',
    'is_settled', 'row_remark', 'action'
  ]
  
  const processColumns = [
    'seq', 'agent_contact', 'name', 'passport', 'alias_no',
    'upstream_name', 'upstream_time', 'upstream_fee', 'upstream_is_settled',
    'process_status', 'upstream_remark', 'business_end_time', 'business_return_time',
    'action'
  ]
  
  let columnKeys: string[] = []
  
  if (module === 'confirm') {
    columnKeys = confirmColumns
  } else if (module === 'process') {
    columnKeys = processColumns
  } else {
    columnKeys = columnDefinitions.map(col => col.key)
  }
  
  return columnDefinitions.filter(col => columnKeys.includes(col.key))
}

// 获取需要合并的字段
export const getMergeFields = (): string[] => {
  return [
    'seq', 'agent_contact', 'name', 'passport', 'alias_no', 
    'nationality', 'passport_expiry', 'entry_date', 'visa_expiry', 'has_work_permit'
  ]
}

// 分组映射
export const groupMap: Record<string, string> = {
  passport: '护照信息',
  business: '业务分类',
  fee: '费用与结算',
  upstream: '上游端及办理进度'
}