/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // 允许中文 subject
    'subject-case': [0],
    'header-max-length': [2, 'always', 100]
  }
}
