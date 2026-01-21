<template>
  <el-card shadow="never" class="mb-4">
    <template #header>
      <div class="header">
        <span>客户信息</span>
        <el-button type="primary" size="small" @click="add">新增客户</el-button>
      </div>
    </template>

    <el-table :data="modelValue" border>
      <el-table-column label="姓名" width="120">
        <template #default="{ row }">
          <el-input v-model="row.name" />
        </template>
      </el-table-column>

      <el-table-column label="护照号" width="160">
        <template #default="{ row }">
          <el-input v-model="row.passport" />
        </template>
      </el-table-column>

      <el-table-column label="国籍" width="120">
        <template #default="{ row }">
          <el-input v-model="row.nationality" />
        </template>
      </el-table-column>

      <el-table-column label="业务类型" width="120">
        <template #default="{ row }">
          <el-select v-model="row.business_type">
            <el-option label="签证" value="visa" />
            <el-option label="劳工证" value="work" />
          </el-select>
        </template>
      </el-table-column>

      <el-table-column label="费用" width="120">
        <template #default="{ row }">
          <el-input-number v-model="row.fee" :min="0" />
        </template>
      </el-table-column>

      <el-table-column label="文件" width="80">
        <template #default="{ $index }">
          <el-button link @click="$emit('open-file', $index)">查看</el-button>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="80">
        <template #default="{ $index }">
          <el-button type="danger" link @click="remove($index)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="summary">
      <span>客户数：{{ modelValue.length }}</span>
      <span>总费用：฿ {{ total }}</span>
    </div>
  </el-card>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ modelValue: Array })
const emit = defineEmits(['update:modelValue', 'open-file'])

const add = () => {
  emit('update:modelValue', [
    ...props.modelValue,
    {
      name: '',
      passport: '',
      nationality: '',
      business_type: '',
      fee: 0,
      files: [],
    },
  ])
}

const remove = (i) => {
  const list = [...props.modelValue]
  list.splice(i, 1)
  emit('update:modelValue', list)
}

const total = computed(() =>
  props.modelValue.reduce((s, c) => s + Number(c.fee || 0), 0),
)
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
}
.summary {
  margin-top: 10px;
  text-align: right;
  color: #666;
}
.mb-4 {
  margin-bottom: 16px;
}
</style>
