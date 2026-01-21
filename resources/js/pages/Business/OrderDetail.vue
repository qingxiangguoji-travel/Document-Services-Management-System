<template>
  <PageLayout>
    <template #title>
      订单详情
    </template>

    <div class="card">
      <h3>基本信息</h3>
      <p><strong>订单号：</strong>{{ order.code }}</p>
      <p><strong>代理：</strong>{{ order.agent }}</p>
      <p><strong>客户：</strong>{{ order.customer }}</p>
      <p><strong>状态：</strong>{{ statusMap[order.status] }}</p>
      <p><strong>创建时间：</strong>{{ order.created_at }}</p>
    </div>

    <div class="card">
      <h3>证件信息</h3>
      <table class="table">
        <tr>
          <th>证件类型</th>
          <th>状态</th>
        </tr>
        <tr v-for="(c, i) in order.certificates" :key="i">
          <td>{{ c.type }}</td>
          <td>{{ statusMap[c.status] }}</td>
        </tr>
      </table>
    </div>

    <div class="card">
      <h3>状态流转</h3>
      <div class="actions">
        <button
          v-for="(label, key) in statusMap"
          :key="key"
          class="btn-secondary"
          :disabled="order.status === key"
          @click="order.status = key"
        >
          {{ label }}
        </button>
      </div>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import PageLayout from '@/layouts/PageLayout.vue'

const route = useRoute()

const statusMap = {
  created: '已创建',
  processing: '办理中',
  completed: '已完成',
  returned: '已返还'
}

const order = ref({
  id: route.params.id,
  code: 'ORD-2025-0001',
  agent: '张三代理',
  customer: '李四',
  status: 'created',
  created_at: '2025-01-10',
  certificates: [
    { type: '签证类', status: 'processing' }
  ]
})
</script>

<style scoped>
.card {
  background: #fff;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}
.actions {
  display: flex;
  gap: 8px;
}
</style>
