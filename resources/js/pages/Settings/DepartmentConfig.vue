<template>
  <PageLayout>
    <template #title>办理部门管理</template>
    <template #subtitle>按住左侧图标可直接拖拽调整部门展示顺序</template>

    <template #actions>
      <el-button type="primary" size="large" :icon="Plus" @click="add" class="btn-emphasize">
        创建部门
      </el-button>
    </template>

    <el-card shadow="never" class="section-card">
      <el-table :data="depts" border stripe class="system-table drag-table-dept">
        <el-table-column width="50" align="center">
          <template #default>
            <el-icon class="drag-handler"><Rank /></el-icon>
          </template>
        </el-table-column>
        <el-table-column prop="id" label="识别码" width="120" align="center" />
        <el-table-column label="部门名称">
          <template #default="{$index}">
            <el-input v-model="depts[$index].name" @change="save" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center">
          <template #default="{$index}">
            <el-button link type="danger" @click="remove($index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </PageLayout>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { Plus, Rank } from '@element-plus/icons-vue'
import { db } from '@/utils/storage'
import PageLayout from '@/layouts/PageLayout.vue'
import Sortable from 'sortablejs'

const depts = ref([])

const loadData = () => {
  depts.value = db.getConfigs().departments || []
  initDrag()
}

onMounted(loadData)

const save = () => {
  const c = db.getConfigs()
  c.departments = depts.value
  db.saveConfigs(c)
}

const add = () => {
  depts.value.push({ id: Date.now().toString().slice(-4), name: '新部门' })
  save()
}

const remove = (idx) => {
  depts.value.splice(idx, 1)
  save()
}

const initDrag = () => {
  nextTick(() => {
    const el = document.querySelector('.drag-table-dept .el-table__body-wrapper tbody')
    if (!el) return
    Sortable.create(el, {
      handle: '.drag-handler',
      onEnd: ({ newIndex, oldIndex }) => {
        const currRow = depts.value.splice(oldIndex, 1)[0]
        depts.value.splice(newIndex, 0, currRow)
        save()
      }
    })
  })
}
</script>

<style scoped>
.section-card { border-radius: 12px; border: 1px solid #e2e8f0; }
.drag-handler { cursor: move; color: #94a3b8; }
.btn-emphasize { font-weight: 700; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2); }
</style>