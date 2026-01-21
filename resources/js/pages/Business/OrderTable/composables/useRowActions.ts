import { ref } from 'vue'

export function useRowActions(emit: any) {
  // =========================
  // 状态
  // =========================
  const contextMenuVisible = ref(false)
  const contextMenuPosition = ref({ x: 0, y: 0 })
  const contextMenuRow = ref<any>(null)

  // =========================
  // 显示右键菜单
  // =========================
  const showRowContextMenu = (
    row: any,
    _column: any,
    event: MouseEvent
  ) => {
    if (!event) return
    event.preventDefault()

    contextMenuRow.value = row
    contextMenuPosition.value = {
      x: event.clientX,
      y: event.clientY
    }
    contextMenuVisible.value = true
  }

  // =========================
  // 文件管理（核心修复）
  // =========================
  const handleOpenFiles = (row: any) => {
    if (!row) return

    const payload = {
      rowId: row.id,
      customerId: row.customer_id,
      rowData: row
    }

    console.log('📂 打开文件抽屉 payload:', payload)
    emit('open-files', payload)
  }

  // =========================
  // 删除行
  // =========================
  const handleRemoveRow = (row: any, displayIndex: number) => {
    emit('remove', row, displayIndex)
  }

  // =========================
  // 关闭菜单
  // =========================
  const closeContextMenu = () => {
    contextMenuVisible.value = false
    contextMenuRow.value = null
  }

  return {
    // 状态
    contextMenuVisible,
    contextMenuPosition,
    contextMenuRow,

    // 方法
    showRowContextMenu,
    handleOpenFiles,
    handleRemoveRow,
    closeContextMenu
  }
}
