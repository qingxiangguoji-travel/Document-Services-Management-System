import { createRouter, createWebHistory } from 'vue-router'
import AdminLayout from '../layouts/AdminLayout.vue'
import Dashboard from '../pages/Dashboard.vue'

// 代理客户
import AgentIndex from '../pages/Agent/Index.vue'
import AgentDetail from '../pages/Agent/Detail.vue'
import AgentCommission from '../pages/Agent/Commission.vue' // 新增

// 业务订单
import BusinessFiles from '../pages/Business/Files.vue'
import BusinessOrders from '../pages/Business/Orders.vue'
import BusinessOrderDetail from '../pages/Business/Detail.vue'
import BusinessOrderCreate from '../pages/Business/Create.vue' 

// 证件管理
import CertificateIndex from '../pages/Certificates/Index.vue'
import CertificateCreate from '../pages/Certificates/Create.vue'
import CertificateDetail from '../pages/Certificates/Detail.vue'

// 系统设置 (对应菜单拆分)
import StatusWorkflow from '../pages/Settings/StatusWorkflow.vue'
import DepartmentConfig from '../pages/Settings/DepartmentConfig.vue'
import DictionaryConfig from '../pages/Settings/DictionaryConfig.vue'
import ServiceStaff from '../pages/Settings/ServiceStaff.vue' // 新增
import DataBackup from '../pages/Settings/DataBackup.vue'


const routes = [
  {
    path: '/',
    component: AdminLayout,
    children: [
      {
        path: '',
        name: 'dashboard',
        component: Dashboard,
        meta: { title: '仪表盘' }
      },
      /* ================= 业务管理 ================= */
      {
        path: 'business/orders',
        name: 'business.orders',
        component: BusinessOrders,
        meta: { title: '订单管理' }
      },
      {
        path: 'business/orders/create',
        name: 'business.orders.create',
        component: BusinessOrderCreate,
        meta: { title: '新建订单' }
      },
      /* ================= 代理客户 ================= */
      {
        path: 'agents',
        name: 'agent.index',
        component: AgentIndex,
        meta: { title: '代理客户管理' }
      },
      {
        path: 'agents/commission', // 新增：代理佣金管理
        name: 'agent.commission',
        component: AgentCommission,
        meta: { title: '代理佣金管理' }
      },
      /* ================= 证件管理 ================= */
      {
        path: 'certificates',
        name: 'certificate.index',
        component: CertificateIndex,
        meta: { title: '证件列表' }
      },
      /* ================= 系统设置 ================= */
      {
        path: 'settings/dictionary',
        name: 'settings.dictionary',
        component: DictionaryConfig,
        meta: { title: '证件与国籍配置' } 
      },
      {
        path: 'settings/departments',
        name: 'settings.departments',
        component: DepartmentConfig,
        meta: { title: '办理部门管理' }
      },
      {
        path: 'settings/status',
        name: 'settings.status',
        component: StatusWorkflow,
        meta: { title: '办理状态管理' }
      },
      {
        path: 'settings/service-staff', // 新增：开单客服管理
        name: 'settings.serviceStaff',
        component: ServiceStaff,
        meta: { title: '开单客服管理' }
      },
{
  path: 'settings/data-backup',
  name: 'settings.dataBackup',
  component: DataBackup,
  meta: { title: '系统数据备份' }
}	  
    ]
  }
]

export default createRouter({
  history: createWebHistory(),
  routes
})