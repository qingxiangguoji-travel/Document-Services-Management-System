<template>
  <div class="table-wrapper">
    <el-table 
      ref="tableRef"
      :data="tableData"
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
	  @row-click="handleRowClick"
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
          <div 
            class="header-cell" 
            @contextmenu.prevent="$emit('show-column-menu', column, $event)"
          >
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
          <div 
            class="header-cell" 
            @contextmenu.prevent="$emit('show-column-menu', column, $event)"
          >
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
            @update:model-value="value => handleCellChange(scope.row, 'name', value)"
          />
        </template>
        <template #header="{ column }">
          <div 
            class="header-cell" 
            @contextmenu.prevent="$emit('show-column-menu', column, $event)"
          >
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
            @update:model-value="value => handleCellChange(scope.row, 'passport', value)"
          />
        </template>
        <template #header="{ column }">
          <div 
            class="header-cell" 
            @contextmenu.prevent="$emit('show-column-menu', column, $event)"
          >
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
            @update:model-value="value => handleCellChange(scope.row, 'alias_no', value)"
          />
        </template>
        <template #header="{ column }">
          <div 
            class="header-cell" 
            @contextmenu.prevent="$emit('show-column-menu', column, $event)"
          >
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
                @update:model-value="value => handleCellChange(scope.row, 'nationality', value)"
              >
                <el-option v-for="item in options.nationalities" :key="item" :label="item" :value="item" />
              </el-select>
            </template>
            <template #header="{ column }">
              <div 
                class="header-cell" 
                @contextmenu.prevent="$emit('show-column-menu', column, $event)"
              >
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
                @update:model-value="value => handleCellChange(scope.row, 'passport_expiry', value)"
              />
            </template>
            <template #header="{ column }">
              <div 
                class="header-cell" 
                @contextmenu.prevent="$emit('show-column-menu', column, $event)"
              >
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
                @update:model-value="value => handleCellChange(scope.row, 'entry_date', value)"
              />
            </template>
            <template #header="{ column }">
              <div 
                class="header-cell" 
                @contextmenu.prevent="$emit('show-column-menu', column, $event)"
              >
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
                @update:model-value="value => handleCellChange(scope.row, 'visa_expiry', value)"
              />
            </template>
            <template #header="{ column }">
              <div 
                class="header-cell" 
                @contextmenu.prevent="$emit('show-column-menu', column, $event)"
              >
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
                @update:model-value="value => handleCellChange(scope.row, 'has_work_permit', value)"
              >
                <el-option label="有" value="有" />
                <el-option label="无" value="无" />
              </el-select>
            </template>
            <template #header="{ column }">
              <div 
                class="header-cell" 
                @contextmenu.prevent="$emit('show-column-menu', column, $event)"
              >
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
                @update:model-value="value => handleCellChange(scope.row, 'business_type', value)"
              >
                <el-option v-for="item in options.businessTypes" :key="item" :label="item" :value="item" />
              </el-select>
            </template>
            <template #header="{ column }">
              <div 
                class="header-cell" 
                @contextmenu.prevent="$emit('show-column-menu', column, $event)"
              >
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
                :model-value="ensureBusinessFees(scope.row).fee_visa"
                :controls="false" 
                size="small"
                class="cell-number-input"
                placeholder=""
                :disabled="!isFeeFieldEnabled(scope.row, 'fee_visa')"
                :class="{ 'fee-disabled': !isFeeFieldEnabled(scope.row, 'fee_visa') }"
                @update:model-value="value => handleCellChange(scope.row, 'fee_visa', value)"
              />
            </template>
            <template #header="{ column }">
              <div class="header-cell" @contextmenu.prevent="$emit('show-column-menu', column, $event)">
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
                :model-value="ensureBusinessFees(scope.row).fee_work"
                :controls="false" 
                size="small"
                class="cell-number-input"
                placeholder=""
                :disabled="!isFeeFieldEnabled(scope.row, 'fee_work')"
                :class="{ 'fee-disabled': !isFeeFieldEnabled(scope.row, 'fee_work') }"
                @update:model-value="value => handleCellChange(scope.row, 'fee_work', value)"
              />
            </template>
            <template #header="{ column }">
              <div class="header-cell" @contextmenu.prevent="$emit('show-column-menu', column, $event)">
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
                :model-value="ensureBusinessFees(scope.row).fee_other"
                :controls="false" 
                size="small"
                class="cell-number-input"
                placeholder=""
                :disabled="!isFeeFieldEnabled(scope.row, 'fee_other')"
                :class="{ 'fee-disabled': !isFeeFieldEnabled(scope.row, 'fee_other') }"
                @update:model-value="value => handleCellChange(scope.row, 'fee_other', value)"
              />
            </template>
            <template #header="{ column }">
              <div class="header-cell" @contextmenu.prevent="$emit('show-column-menu', column, $event)">
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
                :model-value="ensureBusinessFees(scope.row).fine_entry"
                :controls="false" 
                size="small"
                class="cell-number-input"
                placeholder=""
                @update:model-value="value => handleCellChange(scope.row, 'fine_entry', value)"
              />
            </template>
            <template #header="{ column }">
              <div class="header-cell" @contextmenu.prevent="$emit('show-column-menu', column, $event)">
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
                :model-value="ensureBusinessFees(scope.row).fine_overdue"
                :controls="false" 
                size="small"
                class="cell-number-input"
                placeholder=""
                @update:model-value="value => handleCellChange(scope.row, 'fine_overdue', value)"
              />
            </template>
            <template #header="{ column }">
              <div class="header-cell" @contextmenu.prevent="$emit('show-column-menu', column, $event)">
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
                :model-value="ensureBusinessFees(scope.row).fine_work"
                :controls="false" 
                size="small"
                class="cell-number-input"
                placeholder=""
                @update:model-value="value => handleCellChange(scope.row, 'fine_work', value)"
              />
            </template>
            <template #header="{ column }">
              <div class="header-cell" @contextmenu.prevent="$emit('show-column-menu', column, $event)">
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
                :model-value="ensureBusinessFees(scope.row).special_fee"
                :controls="false" 
                size="small"
                class="cell-number-input"
                placeholder=""
                @update:model-value="value => handleCellChange(scope.row, 'special_fee', value)"
              />
            </template>
            <template #header="{ column }">
              <div class="header-cell" @contextmenu.prevent="$emit('show-column-menu', column, $event)">
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
              <div class="header-cell" @contextmenu.prevent="$emit('show-column-menu', column, $event)">
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
                :model-value="scope.row.actual_fee ?? null"
                :controls="false" 
                size="small"
                :precision="2"
                class="cell-number-input"
                placeholder=""
                @update:model-value="value => handleCellChange(scope.row, 'actual_fee', value)"
              />
            </template>
            <template #header="{ column }">
              <div class="header-cell" @contextmenu.prevent="$emit('show-column-menu', column, $event)">
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
                @update:model-value="value => handleCellChange(scope.row, 'is_settled', value)"
              >
                <el-option label="是" value="是" />
                <el-option label="否" value="否" />
              </el-select>
            </template>
            <template #header="{ column }">
              <div class="header-cell" @contextmenu.prevent="$emit('show-column-menu', column, $event)">
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
                @update:model-value="value => handleCellChange(scope.row, 'row_remark', value)"
              />
            </template>
            <template #header="{ column }">
              <div class="header-cell" @contextmenu.prevent="$emit('show-column-menu', column, $event)">
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
                @update:model-value="value => handleCellChange(scope.row, 'upstream_name', value)"
              >
                <el-option v-for="item in options.departments" :key="item.id" :label="item.name" :value="item.name" />
              </el-select>
            </template>
            <template #header="{ column }">
              <div class="header-cell" @contextmenu.prevent="$emit('show-column-menu', column, $event)">
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
                @update:model-value="value => handleCellChange(scope.row, 'upstream_time', value)"
              />
            </template>
            <template #header="{ column }">
              <div class="header-cell" @contextmenu.prevent="$emit('show-column-menu', column, $event)">
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
                :model-value="scope.row.upstream_fee ?? null"
                :controls="false" 
                size="small"
                class="cell-number-input"
                placeholder=""
                @update:model-value="value => handleCellChange(scope.row, 'upstream_fee', value)"
              />
            </template>
            <template #header="{ column }">
              <div class="header-cell" @contextmenu.prevent="$emit('show-column-menu', column, $event)">
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
                @update:model-value="value => handleCellChange(scope.row, 'upstream_is_settled', value)"
              >
                <el-option label="是" value="是" />
                <el-option label="否" value="否" />
              </el-select>
            </template>
            <template #header="{ column }">
              <div class="header-cell" @contextmenu.prevent="$emit('show-column-menu', column, $event)">
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
                @update:model-value="value => handleCellChange(scope.row, 'process_status', value)"
              >
                <el-option v-for="item in options.orderStatuses" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </template>
            <template #header="{ column }">
              <div class="header-cell" @contextmenu.prevent="$emit('show-column-menu', column, $event)">
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
                @update:model-value="value => handleCellChange(scope.row, 'upstream_remark', value)"
              />
            </template>
            <template #header="{ column }">
              <div class="header-cell" @contextmenu.prevent="$emit('show-column-menu', column, $event)">
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
                @update:model-value="value => handleCellChange(scope.row, 'business_end_time', value)"
              />
            </template>
            <template #header="{ column }">
              <div class="header-cell" @contextmenu.prevent="$emit('show-column-menu', column, $event)">
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
                @update:model-value="value => handleCellChange(scope.row, 'business_return_time', value)"
              />
            </template>
            <template #header="{ column }">
              <div class="header-cell" @contextmenu.prevent="$emit('show-column-menu', column, $event)">
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
              @click="$emit('open-files', scope.row)" 
              title="管理文件"
            />
            <el-button 
              :icon="Delete" 
              circle 
              size="small" 
              type="danger" 
              @click="$emit('remove-row', scope.row, scope.$index)" 
              title="删除行"
            />
          </div>
        </template>
        <template #header="{ column }">
          <div class="header-cell" @contextmenu.prevent="$emit('show-column-menu', column, $event)">
            {{ column.label }}
          </div>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { useMergeRules } from '../composables/useMergeRules'
import { ref, computed } from 'vue'
import { Picture, Delete } from '@element-plus/icons-vue'
import type { TableRow, ModuleType } from '../types/table'

interface Props {
  data: TableRow[]
  module: ModuleType
  options: any
  dateShortcuts: any[]
  columnVisibility: Record<string, boolean>
  tableHeight?: string
}

interface Emits {
  (e: 'add-business', row: TableRow): void
  (e: 'row-click', row: TableRow): void
  (e: 'row-contextmenu', row: any, column: any, event: MouseEvent): void
  (e: 'cell-mouseenter', row: any, column: any, cell: any, event: MouseEvent): void
  (e: 'cell-mouseleave', row: any, column: any, cell: any, event: MouseEvent): void
  (e: 'remove-row', row: any, displayIndex: number): void
  (e: 'open-files', row: any): void
  (e: 'customer-info-change', row: any, field: string, value: any): void
  (e: 'fee-change', row: any, field: string, value: any): void
  (e: 'column-resize', column: any, width: number): void
  (e: 'show-column-menu', column: any, event: MouseEvent): void
}

const props = withDefaults(defineProps<Props>(), {
  tableHeight: '100%'
})
const emit = defineEmits<Emits>()

const tableRef = ref()
const tableData = computed(() => props.data)

/* ===========================
   合并规则（前10列）
   =========================== */

const MERGE_COLUMNS = new Set([
  'seq',
  'agent_contact',
  'name',
  'passport',
  'alias_no',
  'nationality',
  'passport_expiry',
  'entry_date',
  'visa_expiry',
  'has_work_permit'
])

const { spanMethod: objectSpanMethod } = useMergeRules(tableData, {
  mergeColumns: MERGE_COLUMNS,
  groupKey: 'customer_id'
})


/* ===========================
   核心修复：费用字段稳定处理
   =========================== */

// 确保 business_fees 一定存在
const ensureBusinessFees = (row: any) => {
  if (!row.business_fees) {
    row.business_fees = {
      fee_visa: row.fee_visa ?? null,
      fee_work: row.fee_work ?? null,
      fee_other: row.fee_other ?? null,
      fine_entry: row.fine_entry ?? null,
      fine_overdue: row.fine_overdue ?? null,
      fine_work: row.fine_work ?? null,
      special_fee: row.special_fee ?? null
    }
  }
  return row.business_fees
}

// 本地立即写回（避免 UI 消失）
const setLocalFeeValue = (row: any, field: string, value: number | null) => {
  const fees = ensureBusinessFees(row)
  if (field in fees) {
    fees[field] = value
  }
  // 同步扁平字段，保证刷新/重算不丢
  row[field] = value
}

// 单元格变化
const handleCellChange = (row: TableRow, field: string, value: any) => {
  const isMoneyField =
    field.startsWith('fee_') ||
    field.startsWith('fine_') ||
    field === 'special_fee' ||
    field === 'actual_fee' ||
    field === 'upstream_fee'

  if (isMoneyField) {
    const normalized =
      value === '' || value === null || value === undefined
        ? null
        : Number(value)

    // 费用字段（business_fees）
    if (
      field.startsWith('fee_') ||
      field.startsWith('fine_') ||
      field === 'special_fee'
    ) {
      setLocalFeeValue(row as any, field, normalized)
      emit('customer-info-change', row, field, normalized)
      return
    }

    // actual_fee / upstream_fee（不在 business_fees 中）
    ;(row as any)[field] = normalized
    emit('fee-change', row, field, normalized)
    return
  }

  emit('customer-info-change', row, field, value)
}



/* ===========================
   其余逻辑：保持原样
   =========================== */

const isColumnVisible = (columnKey: string) => {
  return props.columnVisibility[columnKey] !== false
}

const isFeeFieldEnabled = (row: TableRow, field: string) => {
  if (!field.startsWith('fee_')) return true
  const businessType = row.business_type
  if (!businessType) return true
  if (businessType.includes('续签') || businessType.includes('签证')) {
    return field === 'fee_visa'
  }
  if (businessType.includes('劳工证') || businessType.includes('工作证')) {
    return field === 'fee_work'
  }
  return true
}

const calcTotal = (row: any) => {
  const fees = row.business_fees || {}
  const sum =
    (Number(fees.fee_visa) || 0) +
    (Number(fees.fee_work) || 0) +
    (Number(fees.fee_other) || 0) +
    (Number(fees.fine_entry) || 0) +
    (Number(fees.fine_overdue) || 0) +
    (Number(fees.fine_work) || 0) +
    (Number(fees.special_fee) || 0)

  return sum === 0 ? '' : sum.toLocaleString()
}

const handleRowContextMenu = (row: any, column: any, event: MouseEvent) => {
  emit('row-contextmenu', row, column, event)
}
const handleRowClick = (row: any) => {
  emit('row-click', row)
}


const handleCellMouseEnter = (row: any, column: any, cell: any, event: MouseEvent) => {
  emit('cell-mouseenter', row, column, cell, event)
}

const handleCellMouseLeave = (row: any, column: any, cell: any, event: MouseEvent) => {
  emit('cell-mouseleave', row, column, cell, event)
}

const handleColumnResize = (column: any, width: number) => {
  emit('column-resize', column, width)
}

const tableRowClassName = ({ rowIndex }: { rowIndex: number }) => {
  return rowIndex % 2 === 0 ? 'even-row' : 'odd-row'
}

defineExpose({ tableRef })
</script>


<style scoped>
.table-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.action-buttons { 
  display: flex; 
  gap: 8px; 
  justify-content: center; 
}

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
  padding: 0 6px;
  line-height: 1.2;
  letter-spacing: -0.3px;
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
</style>
