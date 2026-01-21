<template>
  <PageLayout>
    <template #title>系统数据备份与恢复</template>
    <template #subtitle>
      导出 / 导入 localStorage 中的全部业务与配置数据
    </template>

    <el-card shadow="never" class="section-card">
      <el-alert
        title="操作提示"
        type="warning"
        show-icon
        :closable="false"
        description="导入数据会覆盖当前系统中的所有本地数据，请在操作前务必先导出备份。"
        class="mb-16"
      />

      <div class="action-grid">
        <!-- 导出 -->
        <el-card shadow="never" class="action-card">
          <h3 class="card-title">导出系统数据</h3>
          <p class="card-desc">
            将当前系统中的所有数据导出为 JSON 文件（订单、代理、配置、序号、缓存等）
          </p>
          <el-button type="primary" :icon="Download" @click="exportAll">
            导出备份文件
          </el-button>
        </el-card>

        <!-- 导入 -->
        <el-card shadow="never" class="action-card danger">
          <h3 class="card-title">导入系统数据</h3>
          <p class="card-desc">
            从 JSON 文件恢复系统数据（将覆盖当前浏览器中的所有本地数据）
          </p>

          <el-upload
            :auto-upload="false"
            :show-file-list="false"
            accept=".json"
            @change="handleFileSelect"
          >
            <el-button type="danger" :icon="Upload">
              选择备份文件并导入
            </el-button>
          </el-upload>
        </el-card>
      </div>

      <!-- 导入预览 -->
      <el-card v-if="preview" shadow="never" class="preview-card">
        <h3 class="card-title">导入预览</h3>

        <el-descriptions border :column="2" size="small">
          <el-descriptions-item
            v-for="(v, k) in preview"
            :key="k"
            :label="k"
          >
            <span class="preview-value">{{ summarize(v) }}</span>
          </el-descriptions-item>
        </el-descriptions>

        <div class="preview-actions">
          <el-button @click="cancelImport">取消</el-button>
          <el-button type="danger" @click="confirmImport">
            确认覆盖并导入
          </el-button>
        </div>
      </el-card>
    </el-card>
  </PageLayout>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Download, Upload } from '@element-plus/icons-vue'
import PageLayout from '@/layouts/PageLayout.vue'

const preview = ref(null)
const rawImportData = ref(null)

// =========================
// 导出全部 localStorage
// =========================
const exportAll = () => {
  const all = {}

  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    all[k] = localStorage.getItem(k)
  }

  const payload = {
    __meta: {
      exported_at: new Date().toISOString(),
      version: '1.0'
    },
    data: all
  }

  const json = JSON.stringify(payload, null, 2)
  const blob = new Blob([json], {
    type: 'application/json;charset=utf-8'
  })

  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `SYSTEM_BACKUP_${new Date().toISOString().slice(0, 10)}.json`
  a.click()

  ElMessage.success('系统数据已导出')
}

// =========================
// 文件选择
// =========================
const handleFileSelect = (file) => {
  const reader = new FileReader()

  reader.onload = () => {
    try {
      const json = JSON.parse(reader.result)

      if (!json || !json.data || typeof json.data !== 'object') {
        throw new Error('无效的备份文件格式')
      }

      rawImportData.value = json.data
      preview.value = json.data

      ElMessage.info('已加载备份文件，请确认导入内容')
    } catch (e) {
      ElMessage.error('解析失败，请确认这是有效的 JSON 备份文件')
    }
  }

  const f = file.raw || file
  if (!f) {
    ElMessage.error('无法读取文件')
    return
  }

  reader.readAsText(f)
}

// =========================
// 取消导入
// =========================
const cancelImport = () => {
  preview.value = null
  rawImportData.value = null
}

// =========================
// 确认导入
// =========================
const confirmImport = () => {
  ElMessageBox.confirm(
    '此操作将清空当前系统数据并覆盖导入，是否继续？',
    '危险操作确认',
    { type: 'warning' }
  ).then(() => {
    try {
      localStorage.clear()

      Object.entries(rawImportData.value).forEach(([k, v]) => {
        localStorage.setItem(k, v)
      })

      ElMessage.success('系统数据已成功恢复，即将刷新页面')
      setTimeout(() => location.reload(), 800)
    } catch (e) {
      ElMessage.error('导入失败，请检查备份文件完整性')
    }
  })
}

// =========================
// 预览摘要
// =========================
const summarize = (val) => {
  if (val === null || val === undefined) return '-'
  const str = String(val)
  if (str.length < 80) return str
  return str.slice(0, 80) + '...'
}
</script>

<style scoped>
.section-card {
  border-top: none !important;
}

.mb-16 {
  margin-bottom: 16px;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.action-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.action-card.danger {
  border: 1px solid #fecaca;
  background: #fff5f5;
}

.card-title {
  font-size: 16px;
  font-weight: 700;
  margin: 0;
}

.card-desc {
  font-size: 13px;
  color: #64748b;
}

.preview-card {
  margin-top: 20px;
}

.preview-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
}

.preview-value {
  font-family: monospace;
  font-size: 12px;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: inline-block;
  max-width: 100%;
}
</style>
