<template>
  <el-row :gutter="20">
    <el-col :span="6">
      <el-form-item label="订单编号" prop="order_no">
        <el-input 
          :model-value="modelValue.order_no" 
          placeholder="自动生成" 
          disabled 
        />
      </el-form-item>
    </el-col>
    
    <el-col :span="6">
      <el-form-item label="创建日期" required>
        <el-date-picker
          :model-value="modelValue.created_at"
          @update:model-value="updateValue('created_at', $event)"
          type="date"
          placeholder="选择日期"
          style="width: 100%"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>
    </el-col>

    <el-col :span="6">
      <el-form-item label="代理人" required>
        <el-select 
          :model-value="modelValue.agent_id"
          @update:model-value="updateValue('agent_id', $event)"
          placeholder="请选择代理人"
          style="width: 100%"
        >
          <el-option v-for="a in agents" :key="a.id" :label="a.name" :value="a.id" />
        </el-select>
      </el-form-item>
    </el-col>

    <el-col :span="6">
      <el-form-item label="办理部门" required>
        <el-select 
          :model-value="modelValue.department_id"
          @update:model-value="updateValue('department_id', $event)"
          placeholder="请选择部门"
          style="width: 100%"
        >
          <el-option v-for="d in departments" :key="d.id" :label="d.name" :value="d.id" />
        </el-select>
      </el-form-item>
    </el-col>

    <el-col :span="24">
      <el-form-item label="备注">
        <el-input
          :model-value="modelValue.remark"
          @update:model-value="updateValue('remark', $event)"
          type="textarea"
          rows="3"
          placeholder="请输入订单备注信息"
        />
      </el-form-item>
    </el-col>
  </el-row>
</template>

<script setup>
// 数据源模拟 (实际应从父组件注入或从 API 获取)
const agents = [
  { id: 1, name: '张三' },
  { id: 2, name: '李四' },
  { id: 3, name: '王五' }
];

const departments = [
  { id: 1, name: '签证部' },
  { id: 2, name: '劳工证部' },
  { id: 3, name: '综合业务部' }
];

const props = defineProps({
  modelValue: Object
});

const emit = defineEmits(['update:modelValue']);

const updateValue = (key, val) => {
  emit('update:modelValue', { ...props.modelValue, [key]: val });
};
</script>