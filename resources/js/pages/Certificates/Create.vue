<template>
  <PageLayout>
    <!-- 顶部操作 -->
    <template #actions>
      <button class="btn-secondary" @click="back">返回</button>
    </template>

    <div class="form-wrapper">
      <!-- ===== 基础信息 ===== -->
      <div class="form-item">
        <label>证件类型</label>
        <select v-model="form.type">
          <option value="">请选择</option>
          <option v-for="t in certificateTypes" :key="t" :value="t">
            {{ t }}
          </option>
        </select>
      </div>

      <div class="form-item">
        <label>关联订单</label>
        <input v-model="form.orderCode" placeholder="ORD-2025-0001" />
      </div>

      <div class="form-item">
        <label>客户 / 代理</label>
        <input v-model="form.agent" placeholder="客户或代理名称" />
      </div>

      <div class="form-item">
        <label>证件状态</label>
        <select v-model="form.status">
          <option value="processing">办理中</option>
          <option value="completed">已完成</option>
          <option value="returned">已返还</option>
        </select>
      </div>

      <div class="form-item">
        <label>证件备注</label>
        <textarea
          v-model="form.remark"
          rows="3"
          placeholder="可填写补充说明"
        />
      </div>

      <!-- ===== 附件上传（新增） ===== -->
      <div class="form-item">
        <label>附件上传</label>

        <button class="btn-secondary" @click="chooseFile">
          ＋ 选择文件
        </button>

        <ul v-if="files.length" class="file-list">
          <li v-for="(f, index) in files" :key="index">
            <span class="file-name">{{ f.name }}</span>
            <button class="file-remove" @click="removeFile(index)">
              删除
            </button>
          </li>
        </ul>
      </div>

      <!-- ===== 底部操作 ===== -->
      <div class="form-actions">
        <button class="btn-secondary" @click="back">取消</button>
        <button class="btn-primary" @click="submit">保存</button>
      </div>
    </div>

    <!-- 隐藏 input -->
    <input
      ref="fileInput"
      type="file"
      multiple
      style="display: none"
      @change="handleFiles"
    />
  </PageLayout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import PageLayout from '@/layouts/PageLayout.vue'

const router = useRouter()

/* ===== 数据 ===== */
const certificateTypes = [
  '签证类',
  '劳工证类',
  '护照更换',
  '机票类',
  '注册公司类'
]

const form = ref({
  type: '',
  orderCode: '',
  agent: '',
  status: 'processing',
  remark: ''
})

/* ===== 文件 ===== */
const files = ref([])
const fileInput = ref(null)

/* ===== 方法 ===== */
function back() {
  router.back()
}

function chooseFile() {
  fileInput.value.click()
}

function handleFiles(e) {
  const selected = Array.from(e.target.files)
  files.value.push(...selected)
  e.target.value = ''
}

function removeFile(index) {
  files.value.splice(index, 1)
}

function submit() {
  if (!form.value.type || !form.value.agent) {
    alert('请填写证件类型和客户信息')
    return
  }

  console.log('证件信息：', form.value)
  console.log('上传文件：', files.value)

  alert('保存成功（模拟）')
  router.back()
}
</script>

<style scoped>
.form-wrapper {
  max-width: 520px;
  padding: 16px;
}

.form-item {
  margin-bottom: 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-item label {
  font-size: 13px;
  color: #374151;
}

.form-item input,
.form-item select,
.form-item textarea {
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 6px 8px;
  font-size: 14px;
}

/* ===== 文件列表 ===== */
.file-list {
  margin-top: 6px;
  padding-left: 0;
  list-style: none;
}

.file-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  font-size: 13px;
}

.file-name {
  color: #374151;
}

.file-remove {
  border: none;
  background: none;
  color: #dc2626;
  cursor: pointer;
  font-size: 12px;
}

.form-actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
