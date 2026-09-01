// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  // Your custom configs here
}).append(
  // vendor agent skills：不参与项目 eslint
  {
    ignores: ['.agents/skills/**', '.claude/skills/**']
  },
  {
    files: ['server/**/__test__/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off'
    }
  }
)
