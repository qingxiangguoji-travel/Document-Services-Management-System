<template>
  <!-- 序号列 -->
  <span v-if="column.key === 'seq'" class="row-no-display">{{ row._displayNo || '' }}</span>
  
  <!-- 代理联系人列 -->
  <span v-else-if="column.key === 'agent_contact'">{{ row.agent_contact }}</span>
  
  <!-- 输入框列 -->
  <el-input 
    v-else-if="column.key === 'name' || column.key === 'passport' || column.key === 'alias_no' || column.key === 'row_remark' || column.key === 'upstream_remark'"
    :model-value="getCellValue(row, column.key)"
    size="small" 
    :placeholder="column.label" 
    class="cell-input" 
    :disabled="row._isMerged && isCustomerInfoField(column.key)"
    @update:model-value="value => handleChange(column.key, value)"
  />
  
  <!-- 下拉选择列 -->
  <el-select 
    v-else-if="column.key === 'nationality' || column.key === 'has_work_permit' || column.key === 'business_type' || column.key === 'is_settled' || column.key === 'upstream_name' || column.key === 'upstream_is_settled' || column.key === 'process_status'"
    :model-value="getCellValue(row, column.key)"
    size="small" 
    class="cell-select" 
    :placeholder="`选择${column.label}`"
    :disabled="row._isMerged && isCustomerInfoField(column.key)"
    @update:model-value="value => handleChange(column.key, value)"
  >
    <el-option 
      v-for="item in getOptions(column.key)" 
      :key="getOptionKey(item)" 
      :label="getOptionLabel(item)" 
      :value="getOptionValue(item)" 
    />
  </el-select>
  
  <!-- 日期选择列 -->
  <el-date-picker 
    v-else-if="column.key === 'passport_expiry' || column.key === 'entry_date' || column.key === 'visa_expiry' || column.key === 'upstream_time' || column.key === 'business_end_time' || column.key === 'business_return_time'"
    :model-value="getCellValue(row, column.key)"
    type="date" 
    value-format="YYYY-MM-DD" 
    size="small" 
    :placeholder="column.label"
    class="cell-date-picker"
    :disabled="row._isMerged && isCustomerInfoField(column.key)"
    :shortcuts="dateShortcuts"
    @update:model-value="value => handleChange(column.key, value)"
  />
  
  <!-- 数字输入列 -->
  <el-input-number 
    v-else-if="isNumberField(column.key)"
    :model-value="getCellValue(row, column.key)"
    :controls="false" 
    size="small"
    class="cell-number-input"
    :placeholder="''"
    :disabled="!isFeeEnabled && column.key.startsWith('fee_')"
    :class="{ 'fee-disabled': !isFeeEnabled && column.key.startsWith('fee_') }"
    @update:model-value="value => handleChange(column.key, value)"
  />
  
  <!-- 合计列 -->
  <span v-else-if="column.key === 'total'" class="price-text">
    $ {{ calculateTotal(row) }}
  </span>
  
  <!-- 文本列 -->
  <span v-else>
    {{ getCellValue(row, column.key) }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ColumnDefinition, TableRow } from '../types/table'

interface Props {
  row: TableRow
  column: ColumnDefinition
  options: any
  dateShortcuts: any[]
  isFeeEnabled?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'change', row: TableRow, field: string, value: any): void
}>()

// 获取单元格值
const getCellValue = (row: TableRow, field: string) => {
  return row[field as keyof TableRow]
}

// 获取选项数据
const getOptions = (field: string) => {
  const optionMap: Record<string, string> = {
    nationality: 'nationalities',
    business_type: 'businessTypes',
    process_status: 'orderStatuses',
    upstream_name: 'departments',
  }
  
  const optionKey = optionMap[field]
  
  // 特殊处理的字段
  if (field === 'has_work_permit') {
    return [{ label: '有', value: '有' }, { label: '无', value: '无' }]
  }
  
  if (field === 'is_settled' || field === 'upstream_is_settled') {
    return [{ label: '是', value: '是' }, { label: '否', value: '否' }]
  }
  
  return props.options[optionKey] || []
}

// 获取选项的key
const getOptionKey = (item: any) => {
  if (typeof item === 'string') return item
  return item.id || item.value || item
}

// 获取选项的label
const getOptionLabel = (item: any) => {
  if (typeof item === 'string') return item
  return item.label || item.name || item.value || item
}

// 获取选项的value
const getOptionValue = (item: any) => {
  if (typeof item === 'string') return item
  return item.value || item.name || item
}

// 检查是否是客户信息字段（需要合并的字段）
const isCustomerInfoField = (field: string) => {
  const customerInfoFields = [
    'name', 'passport', 'alias_no', 'nationality',
    'passport_expiry', 'entry_date', 'visa_expiry',
    'has_work_permit', 'agent_contact'
  ]
  return customerInfoFields.includes(field)
}

// 检查是否是数字字段
const isNumberField = (field: string) => {
  const numberFields = [
    'fee_visa', 'fee_work', 'fee_other', 'fine_entry',
    'fine_overdue', 'fine_work', 'special_fee', 'actual_fee',
    'upstream_fee'
  ]
  return numberFields.includes(field)
}

// 计算合计
const calculateTotal = (row: TableRow) => {
  const sum = (Number(row.fee_visa) || 0) + 
              (Number(row.fee_work) || 0) + 
              (Number(row.fee_other) || 0) + 
              (Number(row.fine_entry) || 0) + 
              (Number(row.fine_overdue) || 0) + 
              (Number(row.fine_work) || 0) + 
              (Number(row.special_fee) || 0)
  return sum === 0 ? '' : sum.toLocaleString()
}

// 处理单元格变化
const handleChange = (field: string, value: any) => {
  emit('change', props.row, field, value)
}
</script>

<style scoped>
.row-no-display { 
  font-family: monospace; 
  font-weight: bold; 
  color: #64748b; 
  font-size: 11px !important;
  display: block;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  padding: 0 6px;
  line-height: 1.2;
  letter-spacing: -0.3px;
}

.price-text { 
  color: #dc2626; 
  font-weight: 700; 
  font-family: monospace; 
  font-size: 12px !important;
  display: inline-block;
  min-width: 70px;
  text-align: center;
  white-space: nowrap;
}
</style>