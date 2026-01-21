<template>
  <el-config-provider :locale="zhCn">
    <div class="create-order-page">
      <PageLayout>
        <template #title>业务订单录入</template>
        <template #subtitle>管理代理订单、客户明细及证件办理进度</template>
        <template #actions>
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
            action="#"
            multiple
            :auto-upload="false"
            :show-file-list="false"
            @change="handleBatchFileUpload"
            style="display: inline-block; margin: 0 10px;"
          >
            <el-button type="warning" :icon="Upload" plain>智能批量上传</el-button>
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
                <span class="field-label">代理公司/个人</span>
                <el-select 
                  v-model="form.agent_company" 
                  placeholder="请选择或输入搜索" 
                  style="width:180px" 
                  clearable
                  filterable
                  remote
                  :remote-method="searchAgents"
                  :loading="agentSearchLoading"
                  @change="handleAgentCompanyChange"
                >
                  <el-option v-for="item in filteredAgentList" :key="item.id" :label="item.name" :value="item.name" />
                </el-select>
              </div>
              <div class="field-item">
                <span class="field-label">代理联系人</span>
                <el-select v-model="form.agent_id" filterable placeholder="选择联系人" style="width:180px" @change="syncAgentToRows">
                  <el-option v-for="a in filteredContactOptions" :key="a.unique_key" :label="a.display_label" :value="a.display_label" />
                </el-select>
              </div>
              <div class="field-item">
                <span class="field-label">开单客服</span>
                <el-select v-model="form.service_staff" placeholder="选择客服" style="width:150px" filterable allow-create>
                  <el-option v-for="staff in staffOptions" :key="staff.id || staff.name" :label="staff.name" :value="staff.name" />
                </el-select>
              </div>
            </div>

            <div class="sub-control-bar">
              <el-radio-group v-model="currentModule" size="default">
                <el-radio-button label="all">全部显示</el-radio-button>
                <el-radio-button label="confirm">确认业务办理</el-radio-button>
                <el-radio-button label="process">办理业务</el-radio-button>
              </el-radio-group>
              <div class="action-btns">
                <el-button type="primary" :icon="Plus" size="small" @click="addRow()">添加客户</el-button>
              </div>
            </div>

            <div class="table-main-area">
<order-customer-table 
  :data="form.customers"
  :order-no="form.order_no"
  :module="currentModule"
  @remove="removeRow"
  @add-row="addRow"
  @add-business="addBusinessToCustomer"
  @open-files="handleFiles"
  @update:data="updateCustomers"
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

      <file-manager-drawer v-model:visible="fileState.show" :customer-data="fileState.data" @save="onFilesSaved" />

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
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElConfigProvider, ElMessageBox } from 'element-plus'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import { Plus, Download, Upload, Printer, Check, EditPen } from '@element-plus/icons-vue'
import PageLayout from '@/layouts/PageLayout.vue'
import OrderCustomerTable from './components/OrderCustomerTable.vue'
import FileManagerDrawer from './components/FileManagerDrawer.vue'
import OrderPrintTemplate from './components/OrderPrintTemplate.vue'
import { db } from '@/utils/storage'
import * as XLSX from 'xlsx'
import { professionalPrint } from './components/print-styles/print-utils'

const router = useRouter()
const route = useRoute()
const saving = ref(false)
const currentModule = ref('all')
const printDialogVisible = ref(false)
const printFields = ref(['fee_visa', 'fee_work', 'special_fee'])

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

// 表单数据
const form = reactive({ 
  id: null, 
  order_no: '', 
  created_at: new Date().toISOString().split('T')[0], 
  agent_company: '', 
  agent_id: '', 
  service_staff: '', 
  remark: '', 
  customers: [], 
  status: 'Pending' 
})

// ============ 新增：数据适配层 ============

// 提取客户信息（纯客户数据）
const extractCustomerInfo = (row) => {
  return {
    id: row.customer_id,
    name: row.name,
    passport: row.passport,
    alias_no: row.alias_no,
    nationality: row.nationality,
    passport_expiry: row.passport_expiry,
    entry_date: row.entry_date,
    visa_expiry: row.visa_expiry,
    has_work_permit: row.has_work_permit,
    agent_contact: row.agent_contact
  }
}

// 提取业务信息（纯业务数据）
const extractBusinessInfo = (row) => {
  return {
    id: row.id,
    customer_id: row.customer_id,
    customer_seq: row.customer_seq || 1,
    business_seq: row.business_seq || 1,
    business_type: row.business_type,
    fee_visa: row.fee_visa,
    fee_work: row.fee_work,
    fee_other: row.fee_other,
    fine_entry: row.fine_entry,
    fine_overdue: row.fine_overdue,
    fine_work: row.fine_work,
    special_fee: row.special_fee,
    actual_fee: row.actual_fee,
    is_settled: row.is_settled || '否',
    row_remark: row.row_remark || '',
    upstream_name: row.upstream_name,
    upstream_time: row.upstream_time,
    upstream_fee: row.upstream_fee,
    upstream_is_settled: row.upstream_is_settled || '否',
    process_status: row.process_status || 'Pending',
    upstream_remark: row.upstream_remark || '',
    business_end_time: row.business_end_time,
    business_return_time: row.business_return_time,
    files: row.files || []
  }
}

// 将标准结构转换回混合结构（向后兼容）
const mergeCustomerBusiness = (customers, businesses) => {
  return businesses.map(business => {
    const customer = customers.find(c => c.id === business.customer_id) || {}
    return {
      ...customer,
      ...business
    }
  })
}

// 数据适配器：将混合数据转换为标准结构
const adaptToStandardStructure = (mixedData) => {
  const customersMap = new Map()
  const businesses = []
  
  mixedData.forEach(row => {
    const customerId = row.customer_id
    if (customerId && !customersMap.has(customerId)) {
      customersMap.set(customerId, extractCustomerInfo(row))
    }
    
    businesses.push(extractBusinessInfo(row))
  })
  
  return {
    customers: Array.from(customersMap.values()),
    businesses
  }
}

// 数据适配器：将标准结构转换回混合数据
const adaptToMixedStructure = (standardData) => {
  return mergeCustomerBusiness(standardData.customers, standardData.businesses)
}

// 代理相关数据
const agentListData = ref([])
const filteredAgentList = ref([])
const agentSearchLoading = ref(false)
const allContactOptions = ref([])
const staffOptions = ref([])

// 文件管理
const fileState = reactive({ show: false, data: null, index: -1 })

// 计算属性
const uniqueCustomerCount = computed(() => {
  const customerIds = new Set(form.customers.map(c => c.customer_id).filter(id => id))
  return customerIds.size || form.customers.length
})

const filteredContactOptions = computed(() => {
  if (!form.agent_company) return allContactOptions.value
  return allContactOptions.value.filter(opt => opt.company_name === form.agent_company)
})

const totalAmount = computed(() => {
  return form.customers.reduce((s, c) => {
    return s + 
      (Number(c.fee_visa) || 0) + 
      (Number(c.fee_work) || 0) + 
      (Number(c.fee_other) || 0) + 
      (Number(c.fine_entry) || 0) + 
      (Number(c.fine_overdue) || 0) + 
      (Number(c.fine_work) || 0) + 
      (Number(c.special_fee) || 0)
  }, 0)
})

const totalActualAmount = computed(() => {
  return form.customers.reduce((s, c) => {
    return s + (Number(c.actual_fee) || 0)
  }, 0)
})

const actualProfit = computed(() => {
  const totalUpstream = form.customers.reduce((s, c) => {
    return s + (Number(c.upstream_fee) || 0)
  }, 0)
  return totalActualAmount.value - totalUpstream
})

// 代理搜索方法
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

// 事件处理方法
const handleAgentCompanyChange = () => {
  form.agent_id = ''
}

const syncAgentToRows = (val) => { 
  form.customers.forEach(c => { 
    c.agent_contact = val 
  }) 
}

const updateOrderNo = () => {
  const prefix = `QX${form.created_at.replace(/-/g, '').substring(2)}`
  const all = db.getRaw('ORDERS') || []
  form.order_no = `${prefix}${(all.filter(o => o.code?.startsWith(prefix)).length + 1).toString().padStart(4, '0')}`
}

const handleDateChange = () => { 
  if (!form.id) updateOrderNo() 
}

// ============ 修改：行操作方法 ============

const createEmptyRow = () => {
  const customerId = `cust_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  // 客户信息
  const customerInfo = {
    id: customerId,
    name: '', 
    passport: '', 
    alias_no: '', 
    nationality: '', 
    passport_expiry: '', 
    entry_date: '', 
    visa_expiry: '', 
    has_work_permit: '无',
    agent_contact: form.agent_id
  }
  
  // 业务信息
  const businessInfo = {
    id: `row_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    customer_id: customerId,
    customer_seq: 1,
    business_seq: 1,
    business_type: '', // 单个业务类型
    fee_visa: undefined, 
    fee_work: undefined, 
    fee_other: undefined, 
    fine_entry: undefined, 
    fine_overdue: undefined, 
    fine_work: undefined, 
    special_fee: undefined,
    actual_fee: undefined, 
    is_settled: '否', 
    row_remark: '', 
    upstream_name: '', 
    upstream_time: '', 
    upstream_fee: undefined,
    upstream_is_settled: '否', 
    process_status: 'Pending', 
    upstream_remark: '', 
    business_end_time: '', 
    business_return_time: '', 
    files: [] 
  }
  
  // 返回混合结构（向后兼容）
  return { ...customerInfo, ...businessInfo }
}

const addRow = (index = null, mode = 'below') => {
  const newRow = createEmptyRow()
  if (index !== null) {
    const targetIdx = mode === 'above' ? index : index + 1
    form.customers.splice(targetIdx, 0, newRow)
  } else {
    form.customers.push(newRow)
  }
}

// 添加业务到现有客户（不添加新客户）
const addBusinessToCustomer = (customerId) => {
  // 转换为标准结构
  const standardData = adaptToStandardStructure(form.customers)
  
  // 找到该客户
  const customer = standardData.customers.find(c => c.id === customerId)
  if (!customer) {
    console.warn('客户不存在:', customerId)
    return
  }
  
  // 找到该客户现有的业务
  const customerBusinesses = standardData.businesses.filter(b => b.customer_id === customerId)
  const nextBusinessSeq = customerBusinesses.length + 1
  
  // 使用第一个业务作为模板（如果有）
  const templateBusiness = customerBusinesses[0] || {}
  
  // 创建新业务（不创建新客户）
  const newBusiness = {
    id: `row_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    customer_id: customerId,
    customer_seq: templateBusiness.customer_seq || 1,
    business_seq: nextBusinessSeq,
    business_type: '',
    // 复制费用字段（用户可以修改）
    fee_visa: templateBusiness.fee_visa,
    fee_work: templateBusiness.fee_work,
    fee_other: templateBusiness.fee_other,
    fine_entry: templateBusiness.fine_entry,
    fine_overdue: templateBusiness.fine_overdue,
    fine_work: templateBusiness.fine_work,
    special_fee: templateBusiness.special_fee,
    actual_fee: templateBusiness.actual_fee,
    is_settled: '否',
    row_remark: '',
    upstream_name: templateBusiness.upstream_name,
    upstream_time: templateBusiness.upstream_time,
    upstream_fee: templateBusiness.upstream_fee,
    upstream_is_settled: '否',
    process_status: 'Pending',
    upstream_remark: '',
    business_end_time: templateBusiness.business_end_time,
    business_return_time: templateBusiness.business_return_time,
    files: templateBusiness.files || []
  }
  
  // 添加新业务
  standardData.businesses.push(newBusiness)
  
  // 转换回混合结构并更新
  form.customers = adaptToMixedStructure(standardData)
}

const removeRow = (idx) => { 
  if(form.customers.length > 1) form.customers.splice(idx, 1) 
}

const updateCustomers = (newCustomers) => {
  form.customers = newCustomers
}

// 处理批量文件上传
const handleBatchFileUpload = (file) => {
  const fileName = file.name
  const parts = fileName.split('_')
  if (parts.length < 2) {
    ElMessage.warning(`文件名格式无法识别: ${fileName}`)
    return
  }
  
  const customerName = parts[0].trim()
  const fileType = parts[1].split('.')[0].trim()
  
  // 转换为标准结构处理
  const standardData = adaptToStandardStructure(form.customers)
  
  // 查找所有同名的客户
  const targetCustomers = standardData.customers.filter(c => c.name === customerName)
  
  if (targetCustomers.length > 0) {
    targetCustomers.forEach(customer => {
      // 为该客户的所有业务添加文件
      standardData.businesses
        .filter(b => b.customer_id === customer.id)
        .forEach(business => {
          business.files.push({ 
            id: Date.now() + Math.random(), 
            name: fileName, 
            type: fileType, 
            url: '#', 
            uploadTime: new Date().toLocaleString() 
          })
        })
    })
    
    // 更新数据
    form.customers = adaptToMixedStructure(standardData)
    ElMessage.success(`自动匹配: [${customerName}]`)
  }
}

// 文件管理
const handleFiles = (idx) => {
  fileState.index = idx
  fileState.data = JSON.parse(JSON.stringify(form.customers[idx]))
  fileState.show = true
}

const onFilesSaved = (files) => { 
  if (fileState.index > -1) {
    form.customers[fileState.index].files = files
  }
}

// 工具函数：识别业务类型并分配到对应费用列
const allocateFeeByBusinessType = (businessType, feeData) => {
  const allocation = {
    fee_visa: undefined,
    fee_work: undefined,
    fee_other: undefined,
    fine_entry: undefined,
    fine_overdue: undefined,
    fine_work: undefined,
    special_fee: undefined
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

// 导入导出工具函数
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

const findValueByKeys = (row, keys) => {
  const rowKeys = Object.keys(row)
  for (const k of keys) {
    const target = k.toLowerCase().replace(/\s/g, '')
    const foundKey = rowKeys.find(rk => rk.toLowerCase().replace(/\s/g, '').includes(target))
    if (foundKey && row[foundKey] !== "") return row[foundKey]
  }
  return ""
}

// ============ 修改：导入逻辑 ============
const handleImport = (uploadFile) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result)
      const workbook = XLSX.read(data, { type: 'array', cellDates: true })
      const json = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: "" })
      
      if (json.length > 0) {
        // 使用标准数据结构
        const standardData = adaptToStandardStructure(form.customers)
        
        json.forEach((row, rowIndex) => {
          // 解析业务类型
          const bTypeRaw = findValueByKeys(row, ['业务类型', 'Type'])
          let bTypes = bTypeRaw ? bTypeRaw.split(/[，,]/).map(t => t.trim()).filter(t => t) : []
          
          if (bTypes.length === 0) {
            bTypes = ['未指定业务']
          }
          
          // 获取客户信息
          const customerName = findValueByKeys(row, ['名字', '姓名', 'Name', '护照名']) || `客户_${rowIndex}`
          const passportNo = findValueByKeys(row, ['护照号', '护照', 'Passport', 'No']) || `passport_${rowIndex}`
          const aliasNo = findValueByKeys(row, ['化名', '员工编号', 'Alias', 'ID'])
          
          // 检查是否已存在该客户
          let customerId = null
          const existingCustomer = standardData.customers.find(c => 
            c.name === customerName && c.passport === passportNo
          )
          
          if (existingCustomer) {
            customerId = existingCustomer.id
          } else {
            // 创建新客户
            customerId = `cust_${Date.now()}_${rowIndex}`
            const newCustomer = {
              id: customerId,
              name: customerName,
              passport: passportNo,
              alias_no: aliasNo,
              nationality: findValueByKeys(row, ['国籍', '国家', 'Nationality']),
              passport_expiry: formatExcelDate(findValueByKeys(row, ['护照到期', '护照有效'])),
              entry_date: formatExcelDate(findValueByKeys(row, ['入境时间', '入境日期'])),
              visa_expiry: formatExcelDate(findValueByKeys(row, ['签证到期', '签证有效'])),
              has_work_permit: findValueByKeys(row, ['劳工证', 'Work Permit']) || '无',
              agent_contact: form.agent_id
            }
            standardData.customers.push(newCustomer)
          }
          
          // 为每个业务类型创建业务记录
          const customerBusinesses = standardData.businesses.filter(b => b.customer_id === customerId)
          const baseBusinessSeq = customerBusinesses.length + 1
          
          bTypes.forEach((businessType, typeIndex) => {
            const totalFee = Number(findValueByKeys(row, ['总费用', '费用', 'Fee'])) || 0
            const feePerBusiness = bTypes.length > 0 ? totalFee / bTypes.length : totalFee
            
            const feeAllocation = allocateFeeByBusinessType(businessType, feePerBusiness)
            
            const actualFee = Number(findValueByKeys(row, ['实收金额', '实收'])) || 0
            const upstreamFee = Number(findValueByKeys(row, ['上游端结算费用', '上游费用'])) || 0
            
            const newBusiness = {
              id: `row_${Date.now()}_${rowIndex}_${typeIndex}`,
              customer_id: customerId,
              customer_seq: standardData.customers.findIndex(c => c.id === customerId) + 1,
              business_seq: baseBusinessSeq + typeIndex,
              business_type: businessType,
              ...feeAllocation,
              actual_fee: bTypes.length > 1 ? actualFee / bTypes.length : actualFee || undefined,
              upstream_fee: bTypes.length > 1 ? upstreamFee / bTypes.length : upstreamFee || undefined,
              is_settled: findValueByKeys(row, ['结算', '已结']) || '否',
              row_remark: findValueByKeys(row, ['备注', 'Remark']),
              upstream_name: findValueByKeys(row, ['上游端', '上游名称', 'Upstream']),
              upstream_time: formatExcelDate(findValueByKeys(row, ['办理业务时间', '办理业务日期'])),
              upstream_is_settled: findValueByKeys(row, ['上游是否结算', '上游结算']) || '否',
              upstream_remark: findValueByKeys(row, ['上游备注']),
              process_status: findValueByKeys(row, ['办理状态', '状态']) || 'Pending',
              business_end_time: formatExcelDate(findValueByKeys(row, ['业务结束时间'])),
              business_return_time: formatExcelDate(findValueByKeys(row, ['业务返回时间'])),
              files: []
            }
            
            standardData.businesses.push(newBusiness)
          })
        })
        
        // 转换回混合结构
        form.customers = adaptToMixedStructure(standardData)
        currentModule.value = 'all'
        
        ElMessage.success(`成功导入 ${standardData.customers.length} 个客户，${standardData.businesses.length} 条业务记录`)
      } else {
        ElMessage.warning('导入文件为空')
      }
    } catch (error) {
      console.error('导入失败:', error)
      ElMessage.error('导入失败，请检查文件格式')
    }
  }
  
  reader.readAsArrayBuffer(uploadFile.raw)
}

// 辅助函数：按客户组织序号
const organizeCustomerSequences = (customers) => {
  // 按客户分组
  const customerGroups = {}
  
  customers.forEach((customer, index) => {
    const customerKey = `${customer.name}_${customer.passport}`
    if (!customerGroups[customerKey]) {
      customerGroups[customerKey] = []
    }
    customerGroups[customerKey].push(customer)
  })
  
  // 为每个客户组设置序号
  let customerSeq = 1
  Object.values(customerGroups).forEach(group => {
    group.forEach((customer, businessIndex) => {
      customer.customer_seq = customerSeq
      customer.business_seq = businessIndex + 1
    })
    customerSeq++
  })
}

// 导出数据处理 - 导出格式与表格显示一致（前10列合并）
const handleExport = (command) => {
  if (!form.order_no) {
    ElMessage.warning('请先设置订单编号')
    return
  }
  
  const exportData = []
  let customerSequence = 0
  
  // 转换为标准结构处理
  const standardData = adaptToStandardStructure(form.customers)
  
  // 按客户分组
  const customerGroups = {}
  standardData.businesses.forEach(business => {
    if (!customerGroups[business.customer_id]) {
      customerGroups[business.customer_id] = []
    }
    customerGroups[business.customer_id].push(business)
  })
  
  // 导出每个客户的每个业务
  Object.entries(customerGroups).forEach(([customerId, businesses], customerIndex) => {
    const customer = standardData.customers.find(c => c.id === customerId)
    if (!customer) return
    
    customerSequence++
    const customerNo = customerSequence
    
    // 按业务序号排序
    businesses.sort((a, b) => (a.business_seq || 1) - (b.business_seq || 1))
    
    businesses.forEach((business, businessIndex) => {
      const isFirstRow = businessIndex === 0
      const row = { 
        '序号': isFirstRow ? `${form.order_no}-${customerNo.toString().padStart(3, '0')}` : '', 
        '代理联系人': isFirstRow ? customer.agent_contact : '', 
        '护照名字': isFirstRow ? customer.name : '', 
        '护照号': isFirstRow ? customer.passport : '', 
        '化名/员工编号': isFirstRow ? customer.alias_no : '', 
        '国籍': isFirstRow ? customer.nationality : '', 
        '护照到期日': isFirstRow ? customer.passport_expiry : '', 
        '入境时间': isFirstRow ? customer.entry_date : '', 
        '签证到期时间': isFirstRow ? customer.visa_expiry : '', 
        '有无劳工证': isFirstRow ? customer.has_work_permit : '', 
        '业务类型': business.business_type || ''
      }
      
      if (command === 'all' || command === 'confirm') {
        Object.assign(row, { 
          '续签办理费': business.fee_visa, 
          '劳工证办理费': business.fee_work, 
          '其他费用': business.fee_other, 
          '入境罚款': isFirstRow ? business.fine_entry : '',
          '逾期罚款': isFirstRow ? business.fine_overdue : '',
          '劳工证罚款': isFirstRow ? business.fine_work : '',
          '特殊处理费用': isFirstRow ? business.special_fee : '',
          '应收合计': isFirstRow ? calcCustomerTotal(business) : '',
          '是否结算': isFirstRow ? business.is_settled : '',
          '备注': isFirstRow ? business.row_remark : ''
        })
      }
      
      if (command === 'all' || command === 'process') {
        if (isFirstRow) {
          Object.assign(row, { 
            '上游端': business.upstream_name, 
            '办理业务时间': business.upstream_time, 
            '上游端结算费用': business.upstream_fee, 
            '上游是否结算': business.upstream_is_settled, 
            '办理状态': business.process_status, 
            '上游备注': business.upstream_remark, 
            '业务结束时间': business.business_end_time, 
            '业务返回时间': business.business_return_time 
          })
        }
      }
      
      exportData.push(row)
    })
  })

  // 添加总计行
  exportData.push({ 
    '序号': '总计', 
    '应收合计': totalAmount.value 
  })

  // 创建工作簿和工作表
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

// 计算单个业务的总费用
const calcCustomerTotal = (business) => {
  const sum = (Number(business.fee_visa) || 0) + 
              (Number(business.fee_work) || 0) + 
              (Number(business.fee_other) || 0) + 
              (Number(business.fine_entry) || 0) + 
              (Number(business.fine_overdue) || 0) + 
              (Number(business.fine_work) || 0) + 
              (Number(business.special_fee) || 0)
  return sum === 0 ? '' : sum
}

// 打印功能
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

// 提交表单
const submitForm = async () => {
  // 验证必填字段
  if (!form.created_at) {
    ElMessage.warning('请选择下单日期')
    return
  }
  
  if (!form.order_no) {
    ElMessage.warning('请输入订单编号')
    return
  }
  
  if (!form.agent_id) {
    ElMessage.warning('请选择代理联系人')
    return
  }
  
  if (!form.service_staff) {
    ElMessage.warning('请选择或录入开单客服')
    return
  }
  
  // 检查订单编号是否重复
  const allOrders = db.getRaw('ORDERS') || []
  if (allOrders.some(o => o.code === form.order_no && o.id !== form.id)) {
    ElMessageBox.alert('该订单编号已存在', '编号重复', { type: 'error' })
    return
  }
  
  // 检查客户信息是否完整
  const hasIncompleteRow = form.customers.some(c => !c.name || !c.passport)
  if (hasIncompleteRow) {
    ElMessage.warning('请确保所有客户的护照名字和护照号已填写')
    return
  }
  
  saving.value = true
  try {
    // 获取代理佣金率
    const agents = db.getAgents() || []
    const currentAgent = agents.find(a => a.name === form.agent_company)
    const snapRate = currentAgent && currentAgent.commission_rate !== undefined ? currentAgent.commission_rate : 10
    
    // 准备保存的数据
    const payload = { 
      ...JSON.parse(JSON.stringify(form)), 
      code: form.order_no, 
      total_fee: totalAmount.value, 
      id: form.id || Date.now(),
      agent_commission_rate: snapRate,
      commission_settled: false,
      created_at: form.created_at,
      updated_at: new Date().toISOString().split('T')[0]
    }
    
    // 保存到数据库
    const updatedOrders = form.id ? 
      allOrders.map(o => o.id === form.id ? payload : o) : 
      [payload, ...allOrders]
    
    db.saveRaw('ORDERS', updatedOrders)
    ElMessage.success('保存成功')
    
    // 跳转到订单列表页
    router.push({ name: 'business.orders' })
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败：' + error.message)
  } finally { 
    saving.value = false 
  }
}

// 初始化数据
const loadData = () => {
  // 加载代理数据
  const agents = db.getAgents() || []
  agentListData.value = agents
  filteredAgentList.value = agents
  
  // 加载员工数据
  staffOptions.value = db.getRaw('STAFF_LIST') || []
  
  // 构建联系人选项
  const contactCollector = []
  agents.forEach(a => {
    if (a.contacts && Array.isArray(a.contacts)) {
      a.contacts.forEach(con => {
        contactCollector.push({ 
          unique_key: `${a.id}-${con.name}`, 
          display_label: `${a.name} - ${con.name}`,
          company_name: a.name 
        })
      })
    }
  })
  allContactOptions.value = contactCollector
  
  // 如果有路由参数，设置开单客服
  if (route.query.staffName) {
    form.service_staff = route.query.staffName
  }
  
  // 生成订单编号
  if (!form.id && !form.order_no) {
    updateOrderNo()
  }
  
  // 确保至少有一行数据
  if (form.customers.length === 0) {
    addRow()
  }
}

// 生命周期
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.create-order-page { 
  height: 100%; 
  display: flex; 
  flex-direction: column; 
  position: relative; 
}

.page-content-wrapper { 
  position: absolute; 
  top: 0; 
  left: 0; 
  right: 0; 
  bottom: 0; 
  display: flex; 
  flex-direction: column; 
}

.logic-flex-wrapper { 
  flex: 1; 
  display: flex; 
  flex-direction: column; 
  overflow: hidden; 
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

.table-main-area { 
  flex: 1; 
  overflow: hidden; 
  background: #fff; 
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

:deep(.page-body) { 
  height: 100% !important; 
  overflow: hidden !important; 
  position: relative; 
}
</style>