<template>
  <div
    v-show="visible"
    class="row-context-menu"
    :style="{
      left: position.x + 'px',
      top: position.y + 'px'
    }"
    @click.stop
  >
    <div class="menu-item" @click="handleAddBusiness">
      <el-icon><Plus /></el-icon>
      <span>在此客户添加业务</span>
    </div>

    <div class="menu-divider" />

    <div class="menu-item" @click="handleHideRow">
      <el-icon><Hide /></el-icon>
      <span>隐藏此行</span>
    </div>

    <div class="menu-item" @click="handlePasteData">
      <el-icon><DocumentCopy /></el-icon>
      <span>粘贴Excel数据</span>
    </div>
  </div>
</template>

<script setup lang="ts">
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

const close = () => {
  emit('update:visible', false)
  emit('close')
}

const handleAddBusiness = () => {
  emit('add-business')
  close()
}

const handleHideRow = () => {
  emit('hide-row')
  close()
}

const handlePasteData = () => {
  emit('paste-data')
  close()
}

// 点击空白关闭
const handleClickOutside = (e: MouseEvent) => {
  close()
}

document.addEventListener('click', handleClickOutside)
</script>

<style scoped>
.row-context-menu {
  position: fixed;
  z-index: 9999;
  min-width: 180px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  padding: 6px 0;
  font-size: 13px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  cursor: pointer;
  color: #334155;
  transition: background 0.15s;
}

.menu-item:hover {
  background: #f1f5f9;
}

.menu-divider {
  height: 1px;
  background: #e5e7eb;
  margin: 4px 0;
}
</style>
