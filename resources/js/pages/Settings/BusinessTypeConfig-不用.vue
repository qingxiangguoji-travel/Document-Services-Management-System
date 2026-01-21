<template>
  <PageLayout>
    <template #title>业务类型设置</template>
    <template #subtitle>配置订单页面可选的证件办理大类</template>

    <template #actions>
      <el-button type="primary" icon="Plus" @click="handleAdd">新增类型</el-button>
    </template>

    <el-card shadow="never" class="config-card">
      <el-table :data="typeList" border stripe>
        <el-table-column type="index" label="序号" width="70" align="center" />
        <el-table-column label="业务名称">
          <template #default="{ row, $index }">
            <el-input v-if="editIndex === $index" v-model="editValue" size="small" @blur="saveEdit($index)" @keyup.enter="saveEdit($index)" />
            <span v-else @click="startEdit($index, row)" class="clickable-text">{{ row }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center">
          <template #default="{ $index }">
            <el-button link type="danger" @click="handleDelete($index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="tip-box">
        <el-icon><InfoFilled /></el-icon>
        <span>点击名称可直接编辑，修改后将影响新建订单时的下拉选项。</span>
      </div>
    </el-card>
  </PageLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { InfoFilled } from '@element-plus/icons-vue'
import PageLayout from '@/layouts/PageLayout.vue'
import { db } from '@/utils/storage'

const typeList = ref([])
const editIndex = ref(-1)
const editValue = ref('')

// 初始化数据
const loadData = () => {
  const configs = db.getConfigs()
  typeList.value = configs.businessTypes || []
}

// 同步到数据库
const syncToDB = () => {
  const configs = db.getConfigs()
  configs.businessTypes = [...typeList.value]
  db.saveConfigs(configs)
}

const handleAdd = () => {
  ElMessageBox.prompt('请输入新的业务类型名称', '新增配置', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
  }).then(({ value }) => {
    if (value) {
      typeList.value.push(value)
      syncToDB()
      ElMessage.success('添加成功')
    }
  })
}

const startEdit = (index, value) => {
  editIndex.value = index
  editValue.value = value
}

const saveEdit = (index) => {
  if (editValue.value.trim()) {
    typeList.value[index] = editValue.value.trim()
    syncToDB()
  }
  editIndex.value = -1
}

const handleDelete = (index) => {
  ElMessageBox.confirm('删除后，新建订单将无法选择此项，确定吗？', '警告', { type: 'warning' }).then(() => {
    typeList.value.splice(index, 1)
    syncToDB()
    ElMessage.success('已删除')
  })
}

onMounted(loadData)
</script>

<style scoped>
.config-card { border-radius: 8px; border: 1px solid #e2e8f0; }
.clickable-text { cursor: pointer; color: #3b82f6; text-decoration: underline; text-underline-offset: 4px; }
.tip-box { margin-top: 20px; padding: 12px; background: #f8fafc; border-radius: 6px; color: #64748b; font-size: 13px; display: flex; align-items: center; gap: 8px; }
</style>