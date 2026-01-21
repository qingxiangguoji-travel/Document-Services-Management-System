import { ref } from 'vue'
import { ElMessage } from 'element-plus'

export const useApi = () => {
  const loading = ref(false)
  const error = ref(null)

  // 处理请求
  const handleRequest = async (requestFn, successMessage = null, errorMessage = null) => {
    loading.value = true
    error.value = null
    
    try {
      const result = await requestFn()
      
      if (successMessage) {
        ElMessage.success(successMessage)
      }
      
      return result
    } catch (err) {
      error.value = err
      const message = errorMessage || err.message || '操作失败，请重试'
      ElMessage.error(message)
      throw err
    } finally {
      loading.value = false
    }
  }

  // 处理批量请求
  const handleBatchRequests = async (requests, successMessage = null) => {
    loading.value = true
    error.value = null
    
    try {
      const results = await Promise.all(requests.map(req => req()))
      
      if (successMessage) {
        ElMessage.success(successMessage)
      }
      
      return results
    } catch (err) {
      error.value = err
      ElMessage.error(err.message || '批量操作失败')
      throw err
    } finally {
      loading.value = false
    }
  }

  // 处理文件上传
  const handleFileUpload = async (file, uploadFn) => {
    const formData = new FormData()
    formData.append('file', file)
    
    return handleRequest(() => uploadFn(formData), '文件上传成功', '文件上传失败')
  }

  return {
    loading,
    error,
    handleRequest,
    handleBatchRequests,
    handleFileUpload
  }
}