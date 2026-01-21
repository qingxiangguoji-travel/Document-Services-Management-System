<template>
  <div class="table-header-container">
    <!-- 列头右键菜单 -->
    <ColumnContextMenu
      :visible="columnMenuVisible"
      :position="columnMenuPosition"
      :column="currentColumn"
      @hide-column="handleHideColumn"
      @show-all-columns="handleShowAllColumns"
      @show-hidden-rows="handleShowHiddenRows"
      @close="closeColumnMenu"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import ColumnContextMenu from './ColumnContextMenu.vue'
import type { ColumnDefinition } from '../types/table'

interface Props {
  visibleColumns: ColumnDefinition[]
}

interface Emits {
  (e: 'show-column-menu', column: any, event: MouseEvent): void
  (e: 'close-column-menu'): void
  (e: 'hide-column', columnKey: string, columnLabel: string): void
  (e: 'show-all-columns'): void
  (e: 'show-hidden-rows'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 列菜单相关
const columnMenuVisible = ref(false)
const columnMenuPosition = ref({ x: 0, y: 0 })
const currentColumn = ref<any>(null)

// 显示列右键菜单
const showColumnMenu = (column: any, event: MouseEvent) => {
  event.preventDefault()
  currentColumn.value = column
  columnMenuPosition.value = { x: event.clientX, y: event.clientY }
  columnMenuVisible.value = true
  emit('show-column-menu', column, event)
}

// 隐藏当前列
const handleHideColumn = () => {
  if (currentColumn.value && currentColumn.value.columnKey) {
    emit('hide-column', currentColumn.value.columnKey, currentColumn.value.label)
    columnMenuVisible.value = false
  }
}

// 显示所有列
const handleShowAllColumns = () => {
  emit('show-all-columns')
  columnMenuVisible.value = false
}

// 显示隐藏的行
const handleShowHiddenRows = () => {
  emit('show-hidden-rows')
  columnMenuVisible.value = false
}

// 关闭列菜单
const closeColumnMenu = () => {
  columnMenuVisible.value = false
  emit('close-column-menu')
}

// 暴露方法给父组件
defineExpose({
  showColumnMenu,
  closeColumnMenu
})
</script>

<style scoped>
.table-header-container {
  position: relative;
}
</style>