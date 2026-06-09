import highlight from '@comark/nuxt/plugins/highlight'
import python from '@shikijs/langs/python'
import sql from '@shikijs/langs/sql'
import go from '@shikijs/langs/go'
import rust from '@shikijs/langs/rust'

export default defineComarkComponent({
  plugins: [
    highlight({
      languages: [python, sql, go, rust]
    })
  ],
  class: '*:first:mt-0 *:last:mb-0'
})
