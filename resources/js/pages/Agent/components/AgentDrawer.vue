<template>
  <el-drawer
    :model-value="visible"
    @update:model-value="val => $emit('update:visible', val)"
    :title="form.id ? '修改代理信息' : '创建新合作伙伴'"
    size="580px"
    direction="rtl"
    destroy-on-close
    :append-to-body="true"
    :modal="true"
  >
    <el-form :model="form" label-position="top" class="drawer-form">
      <el-row :gutter="15">
        <el-col :span="16">
          <el-form-item label="代理公司/个人名称" required>
            <el-input v-model="form.name" placeholder="请输入完整名称" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="代理等级">
            <el-select v-model="form.level" class="w-100">
              <el-option
                v-for="l in AGENT_LEVELS"
                :key="l.value"
                :label="l.label"
                :value="l.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="15">
        <el-col :span="12">
          <el-form-item label="所属行业">
            <el-select
              v-model="form.industry"
              class="w-100"
              filterable
              allow-create
              placeholder="请选择或输入"
            >
              <el-option
                v-for="i in INDUSTRIES"
                :key="i"
                :label="i"
                :value="i"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="联系地址">
            <el-input
              v-model="form.address"
              placeholder="详细地址"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="15">
        <el-col :span="12">
          <el-form-item label="合作时间">
            <el-date-picker
              v-model="form.cooperate_time"
              type="date"
              placeholder="选择合作开始时间"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              class="w-100"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="地区">
            <el-select
              v-model="form.region"
              filterable
              allow-create
              placeholder="选择或输入地区"
              class="w-100"
            >
              <el-option label="金边" value="金边" />
              <el-option label="西港" value="西港" />
              <el-option label="暹粒" value="暹粒" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="15">
        <el-col :span="12">
          <el-form-item label="默认佣金比例 (%)">
            <template #label>
              <div style="display: flex; align-items: center; gap: 4px;">
                <span>默认佣金比例 (%)</span>
                <el-tooltip
                  content="该代理每笔订单利润的自动核算比例，默认为 10%"
                  placement="top"
                >
                  <el-icon
                    :size="14"
                    style="color: #94a3b8; cursor: pointer;"
                  >
                    <QuestionFilled />
                  </el-icon>
                </el-tooltip>
              </div>
            </template>

            <el-input-number
              v-model="form.commission_rate"
              :min="0"
              :max="100"
              :precision="1"
              :step="0.5"
              controls-position="right"
              class="w-100"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="备注说明">
        <el-input
          v-model="form.remark"
          type="textarea"
          :rows="2"
        />
      </el-form-item>

      <el-divider content-position="left">
        联系人清单 (可拖拽排序)
      </el-divider>

      <draggable
        v-model="form.contacts"
        item-key="id"
        handle=".drag-handle"
        ghost-class="ghost-item"
        animation="200"
      >
        <template #item="{ element, index }">
          <div class="contact-card">
            <div class="contact-card-header">
              <div class="header-left">
                <el-icon class="drag-handle">
                  <Rank />
                </el-icon>
                <span class="index-tag">
                  联系人 #{{ index + 1 }}
                </span>
              </div>

              <el-button
                link
                type="danger"
                :icon="Delete"
                @click="removeContact(index)"
                v-if="form.contacts.length > 1"
              >
                移除
              </el-button>
            </div>

            <el-row :gutter="10">
              <el-col :span="8">
                <el-input
                  v-model="element.name"
                  placeholder="姓名"
                />
              </el-col>
              <el-col :span="8">
                <el-input
                  v-model="element.phone"
                  placeholder="电话"
                />
              </el-col>
              <el-col :span="8">
                <el-input
                  v-model="element.telegram"
                  placeholder="Telegram"
                />
              </el-col>
            </el-row>
          </div>
        </template>
      </draggable>

      <el-button
        type="dashed"
        class="w-100"
        :icon="Plus"
        @click="addContact"
        style="margin-top: 10px"
      >
        增加联系人
      </el-button>
    </el-form>

    <template #footer>
      <div class="drawer-footer">
        <el-button
          @click="$emit('update:visible', false)"
        >
          取消
        </el-button>

        <el-button
          type="primary"
          size="large"
          :loading="saving"
          @click="handleSave"
        >
          提交保存
        </el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup>
import { reactive, watch } from 'vue'
import { Plus, Delete, Rank, QuestionFilled } from '@element-plus/icons-vue'
import draggable from 'vuedraggable'
import { ElMessage } from 'element-plus'
import { AGENT_LEVELS, INDUSTRIES } from '@/config/constants'

const props = defineProps({
  visible: Boolean,
  editData: Object,
  saving: Boolean
})

const emit = defineEmits(['update:visible', 'save'])

const form = reactive({
  id: null,
  name: '',
  level: 'A',
  industry: '',
  address: '',
  region: '',
  cooperate_time: '',
  remark: '',
  commission_rate: 10,
  contacts: []
})

watch(() => props.visible, (v) => {
  if (v) {
    if (props.editData) {
      const data = JSON.parse(JSON.stringify(props.editData))
      if (data.commission_rate === undefined) {
        data.commission_rate = 10
      }
      Object.assign(form, data)
    } else {
      resetForm()
    }
  }
})

const resetForm = () => {
  Object.assign(form, {
    id: null,
    name: '',
    level: 'A',
    industry: '',
    address: '',
    region: '',
    cooperate_time: '',
    remark: '',
    commission_rate: 10,
    contacts: [{ name: '', phone: '', telegram: '', id: Date.now() }]
  })
}

const addContact = () =>
  form.contacts.push({
    name: '',
    phone: '',
    telegram: '',
    id: Date.now()
  })

const removeContact = (index) =>
  form.contacts.splice(index, 1)

const handleSave = () => {
  if (!form.name || !form.name.trim()) {
    return ElMessage.warning('请输入代理商名称')
  }

  const hasValidContact = form.contacts.some(
    c => c.name && c.name.trim()
  )
  if (!hasValidContact) {
    return ElMessage.warning('请至少填写一位联系人的姓名')
  }

  emit('save', { ...form })
}
</script>

<style scoped>
/* 原样保留你的样式 */
.contact-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  transition: all 0.2s;
}
.contact-card:hover {
  border-color: #2563eb;
  background: #fff;
}
.contact-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.drag-handle {
  cursor: move;
  color: #94a3b8;
  font-size: 18px;
}
.index-tag {
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
}
.ghost-item {
  opacity: 0.4;
  background: #e0f2fe;
  border: 2px dashed #2563eb;
}
.drawer-footer {
  border-top: 1px solid #e2e8f0;
  padding-top: 20px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
.w-100 {
  width: 100%;
}

:deep(.el-form-item__label) {
  font-weight: 600;
  padding-bottom: 4px !important;
}
</style>
