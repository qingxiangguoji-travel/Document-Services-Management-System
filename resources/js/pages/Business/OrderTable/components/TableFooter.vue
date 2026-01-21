<template>
  <div class="fixed-summary" v-if="displayData.length > 0">
    <div class="summary-row">
      <template v-for="col in visibleColumns" :key="col.key">
        <div 
          class="summary-cell"
          :class="{ 'total-column': col.key === 'total' }"
          :style="{ width: col.width + 'px' }"
        >
          <template v-if="col.key === 'total'">
            <span class="total-amount">$ {{ totalAmount.toLocaleString() }}</span>
          </template>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, PropType } from 'vue'
import type { ColumnDefinition, TableRow } from '../types/table'

interface Props {
  visibleColumns: ColumnDefinition[]
  displayData: TableRow[]
  totalAmount: number
}

const props = defineProps<Props>()
</script>

<style scoped>
.fixed-summary {
  flex-shrink: 0;
  background: #f8fafc;
  border-top: 2px solid #dc2626;
  border-bottom: 1px solid #e5e7eb;
  position: relative;
  z-index: 10;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}

.summary-row {
  display: flex;
  height: 40px;
}

.summary-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid #e5e7eb;
  box-sizing: border-box;
  font-size: 12px;
  flex-shrink: 0;
}

.total-column {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
}

.total-amount {
  color: #dc2626;
  font-weight: 700;
  font-size: 14px;
  font-family: monospace;
}
</style>