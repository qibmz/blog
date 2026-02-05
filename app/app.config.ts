export default defineAppConfig({
  ui: {
    colors: {
      primary: 'blue',
      neutral: 'slate'
    }
  },
  prose: {
    // 使用自定义的 ProseScript 组件处理代码块中的脚本
    script: 'ProseScript'
  }
})
