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
  const set = new Set(form.customers.map(c => c.passport).filter(p => p))
  return set.size || form.customers.length
})

const filteredContactOptions = computed(() => {
  if (!form.agent_company) return allContactOptions.value
  return allContactOptions.value.filter(opt => opt.company_name === form.agent_company)
})

const totalAmount = computed(() => {
  return form.customers.reduce((s, c) => {
    // 计算所有业务类型的总费用
    const businessTypes = Array.isArray(c.business_type) ? c.business_type : []
    if (businessTypes.length > 0) {
      // 只计算第一行业务类型对应的费用（避免重复计算）
      return s + 
        (Number(c.fee_visa) || 0) + 
        (Number(c.fee_work) || 0) + 
        (Number(c.fee_other) || 0) + 
        (Number(c.fine_entry) || 0) + 
        (Number(c.fine_overdue) || 0) + 
        (Number(c.fine_work) || 0) + 
        (Number(c.special_fee) || 0)
    }
    return s
  }, 0)
})

const totalActualAmount = computed(() => {
  return form.customers.reduce((s, c) => {
    const businessTypes = Array.isArray(c.business_type) ? c.business_type : []
    if (businessTypes.length > 0) {
      // 只计算第一行业务类型对应的实收金额（避免重复计算）
      return s + (Number(c.actual_fee) || 0)
    }
    return s
  }, 0)
})

const actualProfit = computed(() => {
  const totalUpstream = form.customers.reduce((s, c) => {
    const businessTypes = Array.isArray(c.business_type) ? c.business_type : []
    if (businessTypes.length > 0) {
      // 只计算第一行业务类型对应的上游费用（避免重复计算）
      return s + (Number(c.upstream_fee) || 0)
    }
    return s
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

// 行操作方法
const createEmptyRow = () => ({
  agent_contact: form.agent_id, 
  name: '', 
  passport: '', 
  alias_no: '', 
  nationality: '', 
  passport_expiry: '', 
  entry_date: '', 
  visa_expiry: '', 
  has_work_permit: '无',
  business_type: [], // 业务类型数组（支持多个）
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
})

const addRow = (index = null, mode = 'below') => {
  const newRow = createEmptyRow()
  if (index !== null) {
    const targetIdx = mode === 'above' ? index : index + 1
    form.customers.splice(targetIdx, 0, newRow)
  } else {
    form.customers.push(newRow)
  }
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
  
  // 查找所有同名的客户
  const targetRows = form.customers.filter(c => c.name === customerName)
  
  if (targetRows.length > 0) {
    targetRows.forEach(targetRow => {
      targetRow.files.push({ 
        id: Date.now() + Math.random(), 
        name: fileName, 
        type: fileType, 
        url: '#', 
        uploadTime: new Date().toLocaleString() 
      })
    })
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
  // 定义业务类型到费用列的映射关系
  const feeMapping = {
    '续签': 'fee_visa',
    '签证': 'fee_visa',
    '续签办理': 'fee_visa',
    '劳工证': 'fee_work',
    '工作证': 'fee_work',
    '工作签证': 'fee_work',
    '其他': 'fee_other',
    '其他业务': 'fee_other',
    '补办': 'fee_other',
    '补办证件': 'fee_other'
  }
  
  // 查找匹配的业务类型
  for (const [key, feeColumn] of Object.entries(feeMapping)) {
    if (businessType.includes(key)) {
      return { [feeColumn]: feeData }
    }
  }
  
  // 默认放到其他费用
  return { fee_other: feeData }
}

// 导入导出工具函数
const formatExcelDate = (val) => {
  if (!val) return ""
  let date
  
  if (typeof val === 'number') {
    // Excel日期格式处理
    date = new Date((val - 25569) * 86400 * 1000)
  } else {
    // 字符串日期处理
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

// 导入数据处理 - 支持多业务类型分行，费用按业务类型分配
const handleImport = (uploadFile) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result)
      const workbook = XLSX.read(data, { type: 'array', cellDates: true })
      const json = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: "" })
      
      if (json.length > 0) {
        const customerMap = new Map()
        
        json.forEach((row, index) => {
          // 解析业务类型
          const bTypeRaw = findValueByKeys(row, ['业务类型', 'Type'])
          const bTypes = bTypeRaw ? bTypeRaw.split(/[，,]/).map(t => t.trim()).filter(t => t) : []
          
          // 获取客户信息
          const customerName = findValueByKeys(row, ['名字', '姓名', 'Name', '护照名']) || `客户_${index}`
          const passportNo = findValueByKeys(row, ['护照号', '护照', 'Passport', 'No']) || `passport_${index}`
          const customerKey = `${customerName}_${passportNo}`
          
          // 获取总费用
          const totalFee = Number(findValueByKeys(row, ['总费用', '费用', 'Fee'])) || 0
          
          // 如果客户已存在，合并业务类型
          if (customerMap.has(customerKey)) {
            const existingCustomer = customerMap.get(customerKey)
            // 合并业务类型，去重
            const allBusinessTypes = [...new Set([...existingCustomer.business_type, ...bTypes])]
            existingCustomer.business_type = allBusinessTypes
          } else {
            // 创建新客户
            const customer = createEmptyRow()
            customer.name = customerName
            customer.passport = passportNo
            customer.agent_contact = form.agent_id
            customer.alias_no = findValueByKeys(row, ['化名', '员工编号', 'Alias', 'ID'])
            customer.nationality = findValueByKeys(row, ['国籍', '国家', 'Nationality'])
            customer.passport_expiry = formatExcelDate(findValueByKeys(row, ['护照到期', '护照有效']))
            customer.entry_date = formatExcelDate(findValueByKeys(row, ['入境时间', '入境日期']))
            customer.visa_expiry = formatExcelDate(findValueByKeys(row, ['签证到期', '签证有效']))
            customer.has_work_permit = findValueByKeys(row, ['劳工证', 'Work Permit']) || '无'
            customer.business_type = bTypes
            
            // 如果有业务类型且只有一个，按业务类型分配费用
            if (bTypes.length === 1 && totalFee > 0) {
              const feeAllocation = allocateFeeByBusinessType(bTypes[0], totalFee)
              Object.assign(customer, feeAllocation)
            } else if (bTypes.length > 0) {
              // 多个业务类型，平均分配费用到其他费用列
              customer.fee_other = totalFee
            }
            
            // 其他费用信息
            customer.actual_fee = Number(findValueByKeys(row, ['实收金额', '实收'])) || undefined
            customer.upstream_fee = Number(findValueByKeys(row, ['上游端结算费用', '上游费用'])) || undefined
            
            // 其他信息
            customer.is_settled = findValueByKeys(row, ['结算', '已结']) || '否'
            customer.row_remark = findValueByKeys(row, ['备注', 'Remark'])
            customer.upstream_name = findValueByKeys(row, ['上游端', '上游名称', 'Upstream'])
            customer.upstream_time = formatExcelDate(findValueByKeys(row, ['办理业务时间', '办理业务日期']))
            customer.upstream_is_settled = findValueByKeys(row, ['上游是否结算', '上游结算']) || '否'
            customer.upstream_remark = findValueByKeys(row, ['上游备注'])
            customer.process_status = findValueByKeys(row, ['办理状态', '状态']) || 'Pending'
            customer.business_end_time = formatExcelDate(findValueByKeys(row, ['业务结束时间']))
            customer.business_return_time = formatExcelDate(findValueByKeys(row, ['业务返回时间']))
            
            customerMap.set(customerKey, customer)
          }
        })
        
        // 将Map转换为数组，保持导入顺序
        form.customers = Array.from(customerMap.values())
        currentModule.value = 'all'
        
        ElMessage.success(`成功导入 ${form.customers.length} 个客户，共 ${form.customers.reduce((sum, c) => sum + Math.max(c.business_type?.length || 1, 1), 0)} 条业务记录`)
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

// 导出数据处理 - 导出格式与表格显示一致（前10列合并）
const handleExport = (command) => {
  if (!form.order_no) {
    ElMessage.warning('请先设置订单编号')
    return
  }
  
  const exportData = []
  let customerSequence = 0
  
  // 导出每个客户的每个业务
  form.customers.forEach((customer, customerIndex) => {
    const businessTypes = Array.isArray(customer.business_type) ? customer.business_type : []
    const hasMultipleTypes = businessTypes.length > 1
    
    customerSequence++
    const customerNo = customerSequence
    
    if (hasMultipleTypes) {
      // 多个业务类型：导出格式与表格显示一致
      businessTypes.forEach((businessType, businessIndex) => {
        const row = { 
          '序号': businessIndex === 0 ? `${form.order_no}-${customerNo.toString().padStart(3, '0')}` : '', 
          '代理联系人': businessIndex === 0 ? customer.agent_contact : '', 
          '护照名字': businessIndex === 0 ? customer.name : '', 
          '护照号': businessIndex === 0 ? customer.passport : '', 
          '化名/员工编号': businessIndex === 0 ? customer.alias_no : '', 
          '国籍': businessIndex === 0 ? customer.nationality : '', 
          '护照到期日': businessIndex === 0 ? customer.passport_expiry : '', 
          '入境时间': businessIndex === 0 ? customer.entry_date : '', 
          '签证到期时间': businessIndex === 0 ? customer.visa_expiry : '', 
          '有无劳工证': businessIndex === 0 ? customer.has_work_permit : '', 
          '业务类型': businessType
        }
        
        // 根据业务类型分配费用
        const feeAllocation = allocateFeeByBusinessType(businessType, {})
        
        if (command === 'all' || command === 'confirm') {
          // 费用列只在对应的业务行显示
          Object.assign(row, {
            '续签办理费': feeAllocation.fee_visa || (businessType.includes('续签') ? customer.fee_visa : ''),
            '劳工证办理费': feeAllocation.fee_work || (businessType.includes('劳工证') ? customer.fee_work : ''),
            '其他费用': feeAllocation.fee_other || (businessType.includes('其他') ? customer.fee_other : ''),
            '入境罚款': businessIndex === 0 ? customer.fine_entry : '',
            '逾期罚款': businessIndex === 0 ? customer.fine_overdue : '',
            '劳工证罚款': businessIndex === 0 ? customer.fine_work : '',
            '特殊处理费用': businessIndex === 0 ? customer.special_fee : '',
            '应收合计': businessIndex === 0 ? calcCustomerTotal(customer) : '', // 只在第一行显示
            '是否结算': businessIndex === 0 ? customer.is_settled : '',
            '备注': businessIndex === 0 ? customer.row_remark : ''
          })
        }
        
        if (command === 'all' || command === 'process') {
          // 上游信息只在第一行显示
          if (businessIndex === 0) {
            Object.assign(row, { 
              '上游端': customer.upstream_name, 
              '办理业务时间': customer.upstream_time, 
              '上游端结算费用': customer.upstream_fee, 
              '上游是否结算': customer.upstream_is_settled, 
              '办理状态': customer.process_status, 
              '上游备注': customer.upstream_remark, 
              '业务结束时间': customer.business_end_time, 
              '业务返回时间': customer.business_return_time 
            })
          }
        }
        
        exportData.push(row)
      })
    } else {
      // 单个业务类型或没有业务类型
      const row = { 
        '序号': `${form.order_no}-${customerNo.toString().padStart(3, '0')}`, 
        '代理联系人': customer.agent_contact, 
        '护照名字': customer.name, 
        '护照号': customer.passport, 
        '化名/员工编号': customer.alias_no,
        '国籍': customer.nationality, 
        '护照到期日': customer.passport_expiry, 
        '入境时间': customer.entry_date, 
        '签证到期时间': customer.visa_expiry, 
        '有无劳工证': customer.has_work_permit, 
        '业务类型': businessTypes[0] || '' 
      }
      
      if (command === 'all' || command === 'confirm') {
        Object.assign(row, { 
          '续签办理费': customer.fee_visa, 
          '劳工证办理费': customer.fee_work, 
          '其他费用': customer.fee_other, 
          '入境罚款': customer.fine_entry, 
          '逾期罚款': customer.fine_overdue, 
          '劳工证罚款': customer.fine_work, 
          '特殊处理费用': customer.special_fee, 
          '应收合计': calcCustomerTotal(customer),
          '是否结算': customer.is_settled, 
          '备注': customer.row_remark 
        })
      }
      
      if (command === 'all' || command === 'process') {
        Object.assign(row, { 
          '上游端': customer.upstream_name, 
          '办理业务时间': customer.upstream_time, 
          '上游端结算费用': customer.upstream_fee, 
          '上游是否结算': customer.upstream_is_settled, 
          '办理状态': customer.process_status, 
          '上游备注': customer.upstream_remark, 
          '业务结束时间': customer.business_end_time, 
          '业务返回时间': customer.business_return_time 
        })
      }
      
      exportData.push(row)
    }
  })

  // 添加总计行（不包含实收金额）
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
    { wch: 15 }, // 序号
    { wch: 12 }, // 代理联系人
    { wch: 12 }, // 护照名字
    { wch: 15 }, // 护照号
    { wch: 15 }, // 化名/员工编号
    { wch: 10 }, // 国籍
    { wch: 15 }, // 护照到期日
    { wch: 12 }, // 入境时间
    { wch: 15 }, // 签证到期时间
    { wch: 10 }, // 有无劳工证
    { wch: 12 }, // 业务类型
    { wch: 12 }, // 续签办理费
    { wch: 15 }, // 劳工证办理费
    { wch: 12 }, // 其他费用
    { wch: 12 }, // 入境罚款
    { wch: 12 }, // 逾期罚款
    { wch: 12 }, // 劳工证罚款
    { wch: 15 }, // 特殊处理费用
    { wch: 12 }, // 应收合计
    { wch: 10 }, // 是否结算
    { wch: 20 }  // 备注
  ]
  
  ws['!cols'] = wscols
  
  // 生成文件名并导出
  const fileName = `订单_${form.order_no}_${command}_${new Date().toISOString().slice(0,10)}.xlsx`
  XLSX.writeFile(wb, fileName)
}

// 计算单个客户的总费用
const calcCustomerTotal = (customer) => {
  const sum = (Number(customer.fee_visa) || 0) + 
              (Number(customer.fee_work) || 0) + 
              (Number(customer.fee_other) || 0) + 
              (Number(customer.fine_entry) || 0) + 
              (Number(customer.fine_overdue) || 0) + 
              (Number(customer.fine_work) || 0) + 
              (Number(customer.special_fee) || 0)
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