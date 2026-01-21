<template>
  <PageLayout title="办理状态管理">
    <div class="card">
      <div class="toolbar">
        <button class="primary" @click="openCreate">➕ 新增状态</button>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th>排序</th>
            <th>状态名称</th>
            <th>标识码</th>
            <th>颜色</th>
            <th>是否终态</th>
            <th>备注</th>
            <th width="160">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in statuses" :key="s.id">
            <td>{{ s.sort }}</td>
            <td>
              <span class="badge" :style="{ background: s.color }">
                {{ s.name }}
              </span>
            </td>
            <td>{{ s.code }}</td>
            <td>
              <span class="color-box" :style="{ background: s.color }"></span>
              {{ s.color }}
            </td>
            <td>{{ s.is_end ? '是' : '否' }}</td>
            <td>{{ s.remark }}</td>
            <td>
              <button @click="edit(s)">编辑</button>
              <button class="danger" @click="remove(s)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 弹窗 -->
    <div v-if="visible" class="modal">
      <div class="modal-card">
        <h3>{{ form.id ? '编辑状态' : '新增状态' }}</h3>

        <div class="form">
          <label>状态名称</label>
          <input v-model="form.name" />

          <label>标识码（唯一）</label>
          <input v-model="form.code" />

          <label>颜色</label>
          <input type="color" v-model="form.color" />

          <label>排序</label>
          <input type="number" v-model="form.sort" />

          <label>
            <input type="checkbox" v-model="form.is_end" />
            是否终态
          </label>

          <label>备注</label>
          <textarea v-model="form.remark"></textarea>
        </div>

        <div class="actions">
          <button @click="close">取消</button>
          <button class="primary" @click="save">保存</button>
        </div>
      </div>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, reactive } from 'vue'
import PageLayout from '../../layouts/PageLayout.vue'

/* 模拟数据（后期接接口） */
const statuses = ref([
  {
    id: 1,
    name: '受理中',
    code: 'PROCESSING',
    color: '#2563eb',
    sort: 1,
    is_end: false,
    remark: ''
  },
  {
    id: 2,
    name: '已完成',
    code: 'DONE',
    color: '#16a34a',
    sort: 99,
    is_end: true,
    remark: ''
  }
])

const visible = ref(false)

const form = reactive({
  id: null,
  name: '',
  code: '',
  color: '#2563eb',
  sort: 1,
  is_end: false,
  remark: ''
})

function openCreate() {
  Object.assign(form, {
    id: null,
    name: '',
    code: '',
    color: '#2563eb',
    sort: 1,
    is_end: false,
    remark: ''
  })
  visible.value = true
}

function edit(s) {
  Object.assign(form, s)
  visible.value = true
}

function close() {
  visible.value = false
}

function save() {
  if (!form.name || !form.code) {
    alert('状态名称和标识码不能为空')
    return
  }

  if (form.id) {
    const index = statuses.value.findIndex(i => i.id === form.id)
    statuses.value[index] = { ...form }
  } else {
    statuses.value.push({
      ...form,
      id: Date.now()
    })
  }

  visible.value = false
}

function remove(s) {
  if (!confirm('确定删除该状态？已使用的状态无法删除')) return
  statuses.value = statuses.value.filter(i => i.id !== s.id)
}
</script>

<style scoped>
.card {
  background: #fff;
  padding: 16px;
}
.toolbar {
  margin-bottom: 12px;
}
.table {
  width: 100%;
  border-collapse: collapse;
}
.table th,
.table td {
  border: 1px solid #eee;
  padding: 8px;
}
.badge {
  color: #fff;
  padding: 2px 8px;
  border-radius: 4px;
}
.color-box {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 3px;
  margin-right: 6px;
}
.modal {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.4);
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-card {
  background: #fff;
  width: 420px;
  padding: 16px;
}
.form label {
  display: block;
  margin-top: 8px;
}
.actions {
  text-align: right;
  margin-top: 12px;
}
.primary {
  background: #2563eb;
  color: #fff;
}
.danger {
  color: #dc2626;
}
</style>
