<template>
  <PageLayout>
    <template #title>用户管理</template>
    <template #subtitle>系统账号、权限与登录控制</template>

    <template #actions>
      <el-button type="primary" @click="openCreate">新增用户</el-button>
    </template>

    <!-- 搜索区 -->
    <el-card shadow="never" style="margin-bottom:16px">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-input v-model="search.keyword" placeholder="搜索账号 / 姓名" clearable />
        </el-col>

        <el-col :span="6">
          <el-select v-model="search.role" placeholder="角色筛选" clearable>
            <el-option label="管理员" value="admin"/>
            <el-option label="业务人员" value="staff"/>
            <el-option label="财务" value="finance"/>
            <el-option label="代理" value="agent"/>
          </el-select>
        </el-col>

        <el-col :span="6">
          <el-button @click="resetSearch">重置</el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 用户表格 -->
    <el-table
      :data="filteredUsers"
      border
      empty-text="暂无用户数据"
    >
      <el-table-column prop="username" label="账号" width="160"/>
      <el-table-column prop="name" label="姓名" width="160"/>

      <el-table-column label="角色" width="120">
        <template #default="scope">
          <el-tag v-if="scope.row.role==='admin'" type="danger">管理员</el-tag>
          <el-tag v-else-if="scope.row.role==='staff'" type="primary">业务</el-tag>
          <el-tag v-else-if="scope.row.role==='finance'" type="warning">财务</el-tag>
          <el-tag v-else type="success">代理</el-tag>
        </template>
      </el-table-column>

      <el-table-column label="代理公司" width="220">
        <template #default="scope">
          <span v-if="scope.row.role==='agent'">{{ getAgentName(scope.row.agent_company_id) }}</span>
          <span v-else>-</span>
        </template>
      </el-table-column>

      <el-table-column label="状态" width="120">
        <template #default="scope">
          <el-tag :type="scope.row.enabled ? 'success' : 'danger'">
            {{ scope.row.enabled ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="操作" min-width="320">
        <template #default="scope">
          <el-button size="small" @click="openEdit(scope.row)">编辑</el-button>

          <el-button
            size="small"
            :disabled="!canOperate(scope.row)"
            @click="toggleUser(scope.row)"
          >
            {{ scope.row.enabled ? '禁用' : '启用' }}
          </el-button>
		  
		  <el-button
            size="small"
            type="primary"
            :disabled="!canOperate(scope.row)"
            @click="openSetPwd(scope.row)"
          >
            设置密码
          </el-button>


          <el-button
            size="small"
            :disabled="!canOperate(scope.row)"
            @click="resetPwd(scope.row)"
          >
            重置密码
          </el-button>

          <el-button
            size="small"
            type="danger"
            :disabled="!canOperate(scope.row)"
            @click="remove(scope.row)"
          >
            删除
          </el-button>

          <el-tag v-if="currentUser?.id===scope.row.id" style="margin-left:10px" effect="plain">
            当前账号
          </el-tag>
        </template>
      </el-table-column>
    </el-table>

    <!-- 创建 / 编辑用户 -->
    <el-dialog
      v-model="dialog"
      :title="isEdit ? '编辑用户' : '新增用户'"
      width="460"
      @closed="onDialogClosed"
    >
      <el-form :model="form" label-position="top">
        <el-form-item label="账号">
          <el-input v-model="form.username" :disabled="isEdit"/>
        </el-form-item>

        <el-form-item label="姓名">
          <el-input v-model="form.name"/>
        </el-form-item>

        <el-form-item label="角色">
          <el-select
            v-model="form.role"
            style="width:100%"
            :disabled="isEdit && originalRole==='agent'"
          >
            <el-option label="管理员" value="admin"/>
            <el-option label="业务人员" value="staff"/>
            <el-option label="财务" value="finance"/>
            <el-option label="代理" value="agent"/>
          </el-select>
        </el-form-item>

        <el-form-item v-if="form.role==='agent'" label="所属代理公司" required>
          <el-select v-model="form.agent_company_id" filterable style="width:100%">
            <el-option
              v-for="a in agentCompanies"
              :key="a.id"
              :label="a.name"
              :value="a.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item v-if="form.role==='agent'" label="代理账号类型">
          <el-select v-model="form.tenant_role" style="width:100%">
            <el-option label="管理员（可查看公司全部订单）" value="admin" />
            <el-option label="员工（仅查看自己创建订单）" value="staff" />
            <el-option label="财务（仅查看结算数据）" value="finance" />
          </el-select>
        </el-form-item>

        <el-form-item v-if="!isEdit" label="密码">
          <el-input v-model="form.password" type="password" show-password/>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialog=false">取消</el-button>
        <el-button type="primary" @click="saveUser">
          {{ isEdit ? '保存' : '创建' }}
        </el-button>
      </template>
    </el-dialog>
	
	<!-- ================= 管理员设置用户密码 ================= -->
<el-dialog v-model="setPwdDialog" title="设置用户密码" width="420">
  <el-form label-position="top">

    <el-form-item label="新密码">
      <el-input v-model="setPwdForm.password" type="password" show-password />
    </el-form-item>

    <el-form-item label="确认密码">
      <el-input v-model="setPwdForm.confirm" type="password" show-password />
    </el-form-item>

  </el-form>

  <template #footer>
    <el-button @click="setPwdDialog=false">取消</el-button>
    <el-button type="primary" @click="confirmSetPwd">
      确认设置
    </el-button>
  </template>
</el-dialog>


    <!-- 修改我的密码 -->
    <el-dialog v-model="myPwdDialog" title="修改我的密码" width="420">
      <el-form label-position="top">
        <el-form-item label="旧密码">
          <el-input v-model="oldPwd" type="password" show-password/>
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="newPwd" type="password" show-password/>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="myPwdDialog=false">取消</el-button>
        <el-button type="primary" @click="changeMyPwd">确认修改</el-button>
      </template>
    </el-dialog>
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PageLayout from '@/layouts/PageLayout.vue'
import { auth } from '@/utils/auth'
import { db } from '@/utils/storage'
import { usersStore } from '@/stores/usersStore'

const currentUser = auth.getUser()

/** 代理公司 */
const agentCompanies = ref([])
onMounted(() => {
  agentCompanies.value = db.getAgents() || []
  usersStore.load()
})
const getAgentName = (id) => agentCompanies.value.find(x => x.id === id)?.name || '未绑定'

/** 搜索 */
const search = ref({ keyword: '', role: '' })
const resetSearch = () => {
  search.value = { keyword: '', role: '' }
}

/** 数据源（响应式） */
const filteredUsers = computed(() => {
  const all = usersStore.users.value || []
  const kw = (search.value.keyword || '').trim().toLowerCase()
  const role = search.value.role

  return all.filter(u => {
    const hitKw =
      !kw ||
      String(u.username || '').toLowerCase().includes(kw) ||
      String(u.name || '').toLowerCase().includes(kw)

    const hitRole = !role || u.role === role
    return hitKw && hitRole
  })
})

/** 不能操作当前登录账号 */
const canOperate = (row) => String(row.id) !== String(currentUser?.id)

/** 弹窗状态 */
const dialog = ref(false)
const isEdit = ref(false)
const editingUserId = ref(null)
const originalRole = ref('')

const form = ref({
  username: '',
  name: '',
  role: 'staff',
  password: '123456',
  agent_company_id: '',
  tenant_role: 'staff'
})

const openCreate = () => {
  isEdit.value = false
  editingUserId.value = null
  originalRole.value = ''

  form.value = {
    username: '',
    name: '',
    role: 'staff',
    password: '123456',
    agent_company_id: '',
    tenant_role: 'staff'
  }

  dialog.value = true
}

const openEdit = (row) => {
  isEdit.value = true
  editingUserId.value = row.id
  originalRole.value = row.role

  form.value = {
    username: row.username,
    name: row.name,
    role: row.role,
    password: '123456', // 编辑时不显示/不使用
    agent_company_id: row.agent_company_id || '',
    tenant_role: row.tenant_role || 'staff'
  }

  dialog.value = true
}

const onDialogClosed = () => {
  // 保持组件状态干净
  isEdit.value = false
  editingUserId.value = null
  originalRole.value = ''
}

const saveUser = () => {
  if (!form.value.username || !form.value.name) return ElMessage.error('请填写完整')

  if (form.value.role === 'agent' && !form.value.agent_company_id) {
    return ElMessage.error('请选择代理公司')
  }

  if (isEdit.value) {
    const res = usersStore.update(String(editingUserId.value), {
      name: form.value.name,
      role: form.value.role,
      enabled: true, // 不在编辑里改状态
      agent_company_id: form.value.agent_company_id,
      tenant_role: form.value.tenant_role
    })
    if (!res.ok) return ElMessage.error(res.message || '保存失败')
  } else {
    const res = usersStore.create({
      username: form.value.username,
      name: form.value.name,
      role: form.value.role,
      password: form.value.password,
      agent_company_id: form.value.agent_company_id,
      tenant_role: form.value.tenant_role
    })
    if (!res.ok) return ElMessage.error(res.message || '创建失败')
  }

  dialog.value = false
  ElMessage.success('保存成功')
}

const toggleUser = (row) => {
  const res = usersStore.toggleEnabled(row)
  if (!res.ok) return ElMessage.error(res.message || '操作失败')
  ElMessage.success('状态已更新')
}

const resetPwd = (row) => {
  const res = usersStore.resetPassword(row)
  if (!res.ok) return ElMessage.error(res.message || '重置失败')

  ElMessageBox.alert(
    `新临时密码：<b style="font-size:18px">${res.tempPwd}</b>`,
    '密码已重置',
    { dangerouslyUseHTMLString: true }
  )
}

const remove = (row) => {
  ElMessageBox.confirm(`确定删除账号：${row.username}？`, '警告', { type: 'warning' })
    .then(() => {
      const res = usersStore.delete(row)
      if (!res.ok) return ElMessage.error(res.message || '删除失败')
      ElMessage.success('已删除')
    })
}

/* ================= 管理员设置密码 ================= */
const setPwdDialog = ref(false)
const setPwdUserId = ref(null)

const setPwdForm = ref({
  password: '',
  confirm: ''
})

const openSetPwd = (row) => {
  setPwdUserId.value = row.id
  setPwdForm.value = { password: '', confirm: '' }
  setPwdDialog.value = true
}

const confirmSetPwd = () => {
  if (!setPwdForm.value.password)
    return ElMessage.error('请输入新密码')

  if (setPwdForm.value.password !== setPwdForm.value.confirm)
    return ElMessage.error('两次密码不一致')

  const res = auth.adminChangePassword(
    setPwdUserId.value,
    setPwdForm.value.password
  )

  if (!res.ok) return ElMessage.error('设置失败')

  setPwdDialog.value = false
  ElMessage.success('密码已更新')
}




</script>
