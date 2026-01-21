<template>
  <div class="dashboard-page">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">业务概览</h1>
        <p class="page-description">欢迎回来，{{ userInfo.name }}！今天有 <span class="highlight">{{ stats.processing }}</span> 个订单正在处理中。</p>
      </div>
      <div class="header-right">
        <el-button-group>
          <el-button :icon="Icons.Refresh" @click="initDashboard">刷新数据</el-button>
          <el-button type="primary" :icon="Icons.Plus" @click="router.push({ name: 'business.orders.create' })">快速建单</el-button>
        </el-button-group>
      </div>
    </div>

    <el-skeleton :loading="isLoading" animated :count="1">
      <template #template>
        <el-row :gutter="20">
          <el-col :span="6" v-for="i in 4" :key="i">
            <el-skeleton-item variant="rect" style="height: 100px; border-radius: 12px; margin-bottom: 20px;" />
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="16"><el-skeleton-item variant="rect" style="height: 400px; border-radius: 12px" /></el-col>
          <el-col :span="8"><el-skeleton-item variant="rect" style="height: 400px; border-radius: 12px" /></el-col>
        </el-row>
      </template>

      <template #default>
        <el-row :gutter="20" class="stats-cards">
          <el-col :xs="24" :sm="12" :lg="6" v-for="item in statCards" :key="item.label">
            <el-card class="stat-card" shadow="hover">
              <div class="stat-content">
                <div class="stat-info">
                  <div class="stat-label">{{ item.label }}</div>
                  <div class="stat-value">{{ item.value }}</div>
                </div>
                <div class="stat-icon" :style="{ background: item.bgColor }">
                  <el-icon :color="item.iconColor" :size="26">
                    <component :is="Icons[item.icon]" />
                  </el-icon>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :xs="24" :lg="17">
            <el-card class="dashboard-section mb-20" shadow="never">
              <template #header><div class="card-header"><h3>常用功能</h3></div></template>
              <div class="actions-grid">
                <div v-for="act in quickActions" :key="act.text" class="action-item" @click="router.push({ name: act.route })">
                  <div class="action-icon-wrap" :style="{ color: act.color }">
                    <el-icon :size="28"><component :is="Icons[act.icon]" /></el-icon>
                  </div>
                  <span class="action-text">{{ act.text }}</span>
                </div>
              </div>
            </el-card>

            <el-card class="dashboard-section" shadow="never">
              <template #header>
                <div class="card-header">
                  <h3>最近提交订单</h3>
                  <el-button type="primary" link @click="router.push({ name: 'business.orders' })">
                    查看全部 <el-icon><Icons.ArrowRight /></el-icon>
                  </el-button>
                </div>
              </template>
              <el-table :data="recentOrders" style="width: 100%" class="standard-table">
                <el-table-column prop="code" label="单号" width="160">
                  <template #default="{row}">
                    <span class="order-code">{{ row.code }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="agent" label="代理客户" min-width="150" show-overflow-tooltip />
                <el-table-column prop="businessType" label="业务类型" width="150" />
                <el-table-column label="状态" width="110" align="center">
                  <template #default="{ row }">
                    <el-tag :type="getStatusType(row.status)" effect="dark" size="small">
                      {{ getStatusText(row.status) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="created_at" label="日期" width="120" align="right" />
              </el-table>
            </el-card>
          </el-col>

          <el-col :xs="24" :lg="7">
            <el-card class="dashboard-section mb-20 side-card" shadow="never">
              <template #header><div class="card-header"><h3>业务分布</h3></div></template>
              <div class="business-dist">
                <div v-for="(val, key) in businessTypeStats" :key="key" class="dist-item">
                  <div class="dist-info">
                    <span class="dist-label">{{ key }}</span>
                    <span class="dist-val">{{ val }}</span>
                  </div>
                  <el-progress :percentage="Math.round((val / stats.total) * 100) || 0" :stroke-width="8" :show-text="false" />
                </div>
                <el-empty v-if="stats.total === 0" description="暂无业务数据" :image-size="60" />
              </div>
            </el-card>

            <el-card class="dashboard-section side-card tip-card" shadow="never">
              <div class="tip-content">
                <el-icon size="40" color="#2563eb"><Icons.Opportunity /></el-icon>
                <h4>操作提示</h4>
                <p>点击单号可直接进入详情编辑页面，按 F8 可快速保存当前正在编辑的表单。</p>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </template>
    </el-skeleton>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import * as Icons from '@element-plus/icons-vue'
import { db } from '@/utils/storage'

const router = useRouter()
const userInfo = ref({ name: '管理员' })
const isLoading = ref(true)

const rawData = ref([])
const stats = reactive({
  total: 0, completed: 0, processing: 0, unpaid: 0
})

// 统计卡片配置
const statCards = computed(() => [
  { label: '订单总数', value: stats.total, icon: 'Files', bgColor: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)', iconColor: '#0284c7' },
  { label: '正在办理', value: stats.processing, icon: 'Loading', icon: 'Timer', bgColor: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', iconColor: '#d97706' },
  { label: '已完结', value: stats.completed, icon: 'CircleCheckFilled', bgColor: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)', iconColor: '#16a34a' },
  { label: '待收欠款', value: `฿${stats.unpaid.toLocaleString()}`, icon: 'Money', bgColor: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', iconColor: '#dc2626' }
])

const quickActions = [
  { text: '新建订单', icon: 'CirclePlus', color: '#2563eb', route: 'business.orders.create' },
  { text: '代理管理', icon: 'UserFilled', color: '#7c3aed', route: 'agent.index' },
  { text: '文件柜', icon: 'FolderChecked', color: '#ea580c', route: 'business.files' },
  { text: '系统配置', icon: 'Management', color: '#059669', route: 'system.dictionary' }
]

// 计算业务分布
const businessTypeStats = computed(() => {
  const map = {}
  rawData.value.forEach(o => {
    if (o.businessType) {
      map[o.businessType] = (map[o.businessType] || 0) + 1
    }
  })
  return map
})

const recentOrders = computed(() => {
  return [...rawData.value]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 8)
})

const initDashboard = () => {
  isLoading.value = true
  try {
    const all = db.getOrders() || []
    rawData.value = all
    stats.total = all.length
    stats.completed = all.filter(o => o.status === 'completed').length
    stats.processing = all.filter(o => o.status !== 'completed').length
    stats.unpaid = all.filter(o => o.settlement !== 'paid').reduce((sum, o) => sum + (Number(o.total_fee) || 0), 0)
  } catch (err) {
    console.error(err)
  } finally {
    setTimeout(() => { isLoading.value = false }, 500)
  }
}

const getStatusType = (s) => ({ created: 'info', processing: 'warning', completed: 'success' }[s] || 'info')
const getStatusText = (s) => ({ created: '已录入', processing: '办理中', completed: '已完成' }[s] || s)

onMounted(initDashboard)
</script>

<style scoped>
.dashboard-page { padding: 24px; background-color: #f8fafc; min-height: 100vh; }

/* Header Area */
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
.page-title { font-size: 28px; font-weight: 800; color: #1e293b; margin: 0 0 4px 0; }
.page-description { color: #64748b; font-size: 14px; }
.highlight { color: #2563eb; font-weight: 700; }

/* Stats Cards */
.stats-cards { margin-bottom: 24px; }
.stat-card { border: none; border-radius: 16px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.stat-card:hover { transform: translateY(-5px); box-shadow: 0 12px 20px -5px rgba(0, 0, 0, 0.1); }
.stat-content { display: flex; justify-content: space-between; align-items: center; }
.stat-label { color: #64748b; font-size: 14px; font-weight: 600; margin-bottom: 8px; }
.stat-value { font-size: 26px; font-weight: 800; color: #0f172a; }
.stat-icon { width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }

/* Sections */
.dashboard-section { border-radius: 16px; border: 1px solid #e2e8f0; }
.card-header h3 { font-size: 16px; font-weight: 700; color: #1e293b; margin: 0; }
.mb-20 { margin-bottom: 20px; }

/* Quick Actions Grid */
.actions-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.action-item { 
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 20px; border-radius: 12px; background: #fff; border: 1px solid #f1f5f9;
  cursor: pointer; transition: all 0.2s;
}
.action-item:hover { background: #f8fafc; border-color: #cbd5e1; transform: scale(1.02); }
.action-icon-wrap { margin-bottom: 12px; }
.action-text { font-size: 14px; font-weight: 600; color: #334155; }

/* Business Dist */
.business-dist { padding: 5px 0; }
.dist-item { margin-bottom: 15px; }
.dist-info { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; }
.dist-label { color: #475569; font-weight: 500; }
.dist-val { color: #0f172a; font-weight: 700; }

/* Table Styling */
.order-code { font-family: 'Monaco', monospace; color: #2563eb; font-weight: 600; }
:deep(.standard-table th) { background-color: #f8fafc !important; color: #475569; font-weight: 700; text-transform: uppercase; font-size: 12px; }

/* Tips Card */
.tip-card { background: linear-gradient(to bottom right, #eff6ff, #ffffff); text-align: center; }
.tip-content { padding: 10px; }
.tip-content h4 { margin: 12px 0 8px; color: #1e293b; }
.tip-content p { font-size: 13px; color: #64748b; line-height: 1.6; }

/* Responsive */
@media (max-width: 768px) {
  .actions-grid { grid-template-columns: repeat(2, 1fr); }
  .page-header { flex-direction: column; gap: 16px; }
}
</style>