import { auth } from '@/utils/auth'
import { PERM } from './permissionKeys'
import { DATA_SCOPE } from './dataScope'

const ROLE_DATA_SCOPE: Record<RoleKey, string> = {
  admin: DATA_SCOPE.ALL,
  staff: DATA_SCOPE.ALL,
  finance: DATA_SCOPE.ALL,
  agent: DATA_SCOPE.OWN
}


type RoleKey = 'admin' | 'staff' | 'finance' | 'agent'

/**
 * =========================================
 * 一、页面/路由权限（菜单权限）
 * 完全按最终矩阵
 * =========================================
 */
const ROLE_PERMISSIONS: Record<RoleKey, string[]> = {
  admin: ['*'],

  staff: [
    PERM.DASHBOARD,
    PERM.PROFILE,

    PERM.BUSINESS_ORDER_CREATE,
    PERM.BUSINESS_ORDERS,
    PERM.BUSINESS_ORDER_DETAIL,
    PERM.BUSINESS_FILES,
    PERM.BUSINESS_STATS,

    PERM.AGENT_INDEX,
    PERM.AGENT_DETAIL,
    PERM.CUSTOMER_INDEX,
    PERM.AGENT_COMMISSION,
    PERM.AGENT_FOLLOW,

    PERM.CERT_INDEX,
    PERM.CERT_CREATE,
    PERM.CERT_DETAIL,
    PERM.CERT_HISTORY,

    PERM.REMINDER_EXPIRY,
    PERM.REMINDER_FOLLOW,
    PERM.REMINDER_SYSTEM,
    PERM.NOTIFICATIONS,

    PERM.FINANCE_RECORDS,
    PERM.FINANCE_DEPT,
    PERM.FINANCE_AGENT,

    PERM.SET_DICT,
    PERM.SET_DEPT,
    PERM.SET_STATUS,
    PERM.SET_STAFF,
    PERM.SET_BACKUP,
    PERM.SET_IMPORT,
    PERM.SET_RECYCLE,

    PERM.SET_ACCOUNT,
    PERM.SET_FEES,
    PERM.SET_SETTLEMENT,
    PERM.SET_REMINDER_RULE
  ],

  finance: [
    PERM.DASHBOARD,
    PERM.PROFILE,

    PERM.BUSINESS_ORDERS,
    PERM.BUSINESS_ORDER_DETAIL,
    PERM.BUSINESS_FILES,

    PERM.AGENT_COMMISSION,

    PERM.CERT_INDEX,
    PERM.CERT_DETAIL,

    PERM.REMINDER_EXPIRY,
    PERM.REMINDER_FOLLOW,
    PERM.REMINDER_SYSTEM,
    PERM.NOTIFICATIONS,

    PERM.FINANCE_RECORDS,
    PERM.FINANCE_DEPT,
    PERM.FINANCE_AGENT,

    PERM.SET_ACCOUNT
  ],

  agent: [
    PERM.DASHBOARD,
    PERM.PROFILE,

    PERM.BUSINESS_ORDERS,
    PERM.BUSINESS_ORDER_DETAIL,
    PERM.BUSINESS_FILES,

    PERM.CERT_INDEX,
    PERM.CERT_DETAIL,

    PERM.REMINDER_EXPIRY,
    PERM.NOTIFICATIONS,

    PERM.SET_ACCOUNT
  ]
}

/**
 * =========================================
 * 二、按钮权限（真正的业务权限）
 * =========================================
 */
const ROLE_BUTTON_PERMISSIONS: Record<RoleKey, string[]> = {
  admin: ['*'],

  // ⭐ staff 可以删除订单（你刚强调）
  staff: [
    'order.create',
    'order.edit',
    'order.delete',
    'order.upload',
    'order.export',

    'agent.create',
    'agent.edit',

    'certificate.create',
    'certificate.edit'
  ],

  // ⭐ 财务 = 纯只读
  finance: [
    'finance.export'
  ],

  // ⭐ 代理 = 完全只读
  agent: []
}

/**
 * =========================================
 * 三、只读页面（整个页面禁编辑）
 * =========================================
 */
const ROLE_READONLY_PAGES: Record<RoleKey, string[]> = {
  admin: [],

  staff: [],

  finance: [
    PERM.BUSINESS_ORDERS,
    PERM.BUSINESS_ORDER_DETAIL,
    PERM.BUSINESS_FILES,
    PERM.CERT_INDEX,
    PERM.CERT_DETAIL
  ],

  agent: [
    PERM.BUSINESS_ORDERS,
    PERM.BUSINESS_ORDER_DETAIL,
    PERM.BUSINESS_FILES,
    PERM.CERT_INDEX,
    PERM.CERT_DETAIL
  ]
}

/**
 * =========================================
 * 四、数据范围控制（超级重要 ⭐）
 * agent 只能看自己的订单/客户
 * =========================================
 */
function isOwner(ownerId?: string | number) {
  const user = auth.getUser()
  if (!user) return false
  return String(user.id) === String(ownerId)
}

/**
 * =========================================
 * 权限服务（统一入口）
 * =========================================
 */
export const permissionService = {

  // ================= 页面权限 =================
  hasPermission(routeName: string) {
    const user = auth.getUser()
    if (!user) return false

    const role = (user.role || 'staff') as RoleKey
    const permissions = ROLE_PERMISSIONS[role] || []

    if (permissions.includes('*')) return true
    return permissions.includes(routeName)
  },

  // ================= 按钮权限 =================
  can(action: string) {
    const user = auth.getUser()
    if (!user) return false

    const role = (user.role || 'staff') as RoleKey
    const permissions = ROLE_BUTTON_PERMISSIONS[role] || []

    if (permissions.includes('*')) return true
    return permissions.includes(action)
  },

  // ================= 页面只读 =================
  isReadonlyPage(routeName: string) {
    const user = auth.getUser()
    if (!user) return true

    const role = (user.role || 'staff') as RoleKey
    return ROLE_READONLY_PAGES[role]?.includes(routeName)
  },

  // ================= 数据范围 =================
canAccessRecord(ownerId?: string | number) {
  const user = auth.getUser()
  if (!user) return false

  const role = (user.role || 'staff') as RoleKey
  const scope = ROLE_DATA_SCOPE[role]

  // 全部数据
  if (scope === DATA_SCOPE.ALL) {
    return true
  }

  // 仅本人数据
  if (scope === DATA_SCOPE.OWN) {
    return isOwner(ownerId)
  }

  return false
},


  // ================= 辅助 =================
  canAccessRoute(route: any) {
    if (!route?.name) return true
    return this.hasPermission(String(route.name))
  },

  hasRole(requiredRoles: string | string[]) {
    const user = auth.getUser()
    if (!user) return false
    const role = String(user.role || '')
    if (typeof requiredRoles === 'string') return role === requiredRoles
    return requiredRoles.includes(role)
  },

  getRolePermissions() {
    const user = auth.getUser()
    if (!user) return []
    const role = (user.role || 'staff') as RoleKey
    return ROLE_PERMISSIONS[role] || []
  }
}
