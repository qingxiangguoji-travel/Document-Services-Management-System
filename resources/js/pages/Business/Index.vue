<template>
  <PageLayout>
    <h2>代理客户管理</h2>

    <!-- 查询区 -->
    <div class="filters">
      <input placeholder="代理名称" />
      <input placeholder="联系人姓名" />
      <select>
        <option>代理等级</option>
      </select>
      <button>查询</button>
      <button>重置</button>
      <button class="primary" @click="openDrawer">+ 新增代理</button>
    </div>

    <!-- 表格 -->
    <table class="table">
      <thead>
        <tr>
          <th>代理名称</th>
          <th>联系人</th>
          <th>联系方式</th>
          <th>代理等级</th>
          <th>所属行业</th>
          <th>联系地址</th>
          <th>备注</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>ABC 酒店集团</td>
          <td>Tom</td>
          <td>081-123-4567</td>
          <td>A</td>
          <td>酒店</td>
          <td>曼谷市中心</td>
          <td>长期合作</td>
          <td><button>编辑</button></td>
        </tr>
      </tbody>
    </table>
  </PageLayout>

  <!-- ✅ 抽屉彻底独立 -->
  <AgentDrawer
    v-model:visible="drawerVisible"
    @saved="onSaved"
  />
</template>

<script setup>
import { ref } from "vue";
import AgentDrawer from "./AgentDrawer.vue";

const drawerVisible = ref(false);

function openDrawer() {
  drawerVisible.value = true;
}

function onSaved(data) {
  console.log("保存的数据：", data);
  // 这里接 API / 刷新列表
}
</script>
