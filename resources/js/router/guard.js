import { auth } from '@/utils/auth'
import { permissionService } from '@/domain/auth/permissionService'
import { ElMessage } from 'element-plus'

let permissionErrorShown = false

export function applyAuthGuard(router) {

  router.beforeEach((to, from, next) => {

    const requiresAuth = to.matched.some(r => r.meta?.requiresAuth)

    // ⭐ 用正确函数名
    const isLoggedIn = auth.isAuthed()

    // 未登录 → 去登录页
    if (!isLoggedIn && requiresAuth) {
      return next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
    }

    // 已登录访问 login → 回首页
    if (isLoggedIn && to.path === '/login') {
      return next('/')
    }

    if (!isLoggedIn) return next()

    // ⭐ 统一权限入口
    const canAccess = permissionService.canAccessRoute(to)

    if (!canAccess) {
      if (!permissionErrorShown) {
        ElMessage.error('没有访问权限')
        permissionErrorShown = true
        setTimeout(() => permissionErrorShown = false, 1500)
      }
      return next('/')
    }

    next()
  })

}
