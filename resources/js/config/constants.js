// resources/js/config/constants.js
export const AGENT_LEVELS = [
  { label: 'A级代理', value: 'A', color: 'success' },
  { label: 'B级代理', value: 'B', color: 'warning' },
  { label: 'C级代理', value: 'C', color: 'danger' }
];

export const INDUSTRIES = ['酒店', '贸易', '旅游', '地产', '餐饮', '其他'];

// resources/js/config/constants.js
export const ORDER_STATUS = {
  created: { text: '已录入', color: 'info' },
  processing: { text: '办理中', color: 'primary' },
  completed: { text: '已完成', color: 'success' },
  cancelled: { text: '已取消', color: 'danger' }
};

export const SETTLEMENT_STATUS = {
  unpaid: { text: '待结算', type: 'danger' },
  paid: { text: '已清账', type: 'success' }
};