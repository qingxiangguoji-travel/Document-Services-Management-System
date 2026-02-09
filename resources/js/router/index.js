import { createRouter, createWebHistory } from 'vue-router'
import { PERM } from '@/domain/auth/permissionKeys'
import { applyAuthGuard } from './guard'

import AdminLayout from '../layouts/AdminLayout.vue'
import Dashboard from '../pages/Dashboard.vue'
import Login from '../pages/Auth/Login.vue'
import Profile from '../pages/Auth/Profile.vue'

import UserManagement from '../pages/Settings/UserManagement.vue'
import AgentIndex from '../pages/Agent/Index.vue'
import AgentDetail from '../pages/Agent/Detail.vue'
import AgentCommission from '../pages/Agent/Commission.vue'

import BusinessFiles from '../pages/Business/Files.vue'
import BusinessOrders from '../pages/Business/Orders.vue'
import BusinessOrderDetail from '../pages/Business/Detail.vue'
import BusinessOrderCreate from '../pages/Business/Create.vue'

import CertificateIndex from '../pages/Certificates/Index.vue'
import CertificateCreate from '../pages/Certificates/Create.vue'
import CertificateDetail from '../pages/Certificates/Detail.vue'

import StatusWorkflow from '../pages/Settings/StatusWorkflow.vue'
import DepartmentConfig from '../pages/Settings/DepartmentConfig.vue'
import DictionaryConfig from '../pages/Settings/DictionaryConfig.vue'
import ServiceStaff from '../pages/Settings/ServiceStaff.vue'
import DataBackup from '../pages/Settings/DataBackup.vue'
import RecycleBin from '../pages/Settings/RecycleBin.vue'
import ImportHistory from '@/pages/Settings/ImportHistory.vue'
import PlaceholderPage from '../pages/_PlaceholderPage.vue'

const routes = [

  { path:'/login', name:'auth.login', component:Login, meta:{ public:true }},

  {
    path:'/',
    component:AdminLayout,
    meta:{ requiresAuth:true },
    children:[

      /* 首页 */
      {
        path:'',
        name:PERM.DASHBOARD,
        component:Dashboard,
        meta:{ title:'仪表盘' }
      },

      {
        path:'profile',
        name:PERM.PROFILE,
        component:Profile,
        meta:{
          title:'个人中心',
          breadcrumb:[{ title:'个人中心' }]
        }
      },

      /* ================= 业务管理 ================= */
      {
        path:'business/orders',
        name:PERM.BUSINESS_ORDERS,
        component:BusinessOrders,
        meta:{
          title:'订单列表',
          breadcrumb:[
            { title:'业务管理' },
            { title:'订单列表' }
          ]
        }
      },

      {
        path:'business/orders/create',
        name:PERM.BUSINESS_ORDER_CREATE,
        component:BusinessOrderCreate,
        meta:{
          title:'新建订单',
          breadcrumb:[
            { title:'业务管理', to:'/business/orders' },
            { title:'新建订单' }
          ]
        }
      },

      {
        path:'business/orders/:id',
        name:PERM.BUSINESS_ORDER_DETAIL,
        component:BusinessOrderDetail,
        meta:{
          title:'订单详情',
          breadcrumb:[
            { title:'业务管理', to:'/business/orders' },
            { title:'订单详情' }
          ]
        }
      },

      {
        path:'business/files',
        name:PERM.BUSINESS_FILES,
        component:BusinessFiles,
        meta:{
          title:'文件管理',
          breadcrumb:[
            { title:'业务管理' },
            { title:'文件管理' }
          ]
        }
      },

      {
        path:'business/stats',
        name:PERM.BUSINESS_STATS,
        component:PlaceholderPage,
        meta:{
          title:'业务统计',
          breadcrumb:[
            { title:'业务管理' },
            { title:'业务统计' }
          ]
        }
      },

      /* ================= 代理客户 ================= */
      {
        path:'agents',
        name:PERM.AGENT_INDEX,
        component:AgentIndex,
        meta:{
          title:'代理客户列表',
          breadcrumb:[
            { title:'代理客户管理' },
            { title:'代理客户列表' }
          ]
        }
      },

      {
        path:'agents/:id',
        name:PERM.AGENT_DETAIL,
        component:AgentDetail,
        meta:{
          title:'代理详情',
          breadcrumb:[
            { title:'代理客户管理', to:'/agents' },
            { title:'代理详情' }
          ]
        }
      },

      {
        path:'agents/commission',
        name:PERM.AGENT_COMMISSION,
        component:AgentCommission,
        meta:{
          title:'代理佣金管理',
          breadcrumb:[
            { title:'代理客户管理' },
            { title:'代理佣金管理' }
          ]
        }
      },

      {
        path:'customers',
        name:PERM.CUSTOMER_INDEX,
        component:PlaceholderPage,
        meta:{
          title:'客户管理列表',
          breadcrumb:[
            { title:'代理客户管理' },
            { title:'客户管理列表' }
          ]
        }
      },

      {
        path:'agent/follow',
        name:PERM.AGENT_FOLLOW,
        component:PlaceholderPage,
        meta:{
          title:'跟进记录',
          breadcrumb:[
            { title:'代理客户管理' },
            { title:'跟进记录' }
          ]
        }
      },

      /* ================= 证件管理 ================= */
      {
        path:'certificates',
        name:PERM.CERT_INDEX,
        component:CertificateIndex,
        meta:{
          title:'证件列表',
          breadcrumb:[
            { title:'证件管理' },
            { title:'证件列表' }
          ]
        }
      },

      {
        path:'certificates/create',
        name:PERM.CERT_CREATE,
        component:CertificateCreate,
        meta:{
          title:'新建证件',
          breadcrumb:[
            { title:'证件管理', to:'/certificates' },
            { title:'新建证件' }
          ]
        }
      },

      {
        path:'certificates/:id',
        name:PERM.CERT_DETAIL,
        component:CertificateDetail,
        meta:{
          title:'证件详情',
          breadcrumb:[
            { title:'证件管理', to:'/certificates' },
            { title:'证件详情' }
          ]
        }
      },

      {
        path:'certificate/history',
        name:PERM.CERT_HISTORY,
        component:PlaceholderPage,
        meta:{
          title:'证件历史',
          breadcrumb:[
            { title:'证件管理' },
            { title:'证件历史' }
          ]
        }
      },

      /* ================= 提醒中心 ================= */
      {
        path:'reminder/expiry',
        name:PERM.REMINDER_EXPIRY,
        component:PlaceholderPage,
        meta:{
          title:'到期提醒',
          breadcrumb:[
            { title:'提醒中心' },
            { title:'到期提醒' }
          ]
        }
      },

      {
        path:'reminder/follow',
        name:PERM.REMINDER_FOLLOW,
        component:PlaceholderPage,
        meta:{
          title:'跟进提醒',
          breadcrumb:[
            { title:'提醒中心' },
            { title:'跟进提醒' }
          ]
        }
      },

      {
        path:'reminder/system',
        name:PERM.REMINDER_SYSTEM,
        component:PlaceholderPage,
        meta:{
          title:'系统通知',
          breadcrumb:[
            { title:'提醒中心' },
            { title:'系统通知' }
          ]
        }
      },

      {
        path:'notifications',
        name:PERM.NOTIFICATIONS,
        component:PlaceholderPage,
        meta:{
          title:'全部通知',
          breadcrumb:[
            { title:'提醒中心' },
            { title:'全部通知' }
          ]
        }
      },

      /* ================= 财务管理 ================= */
      {
        path:'finance/records',
        name:PERM.FINANCE_RECORDS,
        component:PlaceholderPage,
        meta:{
          title:'收支记录',
          breadcrumb:[
            { title:'财务管理' },
            { title:'收支记录' }
          ]
        }
      },

      {
        path:'finance/department',
        name:PERM.FINANCE_DEPT,
        component:PlaceholderPage,
        meta:{
          title:'部门结算',
          breadcrumb:[
            { title:'财务管理' },
            { title:'部门结算' }
          ]
        }
      },

      {
        path:'finance/agent',
        name:PERM.FINANCE_AGENT,
        component:PlaceholderPage,
        meta:{
          title:'代理结算',
          breadcrumb:[
            { title:'财务管理' },
            { title:'代理结算' }
          ]
        }
      },

      /* ================= 系统设置 ================= */
      {
        path:'settings/dictionary',
        name:PERM.SET_DICT,
        component:DictionaryConfig,
        meta:{
          title:'基础字典配置',
          breadcrumb:[
            { title:'系统设置' },
            { title:'基础字典配置' }
          ]
        }
      },

      {
        path:'settings/departments',
        name:PERM.SET_DEPT,
        component:DepartmentConfig,
        meta:{
          title:'办理部门管理',
          breadcrumb:[
            { title:'系统设置' },
            { title:'办理部门管理' }
          ]
        }
      },

      {
        path:'settings/status',
        name:PERM.SET_STATUS,
        component:StatusWorkflow,
        meta:{
          title:'办理状态管理',
          breadcrumb:[
            { title:'系统设置' },
            { title:'办理状态管理' }
          ]
        }
      },

      {
        path:'settings/service-staff',
        name:PERM.SET_STAFF,
        component:ServiceStaff,
        meta:{
          title:'开单客服管理',
          breadcrumb:[
            { title:'系统设置' },
            { title:'开单客服管理' }
          ]
        }
      },

      {
        path:'settings/data-backup',
        name:PERM.SET_BACKUP,
        component:DataBackup,
        meta:{
          title:'系统数据备份',
          breadcrumb:[
            { title:'系统设置' },
            { title:'系统数据备份' }
          ]
        }
      },

      {
        path:'settings/import-history',
        name:PERM.SET_IMPORT,
        component:ImportHistory,
        meta:{
          title:'导入历史记录',
          breadcrumb:[
            { title:'系统设置' },
            { title:'导入历史记录' }
          ]
        }
      },

      {
        path:'settings/recycle-bin',
        name:PERM.SET_RECYCLE,
        component:RecycleBin,
        meta:{
          title:'回收站',
          breadcrumb:[
            { title:'系统设置' },
            { title:'回收站' }
          ]
        }
      },

      {
        path:'settings/users',
        name:PERM.SET_USERS,
        component:UserManagement,
        meta:{
          title:'用户管理',
          breadcrumb:[
            { title:'系统设置' },
            { title:'用户管理' }
          ]
        }
      },

      {
        path:'settings/fees',
        name:PERM.SET_FEES,
        component:PlaceholderPage,
        meta:{
          title:'业务费用配置',
          breadcrumb:[
            { title:'系统设置' },
            { title:'业务费用配置' }
          ]
        }
      },

      {
        path:'settings/settlement',
        name:PERM.SET_SETTLEMENT,
        component:PlaceholderPage,
        meta:{
          title:'结算规则配置',
          breadcrumb:[
            { title:'系统设置' },
            { title:'结算规则配置' }
          ]
        }
      },

      {
        path:'settings/reminder-rule',
        name:PERM.SET_REMINDER_RULE,
        component:PlaceholderPage,
        meta:{
          title:'提醒规则配置',
          breadcrumb:[
            { title:'系统设置' },
            { title:'提醒规则配置' }
          ]
        }
      },

      {
        path:'settings/account',
        name:PERM.SET_ACCOUNT,
        component:PlaceholderPage,
        meta:{
          title:'账户设置',
          breadcrumb:[
            { title:'系统设置' },
            { title:'账户设置' }
          ]
        }
      }

    ]
  },

  { path:'/:pathMatch(.*)*', redirect:'/' }
]

const router = createRouter({ history:createWebHistory(), routes })
applyAuthGuard(router)
export default router
