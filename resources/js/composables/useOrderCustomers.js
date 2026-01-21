import { ref, reactive, computed } from 'vue'

function createEmptyCustomer() {
  return {
    id: Date.now() + Math.random(),
    name: '',
    passport_no: '',
    code: '',
    nationality: '',
    passport_expiry: '',
    business_type: '',
    status: '',
    last_year_permit: false,
    fee: 0,
    fee_status: '',
    remark: '',
    fileGroups: [] // ⚠️ 客户级文件系统挂载点
  }
}

export function useOrderCustomers(order) {
  const customers = reactive([createEmptyCustomer()])
  const currentCustomerIndex = ref(0)

  const currentCustomer = computed(
    () => customers[currentCustomerIndex.value]
  )

  /* ===== 客户操作 ===== */
  const addCustomer = () => {
    customers.push(createEmptyCustomer())
    currentCustomerIndex.value = customers.length - 1
  }

  const removeCustomer = (index) => {
    if (customers.length === 1) return
    customers.splice(index, 1)
    currentCustomerIndex.value = Math.max(0, index - 1)
  }

  const switchCustomer = (index) => {
    currentCustomerIndex.value = index
  }

  /* ===== 费用汇总 ===== */
  const totalFee = computed(() =>
    customers.reduce((sum, c) => sum + Number(c.fee || 0), 0)
  )

  /* ===== 绑定到订单 ===== */
  order.customers = customers

  return {
    customers,
    currentCustomerIndex,
    currentCustomer,
    addCustomer,
    removeCustomer,
    switchCustomer,
    totalFee
  }
}
