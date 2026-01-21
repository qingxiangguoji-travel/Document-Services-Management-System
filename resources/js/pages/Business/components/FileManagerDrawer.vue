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
        title="测试模式已开启：您可以直接点击上传查看 UI 效果，支持重命名和预览。" 
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
          <el-button 
            v-if="!isFixed(group.title)" 
            type="danger" 
            link 
            icon="Delete" 
            @click="removeGroup(idx)"
          >移除项目</el-button>
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
                  <el-button link type="primary" icon="EditPen" @click="renameFile(idx, fIdx)">改名</el-button>
                  <el-button link type="danger" icon="CircleClose" @click="removeFile(idx, fIdx)">删除</el-button>
                </div>
              </div>
            </div>

            <el-upload
              action="#"
              :auto-upload="false"
              :on-change="(file) => handleSimulateUpload(file, idx)"
              :show-file-list="false"
              multiple
              class="upload-card-wrapper"
            >
              <div class="upload-trigger-btn">
                <el-icon><Plus /></el-icon>
                <span>点击测试上传</span>
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
        <span class="footer-tip">已录入 {{ totalFilesCount }} 份资料</span>
        <div>
          <el-button size="large" @click="internalVisible = false">取消</el-button>
          <el-button type="primary" size="large" @click="handleConfirm" class="save-btn">保存并更新</el-button>
        </div>
      </div>
    </template>
  </el-drawer>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { FolderOpened, Document, Plus, Delete, EditPen, CircleClose, Share, Files, CirclePlus } from '@element-plus/icons-vue';

const props = defineProps(['visible', 'customerData']);
const emit = defineEmits(['update:visible', 'save']);

const internalVisible = computed({
  get: () => props.visible,
  set: (v) => emit('update:visible', v)
});

const FIXED = ['护照封面', '护照首页', '签证页', '劳工证', '签证成品', '劳工证成品'];
const localGroups = ref([]);
const isFixed = (t) => FIXED.includes(t);
const totalFilesCount = computed(() => localGroups.value.reduce((s, g) => s + g.files.length, 0));

watch(() => props.visible, (val) => {
  if (val) {
    localGroups.value = props.customerData?.files?.length 
      ? JSON.parse(JSON.stringify(props.customerData.files))
      : FIXED.map(t => ({ title: t, files: [] }));
  }
});

/**
 * 模拟上传函数
 */
const handleSimulateUpload = (file, gIdx) => {
  const mockUrl = URL.createObjectURL(file.raw);
  localGroups.value[gIdx].files.push({ 
    name: file.name, 
    url: mockUrl, 
    time: new Date().toLocaleDateString()
  });
  ElMessage.success(`[模拟成功] 已添加：${file.name}`);
};

const renameFile = (gIdx, fIdx) => {
  const file = localGroups.value[gIdx].files[fIdx];
  ElMessageBox.prompt('请输入新的文件名', '修改文件名', {
    inputValue: file.name,
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  }).then(({ value }) => {
    if (value) {
      file.name = value;
      ElMessage.success('名称已修改');
    }
  });
};

const previewFile = (file) => {
  if (file.url) {
    window.open(file.url, '_blank');
  }
};

const copyFileList = () => {
  const text = localGroups.value
    .filter(g => g.files.length > 0)
    .map(g => `【${g.title}】: ${g.files.map(f => f.name).join(', ')}`)
    .join('\n');
  navigator.clipboard.writeText(text);
  ElMessage.success('清单已复制');
};

const jumpToFileCenter = () => {
  window.open('/files', '_blank');
};

const addGroup = () => localGroups.value.push({ title: '新增资料项', files: [] });
const removeGroup = (idx) => localGroups.value.splice(idx, 1);
const removeFile = (gIdx, fIdx) => localGroups.value[gIdx].files.splice(fIdx, 1);

const handleConfirm = () => {
  emit('save', JSON.parse(JSON.stringify(localGroups.value)));
  internalVisible.value = false;
};
</script>

<style scoped>
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
.save-btn { padding-left: 30px; padding-right: 30px; font-weight: bold; }
</style>