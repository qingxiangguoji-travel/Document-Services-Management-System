<template>
  <PageLayout>
    <!-- 顶部操作 -->
    <template #actions>
      <button class="btn-secondary" @click="back">返回</button>
    </template>

    <div class="detail-wrapper">
      <!-- ================= 基本信息 ================= -->
      <h3 class="section-title">证件信息</h3>

      <div class="info-grid">
        <div><label>证件类型：</label>{{ cert.type }}</div>
        <div><label>关联订单：</label>{{ cert.orderCode }}</div>
        <div><label>客户 / 代理：</label>{{ cert.agent }}</div>
        <div>
          <label>证件状态：</label>
          <span class="status">{{ statusMap[cert.status] }}</span>
        </div>
        <div><label>创建时间：</label>{{ cert.created_at }}</div>
        <div class="full">
          <label>备注：</label>{{ cert.remark || '—' }}
        </div>
      </div>

      <!-- ================= 附件 ================= -->
      <h3 class="section-title">附件列表</h3>

      <table class="table">
        <thead>
          <tr>
            <th>文件名</th>
            <th>状态</th>
            <th>上传时间</th>
            <th style="width: 80px">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="f in files" :key="f.id">
            <td>{{ f.name }}</td>
            <td>
              <span
                class="tag"
                :class="f.valid ? 'tag-green' : 'tag-red'"
              >
                {{ f.valid ? '有效' : '作废' }}
              </span>
            </td>
            <td>{{ f.date }}</td>
            <td>
              <button class="btn-link" @click="download(f)">
                下载
              </button>
            </td>
          </tr>

          <tr v-if="files.length === 0">
            <td colspan="4" class="empty">暂无附件</td>
          </tr>
        </tbody>
      </table>
    </div>
  </PageLayout>
</template>

<script setup>
import { useRouter } from 'vue-router'
import PageLayout from '@/layouts/PageLayout.vue'

const router = useRouter()

/* ===== 模拟证件数据 ===== */
const cert = {
  id: 1,
  type: '签证类',
  orderCode: 'ORD-2025-0001',
  agent: '张三（代理）',
  status: 'processing',
  created_at: '2025-01-12',
  remark: '客户急件'
}

const statusMap = {
  processing: '办理中',
  completed: '已完成',
  returned: '已返还'
}

/* ===== 模拟附件 ===== */
const files = [
  {
    id: 1,
    name: 'passport_zhangsan.pdf',
    valid: true,
    date: '2025-01-12'
  },
  {
    id: 2,
    name: 'visa_form.docx',
    valid: false,
    date: '2025-01-13'
  }
]

function back() {
  router.back()
}

function download(file) {
  alert(`模拟下载：${file.name}`)
}
</script>

<style scoped>
.detail-wrapper {
  padding: 16px;
  max-width: 900px;
}

.section-title {
  margin: 12px 0;
  font-size: 15px;
  font-weight: 600;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  background: #fff;
  padding: 16px;
  border-radius: 6px;
}

.info-grid label {
  color: #6b7280;
}

.info-grid .full {
  grid-column: 1 / -1;
}

.status {
  padding: 4px 8px;
  background: #fef3c7;
  color: #92400e;
  border-radius: 12px;
  font-size: 12px;
}

/* 表格 */
.table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  margin-top: 8px;
}

.table th,
.table td {
  padding: 8px 10px;
  border-bottom: 1px solid #e5e7eb;
  font-size: 13px;
}

.table th {
  background: #f9fafb;
}

.btn-link {
  background: none;
  border: none;
  color: #2563eb;
  cursor: pointer;
}

.tag {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.tag-green {
  background: #dcfce7;
  color: #166534;
}

.tag-red {
  background: #fee2e2;
  color: #991b1b;
}

.empty {
  text-align: center;
  color: #9ca3af;
  padding: 16px 0;
}
</style>
