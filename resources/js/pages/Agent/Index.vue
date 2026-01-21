<template>
  <PageLayout>
    <template #title>代理客户管理</template>
    <template #subtitle>管理合作伙伴信息、联系方式、信用等级及佣金比例</template>
    <template #actions>
      <el-button type="primary" size="large" :icon="Plus" @click="openDrawer()" class="btn-emphasize">
        新增合作伙伴
      </el-button>
    </template>

    <el-card shadow="never" class="section-card search-card">
      <el-form :model="filters" inline>
        <el-form-item label="代理名称">
          <el-select
            v-model="filters.agentName"
            placeholder="选择或输入搜索"
            clearable
            filterable
            allow-create
            default-first-option
            style="width: 200px"
          >
            <el-option v-for="item in agentOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>

        <el-form-item label="联系人">
          <el-select
            v-model="filters.contactName"
            placeholder="选择或输入搜索"
            clearable
            filterable
            allow-create
            default-first-option
            style="width: 180px"
          >
            <el-option v-for="name in contactOptions" :key="name" :label="name" :value="name" />
          </el-select>
        </el-form-item>

        <el-form-item label="代理等级">
          <el-select v-model="filters.level" placeholder="全部等级" clearable style="width: 120px">
            <el-option v-for="l in AGENT_LEVELS" :key="l.value" :label="l.label" :value="l.value" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="section-card table-card">
      <el-table :data="filteredList" border stripe v-loading="loading" class="order-expand-table">
        
        <el-table-column type="expand">
          <template #default="props">
            <div class="expand-wrapper">
              <el-table :data="props.row.contacts" size="small" border>
                <el-table-column label="序号" type="index" width="60" align="center" />
                <el-table-column label="联系人姓名" prop="name" width="150" />
                <el-table-column label="联系电话" prop="phone" width="180">
                  <template #default="scope">{{ formatPhoneNumber(scope.row.phone) }}</template>
                </el-table-column>
                <el-table-column label="Telegram" prop="telegram">
                  <template #default="scope">
                    <span v-if="scope.row.telegram">@{{ scope.row.telegram }}</span>
                    <span v-else>-</span>
                  </template>
                </el-table-column>
                <el-table-column label="业务历史" width="120" align="center">
                  <template #default="scope">
                    <el-button 
                      link 
                      type="primary" 
                      @click="goContactHistory(props.row.name, scope.row.name)"
                    >
                      订单历史
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="代理统计信息" min-width="250">
          <template #default="{ row }">
            <div class="summary-content">
              <span class="summary-main-text">
                <strong class="agent-name-link" @click="openDrawer(row)">{{ row.name }}</strong>
                <span class="ml-2">共有 {{ row.contacts?.length || 0 }} 位联系人</span>
              </span>
              <div class="financial-brief">
                <span class="brief-item">累计已结: <i class="paid-val">${{ row.stats_paid.toLocaleString() }}</i></span>
                <span class="brief-item ml-2">待结订单: <i :class="['pending-val', { 'has-pending': row.stats_pending_count > 0 }]">{{ row.stats_pending_count }} 笔</i></span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="commission_rate" label="佣金比例" width="120" align="center">
          <template #default="{ row }">
            <el-tag type="warning" effect="plain">
              {{ row.commission_rate || 10 }}%
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="level" label="等级" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getLevelColor(row.level)" effect="dark" size="small">
              {{ row.level }} 级
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="industry" label="行业分类" width="120" align="center">
          <template #default="{ row }">
             <el-tag size="small" type="info">{{ row.industry || '未分类' }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="address" label="联系地址" min-width="200" show-overflow-tooltip />

        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDrawer(row)">编辑</el-button>
            <el-button link type="danger" @click="confirmDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <AgentDrawer 
      v-model:visible="drawerVisible"
      :edit-data="currentEditRow"
      :saving="saving"
      @save="handleSave"
    />
  </PageLayout>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Search, Refresh } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import PageLayout from '@/layouts/PageLayout.vue'
import AgentDrawer from './components/AgentDrawer.vue' 
import { AGENT_LEVELS } from '@/config/constants'
import { db } from '@/utils/storage'

const router = useRouter()
const loading = ref(false)
const saving = ref(false)
const drawerVisible = ref(false)
const list = ref([])
const currentEditRow = ref(null)

const loadData = () => {
  loading.value = true
  list.value = db.getAgents() || []
  loading.value = false
}

onMounted(loadData)

const filters = reactive({ agentName: '', contactName: '', level: '' })

const agentOptions = computed(() => {
  const names = list.value.map(item => item.name)
  return [...new Set(names)].filter(Boolean)
})

const contactOptions = computed(() => {
  const names = []
  list.value.forEach(item => {
    if (item.contacts) {
      item.contacts.forEach(c => {
        if (c.name) names.push(c.name)
      })
    }
  })
  return [...new Set(names)].filter(Boolean)
})

const filteredList = computed(() => {
  // 1. 获取统计所需的基础数据
  const allOrders = db.getRaw('ORDERS') || []
  const histories = db.getRaw('COMMISSION_HISTORY') || []

  return list.value
    .filter(item => {
      const nameMatch = filters.agentName ? item.name.toLowerCase().includes(filters.agentName.toLowerCase()) : true
      const levelMatch = filters.level ? item.level === filters.level : true
      const contactMatch = filters.contactName ? (item.contacts && item.contacts.some(c => c.name.toLowerCase().includes(filters.contactName.toLowerCase()))) : true
      return nameMatch && levelMatch && contactMatch
    })
    .map(agent => {
      // 2. 为过滤后的每一行实时计算统计值
      const totalPaid = histories
        .filter(h => h.agentName === agent.name || (agent.contacts && agent.contacts.some(c => h.agentName === c.name)))
        .reduce((sum, h) => sum + (Number(h.amount) || 0), 0)

      const pendingCount = allOrders.filter(o => 
        o.agent_company === agent.name && !o.commission_settled
      ).length

      return {
        ...agent,
        stats_paid: totalPaid,
        stats_pending_count: pendingCount
      }
    })
})

const formatPhoneNumber = (phone) => {
  if (!phone) return '-'
  return phone
}

const getLevelColor = (level) => AGENT_LEVELS.find(l => l.value === level)?.color || 'info'

const handleSearch = () => {
  loading.value = true
  setTimeout(() => { loading.value = false }, 200)
}

const handleReset = () => {
  filters.agentName = ''
  filters.contactName = ''
  filters.level = ''
  loadData()
}

const openDrawer = (row = null) => {
  if (row) {
    const rawRow = JSON.parse(JSON.stringify(row))
    if (rawRow.commission_rate === undefined) rawRow.commission_rate = 10
    currentEditRow.value = rawRow
  } else {
    currentEditRow.value = null
  }
  drawerVisible.value = true
}

const goContactHistory = (companyName, contactName) => {
  const agentLabel = `${companyName} - ${contactName}`
  router.push({ 
    name: 'business.orders', 
    query: { agent: agentLabel } 
  })
}

const handleSave = (formData) => {
  saving.value = true
  setTimeout(() => {
    try {
      db.saveAgent(formData) 
      loadData() 
      saving.value = false
      drawerVisible.value = false
      ElMessage.success('保存成功')
    } catch (e) {
      saving.value = false
      ElMessage.error('保存失败')
    }
  }, 300)
}

const confirmDelete = (agent) => {
  const allOrders = db.getRaw('ORDERS') || []
  const hasOrders = allOrders.some(o => o.agent === agent.name || (o.agent && o.agent.startsWith(agent.name)))
  if (hasOrders) {
    return ElMessageBox.alert(`代理 "${agent.name}" 下有关联订单，不可删除。`, '提示', { type: 'error' })
  }
  ElMessageBox.confirm(`确定要删除代理 "${agent.name}" 吗？`, '警告', { type: 'warning' }).then(() => {
    const newList = list.value.filter(item => item.id !== agent.id)
    db.saveRaw('AGENTS', newList) 
    loadData()
    ElMessage.success('已移除')
  })
}
</script>

<style scoped>
.section-card { border-top: none; margin-bottom: 20px; }
.agent-name-link { color: #2563eb; font-weight: 700; cursor: pointer; }
.agent-name-link:hover { text-decoration: underline; }
.expand-wrapper { padding: 10px 50px; background-color: #f8fafc; }
.ml-2 { margin-left: 10px; }
.btn-emphasize { font-weight: 700; box-shadow: 0 4px 12px rgba(37,99,235,0.2); }
.order-expand-table :deep(.el-table__expand-column .cell) { padding: 0; text-align: center; }

/* 仅增加统计文字的样式，不改动原有布局结构 */
.financial-brief { font-size: 12px; margin-top: 4px; display: flex; align-items: center; }
.brief-item { color: #64748b; }
.paid-val { color: #10b981; font-style: normal; font-weight: 600; margin-left: 2px; }
.pending-val { color: #94a3b8; font-style: normal; margin-left: 2px; }
.has-pending { color: #ef4444; font-weight: 600; }
</style>