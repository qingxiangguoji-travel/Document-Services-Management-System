<template>
  <div class="table-page-wrapper">
    <!-- ================= 标题栏 ================= -->
    <header class="table-page-header">
      <div class="header-main">
        <div class="header-left">
          <h2 class="title-text">
            <slot name="title" />
          </h2>
          <p class="subtitle-text">
            <slot name="subtitle" />
          </p>
        </div>
        <div class="header-right">
          <slot name="actions" />
        </div>
      </div>
    </header>

    <!-- ================= 页面主体 ================= -->
    <div class="table-page-body">
      <div class="table-page-inner">
        <!-- 搜索区 / 筛选区（不滚） -->
        <div class="table-page-search">
          <slot name="search" />
        </div>

        <!-- 表格卡片 -->
        <div class="table-page-card">
          <!-- 表格滚动区 -->
          <div class="table-page-table">
            <slot name="table" />
          </div>

          <!-- 分页 / 底部操作 -->
          <div
            v-if="$slots.pagination"
            class="table-page-footer"
          >
            <slot name="pagination" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// 系统级表格页母版
// 职责：
// - 标题区固定
// - 搜索区固定
// - 表格区内滚
// - 底部分页固定
</script>

<style scoped>
/* =========================
   页面根容器
   ========================= */
.table-page-wrapper {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
}

/* =========================
   顶部标题栏（对齐 PageLayout）
   ========================= */
.table-page-header {
  background: #1e293b;
  padding: 18px 24px;
  color: #ffffff;
  flex-shrink: 0;
}

.header-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-text {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
}

.subtitle-text {
  margin: 4px 0 0;
  font-size: 12px;
  color: #94a3b8;
}

.header-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

/* =========================
   页面主体
   ========================= */
.table-page-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 页面本身不滚 */
  padding: 24px;
}

/* 内容内层 */
.table-page-inner {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* =========================
   搜索区（固定）
   ========================= */
.table-page-search {
  flex-shrink: 0;
}

/* =========================
   表格卡片
   ========================= */
.table-page-card {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

/* =========================
   表格滚动区（核心）
   ========================= */
.table-page-table {
  flex: 1;
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: auto; /* 关键：滚动权在这里 */
}

/* =========================
   底部分页
   ========================= */
.table-page-footer {
  flex-shrink: 0;
  padding: 12px 16px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  display: flex;
  justify-content: flex-end;
}

/* =========================
   移动端适配
   ========================= */
@media (max-width: 768px) {
  .table-page-header {
    padding: 16px;
  }

  .table-page-body {
    padding: 16px;
  }

  .header-main {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .header-right {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
