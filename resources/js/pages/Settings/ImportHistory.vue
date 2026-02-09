<template>
  <PageLayout>
    <template #title>导入历史记录</template>
    <template #subtitle>
      查看 Excel 批量导入的订单记录，并支持一键撤销导入
    </template>

    <el-card shadow="never">

      <el-alert
        type="info"
        show-icon
        :closable="false"
        class="mb-16"
        title="说明"
        description="撤销导入会删除该批次创建的所有订单，此操作不可恢复"
      />

      <el-table :data="batches" border stripe>
        <el-table-column prop="batchId" label="批次ID" width="260" />
        <el-table-column prop="count" label="订单数量" width="120" />
        <el-table-column prop="time" label="导入时间" width="200" />

        <el-table-column label="操作" width="160">
          <template #default="scope">
            <el-button
              type="danger"
              size="small"
              @click="rollback(scope.row.batchId)"
            >
              撤销导入
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="batches.length===0" description="暂无导入记录" />

    </el-card>
  </PageLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import PageLayout from '@/layouts/PageLayout.vue'
import { db } from '@/utils/storage'

// =========================
// 读取导入批次
// =========================
const batches = ref([])

const loadBatches = () => {
  const orders = db.getRaw('ORDERS') || []

  const map = {}

  orders.forEach(o => {
    if (!o.import_batch_id) return

    if (!map[o.import_batch_id]) {
      map[o.import_batch_id] = {
        batchId: o.import_batch_id,
        count: 0,
        time: o.imported_at
      }
    }

    map[o.import_batch_id].count++
  })

  batches.value = Object.values(map)
    .sort((a,b)=> new Date(b.time) - new Date(a.time))
}

onMounted(loadBatches)

// =========================
// 撤销导入
// =========================
const rollback = (batchId) => {
  ElMessageBox.confirm(
    '确定要撤销该批次导入吗？此操作不可恢复！',
    '危险操作',
    { type:'warning' }
  ).then(()=>{
    const orders = db.getRaw('ORDERS') || []

    const filtered = orders.filter(
      o => o.import_batch_id !== batchId
    )

    db.saveRaw('ORDERS', filtered)

    ElMessage.success('已撤销导入')
    loadBatches()
  })
}
</script>

<style scoped>
.mb-16{
  margin-bottom:16px;
}
</style>
