// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({

  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/ui',
    '@comark/nuxt',
    '@nuxt/content',
    '@vueuse/nuxt',
    '@nuxtjs/sitemap',
    'nuxt-auth-utils',
    'motion-v/nuxt',
    '@vercel/analytics/nuxt'
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

  // MDC 高亮：显式启用 API 路由，避免客户端请求 /api/_mdc/highlight 404
  // @nuxt/content 默认设置 noApiRoute: true 会禁用此路由
  mdc: {
    highlight: {
      noApiRoute: false
    }
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
    '/chat/**': { ssr: false },
    '/docs': { redirect: '/docs/getting-started', prerender: false }
  },
  experimental: {
    viewTransition: true
  },

  compatibilityDate: '2024-07-11',

  nitro: {
    baseURL: process.env.NUXT_APP_BASE_URL || '/',
    maxBodySize: '10mb',
    imports: {
      dirs: ['server/db']
    },
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
