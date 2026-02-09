<!-- resources/js/layouts/ScrollContainer.vue -->
<template>
  <div class="scroll-container">
    <slot />
  </div>
</template>

<script setup>
</script>

<style scoped>
.scroll-container{
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow: auto;              /* ✅ 原生滚动，sticky 才稳 */
  overscroll-behavior: contain;
}

/* ✅ 真滚动条（可拖动） */
.scroll-container::-webkit-scrollbar{
  width: 8px;
  height: 8px;
}
.scroll-container::-webkit-scrollbar-thumb{
  background: rgba(100, 116, 139, 0.6);
  border-radius: 6px;
}
.scroll-container::-webkit-scrollbar-thumb:hover{
  background: rgba(100, 116, 139, 0.9);
}
.scroll-container::-webkit-scrollbar-corner{
  background: transparent;
}
</style>
