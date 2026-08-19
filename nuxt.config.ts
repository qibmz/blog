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
    '@vercel/analytics/nuxt',
    'nuxt-echarts'
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
        { name: 'keywords', content: 'qibmz,UniApp踩坑,Nuxt payload.json,z-paging easycom,RootPortal,WangEditor,Wagmi UniApp,nvm-windows' },
        { property: 'og:locale', content: 'zh_CN' }
      ]
    }
  },
  css: ['~/assets/css/main.css'],
  // SEO 配置
  site: {
    url: 'https://blog.qibmz.com',
    name: 'qibmz 博客',
    description: 'qibmz 的个人技术博客：UniApp / Nuxt / Vue 实战踩坑与报错修复笔记，按错误原文和库名可检索。',
    defaultLocale: 'zh-CN'
  },
  colorMode: {
    preference: 'dark',
    fallback: 'dark'
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
    r2AccountId: process.env.R2_ACCOUNT_ID || '',
    r2AccessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    r2BucketName: process.env.R2_BUCKET_NAME || '',
    r2PublicBaseUrl: process.env.R2_PUBLIC_BASE_URL || 'https://img.qibmz.com',
    public: {
      binanceWs: process.env.NUXT_PUBLIC_BINANCE_WS || 'wss://data-stream.binance.vision',
      binanceApi: process.env.NUXT_PUBLIC_BINANCE_API || 'https://api.binance.com',
      // Giscus：先在仓库开启 Discussions 并安装 Giscus App，再到 https://giscus.app 取 categoryId
      giscus: {
        repo: 'qibmz/blog',
        repoId: 'R_kgDOQRi49g',
        category: process.env.NUXT_PUBLIC_GISCUS_CATEGORY || 'Announcements',
        categoryId: process.env.NUXT_PUBLIC_GISCUS_CATEGORY_ID || 'DIC_kwDOQRi49s4DDLq7'
      }
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
    css: {
      devSourcemap: true
    },
    esbuild: {
      drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : []
    }
  },

  echarts: {
    renderer: ['canvas'],
    charts: ['LineChart', 'BarChart', 'PieChart'],
    components: [
      'GridComponent',
      'TooltipComponent',
      'LegendComponent',
      'ToolboxComponent'
    ]
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
      '/api/**'
    ]
  }
})
