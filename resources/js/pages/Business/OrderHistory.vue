<template>
  <PageLayout>
    <template #title>订单历史明细</template>
    <template #subtitle>当前代理人：{{ targetAgent }}</template>
    <template #actions>
      <el-button @click="router.back()">返回列表</el-button>
      <el-button type="primary" :icon="Download" @click="handleExport">导出此人记录</el-button>
    </template>

    <el-row :gutter="20" class="m-b-20">
      <el-col :span="6">
        <el-card shadow="never" class="stats-mini-card">
          <div class="label">累计订单</div>
          <div class="value">{{ historyOrders.length }} <span class="unit">单</span></div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="stats-mini-card">
          <div class="label">累计金额</div>
          <div class="value text-warning">${{ totalAmount.toLocaleString() }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="section-card">
      <el-table :data="historyOrders" v-loading="loading" border stripe>
        <el-table-column label="业务汇总" min-width="350">
          <template #default="scope">
            <div class="summary-content">
              <div class="date-row">{{ scope.row.created_at }}</div>
              <div class="biz-detail">
                共 {{ scope.row.customers?.length || 0 }} 人办理：
                <span class="biz-tags">{{ getBizStats(scope.row.customers) }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="code" label="订单编号" width="160">
          <template #default="scope"><span class="code-font">{{ scope.row.code }}</span></template>
        </el-table-column>

        <el-table-column label="办理进度" width="180" align="center">
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
            <span class="amount-bold">${{ (scope.row.total_fee || 0).toLocaleString() }}</span>
          </template>
        </el-table-column>

        <el-table-column label="结算状态" width="120" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.settlement === 'paid' ? 'success' : 'danger'" effect="dark">
              {{ settlementText(scope.row.settlement) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="100" fixed="right" align="center">
          <template #default="scope">
            <el-button link type="primary" @click="goOrderDetail(scope.row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Download } from '@element-plus/icons-vue'
import PageLayout from '@/layouts/PageLayout.vue'
import { db } from '@/utils/storage'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const allOrders = ref([])
const configs = db.getConfigs()

// 从 URL 获取精准的代理人名称（格式：公司 - 联系人）
const targetAgent = computed(() => route.query.agent || '')

const historyOrders = computed(() => {
  if (!targetAgent.value) return []
  
  // 精准匹配逻辑：必须与保存时的 agent 字段完全一致
  return allOrders.value
    .filter(order => order.agent === targetAgent.value)
    .map(order => ({
      ...order,
      statusInfo: getDisplayStatusInfo(order.customers)
    }))
})

const totalAmount = computed(() => {
  return historyOrders.value.reduce((sum, o) => sum + (Number(o.total_fee) || 0), 0)
})

// 复用订单列表的状态计算逻辑
const getDisplayStatusInfo = (customers) => {
  if (!customers || customers.length === 0) return { lines: ['无数据'], type: 'info' }
  const total = customers.length
  const completedCount = customers.filter(c => c.status === 'Completed' || c.status === '已完成').length
  const pendingCount = customers.filter(c => c.status === 'Pending' || c.status === '未办理').length
  const processingCount = total - completedCount - pendingCount

  if (completedCount === total) return { lines: ['全部已完成'], type: 'success' }
  if (pendingCount === total) return { lines: ['全部未办理'], type: 'info' }
  
  let lines = []
  if (pendingCount > 0) lines.push(`${pendingCount} 人未办理`)
  if (processingCount > 0) lines.push(`${processingCount} 人办理中`)
  if (completedCount > 0) lines.push(`${completedCount} 人已完成`)
  return { lines, type: 'warning' }
}

const getBizStats = (customers) => {
  if (!customers) return ''
  const stats = {}
  customers.forEach(c => {
    const type = c.businessType || '未知业务'
    stats[type] = (stats[type] || 0) + 1
  })
  return Object.entries(stats).map(([name, count]) => `${count}本${name}`).join('，')
}

const settlementText = (s) => ({ 'paid': '已结清', 'partial': '部分结算', 'unpaid': '未结算' }[s] || '未知')

const goOrderDetail = (row) => {
  router.push({ name: 'business.orders.create', query: { id: row.id } })
}

const loadData = () => {
  loading.value = true
  allOrders.value = db.getRaw('ORDERS') || []
  loading.value = false
}

const handleExport = () => {
  // 导出逻辑...
}

onMounted(loadData)
</script>

<style scoped>
.m-b-20 { margin-bottom: 20px; }
.stats-mini-card { background: #f8fafc; border: 1px solid #e2e8f0; }
.stats-mini-card .label { font-size: 13px; color: #64748b; margin-bottom: 5px; }
.stats-mini-card .value { font-size: 24px; font-weight: 800; color: #1e293b; }
.stats-mini-card .unit { font-size: 14px; font-weight: normal; margin-left: 4px; }
.text-warning { color: #f59e0b !important; }

.code-font { font-family: monospace; font-weight: 700; color: #2563eb; }
.amount-bold { font-weight: 700; color: #1e293b; }
.date-row { font-size: 12px; color: #94a3b8; margin-bottom: 4px; }
.biz-detail { font-size: 14px; color: #334155; }
.biz-tags { color: #0284c7; font-weight: 600; }

/* 状态样式对齐订单列表 */
.status-detail-tag {
  display: inline-flex; flex-direction: column; align-items: flex-start;
  padding: 6px 12px; border-radius: 6px; min-width: 120px;
}
.status-line { font-size: 12px; display: flex; align-items: center; }
.dot { width: 6px; height: 6px; border-radius: 50%; margin-right: 6px; }
.status-type-success { background: #f0f9eb; color: #67c23a; border: 1px solid #e1f3d8; }
.status-type-success .dot { background: #67c23a; }
.status-type-warning { background: #fdf6ec; color: #e6a23c; border: 1px solid #faecd8; }
.status-type-warning .dot { background: #e6a23c; }
.status-type-info { background: #f4f4f5; color: #909399; border: 1px solid #e9e9eb; }
.status-type-info .dot { background: #909399; }
</style>