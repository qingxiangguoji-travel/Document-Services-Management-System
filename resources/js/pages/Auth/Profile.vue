<template>
  <PageLayout>
    <template #title>个人中心</template>
    <template #subtitle>修改密码与账号信息</template>

    <el-card style="max-width:500px">
      <el-form :model="form" label-position="top">
        <el-form-item label="账号">
          <el-input v-model="user.username" disabled />
        </el-form-item>

        <el-form-item label="姓名">
          <el-input v-model="user.name" disabled />
        </el-form-item>

        <el-divider>修改密码</el-divider>

        <el-form-item label="旧密码">
          <el-input v-model="form.oldPwd" show-password />
        </el-form-item>

        <el-form-item label="新密码">
          <el-input v-model="form.newPwd" show-password />
        </el-form-item>

        <el-form-item label="确认新密码">
          <el-input v-model="form.confirmPwd" show-password />
        </el-form-item>

        <el-button type="primary" @click="changePwd">
          修改密码
        </el-button>
      </el-form>
    </el-card>
  </PageLayout>
</template>

<script setup>
import { reactive } from 'vue'
import { ElMessage } from 'element-plus'
import PageLayout from '@/layouts/PageLayout.vue'
import { auth } from '@/utils/auth'

const user = auth.getUser()

const form = reactive({
  oldPwd: '',
  newPwd: '',
  confirmPwd: ''
})

const changePwd = () => {
  if (!form.oldPwd || !form.newPwd) {
    return ElMessage.error('请填写完整')
  }

  if (form.newPwd !== form.confirmPwd) {
    return ElMessage.error('两次密码不一致')
  }

  const res = auth.changeMyPassword(form.oldPwd, form.newPwd)

  if (!res.ok) return ElMessage.error(res.message)

  ElMessage.success('密码修改成功，请重新登录')
  auth.logout()
  location.href = '/login'
}
</script>
