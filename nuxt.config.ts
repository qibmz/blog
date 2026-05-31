// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({

  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/ui',
    '@nuxt/content',
    '@vueuse/nuxt',
    '@nuxtjs/sitemap',
    'nuxt-auth-utils'
  ],
  devtools: {
    enabled: true
  },

  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || '/',
    head: {
      htmlAttrs: {
        lang: 'zh-CN'
      },
      meta: [
        { name: 'author', content: 'qibmz' },
        { name: 'keywords', content: '前端开发,Web3,UniApp,Vue,Nuxt,跨平台开发,区块链,技术博客' },
        { property: 'og:locale', content: 'zh_CN' }
      ],
      link: [
        { rel: 'canonical', href: 'https://qibmz-blog.vercel.app' }
      ]
    }
  },
  css: ['~/assets/css/main.css'],

  // SEO 配置
  site: {
    url: 'https://qibmz-blog.vercel.app',
    name: 'qibmz 博客',
    description: 'qibmz 的个人技术博客，专注于前端开发、Web3 区块链应用、UniApp 跨平台开发、Vue/Nuxt 全栈技术分享。',
    defaultLocale: 'zh-CN'
  },
  ui: {
    fonts: false
  },
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL,
    public: {
      origin: process.env.NUXT_PUBLIC_ORIGIN || 'https://qibmz.github.io/blog',
      binanceWs: process.env.NUXT_PUBLIC_BINANCE_WS || 'wss://data-stream.binance.vision',
      binanceApi: process.env.NUXT_PUBLIC_BINANCE_API || 'https://api.binance.com'
    }
  },

  routeRules: {
    '/docs': { redirect: '/docs/getting-started', prerender: false }
  },

  experimental: {
    viewTransition: true
  },
  compatibilityDate: '2024-07-11',

  nitro: {
    baseURL: process.env.NUXT_APP_BASE_URL || '/',
    prerender: {
      routes: [
        '/'
      ],
      crawlLinks: true
    }
  },
  vite: {
    esbuild: {
      drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : []
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  // Sitemap 配置
  sitemap: {
    xsl: false,
    exclude: [
      '/playground/**',
      '/api/**'
    ]
  }
})
