import { db } from '@/utils/storage'

const KEY = 'SYSTEM_USERS'
const CURRENT = 'CURRENT_USER'

class AuthService {

  // 获取当前登录用户
  getCurrentUser() {
    return db.getRaw(CURRENT)
  }

  // 登录
  login(username: string, password: string) {
    const users = db.getRaw(KEY) || []
    const user = users.find(u => u.username === username)

    if (!user || user.password !== password) {
      throw new Error('用户名或密码错误')
    }

    db.saveRaw(CURRENT, user)
    return user
  }

  logout() {
    db.removeRaw(CURRENT)
  }

  // 是否登录
  isLoggedIn() {
    return !!this.getCurrentUser()
  }

  // 修改密码
  changePassword(oldPwd: string, newPwd: string) {
    const user = this.getCurrentUser()
    if (!user) throw new Error('未登录')

    if (user.password !== oldPwd) {
      throw new Error('旧密码错误')
    }

    const users = db.getRaw(KEY) || []
    const idx = users.findIndex(u => u.id === user.id)

    users[idx].password = newPwd
    users[idx].must_change_password = false

    db.saveRaw(KEY, users)
    db.saveRaw(CURRENT, users[idx])
  }
}

export const authService = new AuthService()
