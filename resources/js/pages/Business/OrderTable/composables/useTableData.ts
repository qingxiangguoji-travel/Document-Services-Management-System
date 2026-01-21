import { ref, computed, watch } from 'vue'
import type { Ref } from 'vue'
import type { TableRow, CustomerData } from '../types/table'

export function useTableData(
  originalData: Ref<any[]>,
  orderNo?: Ref<string>
) {
  /* =======================
     订单号
  ======================= */
  const orderNoRef = ref(orderNo?.value || '')

  watch(
    orderNo || (() => ''),
    val => {
      orderNoRef.value = val || ''
    },
    { immediate: true }
  )

  /* =======================
     隐藏行
  ======================= */
  const hiddenRows = ref<string[]>([])

  const initHiddenRows = () => {
    const saved = localStorage.getItem('orderTable_hiddenRows')
    if (saved) hiddenRows.value = JSON.parse(saved)
  }

  const hideRow = (rowId: string) => {
    if (!hiddenRows.value.includes(rowId)) {
      hiddenRows.value.push(rowId)
      localStorage.setItem(
        'orderTable_hiddenRows',
        JSON.stringify(hiddenRows.value)
      )
    }
  }

  const showAllRows = () => {
    hiddenRows.value = []
    localStorage.setItem('orderTable_hiddenRows', '[]')
  }

  /* =======================
     flat → nested
  ======================= */
  const convertToNestedStructure = (flatData: any[]): CustomerData[] => {
    if (!flatData || flatData.length === 0) return []

    const map = new Map<string, CustomerData>()

    flatData.forEach(row => {
      if (!map.has(row.customer_id)) {
        map.set(row.customer_id, {
          customer_id: row.customer_id,
          name: row.name,
          passport: row.passport,
          alias_no: row.alias_no,
          nationality: row.nationality,
          passport_expiry: row.passport_expiry,
          entry_date: row.entry_date,
          visa_expiry: row.visa_expiry,
          has_work_permit: row.has_work_permit,
          agent_contact: row.agent_contact,
          customer_fees: {
            actual_fee: row.actual_fee ?? null
          },
          businesses: []
        })
      }

      map.get(row.customer_id)!.businesses.push({
        id: row.id,
        business_seq: row.business_seq || 1,
        business_type: row.business_type || '',
        row_remark: row.row_remark || '',
        is_settled: row.is_settled || '否',
        business_fees: {
          fee_visa: row.fee_visa ?? null,
          fee_work: row.fee_work ?? null,
          fee_other: row.fee_other ?? null,
          fine_entry: row.fine_entry ?? null,
          fine_overdue: row.fine_overdue ?? null,
          fine_work: row.fine_work ?? null,
          special_fee: row.special_fee ?? null
        },
        upstream_name: row.upstream_name || '',
        upstream_time: row.upstream_time || '',
        upstream_fee: row.upstream_fee ?? null,
        upstream_is_settled: row.upstream_is_settled || '否',
        process_status: row.process_status || '',
        upstream_remark: row.upstream_remark || '',
        business_end_time: row.business_end_time || '',
        business_return_time: row.business_return_time || '',
        files: row.files || []
      })
    })

    return Array.from(map.values())
  }

  /* =======================
     nested → flat
  ======================= */
  const convertToFlatStructure = (nested: CustomerData[]) => {
    const flat: any[] = []

    nested.forEach(customer => {
      customer.businesses.forEach(biz => {
        flat.push({
          customer_id: customer.customer_id,
          name: customer.name,
          passport: customer.passport,
          alias_no: customer.alias_no,
          nationality: customer.nationality,
          passport_expiry: customer.passport_expiry,
          entry_date: customer.entry_date,
          visa_expiry: customer.visa_expiry,
          has_work_permit: customer.has_work_permit,
          agent_contact: customer.agent_contact,

          id: biz.id,
          business_seq: biz.business_seq,
          business_type: biz.business_type,
          row_remark: biz.row_remark,
          is_settled: biz.is_settled,

          fee_visa: biz.business_fees.fee_visa,
          fee_work: biz.business_fees.fee_work,
          fee_other: biz.business_fees.fee_other,
          fine_entry: biz.business_fees.fine_entry,
          fine_overdue: biz.business_fees.fine_overdue,
          fine_work: biz.business_fees.fine_work,
          special_fee: biz.business_fees.special_fee,
          actual_fee: customer.customer_fees.actual_fee,

          upstream_name: biz.upstream_name,
          upstream_time: biz.upstream_time,
          upstream_fee: biz.upstream_fee,
          upstream_is_settled: biz.upstream_is_settled,
          process_status: biz.process_status,
          upstream_remark: biz.upstream_remark,
          business_end_time: biz.business_end_time,
          business_return_time: biz.business_return_time,
          files: biz.files
        })
      })
    })

    return flat
  }

  /* =======================
     displayData（表格数据）
  ======================= */
  const displayData = computed<TableRow[]>(() => {
    const source = originalData.value
    if (!source || source.length === 0) return []

    const nested = convertToNestedStructure(source)
    const result: TableRow[] = []
    let customerSeq = 0

    nested.forEach(customer => {
      customerSeq++

      const visibleBiz = customer.businesses.filter(
        b => !hiddenRows.value.includes(b.id)
      )

      visibleBiz.forEach((biz, idx) => {
        const isFirst = idx === 0

        result.push({
          id: biz.id,
          customer_id: customer.customer_id,

          name: customer.name,
          passport: customer.passport,
          alias_no: customer.alias_no,
          nationality: customer.nationality,
          passport_expiry: customer.passport_expiry,
          entry_date: customer.entry_date,
          visa_expiry: customer.visa_expiry,
          has_work_permit: customer.has_work_permit,
          agent_contact: customer.agent_contact,

          business_seq: biz.business_seq,
          business_type: biz.business_type,
          row_remark: biz.row_remark,
          is_settled: biz.is_settled,

          fee_visa: biz.business_fees.fee_visa,
          fee_work: biz.business_fees.fee_work,
          fee_other: biz.business_fees.fee_other,
          fine_entry: biz.business_fees.fine_entry,
          fine_overdue: biz.business_fees.fine_overdue,
          fine_work: biz.business_fees.fine_work,
          special_fee: biz.business_fees.special_fee,
          actual_fee: customer.customer_fees.actual_fee,

          upstream_name: biz.upstream_name,
          upstream_time: biz.upstream_time,
          upstream_fee: biz.upstream_fee,
          upstream_is_settled: biz.upstream_is_settled,
          process_status: biz.process_status,
          upstream_remark: biz.upstream_remark,
          business_end_time: biz.business_end_time,
          business_return_time: biz.business_return_time,

          _customerId: customer.customer_id,
          _customerSeq: customerSeq,
          _businessIndex: idx,
          _isFirstRow: isFirst,
          _isMerged: !isFirst,
          _displayNo: isFirst
            ? `${orderNoRef.value}-${customerSeq
                .toString()
                .padStart(3, '0')}`
            : ''
        })
      })
    })

    return result
  })

  /* =======================
     合计
  ======================= */
  const totalAmount = computed(() =>
    displayData.value.reduce((sum, r) => {
      return (
        sum +
        (Number(r.fee_visa) || 0) +
        (Number(r.fee_work) || 0) +
        (Number(r.fee_other) || 0) +
        (Number(r.fine_entry) || 0) +
        (Number(r.fine_overdue) || 0) +
        (Number(r.fine_work) || 0) +
        (Number(r.special_fee) || 0)
      )
    }, 0)
  )

  /* =======================
     新增业务（关键）
  ======================= */
  const insertBusinessForCustomer = (customerId: string) => {
    const source = originalData.value
    if (!source || source.length === 0) return null

    const nested = convertToNestedStructure(source)
    const customer = nested.find(c => c.customer_id === customerId)
    if (!customer) return null

    customer.businesses.push({
      id: `biz_${Date.now()}`,
      business_seq: customer.businesses.length + 1,
      business_type: '',
      row_remark: '',
      is_settled: '否',
      business_fees: {
        fee_visa: null,
        fee_work: null,
        fee_other: null,
        fine_entry: null,
        fine_overdue: null,
        fine_work: null,
        special_fee: null
      },
      upstream_name: '',
      upstream_time: '',
      upstream_fee: null,
      upstream_is_settled: '否',
      process_status: '',
      upstream_remark: '',
      business_end_time: '',
      business_return_time: '',
      files: []
    })

    return convertToFlatStructure(nested)
  }

  return {
    displayData,
    totalAmount,
    hiddenRows,
    initHiddenRows,
    hideRow,
    showAllRows,
    convertToNestedStructure,
    convertToFlatStructure,
    insertBusinessForCustomer
  }
}
