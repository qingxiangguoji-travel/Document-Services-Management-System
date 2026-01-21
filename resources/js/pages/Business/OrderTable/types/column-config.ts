// types/column-config.ts
import { Component } from 'vue'
import { ElInput, ElSelect, ElDatePicker, ElInputNumber } from 'element-plus'

export type ColumnType = 'input' | 'select' | 'date' | 'number' | 'text' | 'custom' | 'action'

export interface ColumnOption {
  label: string
  value: string
}

export interface ColumnConfig {
  key: string
  label: string
  width: number
  fixed?: boolean | 'left' | 'right'
  type: ColumnType
  optionsKey?: string // 对应 props.options 中的键名
  placeholder?: string
  disabled?: (row: any) => boolean
  className?: string
  group?: string // 所属分组
  mergeable?: boolean // 是否可合并
  component?: Component // 自定义组件
  format?: (value: any, row: any) => any // 格式化函数
  handlers?: {
    onChange?: (row: any, value: any) => void
  }
}

export interface ColumnGroup {
  label: string
  className?: string
  children: ColumnConfig[]
}