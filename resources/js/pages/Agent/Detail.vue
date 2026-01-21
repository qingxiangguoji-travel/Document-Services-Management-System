<template>
  <PageLayout>
    <template #filters>
      <div style="font-weight:600">
        客户订单历史（代理：{{ agentId }}）
      </div>
    </template>

    <div class="table-wrapper">
      <!-- 这里以后直接复用订单管理表格 -->
      <div style="padding: 16px; color: #666">
        这里展示该代理的所有订单记录
      </div>
    </div>
  </PageLayout>
</template>

<script setup>
import { useRoute } from 'vue-router'
import PageLayout from '@/layouts/PageLayout.vue'

const route = useRoute()
const agentId = route.query.id
</script>
