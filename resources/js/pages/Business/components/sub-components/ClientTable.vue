<template>
  <div class="client-table-container">
    <el-table
      :data="customers"
      border
      stripe
      style="width: 100%"
      :row-class-name="tableRowClassName"
      v-loading="loading"
    >
      <el-table-column type="index" label="序号" width="60" align="center" fixed />
      
      <el-table-column prop="name" label="客户姓名" width="150" fixed>
        <template #default="{ row, $index }">
          <el-form-item
            :prop="`customers[${$index}].name`"
            :rules="[{ required: true, message: '请输入客户姓名', trigger: 'blur' }]"
            class="table-form-item"
          >
            <el-input
              v-model="row.name"
              placeholder="请输入客户姓名"
              size="small"
              @blur="$emit('validate-field', $index, 'name')"
            />
          </el-form-item>
        </template>
      </el-table-column>

      <el-table-column prop="passport" label="护照号" width="180">
        <template #default="{ row, $index }">
          <el-form-item
            :prop="`customers[${$index}].passport`"
            :rules="[{ required: true, message: '请输入护照号', trigger: 'blur' }]"
            class="table-form-item"
          >
            <el-input
              v-model="row.passport"
              placeholder="请输入护照号码"
              size="small"
              @blur="$emit('validate-field', $index, 'passport')"
            />
          </el-form-item>
        </template>
      </el-table-column>

      <el-table-column prop="code" label="代号" width="120">
        <template #default="{ row }">
          <el-input
            v-model="row.code"
            placeholder="代号"
            size="small"
          />
        </template>
      </el-table-column>

      <el-table-column prop="expire_date" label="签证到期日" width="150">
        <template #default="{ row }">
          <el-date-picker
            v-model="row.expire_date"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            size="small"
            style="width: 100%"
          />
        </template>
      </el-table-column>

      <el-table-column prop="nationality" label="国籍" width="140">
        <template #default="{ row }">
          <el-select
            v-model="row.nationality"
            placeholder="请选择国籍"
            filterable
            size="small"
            style="width: 100%"
          >
            <el-option
              v-for="country in countries"
              :key="country.code"
              :label="country.name"
              :value="country.name"
            />
          </el-select>
        </template>
      </el-table-column>

      <el-table-column prop="business_type" label="业务类型" width="140">
        <template #default="{ row }">
          <el-select
            v-model="row.business_type"
            placeholder="请选择业务类型"
            size="small"
            style="width: 100%"
          >
            <el-option
              v-for="type in businessTypes"
              :key="type"
              :label="type"
              :value="type"
            />
          </el-select>
        </template>
      </el-table-column>

      <el-table-column prop="status" label="办理状态" width="140">
        <template #default="{ row }">
          <el-select
            v-model="row.status"
            placeholder="请选择状态"
            size="small"
            style="width: 100%"
          >
            <el-option
              v-for="status in statusList"
              :key="status"
              :label="status"
              :value="status"
            />
          </el-select>
        </template>
      </el-table-column>

      <el-table-column prop="has_last_labor" label="上一年劳工证" width="150">
        <template #default="{ row }">
          <el-select
            v-model="row.has_last_labor"
            placeholder="请选择"
            size="small"
            style="width: 100%"
          >
            <el-option label="有" value="yes" />
            <el-option label="无" value="no" />
          </el-select>
        </template>
      </el-table-column>

      <el-table-column prop="fee" label="办理费用" width="150">
        <template #default="{ row }">
          <el-input-number
            v-model="row.fee"
            :min="0"
            :step="0.01"
            :precision="2"
            controls-position="right"
            placeholder="0.00"
            size="small"
            style="width: 100%"
            @change="$emit('calculate-total')"
          >
            <template #prefix>฿</template>
          </el-input-number>
        </template>
      </el-table-column>

      <el-table-column prop="settlement" label="费用结算" width="140">
        <template #default="{ row }">
          <el-select
            v-model="row.settlement"
            placeholder="请选择结算状态"
            size="small"
            style="width: 100%"
          >
            <el-option label="未结算" value="unpaid" />
            <el-option label="部分结算" value="partial" />
            <el-option label="已结算" value="paid" />
          </el-select>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="120" fixed="right" align="center">
        <template #default="{ $index }">
          <div class="table-actions">
            <el-button
              type="primary"
              size="small"
              :icon="Folder"
              @click="$emit('open-file-manager', $index)"
              title="文件管理"
            />
            <el-button
              type="danger"
              size="small"
              :icon="Delete"
              @click="$emit('remove-customer', $index)"
              :disabled="customers.length <= 1"
              title="删除客户"
            />
          </div>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { Folder, Delete } from '@element-plus/icons-vue'

const props = defineProps({
  customers: {
    type: Array,
    required: true
  },
  countries: {
    type: Array,
    default: () => []
  },
  businessTypes: {
    type: Array,
    default: () => []
  },
  statusList: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

defineEmits([
  'open-file-manager',
  'remove-customer',
  'calculate-total',
  'validate-field'
])

function tableRowClassName({ rowIndex }) {
  return rowIndex % 2 === 1 ? 'even-row' : 'odd-row'
}
</script>

<style scoped>
.client-table-container {
  :deep(.table-form-item) {
    margin-bottom: 0;
    
    .el-form-item__error {
      position: absolute;
      top: 100%;
      left: 0;
      margin-top: 2px;
      font-size: 12px;
    }
  }
  
  :deep(.even-row) {
    --el-table-tr-bg-color: var(--el-fill-color-light);
  }
}

.table-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}
</style>