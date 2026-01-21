export function generateOrderNo() {
  const date = new Date()
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const r = Math.floor(Math.random() * 9000 + 1000)
  return `ORD-${y}${m}${d}-${r}`
}
