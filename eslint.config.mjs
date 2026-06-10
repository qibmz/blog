// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  // Your custom configs here
}).append({
  files: ['server/**/__test__/*.ts'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off'
  }
})
