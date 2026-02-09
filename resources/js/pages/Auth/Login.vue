<!-- resources/js/pages/Auth/Login.vue -->
<template>
  <div class="login-page">
    <div class="login-card">
      <div class="brand">
        <div class="brand-title">证件业务管理系统</div>
        <div class="brand-subtitle">登录后进入后台管理</div>
      </div>

      <el-form
        :model="form"
        :rules="rules"
        ref="formRef"
        label-position="top"
        @keyup.enter="onSubmit"
      >
        <el-form-item label="账号" prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入账号"
            clearable
            autocomplete="username"
          />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            placeholder="请输入密码"
            show-password
            autocomplete="current-password"
          />
        </el-form-item>

        <div class="row">
          <el-checkbox v-model="form.remember">记住我（30天）</el-checkbox>
          <span class="hint">默认账号：admin / admin123456</span>
        </div>

        <el-button
          type="primary"
          size="large"
          style="width: 100%;"
          :loading="loading"
          @click="onSubmit"
        >
          登录
        </el-button>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { auth } from '@/utils/auth'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const formRef = ref(null)

const form = reactive({
  username: '',
  password: '',
  remember: false
})

const rules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const onSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (ok) => {
    if (!ok) return
    loading.value = true
    try {
      const res = auth.login({
        username: form.username,
        password: form.password,
        remember: form.remember
      })

      if (!res.ok) {
        ElMessage.error(res.message || '登录失败')
        return
      }

      ElMessage.success(`欢迎，${res.user.name || res.user.username}`)

      // 回跳：优先 redirect，其次首页
      const redirect = route.query.redirect
      if (redirect) {
        router.replace(String(redirect))
      } else {
        router.replace('/')
      }
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
.login-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0b1220 100%);
  padding: 24px;
}
.login-card {
  width: 420px;
  max-width: 100%;
  background: rgba(255,255,255,0.96);
  border-radius: 14px;
  padding: 22px 22px 18px;
  box-shadow: 0 18px 50px rgba(0,0,0,0.35);
}
.brand {
  margin-bottom: 14px;
}
.brand-title {
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
}
.brand-subtitle {
  font-size: 12px;
  color: #64748b;
  margin-top: 4px;
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 6px 0 14px;
}
.hint {
  font-size: 12px;
  color: #64748b;
}
</style>
