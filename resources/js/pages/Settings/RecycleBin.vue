<template>
  <TablePageLayout>
    <!-- ================= 标题 ================= -->
    <template #title>系统回收站</template>
    <template #subtitle>统一管理已删除的数据，支持恢复与彻底清除</template>

    <!-- ================= 操作区 ================= -->
<template #actions>
  <el-button :icon="Refresh" @click="reload">刷新</el-button>

  <el-button
    type="success"
    plain
    :icon="Refresh"
    :disabled="!selected.length"
    @click="confirmBatchRestore"
  >
    批量恢复
  </el-button>

  <el-button
    type="danger"
    plain
    :icon="Delete"
    :disabled="!selected.length"
    @click="confirmBatchDelete"
  >
    批量清空
  </el-button>
</template>


    <!-- ================= 搜索区 ================= -->
    <template #search>
      <el-card shadow="never" class="section-card search-card">
        <el-form :model="filters" inline>
          <el-form-item label="模块">
            <el-select
              v-model="filters.module"
              clearable
              placeholder="全部模块"
              style="width: 160px"
            >
              <el-option label="订单" value="order" />
              <el-option label="代理" value="agent" />
              <el-option label="业务" value="certificate" />
              <el-option label="文件" value="file" />
            </el-select>
          </el-form-item>

          <el-form-item label="操作人">
            <el-input
              v-model="filters.deletedBy"
              placeholder="输入操作人"
              clearable
              style="width: 160px"
            />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" :icon="Search">查询</el-button>
            <el-button :icon="Refresh" @click="resetFilters">
              重置
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </template>

    <!-- ================= 表格区 ================= -->
    <template #table>
      <el-table
        :data="filteredList"
        border
        stripe
        highlight-current-row
        height="100%"
        class="order-expand-table"
        @current-change="handleCurrentChange"
        @selection-change="selected = $event"
      >
        <el-table-column
          type="selection"
          width="50"
          align="center"
        />

        <el-table-column
          label="模块"
          width="120"
          align="center"
        >
          <template #default="{ row }">
            <el-tag
              :type="getModuleTagType(row.module)"
              effect="dark"
              size="small"
            >
              {{ getModuleLabel(row.module) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="业务信息" min-width="260">
          <template #default="{ row }">
            <div class="biz-title">
              <div class="biz-main">
                {{ getDisplayInfo(row).title }}
              </div>
              <div class="biz-sub">
                {{ getDisplayInfo(row).desc }}
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column
          prop="sourceId"
          label="原始ID"
          min-width="180"
          show-overflow-tooltip
        />

        <el-table-column label="删除时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.deletedAt) }}
          </template>
        </el-table-column>

        <el-table-column
          prop="deletedBy"
          label="操作人"
          width="140"
        />

        <el-table-column
          prop="reason"
          label="删除原因"
          min-width="200"
          show-overflow-tooltip
        />

        <el-table-column
          label="操作"
          width="180"
          fixed="right"
          align="center"
        >
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              @click="openPreview(row)"
            >
              预览
            </el-button>
            <el-button
              link
              type="success"
              @click="handleRestore(row)"
            >
              恢复
            </el-button>
            <el-button
              link
              type="danger"
              @click="confirmDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </template>

    <!-- ================= 抽屉 ================= -->
    <el-drawer
      v-model="previewVisible"
      title="删除快照预览"
      size="45%"
      destroy-on-close
    >
      <div class="preview-meta">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="模块">
            {{ getModuleLabel(currentPreview?.module) }}
          </el-descriptions-item>
          <el-descriptions-item label="原始ID">
            {{ currentPreview?.sourceId }}
          </el-descriptions-item>
          <el-descriptions-item label="操作人">
            {{ currentPreview?.deletedBy }}
          </el-descriptions-item>
          <el-descriptions-item label="删除时间">
            {{ formatTime(currentPreview?.deletedAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="删除原因" :span="2">
            {{ currentPreview?.reason || '无' }}
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <div class="preview-content">
        <pre>{{ formattedSnapshot }}</pre>
      </div>

      <div class="drawer-footer">
        <el-button @click="previewVisible = false">
          关闭
        </el-button>
        <el-button
          type="success"
          @click="handleRestore(currentPreview)"
        >
          恢复数据
        </el-button>
        <el-button
          type="danger"
          plain
          @click="confirmDelete(currentPreview)"
        >
          彻底删除
        </el-button>
      </div>
    </el-drawer>
  </TablePageLayout>
</template>


<script setup>

import { restoreRecycleRecord, softHardDelete } from '@/domain/recycleService'
import { listRecycleBin } from '@/domain/recycleBin'
import { setRestoreTarget } from '@/utils/restoreNavigator'
import { ref, reactive, computed, onMounted } from 'vue'
import { Search, Refresh, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import TablePageLayout from '@/layouts/TablePageLayout.vue'
import { useRouter } from 'vue-router'
import { emitSystemEvent } from '@/utils/systemBus'

const router = useRouter()

// =======================
// 状态
// =======================
const list = ref([])
const selected = ref([])

const filters = reactive({
  module: '',
  deletedBy: ''
})

const previewVisible = ref(false)
const currentPreview = ref(null)

// =======================
// 数据加载
// =======================
const reload = () => {
  // ✅ 你的 recycleBin.ts 提供的是 listRecycleBin
  list.value = listRecycleBin() || []
}
onMounted(reload)

// =======================
// 计算属性
// =======================
const filteredList = computed(() => {
  return list.value.filter(r => {
    const moduleMatch = filters.module ? r.module === filters.module : true
    const userMatch = filters.deletedBy
      ? (r.deletedBy || '').toLowerCase().includes(filters.deletedBy.toLowerCase())
      : true
    return moduleMatch && userMatch
  })
})

const formattedSnapshot = computed(() => {
  if (!currentPreview.value) return ''
  return JSON.stringify(currentPreview.value.snapshot, null, 2)
})

// =======================
// 交互逻辑
// =======================
const resetFilters = () => {
  filters.module = ''
  filters.deletedBy = ''
  reload()
}

const openPreview = (row) => {
  currentPreview.value = row
  previewVisible.value = true
}

/**
 * ✅ 专业恢复：页面不再管 localStorage key / db 细节
 * 统一交给 domain/recycleService 的 restoreRecycleRecord
 */
const handleRestore = (row) => {
  console.log('🟢 CLICK RESTORE', row)

  if (!row) return

  ElMessageBox.confirm(
    '确定要恢复这条数据吗？它将回到原模块中。',
    '恢复确认',
    { type: 'warning' }
  ).then(() => {
    try {
      const ok = restoreRecycleRecord(row)

      if (!ok) {
        return ElMessage.error('恢复失败：写回业务系统失败')
      }

      ElMessage.success('数据已成功恢复')
      emitSystemEvent('order-restored', { id: row.sourceId })
      reload()
      previewVisible.value = false

      // ================= 跳转定位 =================
      if (row.module === 'agent') {
        router.push({
          name: 'agent.index',
          query: { restore: row.sourceId }
        })
      }

      if (row.module === 'order') {
        setRestoreTarget({ module: 'order', id: row.sourceId })
        router.push({
          name: 'business.orders',
          query: { restore: row.sourceId }
        })
      }

      if (row.module === 'certificate') {
        router.push({ name: 'certificate.index' })
      }

      // 🟢 文件恢复 → 跳回文件中心并高亮
      if (row.module === 'file') {
        router.push({
          name: 'business.files',
          query: {
            restoredFileId: row.sourceId
          }
        })
      }
    } catch (e) {
      console.error(e)
      ElMessage.error(e.message || '恢复异常')
    }
  }).catch(() => {})
}



const confirmDelete = (row) => {
  if (!row) return
  ElMessageBox.confirm(
    '此操作不可恢复，确定要彻底删除吗？',
    '危险操作',
    { type: 'error' }
  ).then(() => {
softHardDelete(row.id)
emitSystemEvent('order-purged', { id: row.sourceId })
ElMessage.success('已彻底删除')
reload()
    previewVisible.value = false
  }).catch(() => {})
}

const confirmBatchDelete = () => {
  if (!selected.value.length) return

  ElMessageBox.confirm(
    `确定要彻底删除选中的 ${selected.value.length} 条记录吗？`,
    '批量清空确认',
    { type: 'error' }
  ).then(() => {
    selected.value.forEach(r => softHardDelete(r.id))
    ElMessage.success('批量删除完成')
    reload()
  }).catch(() => {})
}

// =======================
// 工具
// =======================

const getDisplayInfo = (record) => {
  const s = record.snapshot || {}

// ====== 企业正式版代理显示（新模型）======
const company = s.agent_company_name || ''
const contact = s.agent_contact_name || ''

const agentDisplay =
  [company, contact].filter(Boolean).join(' - ') || '未知代理'


  // ====== 客户数量兜底 ======
  const customerCount =
    Array.isArray(s.customers)
      ? s.customers.length
      : Array.isArray(s.customer_list)
      ? s.customer_list.length
      : 0

  switch (record.module) {
    case 'order':
      return {
        title: s.code || s.order_no || `订单 ${record.sourceId}`,
        desc: `${agentDisplay} · ${customerCount} 人`
      }

    case 'agent':
      return {
        title: s.name || s.company_name || `代理 ${record.sourceId}`,
        desc: `${(s.contacts?.length || 0)} 个联系人`
      }

    case 'certificate':
      return {
        title: s.name || s.passport || `业务 ${record.sourceId}`,
        desc: s.business_type || s.type || ''
      }

    case 'file':
      return {
        title: s.filename || `文件 ${record.sourceId}`,
        desc: s.size ? `${(s.size / 1024).toFixed(1)} KB` : ''
      }

    default:
      return { title: record.sourceId, desc: '' }
  }
}



const getModuleLabel = (module) => {
  switch (module) {
    case 'order': return '订单'
    case 'agent': return '代理'
    case 'certificate': return '业务'
    case 'file': return '文件'
    default: return '未知'
  }
}

const getModuleTagType = (module) => {
  switch (module) {
    case 'order': return 'success'
    case 'agent': return 'warning'
    case 'certificate': return 'info'
    case 'file': return 'danger'
    default: return 'default'
  }
}

const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString()
}

const handleCurrentChange = (_row) => {}

/**
 * =======================
 * 批量恢复（专业级）
 * =======================
 */
const confirmBatchRestore = () => {
  if (!selected.value.length) return

  const count = selected.value.length
  const modules = [
    ...new Set(selected.value.map(r => r.module))
  ].map(getModuleLabel)

  ElMessageBox.confirm(
    `确定要恢复选中的 ${count} 条记录吗？\n涉及模块：${modules.join('、')}`,
    '批量恢复确认',
    { type: 'warning' }
  ).then(() => {
    let success = 0
    let failed = 0

    selected.value.forEach(r => {
      try {
        const ok = restoreRecycleRecord(r)
        ok ? success++ : failed++
      } catch (e) {
        console.error('Batch restore error:', e)
        failed++
      }
    })

    if (failed === 0) {
      ElMessage.success(`已成功恢复 ${success} 条数据`)
    } else {
      ElMessage.warning(
        `恢复完成：成功 ${success} 条，失败 ${failed} 条`
      )
    }

    // 自动刷新回收站
    reload()

    // 如果只恢复了一条订单 → 自动跳转定位
    if (
      success === 1 &&
      selected.value[0]?.module === 'order'
    ) {
      const id = selected.value[0].sourceId

      setRestoreTarget({ module: 'order', id })
      router.push({
        name: 'business.orders',
        query: { restore: id }
      })
    }
	// 如果只恢复了一条文件 → 自动跳转定位
if (
  success === 1 &&
  selected.value[0]?.module === 'file'
) {
  const id = selected.value[0].sourceId

  router.push({
    name: 'business.files',
    query: { restoredFileId: id }
  })
}


    selected.value = []
  }).catch(() => {})
}


</script>

<style scoped>
/* =========================
   内滚模式宽度铺满修复
   ========================= */
:deep(.content-inner--fixed) {
  width: 100% !important;
  max-width: 100% !important;
}

.section-card {
  width: 100%;
}

/* =========================
   表格交互增强
   ========================= */

/* hover 高亮 */
:deep(.el-table__body tr:hover > td) {
  background-color: rgba(37, 99, 235, 0.08) !important;
}

/* 当前行焦点态 */
:deep(.el-table__body tr.current-row > td) {
  background-color: rgba(37, 99, 235, 0.14) !important;
}

/* 左侧焦点条 */
:deep(.el-table__body tr.current-row > td:first-child) {
  box-shadow: inset 4px 0 0 rgba(37, 99, 235, 0.9);
}

/* 表头层级与背景 */
:deep(.el-table__header-wrapper) {
  position: sticky;
  top: 0;
  z-index: 2;
  background: #fff;
}

:deep(.el-table__header th) {
  background: #f8fafc !important;
}

/* 滚动条可视增强 */
:deep(.el-table__body-wrapper .el-scrollbar__thumb) {
  background: rgba(100, 116, 139, 0.6) !important;
  border-radius: 6px;
}
:deep(.el-table__body-wrapper .el-scrollbar__thumb:hover) {
  background: rgba(100, 116, 139, 0.9) !important;
}
:deep(.el-table__body-wrapper .el-scrollbar__bar.is-vertical) {
  width: 8px;
}

.section-card {
  border-top: none;
  margin-bottom: 20px;
}

/* 预览抽屉 */
.preview-meta {
  margin-bottom: 16px;
}

.preview-content {
  background: #0f172a;
  color: #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  max-height: calc(100vh - 300px);
  overflow: auto;
  font-size: 12px;
}

.preview-content pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
}

.biz-title {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}

.biz-main {
  font-weight: 600;
  color: #0f172a;
}

.biz-sub {
  font-size: 12px;
  color: #64748b;
}


</style>
