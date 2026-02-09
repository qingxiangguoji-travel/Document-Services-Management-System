// =====================================================
// 认证中心 AuthService（系统唯一身份真理源）
// =====================================================

const AUTH_KEY = 'CURRENT_LOGIN_USER'

export interface LoginUser {
  id: string
  username: string
  role: 'admin' | 'staff' | 'agent'
  agent_company?: string   // 代理账号必须有
}

// ===============================
// 认证服务
// ===============================
export const authService = {

  // 获取当前登录用户
  getCurrentUser(): LoginUser | null {
    try {
      const raw = localStorage.getItem(AUTH_KEY)
      if (!raw) return null
      return JSON.parse(raw)
    } catch {
      return null
    }
  },

  // 登录（模拟）
  login(user: LoginUser) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user))
  },

  // 登出
  logout() {
    localStorage.removeItem(AUTH_KEY)
  },

  // 是否管理员
  isAdmin(): boolean {
    return this.getCurrentUser()?.role === 'admin'
  },

  // 是否代理
  isAgent(): boolean {
    return this.getCurrentUser()?.role === 'agent'
  },

  // 是否客服
  isStaff(): boolean {
    return this.getCurrentUser()?.role === 'staff'
  }
}
