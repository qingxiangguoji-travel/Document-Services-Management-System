// domain/auth/roleConfig.ts

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  STAFF: 'staff',
  FINANCE: 'finance',
  MANAGER: 'manager'
} as const

export const ROLE_LABEL = {
  admin: '管理员',
  staff: '业务人员',
  finance: '财务',
  manager: '经理'
}

// 每个角色拥有的权限
export const ROLE_PERMISSIONS = {
  super_admin: ['*'],

  staff: [
    'order.create',
    'order.edit',
    'order.view',
    'file.upload'
  ],

  finance: [
    'order.view',
    'finance.view',
    'finance.settle'
  ],

  manager: [
    'order.view',
    'finance.view'
  ]
}
