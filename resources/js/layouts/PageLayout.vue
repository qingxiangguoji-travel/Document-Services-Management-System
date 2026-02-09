<template>
  <div class="page-standard-wrapper">
    <!-- 顶部固定头 -->
    <header class="standard-header">
      <div class="header-main">
        <div class="header-left">
          <h2 class="title-text">
            <slot name="title">系统设置</slot>
          </h2>
          <p class="subtitle-text">
            <slot name="subtitle">配置系统运行的基础数据与业务规则</slot>
          </p>
        </div>
        <div class="header-right">
          <slot name="actions" />
        </div>
      </div>
    </header>

    <!-- 页面主体 -->
    <div
      class="page-body"
      :class="{ 'page-body--fixed': fixedBody }"
    >
      <div
        class="content-inner"
        :class="{ 'content-inner--fixed': fixedBody }"
      >
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  /**
   * fixedBody = true
   * 页面本身不滚动
   * 把滚动权交给页面内部区域（表格页 / ERP 页专用）
   */
  fixedBody: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped>
/* =========================
   布局根容器
   ========================= */
.page-standard-wrapper {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
}

/* =========================
   顶部标题栏
   ========================= */
.standard-header {
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
   页面主体（默认：页面滚动）
   ========================= */
/* =========================
   页面主体（默认：页面滚动）
   ========================= */
.page-body {
  flex: 1;
  min-height: 0;

  /* 关键：用 flex-column 提供高度链路 */
  display: flex;
  flex-direction: column;

  overflow-y: auto;   /* ✅ 默认允许页面滚动 */
  padding: 24px;
}

/* =========================
   固定布局模式：页面不滚
   ========================= */
.page-body--fixed {
  overflow: hidden;   /* ✅ fixedBody 时禁用页面滚动 */
}

/* =========================
   内容容器：始终是“可伸缩的列布局”
   ========================= */
.content-inner {
  flex: 1;
  min-height: 0;

  width: 100%;
  max-width: none;   /* ✅ 不限制宽度 */
  margin: 0;        /* ✅ 不强制居中 */
  display: flex;
  flex-direction: column;
}

/* 固定布局专用内容容器（不抢滚动，只保证高度链路） */
.content-inner--fixed {
  padding: 0;

  width: 100%;
  max-width: none;
}


/* =========================
   移动端适配
   ========================= */
@media (max-width: 768px) {
  .standard-header {
    padding: 16px;
  }

  .page-body {
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
