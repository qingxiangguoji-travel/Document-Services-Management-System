<template>
  <PageLayout>
    <template #title>国籍管理</template>
    <template #subtitle>管理系统内置的国家列表，用于客户资料录入</template>
    
    <template #actions>
      <el-button type="primary" icon="Plus" @click="handleAdd">新增国家/地区</el-button>
    </template>

    <el-card shadow="never" class="section-card">
      <div class="filter-bar">
        <el-radio-group v-model="activeRegion" size="default">
          <el-radio-button label="全部" />
          <el-radio-button label="东南亚" />
          <el-radio-button label="东亚/南亚" />
        </el-radio-group>
      </div>

      <el-table :data="filteredData" style="width: 100%" border stripe>
        <el-table-column prop="code" label="国家代码" width="100" align="center" />
        <el-table-column label="国籍名称" min-width="150">
          <template #default="{ row }">
            <div style="display: flex; align-items: center; gap: 10px">
              <span class="flag-icon">{{ row.icon }}</span>
              <span style="font-weight: 600">{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="region" label="所属区域" width="120">
          <template #default="{ row }">
            <el-tag effect="plain">{{ row.region }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="en_name" label="英文全称" />
        <el-table-column label="操作" width="120" align="center">
          <template #default="{ $index }">
            <el-button link type="danger" @click="handleDelete($index)">移除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showAdd" title="新增国家" width="400px">
      <el-form :model="newCountry" label-position="top">
        <el-form-item label="中文名称">
          <el-input v-model="newCountry.name" placeholder="例如：中国" />
        </el-form-item>
        <el-form-item label="区域">
          <el-select v-model="newCountry.region" class="w-100">
            <el-option label="东南亚" value="东南亚" />
            <el-option label="东亚/南亚" value="东亚/南亚" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAdd = false">取消</el-button>
        <el-button type="primary" @click="confirmAdd">确认添加</el-button>
      </template>
    </el-dialog>
  </PageLayout>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PageLayout from '@/layouts/PageLayout.vue'

const activeRegion = ref('全部')
const showAdd = ref(false)
const newCountry = reactive({ name: '', region: '东南亚' })

const nationalities = ref([
  // 东南亚
  { code: 'KH', name: '柬埔寨', en_name: 'Cambodia', region: '东南亚', icon: '🇰🇭' },
  { code: 'CN', name: '中国', en_name: 'China', region: '东亚/南亚', icon: '🇨🇳' },
  { code: 'VN', name: '越南', en_name: 'Vietnam', region: '东南亚', icon: '🇻🇳' },
  { code: 'TH', name: '泰国', en_name: 'Thailand', region: '东南亚', icon: '🇹🇭' },
  { code: 'MY', name: '马来西亚', en_name: 'Malaysia', region: '东南亚', icon: '🇲🇾' },
  { code: 'SG', name: '新加坡', en_name: 'Singapore', region: '东南亚', icon: '🇸🇬' },
  { code: 'PH', name: '菲律宾', en_name: 'Philippines', region: '东南亚', icon: '🇵🇭' },
  { code: 'ID', name: '印尼', en_name: 'Indonesia', region: '东南亚', icon: '🇮🇩' },
  { code: 'LA', name: '老挝', en_name: 'Laos', region: '东南亚', icon: '🇱🇦' },
  { code: 'MM', name: '缅甸', en_name: 'Myanmar', region: '东南亚', icon: '🇲🇲' },
  // 其他亚洲
  { code: 'JP', name: '日本', en_name: 'Japan', region: '东亚/南亚', icon: '🇯🇵' },
  { code: 'KR', name: '韩国', en_name: 'South Korea', region: '东亚/南亚', icon: '🇰🇷' },
  { code: 'IN', name: '印度', en_name: 'India', region: '东亚/南亚', icon: '🇮🇳' }
])

const filteredData = computed(() => {
  if (activeRegion.value === '全部') return nationalities.value
  return nationalities.value.filter(n => n.region === activeRegion.value)
})

const handleAdd = () => { showAdd.value = true }
const confirmAdd = () => {
  if (!newCountry.name) return
  nationalities.value.unshift({
    code: 'NEW',
    name: newCountry.name,
    en_name: '-',
    region: newCountry.region,
    icon: '🏳️'
  })
  showAdd.value = false
  ElMessage.success('国家添加成功')
}

const handleDelete = (index) => {
  ElMessageBox.confirm('确定删除此国家吗？', '提示').then(() => {
    nationalities.value.splice(index, 1)
  })
}
</script>

<style scoped>
.filter-bar { margin-bottom: 20px; }
.flag-icon { font-size: 20px; }
.w-100 { width: 100%; }
.section-card { border: 1px solid #e2e8f0; border-radius: 12px; }
</style>