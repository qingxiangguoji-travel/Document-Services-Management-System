<template>
  <PageLayout>
    <!-- ================= 基本信息 ================= -->
    <section class="card">
      <h3 class="card-title">订单信息</h3>
      <div class="info-grid">
        <div><strong>业务编号：</strong>{{ order.code }}</div>
        <div><strong>创建时间：</strong>{{ order.created_at }}</div>
        <div><strong>代理人：</strong>{{ order.agent }}</div>

        <div>
          <strong>办理部门：</strong>
          <select v-model="order.department">
            <option value="劳工部">劳工部</option>
            <option value="移民局">移民局</option>
            <option value="其他">其他</option>
          </select>
        </div>
      </div>
    </section>

    <!-- ================= 客户列表 ================= -->
    <section class="card">
      <h3 class="card-title">
        客户信息
        <button class="btn-link" @click="addCustomer">＋ 新增客户</button>
      </h3>

      <div
        v-for="(customer, index) in order.customers"
        :key="customer.id"
        class="customer-block"
      >
        <h4>客户 {{ index + 1 }}</h4>

        <div class="form-grid">
          <input v-model="customer.name" placeholder="客户姓名" />
          <input v-model="customer.passport" placeholder="护照号" />
          <input v-model="customer.nationality" placeholder="国籍" />
          <input
            type="date"
            v-model="customer.visa_expire"
            placeholder="签证到期日"
          />
        </div>

        <!-- 文件上传 -->
        <div class="files">
          <div v-for="f in fileTypes" :key="f.key" class="file-item">
            <label>{{ f.label }}</label>
            <input type="file" />
          </div>
        </div>

        <textarea
          v-model="customer.remark"
          placeholder="客户备注"
        ></textarea>
      </div>
    </section>

    <!-- ================= 业务 & 费用 ================= -->
    <section class="card">
      <h3 class="card-title">业务与费用</h3>

      <div class="form-grid">
        <select v-model="order.businessTypes" multiple>
          <option v-for="b in businessTypes" :key="b" :value="b">
            {{ b }}
          </option>
        </select>

        <input
          type="number"
          v-model="order.fee_final"
          placeholder="最终收费金额"
        />
      </div>

      <textarea
        v-model="order.fee_remark"
        placeholder="费用备注 / 调整原因"
      ></textarea>
    </section>

    <!-- ================= 状态 ================= -->
    <section class="card">
      <h3 class="card-title">办理状态</h3>

      <div class="status-actions">
        <button
          v-for="(label, key) in statusMap"
          :key="key"
          :class="['status-btn', key, { active: order.status === key }]"
          @click="changeStatus(key)"
        >
          {{ label }}
        </button>
      </div>

      <ul class="log">
        <li v-for="log in order.statusLogs" :key="log.time">
          {{ log.time }} - {{ statusMap[log.status] }}
        </li>
      </ul>
    </section>

    <!-- ================= 订单备注 ================= -->
    <section class="card">
      <h3 class="card-title">订单备注</h3>
      <textarea v-model="order.remark"></textarea>
    </section>
  </PageLayout>
</template>

<script setup>
import { reactive } from 'vue'
import PageLayout from '@/layouts/PageLayout.vue'

/* ================= 常量 ================= */

const statusMap = {
  created: '已创建',
  processing: '办理中',
  completed: '已完成',
  returned: '已返还'
}

const businessTypes = ['签证', '劳工证', '护照更换']

const fileTypes = [
  { key: 'passport_cover', label: '护照外壳' },
  { key: 'passport_main', label: '护照首页' },
  { key: 'visa_page', label: '签证页' },
  { key: 'work_front', label: '劳工证正面' },
  { key: 'visa_final', label: '签证成品' },
  { key: 'work_final', label: '劳工证成品' }
]

/* ================= 模拟订单数据 ================= */

const order = reactive({
  id: 1,
  code: 'ORD-2025-0001',
  created_at: '2025-01-10',
  agent: '张三（代理）',
  department: '劳工部',

  customers: [
    {
      id: 1,
      name: '',
      passport: '',
      nationality: '',
      visa_expire: '',
      remark: ''
    }
  ],

  businessTypes: [],
  fee_final: '',
  fee_remark: '',

  status: 'created',
  statusLogs: [
    { status: 'created', time: '2025-01-10 10:00' }
  ],

  remark: ''
})

/* ================= 方法 ================= */

function addCustomer() {
  order.customers.push({
    id: Date.now(),
    name: '',
    passport: '',
    nationality: '',
    visa_expire: '',
    remark: ''
  })
}

function changeStatus(status) {
  if (order.status === status) return
  order.status = status
  order.statusLogs.unshift({
    status,
    time: new Date().toLocaleString()
  })
}
</script>

<style scoped>
.card {
  background: #fff;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.card-title {
  display: flex;
  justify-content: space-between;
  font-size: 15px;
  margin-bottom: 12px;
}

.info-grid,
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.customer-block {
  border: 1px dashed #e5e7eb;
  padding: 12px;
  margin-top: 12px;
  border-radius: 6px;
}

.files {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin: 8px 0;
}

.status-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.status-btn {
  padding: 4px 10px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
}

.status-btn.active {
  opacity: 0.5;
  cursor: default;
}

.log {
  font-size: 12px;
  color: #6b7280;
}

textarea,
input,
select {
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 4px;
}
</style>
