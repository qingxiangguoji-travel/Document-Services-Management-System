// 订单相关常量
export const ORDER_STATUS = {
  PENDING: '待处理',
  PROCESSING: '受理中',
  IN_PROGRESS: '办理中',
  COMPLETED: '完成',
  REJECTED: '拒签',
  CANCELLED: '取消'
}

export const BUSINESS_TYPES = [
  { value: 'visa', label: '签证' },
  { value: 'labor', label: '劳工证' },
  { value: 'work_permit', label: '工作许可' },
  { value: 'residence', label: '居留许可' },
  { value: 'company', label: '公司注册' },
  { value: 'license', label: '驾照办理' },
  { value: 'bank', label: '银行开户' }
]

export const SETTLEMENT_STATUS = [
  { value: 'unpaid', label: '未结算' },
  { value: 'partial', label: '部分结算' },
  { value: 'paid', label: '已结算' }
]

export const YES_NO_OPTIONS = [
  { value: 'yes', label: '有' },
  { value: 'no', label: '无' }
]

// 国籍列表（常用国家）
export const NATIONALITIES = [
  { code: 'CN', name: '中国' },
  { code: 'TH', name: '泰国' },
  { code: 'VN', name: '越南' },
  { code: 'MM', name: '缅甸' },
  { code: 'LA', name: '老挝' },
  { code: 'KH', name: '柬埔寨' },
  { code: 'MY', name: '马来西亚' },
  { code: 'SG', name: '新加坡' },
  { code: 'JP', name: '日本' },
  { code: 'KR', name: '韩国' },
  { code: 'US', name: '美国' },
  { code: 'GB', name: '英国' },
  { code: 'AU', name: '澳大利亚' },
  { code: 'CA', name: '加拿大' },
  { code: 'OTHER', name: '其他' }
]

// 订单编号前缀
export const ORDER_NO_PREFIX = 'QX'