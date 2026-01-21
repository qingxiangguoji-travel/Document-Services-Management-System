<template>
  <section class="base-page">
    <slot />
  </section>
</template>

<script setup>
</script>

<style scoped>
/* 清除浏览器默认 margin 干扰 */
:deep(h1),
:deep(h2),
:deep(h3),
:deep(h4),
:deep(h5),
:deep(h6),
:deep(p) {
  margin: 0;
}

.base-page {
  width: 100%;
  box-sizing: border-box;
  font-size: 14px;
  line-height: 1.6;
  color: #111827;
}
</style>
