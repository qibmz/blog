<template>
  <!-- #ifdef H5 -->
  <!-- H5端使用 teleport -->
  <teleport to="body">
    <!-- #endif -->
    <!-- #ifdef MP-WEIXIN || MP-ALIPAY -->
    <!-- #ifndef MP-DINGTALK -->
    <!-- 小程序使用 root-portal -->
    <root-portal>
      <!-- #endif -->
      <!-- #endif -->
      <view>
        <slot />
      </view>
      <!-- #ifdef MP-WEIXIN || MP-ALIPAY -->
      <!-- #ifndef MP-DINGTALK -->
    </root-portal>
    <!-- #endif -->
    <!-- #endif -->
    <!-- #ifdef H5 -->
  </teleport>
  <!-- #endif -->
</template>

<script lang="ts">
export default {
  options: {
    virtualHost: true,
    addGlobalClass: true,
    styleIsolation: "shared"
  }
};
</script>

<script setup lang="ts">
/**
 * RootPortal 组件
 * 用于解决 uview-plus 等组件库中 popup/modal 被渲染在深层 DOM 导致遮罩层显示问题
 * 
 * 原理：
 * - H5 端：使用 Vue3 的 teleport 将内容传送到 body
 * - 微信/支付宝小程序：使用原生 root-portal 组件
 * - APP 端：使用 renderjs 将元素移动到根节点
 */
</script>

<!-- #ifdef APP-PLUS -->
<script module="render" lang="renderjs">
export default {
  mounted() {
    if (this.$ownerInstance.$el) {
      (document.querySelector('uni-app') || document.body).appendChild(this.$ownerInstance.$el)
    }
  },
  beforeDestroy() {
    // 清理，将元素移回原位置
    if (this.$ownerInstance.$el) {
      (document.querySelector('uni-app') || document.body).removeChild(this.$ownerInstance.$el)
    }
  }
}
</script>
<!-- #endif -->
