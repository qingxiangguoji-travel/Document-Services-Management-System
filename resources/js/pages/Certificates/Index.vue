<template>
  <PageLayout>
    <!-- ================= 查询区域 ================= -->
    <template #filters>
      <input
        v-model="filters.keyword"
        placeholder="证件编号 / 姓名 / 代理"
      />

      <select v-model="filters.type">
        <option value="">全部证件类型</option>
        <option v-for="t in certificateTypes" :key="t" :value="t">
          {{ t }}
        </option>
      </select>

      <select v-model="filters.status">
        <option value="">全部状态</option>
        <option v-for="(label, key) in statusMap" :key="key" :value="key">
          {{ label }}
        </option>
      </select>

      <button class="btn-primary" @click="search">查询</button>
      <button class="btn-secondary" @click="resetFilters">重置</button>
    </template>

    <!-- ================= 右上角操作 ================= -->
    <template #actions>
      <button class="btn-primary" @click="openCreate">
        ＋ 新增证件
      </button>
    </template>

    <!-- ================= 表格 ================= -->
    <table class="table">
      <thead>
        <tr>
          <th>证件编号</th>
          <th>证件类型</th>
          <th>姓名</th>
          <th>代理客户</th>
          <th>状态</th>
          <th>提交时间</th>
          <th style="width: 80px">操作</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="item in filteredList" :key="item.id">
          <td>{{ item.code }}</td>
          <td>{{ item.type }}</td>
          <td>{{ item.name }}</td>
          <td>{{ item.agent }}</td>
          <td>
            <span :class="['status', item.status]">
              {{ statusMap[item.status] }}
            </span>
          </td>
          <td>{{ item.created_at }}</td>
          <td>
            <button class="btn-link" @click="viewDetail(item)">
              详情
            </button>
          </td>
        </tr>

        <tr v-if="filteredList.length === 0">
          <td colspan="7" class="empty">暂无数据</td>
        </tr>
      </tbody>
    </table>

    <!-- ================= 新增证件弹窗（占位版） ================= -->
    <div v-if="showCreate" class="modal">
      <div class="order-modal">
        <div class="modal-content">
          <h3>新增证件</h3>

          <div class="form-item">
            <label>证件类型</label>
            <select v-model="createForm.type">
              <option value="">请选择</option>
              <option v-for="t in certificateTypes" :key="t" :value="t">
                {{ t }}
              </option>
            </select>
          </div>

          <div class="form-item">
            <label>姓名</label>
            <input v-model="createForm.name" placeholder="请输入姓名" />
          </div>

          <div class="form-item">
            <label>代理客户</label>
            <input v-model="createForm.agent" placeholder="请输入代理客户" />
          </div>

          <div class="modal-actions">
            <button class="btn-secondary" @click="showCreate = false">
              取消
            </button>
            <button class="btn-primary" @click="submitCreate">
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import PageLayout from '@/layouts/PageLayout.vue'

/* ================= 基础数据 ================= */

const certificateTypes = [
  '签证类',
  '劳工证类',
  '护照类',
  '机票类'
]

const statusMap = {
  created: '已提交',
  processing: '办理中',
  completed: '已完成'
}

const list = ref([
  {
    id: 1,
    code: 'CERT-2025-001',
    type: '签证类',
    name: '张三',
    agent: '张三（代理）',
    status: 'processing',
    created_at: '2025-01-12'
  },
  {
    id: 2,
    code: 'CERT-2025-002',
    type: '护照类',
    name: '李四',
    agent: '李四',
    status: 'completed',
    created_at: '2025-01-05'
  }
])

/* ================= 查询 ================= */

const filters = ref({
  keyword: '',
  type: '',
  status: ''
})

const filteredList = computed(() => {
  return list.value.filter(item => {
    return (
      (!filters.value.keyword ||
        item.code.includes(filters.value.keyword) ||
        item.name.includes(filters.value.keyword) ||
        item.agent.includes(filters.value.keyword)) &&
      (!filters.value.type || item.type === filters.value.type) &&
      (!filters.value.status || item.status === filters.value.status)
    )
  })
})

function search() {}
function resetFilters() {
  filters.value = { keyword: '', type: '', status: '' }
}

/* ================= 新增证件（基础占位） ================= */

const showCreate = ref(false)
const createForm = ref({
  type: '',
  name: '',
  agent: ''
})

function openCreate() {
  showCreate.value = true
}

function submitCreate() {
  if (!createForm.value.type || !createForm.value.name) {
    alert('请填写完整信息')
    return
  }

  list.value.unshift({
    id: Date.now(),
    code: 'CERT-' + Date.now(),
    type: createForm.value.type,
    name: createForm.value.name,
    agent: createForm.value.agent || '未指定',
    status: 'created',
    created_at: new Date().toISOString().slice(0, 10)
  })

  createForm.value = { type: '', name: '', agent: '' }
  showCreate.value = false
}

/* ================= 详情（占位） ================= */

function viewDetail(item) {
  alert('证件详情占位：' + item.code)
}
</script>

<style scoped>
/* 表格 */
.table {
  width: 100%;
  border-collapse: collapse;
}

.table th {
  text-align: left;
  font-size: 13px;
  padding: 8px 10px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.table td {
  font-size: 14px;
  padding: 8px 10px;
  border-bottom: 1px solid #e5e7eb;
}

/* 状态 */
.status {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.status.created {
  background: #e0f2fe;
  color: #0369a1;
}

.status.processing {
  background: #fef3c7;
  color: #92400e;
}

.status.completed {
  background: #dcfce7;
  color: #166534;
}

/* 按钮 */
.btn-link {
  background: none;
  border: none;
  color: #2563eb;
  cursor: pointer;
}

/* 弹窗（与订单管理一致） */
.modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.order-modal .modal-content {
  background: #fff;
  padding: 16px;
  border-radius: 8px;
  width: 420px;
}

.form-item {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.modal-actions {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.empty {
  text-align: center;
  color: #9ca3af;
  padding: 16px 0;
}
</style>
