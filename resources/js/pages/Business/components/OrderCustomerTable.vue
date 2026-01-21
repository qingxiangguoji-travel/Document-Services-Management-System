<template>
  <div class="table-container">
    <el-table 
      ref="tableRef"
      :data="displayData" 
      row-key="id"
      border 
      :height="tableHeight"
      style="width: 100%" 
      size="small"
      :resizable="true"
      @column-resize="handleColumnResize"
      header-cell-class-name="custom-header-cell"
      cell-class-name="custom-content-cell"
      :row-class-name="tableRowClassName"
      @row-contextmenu="handleRowContextMenu"
      :span-method="objectSpanMethod"
      @cell-mouseenter="handleCellMouseEnter"
      @cell-mouseleave="handleCellMouseLeave"
    >
      <!-- 序号列 -->
      <el-table-column 
        v-if="isColumnVisible('seq')"
        label="序号" 
        width="115" 
        align="center" 
        fixed
        column-key="seq"
      >
        <template #default="scope">
          <span class="row-no-display">{{ scope.row._displayNo || '' }}</span>
        </template>
        <template #header="{ column }">
          <div class="header-cell" @contextmenu.prevent="showColumnMenu(column, $event)">
            {{ column.label }}
          </div>
        </template>
      </el-table-column>

      <!-- 代理联系人 -->
      <el-table-column 
        v-if="isColumnVisible('agent_contact')"
        prop="agent_contact" 
        label="代理联系人" 
        width="95" 
        align="center" 
        fixed
        column-key="agent_contact"
      >
        <template #header="{ column }">
          <div class="header-cell" @contextmenu.prevent="showColumnMenu(column, $event)">
            {{ column.label }}
          </div>
        </template>
      </el-table-column>
      
      <!-- 护照名字 -->
      <el-table-column 
        v-if="isColumnVisible('name')"
        label="护照名字" 
        width="100" 
        align="center" 
        fixed
        column-key="name"
      >
        <template #default="scope">
          <el-input 
            :model-value="scope.row.name"
            size="small" 
            placeholder="护照名字" 
            class="cell-input" 
            :disabled="scope.row._isMerged"
            @update:model-value="value => handleCustomerInfoChange(scope.row, 'name', value)"
          />
        </template>
        <template #header="{ column }">
          <div class="header-cell" @contextmenu.prevent="showColumnMenu(column, $event)">
            {{ column.label }}
          </div>
        </template>
      </el-table-column>
      
      <!-- 护照号 -->
      <el-table-column 
        v-if="isColumnVisible('passport')"
        label="护照号" 
        width="100" 
        align="center" 
        fixed
        column-key="passport"
      >
        <template #default="scope">
          <el-input 
            :model-value="scope.row.passport"
            size="small" 
            placeholder="护照号" 
            class="cell-input" 
            :disabled="scope.row._isMerged"
            @update:model-value="value => handleCustomerInfoChange(scope.row, 'passport', value)"
          />
        </template>
        <template #header="{ column }">
          <div class="header-cell" @contextmenu.prevent="showColumnMenu(column, $event)">
            {{ column.label }}
          </div>
        </template>
      </el-table-column>
      
      <!-- 化名/员工编号 -->
      <el-table-column 
        v-if="isColumnVisible('alias_no')"
        label="化名/员工编号" 
        width="90" 
        align="center" 
        fixed 
        class-name="sticky-last-marker"
        column-key="alias_no"
      >
        <template #default="scope">
          <el-input 
            :model-value="scope.row.alias_no"
            size="small" 
            placeholder="化名/员工编号" 
            class="cell-input" 
            :disabled="scope.row._isMerged"
            @update:model-value="value => handleCustomerInfoChange(scope.row, 'alias_no', value)"
          />
        </template>
        <template #header="{ column }">
          <div class="header-cell" @contextmenu.prevent="showColumnMenu(column, $event)">
            {{ column.label }}
          </div>
        </template>
      </el-table-column>

      <template v-if="module === 'all' || module === 'confirm'">
        <!-- 护照信息分组 -->
        <el-table-column label="护照信息" align="center" class-name="header-group-passport">
          <el-table-column 
            v-if="isColumnVisible('nationality')"
            label="国籍" 
            width="85" 
            align="center" 
            column-key="nationality"
          >
            <template #default="scope">
              <el-select 
                :model-value="scope.row.nationality"
                placeholder="选择国籍" 
                size="small" 
                class="cell-select" 
                :disabled="scope.row._isMerged"
                @update:model-value="value => handleCustomerInfoChange(scope.row, 'nationality', value)"
              >
                <el-option v-for="item in options.nationalities" :key="item" :label="item" :value="item" />
              </el-select>
            </template>
            <template #header="{ column }">
              <div class="header-cell" @contextmenu.prevent="showColumnMenu(column, $event)">
                {{ column.label }}
              </div>
            </template>
          </el-table-column>
          
          <el-table-column 
            v-if="isColumnVisible('passport_expiry')"
            label="护照到期日" 
            width="100" 
            align="center" 
            column-key="passport_expiry"
          >
            <template #default="scope">
              <el-date-picker 
                :model-value="scope.row.passport_expiry"
                type="date" 
                value-format="YYYY-MM-DD" 
                size="small" 
                placeholder="护照到期日"
                class="cell-date-picker"
                :disabled="scope.row._isMerged"
                :shortcuts="dateShortcuts"
                @update:model-value="value => handleCustomerInfoChange(scope.row, 'passport_expiry', value)"
              />
            </template>
            <template #header="{ column }">
              <div class="header-cell" @contextmenu.prevent="showColumnMenu(column, $event)">
                {{ column.label }}
              </div>
            </template>
          </el-table-column>
          
          <el-table-column 
            v-if="isColumnVisible('entry_date')"
            label="入境时间" 
            width="100" 
            align="center" 
            column-key="entry_date"
          >
            <template #default="scope">
              <el-date-picker 
                :model-value="scope.row.entry_date"
                type="date" 
                value-format="YYYY-MM-DD" 
                size="small" 
                placeholder="入境时间"
                class="cell-date-picker"
                :disabled="scope.row._isMerged"
                :shortcuts="dateShortcuts"
                @update:model-value="value => handleCustomerInfoChange(scope.row, 'entry_date', value)"
              />
            </template>
            <template #header="{ column }">
              <div class="header-cell" @contextmenu.prevent="showColumnMenu(column, $event)">
                {{ column.label }}
              </div>
            </template>
          </el-table-column>
          
          <el-table-column 
            v-if="isColumnVisible('visa_expiry')"
            label="签证到期时间" 
            width="100" 
            align="center" 
            column-key="visa_expiry"
          >
            <template #default="scope">
              <el-date-picker 
                :model-value="scope.row.visa_expiry"
                type="date" 
                value-format="YYYY-MM-DD" 
                size="small" 
                placeholder="签证到期时间"
                class="cell-date-picker"
                :disabled="scope.row._isMerged"
                :shortcuts="dateShortcuts"
                @update:model-value="value => handleCustomerInfoChange(scope.row, 'visa_expiry', value)"
              />
            </template>
            <template #header="{ column }">
              <div class="header-cell" @contextmenu.prevent="showColumnMenu(column, $event)">
                {{ column.label }}
              </div>
            </template>
          </el-table-column>
          
          <el-table-column 
            v-if="isColumnVisible('has_work_permit')"
            label="有无劳工证" 
            width="85" 
            align="center" 
            column-key="has_work_permit"
          >
            <template #default="scope">
              <el-select 
                :model-value="scope.row.has_work_permit"
                size="small" 
                class="cell-select" 
                :disabled="scope.row._isMerged"
                @update:model-value="value => handleCustomerInfoChange(scope.row, 'has_work_permit', value)"
              >
                <el-option label="有" value="有" />
                <el-option label="无" value="无" />
              </el-select>
            </template>
            <template #header="{ column }">
              <div class="header-cell" @contextmenu.prevent="showColumnMenu(column, $event)">
                {{ column.label }}
              </div>
            </template>
          </el-table-column>
        </el-table-column>

        <!-- 业务分类 -->
        <el-table-column label="业务分类" align="center" class-name="header-group-business">
          <el-table-column 
            v-if="isColumnVisible('business_type')"
            label="业务类型" 
            width="110" 
            align="center" 
            column-key="business_type"
          >
            <template #default="scope">
              <el-select 
                :model-value="scope.row.business_type"
                placeholder="选择业务类型"
                size="small"
                class="cell-select"
                @update:model-value="value => handleCustomerInfoChange(scope.row, 'business_type', value)"
              >
                <el-option v-for="item in options.businessTypes" :key="item" :label="item" :value="item" />
              </el-select>
            </template>
            <template #header="{ column }">
              <div class="header-cell" @contextmenu.prevent="showColumnMenu(column, $event)">
                {{ column.label }}
              </div>
            </template>
          </el-table-column>
        </el-table-column>

        <!-- 费用与结算 -->
        <el-table-column label="费用与结算" align="center" class-name="header-group-fee">
          <el-table-column 
            v-if="isColumnVisible('fee_visa')"
            label="续签办理费" 
            width="90" 
            align="center" 
            column-key="fee_visa"
          >
            <template #default="scope">
              <el-input-number 
                :model-value="scope.row.fee_visa || null"
                :controls="false" 
                size="small"
                class="cell-number-input"
                placeholder=""
                :disabled="!isFeeFieldEnabled(scope.row, 'fee_visa')"
                :class="{ 'fee-disabled': !isFeeFieldEnabled(scope.row, 'fee_visa') }"
                @update:model-value="value => handleFeeChange(scope.row, 'fee_visa', value || 0)"
              />
            </template>
            <template #header="{ column }">
              <div class="header-cell" @contextmenu.prevent="showColumnMenu(column, $event)">
                {{ column.label }}
              </div>
            </template>
          </el-table-column>
          
          <el-table-column 
            v-if="isColumnVisible('fee_work')"
            label="劳工证办理费" 
            width="95" 
            align="center" 
            column-key="fee_work"
          >
            <template #default="scope">
              <el-input-number 
                :model-value="scope.row.fee_work || null"
                :controls="false" 
                size="small"
                class="cell-number-input"
                placeholder=""
                :disabled="!isFeeFieldEnabled(scope.row, 'fee_work')"
                :class="{ 'fee-disabled': !isFeeFieldEnabled(scope.row, 'fee_work') }"
                @update:model-value="value => handleFeeChange(scope.row, 'fee_work', value || 0)"
              />
            </template>
            <template #header="{ column }">
              <div class="header-cell" @contextmenu.prevent="showColumnMenu(column, $event)">
                {{ column.label }}
              </div>
            </template>
          </el-table-column>
          
          <el-table-column 
            v-if="isColumnVisible('fee_other')"
            label="其他费用" 
            width="85" 
            align="center" 
            column-key="fee_other"
          >
            <template #default="scope">
              <el-input-number 
                :model-value="scope.row.fee_other || null"
                :controls="false" 
                size="small"
                class="cell-number-input"
                placeholder=""
                :disabled="!isFeeFieldEnabled(scope.row, 'fee_other')"
                :class="{ 'fee-disabled': !isFeeFieldEnabled(scope.row, 'fee_other') }"
                @update:model-value="value => handleFeeChange(scope.row, 'fee_other', value || 0)"
              />
            </template>
            <template #header="{ column }">
              <div class="header-cell" @contextmenu.prevent="showColumnMenu(column, $event)">
                {{ column.label }}
              </div>
            </template>
          </el-table-column>
          
          <el-table-column 
            v-if="isColumnVisible('fine_entry')"
            label="入境罚款" 
            width="80" 
            align="center" 
            column-key="fine_entry"
          >
            <template #default="scope">
              <el-input-number 
                :model-value="scope.row.fine_entry || null"
                :controls="false" 
                size="small"
                class="cell-number-input"
                placeholder=""
                @update:model-value="value => handleFeeChange(scope.row, 'fine_entry', value || 0)"
              />
            </template>
            <template #header="{ column }">
              <div class="header-cell" @contextmenu.prevent="showColumnMenu(column, $event)">
                {{ column.label }}
              </div>
            </template>
          </el-table-column>
          
          <el-table-column 
            v-if="isColumnVisible('fine_overdue')"
            label="逾期罚款" 
            width="80" 
            align="center" 
            column-key="fine_overdue"
          >
            <template #default="scope">
              <el-input-number 
                :model-value="scope.row.fine_overdue || null"
                :controls="false" 
                size="small"
                class="cell-number-input"
                placeholder=""
                @update:model-value="value => handleFeeChange(scope.row, 'fine_overdue', value || 0)"
              />
            </template>
            <template #header="{ column }">
              <div class="header-cell" @contextmenu.prevent="showColumnMenu(column, $event)">
                {{ column.label }}
              </div>
            </template>
          </el-table-column>
          
          <el-table-column 
            v-if="isColumnVisible('fine_work')"
            label="劳工证罚款" 
            width="90" 
            align="center" 
            column-key="fine_work"
          >
            <template #default="scope">
              <el-input-number 
                :model-value="scope.row.fine_work || null"
                :controls="false" 
                size="small"
                class="cell-number-input"
                placeholder=""
                @update:model-value="value => handleFeeChange(scope.row, 'fine_work', value || 0)"
              />
            </template>
            <template #header="{ column }">
              <div class="header-cell" @contextmenu.prevent="showColumnMenu(column, $event)">
                {{ column.label }}
              </div>
            </template>
          </el-table-column>
          
          <el-table-column 
            v-if="isColumnVisible('special_fee')"
            label="特殊处理费用" 
            width="95" 
            align="center" 
            column-key="special_fee"
          >
            <template #default="scope">
              <el-input-number 
                :model-value="scope.row.special_fee || null"
                :controls="false" 
                size="small"
                class="cell-number-input"
                placeholder=""
                @update:model-value="value => handleFeeChange(scope.row, 'special_fee', value || 0)"
              />
            </template>
            <template #header="{ column }">
              <div class="header-cell" @contextmenu.prevent="showColumnMenu(column, $event)">
                {{ column.label }}
              </div>
            </template>
          </el-table-column>
          
          <el-table-column 
            v-if="isColumnVisible('total')"
            label="应收合计" 
            width="90" 
            align="center" 
            column-key="total"
          >
            <template #default="scope">
              <span class="price-text">$ {{ calcTotal(scope.row) }}</span>
            </template>
            <template #header="{ column }">
              <div class="header-cell" @contextmenu.prevent="showColumnMenu(column, $event)">
                {{ column.label }}
              </div>
            </template>
          </el-table-column>
          
          <el-table-column 
            v-if="isColumnVisible('actual_fee')"
            label="实收金额" 
            width="90" 
            align="center" 
            column-key="actual_fee"
          >
            <template #default="scope">
              <el-input-number 
                :model-value="scope.row.actual_fee || null"
                :controls="false" 
                size="small"
                :precision="2"
                class="cell-number-input"
                placeholder=""
                @update:model-value="value => handleFeeChange(scope.row, 'actual_fee', value || 0)"
              />
            </template>
            <template #header="{ column }">
              <div class="header-cell" @contextmenu.prevent="showColumnMenu(column, $event)">
                {{ column.label }}
              </div>
            </template>
          </el-table-column>
          
          <el-table-column 
            v-if="isColumnVisible('is_settled')"
            label="是否结算" 
            width="85" 
            align="center" 
            column-key="is_settled"
          >
            <template #default="scope">
              <el-select 
                :model-value="scope.row.is_settled"
                size="small" 
                class="cell-select"
                @update:model-value="value => handleCustomerInfoChange(scope.row, 'is_settled', value)"
              >
                <el-option label="是" value="是" />
                <el-option label="否" value="否" />
              </el-select>
            </template>
            <template #header="{ column }">
              <div class="header-cell" @contextmenu.prevent="showColumnMenu(column, $event)">
                {{ column.label }}
              </div>
            </template>
          </el-table-column>
          
          <el-table-column 
            v-if="isColumnVisible('row_remark')"
            label="备注" 
            width="120" 
            align="center" 
            column-key="row_remark"
          >
            <template #default="scope">
              <el-input 
                :model-value="scope.row.row_remark"
                size="small" 
                placeholder="备注" 
                class="cell-input"
                @update:model-value="value => handleCustomerInfoChange(scope.row, 'row_remark', value)"
              />
            </template>
            <template #header="{ column }">
              <div class="header-cell" @contextmenu.prevent="showColumnMenu(column, $event)">
                {{ column.label }}
              </div>
            </template>
          </el-table-column>
        </el-table-column>
      </template>

      <template v-if="module === 'all' || module === 'process'">
        <!-- 上游端及办理进度 -->
        <el-table-column label="上游端及办理进度" align="center" class-name="header-group-upstream">
          <el-table-column 
            v-if="isColumnVisible('upstream_name')"
            label="上游端" 
            width="110" 
            align="center" 
            column-key="upstream_name"
          >
            <template #default="scope">
              <el-select 
                :model-value="scope.row.upstream_name"
                placeholder="选择上游端" 
                size="small" 
                class="cell-select"
                @update:model-value="value => handleCustomerInfoChange(scope.row, 'upstream_name', value)"
              >
                <el-option v-for="item in options.departments" :key="item.id" :label="item.name" :value="item.name" />
              </el-select>
            </template>
            <template #header="{ column }">
              <div class="header-cell" @contextmenu.prevent="showColumnMenu(column, $event)">
                {{ column.label }}
              </div>
            </template>
          </el-table-column>
          
          <el-table-column 
            v-if="isColumnVisible('upstream_time')"
            label="办理业务时间" 
            width="100" 
            align="center" 
            column-key="upstream_time"
          >
            <template #default="scope">
              <el-date-picker 
                :model-value="scope.row.upstream_time"
                type="date" 
                value-format="YYYY-MM-DD" 
                size="small" 
                placeholder="办理业务时间"
                class="cell-date-picker"
                :shortcuts="dateShortcuts"
                @update:model-value="value => handleCustomerInfoChange(scope.row, 'upstream_time', value)"
              />
            </template>
            <template #header="{ column }">
              <div class="header-cell" @contextmenu.prevent="showColumnMenu(column, $event)">
                {{ column.label }}
              </div>
            </template>
          </el-table-column>
          
          <el-table-column 
            v-if="isColumnVisible('upstream_fee')"
            label="上游端结算费用" 
            width="110" 
            align="center" 
            column-key="upstream_fee"
          >
            <template #default="scope">
              <el-input-number 
                :model-value="scope.row.upstream_fee || null"
                :controls="false" 
                size="small"
                class="cell-number-input"
                placeholder=""
                @update:model-value="value => handleCustomerInfoChange(scope.row, 'upstream_fee', value || 0)"
              />
            </template>
            <template #header="{ column }">
              <div class="header-cell" @contextmenu.prevent="showColumnMenu(column, $event)">
                {{ column.label }}
              </div>
            </template>
          </el-table-column>
          
          <el-table-column 
            v-if="isColumnVisible('upstream_is_settled')"
            label="是否结算" 
            width="85" 
            align="center" 
            column-key="upstream_is_settled"
          >
            <template #default="scope">
              <el-select 
                :model-value="scope.row.upstream_is_settled"
                size="small" 
                class="cell-select"
                @update:model-value="value => handleCustomerInfoChange(scope.row, 'upstream_is_settled', value)"
              >
                <el-option label="是" value="是" />
                <el-option label="否" value="否" />
              </el-select>
            </template>
            <template #header="{ column }">
              <div class="header-cell" @contextmenu.prevent="showColumnMenu(column, $event)">
                {{ column.label }}
              </div>
            </template>
          </el-table-column>
          
          <el-table-column 
            v-if="isColumnVisible('process_status')"
            label="办理状态" 
            width="110" 
            align="center" 
            column-key="process_status"
          >
            <template #default="scope">
              <el-select 
                :model-value="scope.row.process_status"
                size="small" 
                class="cell-select"
                @update:model-value="value => handleCustomerInfoChange(scope.row, 'process_status', value)"
              >
                <el-option v-for="item in options.orderStatuses" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </template>
            <template #header="{ column }">
              <div class="header-cell" @contextmenu.prevent="showColumnMenu(column, $event)">
                {{ column.label }}
              </div>
            </template>
          </el-table-column>
          
          <el-table-column 
            v-if="isColumnVisible('upstream_remark')"
            label="备注" 
            width="120" 
            align="center" 
            column-key="upstream_remark"
          >
            <template #default="scope">
              <el-input 
                :model-value="scope.row.upstream_remark"
                size="small" 
                placeholder="上游备注" 
                class="cell-input"
                @update:model-value="value => handleCustomerInfoChange(scope.row, 'upstream_remark', value)"
              />
            </template>
            <template #header="{ column }">
              <div class="header-cell" @contextmenu.prevent="showColumnMenu(column, $event)">
                {{ column.label }}
              </div>
            </template>
          </el-table-column>
          
          <el-table-column 
            v-if="isColumnVisible('business_end_time')"
            label="业务结束时间" 
            width="100" 
            align="center" 
            column-key="business_end_time"
          >
            <template #default="scope">
              <el-date-picker 
                :model-value="scope.row.business_end_time"
                type="date" 
                value-format="YYYY-MM-DD" 
                size="small" 
                placeholder="业务结束时间"
                class="cell-date-picker"
                :shortcuts="dateShortcuts"
                @update:model-value="value => handleCustomerInfoChange(scope.row, 'business_end_time', value)"
              />
            </template>
            <template #header="{ column }">
              <div class="header-cell" @contextmenu.prevent="showColumnMenu(column, $event)">
                {{ column.label }}
              </div>
            </template>
          </el-table-column>
          
          <el-table-column 
            v-if="isColumnVisible('business_return_time')"
            label="业务返回时间" 
            width="100" 
            align="center" 
            column-key="business_return_time"
          >
            <template #default="scope">
              <el-date-picker 
                :model-value="scope.row.business_return_time"
                type="date" 
                value-format="YYYY-MM-DD" 
                size="small" 
                placeholder="业务返回时间"
                class="cell-date-picker"
                :shortcuts="dateShortcuts"
                @update:model-value="value => handleCustomerInfoChange(scope.row, 'business_return_time', value)"
              />
            </template>
            <template #header="{ column }">
              <div class="header-cell" @contextmenu.prevent="showColumnMenu(column, $event)">
                {{ column.label }}
              </div>
            </template>
          </el-table-column>
        </el-table-column>
      </template>

      <!-- 照片/删除列 -->
      <el-table-column 
        v-if="isColumnVisible('action')"
        label="照片/删除" 
        width="90" 
        align="center" 
        fixed="right"
        column-key="action"
      >
        <template #default="scope">
          <div class="action-buttons">
            <el-button 
              :icon="Picture" 
              circle 
              size="small" 
              @click="handleOpenFiles(scope.row)" 
              title="管理文件"
            />
            <el-button 
              :icon="Delete" 
              circle 
              size="small" 
              type="danger" 
              @click="handleRemoveRow(scope.row, scope.$index)" 
              title="删除行"
            />
          </div>
        </template>
        <template #header="{ column }">
          <div class="header-cell" @contextmenu.prevent="showColumnMenu(column, $event)">
            {{ column.label }}
          </div>
        </template>
      </el-table-column>
    </el-table>
    
    <!-- 固定合计行 - 动态生成，与表格列对齐 -->
    <div class="fixed-summary" v-if="displayData.length > 0">
      <div class="summary-row">
        <template v-for="col in getVisibleColumns" :key="col.key">
          <div 
            class="summary-cell"
            :class="{ 'total-column': col.key === 'total' }"
            :style="{ width: col.width + 'px' }"
          >
            <template v-if="col.key === 'total'">
              <span class="total-amount">$ {{ pageTotalAmount.toLocaleString() }}</span>
            </template>
          </div>
        </template>
      </div>
    </div>
    
    <!-- 右键菜单 -->
    <el-dropdown
      ref="contextMenuRef"
      trigger="click"
      v-model:visible="contextMenuVisible"
      :style="{ left: contextMenuPosition.x + 'px', top: contextMenuPosition.y + 'px', position: 'fixed' }"
      @click-outside="closeContextMenu"
    >
      <el-dropdown-menu>
        <el-dropdown-item @click="handleAddBusinessToCurrent">
          <el-icon><Plus /></el-icon>
          在此客户添加业务
        </el-dropdown-item>
        <el-dropdown-item divided @click="handleHideRow">
          <el-icon><Hide /></el-icon>
          隐藏此行
        </el-dropdown-item>
        <el-dropdown-item @click="handlePasteRows">
          <el-icon><DocumentCopy /></el-icon>
          粘贴Excel数据
        </el-dropdown-item>
      </el-dropdown-menu>
    </el-dropdown>
    
    <!-- 列右键菜单 -->
    <el-dropdown
      ref="columnMenuRef"
      trigger="click"
      v-model:visible="columnMenuVisible"
      :style="{ left: columnMenuPosition.x + 'px', top: columnMenuPosition.y + 'px', position: 'fixed' }"
      @click-outside="closeColumnMenu"
    >
      <el-dropdown-menu>
        <el-dropdown-item @click="hideCurrentColumn">
          <el-icon><Hide /></el-icon>
          隐藏此列
        </el-dropdown-item>
        <el-dropdown-item @click="showAllColumns">
          <el-icon><View /></el-icon>
          显示所有列
        </el-dropdown-item>
        <el-dropdown-item @click="showHiddenRows">
          <el-icon><View /></el-icon>
          显示隐藏的行
        </el-dropdown-item>
      </el-dropdown-menu>
    </el-dropdown>
  </div>
</template>

<script setup>
import { reactive, onMounted, ref, nextTick, watch, onUnmounted, computed } from 'vue'
import { Picture, Delete, Plus, Hide, View, DocumentCopy } from '@element-plus/icons-vue' // 添加 DocumentCopy 图标
import { db } from '@/utils/storage'
import { ElMessage } from 'element-plus'

const props = defineProps({ 
  data: Array, 
  orderNo: String, 
  module: String 
})

const emit = defineEmits(['remove', 'open-files', 'update:data', 'add-business', 'paste-data']) // 添加 paste-data 事件

const options = reactive({ 
  nationalities: [], 
  businessTypes: [], 
  orderStatuses: [], 
  departments: [] 
})

const tableHeight = ref('100%')
const spanArr = ref([])
const tableRef = ref(null)

// 右键菜单相关状态
const contextMenuVisible = ref(false)
const contextMenuPosition = ref({ x: 0, y: 0 })
const contextMenuRow = ref(null)
const contextMenuRef = ref(null)

// 列管理相关状态
const columnMenuVisible = ref(false)
const columnMenuPosition = ref({ x: 0, y: 0 })
const currentColumn = ref(null)
const columnMenuRef = ref(null)
const columnVisibility = reactive({})

// 隐藏行状态
const hiddenRows = ref([])

// 列宽度映射
const columnWidthMap = {
  seq: 115,
  agent_contact: 95,
  name: 100,
  passport: 100,
  alias_no: 90,
  nationality: 85,
  passport_expiry: 100,
  entry_date: 100,
  visa_expiry: 100,
  has_work_permit: 85,
  business_type: 110,
  fee_visa: 90,
  fee_work: 95,
  fee_other: 85,
  fine_entry: 80,
  fine_overdue: 80,
  fine_work: 90,
  special_fee: 95,
  total: 90,
  actual_fee: 90,
  is_settled: 85,
  row_remark: 120,
  upstream_name: 110,
  upstream_time: 100,
  upstream_fee: 110,
  upstream_is_settled: 85,
  process_status: 110,
  upstream_remark: 120,
  business_end_time: 100,
  business_return_time: 100,
  action: 90
}

// 日期选择器快捷选项
const dateShortcuts = [
  { text: '今天', value: new Date() },
  { text: '昨天', value: () => { 
    const d = new Date()
    d.setTime(d.getTime() - 3600 * 1000 * 24)
    return d 
  }},
  { text: '最近一周', value: () => { 
    const d = new Date()
    d.setTime(d.getTime() - 3600 * 1000 * 24 * 7)
    return d 
  }}
]

// ==================== 列管理功能 ====================

/**
 * 初始化列配置
 */
const initColumnConfig = () => {
  // 从localStorage读取列可见性
  const savedVisibility = localStorage.getItem('orderTable_columnVisibility')
  if (savedVisibility) {
    Object.assign(columnVisibility, JSON.parse(savedVisibility))
  } else {
    // 设置所有列默认可见
    Object.keys(columnWidthMap).forEach(key => {
      columnVisibility[key] = true
    })
  }
  
  // 初始化隐藏行
  const savedHiddenRows = localStorage.getItem('orderTable_hiddenRows')
  if (savedHiddenRows) {
    hiddenRows.value = JSON.parse(savedHiddenRows)
  }
}

/**
 * 检查列是否可见
 */
const isColumnVisible = (columnKey) => {
  return columnVisibility[columnKey] !== false
}

/**
 * 表头右键菜单
 */
const showColumnMenu = (column, event) => {
  event.preventDefault()
  currentColumn.value = column
  columnMenuPosition.value = { x: event.clientX, y: event.clientY }
  columnMenuVisible.value = true
}

/**
 * 隐藏当前列
 */
const hideCurrentColumn = () => {
  if (currentColumn.value && currentColumn.value.columnKey) {
    const columnKey = currentColumn.value.columnKey
    columnVisibility[columnKey] = false
    localStorage.setItem('orderTable_columnVisibility', JSON.stringify(columnVisibility))
    columnMenuVisible.value = false
    ElMessage.success(`已隐藏列: ${currentColumn.value.label}`)
  }
}

/**
 * 显示所有列
 */
const showAllColumns = () => {
  Object.keys(columnWidthMap).forEach(key => {
    columnVisibility[key] = true
  })
  localStorage.setItem('orderTable_columnVisibility', JSON.stringify(columnVisibility))
  columnMenuVisible.value = false
  ElMessage.success('已显示所有列')
}

/**
 * 显示隐藏的行
 */
const showHiddenRows = () => {
  hiddenRows.value = []
  localStorage.setItem('orderTable_hiddenRows', JSON.stringify(hiddenRows.value))
  ElMessage.success('已显示所有隐藏的行')
}

const closeColumnMenu = () => {
  columnMenuVisible.value = false
}

// ==================== 右键菜单功能 ====================

const handleRowContextMenu = (row, column, event) => {
  event.preventDefault()
  contextMenuRow.value = row
  contextMenuPosition.value = {
    x: event.clientX,
    y: event.clientY
  }
  contextMenuVisible.value = true
}

const handleAddBusinessToCurrent = () => {
  if (contextMenuRow.value) {
    emit('add-business', contextMenuRow.value.customer_id)
    contextMenuVisible.value = false
    ElMessage.success('将在当前客户添加业务')
  }
}

const handleHideRow = () => {
  if (contextMenuRow.value) {
    hiddenRows.value.push(contextMenuRow.value.id)
    localStorage.setItem('orderTable_hiddenRows', JSON.stringify(hiddenRows.value))
    contextMenuVisible.value = false
    ElMessage.success('已隐藏此行（可在列头右键菜单中恢复）')
  }
}

// 移除 handleHideColumn 方法，因为现在使用列头右键菜单

const closeContextMenu = () => {
  contextMenuVisible.value = false
}

// ==================== 新增：粘贴Excel数据功能 ====================

const handlePasteRows = () => {
  contextMenuVisible.value = false
  
  // 创建隐藏的输入框用于捕获粘贴事件
  const textarea = document.createElement('textarea')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.focus()
  
  setTimeout(() => {
    navigator.clipboard.readText().then(text => {
      if (text.trim()) {
        emit('paste-data', text) // 传递给父组件处理
      }
      document.body.removeChild(textarea)
    }).catch(() => {
      ElMessage.warning('无法读取剪贴板内容')
      document.body.removeChild(textarea)
    })
  }, 100)
}

// ==================== 计算表格合计 ====================

const pageTotalAmount = computed(() => {
  if (!displayData.value || displayData.value.length === 0) return 0
  
  return displayData.value.reduce((sum, row) => {
    return sum + 
      (Number(row.fee_visa) || 0) + 
      (Number(row.fee_work) || 0) + 
      (Number(row.fee_other) || 0) + 
      (Number(row.fine_entry) || 0) + 
      (Number(row.fine_overdue) || 0) + 
      (Number(row.fine_work) || 0) + 
      (Number(row.special_fee) || 0)
  }, 0)
})

// ==================== 动态计算合计行列 ====================

// 获取当前模块可见的列
const getVisibleColumns = computed(() => {
  const allColumns = [
    { key: 'seq', width: 115 },
    { key: 'agent_contact', width: 95 },
    { key: 'name', width: 100 },
    { key: 'passport', width: 100 },
    { key: 'alias_no', width: 90 },
    { key: 'nationality', width: 85 },
    { key: 'passport_expiry', width: 100 },
    { key: 'entry_date', width: 100 },
    { key: 'visa_expiry', width: 100 },
    { key: 'has_work_permit', width: 85 },
    { key: 'business_type', width: 110 },
    { key: 'fee_visa', width: 90 },
    { key: 'fee_work', width: 95 },
    { key: 'fee_other', width: 85 },
    { key: 'fine_entry', width: 80 },
    { key: 'fine_overdue', width: 80 },
    { key: 'fine_work', width: 90 },
    { key: 'special_fee', width: 95 },
    { key: 'total', width: 90 },
    { key: 'actual_fee', width: 90 },
    { key: 'is_settled', width: 85 },
    { key: 'row_remark', width: 120 },
    { key: 'upstream_name', width: 110 },
    { key: 'upstream_time', width: 100 },
    { key: 'upstream_fee', width: 110 },
    { key: 'upstream_is_settled', width: 85 },
    { key: 'process_status', width: 110 },
    { key: 'upstream_remark', width: 120 },
    { key: 'business_end_time', width: 100 },
    { key: 'business_return_time', width: 100 },
    { key: 'action', width: 90 }
  ]
  
  // 根据模块和可见性过滤
  return allColumns.filter(col => {
    // 根据module过滤
    if (props.module === 'confirm') {
      const confirmColumns = [
        'seq', 'agent_contact', 'name', 'passport', 'alias_no',
        'nationality', 'passport_expiry', 'entry_date', 'visa_expiry', 'has_work_permit',
        'business_type', 'fee_visa', 'fee_work', 'fee_other', 'fine_entry',
        'fine_overdue', 'fine_work', 'special_fee', 'total', 'actual_fee',
        'is_settled', 'row_remark', 'action'
      ]
      if (!confirmColumns.includes(col.key)) return false
    }
    
    if (props.module === 'process') {
      const processColumns = [
        'seq', 'agent_contact', 'name', 'passport', 'alias_no',
        'upstream_name', 'upstream_time', 'upstream_fee', 'upstream_is_settled',
        'process_status', 'upstream_remark', 'business_end_time', 'business_return_time',
        'action'
      ]
      if (!processColumns.includes(col.key)) return false
    }
    
    // 根据可见性过滤
    return isColumnVisible(col.key)
  })
})

// ==================== 显示数据处理 ====================

/**
 * 生成显示数据 - 使用新的嵌套结构
 */
const displayData = computed(() => {
  if (!props.data || props.data.length === 0) {
    spanArr.value = []
    return []
  }

  const nestedData = convertToNestedStructure(props.data)
  const result = []
  const newSpanArr = []
  
  let customerSeq = 0
  let displayIndex = 0

  nestedData.forEach(customer => {
    customerSeq++
    
    const sortedBusinesses = [...customer.businesses].sort((a, b) => 
      (a.business_seq || 1) - (b.business_seq || 1)
    )
    
    // 过滤隐藏的行
    const visibleBusinesses = sortedBusinesses.filter(business => 
      !hiddenRows.value.includes(business.id)
    )
    
    if (visibleBusinesses.length === 0) return
    
    visibleBusinesses.forEach((business, businessIndex) => {
      const isFirstRow = businessIndex === 0
      
      const displayRow = {
        id: business.id,
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
        
        fee_visa: business.business_fees.fee_visa,
        fee_work: business.business_fees.fee_work,
        fee_other: business.business_fees.fee_other,
        fine_entry: business.business_fees.fine_entry,
        fine_overdue: business.business_fees.fine_overdue,
        fine_work: business.business_fees.fine_work,
        special_fee: business.business_fees.special_fee,
        actual_fee: customer.customer_fees.actual_fee,
        
        business_seq: business.business_seq,
        business_type: business.business_type,
        row_remark: business.row_remark,
        is_settled: business.is_settled,
        
        upstream_name: business.upstream_name,
        upstream_time: business.upstream_time,
        upstream_fee: business.upstream_fee,
        upstream_is_settled: business.upstream_is_settled,
        process_status: business.process_status,
        upstream_remark: business.upstream_remark,
        business_end_time: business.business_end_time,
        business_return_time: business.business_return_time,
        
        _customerId: customer.customer_id,
        _customerSeq: customerSeq,
        _businessIndex: businessIndex,
        _isFirstRow: isFirstRow,
        _isMerged: !isFirstRow,
        _displayNo: isFirstRow ? `${props.orderNo || ''}-${customerSeq.toString().padStart(3, '0')}` : ''
      }
      
      result.push(displayRow)
      
      if (isFirstRow) {
        newSpanArr[displayIndex] = visibleBusinesses.length
      } else {
        newSpanArr[displayIndex] = 0
      }
      displayIndex++
    })
  })
  
  spanArr.value = newSpanArr
  return result
})

// ==================== 合并单元格方法（基于字段名） ====================

/**
 * 合并单元格方法 - 基于字段名判断合并
 */
const objectSpanMethod = ({ rowIndex, columnIndex }) => {
  if (rowIndex >= spanArr.value.length) {
    return { rowspan: 1, colspan: 1 }
  }
  
  // 获取当前列的字段名
  const visibleColumns = getVisibleColumns.value
  if (columnIndex >= visibleColumns.length) {
    return { rowspan: 1, colspan: 1 }
  }
  
  const columnKey = visibleColumns[columnIndex].key
  
  // 定义需要合并的字段（基于字段名，不是列索引）
  const mergeFields = [
    'seq', 'agent_contact', 'name', 'passport', 'alias_no', 
    'nationality', 'passport_expiry', 'entry_date', 'visa_expiry', 'has_work_permit'
  ]
  
  const isMergeColumn = mergeFields.includes(columnKey)
  
  if (!isMergeColumn) {
    return { rowspan: 1, colspan: 1 }
  }
  
  const rowspan = spanArr.value[rowIndex]
  
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

// ==================== 原有的其他方法保持不变 ====================

const generateRowId = () => {
  return `row_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// ... [保持原有的 convertToNestedStructure, convertToFlatStructure, handleCustomerInfoChange 等方法不变] ...

const isFeeFieldEnabled = (row, feeField) => {
  const businessType = row.business_type
  
  if (!businessType) return true
  
  if (businessType.includes('续签') || businessType.includes('签证')) {
    return feeField === 'fee_visa'
  }
  
  if (businessType.includes('劳工证') || businessType.includes('工作证')) {
    return feeField === 'fee_work'
  }
  
  return true
}

const calcTotal = (row) => {
  const sum = (Number(row.fee_visa) || 0) + 
              (Number(row.fee_work) || 0) + 
              (Number(row.fee_other) || 0) + 
              (Number(row.fine_entry) || 0) + 
              (Number(row.fine_overdue) || 0) + 
              (Number(row.fine_work) || 0) + 
              (Number(row.special_fee) || 0)
  return sum === 0 ? '' : sum.toLocaleString()
}

const calculateTableHeight = () => {
  nextTick(() => {
    const container = document.querySelector('.table-main-area')
    if (container) {
      const rect = container.getBoundingClientRect()
      tableHeight.value = Math.max(rect.height - 60, 200)
    }
  })
}

const loadOptions = () => {
  const configs = db.getConfigs()
  options.nationalities = configs.nationalities || []
  options.businessTypes = configs.businessTypes || []
  options.orderStatuses = configs.orderStatuses || []
  options.departments = configs.departments || []
}

const handleRowClick = (row) => {
  // 点击行处理逻辑
}

const handleCellMouseEnter = (row, column, cell, event) => {
  // 鼠标进入单元格
}

const handleCellMouseLeave = (row, column, cell, event) => {
  // 鼠标离开单元格
}

const tableRowClassName = ({ rowIndex }) => {
  return rowIndex % 2 === 0 ? 'even-row' : 'odd-row'
}

const handleOpenFiles = (row) => {
  emit('open-files', {
    rowId: row.id,
    customerId: row.customer_id,
    customerName: row.name, // 传递客户名字给文件管理
    rowData: row
  })
}

const handleRemoveRow = (row, displayIndex) => {
  const customerId = row.customer_id
  if (!customerId) return
  
  const nestedData = convertToNestedStructure(props.data)
  const customerIndex = nestedData.findIndex(c => c.customer_id === customerId)
  
  if (customerIndex === -1) return
  
  const customer = nestedData[customerIndex]
  
  const businessIndex = customer.businesses.findIndex(b => b.id === row.id)
  if (businessIndex === -1) return
  
  customer.businesses.splice(businessIndex, 1)
  
  if (customer.businesses.length === 0) {
    nestedData.splice(customerIndex, 1)
    emit('remove', displayIndex)
  } else {
    customer.businesses.sort((a, b) => (a.business_seq || 1) - (b.business_seq || 1))
    customer.businesses.forEach((b, index) => {
      b.business_seq = index + 1
    })
  }
  
  const updatedFlatData = convertToFlatStructure(nestedData)
  emit('update:data', updatedFlatData)
}

const handleColumnResize = (column, width) => {
  // 列宽调整处理
}

// ==================== 生命周期 ====================

onMounted(() => {
  loadOptions()
  calculateTableHeight()
  window.addEventListener('resize', calculateTableHeight)
  // 初始化列配置
  initColumnConfig()
})

watch(() => props.data, () => {
  nextTick(calculateTableHeight)
}, { deep: true })

onUnmounted(() => {
  window.removeEventListener('resize', calculateTableHeight)
})

// ==================== 原有的辅助函数保持不动 ====================

const convertToNestedStructure = (flatData) => {
  if (!flatData || flatData.length === 0) return []
  
  const customersMap = new Map()
  
  flatData.forEach(row => {
    const customerId = row.customer_id
    
    if (!customersMap.has(customerId)) {
      customersMap.set(customerId, {
        customer_id: customerId,
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
          actual_fee: row.actual_fee || null
        },
        
        businesses: []
      })
    }
    
    const customer = customersMap.get(customerId)
    
    customer.businesses.push({
      id: row.id,
      business_seq: row.business_seq || 1,
      business_type: row.business_type || '',
      row_remark: row.row_remark || '',
      is_settled: row.is_settled || '否',
      
      business_fees: {
        fee_visa: row.fee_visa || null,
        fee_work: row.fee_work || null,
        fee_other: row.fee_other || null,
        fine_entry: row.fine_entry || null,
        fine_overdue: row.fine_overdue || null,
        fine_work: row.fine_work || null,
        special_fee: row.special_fee || null
      },
      
      upstream_name: row.upstream_name || '',
      upstream_time: row.upstream_time || '',
      upstream_fee: row.upstream_fee || null,
      upstream_is_settled: row.upstream_is_settled || '否',
      process_status: row.process_status || 'Pending',
      upstream_remark: row.upstream_remark || '',
      business_end_time: row.business_end_time || '',
      business_return_time: row.business_return_time || '',
      files: row.files || []
    })
  })
  
  customersMap.forEach(customer => {
    customer.businesses.sort((a, b) => (a.business_seq || 1) - (b.business_seq || 1))
  })
  
  return Array.from(customersMap.values())
}

const convertToFlatStructure = (nestedData) => {
  if (!nestedData || nestedData.length === 0) return []
  
  const flatData = []
  
  nestedData.forEach(customer => {
    customer.businesses.forEach(business => {
      flatData.push({
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
        
        fee_visa: business.business_fees.fee_visa,
        fee_work: business.business_fees.fee_work,
        fee_other: business.business_fees.fee_other,
        fine_entry: business.business_fees.fine_entry,
        fine_overdue: business.business_fees.fine_overdue,
        fine_work: business.business_fees.fine_work,
        special_fee: business.business_fees.special_fee,
        actual_fee: customer.customer_fees.actual_fee,
        
        id: business.id,
        business_seq: business.business_seq,
        business_type: business.business_type,
        row_remark: business.row_remark,
        is_settled: business.is_settled,
        
        upstream_name: business.upstream_name,
        upstream_time: business.upstream_time,
        upstream_fee: business.upstream_fee,
        upstream_is_settled: business.upstream_is_settled,
        process_status: business.process_status,
        upstream_remark: business.upstream_remark,
        business_end_time: business.business_end_time,
        business_return_time: business.business_return_time,
        files: business.files
      })
    })
  })
  
  return flatData
}

const handleCustomerInfoChange = (row, field, value) => {
  const customerId = row.customer_id
  if (!customerId) return
  
  const nestedData = convertToNestedStructure(props.data)
  const customerIndex = nestedData.findIndex(c => c.customer_id === customerId)
  
  if (customerIndex === -1) return
  
  const customer = nestedData[customerIndex]
  const businessIndex = customer.businesses.findIndex(b => b.id === row.id)
  
  if (businessIndex === -1) return
  
  const customerInfoFields = [
    'name', 'passport', 'alias_no', 'nationality',
    'passport_expiry', 'entry_date', 'visa_expiry',
    'has_work_permit', 'agent_contact'
  ]
  
  const businessInfoFields = [
    'business_type', 'row_remark', 'is_settled'
  ]
  
  const businessFeeFields = [
    'fee_visa', 'fee_work', 'fee_other',
    'fine_entry', 'fine_overdue', 'fine_work',
    'special_fee'
  ]
  
  const upstreamFields = [
    'upstream_name', 'upstream_time', 'upstream_fee',
    'upstream_is_settled', 'process_status', 'upstream_remark',
    'business_end_time', 'business_return_time'
  ]
  
  if (customerInfoFields.includes(field)) {
    customer[field] = value
  } else if (businessInfoFields.includes(field)) {
    customer.businesses[businessIndex][field] = value
  } else if (businessFeeFields.includes(field)) {
    customer.businesses[businessIndex].business_fees[field] = value === null || value === '' ? null : Number(value)
  } else if (upstreamFields.includes(field)) {
    if (field === 'upstream_fee') {
      customer.businesses[businessIndex][field] = value === null || value === '' ? null : Number(value)
    } else {
      customer.businesses[businessIndex][field] = value
    }
  } else if (field === 'actual_fee') {
    customer.customer_fees.actual_fee = value === null || value === '' ? null : Number(value)
  }
  
  const updatedFlatData = convertToFlatStructure(nestedData)
  emit('update:data', updatedFlatData)
}

const handleFeeChange = (row, field, value) => {
  handleCustomerInfoChange(row, field, value)
}
</script>

<style scoped>
.table-container { 
  height: 100%; 
  overflow: hidden; 
  display: flex;
  flex-direction: column;
  position: relative;
}

.row-no-display { 
  font-family: monospace; 
  font-weight: bold; 
  color: #64748b; 
  font-size: 11px !important;
  display: block;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  padding: 0 6px;              /* 增加内边距 */
  line-height: 1.2;
  letter-spacing: -0.3px;      /* 减少字母间距 */
}

.price-text { 
  color: #dc2626; 
  font-weight: 700; 
  font-family: monospace; 
  font-size: 12px !important;
  display: inline-block;
  min-width: 70px;
  text-align: center;
  white-space: nowrap;
}

.action-buttons { 
  display: flex; 
  gap: 8px; 
  justify-content: center; 
}

.business-tags {
  margin-top: 4px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.add-business-btn {
  font-size: 10px;
  height: 22px;
  line-height: 20px;
  padding: 0 8px;
}

.fee-disabled :deep(.el-input-number__input) {
  background-color: #f5f5f5;
  color: #999;
  cursor: not-allowed;
}

.fee-disabled :deep(.el-input-number__input:hover) {
  border-color: #dcdfe6;
}

/* 表格底部合计行（移除原有样式） */
/* .table-footer-summary {
  margin-top: 0;
  padding: 8px 16px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-top: none;
  border-radius: 0 0 4px 4px;
  text-align: right;
}

.summary-row {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 24px;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.summary-label {
  font-weight: 600;
  color: #334155;
  font-size: 13px;
}

.summary-value {
  font-weight: 700;
  font-size: 14px;
  color: #dc2626;
  font-family: monospace;
} */

/* 固定合计行 */
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

/* 表头单元格样式 */
.header-cell {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: default;
}

.header-cell:hover {
  background-color: #f1f5f9;
}

/* ==================== 修复下拉框宽度问题 ==================== */

/* 输入框统一样式 - 修复下拉框宽度 */
.cell-input :deep(.el-input__wrapper),
.cell-select :deep(.el-select__wrapper),
.cell-number-input :deep(.el-input-number .el-input__wrapper),
.cell-multi-select :deep(.el-select .el-input__wrapper),
.cell-date-picker :deep(.el-date-editor .el-input__wrapper) { 
  box-shadow: none !important; 
  border: 1px solid transparent !important; 
  background: transparent !important; 
  padding: 0 4px !important;          /* 减少内边距 */
  height: 28px !important;            /* 减小高度 */
  min-height: 28px !important;
  min-width: 100% !important;         /* 关键修改：改为100%而不是固定值 */
  max-width: 100% !important;         /* 新增：限制最大宽度 */
  width: 100% !important;             /* 确保宽度100% */
}

.cell-input :deep(.el-input__inner),
.table-container :deep(.cell-select .el-select__input),
.cell-number-input :deep(.el-input-number .el-input__inner),
.cell-multi-select :deep(.el-select .el-input__inner),
.cell-date-picker :deep(.el-date-editor .el-input__inner) { 
  padding: 0 !important; 
  height: 26px !important; 
  line-height: 26px !important; 
  font-size: 12px !important; 
  text-align: center !important;
  vertical-align: middle !important;
  min-width: 100% !important;         /* 关键修改：改为100% */
  max-width: 100% !important;         /* 新增：限制最大宽度 */
  width: 100% !important;
}

/* 输入框内容居中修复 */
:deep(.el-input__inner),
:deep(.el-input-number__input),
:deep(.el-select__input),
:deep(.el-date-editor__input) {
  text-align: center !important;
  text-align-last: center !important;
}

/* 修改下拉选择框样式 - 移除固定最小宽度 */
.table-container :deep(.cell-select .el-select) { 
  width: 100% !important;
  min-width: unset !important;        /* 移除固定最小宽度 */
  max-width: 100% !important;
}

/* 修改下拉菜单宽度，使其自适应单元格 */
.table-container :deep(.cell-select .el-select-dropdown) {
  min-width: unset !important;        /* 移除固定最小宽度 */
  max-width: 280px !important;        /* 保留最大宽度限制 */
  width: auto !important;
}

/* 下拉菜单项样式 */
.cell-select :deep(.el-select-dropdown__item) {
  padding: 0 12px !important;         /* 减少内边距 */
  height: 32px !important;
  line-height: 32px !important;
  font-size: 12px !important;         /* 减小字体 */
  min-width: unset !important;        /* 移除最小宽度 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 确保下拉框内容不换行 */
.cell-select :deep(.el-select__input) {
  min-width: 0 !important;
  max-width: 100% !important;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 下拉框选中项样式 */
.cell-select :deep(.el-select .el-select__input-wrapper) {
  max-width: 100% !important;
  overflow: hidden !important;
}

/* 确保下拉框在单元格内正确显示 */
:deep(.el-table .cell .el-select) {
  width: 100% !important;
  max-width: 100% !important;
}

/* 对于宽度小于100px的列，进一步压缩下拉框 */
:deep(.el-table__cell[style*="width: 85px"] .cell-select .el-select),
:deep(.el-table__cell[style*="width: 90px"] .cell-select .el-select) {
  min-width: 100% !important;
}

/* 窄列的下拉菜单项 */
:deep(.el-table__cell[style*="width: 85px"] .cell-select .el-select-dropdown__item),
:deep(.el-table__cell[style*="width: 90px"] .cell-select .el-select-dropdown__item) {
  font-size: 11px !important;
  padding: 0 8px !important;
}

/* 确保输入框在窄列中正确显示 */
:deep(.el-table__cell .cell .el-input__inner) {
  max-width: calc(100% - 8px) !important;  /* 考虑内边距 */
}

/* 强制限制所有表格输入框宽度 */
:deep(.el-table .el-input),
:deep(.el-table .el-select),
:deep(.el-table .el-input-number),
:deep(.el-table .el-date-editor) {
  max-width: 100% !important;
  width: 100% !important;
  box-sizing: border-box !important;
}

/* 防止下拉框撑开单元格 */
:deep(.el-table .el-table__cell) {
  overflow: visible !important;
  position: relative;
}

:deep(.el-table .el-table__cell .cell) {
  overflow: hidden !important;
  position: relative;
}

/* ==================== 原有的其他样式 ==================== */

.cell-input :deep(.el-input__wrapper:hover) { 
  border-color: #d1d5db !important; 
}

.cell-input :deep(.el-input__wrapper.is-focus) { 
  border-color: #3b82f6 !important; 
  box-shadow: 0 0 0 1px #3b82f6 inset !important; 
}

.cell-multi-select :deep(.el-select) { 
  width: 100% !important; 
  min-width: 90px !important;
}

.cell-multi-select :deep(.el-select__tags) { 
  flex-wrap: nowrap !important; 
  max-width: 100% !important; 
  padding: 0 4px !important;
}

.cell-multi-select :deep(.el-select .el-tag) { 
  max-width: 60px !important; 
  overflow: hidden; 
  text-overflow: ellipsis; 
  font-size: 10px !important; 
  padding: 0 4px !important; 
  margin: 1px !important; 
  height: 18px !important; 
  line-height: 18px !important; 
}

.cell-date-picker :deep(.el-date-editor) { 
  width: 100% !important; 
  min-width: 100px !important;
}

.cell-date-picker :deep(.el-input__inner) {
  font-size: 11px !important;
}

/* 特别处理 el-input-number 的居中 */
.cell-number-input :deep(.el-input-number) {
  width: 100% !important;
  min-width: 70px !important;
}

.cell-number-input :deep(.el-input-number__input) {
  text-align: center !important;
  flex: 1;
  font-size: 12px !important;
  height: 28px !important;
  line-height: 28px !important;
}

.cell-number-input :deep(.el-input-number__input)::placeholder {
  text-align: center;
  font-size: 11px !important;
}

/* 金额输入框为空时的样式 */
.cell-number-input :deep(.el-input-number.is-empty .el-input-number__input) {
  color: #c0c4cc;
}

:deep(.el-table) { 
  --el-table-border-color: #e5e7eb; 
  --el-table-header-bg-color: #f8fafc; 
  --el-table-row-hover-bg-color: #f1f5f9; 
  flex: 1;
  border: 1px solid #e5e7eb !important; 
  border-bottom: none !important;
}

:deep(.el-table__body-wrapper) { 
  overflow: auto !important; 
}

:deep(.custom-header-cell) { 
  background-color: #f8fafc !important; 
  color: #334155 !important; 
  font-weight: 700 !important; 
  text-align: center !important; 
  font-size: 11px !important; 
  padding: 8px 2px !important; 
  border-bottom: 2px solid #e5e7eb !important; 
  white-space: nowrap !important; 
  line-height: 1.2 !important;
}

:deep(.header-group-passport) { 
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%) !important; 
}

:deep(.header-group-business) { 
  background: linear-gradient(135deg, #fef9c3 0%, #fde047 100%) !important; 
}

:deep(.header-group-fee) { 
  background: linear-gradient(135deg, #ffedd5 0%, #fdba74 100%) !important; 
}

:deep(.header-group-upstream) { 
  background: linear-gradient(135deg, #dbeafe 0%, #93c5fd 100%) !important; 
}

:deep(.custom-content-cell) { 
  padding: 6px 4px !important; 
  font-size: 12px !important; 
  text-align: center !important;
  vertical-align: middle !important;
  min-height: 42px !important;
  box-sizing: border-box !important;
}

:deep(.el-table__cell) {
  text-align: center !important;
  vertical-align: middle !important;
  padding: 0 !important;
}

:deep(.even-row) { 
  background-color: #fafafa !important; 
}

:deep(.odd-row) { 
  background-color: #ffffff !important; 
}

:deep(.el-table__row:hover) { 
  background-color: #f1f5f9 !important; 
}

:deep(.el-table__fixed) { 
  box-shadow: 4px 0 8px rgba(0, 0, 0, 0.1); 
}

:deep(.el-table__fixed-right) { 
  box-shadow: -4px 0 8px rgba(0, 0, 0, 0.1); 
}

:deep(.sticky-last-marker) { 
  border-right: 2px solid #3b82f644 !important; 
}

:deep(.el-table__body-wrapper)::-webkit-scrollbar { 
  width: 10px; 
  height: 10px; 
}

:deep(.el-table__body-wrapper)::-webkit-scrollbar-track { 
  background: #f1f5f9; 
}

:deep(.el-table__body-wrapper)::-webkit-scrollbar-thumb { 
  background: #cbd5e1; 
  border-radius: 5px; 
}

:deep(.el-table__body-wrapper)::-webkit-scrollbar-thumb:hover { 
  background: #94a3b8; 
}

:deep(.el-button) { 
  transition: all 0.2s ease; 
}

:deep(.el-button:hover) { 
  transform: translateY(-1px); 
}

/* 确保表格单元格内容水平和垂直居中 */
:deep(.el-table .cell) {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  text-align: center !important;
  height: 100% !important;
  padding: 0 !important;
  min-height: 40px !important;
  box-sizing: border-box !important;
}

/* 修复输入框在单元格内的对齐 */
:deep(.el-table .cell .cell-input),
:deep(.el-table .cell .cell-select),
:deep(.el-table .cell .cell-number-input),
:deep(.el-table .cell .cell-date-picker) {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
  height: 100% !important;
  min-height: 30px !important;
}

/* 特别处理序号列 - 增加显示空间 */
:deep(.el-table__cell:first-child .cell) {
  padding: 0 8px !important;
}

/* 确保总计列有足够宽度 */
:deep(.el-table__cell .price-text) {
  min-width: 70px;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px !important;
}

/* 确保备注列输入框可见 */
:deep(.el-table__cell .cell-input) {
  min-width: 100px !important;
}

/* 确保所有输入框在表格中可见 */
:deep(.el-table .cell .el-input),
:deep(.el-table .cell .el-select),
:deep(.el-table .cell .el-input-number),
:deep(.el-table .cell .el-date-editor) {
  width: 100% !important;
  min-width: 80px !important;
  visibility: visible !important;
  opacity: 1 !important;
}

/* 右键菜单样式 */
:deep(.el-dropdown__popper) {
  z-index: 9999 !important;
}

:deep(.el-dropdown-menu) {
  min-width: 160px !important;
}
</style>