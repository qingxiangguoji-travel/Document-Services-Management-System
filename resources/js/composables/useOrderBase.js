import { reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

export function useOrderBase({ formRef, isEdit, router }) {
  const order = reactive({
    id: null,
    order_no: '',
    created_at: '',
    agent_id: null,
    department_id: null,
    status: '',
    remark: ''
  })

  const orderNoError = ref('')

  /* ===== 订单编号 ===== */
  const generateOrderNo = () => {
    const date = new Date()
    const ymd = date.toISOString().slice(0, 10).replace(/-/g, '')
    const seq = Number(localStorage.getItem('order_sequence') || 0) + 1
    localStorage.setItem('order_sequence', seq)
    order.order_no = `ORD-${ymd}-${String(seq).padStart(4, '0')}`
  }

  const validateOrderNo = () => {
    const valid = /^ORD-\d{8}-\d{4}$/.test(order.order_no)
    orderNoError.value = valid ? '' : '订单编号格式不正确'
    return valid
  }

  watch(
    () => order.order_no,
    () => validateOrderNo()
  )

  /* ===== 初始化 ===== */
  if (!isEdit) {
    generateOrderNo()
    order.created_at = new Date()
  } else {
    // ⚠️ 编辑模式：后期接 API
    // Object.assign(order, fetchedData)
  }

  /* ===== 提交 ===== */
  const submitOrder = async () => {
    if (!validateOrderNo()) {
      ElMessage.error('请检查订单编号')
      return
    }

    await formRef.value?.validate?.()

    console.log('提交订单（含客户、文件）：', JSON.parse(JSON.stringify(order)))
    ElMessage.success(isEdit ? '订单已更新（模拟）' : '订单已创建（模拟）')

    router.push('/business/orders')
  }

  /* ===== 取消 ===== */
  const cancelEdit = () => {
    ElMessageBox.confirm('确定要取消吗？未保存的内容将丢失', '提示', {
      type: 'warning'
    }).then(() => {
      router.back()
    })
  }

  return {
    order,
    orderNoError,
    generateOrderNo,
    validateOrderNo,
    submitOrder,
    cancelEdit
  }
}
