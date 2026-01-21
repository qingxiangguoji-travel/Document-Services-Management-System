<template>
  <PageLayout>
    <template #title>业务流程状态配置</template>
    <template #subtitle>拖拽行记录可调整业务状态在系统中的前后流转顺序</template>

    <el-card shadow="never" class="section-card">
      <el-table :data="statusList" border stripe class="workflow-table drag-table-status">
        <el-table-column width="50" align="center">
          <template #default>
            <el-icon class="drag-handler"><Rank /></el-icon>
          </template>
        </el-table-column>
        <el-table-column prop="value" label="Key" width="120" />
        <el-table-column label="显示文本">
          <template #default="{ row }">
            <el-input v-model="row.label" @change="save" />
          </template>
        </el-table-column>
        <el-table-column label="颜色" width="160">
          <template #default="{ row }">
            <el-select v-model="row.color" @change="save">
              <el-option label="蓝色" value="primary" />
              <el-option label="绿色" value="success" />
              <el-option label="橙色" value="warning" />
              <el-option label="红色" value="danger" />
              <el-option label="灰色" value="info" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="预览" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.color" effect="dark">{{ row.label }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </PageLayout>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { Rank } from '@element-plus/icons-vue'
import { db } from '@/utils/storage'
import PageLayout from '@/layouts/PageLayout.vue'
import Sortable from 'sortablejs'

const statusList = ref([])

const loadData = () => {
  statusList.value = db.getConfigs().orderStatuses || []
  initDrag()
}

onMounted(loadData)

const save = () => {
  const c = db.getConfigs()
  c.orderStatuses = statusList.value
  db.saveConfigs(c)
}

const initDrag = () => {
  nextTick(() => {
    const el = document.querySelector('.drag-table-status .el-table__body-wrapper tbody')
    if (!el) return
    Sortable.create(el, {
      handle: '.drag-handler',
      onEnd: ({ newIndex, oldIndex }) => {
        const currRow = statusList.value.splice(oldIndex, 1)[0]
        statusList.value.splice(newIndex, 0, currRow)
        save()
      }
    })
  })
}
</script>

<style scoped>
.section-card { border-radius: 12px; border: 1px solid #e2e8f0; }
.drag-handler { cursor: move; color: #94a3b8; }
.status-code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
</style>