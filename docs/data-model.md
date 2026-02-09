# 订单系统数据模型（Single Source of Truth）

## 1. 核心原则
- localStorage / 数据库中的 ORDERS 是唯一权威数据源
- 页面状态(form) 只是视图映射，不允许成为逻辑源
- 所有业务规则必须由字段驱动，而不是 UI 推断

---

## 2. Order 实体结构

### 基础字段
- id: string | number
- code: string (订单编号)
- created_at: YYYY-MM-DD
- agent_company: string
- agent_contact: string
- service_staff: string
- remark: string

### 状态字段（核心）
- order_type: notify | confirmed | history
- status: created | processing | completed | cancelled

### 转单追溯字段
- source_notify_id: string | null
- linked_order_id: string | null
- converted_at: ISO datetime | null
- confirmed_at: ISO datetime | null

### 数据字段
- customers: Customer[]

---

## 3. 状态规则（硬规则）

### order_type
| 类型 | 含义 | 是否可编辑 |
|------|------|------------|
| notify | 通知订单 | 是 |
| confirmed | 确认订单 | 是 |
| history | 历史订单 | 否 |

### 转换规则
1. notify → confirmed
   - 必须创建新订单
   - 原订单变成 history
   - 记录 source_notify_id 和 linked_order_id
2. history
   - 永远不可修改
   - 只能查看

---

## 4. 列表排序规则
- 所有订单按 created_at DESC 排序
- confirmed 和 history 只是类型，不影响排序

---

## 5. UI 行为规则
- notify + created_at = 今天
  → 允许改状态，不允许转单
- notify + created_at < 今天
  → 允许转单，不允许改状态
- history
  → 禁止所有编辑

---

## 6. 数据一致性规则
- 保存前必须 normalizeOrderForSave
- 列表页必须 normalizeOrderForView
- 页面不得直接使用 raw storage 数据
