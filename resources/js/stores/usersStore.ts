// resources/js/stores/usersStore.ts
import { ref } from 'vue'
import { auth } from '@/utils/auth'

export type RoleKey = 'admin' | 'staff' | 'finance' | 'agent'

export type UserRecord = {
  id: string
  username: string
  name: string
  role: RoleKey
  enabled: boolean
  created_at?: string

  // multi-tenant
  agent_company_id?: string
  tenant_role?: 'admin' | 'staff' | 'finance'
}

type CreateUserInput = {
  username: string
  name: string
  role: RoleKey
  password: string
  agent_company_id?: string
  tenant_role?: 'admin' | 'staff' | 'finance'
}

type UpdateUserPatch = Partial<Omit<UserRecord, 'id' | 'username'>> & {
  // username 不允许改；如果你未来要支持改账号，再加迁移策略
}

const usersRef = ref<UserRecord[]>([])

function load() {
  usersRef.value = (auth.getUsers() || []) as UserRecord[]
}

function getCurrentUser() {
  return auth.getUser() as UserRecord | null
}

function countEnabledAdmins() {
  return usersRef.value.filter(u => u.role === 'admin' && u.enabled).length
}

function countAdmins() {
  return usersRef.value.filter(u => u.role === 'admin').length
}

function assertCanDisable(row: UserRecord) {
  if (row.role === 'admin' && row.enabled) {
    if (countEnabledAdmins() <= 1) {
      return { ok: false, message: '系统必须保留至少一个启用的管理员' }
    }
  }
  return { ok: true }
}

function assertCanDelete(row: UserRecord) {
  if (row.role === 'admin') {
    if (countAdmins() <= 1) {
      return { ok: false, message: '系统必须保留至少一个管理员' }
    }
  }
  return { ok: true }
}

export const usersStore = {
  users: usersRef,

  load,

  create(input: CreateUserInput) {
    const payload: any = { ...input }

    // 非代理清理多租户字段（防污染）
    if (payload.role !== 'agent') {
      payload.agent_company_id = ''
      payload.tenant_role = 'staff'
    } else {
      payload.tenant_role = payload.tenant_role || 'staff'
    }

    const res = auth.createUser(payload)
    if (!res.ok) return res

    load()
    return { ok: true }
  },

  update(id: string, patch: UpdateUserPatch) {
    const current = usersRef.value.find(u => u.id === id)
    if (!current) return { ok: false, message: '用户不存在' }

    // 禁止修改 agent 角色为其他角色（你的规则）
    if (current.role === 'agent' && patch.role && patch.role !== 'agent') {
      return { ok: false, message: '代理账号角色不可修改' }
    }

    const next: any = { ...patch }

    // 非代理清理字段
    const role = (patch.role || current.role) as RoleKey
    if (role !== 'agent') {
      next.agent_company_id = ''
      next.tenant_role = 'staff'
    } else {
      next.tenant_role = next.tenant_role || current.tenant_role || 'staff'
    }

    auth.updateUser(id, next)
    load()
    return { ok: true }
  },

  toggleEnabled(row: UserRecord) {
    const me = getCurrentUser()
    if (me && row.id === me.id) {
      return { ok: false, message: '不能禁用当前登录账号' }
    }

    const check = assertCanDisable(row)
    if (!check.ok) return check

    auth.updateUser(row.id, { enabled: !row.enabled })
    load()
    return { ok: true }
  },

  resetPassword(row: UserRecord) {
    const me = getCurrentUser()
    if (me && row.id === me.id) {
      return { ok: false, message: '不能重置当前登录账号密码，请使用“修改我的密码”' }
    }

    const res = auth.resetPassword(row.id)
    if (!res.ok) return res

    load()
    return res // { ok:true, tempPwd }
  },

  delete(row: UserRecord) {
    const me = getCurrentUser()
    if (me && row.id === me.id) {
      return { ok: false, message: '不能删除当前登录账号' }
    }

    const check = assertCanDelete(row)
    if (!check.ok) return check

    auth.deleteUser(row.id)
    load()
    return { ok: true }
  },

  changeMyPassword(oldPwd: string, newPwd: string) {
    const res = auth.changeMyPassword(oldPwd, newPwd)
    if (!res.ok) return res

    // 密码改了不一定要 load，但保持一致
    load()
    return { ok: true }
  }
}
