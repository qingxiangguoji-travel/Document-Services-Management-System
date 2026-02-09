import { computed } from 'vue'


const orderDate = normalizeDate(order)
const isToday = orderDate === today


const target = isToday ? todayBlock : historyBlock


// ========== 订单数量（只算订单，不看业务） ==========
target.orders += 1
allBlock.orders += 1


const bizRows = order.customers || []


bizRows.forEach(row => {
const code = normalizeProcessStatus(row)
const group = getStatusGroup(code)


// 业务总数
target.bizTotal += 1
allBlock.bizTotal += 1


// 状态分组
if (group === 'created') {
target.created += 1
allBlock.created += 1
}
if (group === 'unpaid') {
target.unpaid += 1
allBlock.unpaid += 1
}
if (group === 'paid') {
target.paid += 1
allBlock.paid += 1
}
if (group === 'cancelled') {
target.cancelled += 1
allBlock.cancelled += 1
}
if (group === 'returned') {
target.returned += 1
allBlock.returned += 1
}
})
})


return {
today: todayBlock,
history: historyBlock,
all: allBlock
}
})


return {
stats
}
}