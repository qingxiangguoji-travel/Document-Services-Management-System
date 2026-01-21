/**
 * 验证订单编号格式
 * @param {string} orderNo - 订单编号
 * @returns {string|boolean} 错误信息或true
 */
export function validateOrderNo(orderNo) {
  if (!orderNo) return '订单编号不能为空'
  
  const pattern = /^QX\d{6}\d{4}$/
  if (!pattern.test(orderNo)) {
    return '订单编号格式不正确，应为: QX + 年月日 + 4位流水号 (如: QX2401010001)'
  }
  
  return true
}

/**
 * 验证护照号码
 * @param {string} passport - 护照号码
 * @returns {string|boolean} 错误信息或true
 */
export function validatePassport(passport) {
  if (!passport) return '护照号码不能为空'
  if (passport.length < 6) return '护照号码格式不正确'
  return true
}

/**
 * 验证客户姓名
 * @param {string} name - 客户姓名
 * @returns {string|boolean} 错误信息或true
 */
export function validateCustomerName(name) {
  if (!name) return '客户姓名不能为空'
  if (name.length < 2) return '姓名至少需要2个字符'
  return true
}

/**
 * 验证费用格式
 * @param {string|number} fee - 费用
 * @returns {string|boolean} 错误信息或true
 */
export function validateFee(fee) {
  if (!fee && fee !== 0) return true // 费用可选
  
  const num = parseFloat(fee)
  if (isNaN(num)) return '请输入有效的金额'
  if (num < 0) return '金额不能为负数'
  if (num > 10000000) return '金额过大'
  
  return true
}