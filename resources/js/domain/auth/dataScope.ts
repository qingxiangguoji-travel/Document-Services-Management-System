// 数据范围（企业标准三种）
export const DATA_SCOPE = {
  ALL: 'ALL',   // 全部数据
  OWN: 'OWN'    // 仅本人数据
} as const

export type DataScope = typeof DATA_SCOPE[keyof typeof DATA_SCOPE]
