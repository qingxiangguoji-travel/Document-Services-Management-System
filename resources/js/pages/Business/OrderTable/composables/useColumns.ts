import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { getColumnsByModule, type ColumnDefinition } from '../config/columns'
import type { ModuleType } from '../types/table'

export function useColumns(module: ModuleType) {
  // 所有列定义
  const allColumns = computed(() => getColumnsByModule(module))
  
  // 列可见性状态
  const columnVisibility = reactive<Record<string, boolean>>({})
  
  // 初始化列可见性
  const initColumnVisibility = () => {
    const savedVisibility = localStorage.getItem('orderTable_columnVisibility')
    
    if (savedVisibility) {
      Object.assign(columnVisibility, JSON.parse(savedVisibility))
    } else {
      // 设置所有列默认可见
      allColumns.value.forEach(col => {
        if (col.canHide !== false) {
          columnVisibility[col.key] = true
        }
      })
    }
  }
  
  // 检查列是否可见
  const isColumnVisible = (columnKey: string) => {
    return columnVisibility[columnKey] !== false
  }
  
  // 获取可见列
  const visibleColumns = computed(() => {
    return allColumns.value.filter(col => isColumnVisible(col.key))
  })
  
  // 隐藏列
  const hideColumn = (columnKey: string, columnLabel: string) => {
    if (columnVisibility[columnKey] !== false) {
      columnVisibility[columnKey] = false
      localStorage.setItem('orderTable_columnVisibility', JSON.stringify(columnVisibility))
      ElMessage.success(`已隐藏列: ${columnLabel}`)
    }
  }
  
  // 显示所有列
  const showAllColumns = () => {
    allColumns.value.forEach(col => {
      if (col.canHide !== false) {
        columnVisibility[col.key] = true
      }
    })
    localStorage.setItem('orderTable_columnVisibility', JSON.stringify(columnVisibility))
    ElMessage.success('已显示所有列')
  }
  
  // 重置列可见性
  const resetColumnVisibility = () => {
    allColumns.value.forEach(col => {
      if (col.canHide !== false) {
        columnVisibility[col.key] = true
      }
    })
    localStorage.setItem('orderTable_columnVisibility', JSON.stringify(columnVisibility))
  }
  
  return {
    allColumns,
    visibleColumns,
    columnVisibility,
    initColumnVisibility,
    isColumnVisible,
    hideColumn,
    showAllColumns,
    resetColumnVisibility
  }
}