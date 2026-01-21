<template>
  <el-dropdown
    ref="contextMenuRef"
    trigger="click"
    :visible="visible"
    :style="{ left: position.x + 'px', top: position.y + 'px', position: 'fixed' }"
    @click-outside="handleClose"
    @visible-change="handleVisibleChange"
  >
    <el-dropdown-menu>
      <el-dropdown-item @click="handleAddBusiness">
        <el-icon><Plus /></el-icon>
        在此客户添加业务
      </el-dropdown-item>

      <el-dropdown-item divided @click="handleHideRow">
        <el-icon><Hide /></el-icon>
        隐藏此行
      </el-dropdown-item>

      <el-dropdown-item @click="handlePasteData">
        <el-icon><DocumentCopy /></el-icon>
        粘贴Excel数据
      </el-dropdown-item>
    </el-dropdown-menu>
  </el-dropdown>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Plus, Hide, DocumentCopy } from '@element-plus/icons-vue'

interface Props {
  visible: boolean
  position: { x: number; y: number }
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'add-business'): void
  (e: 'hide-row'): void
  (e: 'paste-data'): void
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const contextMenuRef = ref()

const handleVisibleChange = (value: boolean) => {
  emit('update:visible', value)
  if (!value) emit('close')
}

const handleAddBusiness = () => {
  emit('add-business')
  emit('update:visible', false)
  emit('close')
}

const handleHideRow = () => {
  emit('hide-row')
  emit('update:visible', false)
  emit('close')
}

const handlePasteData = () => {
  emit('paste-data')
  emit('update:visible', false)
  emit('close')
}

const handleClose = () => {
  emit('update:visible', false)
  emit('close')
}
</script>
