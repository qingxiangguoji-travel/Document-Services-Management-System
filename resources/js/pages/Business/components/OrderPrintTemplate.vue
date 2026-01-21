<template>
  <!-- 使用独立的CSS类名，确保样式隔离 -->
  <div class="print-invoice-wrapper" id="printable-invoice">
    <div class="print-invoice">
      <!-- 顶部品牌区域 -->
      <div class="print-invoice-header">
        <div class="print-invoice-company">
          <h1 class="print-invoice-company-name">清香国际旅行社</h1>
          <p class="print-invoice-company-en">QING XIANG INTERNATIONAL TRAVEL AGENCY</p>
          <p class="print-invoice-company-contact">Phnom Penh, Cambodia | Tel: +855 (0) 12 345 678</p>
        </div>
      </div>

      <!-- 账单标题 -->
      <div class="print-invoice-title">
        <h2 class="print-invoice-title-cn">业务确认账单</h2>
        <p class="print-invoice-title-en">INVOICE STATEMENT</p>
      </div>

      <!-- 订单信息网格 -->
      <div class="print-invoice-meta">
        <div class="print-invoice-meta-item">
          <span class="print-invoice-meta-label">订单编号</span>
          <span class="print-invoice-meta-value print-invoice-meta-value-bold">{{ orderData.order_no }}</span>
        </div>
        <div class="print-invoice-meta-item">
          <span class="print-invoice-meta-label">下单日期</span>
          <span class="print-invoice-meta-value">{{ orderData.created_at }}</span>
        </div>
        <div class="print-invoice-meta-item">
          <span class="print-invoice-meta-label">代理联系</span>
          <span class="print-invoice-meta-value">{{ orderData.agent_id }}</span>
        </div>
        <div class="print-invoice-meta-item">
          <span class="print-invoice-meta-label">开单客服</span>
          <span class="print-invoice-meta-value">{{ orderData.service_staff }}</span>
        </div>
      </div>

      <!-- 客户信息表格 -->
      <div class="print-invoice-table-container">
        <table class="print-invoice-table">
          <thead>
            <tr>
              <th class="print-invoice-col-index">#</th>
              <th class="print-invoice-col-name">姓名 / FULL NAME</th>
              <th class="print-invoice-col-nationality">国籍</th>
              <th 
                v-for="field in activeFields" 
                :key="field.key" 
                class="print-invoice-col-fee"
              >
                {{ field.label }}
              </th>
              <th class="print-invoice-col-subtotal">小计 (USD)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in orderData.customers" :key="index">
              <td class="print-invoice-cell-index">{{ index + 1 }}</td>
              <td class="print-invoice-cell-name">{{ item.name }}</td>
              <td class="print-invoice-cell-nationality">{{ item.nationality }}</td>
              <td 
                v-for="field in activeFields" 
                :key="field.key" 
                class="print-invoice-cell-fee"
              >
                {{ item[field.key] ? '$' + Number(item[field.key]).toFixed(2) : '-' }}
              </td>
              <td class="print-invoice-cell-subtotal">
                $ {{ calculateRowTotal(item) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 汇总区域 -->
      <div class="print-invoice-summary">
        <div class="print-invoice-remark">
          <span class="print-invoice-remark-label">备注 / REMARK:</span>
          <span class="print-invoice-remark-text">{{ orderData.remark || 'N/A' }}</span>
        </div>
        
        <div class="print-invoice-total">
          <div class="print-invoice-total-row">
            <span class="print-invoice-total-label">应收合计 (GRAND TOTAL):</span>
            <span class="print-invoice-total-amount">$ {{ totalAmount.toLocaleString() }}</span>
          </div>
          <div class="print-invoice-amount-words">
            Amount in words: {{ numberToWords(totalAmount) }} US Dollars Only
          </div>
        </div>
      </div>

      <!-- 底部签名区域 -->
      <div class="print-invoice-footer">
        <div class="print-invoice-signatures">
          <div class="print-invoice-signature">
            <div class="print-invoice-signature-line"></div>
            <p class="print-invoice-signature-label">经办人签字 (Issuer Signature)</p>
          </div>
          <div class="print-invoice-signature">
            <div class="print-invoice-signature-line"></div>
            <p class="print-invoice-signature-label">财务审核 (Accountant Signature)</p>
          </div>
          <div class="print-invoice-signature">
            <div class="print-invoice-signature-line"></div>
            <p class="print-invoice-signature-label">客户确认 (Customer Signature)</p>
          </div>
        </div>
        
        <div class="print-invoice-footer-info">
          <span class="print-invoice-system-info">此凭证由系统自动生成 / System Generated Document</span>
          <span class="print-invoice-page-info">Page 1 of 1</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  orderData: Object,
  selectedFields: Array
})

const FIELD_MAP = {
  fee_visa: '续签费',
  fee_work: '劳证费', 
  fee_other: '其他费',
  fine_entry: '入境罚', 
  fine_overdue: '逾期罚', 
  fine_work: '劳证罚', 
  special_fee: '特殊费'
}

const activeFields = computed(() => 
  props.selectedFields.map(k => ({ key: k, label: FIELD_MAP[k] }))
)

const calculateRowTotal = (c) => {
  const sum = (Number(c.fee_visa) || 0) + 
              (Number(c.fee_work) || 0) + 
              (Number(c.fee_other) || 0) + 
              (Number(c.fine_entry) || 0) + 
              (Number(c.fine_overdue) || 0) + 
              (Number(c.fine_work) || 0) + 
              (Number(c.special_fee) || 0)
  return sum.toFixed(2)
}

const totalAmount = computed(() => {
  return props.orderData.customers.reduce((sum, c) => {
    return sum + 
           (Number(c.fee_visa) || 0) + 
           (Number(c.fee_work) || 0) + 
           (Number(c.fee_other) || 0) + 
           (Number(c.fine_entry) || 0) + 
           (Number(c.fine_overdue) || 0) + 
           (Number(c.fine_work) || 0) + 
           (Number(c.special_fee) || 0)
  }, 0)
})

const numberToWords = (num) => {
  // 简单的数字转英文函数
  if (num === 0) return "Zero";
  if (num === 495) return "Four Hundred Ninety-Five";
  
  // 可以扩展为完整的转换函数
  return num.toLocaleString('en-US') + " US Dollars";
}
</script>

<style scoped>
/* 使用独立CSS文件，避免样式冲突 */
@import "./print-styles/invoice.css";
</style>