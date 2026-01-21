<template>
  <el-dropdown
    ref="columnMenuRef"
    trigger="click"
    :visible="visible"
    :style="{ left: position.x + 'px', top: position.y + 'px', position: 'fixed' }"
    @click-outside="handleClose"
    @visible-change="handleVisibleChange"
  >
    <el-dropdown-menu>
      <el-dropdown-item @click="handleHideColumn">
        <el-icon><Hide /></el-icon>
        隐藏此列
      </el-dropdown-item>

      <el-dropdown-item @click="handleShowAllColumns">
        <el-icon><View /></el-icon>
        显示所有列
      </el-dropdown-item>

      <el-dropdown-item @click="handleShowHiddenRows">
        <el-icon><View /></el-icon>
        显示隐藏的行
      </el-dropdown-item>
    </el-dropdown-menu>
  </el-dropdown>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Hide, View } from '@element-plus/icons-vue'

interface Props {
  visible: boolean
  position: { x: number; y: number }
  column: any
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'hide-column'): void
  (e: 'show-all-columns'): void
  (e: 'show-hidden-rows'): void
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const columnMenuRef = ref()

// 处理可见性变化
const handleVisibleChange = (value: boolean) => {
  emit('update:visible', value)
  if (!value) emit('close')
}

// 隐藏此列
const handleHideColumn = () => {
  emit('hide-column')
  emit('update:visible', false)
  emit('close')
}

// 显示所有列
const handleShowAllColumns = () => {
  emit('show-all-columns')
  emit('update:visible', false)
  emit('close')
}

// 显示隐藏的行
const handleShowHiddenRows = () => {
  emit('show-hidden-rows')
  emit('update:visible', false)
  emit('close')
}

// 关闭菜单
const handleClose = () => {
  emit('update:visible', false)
  emit('close')
}
</script>
