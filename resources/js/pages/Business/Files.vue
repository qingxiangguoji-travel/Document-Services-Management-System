<template>
  <PageLayout>
    <!-- ================= 查询区域（对齐订单管理） ================= -->
    <template #filters>
      <input
        v-model="filters.keyword"
        placeholder="搜索文件名 / 订单编号 / 代理"
      />

      <select v-model="filters.type">
        <option value="">全部类型</option>
        <option value="passport">护照</option>
        <option value="visa">签证材料</option>
        <option value="contract">合同</option>
        <option value="photo">照片</option>
        <option value="other">其他</option>
      </select>

      <select v-model="filters.status">
        <option value="">全部状态</option>
        <option value="valid">有效</option>
        <option value="invalid">作废</option>
      </select>

      <button class="btn-primary" @click="search">查询</button>
      <button class="btn-secondary" @click="resetFilters">重置</button>
    </template>

    <!-- ================= 右上角操作 ================= -->
    <template #actions>
      <button class="btn-primary" @click="openUploadModal">
        ＋ 上传文件
      </button>
    </template>

    <!-- ================= 表格（功能 & 列完全不动） ================= -->
    <table class="table">
      <thead>
        <tr>
          <th>文件名</th>
          <th>类型</th>
          <th>订单编号</th>
          <th>代理客户</th>
          <th>状态</th>
          <th>上传时间</th>
          <th width="160">操作</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="file in filteredFiles" :key="file.id">
          <td>{{ file.name }}</td>
          <td>{{ file.typeLabel }}</td>
          <td>{{ file.orderCode }}</td>
          <td>{{ file.agent }}</td>
          <td>
            <span
              class="tag"
              :class="file.valid ? 'tag-green' : 'tag-red'"
              @click="toggleStatus(file)"
            >
              {{ file.valid ? '有效' : '作废' }}
            </span>
          </td>
          <td>{{ file.date }}</td>
          <td>
            <a href="#" @click.prevent="download(file)">下载</a>
            <span class="sep">|</span>
            <a
              href="#"
              class="danger"
              @click.prevent="remove(file.id)"
            >
              删除
            </a>
          </td>
        </tr>

        <tr v-if="filteredFiles.length === 0">
          <td colspan="7" class="empty">暂无数据</td>
        </tr>
      </tbody>
    </table>

    <!-- ================= 上传文件弹窗（对齐订单创建弹窗） ================= -->
    <div v-if="showUpload" class="modal">
      <div class="order-modal">
        <div class="modal-content">
          <h3>上传文件</h3>

          <div class="form-item">
            <input
              ref="fileInput"
              type="file"
              @change="handleUpload"
            />
          </div>

          <div class="modal-actions">
            <button class="btn-secondary" @click="showUpload = false">
              取消
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

/* ================== 查询条件（对齐订单管理） ================== */

const filters = ref({
  keyword: '',
  type: '',
  status: ''
})

function search() {}
function resetFilters() {
  filters.value = { keyword: '', type: '', status: '' }
}

/* ================== 数据（原逻辑不变） ================== */

const files = ref([
  {
    id: 1,
    name: 'passport_zhangsan.pdf',
    type: 'passport',
    typeLabel: '护照',
    orderCode: 'ORD-2024-001',
    agent: '张三',
    valid: true,
    date: '2024-06-01'
  },
  {
    id: 2,
    name: 'visa_form_lisi.docx',
    type: 'visa',
    typeLabel: '签证材料',
    orderCode: 'ORD-2024-003',
    agent: '李四',
    valid: false,
    date: '2024-05-20'
  }
])

const filteredFiles = computed(() => {
  const { keyword, type, status } = filters.value
  return files.value.filter(f => {
    return (
      (!keyword ||
        f.name.includes(keyword) ||
        f.orderCode.includes(keyword) ||
        f.agent.includes(keyword)) &&
      (!type || f.type === type) &&
      (!status ||
        (status === 'valid' && f.valid) ||
        (status === 'invalid' && !f.valid))
    )
  })
})

/* ================== 上传（原功能保留，改为弹窗） ================== */

const showUpload = ref(false)
const fileInput = ref(null)

function openUploadModal() {
  showUpload.value = true
}

function handleUpload(e) {
  const file = e.target.files[0]
  if (!file) return

  files.value.unshift({
    id: Date.now(),
    name: file.name,
    type: 'other',
    typeLabel: '其他',
    orderCode: 'NEW',
    agent: '未指定',
    valid: true,
    date: new Date().toISOString().slice(0, 10)
  })

  e.target.value = ''
  showUpload.value = false
}

/* ================== 原有操作（完全不动） ================== */

function toggleStatus(file) {
  file.valid = !file.valid
}

function download(file) {
  alert(`模拟下载：${file.name}`)
}

function remove(id) {
  if (!confirm('确认删除？')) return
  files.value = files.value.filter(f => f.id !== id)
}
</script>

<style scoped>
/* ================= 表格（保持一致） ================= */
.table {
  width: 100%;
  border-collapse: collapse;
}

.table th {
  text-align: left;
  font-size: 13px;
  padding: 8px 10px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.table td {
  font-size: 14px;
  padding: 8px 10px;
  border-bottom: 1px solid #e5e7eb;
}

/* ================= 标签 ================= */
.tag {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.tag-green {
  background: #dcfce7;
  color: #166534;
}

.tag-red {
  background: #fee2e2;
  color: #991b1b;
}

.danger {
  color: #dc2626;
}

.sep {
  margin: 0 6px;
  color: #9ca3af;
}

.empty {
  text-align: center;
  color: #9ca3af;
  padding: 16px 0;
}

/* ================= 弹窗（与订单管理一致） ================= */
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
  margin-top: 12px;
}

.modal-actions {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
