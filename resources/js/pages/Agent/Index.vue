<template>
  <TablePageLayout>
    <template #title>代理客户管理</template>
    <template #subtitle>管理合作伙伴信息、联系方式、信用等级及佣金比例</template>

    <template #actions>
      <el-button :icon="Download" @click="exportExcel">导出代理客户信息</el-button>
      <el-button
        type="primary"
        size="large"
        :icon="Plus"
        class="btn-emphasize"
        @click="openDrawer()"
      >
        新增合作伙伴
      </el-button>
    </template>

    <!-- 搜索区 -->
    <template #search>
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
    </template>

    <!-- 表格区 -->
    <template #table>
      <el-table
        ref="tableRef"
        :data="filteredList"
        border
        stripe
        v-loading="loading"
        class="order-expand-table"
        highlight-current-row
        height="100%"
        @current-change="handleCurrentChange"
      >
        <!-- 展开列 -->
        <el-table-column type="expand">
          <template #default="props">
            <div class="expand-wrapper">
              <el-table :data="props.row.contacts" size="small" border>
                <el-table-column label="序号" type="index" width="60" align="center" />
                <el-table-column label="联系人姓名" prop="name" width="150" />
                <el-table-column label="联系电话" prop="phone" width="180">
                  <template #default="scope">
                    {{ formatPhoneNumber(scope.row.phone) }}
                  </template>
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

        <!-- 代理统计 -->
        <el-table-column label="代理统计信息" min-width="250">
          <template #default="{ row }">
            <div class="summary-content">
              <span class="summary-main-text">
                <strong class="agent-name-link" @click="openDrawer(row)">
                  {{ row.name }}
                </strong>
                <span class="ml-2">共有 {{ row.contacts?.length || 0 }} 位联系人</span>
              </span>

              <div class="financial-brief">
                <span class="brief-item">
                  累计已结: <i class="paid-val">${{ row.stats_paid.toLocaleString() }}</i>
                </span>

                <span class="brief-item ml-2">
                  待结订单:
                  <i class="pending-val" :class="{ 'has-pending': row.stats_pending_count > 0 }">
                    {{ row.stats_pending_count }} 笔
                  </i>
                </span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="commission_rate" label="佣金比例" width="120" align="center">
          <template #default="{ row }">
            <el-tag type="warning" effect="plain">{{ row.commission_rate || 10 }}%</el-tag>
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
    </template>
  </TablePageLayout>

  <!-- ✅ 抽屉：放在 TablePageLayout 外面（最稳） -->
  <AgentDrawer
    v-model:visible="drawerVisible"
    :edit-data="currentEditRow"
    :saving="saving"
    @save="handleSave"
  />
</template>


<script setup>
import TablePageLayout from '@/layouts/TablePageLayout.vue'
import { getRestoreTarget, clearRestoreTarget } from '@/utils/restoreNavigator'
import { useRoute, useRouter } from 'vue-router'
import { softDelete } from '@/domain/recycleService'
import { reactive, ref, computed, onMounted, watch, nextTick } from 'vue'
import { Plus, Search, Refresh, Download } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import AgentDrawer from './components/AgentDrawer.vue'
import { AGENT_LEVELS } from '@/config/constants'
import { db } from '@/utils/storage'
import * as XLSX from 'xlsx'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const saving = ref(false)
const drawerVisible = ref(false)
const list = ref([])
const currentEditRow = ref(null)

const tableRef = ref()

// =======================
// 数据加载
// =======================
const loadData = () => {
  loading.value = true
  list.value = db.getAgents() || []
  loading.value = false
}

// =======================
// 恢复定位核心（生产级）
// =======================
const handleRestoreJump = async () => {
  const urlId = route.query.restore
  const targetId = urlId || getRestoreTarget()?.id
  if (!targetId) return

  loadData()
  await nextTick()

  const row = filteredList.value.find(
    r => String(r.id) === String(targetId)
  )

  if (row && tableRef.value) {
    tableRef.value.setCurrentRow(row)

    const index = filteredList.value.indexOf(row)
    const rows = tableRef.value.$el?.querySelectorAll(
      '.el-table__body tr'
    )
    rows?.[index]?.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    })
  }

  clearRestoreTarget()
  router.replace({ query: {} })
}

// =======================
// 生命周期
// =======================
onMounted(async () => {
  loadData()
  await handleRestoreJump()
})

watch(
  () => route.fullPath,
  async () => {
    await handleRestoreJump()
  }
)

// =======================
// 过滤条件
// =======================
const filters = reactive({
  agentName: '',
  contactName: '',
  level: ''
})

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

// =======================
// 表格数据
// =======================
const filteredList = computed(() => {
  const allOrders = db.getRaw('ORDERS') || []
  const histories = db.getRaw('COMMISSION_HISTORY') || []

  return list.value
    .filter(item => {
      const nameMatch = filters.agentName
        ? item.name
            .toLowerCase()
            .includes(filters.agentName.toLowerCase())
        : true

      const levelMatch = filters.level
        ? item.level === filters.level
        : true

      const contactMatch = filters.contactName
        ? item.contacts?.some(c =>
            c.name
              .toLowerCase()
              .includes(filters.contactName.toLowerCase())
          )
        : true

      return nameMatch && levelMatch && contactMatch
    })
    .map(agent => {
      const totalPaid = histories
        .filter(h =>
          h.agentName === agent.name ||
          agent.contacts?.some(c => h.agentName === c.name)
        )
        .reduce((sum, h) => sum + (Number(h.amount) || 0), 0)

      const pendingCount = allOrders.filter(
        o =>
          o.agent_company === agent.name &&
          !o.commission_settled
      ).length

      return {
        ...agent,
        stats_paid: totalPaid,
        stats_pending_count: pendingCount
      }
    })
})

// =======================
// 工具
// =======================
const formatPhoneNumber = phone => phone || '-'

const getLevelColor = level =>
  AGENT_LEVELS.find(l => l.value === level)?.color ||
  'info'

// =======================
// 搜索
// =======================
const handleSearch = () => {
  loading.value = true
  setTimeout(() => (loading.value = false), 200)
}

const handleReset = () => {
  filters.agentName = ''
  filters.contactName = ''
  filters.level = ''
  loadData()
}

// =======================
// 抽屉
// =======================
const openDrawer = (row = null) => {
  if (row) {
    const rawRow = JSON.parse(JSON.stringify(row))
    if (rawRow.commission_rate === undefined) {
      rawRow.commission_rate = 10
    }
    currentEditRow.value = rawRow
  } else {
    currentEditRow.value = null
  }
  drawerVisible.value = true
}

// =======================
// 跳转订单历史
// =======================
const goContactHistory = (companyName, contactName) => {
  const agentLabel = `${companyName} - ${contactName}`
  router.push({
    name: 'business.orders',
    query: { agent: agentLabel }
  })
}

const handleCurrentChange = () => {}

// =======================
// 保存
// =======================
const handleSave = formData => {
  saving.value = true
  setTimeout(() => {
    try {
      db.saveAgent(formData)
      loadData()
      saving.value = false
      drawerVisible.value = false
      ElMessage.success('保存成功')
    } catch {
      saving.value = false
      ElMessage.error('保存失败')
    }
  }, 300)
}

// =======================
// 删除 → 回收站
// =======================
const confirmDelete = agent => {
  const allOrders = db.getRaw('ORDERS') || []
  const hasOrders = allOrders.some(
    o => o.agent === agent.name
  )

  if (hasOrders) {
    return ElMessageBox.alert(
      `代理 "${agent.name}" 下有关联订单，不可删除。`,
      '提示',
      { type: 'error' }
    )
  }

  ElMessageBox.confirm(
    `确定要删除代理 "${agent.name}" 吗？`,
    '警告',
    { type: 'warning' }
  ).then(() => {
    softDelete({
      module: 'agent',
      sourceId: agent.id,
      snapshot: agent,
      operator: '管理员',
      reason: '删除代理'
    })

    const newList = list.value.filter(
      item => item.id !== agent.id
    )
    db.saveRaw('AGENTS', newList)

    loadData()
    ElMessage.success('已移入回收站')
  })
}

// =======================
// Excel 导出
// =======================
const exportExcel = () => {
  if (!filteredList.value.length) {
    return ElMessage.warning('当前没有可导出的数据')
  }

  const rows = []

  filteredList.value.forEach(agent => {
    if (!agent.contacts || !agent.contacts.length) {
      rows.push({
        代理名称: agent.name,
        合作时间: agent.cooperate_time || '',
        地区: agent.region || '',
        等级: agent.level,
        行业: agent.industry || '',
        地址: agent.address || '',
        佣金比例: `${agent.commission_rate || 10}%`,
        联系人姓名: '',
        电话: '',
        Telegram: '',
        已结金额: agent.stats_paid,
        待结订单数: agent.stats_pending_count
      })
    } else {
      agent.contacts.forEach(c => {
        rows.push({
          代理名称: agent.name,
          合作时间: agent.cooperate_time || '',
          地区: agent.region || '',
          等级: agent.level,
          行业: agent.industry || '',
          地址: agent.address || '',
          佣金比例: `${agent.commission_rate || 10}%`,
          联系人姓名: c.name || '',
          电话: c.phone || '',
          Telegram: c.telegram || '',
          已结金额: agent.stats_paid,
          待结订单数: agent.stats_pending_count
        })
      })
    }
  })

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    '代理客户数据'
  )

  XLSX.writeFile(
    workbook,
    `代理客户数据_${new Date()
      .toISOString()
      .slice(0, 10)}.xlsx`
  )
}
</script>

<style scoped>
/* 表格内滚动条增强显示 */
:deep(.el-table__body-wrapper .el-scrollbar__thumb) {
  background: rgba(100, 116, 139, 0.6) !important;
  border-radius: 6px;
}

:deep(.el-table__body-wrapper .el-scrollbar__thumb:hover) {
  background: rgba(100, 116, 139, 0.9) !important;
}

/* 行 hover 高亮 */
.order-expand-table
  :deep(.el-table__body tr:hover > td) {
  background-color: rgba(37, 99, 235, 0.08) !important;
}

/* 当前行 */
.order-expand-table
  :deep(.el-table__body tr.current-row > td) {
  background-color: rgba(37, 99, 235, 0.14) !important;
}

/* 左侧强调条 */
.order-expand-table
  :deep(.el-table__body tr.current-row > td:first-child) {
  box-shadow: inset 4px 0 0
    rgba(37, 99, 235, 0.9);
}

/* 表头背景加强 */
.order-expand-table
  :deep(.el-table__header-wrapper) {
  background: #fff;
  z-index: 2;
}
.order-expand-table
  :deep(.el-table__header th) {
  background: #f8fafc !important;
}

/* 视觉样式（保持你原有） */
.section-card {
  border-top: none;
  margin-bottom: 20px;
}
.agent-name-link {
  color: #2563eb;
  font-weight: 700;
  cursor: pointer;
}
.agent-name-link:hover {
  text-decoration: underline;
}
.expand-wrapper {
  padding: 10px 50px;
  background-color: #f8fafc;
}
.ml-2 {
  margin-left: 10px;
}
.btn-emphasize {
  font-weight: 700;
  box-shadow: 0 4px 12px
    rgba(37, 99, 235, 0.2);
}
.order-expand-table
  :deep(.el-table__expand-column .cell) {
  padding: 0;
  text-align: center;
}

.financial-brief {
  font-size: 12px;
  margin-top: 4px;
  display: flex;
  align-items: center;
}
.brief-item {
  color: #64748b;
}
.paid-val {
  color: #10b981;
  font-style: normal;
  font-weight: 600;
  margin-left: 2px;
}
.pending-val {
  color: #94a3b8;
  font-style: normal;
  margin-left: 2px;
}
.has-pending {
  color: #ef4444;
  font-weight: 600;
}
</style>
