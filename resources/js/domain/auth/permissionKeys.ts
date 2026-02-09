// ⭐ 全系统唯一权限Key来源（Single Source of Truth）
export const PERM = {
  // dashboard
  DASHBOARD: 'dashboard',
  PROFILE: 'profile',

  // business
  BUSINESS_ORDERS: 'business.orders',
  BUSINESS_ORDER_CREATE: 'business.orders.create',
  BUSINESS_ORDER_DETAIL: 'business.orders.detail',
  BUSINESS_FILES: 'business.files',
  BUSINESS_STATS: 'business.stats',

  // agent / customer
  AGENT_INDEX: 'agent.index',
  AGENT_DETAIL: 'agent.detail',
  CUSTOMER_INDEX: 'customer.index',
  AGENT_COMMISSION: 'agent.commission',
  AGENT_FOLLOW: 'agent.follow',

  // certificate
  CERT_INDEX: 'certificate.index',
  CERT_CREATE: 'certificate.create',
  CERT_DETAIL: 'certificate.detail',
  CERT_HISTORY: 'certificate.history',

  // reminder
  REMINDER_EXPIRY: 'reminder.expiry',
  REMINDER_FOLLOW: 'reminder.follow',
  REMINDER_SYSTEM: 'reminder.system',
  NOTIFICATIONS: 'notifications',

  // finance
  FINANCE_RECORDS: 'finance.records',
  FINANCE_DEPT: 'finance.department',
  FINANCE_AGENT: 'finance.agent',

  // settings
  SET_DICT: 'settings.dictionary',
  SET_DEPT: 'settings.departments',
  SET_STATUS: 'settings.status',
  SET_STAFF: 'settings.serviceStaff',
  SET_BACKUP: 'settings.dataBackup',
  SET_IMPORT: 'settings.importHistory',
  SET_RECYCLE: 'settings.recycleBin',
  SET_USERS: 'settings.users',
  SET_FEES: 'settings.fees',
  SET_SETTLEMENT: 'settings.settlement',
  SET_REMINDER_RULE: 'settings.reminderRule',
  SET_ACCOUNT: 'settings.account'
} as const
// ================= 按钮权限 =================
export const BTN = {
  CREATE: 'create',
  EDIT: 'edit',
  DELETE: 'delete',
  EXPORT: 'export',
  IMPORT: 'import'
} as const
