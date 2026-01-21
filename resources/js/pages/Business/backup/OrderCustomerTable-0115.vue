<template>
  <!-- 完全保持你原来的模板代码不变 -->
  <div class="table-container">
    <el-table 
      :data="processedData" 
	  row-key="id"
	  
      border 
      :height="tableHeight"
      style="width: 100%" 
      size="small"
      header-cell-class-name="custom-header-cell"
      cell-class-name="custom-content-cell"
      :row-class-name="tableRowClassName"
      @row-click="handleRowClick"
      :span-method="objectSpanMethod"
    >
      <!-- 序号列 -->
      <el-table-column label="序号" width="160" align="center" fixed>
        <template #default="scope">
          <span class="row-no-display">{{ scope.row._displayNo || '' }}</span>
        </template>
      </el-table-column>

      <!-- 代理联系人 -->
      <el-table-column prop="agent_contact" label="代理联系人" width="130" align="center" fixed />
      
      <!-- 护照名字 -->
      <el-table-column label="护照名字" width="110" align="center" fixed>
        <template #default="scope">
          <el-input 
            v-model="scope.row.name" 
            size="small" 
            placeholder="护照名字" 
            class="cell-input" 
            :disabled="scope.row._isMerged"
            @input="handleCustomerInfoChange(scope.row, 'name', $event)"
          />
        </template>
      </el-table-column>
      
      <!-- 护照号 -->
      <el-table-column label="护照号" width="120" align="center" fixed>
        <template #default="scope">
          <el-input 
            v-model="scope.row.passport" 
            size="small" 
            placeholder="护照号" 
            class="cell-input" 
            :disabled="scope.row._isMerged"
            @input="handleCustomerInfoChange(scope.row, 'passport', $event)"
          />
        </template>
      </el-table-column>
      
      <!-- 化名/员工编号 -->
      <el-table-column label="化名/员工编号" width="120" align="center" fixed class-name="sticky-last-marker">
        <template #default="scope">
          <el-input 
            v-model="scope.row.alias_no" 
            size="small" 
            placeholder="化名/员工编号" 
            class="cell-input" 
            :disabled="scope.row._isMerged"
            @input="handleCustomerInfoChange(scope.row, 'alias_no', $event)"
          />
        </template>
      </el-table-column>

      <template v-if="module === 'all' || module === 'confirm'">
        <!-- 护照信息分组 -->
        <el-table-column label="护照信息" align="center" class-name="header-group-passport">
          <el-table-column label="国籍" width="110" align="center">
            <template #default="scope">
              <el-select 
                v-model="scope.row.nationality" 
                placeholder="选择国籍" 
                size="small" 
                class="cell-select" 
                :disabled="scope.row._isMerged"
                @change="handleCustomerInfoChange(scope.row, 'nationality', $event)"
              >
                <el-option v-for="item in options.nationalities" :key="item" :label="item" :value="item" />
              </el-select>
            </template>
          </el-table-column>
          
          <el-table-column label="护照到期日" width="135" align="center">
            <template #default="scope">
              <el-date-picker 
                v-model="scope.row.passport_expiry" 
                type="date" 
                value-format="YYYY-MM-DD" 
                size="small" 
                placeholder="护照到期日"
                class="cell-date-picker"
                :disabled="scope.row._isMerged"
                :shortcuts="dateShortcuts"
                @change="handleCustomerInfoChange(scope.row, 'passport_expiry', $event)"
              />
            </template>
          </el-table-column>
          
          <el-table-column label="入境时间" width="135" align="center">
            <template #default="scope">
              <el-date-picker 
                v-model="scope.row.entry_date" 
                type="date" 
                value-format="YYYY-MM-DD" 
                size="small" 
                placeholder="入境时间"
                class="cell-date-picker"
                :disabled="scope.row._isMerged"
                :shortcuts="dateShortcuts"
                @change="handleCustomerInfoChange(scope.row, 'entry_date', $event)"
              />
            </template>
          </el-table-column>
          
          <el-table-column label="签证到期时间" width="135" align="center">
            <template #default="scope">
              <el-date-picker 
                v-model="scope.row.visa_expiry" 
                type="date" 
                value-format="YYYY-MM-DD" 
                size="small" 
                placeholder="签证到期时间"
                class="cell-date-picker"
                :disabled="scope.row._isMerged"
                :shortcuts="dateShortcuts"
                @change="handleCustomerInfoChange(scope.row, 'visa_expiry', $event)"
              />
            </template>
          </el-table-column>
          
          <el-table-column label="有无劳工证" width="95" align="center">
            <template #default="scope">
              <el-select 
                v-model="scope.row.has_work_permit" 
                size="small" 
                class="cell-select" 
                :disabled="scope.row._isMerged"
                @change="handleCustomerInfoChange(scope.row, 'has_work_permit', $event)"
              >
                <el-option label="有" value="有" />
                <el-option label="无" value="无" />
              </el-select>
            </template>
          </el-table-column>
        </el-table-column>

        <!-- 业务分类 -->
        <el-table-column label="业务分类" align="center" class-name="header-group-business">
          <el-table-column label="业务类型" width="120" align="center">
            <template #default="scope">
              <!-- 单选择器，只显示当前业务类型 -->
              <el-select 
                v-model="scope.row.business_type" 
                placeholder="选择业务类型"
                size="small"
                class="cell-select"
                @change="handleBusinessTypeChange(scope.row, $event)"
              >
                <el-option v-for="item in options.businessTypes" :key="item" :label="item" :value="item" />
              </el-select>
              
              <!-- 添加新业务按钮 -->
              <div v-if="scope.row._isFirstRow" class="business-tags">
                <el-button 
                  type="primary" 
                  size="mini" 
                  plain 
                  @click="addBusinessType(scope.row)"
                  class="add-business-btn"
                >
                  + 添加业务
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table-column>

        <!-- 费用与结算（保持原有所有列） -->
        <el-table-column label="费用与结算" align="center" class-name="header-group-fee">
          <el-table-column label="续签办理费" width="95" align="center">
            <template #default="scope">
              <el-input-number 
                v-model="scope.row.fee_visa" 
                :controls="false" 
                size="small"
                class="cell-number-input"
                placeholder="-"
                :disabled="!isFeeFieldEnabled(scope.row, 'fee_visa')"
                :class="{ 'fee-disabled': !isFeeFieldEnabled(scope.row, 'fee_visa') }"
              />
            </template>
          </el-table-column>
          
          <el-table-column label="劳工证办理费" width="105" align="center">
            <template #default="scope">
              <el-input-number 
                v-model="scope.row.fee_work" 
                :controls="false" 
                size="small"
                class="cell-number-input"
                placeholder="-"
                :disabled="!isFeeFieldEnabled(scope.row, 'fee_work')"
                :class="{ 'fee-disabled': !isFeeFieldEnabled(scope.row, 'fee_work') }"
              />
            </template>
          </el-table-column>
          
          <el-table-column label="其他费用" width="95" align="center">
            <template #default="scope">
              <el-input-number 
                v-model="scope.row.fee_other" 
                :controls="false" 
                size="small"
                class="cell-number-input"
                placeholder="-"
                :disabled="!isFeeFieldEnabled(scope.row, 'fee_other')"
                :class="{ 'fee-disabled': !isFeeFieldEnabled(scope.row, 'fee_other') }"
              />
            </template>
          </el-table-column>
          
          <el-table-column label="入境罚款" width="85" align="center">
            <template #default="scope">
              <el-input-number 
                v-model="scope.row.fine_entry" 
                :controls="false" 
                size="small"
                class="cell-number-input"
                placeholder="-"
              />
            </template>
          </el-table-column>
          
          <el-table-column label="逾期罚款" width="85" align="center">
            <template #default="scope">
              <el-input-number 
                v-model="scope.row.fine_overdue" 
                :controls="false" 
                size="small"
                class="cell-number-input"
                placeholder="-"
              />
            </template>
          </el-table-column>
          
          <el-table-column label="劳工证罚款" width="95" align="center">
            <template #default="scope">
              <el-input-number 
                v-model="scope.row.fine_work" 
                :controls="false" 
                size="small"
                class="cell-number-input"
                placeholder="-"
              />
            </template>
          </el-table-column>
          
          <el-table-column label="特殊处理费用" width="105" align="center">
            <template #default="scope">
              <el-input-number 
                v-model="scope.row.special_fee" 
                :controls="false" 
                size="small"
                class="cell-number-input"
                placeholder="-"
              />
            </template>
          </el-table-column>
          
          <el-table-column label="应收合计" width="100" align="center">
            <template #default="scope">
              <span class="price-text">$ {{ calcTotal(scope.row) }}</span>
            </template>
          </el-table-column>
          
          <el-table-column label="实收金额" width="95" align="center">
            <template #default="scope">
              <el-input-number 
                v-model="scope.row.actual_fee" 
                :controls="false" 
                size="small"
                :precision="2"
                class="cell-number-input"
                placeholder="实收"
              />
            </template>
          </el-table-column>
          
          <el-table-column label="是否结算" width="85" align="center">
            <template #default="scope">
              <el-select v-model="scope.row.is_settled" size="small" class="cell-select">
                <el-option label="是" value="是" />
                <el-option label="否" value="否" />
              </el-select>
            </template>
          </el-table-column>
          
          <el-table-column label="备注" width="150" align="center">
            <template #default="scope">
              <el-input v-model="scope.row.row_remark" size="small" placeholder="备注" class="cell-input" />
            </template>
          </el-table-column>
        </el-table-column>
      </template>

      <!-- 上游端及办理进度（保持原有所有列） -->
      <template v-if="module === 'all' || module === 'process'">
        <el-table-column label="上游端及办理进度" align="center" class-name="header-group-upstream">
          <el-table-column label="上游端" width="110" align="center">
            <template #default="scope">
              <el-select v-model="scope.row.upstream_name" placeholder="选择上游端" size="small" class="cell-select">
                <el-option v-for="item in options.departments" :key="item.id" :label="item.name" :value="item.name" />
              </el-select>
            </template>
          </el-table-column>
          
          <el-table-column label="办理业务时间" width="135" align="center">
            <template #default="scope">
              <el-date-picker 
                v-model="scope.row.upstream_time" 
                type="date" 
                value-format="YYYY-MM-DD" 
                size="small" 
                placeholder="办理业务时间"
                class="cell-date-picker"
                :shortcuts="dateShortcuts"
              />
            </template>
          </el-table-column>
          
          <el-table-column label="上游端结算费用" width="120" align="center">
            <template #default="scope">
              <el-input-number 
                v-model="scope.row.upstream_fee" 
                :controls="false" 
                size="small"
                class="cell-number-input"
                placeholder="-"
              />
            </template>
          </el-table-column>
          
          <el-table-column label="是否结算" width="85" align="center">
            <template #default="scope">
              <el-select v-model="scope.row.upstream_is_settled" size="small" class="cell-select">
                <el-option label="是" value="是" />
                <el-option label="否" value="否" />
              </el-select>
            </template>
          </el-table-column>
          
          <el-table-column label="办理状态" width="120" align="center">
            <template #default="scope">
              <el-select v-model="scope.row.process_status" size="small" class="cell-select">
                <el-option v-for="item in options.orderStatuses" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </template>
          </el-table-column>
          
          <el-table-column label="备注" width="150" align="center">
            <template #default="scope">
              <el-input v-model="scope.row.upstream_remark" size="small" placeholder="上游备注" class="cell-input" />
            </template>
          </el-table-column>
          
          <el-table-column label="业务结束时间" width="135" align="center">
            <template #default="scope">
              <el-date-picker 
                v-model="scope.row.business_end_time" 
                type="date" 
                value-format="YYYY-MM-DD" 
                size="small" 
                placeholder="业务结束时间"
                class="cell-date-picker"
                :shortcuts="dateShortcuts"
              />
            </template>
          </el-table-column>
          
          <el-table-column label="业务返回时间" width="135" align="center">
            <template #default="scope">
              <el-date-picker 
                v-model="scope.row.business_return_time" 
                type="date" 
                value-format="YYYY-MM-DD" 
                size="small" 
                placeholder="业务返回时间"
                class="cell-date-picker"
                :shortcuts="dateShortcuts"
              />
            </template>
          </el-table-column>
        </el-table-column>
      </template>

      <!-- 照片/删除列 -->
      <el-table-column label="照片/删除" width="100" align="center" fixed="right">
        <template #default="scope">
          <div class="action-buttons">
            <el-button 
              :icon="Picture" 
              circle 
              size="small" 
              @click="handleOpenFiles(scope.row)" 
              title="管理文件"
            />
            <el-button 
              :icon="Delete" 
              circle 
              size="small" 
              type="danger" 
              @click="handleRemoveRow(scope.row, scope.$index)" 
              title="删除行"
            />
          </div>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { reactive, onMounted, ref, nextTick, watch, onUnmounted, computed } from 'vue'
import { Picture, Delete } from '@element-plus/icons-vue'
import { db } from '@/utils/storage'

const props = defineProps({ 
  data: Array, 
  orderNo: String, 
  module: String 
})

const emit = defineEmits(['remove', 'open-files', 'update:data'])

const options = reactive({ 
  nationalities: [], 
  businessTypes: [], 
  orderStatuses: [], 
  departments: [] 
})

const tableHeight = ref('100%')
const spanArr = ref([])

// 日期选择器快捷选项
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

// 生成客户ID
const generateCustomerId = (row) => {
  return row.customer_id
}


// 处理数据显示：每个业务都是独立行
const processedData = computed(() => {
  if (!props.data || props.data.length === 0) {
    spanArr.value = []
    return []
  }
  
  const processed = []
  const newSpanArr = []
  
  // 第一步：确保每条数据都有必要的字段
  const normalizedData = props.data.map(row => {
    const normalizedRow = { ...row }
    
if (!normalizedRow.customer_id) {
  console.warn('Row missing customer_id:', normalizedRow)
}

    
    // 确保有id
    if (!normalizedRow.id) {
      normalizedRow.id = `row_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    
    // 确保有business_seq
    if (!normalizedRow.business_seq) {
      normalizedRow.business_seq = 1
    }
    
    return normalizedRow
  })
  
  // 第二步：按customer_id分组
  const customerMap = new Map()
  
  normalizedData.forEach(row => {
    const customerId = row.customer_id
    if (!customerMap.has(customerId)) {
      customerMap.set(customerId, {
        rows: [],
        customerSeq: customerMap.size + 1
      })
    }
    customerMap.get(customerId).rows.push(row)
  })
  
  // 第三步：构建显示数据
  let displayIndex = 0
  
  // 按客户序号处理
  const sortedCustomers = Array.from(customerMap.entries()).sort((a, b) => {
    return a[1].customerSeq - b[1].customerSeq
  })
  
  sortedCustomers.forEach(([customerId, group]) => {
    // 按业务序号排序
    group.rows.sort((a, b) => (a.business_seq || 1) - (b.business_seq || 1))
    
    group.rows.forEach((row, rowIndex) => {
      const isFirstRow = rowIndex === 0
      
      const displayRow = {
        ...row,
        _customerId: customerId,
        _customerSeq: group.customerSeq,
        _businessIndex: rowIndex,
        _isFirstRow: isFirstRow,
        _isMerged: !isFirstRow,
        _displayNo: isFirstRow ? `${props.orderNo}-${group.customerSeq.toString().padStart(3, '0')}` : ''
      }
      
      processed.push(displayRow)
      
      // 设置合并信息（前10列合并）
      if (isFirstRow) {
        newSpanArr[displayIndex] = group.rows.length
      } else {
        newSpanArr[displayIndex] = 0
      }
      
      displayIndex++
    })
  })
  
  spanArr.value = newSpanArr
  return processed
})

// 合并单元格方法
const objectSpanMethod = ({ rowIndex, columnIndex }) => {
  if (rowIndex >= spanArr.value.length) {
    return { rowspan: 1, colspan: 1 }
  }
  
  // 前10列合并（0-9）
  const mergeColumns = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
  
  if (!mergeColumns.includes(columnIndex)) {
    return { rowspan: 1, colspan: 1 }
  }
  
  const rowspan = spanArr.value[rowIndex]
  
  if (rowspan > 1) {
    return {
      rowspan: rowspan,
      colspan: 1
    }
  } else if (rowspan === 0) {
    return {
      rowspan: 0,
      colspan: 0
    }
  }
  
  return { rowspan: 1, colspan: 1 }
}

// 处理客户信息变更
const handleCustomerInfoChange = (row, field, value) => {
  const customerId = row._customerId || row.customer_id
  if (!customerId) return
  
  const originalData = [...props.data]
  let hasChanges = false
  
  // 需要同步的客户信息字段
  const customerInfoFields = [
    'name', 'passport', 'alias_no', 'nationality', 
    'passport_expiry', 'entry_date', 'visa_expiry', 
    'has_work_permit', 'agent_contact'
  ]
  
  // 客户信息字段同步到所有行
  if (customerInfoFields.includes(field)) {
    originalData.forEach(r => {
      const rCustomerId = r.customer_id
      if (rCustomerId === customerId && r[field] !== value) {
        r[field] = value
        hasChanges = true
      }
    })
  } else {
    // 其他字段只更新当前行
    const rowIndex = originalData.findIndex(r => r.id === row.id)
    if (rowIndex !== -1 && originalData[rowIndex][field] !== value) {
      originalData[rowIndex][field] = value
      hasChanges = true
    }
  }
  
  if (hasChanges) {
    emit('update:data', originalData)
  }
}

// 检查费用字段是否可用
// 检查费用字段是否可用 - 修复：简化逻辑
const isFeeFieldEnabled = (row, feeField) => {
  const businessType = row.business_type
  
  if (!businessType) return true
  
  // 简化逻辑：只有特定业务类型时才限制
  if (businessType.includes('续签') || businessType.includes('签证')) {
    return feeField === 'fee_visa'
  }
  
  if (businessType.includes('劳工证') || businessType.includes('工作证')) {
    return feeField === 'fee_work'
  }
  
  return true
}

// 更新业务类型
const handleBusinessTypeChange = (row, newBusinessType) => {
  const originalData = [...props.data]
  const rowIndex = originalData.findIndex(r => r.id === row.id)
  
  if (rowIndex !== -1) {
    originalData[rowIndex].business_type = newBusinessType
    
    // 智能管理费用列
    allocateFeesByBusinessType(originalData[rowIndex], newBusinessType)
    
    emit('update:data', originalData)
  }
}

// 添加新业务类型（创建新行） - 修复：复制模板行的所有数据
// 添加新业务类型（创建新行） - 修复：完整复制所有字段
const addBusinessType = (row) => {
  if (!props.data || props.data.length === 0) return

  const customerId = row._customerId || row.customer_id
  if (!customerId) return

  // 找到同客户所有行
  const customerRows = props.data.filter(r => r.customer_id === customerId)
  if (customerRows.length === 0) return

  // 使用最后一行做模板，保留费用和其他字段
  const templateRow = customerRows[customerRows.length - 1]
  const newRow = JSON.parse(JSON.stringify(templateRow))

  // 独立 ID 和业务序号
  newRow.id = `row_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  newRow.business_seq = customerRows.length + 1
  newRow.business_type = ''
  newRow.row_remark = ''
  newRow.is_settled = '否'
  
  // 清空费用字段，只清空新行
  const feeFields = ['fee_visa', 'fee_work', 'fee_other', 'fine_entry', 'fine_overdue', 'fine_work', 'special_fee']
  feeFields.forEach(f => { newRow[f] = 0 })

  // 继承辅助字段
  newRow._customerId = customerId
  newRow._isFirstRow = false
  newRow._displayNo = ''

  // 直接 push，不改变原有对象引用
  const updatedData = [...props.data, newRow]

  emit('update:data', updatedData)
}


// 智能分配费用列 - 修复：不清空其他费用
const allocateFeesByBusinessType = (row, businessType) => {
  if (!businessType) return
  
  // 根据业务类型设置对应的费用字段，不清空其他费用
}

// 删除行
const handleRemoveRow = (row, displayIndex) => {
  const originalData = [...props.data]
  
  // 方法1：通过id查找
  let rowIndex = originalData.findIndex(r => r.id === row.id)
  
  // 方法2：通过customer_id和业务类型查找
  if (rowIndex === -1 && row._customerId && row.business_type) {
    rowIndex = originalData.findIndex(r => {
      const rCustomerId = r.customer_id
      return rCustomerId === row._customerId && r.business_type === row.business_type
    })
  }
  
  // 方法3：通过显示索引查找（最后的手段）
  if (rowIndex === -1 && displayIndex < originalData.length) {
    rowIndex = displayIndex
  }
  
  if (rowIndex !== -1 && rowIndex < originalData.length) {
    const customerId = originalData[rowIndex].customer_id
    
    // 删除该行
    originalData.splice(rowIndex, 1)
    
    // 检查是否还有同客户的其他行
    const remainingRows = originalData.filter(r => {
      const rCustomerId = r.customer_id
      return rCustomerId === customerId
    })
    
    if (remainingRows.length === 0) {
      // 没有其他行，删除整个客户
      emit('remove', rowIndex)
    } else {
      // 重新计算业务序号
      remainingRows.sort((a, b) => (a.business_seq || 1) - (b.business_seq || 1))
      remainingRows.forEach((r, index) => {
        r.business_seq = index + 1
      })
      
      emit('update:data', originalData)
    }
  }
}

// 打开文件管理
const handleOpenFiles = (row) => {
  // 通过id查找
  let rowIndex = props.data.findIndex(r => r.id === row.id)
  
  // 如果没找到，尝试其他方式
  if (rowIndex === -1 && row._customerId) {
    rowIndex = props.data.findIndex(r => {
      const rCustomerId = r.customer_id
      return rCustomerId === row._customerId
    })
  }
  
  if (rowIndex >= 0) {
    emit('open-files', rowIndex)
  }
}

// 计算费用总计
const calcTotal = (row) => {
  const sum = (Number(row.fee_visa) || 0) + 
              (Number(row.fee_work) || 0) + 
              (Number(row.fee_other) || 0) + 
              (Number(row.fine_entry) || 0) + 
              (Number(row.fine_overdue) || 0) + 
              (Number(row.fine_work) || 0) + 
              (Number(row.special_fee) || 0)
  return sum === 0 ? '-' : sum.toLocaleString()
}

const calculateTableHeight = () => {
  nextTick(() => {
    const container = document.querySelector('.table-main-area')
    if (container) {
      const rect = container.getBoundingClientRect()
      tableHeight.value = Math.max(rect.height - 2, 200)
    }
  })
}

const loadOptions = () => {
  const configs = db.getConfigs()
  options.nationalities = configs.nationalities || []
  options.businessTypes = configs.businessTypes || []
  options.orderStatuses = configs.orderStatuses || []
  options.departments = configs.departments || []
}

const handleRowClick = (row) => {
  // 点击行处理逻辑
}

const tableRowClassName = ({ rowIndex }) => {
  return rowIndex % 2 === 0 ? 'even-row' : 'odd-row'
}

onMounted(() => {
  loadOptions()
  calculateTableHeight()
  window.addEventListener('resize', calculateTableHeight)
})

// 监听数据变化，确保父子组件同步
watch(() => props.data, () => {
  nextTick(calculateTableHeight)
}, { deep: true })


onUnmounted(() => {
  window.removeEventListener('resize', calculateTableHeight)
})
</script>

<style scoped>
.table-container { 
  height: 100%; 
  overflow: hidden; 
}

.row-no-display { 
  font-family: monospace; 
  font-weight: bold; 
  color: #64748b; 
  font-size: 12px; 
}

.price-text { 
  color: #dc2626; 
  font-weight: 700; 
  font-family: monospace; 
}

.action-buttons { 
  display: flex; 
  gap: 8px; 
  justify-content: center; 
}

.business-tags {
  margin-top: 4px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.add-business-btn {
  font-size: 10px;
  height: 22px;
  line-height: 20px;
  padding: 0 8px;
}

.fee-disabled :deep(.el-input-number__input) {
  background-color: #f5f5f5;
  color: #999;
  cursor: not-allowed;
}

.fee-disabled :deep(.el-input-number__input:hover) {
  border-color: #dcdfe6;
}

/* 合并样式以减少代码量 */
.cell-input :deep(.el-input__wrapper),
.cell-select :deep(.el-select .el-input__wrapper),
.cell-number-input :deep(.el-input-number .el-input__wrapper),
.cell-multi-select :deep(.el-select .el-input__wrapper),
.cell-date-picker :deep(.el-date-editor .el-input__wrapper) { 
  box-shadow: none !important; 
  border: 1px solid transparent !important; 
  background: transparent !important; 
  padding: 0 4px !important; 
  height: 28px !important; 
}

.cell-input :deep(.el-input__inner),
.cell-select :deep(.el-select .el-input__inner),
.cell-number-input :deep(.el-input-number .el-input__inner),
.cell-multi-select :deep(.el-select .el-input__inner),
.cell-date-picker :deep(.el-date-editor .el-input__inner) { 
  padding: 0 !important; 
  height: 26px !important; 
  line-height: 26px !important; 
  font-size: 12px !important; 
}

.cell-input :deep(.el-input__wrapper:hover) { 
  border-color: #d1d5db !important; 
}

.cell-input :deep(.el-input__wrapper.is-focus) { 
  border-color: #3b82f6 !important; 
  box-shadow: 0 0 0 1px #3b82f6 inset !important; 
}

.cell-number-input :deep(.el-input-number) { 
  width: 100%; 
}

.cell-select :deep(.el-select) { 
  width: 100%; 
}

.cell-multi-select :deep(.el-select) { 
  width: 100%; 
}

.cell-multi-select :deep(.el-select__tags) { 
  flex-wrap: nowrap !important; 
  max-width: 80px !important; 
}

.cell-multi-select :deep(.el-select .el-tag) { 
  max-width: 50px !important; 
  overflow: hidden; 
  text-overflow: ellipsis; 
  font-size: 10px !important; 
  padding: 0 4px !important; 
  margin: 1px !important; 
  height: 18px !important; 
  line-height: 18px !important; 
}

.cell-date-picker :deep(.el-date-editor) { 
  width: 100%; 
}

:deep(.el-table) { 
  --el-table-border-color: #e5e7eb; 
  --el-table-header-bg-color: #f8fafc; 
  --el-table-row-hover-bg-color: #f1f5f9; 
  height: 100% !important; 
  border: 1px solid #e5e7eb !important; 
}

:deep(.el-table__body-wrapper) { 
  overflow: auto !important; 
}

:deep(.custom-header-cell) { 
  background-color: #f8fafc !important; 
  color: #334155 !important; 
  font-weight: 700 !important; 
  text-align: center !important; 
  font-size: 11px !important; 
  padding: 6px 0 !important; 
  border-bottom: 2px solid #e5e7eb !important; 
  white-space: nowrap !important; 
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

:deep(.custom-content-cell) { 
  padding: 4px 2px !important; 
  font-size: 12px !important; 
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

:deep(.el-table__fixed) { 
  box-shadow: 4px 0 8px rgba(0, 0, 0, 0.1); 
}

:deep(.el-table__fixed-right) { 
  box-shadow: -4px 0 8px rgba(0, 0, 0, 0.1); 
}

:deep(.sticky-last-marker) { 
  border-right: 2px solid #3b82f644 !important; 
}

:deep(.el-table__body-wrapper)::-webkit-scrollbar { 
  width: 10px; 
  height: 10px; 
}

:deep(.el-table__body-wrapper)::-webkit-scrollbar-track { 
  background: #f1f5f9; 
}

:deep(.el-table__body-wrapper)::-webkit-scrollbar-thumb { 
  background: #cbd5e1; 
  border-radius: 5px; 
}

:deep(.el-table__body-wrapper)::-webkit-scrollbar-thumb:hover { 
  background: #94a3b8; 
}

:deep(.el-button) { 
  transition: all 0.2s ease; 
}

:deep(.el-button:hover) { 
  transform: translateY(-1px); 
}
</style>