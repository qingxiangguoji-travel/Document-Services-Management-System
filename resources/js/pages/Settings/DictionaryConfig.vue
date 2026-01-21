<template>
  <PageLayout>
    <template #title>基础字典配置</template>
    <template #subtitle>管理系统全局通用的业务类型与国籍选项</template>
    
    <template #actions>
      <el-button 
        v-if="activeTab === 'biz'" 
        type="primary" 
        :icon="Plus" 
        @click="add('businessTypes')" 
        class="btn-emphasize"
      >
        新增业务类型
      </el-button>
      <el-button 
        v-if="activeTab === 'nat'" 
        type="primary" 
        :icon="Plus" 
        @click="add('nationalities')" 
        class="btn-emphasize"
      >
        新增国家/地区
      </el-button>
    </template>

    <el-card shadow="never" class="section-card">
      <el-tabs v-model="activeTab" class="standard-tabs">
        <el-tab-pane label="证件业务类型" name="biz">
          <el-table :data="configs.businessTypes" border stripe class="config-table drag-table">
            <el-table-column width="50" align="center">
              <template #default>
                <el-icon class="drag-handler"><Rank /></el-icon>
              </template>
            </el-table-column>
            <el-table-column type="index" label="序号" width="70" align="center" />
            <el-table-column label="分类名称">
              <template #default="{ $index }">
                <el-input v-model="configs.businessTypes[$index]" placeholder="按住左侧图标可拖拽排序" @change="save" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" align="center">
              <template #default="{ $index }">
                <el-button link type="danger" @click="remove('businessTypes', $index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="国籍管理" name="nat">
          <el-table :data="configs.nationalities" border stripe height="550" class="config-table drag-table">
            <el-table-column width="50" align="center">
              <template #default>
                <el-icon class="drag-handler"><Rank /></el-icon>
              </template>
            </el-table-column>
            <el-table-column type="index" label="序号" width="70" align="center" />
            <el-table-column label="国家名称">
              <template #default="{ $index }">
                <el-input v-model="configs.nationalities[$index]" @change="save" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" align="center">
              <template #default="{ $index }">
                <el-button link type="danger" @click="remove('nationalities', $index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </PageLayout>
</template>

<script setup>
import { ref, reactive, watch, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { Plus, Rank } from '@element-plus/icons-vue'
import { db } from '@/utils/storage'
import { ElMessage } from 'element-plus'
import PageLayout from '@/layouts/PageLayout.vue'
import Sortable from 'sortablejs'

const route = useRoute()
const activeTab = ref('biz')
const configs = reactive({ businessTypes: [], nationalities: [] })

const load = () => {
  const data = db.getConfigs()
  configs.businessTypes = data.businessTypes || []
  configs.nationalities = data.nationalities || []
  initDrag()
}

const save = () => {
  const raw = db.getConfigs()
  db.saveConfigs({ ...raw, ...configs })
}

const add = (key) => {
  configs[key].unshift('')
  save()
}

const remove = (key, idx) => {
  configs[key].splice(idx, 1)
  save()
}

// 拖拽初始化逻辑
const initDrag = () => {
  nextTick(() => {
    const el = document.querySelectorAll('.drag-table .el-table__body-wrapper tbody')
    el.forEach((target, index) => {
      Sortable.create(target, {
        handle: '.drag-handler',
        onEnd: ({ newIndex, oldIndex }) => {
          const key = index === 0 ? 'businessTypes' : 'nationalities'
          const currRow = configs[key].splice(oldIndex, 1)[0]
          configs[key].splice(newIndex, 0, currRow)
          save()
          ElMessage.success('排序已更新')
        }
      })
    })
  })
}

watch(() => route.path, load, { immediate: true })
watch(activeTab, initDrag)
</script>

<style scoped>
.section-card { border-radius: 12px; border: 1px solid #e2e8f0; }
.drag-handler { cursor: move; color: #94a3b8; font-size: 18px; }
.drag-handler:hover { color: #2563eb; }
.btn-emphasize { font-weight: 700; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2); }
:deep(.el-tabs__item) { font-weight: 700; height: 50px; }
</style>