<template>
  <div class="file-upload-area">
    <el-upload
      class="upload-area"
      :multiple="true"
      :show-file-list="false"
      :before-upload="beforeUpload"
      :http-request="handleUpload"
      drag
    >
      <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
      <div class="el-upload__text">
        拖拽文件到此处或 <em>点击上传</em>
      </div>
      <template #tip>
        <div class="el-upload__tip">
          支持上传多个文件，单个文件不超过 10MB
        </div>
      </template>
    </el-upload>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'

const props = defineProps({
  groupIndex: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['upload'])

const uploading = ref(false)

function beforeUpload(file) {
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isLt10M) {
    ElMessage.error('文件大小不能超过 10MB!')
  }
  return isLt10M
}

async function handleUpload(options) {
  const { file } = options
  
  try {
    uploading.value = true
    
    // 这里应该调用API上传文件
    const uploadedFile = {
      id: Date.now(),
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
      uploaded_at: new Date().toISOString()
    }
    
    emit('upload', props.groupIndex, [uploadedFile])
    ElMessage.success('文件上传成功')
    
  } catch (error) {
    ElMessage.error('文件上传失败')
  } finally {
    uploading.value = false
  }
}
</script>

<style scoped>
.file-upload-area {
  padding: 16px;
  border-top: 1px solid #eee;
}

.upload-area {
  :deep(.el-upload) {
    width: 100%;
  }
  
  :deep(.el-upload-dragger) {
    width: 100%;
    padding: 40px;
  }
}

.el-upload__tip {
  margin-top: 8px;
  color: #999;
  font-size: 12px;
}
</style>