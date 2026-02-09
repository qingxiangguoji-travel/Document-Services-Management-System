<template>
  <div style="padding:24px;">
    <el-result
      icon="info"
      title="页面尚未实现"
      :sub-title="desc"
    >
      <template #extra>
        <el-button type="primary" @click="$router.back()">返回</el-button>
      </template>
    </el-result>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const desc = computed(() => {
  return `当前路由：${route.path}（你可以后续再补这个页面文件）`
})
</script>
