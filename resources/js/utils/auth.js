const AUTH_TOKEN_KEY = 'AUTH_TOKEN_V1'
const AUTH_USER_KEY = 'AUTH_USER_V1'
const AUTH_USERS_KEY = 'AUTH_USERS_V1' // 本地账号库（未来可切 API / MySQL）

// ===== 生成随机临时密码 =====
const genTempPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let pwd = ''
  for (let i = 0; i < 8; i++) {
    pwd += chars[Math.floor(Math.random() * chars.length)]
  }
  return pwd
}

/**
 * 默认账号（首次初始化）
 * 账号：admin
 * 密码：admin123456
 */
const defaultUsers = () => ([
  {
    id: 'u_admin',
    username: 'admin',
    password: 'admin123456',
    name: '管理员',
    role: 'admin',

    // ⭐ 新增（管理员没有代理公司）
    agent_company_id: null,
    tenant_role: null,

    enabled: true,
    created_at: new Date().toISOString()
  }
])


const nowMs = () => Date.now()

const safeParse = (s, fallback = null) => {
  try { return JSON.parse(s) } catch { return fallback }
}

export const auth = {
  // ✅ 初始化本地账号库（只在首次没数据时写入默认管理员）
  ensureUsersSeeded() {
    const raw = localStorage.getItem(AUTH_USERS_KEY)
    if (!raw) {
      localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(defaultUsers()))
    }
  },

  getUsers() {
    this.ensureUsersSeeded()
    return safeParse(localStorage.getItem(AUTH_USERS_KEY), [])
	
  },
// ⭐ 自动补齐旧用户字段（兼容升级）
upgradeUsersSchema() {
  const users = this.getUsers()
  let changed = false

  users.forEach(u => {
    if (!('agent_company_id' in u)) {
      u.agent_company_id = null
      changed = true
    }
    if (!('tenant_role' in u)) {
      u.tenant_role = null
      changed = true
    }
  })

  if (changed) {
    localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users))
  }
},

  /**
   * 登录（本地校验）
   * remember=true -> 30天
   * remember=false -> 8小时
   */
  login({ username, password, remember = false }) {
    this.ensureUsersSeeded()
	this.upgradeUsersSchema() // ⭐新增这一行

    const users = this.getUsers()
    const u = users.find(x => x.username === String(username).trim())

    if (!u) {
      return { ok: false, message: '账号不存在' }
    }
    if (!u.enabled) {
      return { ok: false, message: '账号已被禁用' }
    }
    if (String(u.password) !== String(password)) {
      return { ok: false, message: '密码错误' }
    }

    const ttlMs = remember
      ? 30 * 24 * 60 * 60 * 1000  // 30d
      : 8 * 60 * 60 * 1000       // 8h

    // ✅ 修复：模板字符串必须用反引号
    const token = {
      token: `local_${nowMs()}_${Math.random().toString(36).slice(2)}`,
      issued_at: nowMs(),
      expires_at: nowMs() + ttlMs,
      remember
    }

const user = {
  id: u.id,
  username: u.username,
  name: u.name,
  role: u.role,

  // ⭐⭐⭐ 核心新增（代理订单归属字段）
  agent_company_id: u.agent_company_id || null,
  agent_contact: u.name,   // ← 代理联系人就是用户姓名

  tenant_role: u.tenant_role || null,
  permissions: u.permissions || []
}


    localStorage.setItem(AUTH_TOKEN_KEY, JSON.stringify(token))
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))

    return { ok: true, token, user }
  },

  logout() {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(AUTH_USER_KEY)
  },

  getToken() {
    return safeParse(localStorage.getItem(AUTH_TOKEN_KEY), null)
  },

  getUser() {
    return safeParse(localStorage.getItem(AUTH_USER_KEY), null)
  },

  // ✅ 保留你原来的命名（router guard 用的就是 isAuthed）
  isAuthed() {
    const t = this.getToken()
    if (!t) return false
    if (!t.expires_at) return false

    // 过期自动清理
    if (nowMs() > Number(t.expires_at)) {
      this.logout()
      return false
    }

    return true
  },

  /**
   * 未来接后端时你只需要：
   * - 把 login() 内的本地校验换成 API
   * - token/user 保存逻辑保持不变
   */
  async loginByApi(/* payload */) {
    throw new Error('Not implemented. Replace with real API.')
  },

  // =============================
  // 用户管理（本地版）
  // =============================
  createUser(payload) {
    this.ensureUsersSeeded()
    const users = this.getUsers()

    const username = String(payload.username || '').trim()
    if (!username) return { ok: false, message: '账号不能为空' }

    if (users.find(u => u.username === username)) {
      return { ok: false, message: '账号已存在' }
    }

const newUser = {
  id: `u_${Date.now()}`,
  username,
  password: String(payload.password || '123456'),
  name: String(payload.name || ''),
  role: payload.role || 'staff',

  // ⭐⭐⭐ 新增：多租户核心字段
  agent_company_id:
    payload.role === 'agent'
      ? String(payload.agent_company_id || '')
      : null,

  // ⭐ 预留未来代理内部权限
  tenant_role: payload.role === 'agent' ? 'admin' : null,

  enabled: true,
  created_at: new Date().toISOString()
}



    users.unshift(newUser)
    // ✅ 修复：不要写死 key
    localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users))
    return { ok: true }
  },

  updateUser(id, patch) {
    const users = this.getUsers()
    const idx = users.findIndex(u => u.id === id)
    if (idx === -1) return { ok: false }

    users[idx] = { ...users[idx], ...patch }
    localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users))
    return { ok: true }
  },

  deleteUser(id) {
    const users = this.getUsers().filter(u => u.id !== id)
    localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users))
    return { ok: true }
  },

  resetPassword(id) {
    const users = this.getUsers()
    const idx = users.findIndex(u => u.id === id)
    if (idx === -1) return { ok: false }

    const tempPwd = genTempPassword()
    users[idx].password = tempPwd

    localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users))

    return { ok: true, tempPwd }
  },

  // =============================
  // 当前用户修改密码
  // =============================
  changeMyPassword(oldPwd, newPwd) {
    const currentUser = this.getUser()
    if (!currentUser) return { ok: false, message: '未登录' }

    const users = this.getUsers()
    const idx = users.findIndex(u => u.id === currentUser.id)
    if (idx === -1) return { ok: false, message: '账号不存在' }

    if (String(users[idx].password) !== String(oldPwd)) {
      return { ok: false, message: '旧密码错误' }
    }

    users[idx].password = String(newPwd || '')
    localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users))

    return { ok: true }
  },

  // =============================
  // 管理员修改任意用户密码
  // =============================
  adminChangePassword(userId, newPwd) {
    const users = this.getUsers()
    const idx = users.findIndex(u => u.id === userId)
    if (idx === -1) return { ok: false }

    users[idx].password = String(newPwd || '')
    localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users))

    return { ok: true }
  }
}
