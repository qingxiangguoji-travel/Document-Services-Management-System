<template>
  <div class="page-component-container">
    <page-standard-wrapper>
      <template #title>开单客服管理</template>
      <template #subtitle>配置系统客服人员信息及其对应的业务提成核算规则</template>
      
      <template #actions>
        <el-button type="primary" :icon="Plus" @click="handleEdit()">新增客服人员</el-button>
      </template>

      <div class="staff-table-container">
        <el-table :data="staffList" border stripe style="width: 100%">
          <template #empty>
            <el-empty description="暂无客服人员，请点击右上角新增" />
          </template>

          <el-table-column type="index" label="序号" width="80" align="center" />
          
          <el-table-column prop="name" label="客服姓名" width="180" align="center">
            <template #default="scope">
              <span class="staff-name-text">{{ scope.row.name }}</span>
            </template>
          </el-table-column>

          <el-table-column label="提成规则说明" min-width="300">
            <template #default="scope">
              <div class="rule-cell">
                <el-tag size="small" effect="plain" class="mr-2">{{ scope.row.ruleTag }}</el-tag>
                <span class="rule-text" :title="scope.row.ruleDesc">{{ scope.row.ruleDesc }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="提成核算" width="180" align="center">
            <template #default="scope">
              <el-button 
                type="primary" 
                link 
                :icon="DataAnalysis"
                @click="goToProfitCalc(scope.row)"
              >
                查看利润计算
              </el-button>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="150" align="center">
            <template #default="scope">
              <el-button type="primary" link @click="handleEdit(scope.row)">编辑</el-button>
              <el-button type="danger" link @click="handleDelete(scope.$index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <el-dialog 
        v-model="dialogVisible" 
        :title="form.id ? '编辑客服信息' : '录入新客服'" 
        width="420px"
        destroy-on-close
      >
        <el-form :model="form" label-width="90px" @submit.prevent>
          <el-form-item label="客服姓名" required>
            <el-input v-model="form.name" placeholder="请输入姓名（如：项文）" clearable />
          </el-form-item>
          <el-form-item label="提成类型">
            <el-select v-model="form.ruleTag" placeholder="选择核算方式" style="width: 100%">
              <el-option label="利润分成" value="利润分成" />
              <el-option label="固定计件" value="固定计件" />
              <el-option label="阶梯奖励" value="阶梯奖励" />
            </el-select>
          </el-form-item>
          <el-form-item label="规则描述">
            <el-input 
              v-model="form.ruleDesc" 
              type="textarea" 
              :rows="3"
              placeholder="说明提成计算逻辑，方便财务核算时参考" 
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="dialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="saveStaff">确 定</el-button>
        </template>
      </el-dialog>
    </page-standard-wrapper>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, DataAnalysis } from '@element-plus/icons-vue'
import PageStandardWrapper from '../../layouts/PageLayout.vue'
import { db } from '@/utils/storage'

const router = useRouter()
const staffList = ref([])
const dialogVisible = ref(false)

const form = reactive({
  id: null,
  name: '',
  ruleTag: '利润分成',
  ruleDesc: ''
})

// 初始化加载
const loadStaff = () => {
  const existing = db.getRaw('STAFF_LIST')
  if (!existing || (Array.isArray(existing) && existing.length === 0)) {
    const defaultList = [
      { id: 101, name: '项文', ruleTag: '利润分成', ruleDesc: '按订单净利润的 5.0% 计算提成' },
      { id: 102, name: '张亮', ruleTag: '固定计件', ruleDesc: '每完成一笔订单固定提成 $15.00' },
      { id: 103, name: '李冬', ruleTag: '阶梯奖励', ruleDesc: '月利润超过 $5000 后，超出部分按 8% 核算' }
    ]
    staffList.value = defaultList
    db.saveRaw('STAFF_LIST', defaultList)
  } else {
    staffList.value = existing
  }
}

onMounted(loadStaff)

const handleEdit = (row = null) => {
  if (row) {
    Object.assign(form, JSON.parse(JSON.stringify(row)))
  } else {
    form.id = null
    form.name = ''
    form.ruleTag = '利润分成'
    form.ruleDesc = ''
  }
  dialogVisible.value = true
}

const saveStaff = () => {
  const cleanName = form.name.trim()
  if (!cleanName) return ElMessage.warning('客服姓名不能为空')
  
  const isDuplicate = staffList.value.some(item => 
    item.name === cleanName && item.id !== form.id
  )
  if (isDuplicate) return ElMessage.error(`客服 [${cleanName}] 已存在，请勿重复添加`)
  
  const newList = [...staffList.value]
  if (form.id) {
    const index = newList.findIndex(item => item.id === form.id)
    if (index > -1) newList[index] = { ...form, name: cleanName }
  } else {
    newList.push({ ...form, id: Date.now(), name: cleanName })
  }
  
  staffList.value = newList
  db.saveRaw('STAFF_LIST', newList)
  ElMessage.success('配置已更新')
  dialogVisible.value = false
}

const handleDelete = (index) => {
  const target = staffList.value[index]
  ElMessageBox.confirm(
    `确定要删除客服 [${target.name}] 吗？这不会影响历史订单，但新订单将无法关联此人。`, 
    '安全提示', 
    { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning' }
  ).then(() => {
    staffList.value.splice(index, 1)
    db.saveRaw('STAFF_LIST', staffList.value)
    ElMessage.success('数据已移除')
  })
}

const goToProfitCalc = (staff) => {
  router.push({ 
    path: '/business/stats', 
    query: { staffName: staff.name, type: 'commission' } 
  })
}
</script>

<style scoped>
/* 增加根容器样式，确保布局不塌陷 */
.page-component-container {
  width: 100%;
  height: 100%;
}

.staff-table-container { 
  background: #fff; 
  border-radius: 8px; 
  padding: 10px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05);
}

.staff-name-text {
  font-weight: 600; 
  color: #1e293b;
}

.rule-cell { 
  display: flex; 
  align-items: center; 
}

.rule-text { 
  color: #64748b; 
  font-size: 13px;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mr-2 { margin-right: 8px; }

:deep(.el-dialog__body) {
  padding-top: 10px;
}
</style>