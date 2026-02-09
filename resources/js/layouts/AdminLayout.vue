<template>
  <el-container class="admin-layout">
    <el-header class="topbar">
      <div class="topbar-content">
        <div class="logo-area">
          <div class="logo-collapsed" v-if="sidebarCollapsed">
            <el-icon :size="24"><OfficeBuilding /></el-icon>
          </div>
          <div class="logo-expanded" v-else>
            <el-icon class="logo-icon" :size="24"><OfficeBuilding /></el-icon>
            <h1 class="system-title">证件业务管理系统</h1>
            <span class="version-tag">v1.0</span>
          </div>
        </div>

        <div class="topbar-right">
          <el-tooltip :content="isFullscreen ? '退出全屏' : '全屏'" placement="bottom">
            <el-button text circle @click="toggleFullscreen">
              <el-icon :size="18">
                <FullScreen v-if="!isFullscreen" />
                <Aim v-else />
              </el-icon>
            </el-button>
          </el-tooltip>

          <el-dropdown @command="handleLanguageChange" trigger="click">
            <el-button text class="lang-btn">
              <span class="lang-text">{{ currentLang.label }}</span>
              <el-icon><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="lang in languageOptions"
                  :key="lang.value"
                  :command="lang"
                  :disabled="currentLang.value === lang.value"
                >
                  {{ lang.label }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <el-dropdown trigger="click" class="notification-dropdown">
            <el-badge :value="unreadCount" :max="99" :hidden="unreadCount === 0">
              <el-button text circle>
                <el-icon :size="18"><Bell /></el-icon>
              </el-button>
            </el-badge>
            <template #dropdown>
              <el-dropdown-menu class="notification-menu">
                <div class="notification-header">
                  <span>消息通知</span>
                  <el-button text size="small" @click="markAllAsRead">全部已读</el-button>
                </div>
                <el-dropdown-item v-if="notifications.length === 0" disabled>
                  <div class="empty-notification">暂无新消息</div>
                </el-dropdown-item>
                <template v-else>
                  <el-dropdown-item
                    v-for="(item, index) in notifications"
                    :key="index"
                    :class="{ unread: !item.read }"
                    @click="handleNotificationClick(item)"
                  >
                    <div class="notification-item">
                      <el-icon :size="16" :color="getNotificationColor(item.type)">
                        <component :is="getNotificationIcon(item.type)" />
                      </el-icon>
                      <div class="notification-content">
                        <div class="notification-title">{{ item.title }}</div>
                        <div class="notification-time">{{ formatTime(item.time) }}</div>
                      </div>
                    </div>
                  </el-dropdown-item>
                </template>
                <div class="notification-footer" @click="viewAllNotifications">
                  查看全部通知
                </div>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <el-dropdown @command="handleUserCommand" trigger="click">
            <div class="user-profile">
              <el-avatar :size="32" :src="userInfo.avatar">
                {{ userInfo.name?.charAt(0) }}
              </el-avatar>
              <div class="user-info" v-if="!sidebarCollapsed">
                <div class="user-name">{{ userInfo.name }}</div>
                <div class="user-role">{{ userInfo.role }}</div>
              </div>
              <el-icon class="dropdown-arrow"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  <span>个人中心</span>
                </el-dropdown-item>
                <el-dropdown-item command="settings">
                  <el-icon><Setting /></el-icon>
                  <span>账户设置</span>
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  <span>退出登录</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </el-header>

    <el-container class="main-container">
      <el-aside
        :width="sidebarCollapsed ? '64px' : '240px'"
        class="sidebar"
        :class="{ collapsed: sidebarCollapsed }"
      >
        <el-scrollbar class="sidebar-scrollbar">
<el-menu
  :default-active="activeMenu"
  :collapse="sidebarCollapsed"
  :collapse-transition="false"
  :unique-opened="true"
  class="sidebar-menu"
  router
>
  <!-- 仪表盘 -->
  <el-menu-item v-if="can(PERM.DASHBOARD)" index="/">
    <el-icon><Odometer /></el-icon>
    <template #title><span>仪表盘</span></template>
  </el-menu-item>

  <!-- ================= 业务管理 ================= -->
  <el-sub-menu
    v-if="anyCan([PERM.BUSINESS_ORDER_CREATE,PERM.BUSINESS_ORDERS,PERM.BUSINESS_FILES,PERM.BUSINESS_STATS])"
    index="business"
  >
    <template #title>
      <el-icon><Document /></el-icon>
      <span>业务管理</span>
    </template>

    <el-menu-item v-if="can(PERM.BUSINESS_ORDER_CREATE)" index="/business/orders/create">
      <el-icon><Plus /></el-icon>
      <span>新建订单</span>
    </el-menu-item>

    <el-menu-item v-if="can(PERM.BUSINESS_ORDERS)" index="/business/orders">
      <el-icon><List /></el-icon>
      <span>订单列表</span>
    </el-menu-item>

    <el-menu-item v-if="can(PERM.BUSINESS_FILES)" index="/business/files">
      <el-icon><Folder /></el-icon>
      <span>文件管理</span>
    </el-menu-item>

    <el-menu-item v-if="can(PERM.BUSINESS_STATS)" index="/business/stats">
      <el-icon><DataAnalysis /></el-icon>
      <span>业务统计</span>
    </el-menu-item>
  </el-sub-menu>

  <!-- ================= 代理客户 ================= -->
  <el-sub-menu
    v-if="anyCan([PERM.AGENT_INDEX,PERM.CUSTOMER_INDEX,PERM.AGENT_COMMISSION,PERM.AGENT_FOLLOW])"
    index="agent"
  >
    <template #title>
      <el-icon><UserFilled /></el-icon>
      <span>代理客户管理</span>
    </template>

    <el-menu-item v-if="can(PERM.AGENT_INDEX)" index="/agents">
      <el-icon><List /></el-icon>
      <span>代理客户列表</span>
    </el-menu-item>

    <el-menu-item v-if="can(PERM.CUSTOMER_INDEX)" index="/customers">
      <el-icon><User /></el-icon>
      <span>客户管理列表</span>
    </el-menu-item>

    <el-menu-item v-if="can(PERM.AGENT_COMMISSION)" index="/agents/commission">
      <el-icon><Money /></el-icon>
      <span>代理佣金管理</span>
    </el-menu-item>

    <el-menu-item v-if="can(PERM.AGENT_FOLLOW)" index="/agent/follow">
      <el-icon><Memo /></el-icon>
      <span>跟进记录</span>
    </el-menu-item>
  </el-sub-menu>

  <!-- ================= 证件管理 ================= -->
  <el-sub-menu
    v-if="anyCan([PERM.CERT_INDEX,PERM.CERT_HISTORY])"
    index="certificate"
  >
    <template #title>
      <el-icon><Files /></el-icon>
      <span>证件管理</span>
    </template>

    <el-menu-item v-if="can(PERM.CERT_INDEX)" index="/certificates">
      <el-icon><List /></el-icon>
      <span>证件列表</span>
    </el-menu-item>

    <el-menu-item v-if="can(PERM.CERT_HISTORY)" index="/certificate/history">
      <el-icon><Clock /></el-icon>
      <span>证件历史</span>
    </el-menu-item>
  </el-sub-menu>

  <!-- ================= 提醒中心 ================= -->
  <el-sub-menu
    v-if="anyCan([PERM.REMINDER_EXPIRY,PERM.REMINDER_FOLLOW,PERM.REMINDER_SYSTEM])"
    index="reminder"
  >
    <template #title>
      <el-icon><BellFilled /></el-icon>
      <span>提醒中心</span>
      <el-badge
        :value="reminderCount"
        :max="99"
        class="menu-badge"
        v-if="reminderCount > 0"
      />
    </template>

    <el-menu-item v-if="can(PERM.REMINDER_EXPIRY)" index="/reminder/expiry">
      <el-icon><Calendar /></el-icon>
      <span>到期提醒</span>
    </el-menu-item>

    <el-menu-item v-if="can(PERM.REMINDER_FOLLOW)" index="/reminder/follow">
      <el-icon><AlarmClock /></el-icon>
      <span>跟进提醒</span>
    </el-menu-item>

    <el-menu-item v-if="can(PERM.REMINDER_SYSTEM)" index="/reminder/system">
      <el-icon><Message /></el-icon>
      <span>系统通知</span>
    </el-menu-item>
  </el-sub-menu>

  <!-- ================= 财务管理 ================= -->
  <el-sub-menu
    v-if="anyCan([PERM.FINANCE_RECORDS,PERM.FINANCE_DEPT,PERM.FINANCE_AGENT])"
    index="finance"
  >
    <template #title>
      <el-icon><Money /></el-icon>
      <span>财务管理</span>
    </template>

    <el-menu-item v-if="can(PERM.FINANCE_RECORDS)" index="/finance/records">
      <el-icon><Collection /></el-icon>
      <span>收支记录</span>
    </el-menu-item>

    <el-menu-item v-if="can(PERM.FINANCE_DEPT)" index="/finance/department">
      <el-icon><OfficeBuilding /></el-icon>
      <span>部门结算</span>
    </el-menu-item>

    <el-menu-item v-if="can(PERM.FINANCE_AGENT)" index="/finance/agent">
      <el-icon><User /></el-icon>
      <span>代理结算</span>
    </el-menu-item>
  </el-sub-menu>

  <!-- ================= 系统设置 ================= -->
  <el-sub-menu
    v-if="anyCan([
      PERM.SET_DICT,PERM.SET_DEPT,PERM.SET_STATUS,PERM.SET_STAFF,
      PERM.SET_BACKUP,PERM.SET_IMPORT,PERM.SET_USERS,PERM.SET_FEES,
      PERM.SET_SETTLEMENT,PERM.SET_REMINDER_RULE,PERM.SET_RECYCLE
    ])"
    index="settings"
  >
    <template #title>
      <el-icon><Setting /></el-icon>
      <span>系统设置</span>
    </template>

    <el-menu-item v-if="can(PERM.SET_DICT)" index="/settings/dictionary">
      <el-icon><Operation /></el-icon>
      <span>基础字典配置</span>
    </el-menu-item>

    <el-menu-item v-if="can(PERM.SET_DEPT)" index="/settings/departments">
      <el-icon><OfficeBuilding /></el-icon>
      <span>办理部门管理</span>
    </el-menu-item>

    <el-menu-item v-if="can(PERM.SET_STATUS)" index="/settings/status">
      <el-icon><List /></el-icon>
      <span>办理状态管理</span>
    </el-menu-item>

    <el-menu-item v-if="can(PERM.SET_STAFF)" index="/settings/service-staff">
      <el-icon><User /></el-icon>
      <span>开单客服管理</span>
    </el-menu-item>

    <el-menu-item v-if="can(PERM.SET_BACKUP)" index="/settings/data-backup">
      <el-icon><Postcard /></el-icon>
      <span>系统数据备份</span>
    </el-menu-item>

    <el-menu-item v-if="can(PERM.SET_IMPORT)" index="/settings/import-history">
      <el-icon><Clock /></el-icon>
      <span>导入历史记录</span>
    </el-menu-item>

    <el-menu-item v-if="can(PERM.SET_USERS)" index="/settings/users">
      <el-icon><User /></el-icon>
      <span>用户管理</span>
    </el-menu-item>

    <el-menu-item v-if="can(PERM.SET_FEES)" index="/settings/fees">
      <el-icon><Wallet /></el-icon>
      <span>业务费用配置</span>
    </el-menu-item>

    <el-menu-item v-if="can(PERM.SET_SETTLEMENT)" index="/settings/settlement">
      <el-icon><Postcard /></el-icon>
      <span>结算规则配置</span>
    </el-menu-item>

    <el-menu-item v-if="can(PERM.SET_REMINDER_RULE)" index="/settings/reminder-rule">
      <el-icon><Bell /></el-icon>
      <span>提醒规则配置</span>
    </el-menu-item>

    <el-menu-item v-if="can(PERM.SET_RECYCLE)" index="/settings/recycle-bin">
      <el-icon><Delete /></el-icon>
      <span>回收站</span>
    </el-menu-item>
  </el-sub-menu>
</el-menu>





        </el-scrollbar>

        <div class="sidebar-footer">
          <el-tooltip :content="sidebarCollapsed ? '展开菜单' : '折叠菜单'" placement="right">
            <el-button
              text
              circle
              class="collapse-btn"
              @click="toggleSidebar"
            >
              <el-icon>
                <Fold v-if="!sidebarCollapsed" />
                <Expand v-else />
              </el-icon>
            </el-button>
          </el-tooltip>
        </div>
      </el-aside>

      <el-main class="content-area">
        <div class="breadcrumb-container">
          <el-breadcrumb separator="/" class="breadcrumb">
            <el-breadcrumb-item v-for="item in breadcrumbItems" :key="item.path">
              <router-link v-if="item.to" :to="item.to">{{ item.title }}</router-link>
              <span v-else class="current-page">{{ item.title }}</span>
            </el-breadcrumb-item>
          </el-breadcrumb>
          
          <div class="page-actions">
            <slot name="actions"></slot>
          </div>
        </div>

<div class="content-scroll">
  <div class="content-card">
    <router-view v-slot="{ Component, route }">
      <transition name="fade" mode="out-in" appear>
        <div :key="route.path" style="width:100%; height:100%; min-height:0; display:flex; flex-direction:column;">
  <component :is="Component" />
        </div>
      </transition>
    </router-view>
  </div>
</div>

      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import screenfull from 'screenfull'
import { auth } from '@/utils/auth'
import { permissionService } from '@/domain/auth/permissionService'
import { PERM } from '@/domain/auth/permissionKeys'



import {
  OfficeBuilding, FullScreen, Aim, Bell, ArrowDown, User, Setting, SwitchButton,
  Odometer, Document, Plus, List, Folder, DataAnalysis, UserFilled, Files, Clock,
  BellFilled, Calendar, AlarmClock, Message, Money, Collection,
  Fold, Expand, CircleCheckFilled, WarningFilled, InfoFilled, CircleCloseFilled, Memo,
  Wallet, Postcard, Operation, Delete
} from '@element-plus/icons-vue'

// ⭐ 菜单权限判断函数
const can = (name) => permissionService.hasPermission(name)
const anyCan = (names) => names.some((n) => can(n))

const route = useRoute()
const router = useRouter()

const sidebarCollapsed = ref(false)
const isFullscreen = ref(false)
const currentLang = ref({ value: 'zh', label: '中文' })

const languageOptions = [
  { value: 'zh', label: '中文' },
  { value: 'en', label: 'English' },
  { value: 'kh', label: 'ភាសាខ្មែរ' }
]

// ✅ 角色显示中文
const ROLE_LABEL = {
  admin: '系统管理员',
  staff: '业务人员',
  finance: '财务',
  agent: '代理'
}

// ✅ 当前登录用户（真实）
const currentUser = computed(() => auth.getUser())

// ✅ 顶部右侧展示信息（不再写死）
const userInfo = computed(() => {
  const u = currentUser.value
  if (!u) {
    return { id: '', name: '未登录', role: '', avatar: '', email: '' }
  }
  return {
    id: u.id,
    name: u.name || u.username,
    role: ROLE_LABEL[u.role] || u.role || '',
    avatar: u.avatar || '',
    email: u.email || ''
  }
})

/** ================= 通知：先做成可用的本地版本 ================= */
const NOTIFY_KEY = 'NOTIFICATIONS_V1'

const loadNotifications = () => {
  try {
    return JSON.parse(localStorage.getItem(NOTIFY_KEY) || '[]')
  } catch {
    return []
  }
}
const saveNotifications = (list) => {
  localStorage.setItem(NOTIFY_KEY, JSON.stringify(list))
}

const notifications = ref(loadNotifications())

// ✅ 如果你想要默认演示通知（第一次没有数据时写入）
onMounted(() => {
  const existed = loadNotifications()
  if (!existed.length) {
    const demo = [
      { id: 1, title: '新订单待处理', type: 'warning', time: Date.now() - 300000, read: false },
      { id: 2, title: '证件即将到期提醒', type: 'danger', time: Date.now() - 600000, read: false },
      { id: 3, title: '系统维护通知', type: 'info', time: Date.now() - 86400000, read: true }
    ]
    notifications.value = demo
    saveNotifications(demo)
  } else {
    notifications.value = existed
  }

  const savedState = localStorage.getItem('sidebarCollapsed')
  if (savedState !== null) {
    sidebarCollapsed.value = JSON.parse(savedState)
  }

  if (screenfull.isEnabled) {
    screenfull.on('change', () => {
      isFullscreen.value = screenfull.isFullscreen
    })
  }
})

onUnmounted(() => {
  if (screenfull.isEnabled) screenfull.off('change')
})

const reminderCount = computed(() => {
  return notifications.value.filter(n => !n.read && n.type !== 'info').length
})
const unreadCount = computed(() => {
  return notifications.value.filter(n => !n.read).length
})

const activeMenu = computed(() => route.path)

const breadcrumbItems = computed(() => {
  const items = []
  items.push({ title: '首页', to: '/' })
  if (route.meta?.breadcrumb) items.push(...route.meta.breadcrumb)
  else if (route.meta?.title) items.push({ title: route.meta.title })
  return items
})

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
  localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed.value))
}

const toggleFullscreen = () => {
  if (screenfull.isEnabled) screenfull.toggle()
}

const handleLanguageChange = (lang) => {
  currentLang.value = lang
  ElMessage.success(`已切换至${lang.label}`)
}

const handleUserCommand = (command) => {
  switch (command) {
    case 'profile':
      if (can(PERM.PROFILE)) {
        router.push('/profile')
      }
      break

    case 'settings':
      // 有账户设置权限 → 进入账户设置
      if (can(PERM.SET_ACCOUNT)) {
        router.push('/settings/account')
      } 
      // 没权限 → fallback 到个人中心
      else if (can(PERM.PROFILE)) {
        router.push('/profile')
      }
      break

    case 'logout':
      handleLogout()
      break
  }
}


const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    auth.logout()
    router.replace({ name: 'auth.login' })
    ElMessage.success('已安全退出')
  }).catch(() => {})
}

const handleNotificationClick = (notification) => {
  notification.read = true
  saveNotifications(notifications.value)

  // 你自己定义跳转逻辑
  if (notification.type === 'warning') router.push('/business/orders')
  if (notification.type === 'danger') router.push('/reminder/expiry')
}

const markAllAsRead = () => {
  notifications.value.forEach(n => (n.read = true))
  saveNotifications(notifications.value)
  ElMessage.success('已标记所有通知为已读')
}

const viewAllNotifications = () => {
  if (!can(PERM.NOTIFICATIONS)) return
  router.push('/notifications')
}


const getNotificationIcon = (type) => {
  switch (type) {
    case 'success': return CircleCheckFilled
    case 'warning': return WarningFilled
    case 'danger': return CircleCloseFilled
    default: return InfoFilled
  }
}

const getNotificationColor = (type) => {
  switch (type) {
    case 'success': return '#67c23a'
    case 'warning': return '#e6a23c'
    case 'danger': return '#f56c6c'
    default: return '#909399'
  }
}

const formatTime = (time) => {
  const t = typeof time === 'number' ? new Date(time) : new Date(time)
  const now = new Date()
  const diff = now - t
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return t.toLocaleDateString()
}
</script>


<style scoped>
.admin-layout { height: 100vh; overflow: hidden; }
.topbar { height: 60px; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding: 0; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); }
.topbar-content { display: flex; align-items: center; justify-content: space-between; height: 100%; padding: 0 24px; }
.logo-area { display: flex; align-items: center; color: white; }
.logo-collapsed { display: flex; align-items: center; }
.logo-expanded { display: flex; align-items: center; gap: 12px; }
.logo-icon { color: #60a5fa; filter: drop-shadow(0 2px 4px rgba(96, 165, 250, 0.3)); }
.system-title { font-size: 18px; font-weight: 700; margin: 0; background: linear-gradient(135deg, #ffffff 0%, #93c5fd 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: 0.3px; }
.version-tag { font-size: 11px; background: rgba(96, 165, 250, 0.2); color: #93c5fd; padding: 2px 6px; border-radius: 4px; margin-left: 8px; font-weight: 500; }
.topbar-right { display: flex; align-items: center; gap: 16px; }
.lang-btn { color: white !important; border: 1px solid rgba(255, 255, 255, 0.15) !important; background: rgba(255, 255, 255, 0.05) !important; border-radius: 8px !important; padding: 6px 12px !important; transition: all 0.3s !important; }
.lang-btn:hover { background: rgba(255, 255, 255, 0.1) !important; border-color: rgba(255, 255, 255, 0.25) !important; }
.lang-text { margin-right: 6px; font-size: 13px; font-weight: 500; }
.user-profile { display: flex; align-items: center; gap: 12px; padding: 6px 12px; border-radius: 12px; cursor: pointer; transition: all 0.3s; border: 1px solid rgba(255, 255, 255, 0.1); background: rgba(255, 255, 255, 0.05); }
.user-profile:hover { background: rgba(255, 255, 255, 0.1); border-color: rgba(255, 255, 255, 0.2); transform: translateY(-1px); }
.user-info { text-align: left; }
.user-name { font-size: 14px; font-weight: 600; color: white; }
.user-role { font-size: 12px; color: rgba(255, 255, 255, 0.7); margin-top: 2px; }
.dropdown-arrow { color: rgba(255, 255, 255, 0.7); font-size: 12px; }
.main-container { height: calc(100vh - 60px); overflow: hidden; }
.sidebar { background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%); border-right: 1px solid rgba(255, 255, 255, 0.05); transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 2px 0 12px rgba(0, 0, 0, 0.1); overflow: hidden; }
.sidebar.collapsed { width: 64px !important; }
.sidebar-scrollbar { height: calc(100vh - 120px); }
:deep(.sidebar-scrollbar .el-scrollbar__wrap) { overflow-x: hidden; }
.sidebar-menu { border-right: none; background: transparent; padding: 8px; }
:deep(.sidebar-menu .el-menu-item), :deep(.sidebar-menu .el-sub-menu__title) { color: #cbd5e1 !important; height: 48px; line-height: 48px; border-radius: 8px; margin: 4px 0; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); font-weight: 500; }
:deep(.sidebar-menu .el-menu-item:hover), :deep(.sidebar-menu .el-sub-menu__title:hover) { background: rgba(37, 99, 235, 0.15) !important; transform: translateX(4px); color: white !important; }
:deep(.sidebar-menu .el-menu-item.is-active) { background: linear-gradient(135deg, #2563eb, #3b82f6) !important; color: white !important; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3); position: relative; }
:deep(.sidebar-menu .el-menu-item.is-active)::before { content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 4px; height: 60%; background: white; border-radius: 0 2px 2px 0; }
:deep(.el-menu--inline) { background: rgba(255, 255, 255, 0.02) !important; border-radius: 8px; margin: 4px 0 !important; padding: 4px 0 !important; }
:deep(.el-menu--inline .el-menu-item) { color: #cbd5e1 !important; height: 40px !important; line-height: 40px !important; margin: 2px 8px !important; width: calc(100% - 16px) !important; border-radius: 6px !important; }
:deep(.el-menu--inline .el-menu-item:hover) { background: rgba(37, 99, 235, 0.15) !important; color: white !important; }
:deep(.el-menu--inline .el-menu-item.is-active) { background: linear-gradient(135deg, #2563eb, #3b82f6) !important; color: white !important; box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3); }
:deep(.el-sub-menu .el-sub-menu__icon-arrow) { color: #94a3b8 !important; }
:deep(.el-sub-menu.is-opened > .el-sub-menu__title .el-sub-menu__icon-arrow) { color: white !important; transform: rotate(180deg); }
:deep(.el-sub-menu.is-opened > .el-sub-menu__title) { color: white !important; }
:deep(.sidebar.collapsed .el-menu-item .el-menu-tooltip__trigger) { color: #cbd5e1 !important; }
:deep(.sidebar.collapsed .el-menu-item.is-active .el-menu-tooltip__trigger) { color: white !important; }
.sidebar-footer { height: 60px; display: flex; align-items: center; justify-content: center; border-top: 1px solid rgba(255, 255, 255, 0.05); }
.collapse-btn { color: #94a3b8 !important; transition: all 0.3s !important; border: 1px solid rgba(255, 255, 255, 0.05) !important; background: rgba(255, 255, 255, 0.03) !important; }
.collapse-btn:hover { color: white !important; background: rgba(255, 255, 255, 0.1) !important; border-color: rgba(255, 255, 255, 0.1) !important; }
.content-area { 
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 0;
  overflow: hidden;   /* ✅ 自己不滚 */
  display: flex;
  flex-direction: column;
  height: 100%;       /* ✅ 必须要 */
  min-height: 0;
}
.content-scroll {
  flex: 1;
  overflow: hidden;   /* ✅ 禁止页面滚动 */
  min-height: 0;     /* ✅ 给子级滚动空间 */
  display: flex;
  flex-direction: column;
}


.breadcrumb-container { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; background: white; border-bottom: 1px solid #e5e7eb; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); }
.breadcrumb { flex: 1; }
:deep(.breadcrumb .el-breadcrumb__item) { font-size: 14px; }
:deep(.breadcrumb .el-breadcrumb__inner) { color: #6b7280; transition: color 0.2s; font-weight: 500; }
:deep(.breadcrumb .el-breadcrumb__inner:hover) { color: #2563eb; }
.current-page { color: #111827; font-weight: 600; }
.page-actions { margin-left: 16px; }
.content-card {
  flex: 1; 
  background: white;
  margin: 16px 24px 24px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e5e7eb;

   display: flex;
  flex-direction: column;
  min-height: 0;   /* ✅ 必须 */
  overflow: hidden;
  animation: fadeIn 0.5s ease-out;
}
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.fade-enter-from { opacity: 0; transform: translateY(8px); }
.fade-leave-to { opacity: 0; transform: translateY(-8px); }
@media (max-width: 768px) { .sidebar { position: fixed; left: 0; top: 60px; z-index: 1000; height: calc(100vh - 60px); box-shadow: 4px 0 20px rgba(0, 0, 0, 0.15); } .breadcrumb-container { flex-direction: column; align-items: flex-start; gap: 12px; padding: 12px 16px; } .page-actions { margin-left: 0; width: 100%; } .topbar-content { padding: 0 16px; } .system-title { font-size: 16px; } .user-info { display: none; } .content-card { margin: 12px; } }
:deep(.el-scrollbar__thumb) { background: rgba(255, 255, 255, 0.2) !important; }
:deep(.el-scrollbar__thumb:hover) { background: rgba(255, 255, 255, 0.3) !important; }
:deep(.el-button) { border-radius: 8px !important; font-weight: 500 !important; transition: all 0.3s !important; }
:deep(.el-button--primary) { background: linear-gradient(135deg, #2563eb, #3b82f6) !important; border: none !important; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25) !important; }
:deep(.el-button--primary:hover) { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35) !important; }
:deep(.el-button--text) { border-radius: 6px !important; }



</style>

