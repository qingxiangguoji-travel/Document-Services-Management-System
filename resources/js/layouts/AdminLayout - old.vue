<template>
  <div class="admin-layout">
    <!-- 顶部栏 -->
    <header class="topbar">
      <h1 class="topbar-title">证件业务管理系统</h1>

      <!-- 🌐 语言切换（仅样式，不做真实功能） -->
      <div class="lang-switch">
        <span
          class="lang-item"
          :class="{ active: currentLang === 'zh' }"
          @click="switchLang('zh')"
        >中</span>
        <span
          class="lang-item"
          :class="{ active: currentLang === 'en' }"
          @click="switchLang('en')"
        >EN</span>
        <span
          class="lang-item"
          :class="{ active: currentLang === 'kh' }"
          @click="switchLang('kh')"
        >KH</span>
      </div>
    </header>

    <div class="body">
      <!-- 左侧菜单 -->
      <aside class="sidebar">
        <nav class="sidebar-nav">
          <ul>
            <!-- 仪表盘 -->
            <li class="nav-item">
              <RouterLink to="/" exact-active-class="active">
                仪表盘
              </RouterLink>
            </li>

            <!-- 业务管理 -->
            <li class="nav-group">
              <div class="group-title" @click="open.business = !open.business">
                <span>业务管理</span>
                <span class="arrow">{{ open.business ? '▼' : '▶' }}</span>
              </div>
              <ul v-show="open.business" class="group-list">
                <li><RouterLink to="/business/orders/create">新建订单</RouterLink></li>
                <li><RouterLink to="/business/orders">订单列表</RouterLink></li>
                <li><RouterLink to="/coming-soon">待跟进业务</RouterLink></li>
                <li><RouterLink to="/coming-soon">异常业务</RouterLink></li>
                <li><RouterLink to="/coming-soon">业务统计</RouterLink></li>
                <li><RouterLink to="/coming-soon">批量处理</RouterLink></li>
              </ul>
            </li>

            <!-- 代理客户管理 -->
            <li class="nav-group">
              <div class="group-title" @click="open.agent = !open.agent">
                <span>代理客户管理</span>
                <span class="arrow">{{ open.agent ? '▼' : '▶' }}</span>
              </div>
              <ul v-show="open.agent" class="group-list">
                <li><RouterLink to="/agents">代理客户列表</RouterLink></li>
                <li><RouterLink to="/customers">客户管理列表</RouterLink></li>
                <li><RouterLink to="/coming-soon">跟进记录</RouterLink></li>
                <li><RouterLink to="/coming-soon">代理统计</RouterLink></li>
              </ul>
            </li>

            <!-- 证件管理 -->
            <li class="nav-group">
              <div class="group-title" @click="open.certificate = !open.certificate">
                <span>证件管理</span>
                <span class="arrow">{{ open.certificate ? '▼' : '▶' }}</span>
              </div>
              <ul v-show="open.certificate" class="group-list">
                <li><RouterLink to="/certificates">证件列表</RouterLink></li>
                <li><RouterLink to="/coming-soon">证件历史</RouterLink></li>
              </ul>
            </li>

            <!-- 提醒中心 -->
            <li class="nav-group">
              <div class="group-title" @click="open.notice = !open.notice">
                <span>提醒中心</span>
                <span class="arrow">{{ open.notice ? '▼' : '▶' }}</span>
              </div>
              <ul v-show="open.notice" class="group-list">
                <li><RouterLink to="/coming-soon">到期提醒</RouterLink></li>
                <li><RouterLink to="/coming-soon">跟进提醒</RouterLink></li>
                <li><RouterLink to="/coming-soon">系统通知</RouterLink></li>
              </ul>
            </li>

            <!-- 文件管理 -->
            <li class="nav-group">
              <div class="group-title" @click="open.files = !open.files">
                <span>文件管理</span>
                <span class="arrow">{{ open.files ? '▼' : '▶' }}</span>
              </div>
              <ul v-show="open.files" class="group-list">
                <li><RouterLink to="/business/files">业务文件</RouterLink></li>
              </ul>
            </li>

            <!-- 财务管理 -->
            <li class="nav-group">
              <div class="group-title" @click="open.finance = !open.finance">
                <span>财务管理</span>
                <span class="arrow">{{ open.finance ? '▼' : '▶' }}</span>
              </div>
              <ul v-show="open.finance" class="group-list">
                <li><RouterLink to="/coming-soon">收支记录</RouterLink></li>
                <li><RouterLink to="/coming-soon">部门结算</RouterLink></li>
                <li><RouterLink to="/coming-soon">代理结算</RouterLink></li>
              </ul>
            </li>

            <!-- 系统设置 -->
            <li class="nav-group">
              <div class="group-title" @click="open.settings = !open.settings">
                <span>系统设置</span>
                <span class="arrow">{{ open.settings ? '▼' : '▶' }}</span>
              </div>
              <ul v-show="open.settings" class="group-list">
                <li><RouterLink to="/settings/certificate-types">证件类型配置</RouterLink></li>
                <li><RouterLink to="/settings/nationalities">国籍管理</RouterLink></li>
                <li><RouterLink to="/settings/fees">业务费用配置</RouterLink></li>
                <li><RouterLink to="/settings/departments">办理部门管理</RouterLink></li>
                <li><RouterLink to="/settings/status">办理状态管理</RouterLink></li>
                <li><RouterLink to="/settings/settlement">结算规则配置</RouterLink></li>
                <li><RouterLink to="/settings/reminders">提醒规则配置</RouterLink></li>
                <li><RouterLink to="/settings/users">用户与权限</RouterLink></li>
              </ul>
            </li>
          </ul>
        </nav>
      </aside>

      <!-- 内容区 -->
      <main class="content">
        <div class="page-header">
          <h2 class="page-title">{{ pageTitle }}</h2>
        </div>
        <div class="content-wrapper">
          <RouterView />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { RouterView, RouterLink, useRoute } from 'vue-router'
import { reactive, computed, ref } from 'vue'

const route = useRoute()
const pageTitle = computed(() => route.meta?.title || '')

const open = reactive({
  business: true,
  agent: true,
  certificate: true,
  notice: true,
  files: true,
  finance: false,
  settings: true,
})

const currentLang = ref('zh')
function switchLang(lang) {
  currentLang.value = lang
}
</script>

<style scoped>
.admin-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.topbar {
  height: 52px;
  background: #1f2937;
  display: flex;
  align-items: center;
  padding: 0 20px;
}

.topbar-title {
  font-size: 20px;
  font-weight: 600;
  color: #f1f5f9;
}

.lang-switch {
  margin-left: auto;
  display: inline-flex;
  background: rgba(255,255,255,.08);
  border-radius: 999px;
  padding: 4px;
}

.lang-item {
  min-width: 34px;
  height: 26px;
  font-size: 12px;
  line-height: 26px;
  text-align: center;
  color: #cbd5e1;
  cursor: pointer;
  border-radius: 999px;
}

.lang-item.active {
  background: #2563eb;
  color: #fff;
  font-weight: 600;
}

.body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.sidebar {
  width: 240px;
  background: linear-gradient(180deg,#0f172a,#020617);
  overflow-y: auto;
}

.sidebar-nav {
  padding: 8px;
}

/* ================= 一级菜单（只加图标，不动结构） ================= */
.group-title {
  margin-top: 14px;
  padding: 12px 12px 8px 36px; /* 给图标留位 */
  font-size: 14px;
  font-weight: 700;
  color: #cbd5e1;
  letter-spacing: 0.5px;
  line-height: 1.4;
  display: flex;
  justify-content: space-between;
  cursor: pointer;
  border-radius: 6px;
  position: relative;
}

/* ✅ 稳定统一的模块图标（不绑定业务，不会错位） */
.group-title::before {
  content: '📁';
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  opacity: 0.75;
  pointer-events: none;
}

/* ================= 二级菜单 ================= */
.group-list a {
  position: relative;
  padding: 10px 12px 10px 36px;
  font-size: 14px;
  line-height: 1.3;
  color: #e5e7eb;
  display: block;
  border-radius: 6px;
}

.group-list a::before {
  content: '';
  position: absolute;
  left: 20px;
  top: 50%;
  width: 2px;
  height: 14px;
  background: #2563eb;
  opacity: 0.4;
  transform: translateY(-50%);
}

.group-list a:hover {
  background: rgba(37, 99, 235, 0.15);
}

.group-list a.router-link-active {
  background: #2563eb;
  color: #fff;
}

.group-list a.router-link-active::before {
  opacity: 1;
}

.nav-group {
  padding-bottom: 6px;
  margin-bottom: 6px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}

.nav-item a {
  padding: 12px;
  font-size: 14px;
  color: #e5e7eb;
  display: block;
  border-radius: 6px;
}

.nav-item a.active {
  background: #2563eb;
  color: #fff;
}

.content {
  flex: 1;
  background: #f9fafb;
  overflow-y: auto;
}

.page-header {
  padding: 20px 24px 0;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.content-wrapper {
  padding: 16px 24px 24px;
}
</style>

<!-- ✅ 兜底：防止黑点 -->
<style>
.sidebar-nav ul,
.sidebar-nav li {
  list-style: none;
  margin: 0;
  padding: 0;
}
.sidebar-nav a {
  text-decoration: none;
}
</style>
