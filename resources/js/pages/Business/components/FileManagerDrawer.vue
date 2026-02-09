<template>
  <el-drawer 
    v-model="internalVisible" 
    size="750px" 
    destroy-on-close
  >
    <template #header>
      <div class="drawer-header-pro">
        <div class="header-left">
          <el-icon size="20"><FolderOpened /></el-icon>
          <span class="header-title">资料库管理中心</span>
          <el-tag type="primary" v-if="customerData" size="large" effect="dark" class="name-tag">
            客户：{{ customerData.name }}
          </el-tag>
        </div>
        <div class="header-right">
          <el-button type="warning" plain icon="Share" @click="copyFileList">一键复制清单</el-button>
          <el-button type="info" plain icon="Files" @click="jumpToFileCenter">文件管理中心</el-button>
        </div>
      </div>
    </template>

    <div class="drawer-pro-content">
      <el-alert 
        title="文件将直接写入【文件中心】，这里是快捷面板。支持上传、预览、复制清单。" 
        type="info" 
        :closable="false" 
        show-icon
        class="mb-4"
      />

      <div v-for="(group, idx) in localGroups" :key="idx" class="pro-file-group">
        <div class="group-title-bar">
          <div class="title-left">
            <span class="idx-badge">{{ idx + 1 }}</span>
            <el-input 
              v-model="group.title" 
              :readonly="isFixed(group.title)"
              class="group-name-input"
            />
          </div>
        </div>

        <div class="group-content">
          <div class="file-grid">
            <div v-for="(file, fIdx) in group.files" :key="fIdx" class="file-item-card">
              <div class="file-icon" @click="previewFile(file)">
                <el-icon size="24" color="#409EFF"><Document /></el-icon>
              </div>
              <div class="file-info">
                <span class="file-name" @click="previewFile(file)" :title="file.name">{{ file.name }}</span>
                <div class="action-row">
                  <el-button link type="primary" icon="EditPen" @click="renameFile(file)">改名</el-button>
                  <el-button link type="danger" icon="CircleClose" @click="removeFile(file)">删除</el-button>
                </div>
              </div>
            </div>

            <el-upload
              action="#"
              :auto-upload="false"
              :on-change="(file) => handleUpload(file, idx)"
              :show-file-list="false"
              multiple
              class="upload-card-wrapper"
            >
              <div class="upload-trigger-btn">
                <el-icon><Plus /></el-icon>
                <span>点击上传到文件中心</span>
              </div>
            </el-upload>
          </div>
        </div>
      </div>

      <el-button 
        icon="CirclePlus" 
        @click="addGroup" 
        class="add-group-btn"
      >添加自定义资料项</el-button>
    </div>

    <template #footer>
      <div class="drawer-footer">
        <span class="footer-tip">共 {{ totalFilesCount }} 份资料（实时同步文件中心）</span>
        <div>
          <el-button size="large" @click="internalVisible = false">关闭</el-button>
        </div>
      </div>
    </template>
  </el-drawer>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ref, watch, computed, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  FolderOpened, Document, Plus, EditPen, CircleClose,
  Share, Files, CirclePlus
} from '@element-plus/icons-vue'
// 🟢 ADD：统一走文件服务
import { fileService } from '@/domain/services/fileService'


// ===== 文件读取 =====
const readFileAsDataURL = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('读取文件失败'))
    reader.readAsDataURL(file)
  })

const detectFileType = (mime = '', name = '') => {
  const m = String(mime).toLowerCase()
  const n = String(name).toLowerCase()
  if (m.startsWith('image/')) return 'image'
  if (m === 'application/pdf' || n.endsWith('.pdf')) return 'pdf'
  return 'other'
}

const router = useRouter()

const props = defineProps({
  visible: Boolean,
  customerData: Object,
  orderData: Object
})

const emit = defineEmits(['update:visible'])

const internalVisible = ref(false)

watch(
  () => props.visible,
  (v) => {
    internalVisible.value = !!v
  },
  { immediate: true }
)

watch(internalVisible, async (v) => {
  emit('update:visible', !!v)
  if (v) await loadFromCenter()
})


// ===== 固定分类 =====
const FIXED = ['护照封面', '护照首页', '签证页', '劳工证', '签证成品', '劳工证成品']

const localGroups = ref([])
const isFixed = (t) => FIXED.includes(t)

const totalFilesCount = computed(() =>
  (localGroups.value || []).reduce((s, g) => s + (g.files?.length || 0), 0)
)

// ===== 从文件中心加载 =====
const groupByCategory = (files) => {
  const map = new Map()

  FIXED.forEach(t => map.set(t, []))

  files.forEach(f => {
    const cat = f.category || '未分类'
    if (!map.has(cat)) map.set(cat, [])
    map.get(cat).push(f)
  })

  return Array.from(map.entries()).map(([title, files]) => ({
    title,
    files
  }))
}

// 🟢 ADD：从 fileService 读取（IndexedDB / API 都走这里）
const loadFromCenter = async () => {
  const all = (await fileService.list()) || []

  const orderId = String(props.orderData?.id || '')
  const orderCode = String(props.orderData?.order_no || props.orderData?.code || '')

  const scoped = all.filter(f =>
    String(f.orderId || '') === orderId ||
    String(f.orderCode || '') === orderCode
  )

  localGroups.value = groupByCategory(scoped)
}


// ===== 上传直写文件中心 =====
const handleUpload = async (file, gIdx) => {
  const raw = file?.raw
  if (!raw) return

  try {
    const dataUrl = await readFileAsDataURL(raw)

        // 🟢 ADD：上传统一走 fileService（不再写 localStorage）
    await fileService.upload({
      name: raw.name,

      category: localGroups.value[gIdx]?.title || '',

      orderId: props.orderData?.id || '',
      orderCode: props.orderData?.order_no || props.orderData?.code || '',
      customerName: props.customerData?.name || '',

      agentContact: '', // Drawer 里暂时没有这个字段

      fileType: detectFileType(raw.type, raw.name),
      mimeType: raw.type,
      size: raw.size,

      dataUrl,
      uploadedBy: '当前用户'
    })


    await loadFromCenter()
    ElMessage.success(`已上传：${raw.name}`)
  } catch (e) {
    console.error(e)
    ElMessage.error('上传失败，可能是文件过大或存储容量不足')
  }
}

// ===== 操作 =====
const renameFile = (file) => {
  ElMessageBox.prompt('请输入新的文件名', '修改文件名', {
    inputValue: file.name,
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  }).then(async ({ value }) => {
    const v = (value || '').trim()
    if (!v) return

    try {
      await fileService.update(file.id, { name: v })
      await loadFromCenter()
      ElMessage.success('名称已修改')
    } catch (e) {
      console.error(e)
      ElMessage.error('修改失败')
    }
  })
}

const removeFile = (file) => {
  ElMessageBox.confirm('确定删除此文件？', '删除确认', { type: 'warning' })
    .then(async () => {
      try {
        await fileService.delete(file, '管理员')
        await loadFromCenter()
        ElMessage.success('文件已删除')
      } catch (e) {
        console.error(e)
        ElMessage.error('删除失败')
      }
    })
}


// 🟢 ADD：支持 IndexedDB Blob / DataURL
const previewFile = async (file) => {
  if (!file) return

  try {
    const url = await fileService.getContent(file.id)
    window.open(url, '_blank')
  } catch (e) {
    console.error(e)
    ElMessage.error('预览失败')
  }
}


const copyFileList = () => {
  const text = (localGroups.value || [])
    .filter(g => (g.files?.length || 0) > 0)
    .map(g => `【${g.title}】: ${g.files.map(f => f.name).join(', ')}`)
    .join('\n')

  navigator.clipboard.writeText(text)
  ElMessage.success('清单已复制')
}

const jumpToFileCenter = () => {
  router.push({
    name: 'business.files',
    query: {
      orderId: props.orderData?.id || '',
      orderCode: props.orderData?.order_no || props.orderData?.code || '',
      customerName: props.customerData?.name || ''
    }
  })
}

const addGroup = () => localGroups.value.push({ title: '新增资料项', files: [] })
</script>

<style scoped>
/* 原样保留你的样式 */
.drawer-header-pro { display: flex; justify-content: space-between; align-items: center; width: 100%; padding-right: 20px; }
.header-left { display: flex; align-items: center; gap: 12px; }
.header-title { font-size: 18px; font-weight: 800; color: #1a1a1a; }
.name-tag { font-weight: bold; }

.drawer-pro-content { padding: 0 10px; }
.mb-4 { margin-bottom: 20px; }

.pro-file-group { border: 1px solid #ebeef5; border-radius: 10px; margin-bottom: 20px; overflow: hidden; box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05); }
.group-title-bar { background: #f8f9fb; padding: 10px 15px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #ebeef5; }
.title-left { display: flex; align-items: center; gap: 8px; }
.idx-badge { background: #909399; color: #fff; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 12px; }
.group-name-input :deep(.el-input__wrapper) { font-weight: bold; box-shadow: none !important; background: transparent; }

.group-content { padding: 15px; background: #fff; }
.file-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; }

.file-item-card { border: 1px solid #f0f2f5; border-radius: 6px; display: flex; padding: 8px; align-items: center; gap: 10px; background: #fafafa; transition: all 0.3s; }
.file-item-card:hover { border-color: #409EFF; background: #fff; }

.file-info { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
.file-name { font-size: 13px; color: #333; cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.file-name:hover { color: #409EFF; }
.action-row { display: flex; gap: 8px; }
.action-row :deep(.el-button) { font-size: 11px; padding: 0; height: auto; }

.upload-trigger-btn { height: 50px; border: 1px dashed #dcdfe6; border-radius: 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #909399; cursor: pointer; font-size: 12px; }
.upload-trigger-btn:hover { border-color: #409EFF; color: #409EFF; }

.add-group-btn { width: 100%; height: 45px; border-style: dashed; margin-top: 10px; }
.drawer-footer { display: flex; justify-content: space-between; align-items: center; padding: 10px 20px; }
.footer-tip { color: #94a3b8; font-size: 13px; }
</style>
