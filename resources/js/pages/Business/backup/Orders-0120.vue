<template>
  <PageLayout>
    <template #title>业务订单管理</template>
    <template #subtitle>管理公司所有业务办理进度及财务结算状态</template>
    <template #actions>
      <el-button type="success" :icon="Download" plain @click="handleExport">导出汇总数据</el-button>
      <el-button type="primary" size="large" :icon="Plus" @click="goCreate" class="btn-emphasize">
        创建新订单
      </el-button>
    </template>

    <transition name="el-zoom-in-bottom">
      <div v-if="selectedRows.length > 0" class="batch-toolbar">
        <span class="selected-count">已选 {{ selectedRows.length }} 项</span>
        <el-divider direction="vertical" />
        <el-button type="success" size="small" :icon="Check" @click="handleBatchSettlement">批量标记已结清</el-button>
        <el-button type="danger" size="small" :icon="Delete" @click="handleBatchDelete">批量删除</el-button>
        <el-button size="small" @click="clearSelection">取消选择</el-button>
      </div>
    </transition>

    <!-- 搜索区 -->
    <el-card shadow="never" class="section-card search-card no-print">
      <el-form :model="filters" label-width="80px">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="订单编号">
              <el-input v-model="filters.orderCode" placeholder="输入单号搜索" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="代理人">
              <el-select v-model="filters.agent" placeholder="请选择代理公司 - 联系人" filterable clearable class="w-100">
                <el-option
                  v-for="a in agentOptions"
                  :key="a.unique_key"
                  :label="a.display_label"
                  :value="a.display_label"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="客户姓名">
              <el-input v-model="filters.customerName" placeholder="输入客户名切换明细模式" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="6" class="flex-end">
            <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
            <el-button :icon="Refresh" @click="resetFilters">重置</el-button>
            <el-button link @click="isExpand = !isExpand">
              {{ isExpand ? '收起' : '高级' }}
              <el-icon>
                <ArrowDown v-if="!isExpand" />
                <ArrowUp v-else />
              </el-icon>
            </el-button>
          </el-col>
        </el-row>

        <el-collapse-transition>
          <div v-show="isExpand" class="advanced-box">
            <el-divider border-style="dashed" />
            <el-row :gutter="20">
              <el-col :span="6">
                <el-form-item label="业务类型">
                  <el-select v-model="filters.businessType" placeholder="全部类型" clearable class="w-100">
                    <el-option v-for="t in typeOptions" :key="t" :label="t" :value="t" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="创建日期">
                  <el-date-picker
                    v-model="filters.dateRange"
                    type="daterange"
                    range-separator="至"
                    start-placeholder="开始"
                    end-placeholder="结束"
                    value-format="YYYY-MM-DD"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="5">
                <el-form-item label="办理部门">
                  <el-select v-model="filters.dept" placeholder="选择部门" clearable class="w-100">
                    <el-option v-for="d in deptOptions" :key="d.id" :label="d.name" :value="d.id" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="5">
                <el-form-item label="国籍筛选">
                  <el-select v-model="filters.nationality" clearable class="w-100">
                    <el-option v-for="n in nationalityOptions" :key="n" :label="n" :value="n" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </div>
        </el-collapse-transition>
      </el-form>
    </el-card>

    <!-- 表格 -->
    <el-card shadow="never" class="section-card table-card print-area">
      <el-table
        ref="multipleTableRef"
        :data="pagedOrders"
        v-loading="loading"
        border
        stripe
        @selection-change="handleSelectionChange"
        class="order-expand-table"
      >
        <el-table-column type="selection" width="50" align="center" />

        <!-- 子表 -->
        <el-table-column type="expand">
          <template #default="props">
            <div class="expand-wrapper">
              <el-table :data="props.row.customers" size="small" border>
                <el-table-column label="序号" prop="row_no" width="160" />
                <el-table-column label="姓名" prop="name" width="120" />
                <el-table-column label="护照号" prop="passport" width="140" />
                <el-table-column label="国籍" prop="nationality" width="100" />
                <el-table-column label="业务" prop="businessType" />
                <el-table-column label="费用" prop="fee" width="100">
                  <template #default="scope">${{ scope.row.fee }}</template>
                </el-table-column>
                <el-table-column label="状态" width="120">
                  <template #default="scope">
                    <el-tag size="small" :type="statusTag(scope.row.status)">
                      {{ statusText(scope.row.status) }}
                    </el-tag>
                  </template>
                </el-table-column>

                <el-table-column label="代理佣金" width="110" align="right">
                  <template #default="scope">
                    <el-input-number
                      v-model="scope.row.agent_commission"
                      size="small"
                      :min="0"
                      :controls="false"
                      style="width: 90px"
                      @change="() => handleRowFinanceChange(scope.row)"
                    />
                  </template>
                </el-table-column>

                <el-table-column label="客服提成" width="110" align="right">
                  <template #default="scope">
                    <el-input-number
                      v-model="scope.row.staff_commission"
                      size="small"
                      :min="0"
                      :controls="false"
                      style="width: 90px"
                      @change="() => handleRowFinanceChange(scope.row)"
                    />
                  </template>
                </el-table-column>

                <el-table-column label="利润" width="110" align="right">
                  <template #default="scope">
                    <span style="font-weight:700;color:#10b981;">
                      ${{ (calcRowFinance(scope.row).profit || 0).toLocaleString() }}
                    </span>
                  </template>
                </el-table-column>

                <el-table-column label="结算" width="100">
                  <template #default="scope">
                    <el-tag size="small" :type="scope.row.settlement === 'paid' ? 'success' : 'danger'">
                      {{ scope.row.settlement === 'paid' ? '已付' : '未付' }}
                    </el-tag>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </template>
        </el-table-column>

        <!-- 父表 -->
        <el-table-column label="业务统计" min-width="400">
          <template #default="scope">
            <div class="summary-content">
              <span class="summary-main-text">
                <strong>
                  {{ [scope.row.agent_company, scope.row.agent_contact].filter(Boolean).join(' - ') }}
                </strong>
                业务：
                {{ scope.row.created_at }} 共 {{ scope.row.customers?.length || 0 }} 本护照，
                <span class="biz-count-text">{{ getBizStats(scope.row.customers) }}</span>
              </span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="code" label="订单编号" width="160">
          <template #default="scope">
            <span class="code-font">{{ scope.row.code }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="办理进度" width="180" align="center">
          <template #default="scope">
            <div class="status-detail-tag" :class="`status-type-${scope.row.statusInfo.type}`">
              <div v-for="(line, idx) in scope.row.statusInfo.lines" :key="idx" class="status-line">
                <span class="dot"></span> {{ line }}
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="金额 (USD)" width="130" align="right">
          <template #default="scope">
            <span class="amount-bold">
              ${{ (scope.row.finance?.amount || 0).toLocaleString() }}
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="settlement" label="总体结算" width="110" align="center">
          <template #default="scope">
            <el-dropdown trigger="click" @command="(cmd) => handleUpdateSettlement(scope.row, cmd)">
              <el-tag
                :type="
                  scope.row.settlement === 'paid'
                    ? 'success'
                    : scope.row.settlement === 'partial'
                    ? 'warning'
                    : 'danger'
                "
                effect="plain"
                class="cursor-pointer"
              >
                {{ settlementText(scope.row.settlement) }}
                <el-icon><ArrowDown /></el-icon>
              </el-tag>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="paid">标记为已结清</el-dropdown-item>
                  <el-dropdown-item command="unpaid">标记为未结算</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>

        <el-table-column label="上游费用" width="110" align="right">
          <template #default="scope">
            ${{ (scope.row.finance?.upstream_fee || 0).toLocaleString() }}
          </template>
        </el-table-column>

        <el-table-column label="代理佣金" width="110" align="right">
          <template #default="scope">
            ${{ (scope.row.finance?.agent_commission || 0).toLocaleString() }}
          </template>
        </el-table-column>

        <el-table-column label="客服提成" width="110" align="right">
          <template #default="scope">
            ${{ (scope.row.finance?.staff_commission || 0).toLocaleString() }}
          </template>
        </el-table-column>

        <el-table-column label="利润" width="110" align="right">
          <template #default="scope">
            <span :style="{ color: scope.row.finance?.profit >= 0 ? '#10b981' : '#ef4444' }">
              ${{ (scope.row.finance?.profit || 0).toLocaleString() }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="备注" min-width="140">
          <template #default="scope">
            {{ scope.row.finance?.remark || '-' }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="220" fixed="right" align="center" class-name="no-print">
          <template #default="scope">
            <el-button link type="primary" @click="goEdit(scope.row)">编辑</el-button>
            <el-dropdown trigger="click" @command="(cmd) => handleCommand(cmd, scope.row)">
              <el-button link type="primary" style="margin-left: 12px">更多</el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="print" icon="Printer">打印此单</el-dropdown-item>
                  <el-dropdown-item command="export" icon="Download">导出此单</el-dropdown-item>
                  <el-dropdown-item command="delete" icon="Delete" divided style="color: #f56c6c">
                    删除订单
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-area no-print" style="margin-top: 20px; display: flex; justify-content: flex-end">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          :total="displayOrders.length"
        />
      </div>
    </el-card>
  </PageLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Plus, Search, Refresh, ArrowDown, ArrowUp, Download, Printer, Delete, Check } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import PageLayout from '@/layouts/PageLayout.vue'
import { db } from '@/utils/storage'
import { normalizeOrderForView } from '@/utils/orderAdapter'
import { calcRowFinance } from '@/utils/finance'

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const isExpand = ref(false)
const allOrders = ref([])
const multipleTableRef = ref(null)
const selectedRows = ref([])

const configs = db.getConfigs()
const currentPage = ref(1)
const pageSize = ref(10)

const agentOptions = computed(() => {
  const agents = db.getAgents() || []
  const options = []
  agents.forEach(company => {
    if (company.contacts && company.contacts.length > 0) {
      company.contacts.forEach(contact => {
        options.push({
          unique_key: `${company.id}-${contact.name}`,
          display_label: `${company.name} - ${contact.name}`
        })
      })
    } else {
      options.push({
        unique_key: `${company.id}-default`,
        display_label: `${company.name} - (无联系人)`
      })
    }
  })
  return options
})

const typeOptions = ref(configs.businessTypes)
const nationalityOptions = ref(configs.nationalities)
const deptOptions = ref(configs.departments)
const statusOptions = ref(configs.orderStatuses)

const filters = reactive({
  orderCode: '',
  agent: '',
  businessType: '',
  dateRange: [],
  dept: '',
  customerName: '',
  nationality: ''
})

const isCustomerView = computed(() => !!filters.customerName)

const handleRowFinanceChange = (row) => {
  row.__profit = calcRowFinance(row).profit
}

/* =========================
   🔧 客户搜索双模式（修复版）
   ========================= */
const displayOrders = computed(() => {
  const source = allOrders.value || []

  // 客户视图
  if (isCustomerView.value) {
    const keyword = filters.customerName.toLowerCase()
    const results = []

    source.forEach(order => {
      (order.customers || []).forEach(c => {
        if (!keyword || (c.name || '').toLowerCase().includes(keyword)) {
          results.push({
            ...order,
            customers: [c],
            customer_name: c.name,
            customer_passport: c.passport,
            customer_biz: c.businessType,
            customer_nationality: c.nationality,
            statusInfo: {
              lines: [statusText(c.status)],
              type: statusTag(c.status)
            },
            settlement: c.settlement,
            finance: c.finance
          })
        }
      })
    })

    return results
  }

  // 订单视图
  const filtered = source.filter(item => {
    const matchCode =
      !filters.orderCode ||
      (item.code || '').toLowerCase().includes(filters.orderCode.toLowerCase())

    const matchAgent =
      !filters.agent ||
      [item.agent_company, item.agent_contact]
        .filter(Boolean)
        .join(' - ') === filters.agent

    const matchType =
      !filters.businessType ||
      (item.customers || []).some(c => c.businessType === filters.businessType)

    const matchDept =
      !filters.dept || item.department === filters.dept

    let matchDate = true
    if (filters.dateRange && filters.dateRange.length === 2) {
      matchDate =
        item.created_at >= filters.dateRange[0] &&
        item.created_at <= filters.dateRange[1]
    }

    const matchNationality =
      !filters.nationality ||
      (item.customers || []).some(c => c.nationality === filters.nationality)

    return (
      matchCode &&
      matchAgent &&
      matchType &&
      matchDate &&
      matchDept &&
      matchNationality
    )
  })

  return filtered.map(order => ({
    ...order,
    statusInfo: getDisplayStatusInfo(order.customers),
    settlement: getDisplaySettlement(order.customers)
  }))
})

const pagedOrders = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return displayOrders.value.slice(start, start + pageSize.value)
})

const statusTag = (s) =>
  statusOptions.value.find(o => o.value === s || o.label === s)?.color || 'info'
const statusText = (s) =>
  statusOptions.value.find(o => o.value === s || o.label === s)?.label || s
const settlementText = (s) =>
  ({ paid: '已结清', partial: '部分结算', unpaid: '未结算' }[s] || '未知')

const loadData = () => {
  loading.value = true
  const raw = db.getRaw('ORDERS') || []
  allOrders.value = raw.map(o => normalizeOrderForView(o))
  loading.value = false
}

/* ===== 批量 & 操作逻辑保持不变 ===== */
const handleSelectionChange = (val) => (selectedRows.value = val)
const clearSelection = () => multipleTableRef.value?.clearSelection()

const handleBatchSettlement = () => {
  ElMessageBox.confirm(`确定将选中的 ${selectedRows.value.length} 个订单全部标记为已结清？`, '批量操作')
    .then(() => {
      const raw = db.getRaw('ORDERS') || []
      const selectedIds = selectedRows.value.map(r => r.id)
      const newData = raw.map(o => {
        if (selectedIds.includes(o.id)) {
          o.settlement = 'paid'
          o.customers?.forEach(c => (c.settlement = 'paid'))
        }
        return o
      })
      db.saveRaw('ORDERS', newData)
      loadData()
      selectedRows.value = []
      ElMessage.success('批量更新成功')
    })
}

const handleBatchDelete = () => {
  ElMessageBox.confirm(
    `确定将选中的 ${selectedRows.value.length} 个订单移入回收站？`,
    '批量删除',
    { type: 'warning' }
  ).then(() => {
    const raw = db.getRaw('ORDERS') || []
    const selectedIds = selectedRows.value.map(r => r.id)

    const updated = raw.map(o => {
      if (selectedIds.includes(o.id)) {
        return { ...o, deleted: true, deleted_at: new Date().toLocaleString() }
      }
      return o
    })

    db.saveRaw('ORDERS', updated)
    loadData()
    selectedRows.value = []
    ElMessage.success('已批量移入回收站')
  })
}

const handleUpdateSettlement = (row, status) => {
  const raw = db.getRaw('ORDERS') || []
  const idx = raw.findIndex(o => o.id === row.id)
  if (idx !== -1) {
    raw[idx].settlement = status
    raw[idx].customers?.forEach(c => (c.settlement = status))
    db.saveRaw('ORDERS', raw)
    loadData()
    ElMessage.success('结算状态已更新')
  }
}

const handleCommand = (cmd, row) => {
  if (cmd === 'print') window.print()
  if (cmd === 'export') handleSingleExport(row)
  if (cmd === 'delete') handleDelete(row)
}

const handleDelete = (row) => {
  ElMessageBox.confirm('订单将移入回收站，是否继续？', '删除订单', { type: 'warning' })
    .then(() => {
      const raw = db.getRaw('ORDERS') || []
      const updated = raw.map(o => {
        if (o.id === row.id) {
          return { ...o, deleted: true, deleted_at: new Date().toLocaleString() }
        }
        return o
      })
      db.saveRaw('ORDERS', updated)
      loadData()
      ElMessage.success('订单已移入回收站')
    })
}

const handleExport = () => {
  if (displayOrders.value.length === 0) return ElMessage.warning('无数据')
  const header = ['日期', '单号', '代理/客户', '业务明细', '总金额', '状态', '结算']
  const rows = displayOrders.value.map(o => [
    o.created_at,
    o.code,
    [o.agent_company, o.agent_contact].filter(Boolean).join(' - '),
    getBizStats(o.customers),
    o.finance?.amount || 0,
    o.statusInfo.lines.join(' '),
    settlementText(o.settlement)
  ])
  downloadCSV(`业务汇总_${new Date().toLocaleDateString()}`, header, rows)
}

const handleSingleExport = (row) => {
  const header = ['序号', '客户姓名', '护照号', '国籍', '业务', '金额', '状态']
  const rows = row.customers.map(c => [
    c.row_no,
    c.name,
    c.passport,
    c.nationality,
    c.businessType,
    c.finance?.amount || 0,
    statusText(c.status)
  ])
  downloadCSV(`订单_${row.code}_明细`, header, rows)
}

const downloadCSV = (filename, header, rows) => {
  let csvContent = '\ufeff' + header.join(',') + '\n' + rows.map(r => r.join(',')).join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}.csv`
  link.click()
}

const handleSearch = () => {
  loadData()
  currentPage.value = 1
}

const resetFilters = () => {
  Object.keys(filters).forEach(k => (filters[k] = k === 'dateRange' ? [] : ''))
  handleSearch()
}

const goCreate = () => router.push({ name: 'business.orders.create' })
const goEdit = (row) => router.push({ name: 'business.orders.create', query: { id: row.id } })

onMounted(() => {
  loadData()
  if (route.query.agent) {
    filters.agent = route.query.agent
    handleSearch()
  }
})

/* ===== 原样保留工具函数 ===== */
const getDisplayStatusInfo = (customers) => {
  if (!customers || customers.length === 0) return { lines: ['无数据'], type: 'info' }
  const total = customers.length
  const completedCount = customers.filter(c => {
    const sObj = statusOptions.value.find(o => o.value === c.status || o.label === c.status)
    return sObj?.label === '已完成' || c.status === 'Completed' || c.status === '已完成'
  }).length
  const pendingCount = customers.filter(c => {
    const sObj = statusOptions.value.find(o => o.value === c.status || o.label === c.status)
    return sObj?.label === '未办理' || c.status === 'Pending' || c.status === '未办理'
  }).length
  const processingCount = total - completedCount - pendingCount
  if (completedCount === total) return { lines: ['全部已完成'], type: 'success' }
  if (pendingCount === total) return { lines: ['全部未办理'], type: 'info' }
  let lines = []
  if (pendingCount > 0) lines.push(`${pendingCount} 人未办理`)
  if (processingCount > 0) lines.push(`${processingCount} 人办理中`)
  if (completedCount > 0) lines.push(`${completedCount} 人已完成`)
  return { lines, type: 'warning' }
}

const getDisplaySettlement = (customers) => {
  if (!customers || customers.length === 0) return 'unpaid'
  const paidCount = customers.filter(c => c.settlement === 'paid').length
  if (paidCount === customers.length) return 'paid'
  if (paidCount > 0) return 'partial'
  return 'unpaid'
}

const getBizStats = (customers) => {
  if (!customers) return ''
  const stats = {}
  customers.forEach(c => {
    const type = c.businessType || '未知业务'
    stats[type] = (stats[type] || 0) + 1
  })
  return Object.entries(stats)
    .map(([name, count]) => `${count}本${name}`)
    .join('，')
}
</script>

<style scoped>
/* 原样保留 */
.search-card { border-top: none !important; margin-bottom: 20px; }
.flex-end { display: flex; justify-content: flex-end; gap: 10px; }
.code-font { font-family: monospace; font-weight: 700; color: #2563eb; }
.amount-bold { font-weight: 700; }
.w-100 { width: 100%; }
.expand-wrapper { padding: 15px 40px; background-color: #f8fafc; }
.summary-main-text { font-size: 14px; color: #334155; line-height: 1.6; }
.biz-count-text { color: #0284c7; font-weight: 600; }

.batch-toolbar {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  background: #1e293b;
  color: white;
  padding: 10px 24px;
  border-radius: 40px;
  z-index: 2000;
  display: flex;
  align-items: center;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
}
.selected-count { font-size: 14px; font-weight: 600; color: #fbbf24; }
.cursor-pointer { cursor: pointer; }

.status-detail-tag {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 6px 12px;
  border-radius: 6px;
  min-width: 120px;
}
.status-line {
  font-size: 12px;
  line-height: 1.6;
  display: flex;
  align-items: center;
  white-space: nowrap;
}
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 6px;
  display: inline-block;
}
.status-type-success { background: #f0f9eb; color: #67c23a; border: 1px solid #e1f3d8; }
.status-type-success .dot { background: #67c23a; }
.status-type-warning { background: #fdf6ec; color: #e6a23c; border: 1px solid #faecd8; }
.status-type-warning .dot { background: #e6a23c; }
.status-type-info { background: #f4f4f5; color: #909399; border: 1px solid #e9e9eb; }
.status-type-info .dot { background: #909399; }

@media print {
  .no-print,
  .el-header,
  .el-aside,
  .search-card,
  .pagination-area,
  .fixed-right,
  .batch-toolbar {
    display: none !important;
  }
}
</style>
