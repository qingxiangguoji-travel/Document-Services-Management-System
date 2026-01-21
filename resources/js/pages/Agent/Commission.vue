<template>
  <page-standard-wrapper>
    <template #title>代理佣金管理</template>
    <template #subtitle>系统根据各代理商约定的提成比例自动核算，并记录所有结算流水</template>

    <template #actions>
      <el-button :icon="Download" @click="handleExport">导出对账单</el-button>
      <el-button type="success" :icon="Money" @click="handleBatchSettle">一键核销全部</el-button>
    </template>

    <el-row :gutter="20" class="stat-cards">
      <el-col :span="6">
        <div class="stat-card pending">
          <div class="label">待支付佣金总额</div>
          <div class="value">${{ totalPendingAmount }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="label">涉及未结订单</div>
          <div class="value">{{ totalPendingOrders }} <span class="unit">笔</span></div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card history">
          <div class="label">累计已结佣金</div>
          <div class="value">${{ totalHistoryAmount }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card history">
          <div class="label">已结清流水</div>
          <div class="value">{{ settlementHistory.length }} <span class="unit">条</span></div>
        </div>
      </el-col>
    </el-row>

    <el-tabs v-model="activeTab" class="commission-tabs">
      <el-tab-pane label="待结算提成" name="pending">
        <div class="table-container">
          <el-table :data="commissionData" border stripe style="width: 100%">
            <template #empty>
              <el-empty description="当前没有待结算的代理佣金" />
            </template>
            
            <el-table-column prop="agentName" label="代理联系人" min-width="200">
              <template #default="scope">
                <div class="agent-info">
                  <el-avatar :size="24" :icon="User" class="mr-2" />
                  <div>
                    <div class="name">{{ scope.row.agentName }}</div>
                    <div class="rate-tag">
                      提成比例: {{ scope.row.isMixedRate ? '按单核算' : (scope.row.agentRate * 100).toFixed(1) + '%' }}
                      <el-tooltip v-if="scope.row.isMixedRate" content="该代理存在不同比例的订单，已按各单快照比例分别计算">
                        <el-icon :size="12"><InfoFilled /></el-icon>
                      </el-tooltip>
                    </div>
                  </div>
                </div>
              </template>
            </el-table-column>
            
            <el-table-column prop="orderCount" label="订单数" width="100" align="center" />
            
            <el-table-column label="产生总利润" width="150" align="right">
              <template #default="scope">
                <span class="num-font">${{ scope.row.totalProfit.toLocaleString() }}</span>
              </template>
            </el-table-column>
            
            <el-table-column label="应结佣金" width="150" align="right">
              <template #default="scope">
                <span class="amount-highlight">${{ scope.row.commissionAmount.toLocaleString(undefined, {minimumFractionDigits: 2}) }}</span>
              </template>
            </el-table-column>
            
            <el-table-column label="操作" width="180" align="center">
              <template #default="scope">
                <el-button type="primary" size="small" @click="settleOne(scope.row)">确认结算</el-button>
                <el-button size="small" link @click="viewDetails(scope.row)">明细</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="结算流水历史" name="history">
        <div class="table-container">
          <el-table :data="settlementHistory" border stripe style="width: 100%">
            <el-table-column prop="date" label="结算时间" width="180" />
            <el-table-column prop="agentName" label="收款代理" width="200" />
            <el-table-column prop="amount" label="结算金额" width="150" align="right">
              <template #default="scope">
                <span style="color: #10b981; font-weight: bold">${{ scope.row.amount.toLocaleString(undefined, {minimumFractionDigits: 2}) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="orderRefs" label="关联订单数" align="center" width="120" />
            <el-table-column prop="status" label="状态" align="center">
              <template #default>
                <el-tag type="success" size="small">已发放</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>
  </page-standard-wrapper>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Money, Download, User, InfoFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PageStandardWrapper from '../../layouts/PageLayout.vue'
import { db } from '@/utils/storage'

const activeTab = ref('pending')
const commissionData = ref([])
const settlementHistory = ref([])

const loadData = () => {
  settlementHistory.value = db.getRaw('COMMISSION_HISTORY') || []
  
  const allOrders = db.getRaw('ORDERS') || []
  const allAgents = db.getAgents() || [] 
  
  const agentMap = {}

  allOrders.forEach(order => {
    // 逻辑：仅处理有代理联系人 且 该订单尚未标记为“佣金已结”的订单
    if (order.agent_id && !order.commission_settled) {
      
      // --- 专业逻辑：确定本单比例 ---
      let orderRate;
      if (order.agent_commission_rate !== undefined) {
        // 1. 优先使用下单时的快照比例
        orderRate = order.agent_commission_rate / 100;
      } else {
        // 2. 老订单处理：回退到代理配置或默认10%
        const agentConfig = allAgents.find(a => a.name === order.agent_company);
        orderRate = agentConfig && agentConfig.commission_rate ? agentConfig.commission_rate / 100 : 0.1;
      }

      if (!agentMap[order.agent_id]) {
        agentMap[order.agent_id] = {
          agentName: order.agent_id,
          agentRate: orderRate, // 初始比例
          isMixedRate: false,
          orderCount: 0,
          totalProfit: 0,
          commissionAmount: 0,
          orderIds: []
        }
      }

      // 如果同一个代理的不同订单比例不同，标记为混合比例
      if (agentMap[order.agent_id].agentRate !== orderRate) {
        agentMap[order.agent_id].isMixedRate = true;
      }

      let orderProfit = 0
      if (order.customers) {
        order.customers.forEach(c => {
          orderProfit += (Number(c.actual_fee || 0) - Number(c.upstream_fee || 0))
        })
      }

      const currentAgent = agentMap[order.agent_id]
      currentAgent.orderCount += 1
      currentAgent.totalProfit += orderProfit
      // 按单计算佣金并累加
      currentAgent.commissionAmount += (orderProfit * orderRate)
      currentAgent.orderIds.push(order.id)
    }
  })

  commissionData.value = Object.values(agentMap).filter(item => item.commissionAmount > 0)
}

onMounted(loadData)

const totalPendingAmount = computed(() => 
  commissionData.value.reduce((s, i) => s + i.commissionAmount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 }))

const totalPendingOrders = computed(() => 
  commissionData.value.reduce((s, i) => s + i.orderCount, 0))

const totalHistoryAmount = computed(() => 
  settlementHistory.value.reduce((s, i) => s + i.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 }))

const settleOne = (row) => {
  ElMessageBox.confirm(
    `确认向 [${row.agentName}] 支付佣金 $${row.commissionAmount.toLocaleString(undefined, {minimumFractionDigits: 2})} 吗？\n核销后相关订单将标记为已结清状态。`,
    '结算执行',
    { confirmButtonText: '确认打款', type: 'success' }
  ).then(() => {
    const allOrders = db.getRaw('ORDERS') || []
    const updatedOrders = allOrders.map(order => {
      if (row.orderIds.includes(order.id)) {
        // 严格遵守：不修改 order_no 等其他字段，仅更新结算标记
        return { ...order, commission_settled: true }
      }
      return order
    })
    db.saveRaw('ORDERS', updatedOrders)

    const newHistory = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      agentName: row.agentName,
      amount: row.commissionAmount,
      orderRefs: row.orderCount
    }
    const histories = db.getRaw('COMMISSION_HISTORY') || []
    db.saveRaw('COMMISSION_HISTORY', [newHistory, ...histories])

    loadData()
    ElMessage.success('结算成功并已记录流水')
  })
}

// 其他函数保持不变...
const handleBatchSettle = () => ElMessage.warning('请逐个核对代理账单进行结算')
const handleExport = () => ElMessage.success('对账单导出中...')
const viewDetails = (row) => ElMessage(`明细查询: ${row.agentName}`)
</script>

<style scoped>
/* 保持原有样式，增加少量美化 */
.stat-cards { margin-bottom: 20px; }
.stat-card { padding: 16px 20px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; }
.stat-card .label { font-size: 12px; color: #64748b; margin-bottom: 4px; }
.stat-card .value { font-size: 22px; font-weight: 700; color: #1e293b; }
.stat-card.pending { border-top: 3px solid #ef4444; }
.stat-card.pending .value { color: #ef4444; }
.stat-card.history { border-top: 3px solid #10b981; }

.agent-info { display: flex; align-items: center; }
.rate-tag { font-size: 11px; color: #94a3b8; margin-top: 2px; display: flex; align-items: center; gap: 4px; }
.amount-highlight { color: #ef4444; font-weight: 700; font-family: monospace; }
.num-font { font-family: monospace; }
.table-container { background: #fff; border-radius: 4px; padding: 2px; }
.mr-2 { margin-right: 8px; }
</style>