import { ref, onMounted, onBeforeUnmount } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { ElMessageBox } from 'element-plus'

export function useUnsavedGuard() {
  const isDirty = ref(false)

  const markDirty = () => {
    isDirty.value = true
  }

  const markClean = () => {
    isDirty.value = false
  }

  // 路由离开拦截
  onBeforeRouteLeave((to, from, next) => {
    if (!isDirty.value) return next()

    ElMessageBox.confirm(
      '当前页面有未保存的更改，是否离开？',
      '未保存提醒',
      {
        confirmButtonText: '放弃修改',
        cancelButtonText: '继续编辑',
        type: 'warning'
      }
    )
      .then(() => next())
      .catch(() => next(false))
  })

  // 浏览器关闭 / 刷新拦截
  const beforeUnload = (e: BeforeUnloadEvent) => {
    if (!isDirty.value) return
    e.preventDefault()
    e.returnValue = ''
  }

  onMounted(() => window.addEventListener('beforeunload', beforeUnload))
  onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload))

  return {
    isDirty,
    markDirty,
    markClean
  }
}
