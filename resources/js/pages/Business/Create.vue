<template>
  <el-config-provider :locale="zhCn">
    <div class="create-order-page">
      <PageLayout :fixed-body="true">
        <template #title>
          <div class="title-row">
            <span class="title-text">
              {{ isEditMode ? '编辑订单' : '业务订单录入' }}
            </span>
            
            <span
              class="title-badge"
              :class="badgeInfo.type"
            >
              {{ badgeInfo.text }}
              <template v-if="badgeInfo.link">
                <el-link
                  type="primary"
                  :underline="false"
                  @click="badgeInfo.action"
                  :title="badgeInfo.type === 'history'
                    ? '点击查看生成的新订单'
                    : '点击查看来源订单'"
                >
                  {{ badgeInfo.link }}
                </el-link>
              </template>
            </span>
          </div>
        </template>
        
        <template #subtitle>
          <span v-if="isEditMode" style="color:#f59e0b;font-weight:700;">
            ⚠ 正在编辑订单（保存将覆盖原数据）
          </span>
          <span v-else>
            管理代理订单、客户明细及证件办理进度
          </span>
        </template>
        
        <template #actions>
          <el-button
            type="info"
            plain
            :icon="Plus"
            @click="handleCreateNew"
          >
            新建订单
          </el-button>
          <el-button
            v-if="canShowConvertBtn"
            type="danger"
            @click="handleConvertOrder"
          >
            转为新订单
          </el-button>
          
          <el-button
            v-if="isEditMode"
            type="danger"
            plain
            :icon="Delete"
            @click="handleDeleteOrder"
          >
            删除订单
          </el-button>
          
          <el-dropdown @command="handleExport">
            <el-button :icon="Download" plain>导出数据</el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="all">导出：全部显示模块 (全字段)</el-dropdown-item>
                <el-dropdown-item command="confirm">导出：确认业务办理模块 (业务相关)</el-dropdown-item>
                <el-dropdown-item command="process">导出：办理业务模块 (进度相关)</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          
          <el-upload
            :show-file-list="false"
            accept=".xlsx,.csv"
            :http-request="handleMigrateImport"
          >
            <el-button type="primary">批量导入历史订单</el-button>
          </el-upload>
          
          <el-upload
            action="#"
            :auto-upload="false"
            :show-file-list="false"
            accept=".xlsx, .xls, .csv"
            @change="handleImport"
            style="display: inline-block; margin-right: 10px;"
          >
            <el-button type="success" :icon="Upload" plain>导入数据</el-button>
          </el-upload>
          
          <el-button :icon="Printer" plain @click="printDialogVisible = true">打印预览</el-button>
          
          <el-button type="primary" size="large" :icon="Check" :loading="saving" @click="submitForm" class="btn-emphasize">
            确认并保存订单 (F8)
          </el-button>
        </template>
        
        <div class="page-content-wrapper">
          <el-form ref="formRef" :model="form" class="logic-flex-wrapper">
            <div class="top-settings-bar">
              <div class="field-item">
                <span class="field-label">订单编号</span>
                <el-input v-model="form.order_no" style="width:160px" class="font-mono-bold" placeholder="手动输入" />
              </div>
              <div class="field-item">
                <span class="field-label">下单日期</span>
                <el-date-picker 
                  v-model="form.created_at" 
                  type="date" 
                  value-format="YYYY-MM-DD" 
                  style="width:160px" 
                  @change="handleDateChange"
                  :shortcuts="dateShortcuts"
                />
              </div>
              <div class="field-item">
  <span class="field-label">代理联系人</span>
  <div class="inline-input-wrapper">
    <el-select
      v-model="form.agent_contact_id"
      filterable
	  :disabled="currentUser?.role === 'agent'"
      placeholder="选择联系人"
      style="width:180px"
      @change="handleAgentContactChange"
    >
      <el-option
        v-for="c in contactOptions"
        :key="c.id"
        :label="`${c.company_name} - ${c.name}`"
        :value="c.id"
      />
    </el-select>
                  <el-tooltip content="管理代理联系人" placement="top">
                    <el-button
                      icon="User"
                      circle
                      size="small"
                      class="inline-manage-btn"
                      @click="goToAgentManage"
                    />
                  </el-tooltip>
                </div>
              </div>
              <div class="field-item">
                <span class="field-label">开单客服</span>
                <div class="inline-input-wrapper">
                  <el-select
                    v-model="form.service_staff"
                    placeholder="选择客服"
                    style="width:150px"
                    filterable
                    allow-create
                  >
                    <el-option
                      v-for="staff in staffOptions"
                      :key="staff.id || staff.name"
                      :label="staff.name"
                      :value="staff.name"
                    />
                  </el-select>
                  <el-tooltip content="管理客服人员" placement="top">
                    <el-button
                      icon="Setting"
                      circle
                      size="small"
                      class="inline-manage-btn"
                      @click="goToStaffManage"
                    />
                  </el-tooltip>
                </div>
              </div>
            </div>
            
            <div class="sub-control-bar">
              <el-radio-group v-model="currentModule" size="default">
                <el-radio-button label="all">全部显示</el-radio-button>
                <el-radio-button label="confirm">确认业务办理</el-radio-button>
                <el-radio-button label="process">办理业务</el-radio-button>
              </el-radio-group>
              <div class="action-btns">
                <el-button type="success" :icon="Plus" size="small" @click="addBusiness">
                  + 添加业务
                </el-button>
                <el-button type="primary" :icon="User" size="small" @click="addRow()">添加客户</el-button>
              </div>
            </div>
            
            <!-- 表格区域 - 使用重构后的 OrderTable 组件 -->
            <div class="table-main-area">
              <OrderTable 
                class="order-table-fill"
                :data="form.customers"
                :order-no="form.order_no"
                :module="currentModule"
                :order-type="form.order_type"
                :can-edit-status="canEditProcessStatus"
                @process-change="handleProcessChange"
                @remove="handleRemoveRow"
                @open-files="handleFiles"
                @update:data="updateCustomers"
                @add-business="addBusinessToCustomer"
                @paste-data="handleTablePaste"
                @hide-row="handleHideRow"
                ref="orderTableRef"
              />
            </div>
            
            <div class="footer-black-bar">
              <div class="footer-left">
                <div class="remark-section">
                  <el-icon class="remark-icon"><EditPen /></el-icon>
                  <div class="remark-container">
                    <span class="remark-label">全单备注</span>
                    <el-input 
                      v-model="form.remark" 
                      placeholder="在此录入全单通用备注信息..." 
                      variant="unstyled" 
                      class="dark-remark-input" 
                      maxlength="500"
                      show-word-limit
                    />
                  </div>
                </div>
              </div>
              
              <div class="footer-center">
                <div class="footer-stats-grid">
                  <div class="stat-item">
                    <span class="stat-label">人数</span>
                    <span class="stat-value">{{ uniqueCustomerCount }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">应收合计 (USD)</span>
                    <span class="stat-value highlight">$ {{ totalAmount.toLocaleString() }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">实收合计 (USD)</span>
                    <span class="stat-value" style="color: #10b981;">$ {{ totalActualAmount.toLocaleString() }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">实际利润 (USD)</span>
                    <span class="stat-value" style="color: #3b82f6;">$ {{ actualProfit.toLocaleString() }}</span>
                  </div>
                </div>
              </div>
              
              <div class="footer-right">
                <div class="footer-actions">
                  <el-tooltip content="导出当前列表数据" placement="top">
                    <el-button :icon="Download" size="small" circle plain class="footer-action-btn" @click="handleExport(currentModule)" />
                  </el-tooltip>
                  <el-tooltip content="更改结算币种" placement="top">
                    <el-button size="small" plain class="footer-action-btn currency-btn">
                      <span class="currency-text">USD</span>
                    </el-button>
                  </el-tooltip>
                </div>
              </div>
            </div>
          </el-form>
        </div>
      </PageLayout>
      
      <!-- 文件管理抽屉 -->
      <file-manager-drawer 
        v-model:visible="fileState.show" 
        :customer-data="fileState.data"
        :order-data="form"
        :customer-id="fileState.customerId"
        :row-id="fileState.rowId"
        @save="onFilesSaved" 
      />
      
      <el-dialog v-model="printDialogVisible" title="选择打印显示的列" width="400px">
        <div style="margin-bottom: 15px; color: #64748b;">前5列已固定，请选择需要额外打印的费用列：</div>
        <el-checkbox-group v-model="printFields">
          <el-checkbox label="fee_visa">续签办理费</el-checkbox>
          <el-checkbox label="fee_work">劳工证办理费</el-checkbox>
          <el-checkbox label="fee_other">其他费用</el-checkbox>
          <el-checkbox label="fine_entry">入境罚款</el-checkbox>
          <el-checkbox label="fine_overdue">逾期罚款</el-checkbox>
          <el-checkbox label="fine_work">劳工证罚款</el-checkbox>
          <el-checkbox label="special_fee">特殊费用</el-checkbox>
        </el-checkbox-group>
        <template #footer>
          <el-button @click="printDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handlePrint">开始打印预览</el-button>
        </template>
      </el-dialog>
      
      <div id="print-mount-point" style="display: none;">
        <OrderPrintTemplate 
          id="printable-invoice"
          :order-data="form" 
          :selected-fields="printFields" 
        />
      </div>
    </div>
  </el-config-provider>
</template>

<script setup>
import { softDelete } from '@/domain/recycleService'
import { isStatusEditable } from '@/domain/orderStatus'
import { ref, reactive, computed, onMounted, nextTick, watch, onActivated, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElConfigProvider, ElMessageBox } from 'element-plus'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import { Plus, User, Download, Upload, Printer, Check, EditPen, Delete } from '@element-plus/icons-vue'
import PageLayout from '@/layouts/PageLayout.vue'
import OrderTable from './OrderTable/index.vue'  // 修改：导入重构后的表格组件
import FileManagerDrawer from './components/FileManagerDrawer.vue'
import OrderPrintTemplate from './components/OrderPrintTemplate.vue'
import { db } from '@/utils/storage'
import * as XLSX from 'xlsx'
import { professionalPrint } from './components/print-styles/print-utils'
import { normalizeOrderForSave } from '@/utils/orderAdapter'
import { dryRunMigrate, commitMigrate } from '@/domain/services/orderMigrationService'
import { auth } from '@/utils/auth'

// 当前登录用户（权限核心）
const currentUser = auth.getUser()

const contactOptions = ref([])  // 只用这个就够了

const syncAgentToRows = () => {
  const display = buildAgentDisplay()
  ;(form.customers || []).forEach(r => {
    r.agent_contact = display
  })
}

const buildAgentDisplay = () => {
  const company = form.agent_company_name || ''
  const contact = form.agent_contact_name || ''
  if (!company && !contact) return ''
  if (!company) return contact
  if (!contact) return company
  return `${company} - ${contact}`
}

const handleAgentContactChange = (contactId) => {
  const found = contactOptions.value.find(c => String(c.id) === String(contactId))
  if (!found) return

  // ✅ 一次性写入 4 字段
  form.agent_contact_id = found.id
  form.agent_contact_name = found.name
  form.agent_company_id = found.company_id
  form.agent_company_name = found.company_name

  // ✅ 同步到表格每一行（恢复你之前的功能）
  syncAgentToRows()
}

const handleMigrateImport = async (options) => {
  const file = options.file   // ✅ 真正的 File 在这里
  
  if (!file) {
    ElMessage.error('未获取到文件')
    return
  }
  
  console.log('开始迁移导入:', file.name)
  
  const preview = await dryRunMigrate(file)
  
  if (!preview.length) {
    ElMessage.warning('没有识别到可导入的订单数据')
    return
  }
  
  const msg = preview.map(p =>
    `${p.date} | ${p.agent.company}-${p.agent.contact} → ${p.preview_order_code} (${p.rows} 行)`
  ).join('\n')
  
  ElMessageBox.confirm(
    `将创建以下订单：\n\n${msg}`,
    '导入预览',
    { type: 'warning', dangerouslyUseHTMLString: false }
  ).then(async () => {
    const result = await commitMigrate(file)
    
    ElMessage.success(`导入完成（${result.orders.length}个订单）`)
    location.reload()
  })
}

let staffHookRegistered = false

onUnmounted(() => {
  window.removeEventListener('focus', loadStaffOptions)
})

// ==================== 订单分类真理源 ====================
/**
 * 返回四种业务态：
 * notify
 * confirmed
 * history-notify
 * history-confirmed
 */
const getOrderClass = () => {
  if (!form.id) return 'notify'
  
  const today = todayStr()
  const isHistory = form.created_at < today
  
  if (!isHistory) {
    return form.order_type === 'confirmed'
      ? 'confirmed'
      : 'notify'
  }
  
  // 历史
  return form.order_type === 'confirmed'
    ? 'history-confirmed'
    : 'history-notify'
}

const loadStaffOptions = () => {
  const staff = db.getRaw('STAFF_LIST') || []
  
  console.log('🔄 加载客服列表:', staff)
  
  staffOptions.value = staff.map(s => ({
    id: s.id,
    name: s.name,
    ruleTag: s.ruleTag,
    ruleDesc: s.ruleDesc
  }))
}

const orderClass = computed(() => getOrderClass())

const canEditOrder = computed(() => {
  return orderClass.value !== 'history-notify'
})

const canEditProcessStatus = computed(() => {
  return orderClass.value !== 'history-notify'
})

const persistOrderTypeChange = () => {
  if (!form.id) return
  
  const raw = db.getRaw('ORDERS') || []
  const idx = raw.findIndex(o => String(o.id) === String(form.id))
  if (idx === -1) return
  
  raw[idx] = {
    ...raw[idx],
    order_type: form.order_type,
    source_order_id: form.source_order_id,
    linked_order_id: form.linked_order_id,
    confirmed_at: form.confirmed_at,
    converted_at: form.converted_at || null
  }
  
  db.saveRaw('ORDERS', raw)
  
  console.log('[ORDER FLOW] 状态已持久化', {
    id: form.id,
    order_type: form.order_type
  })
}

const todayStr = () => new Date().toISOString().slice(0, 10)

// ===== 订单关联显示 =====
const badgeInfo = computed(() => {
  const cls = orderClass.value
  const isHistory = cls.startsWith('history')
  const isConfirmed = cls.includes('confirmed')
  
  const hasSource = !!form.source_order_id
  const hasLinked = !!form.linked_order_id
  
  // 状态文字
  const statusText = isHistory
    ? isConfirmed
      ? '🔒 历史确认订单'
      : '🔒 历史通知订单'
    : isConfirmed
      ? '🔗 确认订单'
      : '⚠ 通知订单'
  
  // 历史订单 → 显示生成的新订单
  if (hasLinked) {
    return {
      type: 'history',
      text: `${statusText} → 生成：`,
      link: linkedOrderNo.value,
      action: goToLinkedOrder,
      tip: '这是历史订单，点击查看生成的新订单'
    }
  }
  
  // 新订单 → 只要有来源就一直显示
  if (hasSource) {
    return {
      type: isConfirmed ? 'confirmed' : 'notify',
      text: `${statusText} → 来源：`,
      link: linkedOrderNo.value,
      action: goToLinkedOrder,
      tip: '该订单来源于历史订单，点击查看来源'
    }
  }
  
  // 普通订单
  return {
    type: isConfirmed ? 'confirmed' : 'notify',
    text: statusText,
    link: null,
    action: null,
    tip: ''
  }
})

const convertNotifyToConfirmed = () => {
  form.order_type = 'confirmed'
  form.confirmed_at = new Date().toISOString()
  
  // 🔥 永远不要清 source_order_id
  // form.source_order_id = null
  form.linked_order_id = null
  
  persistOrderTypeChange()
}

const linkedOrderNo = computed(() => {
  const orders = db.getRaw('ORDERS') || []
  
  // 历史订单 → 找新订单
  if (orderClass.value.startsWith('history')) {
    if (!form.linked_order_id) return null
    const found = orders.find(o => String(o.id) === String(form.linked_order_id))
    return found?.order_no || found?.code || null
  }
  
  // 新订单 → 找来源订单
  if (!form.source_order_id) return null
  const found = orders.find(o => String(o.id) === String(form.source_order_id))
  return found?.order_no || found?.code || null
})

const goToLinkedOrder = () => {
  let targetId = null
  
  if (orderClass.value.startsWith('history')) {
    targetId = form.linked_order_id
  } else {
    targetId = form.source_order_id
  }
  
  if (!targetId) return
  
  router.push({
    name: 'business.orders',
    query: { id: targetId }
  })
}

const handleProcessChange = (newStatus, row) => {
  const cls = orderClass.value
  const oldStatus = row.process_status
  
  // 1. 全锁
  if (cls === 'history-notify') {
    ElMessage.warning('历史通知订单不可修改，请转为新订单')
    row.process_status = oldStatus
    return
  }
  
  // 2. notify → confirmed 自动升级
  if (cls === 'notify') {
    const isFirstProcess =
      (oldStatus === '已录入' ||
        oldStatus === 'Pending' ||
        oldStatus === 'created') &&
      newStatus !== oldStatus
    
    if (isFirstProcess) {
      convertNotifyToConfirmed()
      persistOrderTypeChange()
      
      // 🔥 强制触发响应链
      form.order_type = 'confirmed'
      form.confirmed_at = new Date().toISOString()
      
      ElMessage.success('订单已自动转为【确认订单】')
    }
  }
  
  // 3. 写值
  applyProcessStatusToForm(row.id, newStatus)
}

const applyProcessStatusToForm = (rowId, status) => {
  // 改当前表格行
  const row = form.customers.find(r => r.id === rowId)
  if (row) row.process_status = status
  
  // 如果你有统一保存函数，这里可以顺手调用
  // persistOrderToStorage()
}

const router = useRouter()
const route = useRoute()
// 页面使用的订单类型桥接变量
const orderType = computed(() => form.order_type)

// 关联历史订单显示用（查数据库拿订单编号）
const linkedHistoryOrderNo = computed(() => {
  if (!form.linked_order_id) return null
  
  const orders = db.getRaw('ORDERS') || []
  const linked = orders.find(o => String(o.id) === String(form.linked_order_id))
  
  return linked?.code || linked?.order_no || null
})

const saving = ref(false)
const currentModule = ref('all')
const isEditMode = ref(false)
const printDialogVisible = ref(false)
const printFields = ref(['fee_visa', 'fee_work', 'special_fee'])
const orderTableRef = ref(null)
const today = () => new Date().toISOString().slice(0, 10)

const canShowConvertBtn = computed(() => {
  if (!isEditMode.value) return false
  if (!form.id) return false
  if (form.linked_order_id) return false
  
  return (
    orderClass.value === 'history-notify' ||
    orderClass.value === 'history-confirmed'
  )
})

const normalizeFileRecord = (raw, ctx) => {
  return {
    id: raw.id || raw.__id || `${Date.now()}_${Math.random().toString(36).slice(2)}`,
    name: raw.name,
    size: raw.size || 0,
    category: raw.category || '未分类',
    
    orderId: ctx.orderId,
    orderCode: ctx.orderCode,
    customerId: ctx.customerId,
    customerName: ctx.customerName,
    rowId: ctx.rowId,
    
    fileType: raw.fileType || 'file',
    mimeType: raw.mimeType || '',
    
    // 🔥 真理字段
    dataUrl: raw.dataUrl || raw.url || '',
    
    // 兼容字段（旧代码用的）
    url: raw.dataUrl || raw.url || '',
    
    uploadedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
    uploadedBy: ctx.uploadedBy || 'system'
  }
}

const isDirty = ref(false)
let formSnapshot = ''

// 日期快捷选项
const dateShortcuts = [
  { text: '今天', value: new Date() },
  { text: '昨天', value: () => { 
    const d = new Date()
    d.setTime(d.getTime() - 3600 * 1000 * 24)
    return d 
  }},
  { text: '最近一周', value: () => { 
    const d = new Date()
    d.setTime(d.getTime() - 3600 * 1000 * 24 * 7)
    return d 
  }}
]

const handleDeleteOrder = () => {
  if (!form.id) return
  
  ElMessageBox.confirm(
    `确定将订单【${form.order_no}】移入回收站吗？`,
    '删除订单',
    { type: 'warning' }
  ).then(() => {
    try {
      // 构造完整快照（恢复全靠它）
const snapshot = {
  ...normalizeOrderForSave(form),

  id: form.id,
  code: form.order_no,

  // ⭐⭐ 必须补上代理字段（关键修复）
  agent_company_id: form.agent_company_id,
  agent_company_name: form.agent_company_name,
  agent_contact_id: form.agent_contact_id,
  agent_contact_name: form.agent_contact_name
}
      
      softDelete({
        module: 'order',
        sourceId: String(form.id),
        snapshot,
        operator: form.service_staff || 'system',
        reason: '用户手动删除订单'
      })
      
      ElMessage.success('订单已移入回收站')
      router.push({ name: 'business.orders' })
    } catch (e) {
      console.error(e)
      ElMessage.error(e.message || '删除失败')
    }
  }).catch(() => {})
}

// ==================== 表单数据 ====================
const form = reactive({ 
  id: null,
  order_no: '',
  created_at: new Date().toISOString().split('T')[0],
  
agent_company_id: null,
agent_company_name: '',
agent_contact_id: '',
agent_contact_name: '',
  service_staff: '',
  remark: '',
  customers: [],
  
  // 订单流转核心字段
  order_type: 'notify',     // notify | confirmed | history
  status: 'Draft',         // Draft | Processing | Completed | Cancelled
  
  // 🔥 转单追溯字段（统一模型）
  source_order_id: null,   // 新订单 → 来源订单
  linked_order_id: null,  // 历史订单 → 生成的新订单
  converted_at: null,
  confirmed_at: null
})

// ==================== 新增：表格事件处理 ====================
/**
 * 处理删除行事件（适配重构后的表格）
 */
const handleRemoveRow = (row, displayIndex) => {
  removeRow(displayIndex)
}

/**
 * 处理隐藏行事件（新增的事件）
 */
const handleHideRow = (rowId) => {
  if (!form.customers || form.customers.length === 0) return
  
  // 从 customers 中移除被隐藏的行
  const updatedCustomers = form.customers.filter(row => row.id !== rowId)
  form.customers = updatedCustomers
  
  ElMessage.success('已隐藏该行数据')
}

// ==================== 粘贴事件处理 ====================
/**
 * 处理表格粘贴事件
 */
const handleTablePaste = (pasteText) => {
  try {
    const rows = pasteText.split('\n')
      .map(row => row.split('\t').map(cell => cell.trim()))
      .filter(row => row.some(cell => cell))
    
    if (rows.length === 0) return
    
    if (rows.length === 1) {
      const singleRow = rows[0]
      const parsedRow = parseSingleRowData(singleRow)
      if (parsedRow) {
        addPastedRow(parsedRow)
      }
    } else {
      ElMessageBox.confirm(
        `检测到 ${rows.length} 行粘贴数据，是否批量导入？`,
        '批量导入',
        {
          confirmButtonText: '导入',
          cancelButtonText: '取消',
          type: 'info'
        }
      ).then(() => {
        const parsedRows = rows.map((rowCells, index) => {
          return parseRowData(rowCells, index)
        }).filter(row => row.name || row.passport)
        
        if (parsedRows.length > 0) {
          batchAddPastedRows(parsedRows)
        }
      })
    }
  } catch (error) {
    console.error('粘贴失败:', error)
    ElMessage.error('粘贴失败：' + error.message)
  }
}

/**
 * 解析单行数据
 */
const parseSingleRowData = (cells) => {
  if (cells.length >= 2) {
    return {
      name: cells[0] || '',
      passport: cells[1] || '',
      alias_no: cells[2] || '',
      nationality: cells[3] || '',
      business_type: cells[4] || '',
      fee_visa: cells[5] ? parseFloat(cells[5]) || null : null,
      fee_work: cells[6] ? parseFloat(cells[6]) || null : null,
      fee_other: cells[7] ? parseFloat(cells[7]) || null : null,
      row_remark: cells[8] || ''
    }
  }
  return null
}

/**
 * 解析行数据
 */
const parseRowData = (cells, index) => {
  return {
    name: cells[0] || `粘贴客户${index + 1}`,
    passport: cells[1] || '',
    alias_no: cells[2] || '',
    nationality: cells[3] || '',
    business_type: cells[4] || '',
    fee_visa: cells[5] ? parseFloat(cells[5]) || null : null,
    fee_work: cells[6] ? parseFloat(cells[6]) || null : null,
    fee_other: cells[7] ? parseFloat(cells[7]) || null : null,
    row_remark: cells[8] || ''
  }
}

/**
 * 添加粘贴的行
 */
const addPastedRow = (rowData) => {
  const newRow = {
    ...createEmptyRow(),
    ...rowData,
    id: generateRowId(),
    customer_id: generateCustomerId(rowData)
  }
  
  form.customers.push(newRow)
  ElMessage.success('已添加粘贴的数据')
}

/**
 * 批量添加粘贴的行
 */
const batchAddPastedRows = (rowsData) => {
  const newCustomers = [...form.customers]
  
  rowsData.forEach(rowData => {
    const newRow = {
      ...createEmptyRow(),
      ...rowData,
      id: generateRowId(),
      customer_id: generateCustomerId(rowData)
    }
    newCustomers.push(newRow)
  })
  
  form.customers = newCustomers
  ElMessage.success(`成功导入 ${rowsData.length} 行数据`)
}

// ==================== 数据工具函数 ====================
/**
 * 生成稳定的客户ID
 */
const generateCustomerId = (row) => {
  if (row.customer_id) return row.customer_id
  
  const baseId = `${row.passport || ''}_${row.name || ''}`
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^\w]/g, '')
  
  if (baseId && baseId !== '_') {
    return `cust_${baseId}`
  }
  
  return `cust_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 生成唯一的行ID
 */
const generateRowId = () => {
  return `row_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 创建新的客户+业务记录
 */
const createEmptyRow = () => {
  const customerId = generateCustomerId({})
  
  return {
    id: generateRowId(),
    customer_id: customerId,
    name: '', 
    passport: '', 
    alias_no: '', 
    nationality: '', 
    passport_expiry: '', 
    entry_date: '', 
    visa_expiry: '', 
    has_work_permit: '无',
agent_contact: buildAgentDisplay(),
agent_contact_id: form.agent_contact_id || '',
agent_company_id: form.agent_company_id || '',
agent_company_name: form.agent_company_name || '',

    business_seq: 1,
    business_type: '',
    fee_visa: null,
    fee_work: null,
    fee_other: null,
    fine_entry: null,
    fine_overdue: null,
    fine_work: null,
    special_fee: null,
    actual_fee: null,
    is_settled: '否',
    row_remark: '',
    upstream_name: '',
    upstream_time: '',
    upstream_fee: null,
    upstream_is_settled: '否',
    process_status: 'Pending',
    upstream_remark: '',
    business_end_time: '',
    business_return_time: '',
    files: []
  }
}

/**
 * 确保数据中有必要的字段
 */
const ensureDataFields = (data) => {
  if (!data || !Array.isArray(data)) return []
  
  return data.map(row => {
    const customerId = row.customer_id || generateCustomerId(row)
    const rowId = row.id || generateRowId()
    
    return {
      ...row,
      id: rowId,
      customer_id: customerId,
      business_seq: row.business_seq || 1,
      fee_visa: row.fee_visa === undefined ? null : row.fee_visa,
      fee_work: row.fee_work === undefined ? null : row.fee_work,
      fee_other: row.fee_other === undefined ? null : row.fee_other,
      actual_fee: row.actual_fee === undefined ? null : row.actual_fee
    }
  })
}

// ==================== 代理相关数据 ====================
const agentListData = ref([])
const filteredAgentList = ref([])
const agentSearchLoading = ref(false)
const staffOptions = ref([])

// ==================== 文件管理 ====================
const fileState = reactive({ 
  show: false, 
  data: null,  // 这里会接收完整的数据对象
  index: -1, 
  customerId: '',
  rowId: '' 
})

// ==================== 文件处理函数（修改为适配重构后的表格） ====================
/**
 * 处理文件管理 - 适配重构后的表格组件
 */
const handleFiles = (data) => {
  // data 是从重构表格组件传递过来的对象，包含 rowId, customerId, customerName, rowData
  fileState.data = data.rowData  // 使用 rowData
  fileState.customerId = data.customerId
  fileState.rowId = data.rowId
  fileState.show = true
}

// ==================== 新增：右键添加业务功能 ====================
/**
 * 为指定客户添加业务
 */
const addBusinessToCustomer = (customerId) => {
  if (!form.customers || form.customers.length === 0) return
  
  const customerRows = form.customers.filter(c => c.customer_id === customerId)
  if (customerRows.length === 0) {
    ElMessage.warning('未找到该客户')
    return
  }
  
  const nextBusinessSeq = customerRows.length + 1
  const firstRow = customerRows[0]
  
  const newBusiness = {
    id: generateRowId(),
    customer_id: customerId,
    business_seq: nextBusinessSeq,
    name: firstRow.name || '',
    passport: firstRow.passport || '',
    alias_no: firstRow.alias_no || '',
    nationality: firstRow.nationality || '',
    passport_expiry: firstRow.passport_expiry || '',
    entry_date: firstRow.entry_date || '',
    visa_expiry: firstRow.visa_expiry || '',
    has_work_permit: firstRow.has_work_permit || '无',
    agent_contact: firstRow.agent_contact || buildAgentDisplay(),
    business_type: '',
    fee_visa: null,
    fee_work: null,
    fee_other: null,
    fine_entry: null,
    fine_overdue: null,
    fine_work: null,
    special_fee: null,
    actual_fee: firstRow.actual_fee || null,
    is_settled: '否',
    row_remark: '',
    upstream_name: '',
    upstream_time: '',
    upstream_fee: null,
    upstream_is_settled: '否',
    process_status: 'Pending',
    upstream_remark: '',
    business_end_time: '',
    business_return_time: '',
    files: []
  }
  
  const lastIndex = form.customers.findLastIndex(c => c.customer_id === customerId)
  if (lastIndex !== -1) {
    form.customers.splice(lastIndex + 1, 0, newBusiness)
  } else {
    form.customers.push(newBusiness)
  }
  
  ElMessage.success('已添加新业务行')
}

// ==================== 计算属性 ====================
/**
 * 计算唯一客户数量
 */
const uniqueCustomerCount = computed(() => {
  if (!form.customers || form.customers.length === 0) return 0
  
  const customerIds = new Set()
  form.customers.forEach(row => {
    if (row.customer_id) {
      customerIds.add(row.customer_id)
    }
  })
  
  return customerIds.size
})

/**
 * 过滤联系人选项
 */

/**
 * 计算应收合计
 */
const totalAmount = computed(() => {
  if (!form.customers || form.customers.length === 0) return 0
  
  return form.customers.reduce((sum, row) => {
    return sum + 
      (Number(row.fee_visa) || 0) + 
      (Number(row.fee_work) || 0) + 
      (Number(row.fee_other) || 0) + 
      (Number(row.fine_entry) || 0) + 
      (Number(row.fine_overdue) || 0) + 
      (Number(row.fine_work) || 0) + 
      (Number(row.special_fee) || 0)
  }, 0)
})

/**
 * 计算实收合计
 */
const totalActualAmount = computed(() => {
  if (!form.customers || form.customers.length === 0) return 0
  
  const uniqueCustomerIds = new Set()
  let total = 0
  
  form.customers.forEach(row => {
    if (!uniqueCustomerIds.has(row.customer_id)) {
      uniqueCustomerIds.add(row.customer_id)
      total += (Number(row.actual_fee) || 0)
    }
  })
  
  return total
})

/**
 * 计算实际利润
 */
const actualProfit = computed(() => {
  if (!form.customers || form.customers.length === 0) return 0
  
  const totalUpstream = form.customers.reduce((sum, row) => {
    return sum + (Number(row.upstream_fee) || 0)
  }, 0)
  
  return totalActualAmount.value - totalUpstream
})

// ==================== 代理相关方法 ====================
/**
 * 搜索代理
 */
const searchAgents = (query) => {
  if (query) {
    agentSearchLoading.value = true
    setTimeout(() => {
      filteredAgentList.value = agentListData.value.filter(item => 
        item.name.toLowerCase().includes(query.toLowerCase())
      )
      agentSearchLoading.value = false
    }, 200)
  } else {
    filteredAgentList.value = agentListData.value
  }
}

/**
 * 处理代理公司变更
 */

/**
 * 同步代理联系人到所有行
 */

// ==================== 订单编号相关 ====================
/**
 * 更新订单编号
 */
const updateOrderNo = () => {
  const prefix = `QX${form.created_at.replace(/-/g, '').substring(2)}`
  const all = db.getRaw('ORDERS') || []
  form.order_no = `${prefix}${(all.filter(o => o.code?.startsWith(prefix)).length + 1).toString().padStart(4, '0')}`
}

/**
 * 处理日期变更
 */
const handleDateChange = () => { 
  if (!form.id) updateOrderNo() 
}

// ==================== 客户行操作方法 ====================
/**
 * 添加新客户行
 */
const addRow = (index = null, mode = 'below') => {
  const newRow = createEmptyRow()
  
  if (index !== null) {
    const targetIdx = mode === 'above' ? index : index + 1
    form.customers.splice(targetIdx, 0, newRow)
  } else {
    form.customers.push(newRow)
  }
}

/**
 * 删除行
 */
const removeRow = (idx) => { 
  if (form.customers && form.customers.length > 1) {
    form.customers.splice(idx, 1)
  }
}

/**
 * 更新客户数据（从子组件接收）
 */
const updateCustomers = (newCustomers) => {
  form.customers = ensureDataFields(newCustomers)
}

/**
 * 为第一个客户添加业务
 */
const addBusiness = () => {
  if (!orderTableRef.value?.addBusinessToActiveCustomer) {
    ElMessage.warning('表格未就绪，请稍后再试')
    return
  }
  
  orderTableRef.value.addBusinessToActiveCustomer()
}

// ==================== 文件相关方法 ====================
/**
 * 文件保存回调
 */
const onFilesSaved = (groups) => {
  if (!fileState.rowId || !form.customers) return
  
  const rowIndex = form.customers.findIndex(
    r => r.id === fileState.rowId
  )
  if (rowIndex === -1) return
  
  // 1. 展平分组
  const flatFiles = []
  groups.forEach(g => {
    g.files.forEach(f => {
      flatFiles.push({
        ...f,
        category: g.title
      })
    })
  })
  
  // 2. 写回订单行
  form.customers[rowIndex].files = flatFiles
  
  // 3. 文件中心 = 唯一权威接口
  const center = db.getFiles()
  
  const safeOrderId = form.id || `TEMP_${form.order_no}`
  
  // 只移除当前订单 + 当前行的旧文件
  const filtered = center.filter(f =>
    !(String(f.orderId) === String(safeOrderId) &&
      String(f.rowId) === String(fileState.rowId))
  )
  
  // 标准化写入
  const normalized = flatFiles.map(f =>
    normalizeFileRecord(f, {
      orderId: safeOrderId,
      orderCode: form.order_no,
      customerId: form.customers[rowIndex].customer_id,
      customerName: form.customers[rowIndex].name || '',
      rowId: fileState.rowId,
      uploadedBy: form.service_staff || 'system'
    })
  )
  
  db.saveFiles([...filtered, ...normalized])
  
  console.log('📁 文件中心已同步', {
    orderId: safeOrderId,
    rowId: fileState.rowId,
    count: normalized.length
  })
}

// ==================== 导入导出相关 ====================
/**
 * 格式化Excel日期
 */
const formatExcelDate = (val) => {
  if (!val) return ""
  let date
  
  if (typeof val === 'number') {
    date = new Date((val - 25569) * 86400 * 1000)
  } else {
    let str = String(val).trim()
      .replace('年', '-')
      .replace('月', '-')
      .replace('日', '')
      .replace(/[.\/]/g, '-')
    
    date = new Date(str)
  }
  
  if (isNaN(date.getTime())) return ""
  
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * 导入数据
 */
const handleImport = (uploadFile) => {
  const reader = new FileReader()
  
  reader.onload = async (e) => {
    try {
      const data = new Uint8Array(e.target.result)
      const workbook = XLSX.read(data, { type: 'array', cellDates: true })
      const json = XLSX.utils.sheet_to_json(
        workbook.Sheets[workbook.SheetNames[0]],
        { defval: "" }
      )
      
      if (!json.length) {
        ElMessage.warning('导入文件为空')
        return
      }
      
      // =========================
      // 构建导入数据
      // =========================
      const importedRows = []
      
      json.forEach((row, rowIndex) => {
        const bTypeRaw = findValueByKeys(row, ['业务类型', 'Type'])
        let bTypes = bTypeRaw
          ? bTypeRaw.split(/[，,]/).map(t => t.trim()).filter(Boolean)
          : ['未指定业务']
        
        const customerName =
          findValueByKeys(row, ['名字', '姓名', 'Name', '护照名']) ||
          `客户_${rowIndex + 1}`
        
        const passportNo =
          findValueByKeys(row, ['护照号', '护照', 'Passport', 'No']) ||
          `passport_${rowIndex + 1}`
        
        const aliasNo = findValueByKeys(row, ['化名', '员工编号', 'Alias', 'ID'])
        
        bTypes.forEach((businessType, typeIndex) => {
          const directFees = parseFeeFields(row)
          const hasDirectFee = Object.values(directFees).some(v => v > 0)
          
          let feeAllocation = directFees
          
          if (!hasDirectFee) {
            const totalFee = Number(findValueByKeys(row, ['总费用', '费用', 'Fee'])) || 0
            const feePerBusiness = bTypes.length
              ? totalFee / bTypes.length
              : totalFee
            
            feeAllocation = allocateFeeByBusinessType(
              businessType,
              feePerBusiness
            )
          }
          
          const actualFee = Number(findValueByKeys(row, ['实收金额', '实收'])) || 0
          const upstreamFee =
            Number(findValueByKeys(row, ['上游端结算费用', '上游费用'])) || 0
          
          const customerId = generateCustomerId({
            name: customerName,
            passport: passportNo
          })
          
          importedRows.push({
            id: generateRowId(),
            customer_id: customerId,
            business_seq: typeIndex + 1,
            name: customerName,
            passport: passportNo,
            alias_no: aliasNo,
            nationality: findValueByKeys(row, ['国籍', '国家', 'Nationality']),
            passport_expiry: formatExcelDate(
              findValueByKeys(row, ['护照到期', '护照有效'])
            ),
            entry_date: formatExcelDate(
              findValueByKeys(row, ['入境时间', '入境日期'])
            ),
            visa_expiry: formatExcelDate(
              findValueByKeys(row, ['签证到期', '签证有效'])
            ),
            has_work_permit:
              findValueByKeys(row, ['劳工证', 'Work Permit']) || '无',
            agent_contact: buildAgentDisplay(),
            business_type: businessType,
            ...feeAllocation,
            actual_fee: bTypes.length > 1
              ? actualFee / bTypes.length
              : actualFee,
            upstream_fee: bTypes.length > 1
              ? upstreamFee / bTypes.length
              : upstreamFee,
            is_settled:
              findValueByKeys(row, ['结算', '已结']) || '否',
            row_remark: findValueByKeys(row, ['备注', 'Remark']),
            upstream_name:
              findValueByKeys(row, ['上游端', '上游名称', 'Upstream']),
            upstream_time: formatExcelDate(
              findValueByKeys(row, ['办理业务时间', '办理业务日期'])
            ),
            upstream_is_settled:
              findValueByKeys(row, ['上游是否结算', '上游结算']) || '否',
            upstream_remark:
              findValueByKeys(row, ['上游备注']),
            process_status:
              findValueByKeys(row, ['办理状态', '状态']) || 'Pending',
            business_end_time: formatExcelDate(
              findValueByKeys(row, ['业务结束时间'])
            ),
            business_return_time: formatExcelDate(
              findValueByKeys(row, ['业务返回时间'])
            ),
            files: []
          })
        })
      })
      
      if (!importedRows.length) {
        ElMessage.warning('未识别到可导入的数据')
        return
      }
      
      // =========================
      // 覆盖 / 追加 选择弹窗
      // =========================
      ElMessageBox.confirm(
        `检测到 ${importedRows.length} 条导入数据，请选择操作方式：`,
        '导入方式选择',
        {
          confirmButtonText: '覆盖当前数据',
          cancelButtonText: '追加到现有数据',
          distinguishCancelAndClose: true,
          type: 'warning'
        }
      )
        .then(() => {
          // 覆盖
          form.customers = ensureDataFields(importedRows)
          currentModule.value = 'all'
          ElMessage.success(`已覆盖并导入 ${importedRows.length} 条数据`)
        })
        .catch(action => {
          if (action === 'cancel') {
            // 追加
            const combined = [
              ...(form.customers || []),
              ...importedRows
            ]
            form.customers = ensureDataFields(combined)
            currentModule.value = 'all'
            ElMessage.success(`已追加导入 ${importedRows.length} 条数据`)
          }
          // close → 什么都不做
        })
    } catch (error) {
      console.error('导入失败:', error)
      ElMessage.error('导入失败，请检查文件格式')
    }
  }
  
  reader.readAsArrayBuffer(uploadFile.raw)
}

const handleConvertOrder = async () => {
  const cls = orderClass.value
  const isHistoryNotify = cls === 'history-notify'
  const isHistoryConfirmed = cls === 'history-confirmed'
  
  await ElMessageBox.confirm(
    '该订单将生成一条新的订单，原订单将作为历史记录保留，是否继续？',
    '转为新订单',
    { type: 'warning' }
  )
  
  const raw = db.getRaw('ORDERS') || []
  const sourceIndex = raw.findIndex(o => String(o.id) === String(form.id))
  if (sourceIndex === -1) return
  
  const source = raw[sourceIndex]
  const now = new Date()
  const today = todayStr()
  
  const newOrderId = 'ORD_' + now.getTime()
  const prefix = `QX${today.replace(/-/g, '').substring(2)}`
  const todayCount = raw.filter(o =>
    (o.code || '').startsWith(prefix)
  ).length
  
  const newCode = `${prefix}${String(todayCount + 1).padStart(4, '0')}`
  
  // 新订单
  const newOrder = {
    ...source,
    id: newOrderId,
    code: newCode,
    created_at: today,
    created_seq: Date.now(), // ✅ 新订单给新顺序
    
    // 新订单身份
    order_type: isHistoryNotify ? 'notify' : 'confirmed',
    confirmed_at: isHistoryConfirmed ? now.toISOString() : null,
    
    // 🔥 统一来源字段
    source_order_id: source.id,
    linked_order_id: null,
    converted_at: null
  }
  
  // 原订单 → 变成历史，只加关联，不改身份
  const historyOrder = {
    ...source,
    linked_order_id: newOrderId,
    converted_at: now.toISOString()
  }
  
  raw[sourceIndex] = historyOrder
  raw.unshift(newOrder)
  
  db.saveRaw('ORDERS', raw)
  
  ElMessage.success('新订单已生成')
  
  Object.assign(form, {
    id: newOrderId,
    order_type: newOrder.order_type,
    source_order_id: newOrder.source_order_id,
    linked_order_id: null,
    created_at: today,
    created_seq: source.created_seq || null, // ✅ 用 source
  })
  
  router.push({
    name: 'business.orders',
    query: { id: newOrderId }
  })
}

const parseFeeFields = (row) => {
  const num = (v) => {
    const n = Number(String(v).replace(/[^\d.-]/g, ''))
    return isNaN(n) ? 0 : n
  }
  
  return {
    fee_visa: num(findValueByKeys(row, ['续签办理费', '签证费', 'Visa Fee'])),
    fee_work: num(findValueByKeys(row, ['劳工证办理费', '工作证费', 'Work Permit Fee'])),
    fee_other: num(findValueByKeys(row, ['其他费用', 'Other Fee'])),
    fine_entry: num(findValueByKeys(row, ['入境罚款', 'Entry Fine'])),
    fine_overdue: num(findValueByKeys(row, ['逾期罚款', 'Overdue Fine'])),
    fine_work: num(findValueByKeys(row, ['劳工证罚款', 'Work Fine'])),
    special_fee: num(findValueByKeys(row, ['特殊费用', 'Special Fee']))
  }
}

/**
 * 工具函数：识别业务类型并分配到对应费用列
 */
const allocateFeeByBusinessType = (businessType, feeData) => {
  const allocation = {
    fee_visa: 0,
    fee_work: 0,
    fee_other: 0,
    fine_entry: 0,
    fine_overdue: 0,
    fine_work: 0,
    special_fee: 0
  }
  
  if (businessType.includes('续签') || businessType.includes('签证')) {
    allocation.fee_visa = feeData
  } else if (businessType.includes('劳工证') || businessType.includes('工作证')) {
    allocation.fee_work = feeData
  } else if (businessType.includes('其他')) {
    allocation.fee_other = feeData
  } else {
    allocation.fee_other = feeData
  }
  return allocation
}

/**
 * 通过多个可能的键名查找值
 */
const findValueByKeys = (row, keys) => {
  const rowKeys = Object.keys(row)
  for (const k of keys) {
    const target = k.toLowerCase().replace(/\s/g, '')
    const foundKey = rowKeys.find(rk => rk.toLowerCase().replace(/\s/g, '').includes(target))
    if (foundKey && row[foundKey] !== "" && row[foundKey] !== undefined) {
      return row[foundKey]
    }
  }
  return ""
}

/**
 * 导出数据
 */
const handleExport = (command) => {
  if (!form.order_no) {
    ElMessage.warning('请先设置订单编号')
    return
  }
  
  if (!form.customers || form.customers.length === 0) {
    ElMessage.warning('没有数据可以导出')
    return
  }
  
  // 按客户分组
  const customerGroups = {}
  
  form.customers.forEach(row => {
    const customerId = row.customer_id || generateCustomerId(row)
    if (!customerGroups[customerId]) {
      customerGroups[customerId] = []
    }
    customerGroups[customerId].push(row)
  })
  
  const exportData = []
  let customerSeq = 0
  
  // 处理每个客户的业务
  Object.values(customerGroups).forEach(group => {
    // 按业务顺序排序
    group.sort((a, b) => (a.business_seq || 1) - (b.business_seq || 1))
    
    customerSeq++
    
    group.forEach((row, index) => {
      const isFirstRow = index === 0
      const exportRow = { 
        '序号': isFirstRow ? `${form.order_no}-${customerSeq.toString().padStart(3, '0')}` : '', 
        '代理联系人': isFirstRow ? (row.agent_contact || '') : '', 
        '护照名字': isFirstRow ? (row.name || '') : '', 
        '护照号': isFirstRow ? (row.passport || '') : '', 
        '化名/员工编号': isFirstRow ? (row.alias_no || '') : '', 
        '国籍': isFirstRow ? (row.nationality || '') : '', 
        '护照到期日': isFirstRow ? (row.passport_expiry || '') : '', 
        '入境时间': isFirstRow ? (row.entry_date || '') : '', 
        '签证到期时间': isFirstRow ? (row.visa_expiry || '') : '', 
        '有无劳工证': isFirstRow ? (row.has_work_permit || '') : '', 
        '业务类型': row.business_type || ''
      }
      
      // 添加费用与结算相关列
      if (command === 'all' || command === 'confirm') {
        Object.assign(exportRow, { 
          '续签办理费': row.fee_visa || 0, 
          '劳工证办理费': row.fee_work || 0, 
          '其他费用': row.fee_other || 0, 
          '入境罚款': row.fine_entry || 0,
          '逾期罚款': row.fine_overdue || 0,
          '劳工证罚款': row.fine_work || 0,
          '特殊处理费用': row.special_fee || 0,
          '应收合计': calcRowTotal(row),
          '实收金额': row.actual_fee || 0,
          '是否结算': row.is_settled || '否',
          '备注': row.row_remark || ''
        })
      }
      
      // 添加上游端及办理进度相关列
      if (command === 'all' || command === 'process') {
        if (isFirstRow) {
          Object.assign(exportRow, { 
            '上游端': row.upstream_name || '', 
            '办理业务时间': row.upstream_time || '', 
            '上游端结算费用': row.upstream_fee || 0, 
            '上游是否结算': row.upstream_is_settled || '否', 
            '办理状态': row.process_status || 'Pending', 
            '上游备注': row.upstream_remark || '', 
            '业务结束时间': row.business_end_time || '', 
            '业务返回时间': row.business_return_time || '' 
          })
        }
      }
      
      exportData.push(exportRow)
    })
  })
  
  // 添加总计行
  exportData.push({ 
    '序号': '总计', 
    '应收合计': totalAmount.value 
  })
  
  // 创建Excel工作表
  const ws = XLSX.utils.json_to_sheet(exportData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "订单数据")
  
  // 设置列宽
  const wscols = [
    { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 15 },
    { wch: 10 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 10 },
    { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 12 },
    { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 10 },
    { wch: 20 }
  ]
  
  ws['!cols'] = wscols
  
  // 生成文件名并导出
  const fileName = `订单_${form.order_no}_${command}_${new Date().toISOString().slice(0,10)}.xlsx`
  XLSX.writeFile(wb, fileName)
}

/**
 * 计算单行总计
 */
const calcRowTotal = (row) => {
  const sum = (Number(row.fee_visa) || 0) + 
              (Number(row.fee_work) || 0) + 
              (Number(row.fee_other) || 0) + 
              (Number(row.fine_entry) || 0) + 
              (Number(row.fine_overdue) || 0) + 
              (Number(row.fine_work) || 0) + 
              (Number(row.special_fee) || 0)
  return sum === 0 ? '' : sum
}

// ==================== 打印功能 ====================
/**
 * 处理打印
 */
const handlePrint = async () => {
  printDialogVisible.value = false
  try {
    const printElement = document.getElementById('printable-invoice')
    if (!printElement) {
      ElMessage.error('无法加载打印模板')
      return
    }
    
    await professionalPrint(printElement, `Invoice - ${form.order_no}`)
    ElMessage.success('打印完成')
  } catch (error) {
    console.error('打印失败:', error)
    ElMessage.error('打印失败：' + error.message)
  }
}

// ==================== 表单提交 ====================
/**
 * 提交表单
 */
const submitForm = async () => {
  // 只锁"历史通知订单"
  if (!canEditOrder.value) {
    ElMessage.warning('历史通知订单不可修改，请转为新订单')
    return
  }
  
  if (!form.created_at) {
    ElMessage.warning('请选择下单日期')
    return
  }
  
  if (!form.order_no) {
    ElMessage.warning('请输入订单编号')
    return
  }
  
  if (!form.service_staff) {
    ElMessage.warning('请选择或录入开单客服')
    return
  }
  if (!form.agent_contact_id) {
  ElMessage.warning('请选择代理联系人')
  return
}

if (!form.agent_company_id) {
  ElMessage.error('代理公司缺失：请重新选择代理联系人')
  return
}
  
  const allOrders = db.getRaw('ORDERS') || []
  if (allOrders.some(o => o.code === form.order_no && o.id !== form.id)) {
    ElMessageBox.alert('该订单编号已存在', '编号重复', { type: 'error' })
    return
  }
  
  const hasIncompleteRow = form.customers.some(c => !c.name || !c.passport)
  if (hasIncompleteRow) {
    ElMessage.warning('请确保所有客户的护照名字和护照号已填写')
    return
  }
  
  saving.value = true
  try {
const snapRate = 10

    
const payload = {
  ...normalizeOrderForSave({
    ...form,
    customers: form.customers.map(r => ({ ...r, files: [] }))
  }),

  id: form.id || Date.now(),
  created_seq: form.created_seq || Date.now(),

  // ✅ 企业标准：写入 4 字段
  agent_contact_id: form.agent_contact_id,
  agent_contact_name: form.agent_contact_name,
  agent_company_id: form.agent_company_id,
  agent_company_name: form.agent_company_name,
      
      source_order_id: form.source_order_id || null,
      linked_order_id: form.linked_order_id || null,
      converted_at: form.converted_at || null,
      confirmed_at: form.confirmed_at || null,
      
      agent_commission_rate: snapRate,
      commission_settled: false,
      deleted: false,
      deleted_at: null
    }
    
    const updatedOrders = form.id ? 
      allOrders.map(o => o.id === form.id ? payload : o) : 
      [payload, ...allOrders]
    
    db.saveRaw('ORDERS', updatedOrders)
    
    // 🔥 把数据库ID同步回表单
    form.id = payload.id
    // 🔥 回填文件中心临时订单ID（统一走文件中心接口）
    const files = db.getFiles()
    
    const fixed = files.map(f => {
      if (f.orderId === `TEMP_${form.order_no}`) {
        return {
          ...f,
          orderId: payload.id
        }
      }
      return f
    })
    
    db.saveFiles(fixed)
    
    ElMessage.success(isEditMode.value ? '订单修改成功' : '新订单创建成功')
    router.push({ name: 'business.orders' })
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败：' + error.message)
  } finally { 
    saving.value = false 
  }
}

const loadOrderById = (id) => {
  const orders = db.getRaw('ORDERS') || []
  const order = orders.find(o => String(o.id) === String(id))
  
  if (!order) {
    ElMessage.error('订单不存在或已被删除')
    return
  }
  
  Object.assign(form, {
    id: order.id,
    order_no: order.code,
    created_at: order.created_at,
    
agent_company_id: order.agent_company_id ?? null,
agent_company_name: order.agent_company_name || '',

agent_contact_id: order.agent_contact_id || '',
agent_contact_name: order.agent_contact_name || '',

    service_staff: order.service_staff || '',
    remark: order.remark || '',
    
    status: order.status || 'Pending',
    order_type: order.order_type || 'notify',
    
    // 🔥 统一来源字段
    source_order_id: order.source_order_id || null,
    linked_order_id: order.linked_order_id || null,
    converted_at: order.converted_at || null,
    confirmed_at: order.confirmed_at || null,
    
    customers: ensureDataFields(order.customers || [])
  })
  // 如果只存在 contact_id（老数据），尝试从联系人表补齐公司/name
if (form.agent_contact_id && (!form.agent_company_id || !form.agent_company_name || !form.agent_contact_name)) {
  handleAgentContactChange(form.agent_contact_id)
}
syncAgentToRows()
}

const goToStaffManage = () => {
  router.push({
    name: 'settings.serviceStaff',
    query: {
      from: 'create-order'
    }
  })
}

const goToAgentManage = () => {
  router.push({
    name: 'agent.index',
    query: {
      from: 'create-order'
    }
  })
}

// ==================== 初始化数据 ====================
/**
 * 加载数据
 */
const loadData = () => {
  const agents = db.getAgents() || []
  agentListData.value = agents
  filteredAgentList.value = agents
  
  // 🔥 实时拉取客服列表（页面级真理源）
  loadStaffOptions()
  
const contactCollector = []

agents.forEach(company => {
  ;(company.contacts || []).forEach(con => {
    // ✅ 联系人ID统一规则（你现在其实已经在用这个规则）
    const contactId = `${company.id}_${con.name}`

    contactCollector.push({
      id: contactId,
      name: con.name,
      company_id: company.id,
      company_name: company.name
    })
  })
})


contactOptions.value = contactCollector
  
  if (route.query.staffName) {
    form.service_staff = route.query.staffName
  }
  
  if (!form.id && !form.order_no) {
    updateOrderNo()
  }
  
  if (!form.customers || form.customers.length === 0) {
    addRow()
  } else {
    form.customers = ensureDataFields(form.customers)
  }
}

// 页面从别的路由切回来时刷新
if (!staffHookRegistered) {
  router.afterEach(() => {
    loadStaffOptions()
  })
  staffHookRegistered = true
}

window.addEventListener('focus', loadStaffOptions)

// ==================== 生命周期 ====================
onMounted(() => {
  loadData()
  // ===============================
  // ⭐ 多租户：代理自动锁定公司
  // ===============================
  if (currentUser?.role === 'agent') {
    const agents = db.getAgents()
    const myCompany = agents.find(
      a => String(a.id) === String(currentUser.agent_company_id)
    )
    
    if (myCompany) {
form.agent_company_id = myCompany.id
form.agent_company_name = myCompany.name

// 你现有系统里 currentUser.id 就当作 contact_id 使用（保持一致）
form.agent_contact_id = currentUser.id
form.agent_contact_name = currentUser.name
      
      nextTick(() => {
        form.agent_company_locked = true
      })
    }
  }
  
  // 编辑模式
  if (route.query.id) {
    isEditMode.value = true
    loadOrderById(route.query.id)
  } else {
    // 新建模式
    if (!form.order_no) updateOrderNo()
    if (!form.customers.length) addRow()
  }
  
  nextTick(() => {
    console.log('OrderTable ref:', orderTableRef.value)
    if (orderTableRef.value) {
      console.log('表格组件已正确加载')
    }
    nextTick(() => {
      formSnapshot = JSON.stringify(form)
    })
  })
  // ===============================
  // 代理禁止编辑订单
  // ===============================
  if (currentUser?.role === 'agent' && route.query.id) {
    ElMessage.error('代理账号不允许编辑订单')
    router.push({ name: 'business.orders' })
  }
})

watch(
  form,
  () => {
    isDirty.value = JSON.stringify(form) !== formSnapshot
  },
  { deep: true }
)

watch(
  () => route.query.id,
  (newId, oldId) => {
    if (!newId || newId === oldId) return
    
    // 🔥 切换为编辑模式
    isEditMode.value = true
    
    // 🔥 清空表单
    Object.assign(form, {
      id: null,
      order_no: '',
      created_at: '',
      agent_company: '',
      agent_id: '',
      service_staff: '',
      remark: '',
      customers: [],
      order_type: 'notify',
      status: 'Draft',
      source_order_id: null,
      linked_order_id: null,
      converted_at: null,
      confirmed_at: null
    })
    
    // 🔥 加载新订单
    nextTick(() => {
      loadOrderById(newId)
      formSnapshot = JSON.stringify(form)
      isDirty.value = false
    })
  }
)

const isHistoryNotifyOrder = () => {
  return orderClass.value === 'history-notify'
}

const handleCreateNew = () => {
  const doReset = () => {
    // 重置表单
    Object.assign(form, {
      id: null,
      order_no: '',
      created_at: new Date().toISOString().split('T')[0],
      
agent_company_id: null,
agent_company_name: '',
agent_contact_id: '',
agent_contact_name: '',

      service_staff: '',
      remark: '',
      customers: [],
      
      status: 'Pending',
      
      // 🔥 身份必须重置
      order_type: 'notify',
      source_order_id: null,
      linked_order_id: null,
      converted_at: null,
      confirmed_at: null
    })
    
    // 生成新订单号 + 默认一行
    nextTick(() => {
      updateOrderNo()
      addRow()
      currentModule.value = 'all'
      isEditMode.value = false
      formSnapshot = JSON.stringify(form)
      isDirty.value = false
    })
    
    ElMessage.success('已新建空白订单')
  }
  
  if (isDirty.value) {
    ElMessageBox.confirm(
      '当前订单尚未保存，是否放弃修改并新建订单？',
      '未保存提醒',
      { type: 'warning' }
    ).then(doReset)
  } else {
    doReset()
  }
}
</script>

<style scoped>
.title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-text {
  font-size: 18px;
  font-weight: 700;
}

.title-badge {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 999px;
  white-space: nowrap;
}

.title-badge.history {
  background: #334155;
  color: #e2e8f0;
}

.title-badge.confirmed {
  background: #1d4ed8;
  color: white;
}

.title-badge.notify {
  background: #f59e0b;
  color: #1f2933;
}

.order-status-bar {
  margin-top: 8px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.status {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 999px;
}

.status.history {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #cbd5f5;
}

.status.confirmed {
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #93c5fd;
}

.status.notify {
  background: #fffbeb;
  color: #92400e;
  border: 1px solid #fde68a;
}

.create-order-page { 
  height: 100%;
  min-height: 0;  
  display: flex; 
  flex-direction: column; 
  position: relative; 
}

.logic-flex-wrapper { 
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0; /* 🔥 滚动生死线 */
}

.page-content-wrapper {
  flex: 1;
  height: 100%;     /* 🔥 必须补这一句 */
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;   /* 🔥 关键：不要让外层滚 */
}

.top-settings-bar { 
  padding: 8px 20px; 
  background: #fff; 
  flex-shrink: 0; 
  display: flex; 
  align-items: center; 
  gap: 15px; 
  border-bottom: 1px solid #e5e7eb; 
}

.sub-control-bar { 
  padding: 5px 20px; 
  background: #f8fafc; 
  flex-shrink: 0; 
  display: flex; 
  align-items: center; 
  justify-content: space-between; 
  border-bottom: 1px solid #e5e7eb; 
}

.action-btns {
  display: flex;
  gap: 10px;
}

.table-main-area {
  flex: 1;            /* 🔥 关键 */
  min-height: 0;      /* 🔥 关键 */
  overflow: hidden;   /* 🔥 关键：滚动交给表格内部 */
  display: flex;      /* 🔥 关键：让 OrderTable 撑满 */
}

.footer-black-bar { 
  height: 60px; 
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); 
  display: flex; 
  align-items: center; 
  justify-content: space-between; 
  padding: 0 20px; 
  flex-shrink: 0; 
  border-top: 1px solid rgba(255, 255, 255, 0.1); 
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2); 
}

.footer-left { 
  flex: 1; 
  display: flex; 
  align-items: center; 
}

.remark-section { 
  display: flex; 
  align-items: center; 
  gap: 10px; 
  background: rgba(255, 255, 255, 0.05); 
  border-radius: 8px; 
  padding: 6px 12px; 
  border: 1px solid rgba(255, 255, 255, 0.1); 
  transition: all 0.3s ease; 
  width: 100%; 
  max-width: 400px; 
}

.remark-container { 
  flex: 1; 
  display: flex; 
  flex-direction: column; 
  min-width: 0; 
}

.remark-label { 
  font-size: 11px; 
  color: #94a3b8; 
  font-weight: 500; 
  margin-bottom: 2px; 
  white-space: nowrap; 
}

.dark-remark-input :deep(.el-input__wrapper) { 
  background: transparent; 
  box-shadow: none; 
  padding: 0; 
  height: 22px; 
}

.dark-remark-input :deep(.el-input__inner) { 
  color: #e2e8f0; 
  font-size: 13px; 
  padding: 0; 
  height: 22px; 
  line-height: 22px; 
}

.footer-center { 
  flex: 2; 
  display: flex; 
  justify-content: center; 
}

.footer-stats-grid { 
  display: grid; 
  grid-template-columns: repeat(4, auto); 
  gap: 24px; 
  align-items: center; 
}

.stat-item { 
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  min-width: 120px; 
}

.stat-label { 
  font-size: 11px; 
  color: #94a3b8; 
  font-weight: 500; 
  margin-bottom: 2px; 
  white-space: nowrap; 
}

.stat-value { 
  font-size: 14px; 
  font-weight: 600; 
  color: #e2e8f0; 
  white-space: nowrap; 
}

.stat-value.highlight { 
  color: #fbbf24; 
  font-size: 16px; 
  font-weight: 700; 
}

.footer-right { 
  flex: 1; 
  display: flex; 
  justify-content: flex-end; 
}

.footer-actions { 
  display: flex; 
  align-items: center; 
  gap: 12px; 
}

.footer-action-btn { 
  background: rgba(255, 255, 255, 0.05); 
  border: 1px solid rgba(255, 255, 255, 0.1); 
  color: #e2e8f0; 
}

.field-label { 
  font-size: 12px; 
  font-weight: 600; 
  color: #64748b; 
  margin-right: 4px; 
  white-space: nowrap;
}

.font-mono-bold { 
  font-family: monospace; 
  font-weight: 700; 
  color: #2563eb; 
}

.order-table-fill {
  flex: 1;
  min-height: 0;
  display: flex;
}

.staff-select-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
}

.staff-manage-btn {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
}

.staff-manage-btn:hover {
  background: #e0f2fe;
  border-color: #38bdf8;
}

.field-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.inline-input-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
}

.inline-input-wrapper {
  min-width: 220px;
}
</style>