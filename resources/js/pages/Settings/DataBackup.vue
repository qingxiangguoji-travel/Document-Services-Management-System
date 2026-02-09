<template>
  <PageLayout>
    <template #title>系统数据备份与恢复</template>
    <template #subtitle>
      企业级数据备份 / 灾难恢复系统
    </template>

    <el-card shadow="never" class="section-card">

      <el-alert
        title="重要提示"
        type="warning"
        show-icon
        :closable="false"
        description="导入前系统会自动创建临时备份，避免误操作造成数据丢失。"
        class="mb-16"
      />

      <div class="action-grid">

        <!-- 导出 -->
        <el-card shadow="never" class="action-card">
          <h3 class="card-title">导出系统备份</h3>
          <p class="card-desc">
            下载完整系统数据（订单 / 代理 / 文件 / 配置）
          </p>

          <el-button type="primary" :icon="Download" @click="exportBackup">
            下载备份文件
          </el-button>
        </el-card>

        <!-- 导入 -->
        <el-card shadow="never" class="action-card danger">
          <h3 class="card-title">恢复系统数据</h3>
          <p class="card-desc">
            导入备份文件将覆盖当前系统数据
          </p>

          <el-upload
            :auto-upload="false"
            :show-file-list="false"
            accept=".json"
            @change="handleFileSelect"
          >
            <el-button type="danger" :icon="Upload">
              选择备份文件
            </el-button>
          </el-upload>
        </el-card>

      </div>

      <!-- 预览 -->
      <el-card v-if="preview" shadow="never" class="preview-card">
        <h3 class="card-title">备份文件预览</h3>

        <el-descriptions border :column="2" size="small">
          <el-descriptions-item label="备份时间">
            {{ preview.__meta.exported_at }}
          </el-descriptions-item>

          <el-descriptions-item label="系统版本">
            {{ preview.__meta.version }}
          </el-descriptions-item>

          <el-descriptions-item label="订单数量">
            {{ getCount('BUSINESS_ORDERS_DATA') }}
          </el-descriptions-item>

          <el-descriptions-item label="代理数量">
            {{ getCount('AGENTS_DATA') }}
          </el-descriptions-item>

          <el-descriptions-item label="文件数量">
            {{ getCount('FILES_CENTER') }}
          </el-descriptions-item>
        </el-descriptions>

        <div class="preview-actions">
          <el-button @click="cancelImport">取消</el-button>
          <el-button type="danger" @click="confirmImport">
            确认恢复系统
          </el-button>
        </div>
      </el-card>

    </el-card>
  </PageLayout>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download, Upload } from '@element-plus/icons-vue'
import PageLayout from '@/layouts/PageLayout.vue'

// ⭐ 系统数据库白名单（核心升级）
const DB_KEYS = [
  'AGENTS_DATA',
  'BUSINESS_ORDERS_DATA',
  'FILES_CENTER',
  'SYSTEM_CONFIGS_DATA',
  'STAFF_LIST',
  'AGENT_ALIAS_MAP'
]

const SYSTEM_VERSION = '2.0'

const preview = ref(null)
const rawImportData = ref(null)

const now = () =>
  new Date().toISOString().replace(/[:.]/g, '-')

// =========================
// 导出备份（白名单）
// =========================
const exportBackup = () => {
  const data = {}

  DB_KEYS.forEach(key => {
    data[key] = localStorage.getItem(key)
  })

  const payload = {
    __meta: {
      version: SYSTEM_VERSION,
      exported_at: new Date().toISOString()
    },
    data
  }

  downloadJSON(payload, `SYSTEM_BACKUP_${now()}.json`)
  ElMessage.success('系统备份已下载')
}

// =========================
// 自动回滚点
// =========================
const createRollbackPoint = () => {
  const data = {}
  DB_KEYS.forEach(key => {
    data[key] = localStorage.getItem(key)
  })

  const payload = {
    __meta: {
      version: SYSTEM_VERSION,
      exported_at: new Date().toISOString(),
      type: 'AUTO_ROLLBACK'
    },
    data
  }

  downloadJSON(payload, `AUTO_ROLLBACK_${now()}.json`)
}

// =========================
// 选择文件
// =========================
const handleFileSelect = (file) => {
  const reader = new FileReader()

  reader.onload = () => {
    try {
      const json = JSON.parse(reader.result)

      // ⭐ 版本校验
      if (!json.__meta || !json.data) {
        throw new Error('不是有效的系统备份文件')
      }

      rawImportData.value = json.data
      preview.value = json

      ElMessage.success('备份文件解析成功')
    } catch {
      ElMessage.error('备份文件无效')
    }
  }

  reader.readAsText(file.raw || file)
}

const cancelImport = () => {
  preview.value = null
  rawImportData.value = null
}

// =========================
// 恢复系统
// =========================
const confirmImport = async () => {
  try {
    await ElMessageBox.confirm(
      '系统将自动创建回滚点，然后覆盖当前数据',
      '危险操作',
      { type: 'warning' }
    )

    // ⭐ 自动创建回滚点
    createRollbackPoint()

    // ⭐ 清空并恢复
    localStorage.clear()

    Object.entries(rawImportData.value).forEach(([k, v]) => {
      if (DB_KEYS.includes(k)) {
        localStorage.setItem(k, v)
      }
    })

    ElMessage.success('系统恢复成功，即将刷新')
    setTimeout(() => location.reload(), 1000)

  } catch {}
}

// =========================
// 工具
// =========================
const downloadJSON = (data, filename) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json'
  })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
}

const getCount = (key) => {
  try {
    const raw = JSON.parse(rawImportData.value[key] || '[]')
    return Array.isArray(raw) ? raw.length : 0
  } catch {
    return '-'
  }
}
</script>

<style scoped>
.section-card { border-top: none !important; }
.mb-16 { margin-bottom: 16px; }
.action-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; }
.action-card { display: flex; flex-direction: column; gap: 10px; }
.action-card.danger { border: 1px solid #fecaca; background: #fff5f5; }
.card-title { font-size: 16px; font-weight: 700; margin: 0; }
.card-desc { font-size: 13px; color: #64748b; }
.preview-card { margin-top: 20px; }
.preview-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px; }
</style>
