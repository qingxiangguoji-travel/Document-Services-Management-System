import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

export function useOrderCreate() {
  const router = useRouter()
  const formRef = ref(null)

  const order = reactive({
    order_no: `ORD-${new Date().getFullYear()}${Date.now().toString().slice(-4)}`,
    order_date: new Date()
  })

  const clients = ref([])

  const createClient = () => ({
    name: '',
    passport: '',
    code: '',
    visa_expire: '',
    nationality: '',
    business_type: '',
    status: '',
    last_year_work: false,
    fee: 0,
    payment_status: 'unpaid'
  })

  const addClient = () => {
    clients.value.push(createClient())
  }

  const removeClient = (index) => {
    clients.value.splice(index, 1)
  }

  const totalFee = computed(() =>
    clients.value.reduce((sum, c) => sum + Number(c.fee || 0), 0)
  )

  const submit = () => {
    if (!clients.value.length) {
      ElMessage.error('请至少添加一位客户')
      return
    }

    ElMessage.success('订单已保存（模拟）')
    router.push('/business/orders')
  }

  const cancel = () => {
    router.back()
  }

  return {
    formRef,
    order,
    clients,
    totalFee,
    addClient,
    removeClient,
    submit,
    cancel
  }
}
