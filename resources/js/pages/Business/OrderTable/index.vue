<template>
  <div class="table-container">
    <!-- 表格主体 -->
    <TableBody
      ref="tableBodyRef"
      :data="displayData"
      :module="module"
      :visible-columns="visibleColumns"
      :options="options"
      :date-shortcuts="dateShortcuts"
      :column-visibility="columnVisibility"
      :table-height="tableHeight"
      @row-contextmenu="handleRowContextMenu"
      @row-click="handleRowClick"
      @remove-row="handleRemoveRow"
      @open-files="handleOpenFiles"
      @customer-info-change="handleCustomerInfoChange"
      @fee-change="handleFeeChange"
      @show-column-menu="handleShowColumnMenu"
    />

    <!-- 表格底部合计行 -->
    <TableFooter
      :visible-columns="visibleColumns"
      :display-data="displayData"
      :total-amount="totalAmount"
    />

    <!-- 行右键菜单 -->
    <teleport to="body">
      <RowContextMenu
        :visible="contextMenuVisible"
        :position="contextMenuPosition"
        @update:visible="val => (contextMenuVisible = val)"
        @add-business="handleAddBusinessToCurrent"
        @hide-row="handleHideRow"
        @paste-data="handlePasteRows"
        @close="closeContextMenu"
      />
    </teleport>

    <!-- 列右键菜单 -->
    <ColumnContextMenu
      :visible="columnMenuVisible"
      :position="columnMenuPosition"
      :column="currentColumn"
      @update:visible="val => (columnMenuVisible = val)"
      @hide-column="handleHideCurrentColumn"
      @show-all-columns="handleShowAllColumns"
      @show-hidden-rows="handleShowAllRows"
      @close="closeColumnMenu"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, watch, onUnmounted, toRef } from 'vue'
import { ElMessage } from 'element-plus'

import TableBody from './components/TableBody.vue'
import TableFooter from './components/TableFooter.vue'
import RowContextMenu from './components/RowContextMenu.vue'
import ColumnContextMenu from './components/ColumnContextMenu.vue'

import { useColumns } from './composables/useColumns'
import { useTableData } from './composables/useTableData'
import { useRowActions } from './composables/useRowActions'
import { db } from '@/utils/storage'
import type { ModuleType, TableRow } from './types/table'

/* ===================== props / emits ===================== */
const props = defineProps<{
  data: any[]
  orderNo: string
  module: ModuleType
}>()

const emit = defineEmits<{
  (e: 'remove', row: any, displayIndex: number): void
  (e: 'open-files', data: any): void
  (e: 'update:data', data: any[]): void
  (e: 'add-business', customerId: string): void
  (e: 'paste-data', text: string): void
  (e: 'hide-row', rowId: string): void
}>()

/* ===================== refs ===================== */
const tableBodyRef = ref()
const activeRow = ref<any>(null)

// 稳定客户选中
const activeCustomerId = ref<string | null>(null)

// 唯一数据源引用
const dataRef = toRef(props, 'data')
const orderNoRef = toRef(props, 'orderNo')
const moduleRef = toRef(props, 'module')

/* ===================== 表格高度 ===================== */
const tableHeight = ref('100%')

/* ===================== 配置选项 ===================== */
const options = reactive({
  nationalities: [] as string[],
  businessTypes: [] as string[],
  orderStatuses: [] as any[],
  departments: [] as any[]
})

/* ===================== 日期快捷 ===================== */
const dateShortcuts = [
  { text: '今天', value: new Date() },
  {
    text: '昨天',
    value: () => {
      const d = new Date()
      d.setTime(d.getTime() - 3600 * 1000 * 24)
      return d
    }
  },
  {
    text: '最近一周',
    value: () => {
      const d = new Date()
      d.setTime(d.getTime() - 3600 * 1000 * 24 * 7)
      return d
    }
  }
]

/* ===================== composables ===================== */
// 🔥 核心修复：用 toRef 保证列可见性变化触发渲染
const {
  visibleColumns,
  columnVisibility,
  initColumnVisibility,
  hideColumn,
  showAllColumns
} = useColumns(moduleRef)

const {
  displayData,
  totalAmount,
  hiddenRows,
  initHiddenRows,
  showAllRows,
  convertToNestedStructure,
  convertToFlatStructure,
  insertBusinessForCustomer
} = useTableData(dataRef, orderNoRef)

const {
  contextMenuVisible,
  contextMenuPosition,
  contextMenuRow,
  showRowContextMenu,
  handleRemoveRow: rowHandleRemove,
  handleOpenFiles: rowHandleOpenFiles,
  closeContextMenu
} = useRowActions(emit)

/* ===================== 列右键菜单 ===================== */
const columnMenuVisible = ref(false)
const columnMenuPosition = ref({ x: 0, y: 0 })
const currentColumn = ref<any>(null)

/* ===================== 核心同步 ===================== */
const syncTableToSource = () => {
  const nested = convertToNestedStructure(displayData.value)
  const flat = convertToFlatStructure(nested)
  emit('update:data', flat)
}

/* ===================== 对外暴露 ===================== */
const updateAgentContact = (agentContact: string) => {
  if (!dataRef.value || !dataRef.value.length) return

  const nested = convertToNestedStructure(dataRef.value)
  nested.forEach(customer => {
    customer.agent_contact = agentContact
  })

  const flat = convertToFlatStructure(nested)
  emit('update:data', flat)
}

const addBusinessToActiveCustomer = () => {
  const customerId = activeCustomerId.value
  if (!customerId) {
    ElMessage.warning('请先在表格中选择一个客户')
    return
  }

  const flat = insertBusinessForCustomer(customerId)
  emit('update:data', Array.isArray(flat) ? flat : dataRef.value)
}

defineExpose({
  updateAgentContact,
  syncTableToSource,
  addBusinessToActiveCustomer
})

/* ===================== 初始化 ===================== */
const init = () => {
  loadOptions()
  calculateTableHeight()
  initColumnVisibility()
  initHiddenRows()
}

const loadOptions = () => {
  const configs = db.getConfigs()
  options.nationalities = configs.nationalities || []
  options.businessTypes = configs.businessTypes || []
  options.orderStatuses = configs.orderStatuses || []
  options.departments = configs.departments || []
}

const calculateTableHeight = () => {
  nextTick(() => {
    const container = document.querySelector('.table-main-area')
    if (!container) return
    const rect = container.getBoundingClientRect()
    tableHeight.value = Math.max(rect.height - 60, 200)
  })
}

/* ===================== 行选中 ===================== */
const handleRowClick = (row: TableRow) => {
  activeCustomerId.value = row.customer_id
}

const handleRowContextMenu = (row, column, event) => {
  activeRow.value = row
  showRowContextMenu(row, column, event)
}

/* ===================== 事件处理 ===================== */
const handleRemoveRow = (row: any, displayIndex: number) => {
  syncTableToSource()
  rowHandleRemove(row, displayIndex)
}

const handleOpenFiles = (row: any) => {
  rowHandleOpenFiles(row)
}

/* ===================== 数据变更 ===================== */
const handleCustomerInfoChange = (row: any, field: string, value: any) => {
  const nested = convertToNestedStructure(dataRef.value)

  const customer = nested.find(c => c.customer_id === row.customer_id)
  if (!customer) return

  const business = customer.businesses.find(b => b.id === row.id)
  if (!business) return

  const customerFields = [
    'name',
    'passport',
    'alias_no',
    'nationality',
    'passport_expiry',
    'entry_date',
    'visa_expiry',
    'has_work_permit',
    'agent_contact'
  ]

  const businessFields = ['business_type', 'row_remark', 'is_settled']

  const feeFields = [
    'fee_visa',
    'fee_work',
    'fee_other',
    'fine_entry',
    'fine_overdue',
    'fine_work',
    'special_fee'
  ]

  const upstreamFields = [
    'upstream_name',
    'upstream_time',
    'upstream_fee',
    'upstream_is_settled',
    'process_status',
    'upstream_remark',
    'business_end_time',
    'business_return_time'
  ]

  if (customerFields.includes(field)) {
    customer[field] = value
  } else if (businessFields.includes(field)) {
    business[field] = value
  } else if (feeFields.includes(field)) {
    business.business_fees[field] =
      value === '' || value === null ? null : Number(value)
  } else if (upstreamFields.includes(field)) {
    business[field] =
      field === 'upstream_fee'
        ? value === '' || value === null
          ? null
          : Number(value)
        : value
  } else if (field === 'actual_fee') {
    customer.customer_fees.actual_fee =
      value === '' || value === null ? null : Number(value)
  }

  const flat = convertToFlatStructure(nested)
  emit('update:data', flat)
}

const handleFeeChange = (row: any, field: string, value: any) => {
  handleCustomerInfoChange(row, field, value)
}

/* ===================== 列菜单 ===================== */
const handleShowColumnMenu = (column: any, event: MouseEvent) => {
  event.preventDefault()
  currentColumn.value = column
  columnMenuPosition.value = { x: event.clientX, y: event.clientY }
  columnMenuVisible.value = true
}

const handleHideCurrentColumn = () => {
  if (currentColumn.value?.columnKey) {
    hideColumn(currentColumn.value.columnKey, currentColumn.value.label)
    columnMenuVisible.value = false
  }
}

const handleShowAllColumns = () => {
  showAllColumns()
  columnMenuVisible.value = false
}

const closeColumnMenu = () => {
  columnMenuVisible.value = false
}

/* ===================== 行操作 ===================== */
const handleAddBusinessToCurrent = () => {
  addBusinessToActiveCustomer()
  contextMenuVisible.value = false
}

const handleHideRow = () => {
  if (!contextMenuRow.value) return
  emit('hide-row', contextMenuRow.value.id)
  contextMenuVisible.value = false
  ElMessage.success('已隐藏此行（可在列头右键菜单中恢复）')
}

const handleShowAllRows = () => {
  showAllRows()
  ElMessage.success('已显示所有隐藏的行')
}

const handlePasteRows = () => {
  contextMenuVisible.value = false

  navigator.clipboard
    .readText()
    .then(text => {
      if (!text.trim()) return
      syncTableToSource()
      emit('paste-data', text)
    })
    .catch(() => {
      ElMessage.warning('无法读取剪贴板内容')
    })
}

/* ===================== 生命周期 ===================== */
onMounted(() => {
  init()
  window.addEventListener('resize', calculateTableHeight)
})

watch(
  () => props.data,
  () => {
    nextTick(calculateTableHeight)
  },
  { deep: true }
)

onUnmounted(() => {
  window.removeEventListener('resize', calculateTableHeight)
})
</script>
<style scoped>
.table-container {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
}

:deep(.header-group-passport) {
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%) !important;
}

:deep(.header-group-business) {
  background: linear-gradient(135deg, #fef9c3 0%, #fde047 100%) !important;
}

:deep(.header-group-fee) {
  background: linear-gradient(135deg, #ffedd5 0%, #fdba74 100%) !important;
}

:deep(.header-group-upstream) {
  background: linear-gradient(135deg, #dbeafe 0%, #93c5fd 100%) !important;
}

:deep(.el-table) {
  --el-table-border-color: #e5e7eb;
  --el-table-header-bg-color: #f8fafc;
  --el-table-row-hover-bg-color: #f1f5f9;
  flex: 1;
  border: 1px solid #e5e7eb !important;
  border-bottom: none !important;
}

:deep(.custom-header-cell) {
  background-color: #f8fafc !important;
  color: #334155 !important;
  font-weight: 700 !important;
  text-align: center !important;
  font-size: 11px !important;
  padding: 8px 2px !important;
  border-bottom: 2px solid #e5e7eb !important;
  white-space: nowrap !important;
  line-height: 1.2 !important;
}

:deep(.custom-content-cell) {
  padding: 6px 4px !important;
  font-size: 12px !important;
  text-align: center !important;
  vertical-align: middle !important;
  min-height: 42px !important;
  box-sizing: border-box !important;
}

:deep(.even-row) {
  background-color: #fafafa !important;
}

:deep(.odd-row) {
  background-color: #ffffff !important;
}

:deep(.el-table__row:hover) {
  background-color: #f1f5f9 !important;
}

</style>