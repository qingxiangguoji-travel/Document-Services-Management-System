import { computed, type Ref } from 'vue'
import type { TableRow } from '../types/table'

export interface MergeOptions {
  /** 哪些列参与合并 */
  mergeColumns: Set<string>

  /** 分组字段（例如 customer_id） */
  groupKey: keyof TableRow
}

/**
 * 行合并规则（行业标准实现）
 * - 基于 groupKey 分组
 * - 不依赖 index
 * - 天然支持隐藏行 / 新增行 / 折叠 / 排序
 */
export function useMergeRules(
  rows: Ref<TableRow[]>,
  options: MergeOptions
) {
  const spanMap = computed(() => {
    const result: Record<string, number[]> = {}
    const { mergeColumns, groupKey } = options

    mergeColumns.forEach(col => {
      result[col] = []
    })

    if (!rows.value.length) return result

    let lastGroupValue: any = null
    let lastGroupStartIndex = 0

    rows.value.forEach((row, index) => {
      const groupValue = row[groupKey]

      const isSameGroup = groupValue === lastGroupValue

      if (!isSameGroup) {
        // 新分组开始
        mergeColumns.forEach(col => {
          result[col][index] = 1
        })
        lastGroupValue = groupValue
        lastGroupStartIndex = index
      } else {
        // 同一分组，累加 rowspan
        mergeColumns.forEach(col => {
          result[col][lastGroupStartIndex] += 1
          result[col][index] = 0
        })
      }
    })

    return result
  })

  /**
   * 给 el-table 用的标准 span-method
   */
  const spanMethod = ({
    rowIndex,
    column
  }: {
    rowIndex: number
    column: any
  }) => {
    const columnKey = column.columnKey || column.property

    if (!options.mergeColumns.has(columnKey)) {
      return { rowspan: 1, colspan: 1 }
    }

    const spans = spanMap.value[columnKey]
    if (!spans) return { rowspan: 1, colspan: 1 }

    const rowspan = spans[rowIndex] ?? 1

    if (rowspan === 0) {
      return { rowspan: 0, colspan: 0 }
    }

    return { rowspan, colspan: 1 }
  }

  return {
    spanMethod
  }
}
