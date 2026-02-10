<template>
  <TablePageLayout>
    <!-- ================= 标题 ================= -->
    <template #title>业务文件中心</template>
    <template #subtitle>
      统一管理客户 / 订单 / 业务相关文件资料
      <span class="muted">（总数 {{ pagedResult.total }}，今日上传 {{ todayCount }}）</span>
    </template>

    <!-- ================= 操作区 ================= -->
    <template #actions>
<el-button
  type="primary"
  :icon="Upload"
  plain
  @click="openUpload"
>
  上传文件
</el-button>

<el-button
  type="success"
  plain
  icon="Download"
  :disabled="!selectedFiles.length"
  @click="exportZip"
>
  批量导出 ZIP
</el-button>

      <el-button
        type="success"
        :icon="Download"
        plain
        :disabled="!selectedFiles.length"
        @click="handleBatchDownload"
      >
        批量下载
      </el-button>

      <el-button
        type="warning"
        plain
        :icon="Folder"
        :disabled="!selectedFiles.length"
        @click="openMoveDialog"
      >
        批量移动分类
      </el-button>

      <el-button
        type="danger"
        plain
        :icon="Delete"
        :disabled="!selectedFiles.length"
        @click="handleBatchDelete"
      >
        批量删除
      </el-button>
	  
<el-button
  v-show="brokenCount > 0"
  type="danger"
  plain
  @click="clearBrokenFiles"
>
  清理失效文件
</el-button>


    </template>

    <!-- ================= 搜索区 ================= -->
    <template #search>
      <el-card shadow="never" class="section-card no-print">
        <el-form :model="filters" label-width="90px">
          <el-row :gutter="20">
            <el-col :span="5">
              <el-form-item label="文件名">
                <el-input v-model="filters.keyword" clearable placeholder="搜索文件名" />
              </el-form-item>
            </el-col>

            <el-col :span="5">
              <el-form-item label="客户">
                <el-input v-model="filters.customer" clearable placeholder="客户姓名" />
              </el-form-item>
            </el-col>

            <el-col :span="5">
              <el-form-item label="订单号">
                <el-input v-model="filters.orderCode" clearable placeholder="订单编号" />
              </el-form-item>
            </el-col>

            <el-col :span="5">
<el-form-item label="代理联系人">
  <el-select
    v-model="filters.agentContact"
    filterable
    clearable
    class="w-100"
    placeholder="选择或输入代理联系人"
  >
    <el-option
      v-for="a in agentContactOptions"
      :key="a"
      :label="a"
      :value="a"
    />
  </el-select>
</el-form-item>

            </el-col>

            <el-col :span="4" class="flex-end">
              <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
              <el-button :icon="Refresh" @click="resetFilters">重置</el-button>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="6">
              <el-form-item label="分类">
                <el-select v-model="filters.category" clearable class="w-100">
                  <el-option v-for="c in flatCategories" :key="c" :label="c" :value="c" />
                </el-select>
              </el-form-item>
            </el-col>

            <el-col :span="6">
              <el-form-item label="类型">
                <el-select v-model="filters.fileType" clearable class="w-100">
                  <el-option label="图片" value="image" />
                  <el-option label="PDF" value="pdf" />
                  <el-option label="其他" value="other" />
                </el-select>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="上传时间">
                <el-date-picker
                  v-model="filters.dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始"
                  end-placeholder="结束"
                  value-format="YYYY-MM-DD"
                  :shortcuts="dateShortcuts"
                  class="w-100"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </el-card>
    </template>

    <!-- ================= 主体 ================= -->
<template #table>
  <div
    class="file-layout"
    ref="hotkeyScopeEl"
    tabindex="0"
    @mousedown="onBoxMouseDown"
  >
    <!-- 框选可视层 -->
    <div
      v-show="boxSelecting"
      class="select-box"
      :style="selectBoxStyle"
    />

    <!-- ===== 左侧：分类树 + 统计面板 ===== -->
    <el-card shadow="never" class="tree-card">
      <div class="tree-title">文件分类</div>
      <el-tree
        :data="categoryTreeWithCount"
        node-key="id"
        default-expand-all
        highlight-current
        @node-click="handleCategoryClick"
      />

      <div class="stats-panel">
        <div class="stats-title">统计面板</div>

        <div class="stat-row">
          <div class="stat-k">当前筛选</div>
          <div class="stat-v">{{ pagedResult.total }}</div>
        </div>
        <div class="stat-row">
          <div class="stat-k">已选中</div>
          <div class="stat-v">{{ selectedFiles.length }}</div>
        </div>

        <div class="stat-group">
          <div class="stat-group-title">按类型统计</div>
          <div class="chips">
            <span
              v-for="it in typeStats"
              :key="it.key"
              class="chip"
              @click="filters.fileType = it.key; handleSearch()"
            >
              {{ typeLabel(it.key) }} · {{ it.count }}
            </span>
          </div>
        </div>

        <div class="stat-group">
          <div class="stat-group-title">按分类统计</div>
          <div class="chips">
            <span
              v-for="it in topCategoryStats"
              :key="it.key"
              class="chip"
              @click="filters.category = it.key; handleSearch()"
              :title="it.key"
            >
              {{ it.key || '未分类' }} · {{ it.count }}
            </span>
          </div>
        </div>
      </div>
    </el-card>

    <!-- ===== 右侧文件区 ===== -->
<el-card shadow="never" class="file-card">
  <!-- 固定工具栏 -->
  <div class="view-toolbar">
        <div class="toolbar-left">
          <el-tag v-if="clipboard.items.length" type="info" effect="plain">
            剪贴板：{{ clipboard.items.length }} 项（{{ clipboard.mode === 'copy' ? '复制' : '移动' }}）
          </el-tag>

          <el-tag v-if="brokenCount" type="danger" effect="plain" class="ml-2">
            发现 {{ brokenCount }} 个失效文件（旧版 blob 链接）
          </el-tag>
        </div>

        <div class="toolbar-right">
          <el-segmented
            v-model="viewMode"
            :options="[
              { label: '表格模式', value: 'table' },
              { label: '卡片模式', value: 'card' }
            ]"
          />

          <el-select v-model="sortBy" size="small" class="ml-2" style="width:140px">
            <el-option label="时间倒序" value="time_desc" />
            <el-option label="时间正序" value="time_asc" />
            <el-option label="文件名" value="name" />
            <el-option label="客户" value="customer" />
          </el-select>
        </div>
      </div>
	  
  <!-- 可滚动内容区 -->
  <div class="file-body">
      <!-- ===== 表格模式 ===== -->
      <el-table
        v-if="viewMode === 'table'"
        :data="pagedFiles"
        row-key="id"
        :row-class-name="rowClassName"
        border
        stripe
        highlight-current-row
        @selection-change="val => (selectedFiles = val)"
      >
        <el-table-column type="selection" width="40" />

        <el-table-column label="预览" width="90">
          <template #default="scope">
            <div class="preview-cell">
              <img
                v-if="scope.row.fileType === 'image'"
                :src="scope.row.previewUrl"
                class="thumb"
                @click="previewFile(scope.row)"
              />
              <el-icon v-else><Document /></el-icon>

              <el-tag
                v-if="scope.row._broken"
                size="small"
                type="danger"
                effect="plain"
                class="broken-tag"
              >
                失效
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="name" label="文件名" min-width="220">
          <template #default="scope">
            <div class="name-cell">
              <span class="name-text">{{ scope.row.name }}</span>
              <span class="name-sub muted">
                {{ typeLabel(scope.row.fileType) }} · {{ prettySize(scope.row.size || 0) }}
              </span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="category" label="分类" width="140" />

        <el-table-column label="客户" width="150">
          <template #default="scope">
            <el-button link type="primary" @click="jumpToCustomer(scope.row)">
              {{ scope.row.customerName || '-' }}
            </el-button>
          </template>
        </el-table-column>

<el-table-column label="代理" width="180">
  <template #default="scope">
    <span>
      {{
        [scope.row.agent_company_name, scope.row.agent_contact_name]
          .filter(Boolean)
          .join(' - ') || '-'
      }}
    </span>
  </template>
</el-table-column>


        <el-table-column label="订单号" width="180">
          <template #default="scope">
            <el-button
              v-if="scope.row.orderCode || scope.row.orderId"
              link
              type="primary"
              @click="jumpToOrder(scope.row)"
            >
              {{ scope.row.orderCode || scope.row.orderId }}
            </el-button>
            <span v-else class="muted">-</span>
          </template>
        </el-table-column>

        <el-table-column prop="uploadedBy" label="上传人" width="100" />
        <el-table-column prop="uploadedAt" label="时间" width="160" />

        <el-table-column label="操作" width="260" fixed="right">
          <template #default="scope">
            <el-button
              link
              type="primary"
              :disabled="scope.row._broken"
              @click="previewFile(scope.row)"
            >
              预览
            </el-button>
            <el-button
              link
              type="success"
              :disabled="scope.row._broken"
              @click="downloadFile(scope.row)"
            >
              下载
            </el-button>
            <el-button
              link
              type="danger"
              @click="deleteFile(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- ===== 卡片模式 ===== -->
      <div v-else class="card-grid">
        <div
          v-for="f in pagedFiles"
          :key="f.id"
          class="file-card-item"
          @click="toggleSelect(f)"
          :data-file-id="f.id"
          :class="{
            active: selectedFiles.some(x => x.id === f.id),
            broken: !!f._broken,
            'highlight-row':
              String(f.orderId) === String(route.query.orderId || route.query.highlight) ||
              String(f.orderCode) === String(route.query.orderId || route.query.highlight)
          }"
        >
          <div class="hover-actions">
            <el-button size="small" :disabled="f._broken" @click.stop="previewFile(f)">预览</el-button>
            <el-button size="small" :disabled="f._broken" @click.stop="downloadFile(f)">下载</el-button>
            <el-button size="small" @click.stop="jumpToOrder(f)">订单</el-button>
          </div>

          <div class="broken-flag" v-if="f._broken">失效</div>

          <img v-if="f.fileType === 'image'" :src="f.previewUrl" />
          <div v-else class="file-icon">
            <el-icon><Document /></el-icon>
          </div>

          <div class="file-name">{{ f.name }}</div>
          <div class="file-meta">
            {{ f.customerName || '-' }} | {{ f.orderCode || '-' }}
          </div>
        </div>
      </div>
	    </div>
    </el-card>
  </div>
</template>


    <!-- ================= 分页 ================= -->
    <template #pagination>
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        :total="pagedResult.total"
      />
    </template>
  </TablePageLayout>
      <!-- ================= 上传抽屉 ================= -->
    <el-drawer v-model="uploadVisible" title="上传文件" size="420px" teleport="body" @opened="focusHotkeyScope">
      <el-form label-width="90px">
        <el-form-item label="订单号">
          <el-input v-model="uploadForm.orderCode" disabled />
        </el-form-item>

        <el-form-item label="客户">
          <el-input v-model="uploadForm.customerName" disabled />
        </el-form-item>

        <el-form-item label="分类">
          <el-select v-model="uploadForm.category" class="w-100">
            <el-option v-for="c in flatCategories" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>

        <el-upload
          drag
          multiple
          :auto-upload="false"
          :on-change="handleFilePick"
          :on-remove="handleFileRemove"
          :file-list="pickedFileList"
        >
          <template #trigger>
            <el-button type="primary" plain :icon="FolderOpened">选择文件</el-button>
          </template>

          <el-icon><Upload /></el-icon>
          <div>拖拽文件到这里 或 点击“选择文件”</div>

          <template #tip>
            <div class="muted" style="line-height: 1.4;">
              ⚠ 为保证“永久可预览/可下载”，系统会把文件内容写入本地存储（Base64）。<br />
              若文件太大，浏览器 localStorage 可能容量不足（常见 5~10MB）。
            </div>
          </template>
        </el-upload>
      </el-form>

      <template #footer>
        <el-button @click="uploadVisible = false">取消</el-button>
        <el-button type="primary" :loading="uploading" @click="commitUpload">保存</el-button>
      </template>
    </el-drawer>

    <!-- ================= 批量移动 ================= -->
    <el-dialog v-model="moveVisible" title="批量移动分类" width="400px">
      <el-form label-width="90px">
        <el-form-item label="新分类">
          <el-select v-model="moveCategory" class="w-100">
            <el-option v-for="c in flatCategories" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="moveVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmMove">确认移动</el-button>
      </template>
    </el-dialog>

    <!-- ================= 预览弹窗 ================= -->
    <el-dialog v-model="previewVisible" title="文件预览" width="70vw" top="6vh">
      <template v-if="previewTarget">
        <div class="preview-header">
          <div class="preview-name">{{ previewTarget.name }}</div>
          <div class="preview-meta muted">
            {{ typeLabel(previewTarget.fileType) }} · {{ prettySize(previewTarget.size || 0) }} · {{ previewTarget.uploadedAt }}
          </div>
        </div>

        <div v-if="previewTarget._broken" class="broken-box">
          该文件为旧版 blob 临时链接，已失效。建议删除后重新上传。
        </div>

        <div v-else class="preview-body">
          <img
            v-if="previewTarget.fileType === 'image'"
            :src="previewTarget.previewUrl"
            class="preview-img"
          />

          <iframe
            v-else-if="previewTarget.fileType === 'pdf'"
            :src="previewTarget.previewUrl"
            class="preview-frame"
          ></iframe>

          <div v-else class="preview-other">
            <el-icon style="font-size: 42px;"><Document /></el-icon>
            <div class="muted" style="margin-top: 8px;">
              该类型不支持内嵌预览，请下载查看
            </div>
            <div style="margin-top: 12px;">
              <el-button type="primary" @click="downloadFile(previewTarget)">下载</el-button>
            </div>
          </div>
        </div>
      </template>

      <template #footer>
        <el-button @click="previewVisible = false">关闭</el-button>
        <el-button v-if="previewTarget && !previewTarget._broken" type="primary" @click="downloadFile(previewTarget)">下载</el-button>
      </template>
    </el-dialog>
</template>

<script setup>
import { reactive } from 'vue'
import { saveAs } from 'file-saver'
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Upload,
  Download,
  Delete,
  Search,
  Refresh,
  Document,
  Folder,
  CopyDocument,
  DocumentAdd,
  FolderOpened,
  Picture
} from '@element-plus/icons-vue'
import TablePageLayout from '@/layouts/TablePageLayout.vue'
import { fileService } from '@/domain/services/fileService'
import { db } from '@/utils/storage'


const buildFileSnapshot = (file) => ({
  id: file.id,
  name: file.name,
  filename: file.name,
  category: file.category,
  orderId: file.orderId,
  orderCode: file.orderCode,
  customerName: file.customerName,

  // ⭐新代理模型
  agent_company_name: file.agent_company_name || '',
  agent_contact_name: file.agent_contact_name || '',

  size: file.size,
  uploadedAt: file.uploadedAt,
  uploadedBy: file.uploadedBy,
  fileType: file.fileType
})


let filterTimer = null
const triggerFilterSearch = () => {
  clearTimeout(filterTimer)
  filterTimer = setTimeout(() => {
    currentPage.value = 1
    loadFiles()
  }, 300)
}



const router = useRouter()
const route = useRoute()


const clipboard = reactive({
  items: [],
  mode: 'copy'
})

// ================= ZIP导出 =================
// 🟢 ADD：交给 fileService 处理业务逻辑
const exportZip = async () => {
  if (!selectedFiles.value.length) {
    return ElMessage.warning('请先选择文件')
  }

  try {
    const blob = await fileService.exportZip(selectedFiles.value)

    const name =
      (selectedFiles.value[0]?.customerName || '客户') +
      '_资料_' +
      new Date().toISOString().slice(0, 10) +
      '.zip'

    saveAs(blob, name)
  } catch (e) {
    console.error(e)
    ElMessage.error('导出失败')
  }
}


// ===== 热键作用域（模拟“本地文件操作体验”）=====
const hotkeyScopeEl = ref(null)
const focusHotkeyScope = async () => {
  await nextTick()
  requestAnimationFrame(() => {
    hotkeyScopeEl.value?.focus?.()
  })
}

// ================= 框选系统（Windows 风格）=================
const boxSelecting = ref(false)
const boxStart = ref({ x: 0, y: 0 })
const boxEnd = ref({ x: 0, y: 0 })

const selectBoxStyle = computed(() => {
  const x = Math.min(boxStart.value.x, boxEnd.value.x)
  const y = Math.min(boxStart.value.y, boxEnd.value.y)
  const w = Math.abs(boxStart.value.x - boxEnd.value.x)
  const h = Math.abs(boxStart.value.y - boxEnd.value.y)

  return {
    left: x + 'px',
    top: y + 'px',
    width: w + 'px',
    height: h + 'px'
  }
})

// 鼠标按下开始框选
const onBoxMouseDown = (e) => {
  // 只允许左键
  if (e.button !== 0) return

  // 点在文件卡片上 → 不启动框选（交给原点击逻辑）
  if (e.target.closest('.file-card-item')) return

  e.preventDefault()

  boxSelecting.value = true
  boxStart.value = { x: e.clientX, y: e.clientY }
  boxEnd.value = { x: e.clientX, y: e.clientY }

  window.addEventListener('mousemove', onBoxMouseMove)
  window.addEventListener('mouseup', onBoxMouseUp)

  // 没按 Ctrl / Shift → 清空原选中
  if (!e.ctrlKey && !e.shiftKey) {
    selectedFiles.value = []
  }
}

const onBoxMouseMove = (e) => {
  if (!boxSelecting.value) return
  boxEnd.value = { x: e.clientX, y: e.clientY }
  updateBoxSelection(e.ctrlKey || e.shiftKey)
}

const onBoxMouseUp = () => {
  boxSelecting.value = false
  window.removeEventListener('mousemove', onBoxMouseMove)
  window.removeEventListener('mouseup', onBoxMouseUp)
}

// 框选命中检测
const updateBoxSelection = (append) => {
  const minX = Math.min(boxStart.value.x, boxEnd.value.x)
  const maxX = Math.max(boxStart.value.x, boxEnd.value.x)
  const minY = Math.min(boxStart.value.y, boxEnd.value.y)
  const maxY = Math.max(boxStart.value.y, boxEnd.value.y)

  const cards = document.querySelectorAll('.file-card-item')
  const hitIds = []

  cards.forEach((el) => {
    const rect = el.getBoundingClientRect()

    const hit =
      rect.left < maxX &&
      rect.right > minX &&
      rect.top < maxY &&
      rect.bottom > minY

    if (hit) {
      hitIds.push(el.dataset.fileId)
    }
  })

  const hitFiles = pagedFiles.value.filter(f =>
    hitIds.includes(String(f.id))
  )

  if (append) {
    const map = new Map(selectedFiles.value.map(f => [String(f.id), f]))
    hitFiles.forEach(f => map.set(String(f.id), f))
    selectedFiles.value = Array.from(map.values())
  } else {
    selectedFiles.value = hitFiles
  }
}


// ===== 行高亮（保留你原逻辑）=====
const rowClassName = ({ row }) => {
  const target = String(route.query.orderId || route.query.highlight || '')
  if (!target) return ''
  if (String(row.orderId) === target || String(row.orderCode) === target) return 'highlight-row'
  return ''
}

// ===== 分类权威源（保留）=====
const SYSTEM_CATEGORIES = [
  '护照封面',
  '护照首页',
  '签证页',
  '劳工证',
  '签证成品',
  '劳工证成品',
  '收据',
  '发票'
]

// ===== 基础状态 =====
const currentPage = ref(1)
const pageSize = ref(20)
const viewMode = ref('table')
const uploadVisible = ref(false)
const moveVisible = ref(false)
const selectedFiles = ref([])
const moveCategory = ref('')
const sortBy = ref('time_desc')

const uploading = ref(false)

const filters = ref({
  keyword: '',
  customer: '',
  orderCode: '',
  agentContact: '',
  category: '',
  fileType: '',
  dateRange: []
})

// 上传表单（新增 agentContact，不影响旧链路）
const uploadForm = ref({
  category: '',
  orderId: '',
  orderCode: '',
  customerName: '',
  agent_company_name: '',
  agent_contact_name: ''
})

const pagedResult = ref({
  items: [],
  total: 0
})

const filteredFiles = computed(() => pagedResult.value.items)
const pagedFiles = computed(() => pagedResult.value.items)

// ===== 数据库统计状态 =====
const todayCount = ref(0)
const brokenCount = ref(0)
const agentContactOptions = ref([])
const categoryTreeWithCount = ref([])
const typeStats = ref([])
const topCategoryStats = ref([])

const loadStats = async () => {
  const b = await fileService.getStatsBundle()

  agentContactOptions.value = b.agents
  categoryTreeWithCount.value = b.categories
  typeStats.value = b.global.typeStats
  todayCount.value = b.global.todayCount
  brokenCount.value = b.global.brokenCount
  topCategoryStats.value = b.categories
}



// el-upload 选中的文件列表（用于显示）
const uploadRef = ref(null)
const pickedFileList = ref([])

// ===== 你的快捷日期（扩展一下）=====
const dateShortcuts = [
  {
    text: '今天',
    value: () => {
      const d = new Date().toISOString().slice(0, 10)
      return [d, d]
    }
  },
  {
    text: '近7天',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 6)
      return [start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)]
    }
  },
  {
    text: '近30天',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 29)
      return [start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)]
    }
  }
]

// =====================
// 核心：文件持久化策略（A版本关键）
// 旧：URL.createObjectURL -> 会失效
// 新：读 File -> Base64 DataURL -> 存入 localStorage
// =====================
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

const buildPreviewUrl = (f) => {
  // 新版优先 dataUrl（永久）
  if (f.dataUrl && String(f.dataUrl).startsWith('data:')) return f.dataUrl

  // 旧版 blob: 会失效，但可能当前会话还能打开
  if (f.url && String(f.url).startsWith('blob:')) return f.url

  // 兼容：如果旧数据把 dataUrl 存在 url
  if (f.url && String(f.url).startsWith('data:')) return f.url

  return ''
}

// 兼容/增强：尝试从订单补全 agentContact（不破坏你现有结构；拿不到也不报错）
const tryGetOrders = () => {
  try {
    // 你项目里很可能有 db.getRaw('ORDERS') / db.get('ORDERS')
    if (typeof db.getRaw === 'function') return db.getRaw('ORDERS') || []
    if (typeof db.get === 'function') return db.get('ORDERS') || []
    return []
  } catch {
    return []
  }
}

const normalizeCenterFile = (f, orderIndexMap) => {
  const fileType = f.fileType || detectFileType(f.mimeType, f.name)
  const previewUrl = buildPreviewUrl(f)

  // 判定失效：旧版 blob 且没有 dataUrl
  const broken =
    (!f.dataUrl || !String(f.dataUrl).startsWith('data:')) &&
    (String(f.url || '').startsWith('blob:'))

  // 尝试补全 agentContact：优先文件自身字段；否则通过 orderId/orderCode 查订单
// ⭐企业正式版：代理信息标准化
let agent_company_name = f.agent_company_name || ''
let agent_contact_name = f.agent_contact_name || ''

// 如果文件没有代理 → 从订单补全
if (!agent_contact_name) {
  const key = String(f.orderId || f.orderCode || '').trim()
  if (key && orderIndexMap?.has(key)) {
    const agent = orderIndexMap.get(key)
    agent_company_name = agent?.company || ''
    agent_contact_name = agent?.contact || ''
  }
}


  return {
    id: f.id,
    name: f.name,
    category: f.category || '未分类',

    orderId: f.orderId,
    orderCode: f.orderCode,
    customerId: f.customerId,
    customerName: f.customerName,
    rowId: f.rowId,

    // 新增（不破坏旧逻辑）：持久内容
    dataUrl: f.dataUrl || (String(f.url || '').startsWith('data:') ? f.url : ''),
    url: f.url || '',

    fileType,
    mimeType: f.mimeType || '',
    size: Number(f.size || 0),

    uploadedAt: f.uploadedAt,
    uploadedBy: f.uploadedBy || 'system',

    // 统计筛选维度
agent_company_name,
agent_contact_name,

    // UI增强字段
    previewUrl,
    _broken: broken || !previewUrl
  }
}

// ================= 恢复联动支持 =================
const clearAllFilters = () => {
  filters.value = {
    keyword: '',
    customer: '',
    orderCode: '',
    agentContact: '',
    category: '',
    fileType: '',
    dateRange: []
  }
  currentPage.value = 1
}

const jumpToRestoredFile = async (fileId) => {
  if (!fileId) return

  await Promise.all([loadFiles(), loadStats()])

  clearAllFilters()

  await nextTick()

  const idx = rawFiles.value.findIndex(f => String(f.id) === String(fileId))
  if (idx === -1) return

  currentPage.value = Math.floor(idx / pageSize.value) + 1

  await nextTick()

  const el =
    document.querySelector(`[data-file-id="${fileId}"]`) ||
    document.querySelector('.highlight-row')

  if (el) {
    el.classList.add('highlight-row')
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })

    // 高亮闪一下
    setTimeout(() => el.classList.remove('highlight-row'), 2000)
  }
}




// ================= 数据加载 =================
const loadFiles = async () => {
  const res = await fileService.listPaged({
    page: currentPage.value,
    pageSize: pageSize.value,
    sortBy: sortBy.value,
    filters: filters.value
  })

  // ✅ 关键：把分页结果补齐 previewUrl/_broken/fileType
  const normalized = res.items.map(f => {
    const fileType = f.fileType || detectFileType(f.mimeType, f.name)
    const previewUrl = buildPreviewUrl(f)

    const broken =
      (!f.dataUrl || !String(f.dataUrl).startsWith('data:')) &&
      String(f.url || '').startsWith('blob:')

    return {
      ...f,
      fileType,
      previewUrl,
      _broken: broken || !previewUrl
    }
  })

  pagedResult.value = {
    total: res.total,
    items: normalized
  }
}


// ================= 分类树 =================


const flatCategories = computed(() =>
  categoryTreeWithCount.value.map((n) => String(n.label).replace(/\s*\(.*\)$/, ''))
)

// ================= 统计 =================


const buildCount = (list, keyFn) => {
  const m = new Map()
  for (const item of list) {
    const k = String(keyFn(item) ?? '')
    m.set(k, (m.get(k) || 0) + 1)
  }
  return Array.from(m.entries())
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
}

// ================= 过滤 + 排序 =================
const inDateRange = (uploadedAt, range) => {
  if (!range || !range.length) return true
  const [start, end] = range
  if (!start || !end) return true
  const d = String(uploadedAt || '').slice(0, 10)
  return d >= start && d <= end
}


// ================= 行为 =================

watch([currentPage, pageSize, sortBy], () => loadFiles())

watch(
  filters,
  () => triggerFilterSearch(),
  { deep: true }
)


const handleSearch = () => {
  currentPage.value = 1
  loadFiles()
}


const resetFilters = () => {
  filters.value = {
    keyword: '',
    customer: '',
    orderCode: '',
    agentContact: '',
    category: '',
    fileType: '',
    dateRange: []
  }
  handleSearch()
}

const handleCategoryClick = (node) => {
  const label = String(node.label).replace(/\s*\(.*\)$/, '')
  filters.value.category = label
  handleSearch()
}

// ================= 上传 =================
const openUpload = async () => {
  try {
    console.log('✅ openUpload clicked')

    uploadForm.value.category = flatCategories.value[0] || '未分类'
    uploadForm.value.orderId = route.query.orderId || ''
    uploadForm.value.orderCode = route.query.orderCode || ''
    uploadForm.value.customerName = route.query.customerName || ''
uploadForm.value.agent_company_name = route.query.agentCompany || ''
uploadForm.value.agent_contact_name = route.query.agentContact || ''


    pickedFileList.value = []
    uploadVisible.value = true

    await nextTick()
    focusHotkeyScope()
  } catch (e) {
    console.error('❌ openUpload error:', e)
    ElMessage.error('打开上传窗口失败')
  }
}



const handleFilePick = (file, fileList) => {
  pickedFileList.value = fileList || []
}

const handleFileRemove = (_file, fileList) => {
  pickedFileList.value = fileList || []
}

const commitUpload = async () => {
  if (!uploadForm.value.category || !pickedFileList.value.length) {
    return ElMessage.warning('请选择分类和文件')
  }

  uploading.value = true
  try {
    for (const it of pickedFileList.value) {
      const raw = it?.raw
      if (!raw) continue

      const dataUrl = await readFileAsDataURL(raw)
      const fileType = detectFileType(raw.type, raw.name)

// ⭐从订单自动补全代理（正式版）
const orders = tryGetOrders()

const order = orders.find(o =>
  String(o.id) === String(uploadForm.value.orderId) ||
  String(o.order_no || o.orderCode || '') === String(uploadForm.value.orderCode)
)

await fileService.upload({
  name: raw.name,
  category: uploadForm.value.category,

  orderId: uploadForm.value.orderId || '',
  orderCode: uploadForm.value.orderCode || '',
  customerName: uploadForm.value.customerName || '',

  // ⭐企业正式版代理字段（最终形态）
  agent_company_id: order?.agent_company_id || '',
  agent_company_name: order?.agent_company_name || '',
  agent_contact_id: order?.agent_contact_id || '',
  agent_contact_name: order?.agent_contact_name || '',


        fileType,
        mimeType: raw.type,
        size: raw.size,

        dataUrl,
        uploadedBy: '当前用户'
      })
    }

    pickedFileList.value = []
    uploadVisible.value = false
    await Promise.all([loadFiles(), loadStats()])

    ElMessage.success('上传成功（已永久保存）')
  } catch (e) {
    // localStorage 容量不足最常见
    console.error(e)
    ElMessage.error('保存失败：可能是文件过大导致本地存储容量不足（建议压缩/分批/改小文件）')
  } finally {
    uploading.value = false
  }
}

// ================= 预览 =================
const previewVisible = ref(false)
const previewTarget = ref(null)

const previewFile = (f) => {
  if (!f || f._broken) {
    previewTarget.value = f
    previewVisible.value = true
    return
  }
  previewTarget.value = f
  previewVisible.value = true
}

// ================= 下载 =================
const downloadFile = (f) => {
  if (!f || f._broken) return ElMessage.warning('文件已失效（旧版 blob 链接），请重新上传')
  const a = document.createElement('a')
  a.href = f.previewUrl
  a.download = f.name
  a.click()
}

// ================= 删除 =================
const deleteFile = (file) => {
  if (!file) return

  console.log('🟡 DELETE CLICK', file)

  ElMessageBox.confirm(
    `确定要删除文件 "${file.name}" 吗？\n它将进入系统回收站。`,
    '删除确认',
    { type: 'warning' }
 ).then(async () => {
    try {
      // 🟢 ADD：删除统一走 fileService（内部会 softDelete + repository.delete）
      await fileService.delete(file, '管理员')
      await Promise.all([loadFiles(), loadStats()])

      ElMessage.success('已移入回收站')
    } catch (e) {
      console.error('🔴 DELETE ERROR', e)
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}


const handleBatchDelete = () => {
  if (!selectedFiles.value.length) return

  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedFiles.value.length} 个文件吗？\n它们将进入系统回收站。`,
    '批量删除确认',
    { type: 'warning' }
  ).then(async () => {
    try {
      // 🟢 ADD：批量删除统一走 service
      await fileService.batchDelete(selectedFiles.value, '管理员')

      selectedFiles.value = []
      await Promise.all([loadFiles(), loadStats()])


      ElMessage.success('已批量移入回收站')
    } catch (e) {
      console.error(e)
      ElMessage.error('批量删除失败')
    }
  }).catch(() => {})
}


// ================= 批量下载 =================
const handleBatchDownload = () => {
  if (!selectedFiles.value.length) return
  // 逐个触发（浏览器可能拦截多次自动下载，这是正常行为）
  selectedFiles.value.forEach((f) => downloadFile(f))
}

// ================= 批量移动 =================
const openMoveDialog = () => {
  moveCategory.value = flatCategories.value[0] || '未分类'
  moveVisible.value = true
}

const confirmMove = async () => {
  try {
    for (const f of selectedFiles.value) {
      await fileService.updateCategory(f.id, moveCategory.value)
    }

    moveVisible.value = false
    selectedFiles.value = []
    await Promise.all([loadFiles(), loadStats()])

    ElMessage.success('分类已更新')
  } catch (e) {
    console.error(e)
    ElMessage.error('分类更新失败')
  }
}

// ================= 卡片选择 =================
const toggleSelect = (f) => {
  const idx = selectedFiles.value.findIndex((x) => x.id === f.id)
  if (idx === -1) selectedFiles.value.push(f)
  else selectedFiles.value.splice(idx, 1)
}
// ================= 清理失效文件 =================
// 🟢 ADD：交给 fileService 做数据治理
const clearBrokenFiles = () => {
  ElMessageBox.confirm(
    `发现 ${brokenCount.value} 个失效文件，是否全部清理？`,
    '清理确认',
    { type: 'warning' }
  ).then(async () => {
    try {
      const removed = await fileService.clearBroken()
      await Promise.all([loadFiles(), loadStats()])

      ElMessage.success(`已清理 ${removed} 个失效文件`)
    } catch (e) {
      console.error(e)
      ElMessage.error('清理失败')
    }
  })
}

// ================= 跳转联动（保留你逻辑）=================
const jumpToOrder = (f) => {
  const key = f.orderId || f.orderCode
  if (!key) return ElMessage.warning('未绑定订单')

  router.push({
    name: 'business.orders',
    query: { highlight: String(key).trim() }
  })
}

const jumpToCustomer = (f) => {
  if (!f.customerName) return ElMessage.warning('未绑定客户')

  router.push({
    name: 'business.orders',
    query: { customerName: f.customerName }
  })
}

// ================= 工具函数 =================
const prettySize = (bytes) => {
  const b = Number(bytes || 0)
  if (!b) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let n = b
  let i = 0
  while (n >= 1024 && i < units.length - 1) {
    n = n / 1024
    i++
  }
  return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

const typeLabel = (t) => {
  if (t === 'image') return '图片'
  if (t === 'pdf') return 'PDF'
  return '其他'
}

// ================= 初始化 =================
onMounted(async () => {
  await Promise.all([
    loadFiles(),
    loadStats()
  ])

  const target = String(route.query.orderId || route.query.highlight || '').trim()
  const restoredId = String(route.query.restoredFileId || '').trim()
if (restoredId) {
  jumpToRestoredFile(restoredId)
}

  if (target) {
    nextTick(() => {
      const el = document.querySelector('.highlight-row')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    })
  }

  // 从订单页跳转过来：自动打开上传（保留你逻辑）
  if (route.query.orderId || route.query.orderCode) {
    openUpload()
  }

  // 默认聚焦热键作用域（让 Ctrl+C/V/Delete 直接可用）
  focusHotkeyScope()
})

// ================= 临时函数 =================
window.__FILES_DEBUG__ = () => {
  const list = JSON.parse(localStorage.FILES_CENTER || '[]')
  const last = list.slice(-1)[0]
  console.table(last)
  return last
}

window.__FILES_VM__ = {
  openUpload,
  uploadVisible
}


</script>

<style scoped>
.file-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 12px;
  outline: none;
}
.tree-title {
  font-weight: 700;
  margin-bottom: 10px;
}

.view-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}
.toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.preview-cell {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.thumb {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
}
.broken-tag {
  position: absolute;
  right: -6px;
  bottom: -6px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}
.file-card-item {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 10px;
  cursor: pointer;
  position: relative;
  user-select: none;
}
.file-card-item.active {
  border-color: #2563eb;
  background: rgba(37, 99, 235, 0.05);
}
.file-card-item.broken {
  opacity: 0.72;
  border-style: dashed;
}
.broken-flag {
  position: absolute;
  left: 10px;
  top: 10px;
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 12px;
  background: rgba(239, 68, 68, 0.12);
  color: #ef4444;
}

.hover-actions {
  position: absolute;
  top: 6px;
  right: 6px;
  display: flex;
  gap: 4px;
  opacity: 0;
}
.file-card-item:hover .hover-actions {
  opacity: 1;
}
.file-icon {
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  color: #64748b;
}
.file-name {
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.file-meta {
  font-size: 11px;
  color: #64748b;
}

.name-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.name-text {
  font-weight: 700;
}
.name-sub {
  font-size: 11px;
}

.flex-end {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.w-100 {
  width: 100%;
}
.muted {
  color: #94a3b8;
  margin-left: 6px;
}
.ml-2 {
  margin-left: 8px;
}

.highlight-row {
  outline: 2px solid #409eff;
  background: rgba(64, 158, 255, 0.08);
  transition: all 0.3s ease;
}

/* 统计面板 */
.stats-panel {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed #e5e7eb;
}
.stats-title {
  font-weight: 700;
  margin-bottom: 10px;
}
.stat-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 12px;
}
.stat-k {
  color: #64748b;
}
.stat-v {
  font-weight: 700;
}
.stat-group {
  margin-top: 10px;
}
.stat-group-title {
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 8px;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.chip {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background: #fff;
  cursor: pointer;
}
.chip:hover {
  border-color: #409eff;
}

/* 预览弹窗 */
.preview-header {
  padding-bottom: 10px;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 10px;
}
.preview-name {
  font-weight: 800;
  font-size: 15px;
}
.preview-body {
  min-height: 55vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
.preview-img {
  max-width: 100%;
  max-height: 60vh;
  border-radius: 10px;
}
.preview-frame {
  width: 100%;
  height: 60vh;
  border: none;
  border-radius: 10px;
}
.preview-other {
  text-align: center;
}
.broken-box {
  padding: 12px;
  border: 1px dashed rgba(239, 68, 68, 0.45);
  background: rgba(239, 68, 68, 0.06);
  border-radius: 10px;
  color: #b91c1c;
}

/* ================= 框选样式 ================= */
.select-box {
  position: fixed;
  border: 1px dashed #409eff;
  background: rgba(64, 158, 255, 0.15);
  z-index: 9999;
  pointer-events: none;
}

/* ================= 页面级滚动系统 ================= */
.file-layout {
  height: calc(100vh - 260px); /* 根据你顶部区域高度预留 */
  overflow: hidden;
}

/* 左侧分类独立滚动 */
.tree-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.tree-card .el-card__body {
  flex: 1;
  overflow-y: auto;
}

/* ================= 右侧文件区 ================= */
.file-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 关键：禁止 el-card body 滚动 */
.file-card .el-card__body {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 工具栏固定 */
.view-toolbar {
  flex-shrink: 0;
  background: white;
  padding-bottom: 8px;
  z-index: 2;
  border-bottom: 1px solid #e5e7eb;
}

/* 右侧内容区滚动 */
.file-body {
  flex: 1;
  overflow-y: auto;
  padding-right: 6px;
}



</style>
