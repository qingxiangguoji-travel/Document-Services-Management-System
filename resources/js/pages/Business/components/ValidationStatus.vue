<template>
  <div class="validation-status">
    <el-alert
      :title="statusTitle"
      :type="statusType"
      :closable="false"
      show-icon
    >
      <template #description>
        <div v-if="isValid">
          {{ statusDescription }}
        </div>
        <ul v-else class="error-list">
          <li v-for="(err, idx) in errors" :key="idx">{{ err }}</li>
        </ul>
      </template>
    </el-alert>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  isValid: Boolean,
  // 增加：接收具体的错误消息列表
  errors: {
    type: Array,
    default: () => []
  }
})

const statusType = computed(() => props.isValid ? 'success' : 'warning')
const statusTitle = computed(() => props.isValid ? '订单验证通过' : '待完善信息')
const statusDescription = computed(() => '所有核心信息已就绪，可以安全保存订单')
</script>

<style scoped>
.validation-status {
  margin-bottom: 20px; /* 给下方留点间距 */
}
.error-list {
  margin: 5px 0 0 0;
  padding-left: 20px;
  font-size: 13px;
}
.error-list li {
  margin-bottom: 2px;
}
:deep(.el-alert) {
  padding: 12px 16px;
  border-radius: 8px; /* 让 UI 更现代一点 */
}
</style>