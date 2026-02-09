<!-- resources/js/pages/Dashboard.vue -->
<template>
  <TablePageLayout>
    <!-- ================= 标题 ================= -->
    <template #title>
      业务概览
    </template>

    <!-- ================= 副标题 ================= -->
    <template #subtitle>
      欢迎回来，{{ userInfo.name }}！今天有
      <span class="highlight">{{ stats.todayProcessing }}</span>
      个业务正在处理中。
    </template>

    <!-- ================= 右侧操作 ================= -->
    <template #actions>
      <el-button-group>
        <el-button :icon="Icons.Refresh" @click="initDashboard">刷新数据</el-button>
        <el-button
          type="primary"
          :icon="Icons.Plus"
          @click="router.push({ name: 'business.orders.create' })"
        >
          快速建单
        </el-button>
      </el-button-group>
    </template>

    <!-- ================= 搜索区（Dashboard 不用，留空） ================= -->
    <template #search>
      <!-- Dashboard 暂无筛选区 -->
    </template>

    <!-- ================= 主体滚动区 ================= -->
    <template #table>
      <div class="dashboard-page">
        <!-- ================= Skeleton ================= -->
        <el-skeleton :loading="isLoading" animated :count="1">
          <template #template>
            <el-row :gutter="20">
              <el-col :span="6" v-for="i in 4" :key="i">
                <el-skeleton-item
                  variant="rect"
                  style="height: 100px; border-radius: 12px; margin-bottom: 20px;"
                />
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="16">
                <el-skeleton-item variant="rect" style="height: 400px; border-radius: 12px" />
              </el-col>
              <el-col :span="8">
                <el-skeleton-item variant="rect" style="height: 400px; border-radius: 12px" />
              </el-col>
            </el-row>
          </template>

          <!-- ================= Content ================= -->
          <template #default>
            <!-- ===== 今日统计 ===== -->
<div class="stats-panel">
  <!-- 今日 -->
  <div class="stats-block">
    <div class="stats-block-header">
      <span class="stats-dot today"></span>
      <h3>今日统计</h3>
    </div>

    <el-row :gutter="16" class="stats-cards">
      <el-col
        v-for="item in todayCards"
        :key="item.label"
        :xs="12"
        :sm="8"
        :md="4"
        :lg="3"
        class="stat-col"
      >
        <el-card class="stat-card clickable" shadow="hover" @click="item.click">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-label">{{ item.label }}</div>
              <div class="stat-value">{{ item.value }}</div>
            </div>
            <div class="stat-icon" :style="{ background: item.bgColor }">
              <el-icon :color="item.iconColor" :size="22">
                <component :is="Icons[item.icon]" />
              </el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>

  <!-- 历史 -->
  <div class="stats-block">
    <div class="stats-block-header">
      <span class="stats-dot history"></span>
      <h3>历史统计</h3>
    </div>

    <el-row :gutter="16" class="stats-cards">
      <el-col
        v-for="item in historyCards"
        :key="item.label"
        :xs="12"
        :sm="8"
        :md="4"
        :lg="3"
        class="stat-col"
      >
        <el-card class="stat-card clickable" shadow="hover" @click="item.click">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-label">{{ item.label }}</div>
              <div class="stat-value">{{ item.value }}</div>
            </div>
            <div class="stat-icon" :style="{ background: item.bgColor }">
              <el-icon :color="item.iconColor" :size="22">
                <component :is="Icons[item.icon]" />
              </el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>

  <!-- 全部 -->
  <div class="stats-block">
    <div class="stats-block-header">
      <span class="stats-dot total"></span>
      <h3>全部统计</h3>
    </div>

    <el-row :gutter="16" class="stats-cards">
      <el-col
        v-for="item in totalCards"
        :key="item.label"
        :xs="12"
        :sm="8"
        :md="4"
        :lg="3"
        class="stat-col"
      >
        <el-card class="stat-card clickable" shadow="hover" @click="item.click">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-label">{{ item.label }}</div>
              <div class="stat-value">{{ item.value }}</div>
            </div>
            <div class="stat-icon" :style="{ background: item.bgColor }">
              <el-icon :color="item.iconColor" :size="22">
                <component :is="Icons[item.icon]" />
              </el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</div>



            <el-row :gutter="20">
              <!-- ================= Left ================= -->
              <el-col :xs="24" :lg="17">
                <!-- 常用功能 -->
                <el-card class="dashboard-section mb-20" shadow="never">
                  <template #header>
                    <div class="card-header">
                      <h3>常用功能</h3>
                    </div>
                  </template>

                  <div class="actions-grid">
                    <div
                      v-for="act in quickActions"
                      :key="act.text"
                      class="action-item"
                      @click="router.push({ name: act.route })"
                    >
                      <div class="action-icon-wrap" :style="{ color: act.color }">
                        <el-icon :size="28">
                          <component :is="Icons[act.icon]" />
                        </el-icon>
                      </div>
                      <span class="action-text">{{ act.text }}</span>
                    </div>
                  </div>
                </el-card>

                <!-- 最近订单 -->
                <el-card class="dashboard-section" shadow="never">
                  <template #header>
                    <div class="card-header">
                      <h3>最近提交订单</h3>
                      <el-button
                        type="primary"
                        link
                        @click="router.push({ name: 'business.orders' })"
                      >
                        查看全部
                        <el-icon><Icons.ArrowRight /></el-icon>
                      </el-button>
                    </div>
                  </template>

                  <el-table
                    :data="recentOrders"
                    style="width: 100%"
                    class="standard-table"
                  >
                    <el-table-column prop="code" label="单号" width="160">
                      <template #default="{ row }">
                        <span class="order-code">{{ row.code }}</span>
                      </template>
                    </el-table-column>

                    <el-table-column
                      prop="agent"
                      label="代理客户"
                      min-width="150"
                      show-overflow-tooltip
                    />

                    <el-table-column
                      prop="businessType"
                      label="业务类型"
                      width="150"
                    />

                    <el-table-column label="状态" width="110" align="center">
                      <template #default="{ row }">
                        <el-tag
                          :type="getStatusType(row.status)"
                          effect="dark"
                          size="small"
                        >
                          {{ getStatusText(row.status) }}
                        </el-tag>
                      </template>
                    </el-table-column>

                    <el-table-column
                      prop="created_at"
                      label="日期"
                      width="120"
                      align="right"
                    />
                  </el-table>
                </el-card>
              </el-col>

              <!-- ================= Right ================= -->
              <el-col :xs="24" :lg="7">
                <!-- 业务分布 -->
                <el-card class="dashboard-section mb-20 side-card" shadow="never">
                  <template #header>
                    <div class="card-header">
                      <h3>业务分布</h3>
                    </div>
                  </template>

                  <div class="business-dist">
                    <div
                      v-for="(val, key) in businessTypeStats"
                      :key="key"
                      class="dist-item"
                    >
                      <div class="dist-info">
                        <span class="dist-label">{{ key }}</span>
                        <span class="dist-val">{{ val }}</span>
                      </div>
                      <el-progress
                        :percentage="Math.round((val / (stats.totalBiz || 0)) * 100) || 0"
                        :stroke-width="8"
                        :show-text="false"
                      />
                    </div>

                    <el-empty
                      v-if="stats.totalBiz === 0"
                      description="暂无业务数据"
                      :image-size="60"
                    />
                  </div>
                </el-card>

                <!-- 操作提示 -->
                <el-card class="dashboard-section side-card tip-card" shadow="never">
                  <div class="tip-content">
                    <el-icon size="40" color="#2563eb">
                      <Icons.Opportunity />
                    </el-icon>
                    <h4>操作提示</h4>
                    <p>
                      点击单号可直接进入详情编辑页面，按 F8 可快速保存当前正在编辑的表单。
                    </p>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </template>
        </el-skeleton>
      </div>
    </template>

    <!-- ================= 底部（Dashboard 不用分页） ================= -->
    <template #pagination />
  </TablePageLayout>
</template>

<script setup>
import TablePageLayout from '@/layouts/TablePageLayout.vue'
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import * as Icons from '@element-plus/icons-vue'
import { db } from '@/utils/storage'
import { getStatusGroup, getStatusDef } from '@/domain/orderStatus'
import { listenSystemEvent } from '@/utils/systemBus'

const makeView = ({ time = 'all', status = '', scope = 'biz', mode = 'operate' } = {}) => ({
  time,
  status: status || undefined,
  scope,
  mode,
  source: 'dashboard'
})

const router = useRouter()

const goOrders = (view) => {
  // ✅ view 走统一协议（推荐）
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(view))))
  router.push({
    name: 'business.orders',
    query: { view: encoded, highlightStatus: view.status || '' }
  })
}

const todayCards = computed(() => [
  {
    label: '今日新增订单',
    value: stats.todayNew,
    icon: 'CirclePlus',
    bgColor: '#dbeafe',
    iconColor: '#2563eb',
    click: () => goOrders(makeView({ scope:'order', time:'today', status:null, mode:'view' }))
  },
  {
    label: '今日业务数',
    value: stats.todayBiz,
    icon: 'Tickets',
    bgColor: '#e0e7ff',
    iconColor: '#4f46e5',
    click: () => goOrders(makeView({ scope:'biz', time:'today', status:null, mode:'operate' }))
  },
  {
    label: '今日未办理',
    value: stats.todayUnfinished,
    icon: 'Warning',
    bgColor: '#fee2e2',
    iconColor: '#dc2626',
    click: () => goOrders(makeView({ scope:'biz', time:'today', status:'unfinished', mode:'operate' }))
  },
  {
    label: '今日办理中',
    value: stats.todayProcessing,
    icon: 'Timer',
    bgColor: '#fef3c7',
    iconColor: '#d97706',
    click: () => goOrders(makeView({ scope:'biz', time:'today', status:'processing', mode:'operate' }))
  },
  {
    label: '今日已完成',
    value: stats.todayCompleted,
    icon: 'CircleCheck',
    bgColor: '#dcfce7',
    iconColor: '#16a34a',
    click: () => goOrders(makeView({ scope:'biz', time:'today', status:'completed', mode:'view' }))
  },
  {
    label: '今日已取消',
    value: stats.todayCancelled,
    icon: 'CircleClose',
    bgColor: '#fee2e2',
    iconColor: '#b91c1c',
    click: () => goOrders(makeView({ scope:'biz', time:'today', status:'cancelled', mode:'view' }))
  },
  {
    label: '今日已送回',
    value: stats.todayReturned,
    icon: 'RefreshLeft',
    bgColor: '#f1f5f9',
    iconColor: '#334155',
    click: () => goOrders(makeView({ scope:'biz', time:'today', status:'returned', mode:'view' }))
  }
])

const historyCards = computed(() => [
  {
    label: '历史订单数',
    value: stats.historyOrders,
    icon: 'Files',
    bgColor: '#e0f2fe',
    iconColor: '#0284c7',
    click: () => goOrders(makeView({ scope:'order', time:'history', status:null, mode:'view' }))
  },
  {
    label: '历史业务数',
    value: stats.historyBiz,
    icon: 'Tickets',
    bgColor: '#e0e7ff',
    iconColor: '#4f46e5',
    click: () => goOrders(makeView({ scope:'biz', time:'history', status:null, mode:'view' }))
  },
  {
    label: '历史未办理',
    value: stats.historyUnfinished,
    icon: 'Warning',
    bgColor: '#fee2e2',
    iconColor: '#dc2626',
    click: () => goOrders(makeView({ scope:'biz', time:'history', status:'unfinished', mode:'operate' }))
  },
  {
    label: '历史办理中',
    value: stats.historyProcessing,
    icon: 'Timer',
    bgColor: '#fef3c7',
    iconColor: '#d97706',
    click: () => goOrders(makeView({ scope:'biz', time:'history', status:'processing', mode:'operate' }))
  },
  {
    label: '历史已完成',
    value: stats.historyCompleted,
    icon: 'CircleCheck',
    bgColor: '#dcfce7',
    iconColor: '#16a34a',
    click: () => goOrders(makeView({ scope:'biz', time:'history', status:'completed', mode:'view' }))
  },
  {
    label: '历史已取消',
    value: stats.historyCancelled,
    icon: 'CircleClose',
    bgColor: '#fee2e2',
    iconColor: '#b91c1c',
    click: () => goOrders(makeView({ scope:'biz', time:'history', status:'cancelled', mode:'view' }))
  },
  {
    label: '历史已送回',
    value: stats.historyReturned,
    icon: 'RefreshLeft',
    bgColor: '#f1f5f9',
    iconColor: '#334155',
    click: () => goOrders(makeView({ scope:'biz', time:'history', status:'returned', mode:'view' }))
  }
])

const totalCards = computed(() => [
  {
    label: '全部订单',
    value: stats.total,
    icon: 'Files',
    bgColor: '#dbeafe',
    iconColor: '#2563eb',
    click: () => goOrders(makeView({ scope:'order', time:'all', status:null, mode:'view' }))
  },
  {
    label: '全部业务',
    value: stats.totalBiz,
    icon: 'Tickets',
    bgColor: '#e0e7ff',
    iconColor: '#4f46e5',
    click: () => goOrders(makeView({ scope:'biz', time:'all', status:null, mode:'operate' }))
  },
  {
    label: '全部未办理',
    value: stats.totalUnfinished,
    icon: 'Warning',
    bgColor: '#fee2e2',
    iconColor: '#dc2626',
    click: () => goOrders(makeView({ scope:'biz', time:'all', status:'unfinished', mode:'operate' }))
  },
  {
    label: '全部办理中',
    value: stats.totalProcessing,
    icon: 'Timer',
    bgColor: '#fef3c7',
    iconColor: '#d97706',
    click: () => goOrders(makeView({ scope:'biz', time:'all', status:'processing', mode:'operate' }))
  },
  {
    label: '全部已完成',
    value: stats.totalCompleted,
    icon: 'CircleCheck',
    bgColor: '#dcfce7',
    iconColor: '#16a34a',
    click: () => goOrders(makeView({ scope:'biz', time:'all', status:'completed', mode:'view' }))
  },
  {
    label: '全部已取消',
    value: stats.totalCancelled,
    icon: 'CircleClose',
    bgColor: '#fee2e2',
    iconColor: '#b91c1c',
    click: () => goOrders(makeView({ scope:'biz', time:'all', status:'cancelled', mode:'view' }))
  },
  {
    label: '全部已送回',
    value: stats.totalReturned,
    icon: 'RefreshLeft',
    bgColor: '#f1f5f9',
    iconColor: '#334155',
    click: () => goOrders(makeView({ scope:'biz', time:'all', status:'returned', mode:'view' }))
  }
])



// =========================
// 状态
// =========================
const userInfo = ref({ name: '管理员' })
const isLoading = ref(true)
const rawData = ref([])

const stats = reactive({
  // 今天（按 created_at）
  todayNew: 0,          // 今日新增订单数（订单数）
  todayBiz: 0,          // 今日业务数（业务行）
  todayUnfinished: 0,   // 今日未办理（业务行）
  todayProcessing: 0,   // 今日办理中（业务行）
  todayCompleted: 0,    // 今日已完成（业务行）
  todayCancelled: 0,    // 今日已取消（业务行）
  todayReturned: 0,     // 今日已送回（业务行）

  // 历史（今天之前）
  historyOrders: 0,
  historyBiz: 0,
  historyUnfinished: 0,
  historyProcessing: 0,
  historyCompleted: 0,
  historyCancelled: 0,
  historyReturned: 0,

  // 全部
  total: 0,
  totalBiz: 0,
  totalUnfinished: 0,
  totalProcessing: 0,
  totalCompleted: 0,
  totalCancelled: 0,
  totalReturned: 0
})

// =========================
// 工具（注意：按你要求，今日统计按 created_at）
// =========================
const getTodayYmd = () => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

const normalizeOrderDateYmd = (o) => {
  // Orders 里 created_at 是 'YYYY-MM-DD'
  const v = o?.created_at || o?.date || o?.confirmed_at || ''
  return String(v).slice(0, 10)
}

const normalizeBizStatusCode = (row) => {
  if (!row) return 'created'

  // Orders 系统标准字段
  if (row.status) return row.status

  // 兼容老数据
  if (row.process_status) return row.process_status
  if (row.order_status) return row.order_status
  if (row.processStatus) return row.processStatus

  return 'created'
}


// =========================
// 统计模型
// =========================
const makeEmptyBucket = () => ({
  orders: 0,        // 订单数
  biz: 0,           // 业务行数
  pending: 0,       // 未办理
  processing: 0,    // 办理中
  completed: 0,     // 已完成
  cancelled: 0,     // 已取消
  returned: 0       // 已送回
})

// =========================
// 核心统计（完全对齐 orderStatus.ts）
// =========================
const calcStats = (orders) => {
  const today = getTodayYmd()

  const todayBucket = makeEmptyBucket()
  const historyBucket = makeEmptyBucket()
  const totalBucket = makeEmptyBucket()

  const routeBizRow = (bucket, bizRow) => {
    bucket.biz++

    const code = normalizeBizStatusCode(bizRow)
    const def = getStatusDef(code)
    const group = getStatusGroup(code)

    // 精确分类：取消 / 送回
    if (group === 'cancelled') {
      bucket.cancelled++
      return
    }
    if (group === 'returned') {
      bucket.returned++
      return
    }

    // processing / completed：用 value 识别（与你的状态表一致）
// cancelled / returned 优先
if (group === 'cancelled') {
  bucket.cancelled++
  return
}
if (group === 'returned') {
  bucket.returned++
  return
}

// paid / unpaid 都属于处理中 or 完成
if (group === 'paid' || group === 'unpaid' || group === 'created') {
  const v = String(def?.value || code || '')

  if (v.includes('processing')) {
    bucket.processing++
    return
  }

  if (v.includes('completed')) {
    bucket.completed++
    return
  }

  bucket.pending++
  return
}

// 兜底
bucket.pending++

  }

  orders.forEach(order => {
    const orderDate = normalizeOrderDateYmd(order)
    const isToday = orderDate === today
    const isHistory = !!orderDate && orderDate < today

    const bucket = isToday ? todayBucket : (isHistory ? historyBucket : null)

    // 订单数
    if (bucket) bucket.orders++
    totalBucket.orders++

    // 业务行统计：以 customers 为准
    const rows = Array.isArray(order?.customers) ? order.customers : []
    rows.forEach(r => {
      if (bucket) routeBizRow(bucket, r)
      routeBizRow(totalBucket, r)
    })
  })

  // ===== 回写：今日 =====
  stats.todayNew = todayBucket.orders
  stats.todayBiz = todayBucket.biz
  stats.todayUnfinished = todayBucket.pending
  stats.todayProcessing = todayBucket.processing
  stats.todayCompleted = todayBucket.completed
  stats.todayCancelled = todayBucket.cancelled
  stats.todayReturned = todayBucket.returned

  // ===== 回写：历史 =====
  stats.historyOrders = historyBucket.orders
  stats.historyBiz = historyBucket.biz
  stats.historyUnfinished = historyBucket.pending
  stats.historyProcessing = historyBucket.processing
  stats.historyCompleted = historyBucket.completed
  stats.historyCancelled = historyBucket.cancelled
  stats.historyReturned = historyBucket.returned

  // ===== 回写：全部 =====
  stats.total = totalBucket.orders
  stats.totalBiz = totalBucket.biz
  stats.totalUnfinished = totalBucket.pending
  stats.totalProcessing = totalBucket.processing
  stats.totalCompleted = totalBucket.completed
  stats.totalCancelled = totalBucket.cancelled
  stats.totalReturned = totalBucket.returned
}

// =========================
// 跳转 Orders：用 query 触发筛选（你 Orders.vue 已支持 dateRange & processStatus）
// =========================
const goOrdersWithFilter = (scope, status) => {
  const today = getTodayYmd()
  const q = {}

  // 时间范围
  if (scope === 'today') {
    q.dateRange = `${today},${today}`
  }

  if (scope === 'history') {
    q.before = today
  }

  // 状态
  if (status) {
    q.processStatus = status
  }

  // 🔥 新增：告诉 Orders 页面要高亮
  q.highlightStatus = status || ''

  router.push({
    name: 'business.orders',
    query: q
  })
}



// =========================
// 卡片（先展示你现有这行：后续第二行第三行你要我再加，我按同一结构补）
// =========================
const statCards = computed(() => [
  {
    label: '今日新增订单',
    value: stats.todayNew,
    icon: 'CirclePlus',
    bgColor: 'linear-gradient(135deg, #e0f2fe, #bae6fd)',
    iconColor: '#0284c7',
    click: () => goOrdersWithFilter({ scope: 'today' })
  },
  {
    label: '今日业务数',
    value: stats.todayBiz,
    icon: 'Tickets',
    bgColor: 'linear-gradient(135deg, #ede9fe, #ddd6fe)',
    iconColor: '#6d28d9',
    click: () => goOrdersWithFilter({ scope: 'today' })
  },
  {
    label: '今日未办理',
    value: stats.todayUnfinished,
    icon: 'WarningFilled',
    bgColor: 'linear-gradient(135deg, #fee2e2, #fecaca)',
    iconColor: '#dc2626',
    click: () => goOrdersWithFilter({ scope: 'today', processStatus: 'unfinished' })
  },
  {
    label: '今日办理中',
    value: stats.todayProcessing,
    icon: 'Timer',
    bgColor: 'linear-gradient(135deg, #fef3c7, #fde68a)',
    iconColor: '#d97706',
    click: () => goOrdersWithFilter({ scope: 'today', processStatus: 'processing' })
  },
  {
    label: '今日已完成',
    value: stats.todayCompleted,
    icon: 'CircleCheckFilled',
    bgColor: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
    iconColor: '#16a34a',
    click: () => goOrdersWithFilter({ scope: 'today', processStatus: 'completed' })
  },
  {
    label: '今日已取消',
    value: stats.todayCancelled,
    icon: 'CircleCloseFilled',
    bgColor: 'linear-gradient(135deg, #fee2e2, #fecaca)',
    iconColor: '#b91c1c',
    click: () => goOrdersWithFilter({ scope: 'today' })
  }
  // 你要“今日已送回”也显示：下一张卡加 stats.todayReturned 即可
])

// =========================
// 常用功能
// =========================
const quickActions = [
  { text: '新建订单', icon: 'CirclePlus', color: '#2563eb', route: 'business.orders.create' },
  { text: '代理管理', icon: 'UserFilled', color: '#7c3aed', route: 'agent.index' },
  { text: '文件柜', icon: 'FolderChecked', color: '#ea580c', route: 'business.files' },
  { text: '系统配置', icon: 'Management', color: '#059669', route: 'system.dictionary' }
]

// =========================
// 最近订单
// =========================
const recentOrders = computed(() => {
  return [...rawData.value]
    .sort((a, b) => normalizeOrderDateYmd(b).localeCompare(normalizeOrderDateYmd(a)))
    .slice(0, 8)
    .map(o => ({
      code: o.code || o.order_no || '-',
      agent: [o.agent_company, o.agent_contact].filter(Boolean).join(' - '),
      businessType: (o.customers || [])[0]?.businessType || '-',
      status: 'processing',
      created_at: normalizeOrderDateYmd(o)
    }))
})

// =========================
// 业务分布（按业务行统计）
// =========================
const businessTypeStats = computed(() => {
  const map = {}
  rawData.value.forEach(o => {
    ;(o.customers || []).forEach(c => {
      const t = c.businessType || '未知业务'
      map[t] = (map[t] || 0) + 1
    })
  })
  return map
})

// =========================
// 初始化
// =========================
const initDashboard = () => {
  isLoading.value = true

  try {
    let all = db.getRaw('ORDERS') || []

    // ✅ 兼容你现在真实存储位置
    if (!all.length) {
      try {
        const legacy = JSON.parse(
          localStorage.getItem('BUSINESS_ORDERS_DATA') || '[]'
        )
        if (Array.isArray(legacy) && legacy.length) {
          all = legacy

          // 🔥 自动迁移进系统标准存储
          db.saveRaw('ORDERS', legacy)
          console.log('✅ Dashboard: 已迁移 BUSINESS_ORDERS_DATA → ORDERS')
        }
      } catch (e) {
        console.warn('Dashboard legacy data parse failed', e)
      }
    }

    const valid = all.filter(o => o.deleted === false)
    rawData.value = valid
    calcStats(valid)
  } finally {
    setTimeout(() => {
      isLoading.value = false
    }, 300)
  }
}


// =========================
// 状态样式（用于最近订单表）
// =========================
const getStatusType = (s) =>
  ({
    created: 'info',
    processing: 'warning',
    completed: 'success',
    '办理中': 'warning',
    '已完成': 'success'
  }[s] || 'info')

const getStatusText = (s) =>
  ({
    created: '已录入',
    processing: '办理中',
    completed: '已完成'
  }[s] || s)

onMounted(initDashboard)
const stopListen = listenSystemEvent((e) => {
  if (
    e.type === 'order-restored' ||
    e.type === 'order-purged'
  ) {
    initDashboard()
  }
})

onUnmounted?.(() => stopListen && stopListen())
</script>

<style scoped>
/* Dashboard 主体样式，滚动权交给 TablePageLayout */
.dashboard-page {
  padding: 8px 0 0 0;
  background-color: transparent;
}

.highlight {
  color: #38bdf8;
  font-weight: 700;
}

/* Stats Cards */
.stats-cards {
  margin-bottom: 24px;
}
.stat-card {
  border: none;
  border-radius: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 20px -5px rgba(0, 0, 0, 0.1);
}
.stat-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.stat-label {
  color: #64748b;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
}
.stat-value {
  font-size: 26px;
  font-weight: 800;
  color: #0f172a;
}
.stat-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Sections */
.dashboard-section {
  border-radius: 16px;
  border: 1px solid #e2e8f0;
}
.card-header h3 {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}
.mb-20 {
  margin-bottom: 20px;
}

/* Quick Actions Grid */
.actions-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid #f1f5f9;
  cursor: pointer;
  transition: all 0.2s;
}
.action-item:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  transform: scale(1.02);
}
.action-icon-wrap {
  margin-bottom: 12px;
}
.action-text {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
}

/* Business Dist */
.business-dist {
  padding: 5px 0;
}
.dist-item {
  margin-bottom: 15px;
}
.dist-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 13px;
}
.dist-label {
  color: #475569;
  font-weight: 500;
}
.dist-val {
  color: #0f172a;
  font-weight: 700;
}

/* Table Styling */
.order-code {
  font-family: 'Monaco', monospace;
  color: #2563eb;
  font-weight: 600;
}
:deep(.standard-table th) {
  background-color: #f8fafc !important;
  color: #475569;
  font-weight: 700;
  text-transform: uppercase;
  font-size: 12px;
}

/* Tips Card */
.tip-card {
  background: linear-gradient(to bottom right, #eff6ff, #ffffff);
  text-align: center;
}
.tip-content {
  padding: 10px;
}
.tip-content h4 {
  margin: 12px 0 8px;
  color: #1e293b;
}
.tip-content p {
  font-size: 13px;
  color: #64748b;
  line-height: 1.6;
}

/* Responsive */
@media (max-width: 768px) {
  .actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
.stats-title {
  font-size: 15px;
  font-weight: 700;
  color: #1e293b;
  margin: 16px 0 8px;
}

/* =========================
   Stats Panel（仪表盘核心风格）
   ========================= */
.stats-panel {
  display: flex;
  flex-direction: column;
  gap: 0; /* 块之间不留空隙，由分割线控制层级 */
  margin-bottom: 24px;

  /* 总仪表盘外框 */
  background: linear-gradient(to bottom, #f8fafc, #ffffff);
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  overflow: hidden; /* 保证子块不溢出圆角 */
}



/* 每一块统计区 */
.stats-block {
  background: transparent; /* 用外框背景 */
  border: none;           /* 去掉单独卡片边框 */
  border-bottom: 1px solid #e5e7eb; /* 行分割线 */
  padding: 16px 18px 18px;
}


.stats-block:last-child {
  border-bottom: none;
}


/* 标题行 */
.stats-block-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.stats-block-header h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: 0.5px;
}

/* 左侧彩色点 */
.stats-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.stats-dot.today {
  background: #3b82f6;
}
.stats-dot.history {
  background: #6366f1;
}
.stats-dot.total {
  background: #0f172a;
}

/* 卡片列强制紧凑 */
.stat-col {
  display: flex;
}

/* 卡片本体 */
.stat-card {
  flex: 1;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  background: white;
  transition: all 0.25s ease;
}

/* 可点击暗示 */
.stat-card.clickable {
  cursor: pointer;
}
.stat-card.clickable:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 18px 30px -10px rgba(0, 0, 0, 0.15);
  border-color: #93c5fd;
}

/* 内容布局 */
.stat-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 数字更“仪表盘风格” */
.stat-value {
  font-size: 28px;
  font-weight: 900;
  color: #020617;
  line-height: 1;
}

/* 标签 */
.stat-label {
  font-size: 13px;
  font-weight: 700;
  color: #475569;
  margin-bottom: 8px;
  letter-spacing: 0.3px;
}

/* 图标块更立体 */
.stat-icon {
  width: 54px;
  height: 54px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.6),
              0 8px 16px rgba(0, 0, 0, 0.15);
}

/* =========================
   最近订单 & 右侧卡片风格统一
   ========================= */
.dashboard-section {
  background: white;
  border-radius: 18px;
  border: 1px solid #e5e7eb;
}

/* 表格更“系统风” */
:deep(.standard-table) {
  font-size: 13px;
}
:deep(.standard-table tr:hover td) {
  background-color: #eff6ff !important;
}

/* 操作提示卡更像系统提示框 */
.tip-card {
  background: linear-gradient(135deg, #eff6ff, #ffffff);
  border-left: 4px solid #3b82f6;
}

/* 业务分布进度条更细更专业 */
:deep(.el-progress-bar__outer) {
  background-color: #e5e7eb;
}




</style>
