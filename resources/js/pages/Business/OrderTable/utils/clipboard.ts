export function parseExcelData(text: string): string[][] {
  // 解析粘贴的Excel数据
  const rows: string[][] = []
  
  // 处理换行符和制表符
  const lines = text.split(/\r\n|\n|\r/)
  
  lines.forEach(line => {
    // 处理制表符分隔或逗号分隔的数据
    const columns = line.split(/\t|,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
      .map(col => col.trim().replace(/^"|"$/g, ''))
    
    if (columns.some(col => col !== '')) {
      rows.push(columns)
    }
  })
  
  return rows
}

export function validatePastedData(data: string[][], expectedColumns: number): boolean {
  if (data.length === 0) return false
  
  // 检查数据格式
  return data.every(row => row.length === expectedColumns)
}