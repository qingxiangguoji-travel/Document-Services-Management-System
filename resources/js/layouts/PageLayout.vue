<template>
  <div class="page-standard-wrapper">
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

    <div class="page-body">
      <div class="content-inner">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup>
// 无需特殊逻辑
</script>

<style scoped>
.page-standard-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #ffffff; /* 内部保持白色，背景由 AdminLayout 决定 */
}

.standard-header { 
  background: #1e293b; 
  padding: 18px 24px; 
  color: #ffffff;
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
  letter-spacing: 0.5px;
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

.page-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.content-inner {
  max-width: 100%;
  margin: 0 auto;
}

/* 移动端适配 */
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