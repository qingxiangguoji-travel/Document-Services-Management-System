export const mergeRules = {
  // 哪些字段需要合并（基于字段名）
  mergeFields: [
    'seq', 'agent_contact', 'name', 'passport', 'alias_no', 
    'nationality', 'passport_expiry', 'entry_date', 'visa_expiry', 'has_work_permit'
  ],
  
  // 计算合并单元格的方法
  calculateSpanMethod: (spanArr: number[], rowIndex: number, columnKey: string) => {
    if (rowIndex >= spanArr.length) {
      return { rowspan: 1, colspan: 1 }
    }
    
    const rowspan = spanArr[rowIndex]
    
    if (rowspan > 1) {
      return {
        rowspan: rowspan,
        colspan: 1
      }
    } else if (rowspan === 0) {
      return {
        rowspan: 0,
        colspan: 0
      }
    }
    
    return { rowspan: 1, colspan: 1 }
  }
}