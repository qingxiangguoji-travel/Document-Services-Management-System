<!-- resources/js/pages/Business/Orders.vue -->
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
      <div v-if="selectedOrderRows.length > 0" class="batch-toolbar">
        <span class="selected-count">已选 {{ selectedOrderRows.length }} 项</span>
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
                    start-placeholder="开始日期"
                    end-placeholder="结束日期"
                    value-format="YYYY-MM-DD"
                    unlink-panels
                    :shortcuts="dateShortcuts"
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
        :data="tableRows"
        v-loading="loading"
        border
        stripe
        class="order-tree-table"
        :row-class-name="rowClassName"
        @selection-change="handleSelectionChange"
      >
        <!-- ================= 业务统计 ================= -->
        <el-table-column label="业务统计" min-width="1000">
          <template #default="scope">
            <!-- 父行 -->
            <div v-if="scope.row.__rowType === 'order'" class="order-summary">
              <div class="order-summary-line">
                <span class="expand-btn" @click.stop="toggleOrder(scope.row.__orderId)">
                  <el-icon class="expand-icon">
                    <ArrowDown
                      v-if="isOrderExpanded(scope.row.__orderId) || isCustomerModeForceExpand(scope.row.__orderId)"
                    />
                    <ArrowRight v-else />
                  </el-icon>
                </span>

                <span class="order-code-prefix">
                  订单编号：
                  <span class="code-font">{{ scope.row.code || scope.row.order_no || '-' }}</span>，
                </span>

                <strong class="agent-strong">
                  {{ [scope.row.agent_company, scope.row.agent_contact].filter(Boolean).join(' - ') }}
                </strong>

                <span class="summary-text">
                  业务：{{ scope.row.created_at }} 共 {{ scope.row.__customersCount }} 本护照，
                  <span class="biz-count-text">{{ scope.row.__bizStats }}</span>
                </span>
              </div>

              <div v-if="isCustomerView && scope.row.__customerHit" class="customer-hit-hint">
                当前查询客户：<strong>{{ scope.row.__customerHit.name }}</strong>
                <span v-if="scope.row.__customerHit.passport">
                  ({{ scope.row.__customerHit.passport }})
                </span>
              </div>
            </div>

            <!-- 子表头 -->
            <div v-else-if="scope.row.__rowType === 'subhead'" class="subhead-wrap">
              <div class="subhead-grid">
                <div class="subhead-cell">序号</div>
                <div class="subhead-cell">客户姓名</div>
                <div class="subhead-cell">护照号</div>
                <div class="subhead-cell">化名 / 员工编号</div>
                <div class="subhead-cell">国籍</div>
                <div class="subhead-cell">签证到期日</div>
                <div class="subhead-cell">劳工证</div>
                <div class="subhead-cell subhead-wide">办理业务</div>
                <div class="subhead-cell subhead-wide">费用明细</div>
              </div>
            </div>

            <!-- 子行 -->
            <div v-else class="biz-row-grid">
              <div class="biz-cell-no">{{ scope.row.__rowNoDisplay || '' }}</div>
              <div class="biz-cell-name">{{ scope.row.name || '-' }}</div>
              <div class="biz-cell">{{ scope.row.passport || '-' }}</div>
              <div class="biz-cell">
                {{ scope.row.alias_no || scope.row.alias || scope.row.staff_no || '-' }}
              </div>
              <div class="biz-cell">{{ scope.row.nationality || '-' }}</div>
              <div class="biz-cell">{{ scope.row.__visaExpireAt || '-' }}</div>
              <div class="biz-cell">{{ scope.row.__workPermitText }}</div>
              <div class="biz-cell biz-wide">{{ scope.row.__bizLabel || '-' }}</div>

              <div class="biz-cell biz-wide">
                <div v-if="scope.row.__feeLines?.length" class="fee-lines">
                  <div v-for="(it, idx) in scope.row.__feeLines" :key="idx" class="fee-line">
                    <span class="fee-k">{{ it.label }}</span>
                    <span class="fee-v">
                      ${{ Number(it.amount || 0).toLocaleString() }}
                    </span>
                  </div>
                </div>
                <div v-else class="fee-empty">-</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- ================= 办理进度 ================= -->
        <el-table-column label="办理进度" width="160" align="center">
          <template #default="scope">
            <div
              v-if="scope.row.__rowType === 'order'"
              class="status-detail-tag"
              :class="`status-type-${scope.row.__statusInfo.type}`"
            >
              <div v-for="(line, idx) in scope.row.__statusInfo.lines" :key="idx" class="status-line">
                <span class="dot"></span> {{ line }}
              </div>
            </div>

            <!-- ✅ PATCH：子表头标题 -->
            <div v-else-if="scope.row.__rowType === 'subhead'" class="subhead-right">
              办理进度
            </div>

            <div v-else class="small-center">
              <el-tag size="small" :type="statusTag(scope.row.__processStatus)">
                {{ statusText(scope.row.__processStatus) }}
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <!-- ================= 金额 ================= -->
        <el-table-column label="金额 (USD)" width="140" align="center">
          <template #default="scope">
            <!-- ✅ PATCH：子表头显示父层汇总 -->
            <span
              v-if="scope.row.__rowType === 'subhead'"
              class="subhead-right subhead-amount"
            >
              合计金额：
              <b class="amount-sum">
                ${{ formatAmount(scope.row.__parent?.__finance?.amount || 0) }}
              </b>
            </span>

            <span v-else class="amount-bold">
              ${{ Number(scope.row.__finance?.amount || 0).toLocaleString() }}
            </span>
          </template>
        </el-table-column>

        <!-- ================= 上游费用 ================= -->
        <el-table-column label="上游费用" width="100" align="center">
          <template #default="scope">
            <!-- ✅ PATCH -->
            <span v-if="scope.row.__rowType === 'subhead'" class="subhead-right">
              上游费用
            </span>
            <span v-else>
              ${{ Number(scope.row.__finance?.upstream_fee || 0).toLocaleString() }}
            </span>
          </template>
        </el-table-column>

        <!-- ================= 代理佣金 ================= -->
        <el-table-column label="代理佣金" width="110" align="center">
          <template #default="scope">
            <!-- ✅ PATCH -->
            <span v-if="scope.row.__rowType === 'subhead'" class="subhead-right">
              代理佣金
            </span>

            <template v-else-if="scope.row.__rowType === 'biz'">
              <el-input-number
                v-model="scope.row.agent_commission"
                size="small"
                :min="0"
                :controls="false"
                style="width: 88px"
                @change="() => handleBizFinanceEdit(scope.row)"
              />
            </template>

            <template v-else>
              ${{ Number(scope.row.__finance?.agent_commission || 0).toLocaleString() }}
            </template>
          </template>
        </el-table-column>

        <!-- ================= 客服提成 ================= -->
        <el-table-column label="客服提成" width="110" align="center">
          <template #default="scope">
            <!-- ✅ PATCH -->
            <span v-if="scope.row.__rowType === 'subhead'" class="subhead-right">
              客服提成
            </span>

            <template v-else-if="scope.row.__rowType === 'biz'">
              <el-input-number
                v-model="scope.row.staff_commission"
                size="small"
                :min="0"
                :controls="false"
                style="width: 88px"
                @change="() => handleBizFinanceEdit(scope.row)"
              />
            </template>

            <template v-else>
              ${{ Number(scope.row.__finance?.staff_commission || 0).toLocaleString() }}
            </template>
          </template>
        </el-table-column>

        <!-- ================= 利润 ================= -->
        <el-table-column label="利润" width="110" align="center">
          <template #default="scope">
            <!-- ✅ PATCH -->
            <span v-if="scope.row.__rowType === 'subhead'" class="subhead-right">
              利润
            </span>

            <span
              v-else
              :style="{
                color: Number(scope.row.__finance?.profit || 0) >= 0 ? '#10b981' : '#ef4444',
                fontWeight: 700
              }"
            >
              ${{ Number(scope.row.__finance?.profit || 0).toLocaleString() }}
            </span>
          </template>
        </el-table-column>

        <!-- ================= 结算 ================= -->
        <el-table-column label="结算" width="110" align="center">
          <template #default="scope">
            <!-- ✅ PATCH -->
            <span v-if="scope.row.__rowType === 'subhead'" class="subhead-right">
              结算
            </span>

            <template v-else-if="scope.row.__rowType === 'order'">
              <el-dropdown trigger="click" @command="(cmd) => handleUpdateSettlement(scope.row.__orderId, cmd)">
                <el-tag
                  :type="
                    scope.row.__settlement === 'paid'
                      ? 'success'
                      : scope.row.__settlement === 'partial'
                      ? 'warning'
                      : 'danger'
                  "
                  effect="plain"
                  class="cursor-pointer"
                >
                  {{ settlementText(scope.row.__settlement) }}
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

            <template v-else-if="scope.row.__rowType === 'biz'">
              <el-tag size="small" :type="scope.row.__settlement === 'paid' ? 'success' : 'danger'">
                {{ scope.row.__settlement === 'paid' ? '已付' : '未付' }}
              </el-tag>
            </template>
          </template>
        </el-table-column>

        <!-- ================= 备注 ================= -->
        <el-table-column label="备注" width="140">
          <template #default="scope">
            <!-- ✅ PATCH -->
            <span v-if="scope.row.__rowType === 'subhead'" class="subhead-right">
              备注
            </span>

            <template v-else-if="scope.row.__rowType === 'biz'">
              <el-input
                v-model="scope.row.remark"
                size="small"
                placeholder="业务备注"
                @blur="() =>
                  saveBizRowPatch(scope.row.__orderId, scope.row.__rowIndex, {
                    remark: scope.row.remark
                  })
                "
              />
            </template>

            <template v-else-if="scope.row.__rowType === 'order'">
              <el-input
                v-model="scope.row.remark"
                size="small"
                placeholder="订单备注"
                @blur="() => handleUpdateOrderRemark(scope.row.__orderId, scope.row.remark)"
              />
            </template>
          </template>
        </el-table-column>

        <!-- ================= 操作 ================= -->
        <el-table-column label="操作" width="160" fixed="right" align="center" class-name="no-print">
          <template #default="scope">
            <!-- ✅ PATCH -->
            <span v-if="scope.row.__rowType === 'subhead'" class="subhead-right">
              操作
            </span>

            <template v-else-if="scope.row.__rowType === 'order'">
              <el-button link type="primary" @click="goEdit(scope.row.__orderId)">编辑</el-button>
              <el-dropdown trigger="click" @command="(cmd) => handleCommand(cmd, scope.row.__orderId)">
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
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-area no-print" style="margin-top: 20px; display: flex; justify-content: flex-end">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          :total="filteredOrders.length"
        />
      </div>
    </el-card>
  </PageLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Plus, Search, Refresh, ArrowDown, ArrowUp, ArrowRight, Download, Printer, Delete, Check } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import PageLayout from '@/layouts/PageLayout.vue'
import { db } from '@/utils/storage'
import { normalizeOrderForView } from '@/utils/orderAdapter'
import { calcRowFinance, calcOrderFinance } from '@/utils/finance'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const isExpand = ref(false)

const allOrders = ref([])
const multipleTableRef = ref(null)
const selectedOrderRows = ref([])

const configs = db.getConfigs()
const currentPage = ref(1)
const pageSize = ref(10)

const expandedOrderIds = ref(new Set())

const typeOptions = ref(configs.businessTypes || [])
const nationalityOptions = ref(configs.nationalities || [])
const deptOptions = ref(configs.departments || [])
const statusOptions = ref(configs.orderStatuses || [])

// ✅ PATCH：金额格式化方法（子表头合计用）
// ====================
const formatAmount = (v) => {
  const n = Number(v || 0)
  return n.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })
}
const handleUpdateOrderRemark = (orderId, remark) => {
  const raw = db.getRaw('ORDERS') || []
  const idx = raw.findIndex(o => o.id === orderId)
  if (idx === -1) return
  raw[idx].remark = remark
  db.saveRaw('ORDERS', raw)
  loadData()
}



const fmt = (d) => d.toISOString().slice(0, 10)

const dateShortcuts = [
  {
    text: '今天',
    value: () => {
      const d = new Date()
      return [fmt(d), fmt(d)]
    }
  },
  {
    text: '昨天',
    value: () => {
      const d = new Date()
      d.setDate(d.getDate() - 1)
      return [fmt(d), fmt(d)]
    }
  },
  {
    text: '近3天',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 2)
      return [fmt(start), fmt(end)]
    }
  },
  {
    text: '近7天',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 6)
      return [fmt(start), fmt(end)]
    }
  },
  {
    text: '本周',
    value: () => {
      const d = new Date()
      const day = d.getDay() || 7
      const start = new Date(d)
      start.setDate(d.getDate() - day + 1)
      return [fmt(start), fmt(d)]
    }
  },
  {
    text: '本月',
    value: () => {
      const d = new Date()
      const start = new Date(d.getFullYear(), d.getMonth(), 1)
      return [fmt(start), fmt(d)]
    }
  },
  {
    text: '上月',
    value: () => {
      const d = new Date()
      const start = new Date(d.getFullYear(), d.getMonth() - 1, 1)
      const end = new Date(d.getFullYear(), d.getMonth(), 0)
      return [fmt(start), fmt(end)]
    }
  },
    {
    text: '近6个月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setMonth(start.getMonth() - 6)
      return [fmt(start), fmt(end)]
    }
  },
  {
    text: '本年',
    value: () => {
      const now = new Date()
      const start = new Date(now.getFullYear(), 0, 1)
      return [fmt(start), fmt(now)]
    }
  },
  {
    text: '去年',
    value: () => {
      const now = new Date()
      const start = new Date(now.getFullYear() - 1, 0, 1)
      const end = new Date(now.getFullYear() - 1, 11, 31)
      return [fmt(start), fmt(end)]
    }
  }

]



const filters = reactive({
  orderCode: '',
  agent: '',
  businessType: '',
  dateRange: [],
  dept: '',
  customerName: '',
  nationality: ''
})

const isCustomerView = computed(() => !!(filters.customerName || '').trim())

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

/** ===== helpers：字段兼容 ===== */
const normalizeBizType = (row) => row.businessType || row.business_type || row.biz_type || row.type || ''
const normalizeProcessStatus = (row) => row.process_status || row.status || row.processStatus || 'Pending'
const normalizeRowSettlement = (row) => {
  if (row.settlement) return row.settlement
  if (row.is_settled === '是') return 'paid'
  if (row.is_settled === true) return 'paid'
  return 'unpaid'
}
const normalizeDept = (order) =>
  order.department_id ?? order.department ?? order.upstream_department_id ?? order.upstream_department ?? ''
const normalizeDate = (order) => order.created_at || order.date || ''
const normalizeOrderCode = (order) => order.code || order.order_no || ''
const normalizeAgentLabel = (order) =>
  [order.agent_company, order.agent_contact].filter(Boolean).join(' - ')
  
const countUniqueCustomers = (rows = []) => {
  const set = new Set()
  rows.forEach(r => {
    if (r.customer_id) set.add(r.customer_id)
  })
  return set.size
}


/** ✅ 序号：优先新建页字段，否则 fallback */
const normalizeRowNo = (row, idx) => {
  // ✅ 新建订单页的权威序号字段
  const v =
    row.row_no ??           // 你需求里明确的同步字段
    row.business_seq ??     // 有些地方可能叫这个
    row.seq ??
    row.no

  const n = Number(v)
  if (Number.isFinite(n) && n > 0) return n

  // 兜底：避免空
  return idx + 1
}


/** ✅ 签证到期日：多字段兼容 */
const normalizeVisaExpireAt = (row) =>
  row.visa_expiry ??          // 新建页标准字段
  row.visa_expire_at ??
  row.visa_expire_date ??
  row.visa_expire ??
  row.visa_expired_at ??
  row.visaExpiry ??
  row.visa_expiry_date ??
  ''

const statusTag = (s) => statusOptions.value.find(o => o.value === s || o.label === s)?.color || 'info'
const statusText = (s) => statusOptions.value.find(o => o.value === s || o.label === s)?.label || s
const settlementText = (s) => ({ paid: '已结清', partial: '部分结算', unpaid: '未结算' }[s] || '未知')

/** 父行统计 */
const getDisplayStatusInfo = (bizRows) => {
  if (!bizRows || bizRows.length === 0) return { lines: ['无数据'], type: 'info' }
  const total = bizRows.length

  const completedCount = bizRows.filter(r => {
    const s = r.__processStatus
    const sObj = statusOptions.value.find(o => o.value === s || o.label === s)
    const label = sObj?.label || s
    return label === '已完成' || s === 'Completed' || s === '已完成'
  }).length

  const pendingCount = bizRows.filter(r => {
    const s = r.__processStatus
    const sObj = statusOptions.value.find(o => o.value === s || o.label === s)
    const label = sObj?.label || s
    return label === '未办理' || s === 'Pending' || s === '未办理'
  }).length

  const processingCount = total - completedCount - pendingCount

  if (completedCount === total) return { lines: ['全部已完成'], type: 'success' }
  if (pendingCount === total) return { lines: ['全部未办理'], type: 'info' }

  const lines = []
  if (pendingCount > 0) lines.push(`${pendingCount} 人未办理`)
  if (processingCount > 0) lines.push(`${processingCount} 人办理中`)
  if (completedCount > 0) lines.push(`${completedCount} 人已完成`)
  return { lines, type: 'warning' }
}

const getDisplaySettlement = (bizRows) => {
  if (!bizRows || bizRows.length === 0) return 'unpaid'
  const paidCount = bizRows.filter(r => r.__settlement === 'paid').length
  if (paidCount === bizRows.length) return 'paid'
  if (paidCount > 0) return 'partial'
  return 'unpaid'
}

const getBizStats = (customers) => {
  const map = {}
  ;(customers || []).forEach(c => {
    const type = normalizeBizType(c) || '未知业务'
    if (!map[type]) map[type] = new Set()
    if (c.customer_id) map[type].add(c.customer_id)
  })

  return Object.entries(map)
    .map(([name, set]) => `${set.size}本${name}`)
    .join('，')
}


/** 子行费用明细：只显示有数据的项 */
const buildFeeLines = (row) => {
  const lines = []
  const push = (label, val) => {
    const num = Number(val || 0)
    if (num) lines.push({ label, amount: num })
  }

  push('签证费', row.fee_visa)
  push('劳工证费', row.fee_work)
  push('其他费', row.fee_other)
  push('特别费', row.special_fee)

  push('入境罚款', row.fine_entry)
  push('逾期罚款', row.fine_overdue)
  push('劳工证罚款', row.fine_work)

  return lines
}

/** 数据加载 */
const loadData = () => {
  loading.value = true
  const raw = db.getRaw('ORDERS') || []
  allOrders.value = raw
    .filter(o => !o.deleted)
    .map(o => normalizeOrderForView(o))
  loading.value = false
}

/** 过滤后的订单 */
const filteredOrders = computed(() => {
  const source = allOrders.value || []
  const kwCode = (filters.orderCode || '').trim().toLowerCase()
  const kwCustomer = (filters.customerName || '').trim().toLowerCase()

  return source.filter(order => {
    const code = normalizeOrderCode(order)
    const matchCode = !kwCode || (code || '').toLowerCase().includes(kwCode)
    const matchAgent = !filters.agent || normalizeAgentLabel(order) === filters.agent

    let matchDate = true
    if (filters.dateRange && filters.dateRange.length === 2) {
      const d = normalizeDate(order)
      matchDate = d >= filters.dateRange[0] && d <= filters.dateRange[1]
    }

    const deptVal = normalizeDept(order)
    const matchDept = !filters.dept || String(deptVal) === String(filters.dept)

    const customers = order.customers || []

    const matchType =
      !filters.businessType ||
      customers.some(c => (normalizeBizType(c) || '') === filters.businessType)

    const matchNationality =
      !filters.nationality ||
      customers.some(c => (c.nationality || '') === filters.nationality)

    const matchCustomer =
      !kwCustomer ||
      customers.some(c => ((c.name || '').toLowerCase().includes(kwCustomer)))

    return matchCode && matchAgent && matchDate && matchDept && matchType && matchNationality && matchCustomer
  })
})

const pagedOrders = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredOrders.value.slice(start, start + pageSize.value)
})

/** ===== 行数据：父(order) + 子表头(subhead) + 子行(biz) ===== */
const tableRows = computed(() => {
  const rows = []
  const kwCustomer = (filters.customerName || '').trim().toLowerCase()
  const customerMode = !!kwCustomer

  pagedOrders.value.forEach(order => {
const orderCode = normalizeOrderCode(order) || 'ORD'

// 客户分组 key：优先 customer_id，兜底护照+姓名
const getCustomerKey = (c) =>
  c.customer_id || `${c.passport || ''}__${c.name || ''}`

// 1) 按客户分组
const groups = new Map()
;(order.customers || []).forEach(c => {
  const key = getCustomerKey(c)
  if (!groups.has(key)) groups.set(key, [])
  groups.get(key).push(c)
})

// 2) 展平成 bizRows（客户号从 001 开始）
let customerSeq = 0
const bizRows = []

for (const [, list] of groups) {
  customerSeq++

  const displayNo = `${orderCode}-${String(customerSeq).padStart(3, '0')}`

  // 同一客户多业务，按 business_seq 排序（没有就保持原顺序）
  const sorted = [...list].sort(
    (a, b) => Number(a.business_seq || 0) - Number(b.business_seq || 0)
  )

  sorted.forEach(c => {
    c.agent_commission = Number(c.agent_commission || 0)
    c.staff_commission = Number(c.staff_commission || 0)

    const f = calcRowFinance(c)
    const visaExpireAt = normalizeVisaExpireAt(c)

    bizRows.push({
      ...c,
      __rowType: 'biz',
      __orderId: order.id,
      __rowIndex: (order.customers || []).indexOf(c), // 回写原数组用
      __rowNoDisplay: displayNo, // ✅ 同一客户所有行都用同一个号
      __visaExpireAt: visaExpireAt || '',
      __workPermitText: c.has_work_permit
        ? '有'
        : (c.has_work_permit === false ? '无' : '-'),
      __processStatus: normalizeProcessStatus(c),
      __bizLabel: normalizeBizType(c),
      __settlement: normalizeRowSettlement(c),
      __feeLines: buildFeeLines(c),
      __finance: {
        amount: f.feeTotal,
        upstream_fee: Number(f.upstream || 0),
        agent_commission: Number(f.agent || 0),
        staff_commission: Number(f.staff || 0),
        profit: Number(f.profit || 0)
      }
    })
  })
}


    const bizShown = !customerMode
      ? bizRows
      : bizRows.filter(r => (r.name || '').toLowerCase().includes(kwCustomer))

    const orderFinance = calcOrderFinance(bizRows.map(r => ({ ...r })))
    const orderRow = {
      ...order,
      __rowType: 'order',
      __orderId: order.id,
      __customersCount: groups.size,
      __bizStats: getBizStats(order.customers || []),
      __statusInfo: getDisplayStatusInfo(bizRows),
      __settlement: getDisplaySettlement(bizRows),
      __finance: {
        amount: Number(orderFinance.total_fee || 0),
        upstream_fee: Number(orderFinance.upstream_fee || 0),
        agent_commission: Number(orderFinance.agent_commission || 0),
        staff_commission: Number(orderFinance.staff_commission || 0),
        profit: Number(orderFinance.profit || 0)
      },
      __customerHit: customerMode && bizShown.length
        ? { name: bizShown[0]?.name || '', passport: bizShown[0]?.passport || '' }
        : null
    }

    rows.push(orderRow)

    const forceExpand = customerMode && bizShown.length > 0
    const expanded = expandedOrderIds.value.has(order.id) || forceExpand

if (expanded) {
  // ✅ PATCH：给子表头挂父行引用，金额合计和右侧列才能正常渲染
  rows.push({
    __rowType: 'subhead',
    __orderId: order.id,
    __parent: orderRow   // ← 关键就是这一行
  })
  rows.push(...(customerMode ? bizShown : bizRows))
}

  })

  return rows
})

const isOrderExpanded = (orderId) => expandedOrderIds.value.has(orderId)
const isCustomerModeForceExpand = (orderId) => {
  if (!isCustomerView.value) return false
  const kwCustomer = (filters.customerName || '').trim().toLowerCase()
  if (!kwCustomer) return false
  const order = pagedOrders.value.find(o => o.id === orderId)
  if (!order) return false
  return (order.customers || []).some(c => (c.name || '').toLowerCase().includes(kwCustomer))
}

const toggleOrder = (orderId) => {
  const set = new Set(expandedOrderIds.value)
  if (set.has(orderId)) set.delete(orderId)
  else set.add(orderId)
  expandedOrderIds.value = set
}

/** 表格行为 */
const isRowSelectable = (row) => row.__rowType === 'order'
const handleSelectionChange = (val) => {
  selectedOrderRows.value = (val || []).filter(v => v.__rowType === 'order')
}
const clearSelection = () => multipleTableRef.value?.clearSelection()

const rowClassName = ({ row }) => {
  if (row.__rowType === 'order') return 'row-order'
  if (row.__rowType === 'subhead') return 'row-subhead'
  return 'row-biz'
}

/** 子行编辑回写 */
const saveBizRowPatch = (orderId, rowIndex, patch) => {
  const raw = db.getRaw('ORDERS') || []
  const idx = raw.findIndex(o => o.id === orderId)
  if (idx === -1) return

  const order = raw[idx]
  if (!Array.isArray(order.customers)) order.customers = []
  const target = order.customers[rowIndex]
  if (!target) return

  order.customers[rowIndex] = { ...target, ...patch }
  raw[idx] = order
  db.saveRaw('ORDERS', raw)
}

const handleBizFinanceEdit = (bizRow) => {
  const patch = {
    agent_commission: Number(bizRow.agent_commission || 0),
    staff_commission: Number(bizRow.staff_commission || 0)
  }
  saveBizRowPatch(bizRow.__orderId, bizRow.__rowIndex, patch)
  loadData()
}

/** 批量操作 */
const handleBatchSettlement = () => {
  ElMessageBox.confirm(`确定将选中的 ${selectedOrderRows.value.length} 个订单全部标记为已结清？`, '批量操作')
    .then(() => {
      const raw = db.getRaw('ORDERS') || []
      const selectedIds = selectedOrderRows.value.map(r => r.__orderId)

      const newData = raw.map(o => {
        if (selectedIds.includes(o.id)) {
          o.settlement = 'paid'
          o.customers?.forEach(c => (c.settlement = 'paid'))
        }
        return o
      })

      db.saveRaw('ORDERS', newData)
      loadData()
      selectedOrderRows.value = []
      ElMessage.success('批量更新成功')
    })
}

const handleBatchDelete = () => {
  ElMessageBox.confirm(
    `确定将选中的 ${selectedOrderRows.value.length} 个订单移入回收站？`,
    '批量删除',
    { type: 'warning' }
  ).then(() => {
    const raw = db.getRaw('ORDERS') || []
    const selectedIds = selectedOrderRows.value.map(r => r.__orderId)

    const updated = raw.map(o => {
      if (selectedIds.includes(o.id)) {
        return { ...o, deleted: true, deleted_at: new Date().toLocaleString() }
      }
      return o
    })

    db.saveRaw('ORDERS', updated)
    loadData()
    selectedOrderRows.value = []
    ElMessage.success('已批量移入回收站')
  })
}

/** 结算更新 */
const handleUpdateSettlement = (orderId, status) => {
  const raw = db.getRaw('ORDERS') || []
  const idx = raw.findIndex(o => o.id === orderId)
  if (idx !== -1) {
    raw[idx].settlement = status
    raw[idx].customers?.forEach(c => (c.settlement = status))
    db.saveRaw('ORDERS', raw)
    loadData()
    ElMessage.success('结算状态已更新')
  }
}

/** 父行更多操作 */
const handleCommand = (cmd, orderId) => {
  if (cmd === 'print') window.print()
  if (cmd === 'export') handleSingleExport(orderId)
  if (cmd === 'delete') handleDelete(orderId)
}

const handleDelete = (orderId) => {
  ElMessageBox.confirm('订单将移入回收站，是否继续？', '删除订单', { type: 'warning' })
    .then(() => {
      const raw = db.getRaw('ORDERS') || []
      const updated = raw.map(o => {
        if (o.id === orderId) {
          return { ...o, deleted: true, deleted_at: new Date().toLocaleString() }
        }
        return o
      })
      db.saveRaw('ORDERS', updated)
      loadData()
      ElMessage.success('订单已移入回收站')
    })
}

/** 导出 */
const handleExport = () => {
  if (filteredOrders.value.length === 0) return ElMessage.warning('无数据')

  const header = ['日期', '单号', '代理/联系人', '业务明细', '总金额', '办理进度', '结算', '上游费用', '代理佣金', '客服提成', '利润', '备注']
  const rows = filteredOrders.value.map(o => {
    const bizRows = (o.customers || []).map((c, idx) => {
      c.agent_commission = Number(c.agent_commission || 0)
      c.staff_commission = Number(c.staff_commission || 0)
      const f = calcRowFinance(c)
      return {
        __processStatus: normalizeProcessStatus(c),
        __settlement: normalizeRowSettlement(c),
        __finance: {
          amount: f.feeTotal,
          upstream_fee: f.upstream,
          agent_commission: f.agent,
          staff_commission: f.staff,
          profit: f.profit
        }
      }
    })
    const of = calcOrderFinance(bizRows)
    const statusInfo = getDisplayStatusInfo(bizRows)
    const settlement = getDisplaySettlement(bizRows)

    return [
      normalizeDate(o),
      normalizeOrderCode(o),
      normalizeAgentLabel(o),
      getBizStats(o.customers || []),
      Number(of.total_fee || 0),
      statusInfo.lines.join(' / '),
      settlementText(settlement),
      Number(of.upstream_fee || 0),
      Number(of.agent_commission || 0),
      Number(of.staff_commission || 0),
      Number(of.profit || 0),
      o.remark || ''
    ]
  })

  downloadCSV(`业务汇总_${new Date().toLocaleDateString()}`, header, rows)
}

const handleSingleExport = (orderId) => {
  const order =
    filteredOrders.value.find(o => o.id === orderId) ||
    allOrders.value.find(o => o.id === orderId)

  if (!order) return ElMessage.warning('未找到订单')

  const orderCode = normalizeOrderCode(order) || 'ORD'

  const header = [
    '序号',
    '客户姓名',
    '护照号',
    '国籍',
    '签证到期日',
    '劳工证',
    '业务',
    '费用明细',
    '办理进度',
    '金额',
    '上游费用',
    '代理佣金',
    '客服提成',
    '利润',
    '结算'
  ]

  // === 和页面一模一样的客户分组规则 ===
  const getCustomerKey = (c) =>
    c.customer_id || `${c.passport || ''}__${c.name || ''}`

  const groups = new Map()
  ;(order.customers || []).forEach(c => {
    const key = getCustomerKey(c)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(c)
  })

  let customerSeq = 0
  const rows = []

  for (const [, list] of groups) {
    customerSeq++
    const displayNo = `${orderCode}-${String(customerSeq).padStart(3, '0')}`

    const sorted = [...list].sort(
      (a, b) => Number(a.business_seq || 0) - Number(b.business_seq || 0)
    )

    sorted.forEach(c => {
      const f = calcRowFinance(c)
      const feeLines = buildFeeLines(c)
        .map(x => `${x.label}:${x.amount}`)
        .join(' | ')

      const settlement = normalizeRowSettlement(c)
      const visaExpireAt = normalizeVisaExpireAt(c)

      rows.push([
        displayNo, // ✅ 和页面完全一致
        c.name || '',
        c.passport || '',
        c.nationality || '',
        visaExpireAt || '',
        c.has_work_permit ? '有' : (c.has_work_permit === false ? '无' : ''),
        normalizeBizType(c) || '',
        feeLines,
        statusText(normalizeProcessStatus(c)),
        f.feeTotal,
        f.upstream,
        f.agent,
        f.staff,
        f.profit,
        settlement === 'paid' ? '已付' : '未付'
      ])
    })
  }

  downloadCSV(`订单_${orderCode}_明细`, header, rows)
}

const downloadCSV = (filename, header, rows) => {
  const csvContent = '\ufeff' + header.join(',') + '\n' + rows.map(r => r.map(x => String(x ?? '')).join(',')).join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}.csv`
  link.click()
}

/** 搜索/重置/路由 */
const handleSearch = () => {
  loadData()
  currentPage.value = 1
}
const resetFilters = () => {
  Object.keys(filters).forEach(k => (filters[k] = k === 'dateRange' ? [] : ''))
  handleSearch()
}

const goCreate = () => router.push({ name: 'business.orders.create' })
const goEdit = (orderId) => router.push({ name: 'business.orders.create', query: { id: orderId } })

onMounted(() => {
  loadData()
  if (route.query.agent) {
    filters.agent = route.query.agent
    handleSearch()
  }
})
</script>

<style scoped>
.order-code-prefix { color: #334155; }
.code-font { font-family: monospace; font-weight: 700; color: #2563eb; }
.search-card { border-top: none !important; margin-bottom: 20px; }
.flex-end { display: flex; justify-content: flex-end; gap: 10px; }
.amount-bold { font-weight: 700; }
.w-100 { width: 100%; }
.biz-count-text { color: #0284c7; font-weight: 600; }
.cursor-pointer { cursor: pointer; }
.muted { color: #94a3b8; }
.small-center { display: flex; align-items: center; justify-content: center; }

/* 批量工具条 */
.batch-toolbar {
  position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
  background: #1e293b; color: white; padding: 10px 24px;
  border-radius: 40px; z-index: 2000; display: flex; align-items: center;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
}
.selected-count { font-size: 14px; font-weight: 600; color: #fbbf24; }

/* 父行摘要 */
.order-summary { display: flex; flex-direction: column; gap: 6px; }
.order-summary-line { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.agent-strong { color: #0f172a; }
.summary-text { color: #334155; }

.expand-btn { cursor: pointer; display: inline-flex; align-items: center; }
.expand-icon { font-size: 14px; color: #64748b; }

.customer-hit-hint { margin-left: 22px; color: #2563eb; font-size: 13px; }


/* ✅ 子表头右侧列文字必须允许显示 */
.subhead-right {
  font-size: 11px;
  color: #94a3b8;
  white-space: nowrap;
  overflow: visible !important;
  text-overflow: unset !important;
  display: block;
  text-align: center;
}
/* ✅ 子表头行不要裁剪内容 */
:deep(.row-subhead .el-table__cell) {
  overflow: visible !important;
}


/* ✅ 子表头：更窄、更紧凑 */
.subhead-wrap { padding: 4px 0; }
.subhead-grid {
  display: grid;
  grid-template-columns:
    150px   /* 序号 */
    110px  /* 客户姓名 */
    100px  /* 护照号 */
    100px  /* 化名/员工编号 */
    70px   /* 国籍 */
    100px  /* 签证到期日 */
    70px   /* 劳工证 */
    100px  /* 办理业务 */
    1fr;   /* 费用明细 */
  gap: 6px;
  align-items: center;
}
.subhead-cell {
  font-size: 11px;
  color: #94a3b8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 2px 0;
}
.subhead-wide {}

/* ✅ 子行：横向明细（更像 google sheet） */
.biz-row-grid {
  display: grid;
  grid-template-columns:
    150px
    110px
    100px
    100px
    70px
    100px
    70px
    100px
    1fr;
  gap: 6px;
  align-items: center;
}

.biz-cell,
.biz-cell-no,
.biz-cell-name {
  font-size: 12px;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.biz-cell-no { color: #64748b; }
.biz-cell-name { font-weight: 700; }
.biz-wide { min-width: 0; }

.fee-lines { display: flex; flex-direction: column; gap: 2px; }
.fee-line { display: flex; justify-content: space-between; gap: 6px; font-size: 11px; line-height: 1.2; }
.fee-k { color: #64748b; }
.fee-v { font-weight: 600; }
.fee-empty { font-size: 11px; color: #94a3b8; }

/* 父行进度统计块 */
.status-detail-tag {
  display: inline-flex; flex-direction: column; align-items: flex-start;
  padding: 6px 10px; border-radius: 6px; min-width: 110px;
}
.status-line { font-size: 12px; line-height: 1.5; display: flex; align-items: center; white-space: nowrap; }
.dot { width: 6px; height: 6px; border-radius: 50%; margin-right: 6px; display: inline-block; }
.status-type-success { background: #f0f9eb; color: #67c23a; border: 1px solid #e1f3d8; }
.status-type-success .dot { background: #67c23a; }
.status-type-warning { background: #fdf6ec; color: #e6a23c; border: 1px solid #faecd8; }
.status-type-warning .dot { background: #e6a23c; }
.status-type-info { background: #f4f4f5; color: #909399; border: 1px solid #e9e9eb; }
.status-type-info .dot { background: #909399; }

/* 行区分 */
:deep(.row-order td) { background: #ffffff; }
:deep(.row-subhead td) { background: #f8fafc; }
:deep(.row-biz td) { background: #fcfdff; }

/* 表格整体更紧凑 */
:deep(.order-tree-table) { font-size: 12px; }
:deep(.order-tree-table .el-table__cell) { padding: 6px 8px; }

/* 子表头行更矮 */
:deep(.row-subhead .el-table__cell) { padding-top: 4px !important; padding-bottom: 4px !important; }

@media print {
  .no-print, .el-header, .el-aside, .search-card, .pagination-area, .fixed-right, .batch-toolbar { display: none !important; }
}
</style>
