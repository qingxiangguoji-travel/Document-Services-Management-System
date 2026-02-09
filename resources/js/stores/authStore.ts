import { ref } from 'vue'
import { auth } from '@/utils/auth'

/**
 * Auth Store（响应式层）
 * 未来可无缝切 Pinia / API
 */

const users = ref(auth.getUsers())

const refreshUsers = () => {
  users.value = auth.getUsers()
}

export const authStore = {

  users,

  refreshUsers,

  /* 创建用户 */
  createUser(payload:any) {
    const res = auth.createUser(payload)
    if (res.ok) refreshUsers()
    return res
  },

  /* 更新用户 */
  updateUser(id:string, patch:any) {
    const res = auth.updateUser(id, patch)
    if (res.ok) refreshUsers()
    return res
  },

  /* 删除用户 */
  deleteUser(id:string) {
    const res = auth.deleteUser(id)
    if (res.ok) refreshUsers()
    return res
  },

  /* 重置密码 */
  resetPassword(id:string) {
    return auth.resetPassword(id)
  },

  /* 管理员修改密码 */
  adminChangePassword(id:string, pwd:string) {
    return auth.adminChangePassword(id, pwd)
  }

}
