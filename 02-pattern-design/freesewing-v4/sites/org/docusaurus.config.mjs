import { themes as prismThemes } from 'prism-react-renderer'
import { docusaurusPlugins } from './plugins/index.mjs'
import smartypants from 'remark-smartypants'

/*
 * We customize the sidebar somewhat:
 *  - We bundle the options as one page, so keep them out the sidebar
 *  - We hide certain dynamic pages (like for measurements sets, patterns, and so on)
 */
function customizeSidebar(items) {
  // Filter out docs
  const docs = items.filter((entry) => entry.label === 'Docs').pop().items
  for (const item in docs) {
    // Filter out design options
    if (docs[item].label === 'FreeSewing Designs') {
      for (const design in docs[item].items) {
        for (const subpage in docs[item].items[design].items) {
          if (docs[item].items[design].items[subpage].label === 'Design Options') {
            docs[item].items[design].items[subpage].items = []
          }
        }
      }
    }
    // Filter out submenus in Editor docs
    if (docs[item].label === 'FreeSewing Editor') {
      docs[item].items = []
    }
  }

  // Filter out submenus in Your Measurements Sets and Your Patterns
  for (const item in items) {
    if (items[item].label === 'Account') {
      for (const design in items[item].items) {
        for (const subpage in items[item].items[design].items) {
          if (
            items[item].items[design].items[subpage].label === 'Your Measurements Sets' ||
            items[item].items[design].items[subpage].label === 'Your Patterns'
          ) {
            items[item].items[design].items[subpage].items = []
          }
        }
      }
    }
  }

  return items
}

const config = {
  title: 'FreeSewing',
  tagline: 'FreeSewing documentation for makers',
  favicon: 'img/favicon.ico',

  url: 'https://freesewing.eu',
  baseUrl: '/',
  // Not time to look into this now
  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',
  future: {
    experimental_faster: false, // Too many bugs for now
    v4: {
      //useCssCascadeLayers: false,
    },
  },
  plugins: [
    // Use LightningCSS for CSS minification as it handles Tailwind v4 better
    () => ({
      name: 'lightningcss-minimizer',
      configureWebpack(config, isServer, { isDev }) {
        if (!isDev && !isServer) {
          const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')

          // Replace the default CSS minimizer with LightningCSS
          if (config.optimization?.minimizer) {
            config.optimization.minimizer = config.optimization.minimizer.map((plugin) => {
              if (plugin.constructor.name.includes('CssMinimizerPlugin')) {
                return new CssMinimizerPlugin({
                  minify: CssMinimizerPlugin.lightningCssMinify,
                  minimizerOptions: {
                    // LightningCSS targets for modern browser support
                    targets: {
                      chrome: 120,
                      firefox: 115,
                      safari: 16,
                      edge: 120,
                    },
                  },
                })
              }
              return plugin
            })
          }
        }
        return {}
      },
    }),
    ...docusaurusPlugins,
    [
      '@docusaurus/plugin-content-blog',
      {
        id: 'showcase',
        routeBasePath: 'showcase',
        path: './showcase',
        authorsMapPath: '../authors.json',
        postsPerPage: 50,
        blogTitle: 'FreeSewing Showcase',
        blogSidebarCount: 10,
        blogSidebarTitle: 'Recent Showcases',
      },
    ],
    [
      '@docusaurus/plugin-content-blog',
      {
        id: 'newsletter',
        routeBasePath: 'newsletter',
        path: './newsletter',
        authorsMapPath: '../authors.json',
        blogTitle: 'FreeSewing Newsletter',
        blogDescription: 'Four times per year, honest wholesome content, no ads, no nonsense',
        blogSidebarCount: 50,
        blogSidebarTitle: 'Newsletter Editions',
        postsPerPage: 10,
        feedOptions: {
          type: 'rss',
          title: 'FreeSewing Newsletter Editions',
          description: 'A feed for the FreeSewing newsletter',
          copyright: 'FreeSewing',
          language: 'en',
          createFeedItems: async (params) => {
            const { blogPosts, defaultCreateFeedItems, ...rest } = params
            return defaultCreateFeedItems({
              blogPosts: blogPosts.filter((item, index) => index < 10),
              ...rest,
            })
          },
        },
      },
    ],
  ],

  i18n: { defaultLocale: 'en', locales: ['en'] },

  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.js',
          editUrl: 'https://codeberg.org/freesewing/freesewing/src/branch/develop/sites/org/',
          async sidebarItemsGenerator({ defaultSidebarItemsGenerator, ...args }) {
            const sidebarItems = await defaultSidebarItemsGenerator(args)
            return customizeSidebar(sidebarItems)
          },
          remarkPlugins: [[smartypants, { dashes: 'oldschool' }]],
        },
        theme: {
          customCss: './src/css/custom.css',
        },
        blog: {
          path: 'blog',
          // Simple use-case: string editUrl
          editUrl: 'https://codeberg.org/freesewing/freesewing/src/branch/develop/sites/org/',
          editLocalizedFiles: false,
          blogTitle: 'FreeSewing Blog',
          blogDescription: 'News and updates from the people behind FreeSewing',
          blogSidebarCount: 5,
          blogSidebarTitle: 'Recent blog posts',
          routeBasePath: 'blog',
          authorsMapPath: '../authors.json',
          include: ['*/index.mdx'],
          exclude: [
            '**/_*.{js,jsx,ts,tsx,md,mdx}',
            '**/_*/**',
            '**/*.test.{js,jsx,ts,tsx}',
            '**/__tests__/**',
          ],
          postsPerPage: 10,
          blogListComponent: '@theme/BlogListPage',
          blogTagsListComponent: '@theme/BlogTagsListPage',
          blogTagsPostsComponent: '@theme/BlogTagsPostsPage',
          remarkPlugins: [[smartypants, { dashes: 'oldschool' }]],
          truncateMarker: /<!--\s*(truncate)\s*-->/,
          showReadingTime: true,
          feedOptions: {
            type: 'rss',
            title: 'FreeSewing Blog Posts',
            description: 'News and updates from the people behind FreeSewing',
            copyright: 'FreeSewing',
            language: 'en',
            createFeedItems: async (params) => {
              const { blogPosts, defaultCreateFeedItems, ...rest } = params
              return defaultCreateFeedItems({
                // keep only the 10 most recent blog posts in the feed
                blogPosts: blogPosts.filter((item, index) => index < 10),
                ...rest,
              })
            },
          },
        },
      },
    ],
  ],
  themeConfig: {
    colorMode: {
      // Do not be tempted to change these
      disableSwitch: true,
      respectPrefersColorScheme: true,
    },
    image: 'img/freesewing-social-card.png',
    navbar: {
      title: 'FreeSewing',
      logo: {
        alt: 'FreeSewing Logo',
        src: 'img/logo.svg',
        srcDark: 'img/logo-white.svg',
      },
      items: [
        { type: 'custom-FreeSewingNavbarItem', position: 'left', id: 'designs' },
        { type: 'custom-FreeSewingNavbarItem', position: 'left', id: 'docs' },
        { type: 'custom-FreeSewingNavbarItem', position: 'left', id: 'showcase' },
        { type: 'custom-FreeSewingNavbarItem', position: 'left', id: 'blog' },
        { type: 'custom-FreeSewingNavbarItem', position: 'left', id: 'forum' },
        { type: 'custom-FreeSewingNavbarItem', position: 'right', id: 'account' },
        { type: 'custom-FreeSewingNavbarItem', position: 'right', id: 'support' },
      ],
    },
    footer: {
      style: 'light',
      links: [
        {
          title: 'Sections',
          items: [
            { label: 'FreeSewing Designs', to: '/designs/' },
            { label: 'FreeSewing Showcase', to: '/showcase/' },
            { label: 'FreeSewing Blog', to: '/blog/' },
            { label: 'FreeSewing Editor', to: '/editor/' },
            { label: 'Curated Measurements Sets', to: '/curated-sets/' },
          ],
        },
        {
          title: 'Help & Support',
          items: [
            { label: 'About FreeSewing', to: '/docs/about/' },
            { label: 'Getting Started', to: '/docs/about/guide/' },
            { label: 'Frequently Asked Questions', href: '/docs/about/faq/' },
            { label: 'Documentation', href: '/docs/' },
            { label: 'Need Help?', href: '/support' },
          ],
        },
        {
          title: 'More',
          items: [
            { label: 'FreeSewing.eu', to: 'https://freesewing.eu/' },
            { label: 'FreeSewing.dev', to: 'https://freesewing.dev/' },
            { label: 'FreeSewing.social', to: 'https://freesewing.social/' },
            { label: 'Code on Codeberg', to: 'https://codeberg.org/freesewing/freesewing' },
            { label: 'FreeSewing Revenue Pledge 💜', href: '/docs/about/pledge/' },
          ],
        },
      ],
      copyright: `<a href="https://freesewing.org/">FreeSewing</a> is brought to you by <a href="https://codeberg.org/joostdecock">Joost De Cock</a> and <a href="https://codeberg.org/freesewing/freesewing/src/branch/develop/CONTRIBUTORS.md">contributors</a> with the financial support of <a href="/patrons/join">our patrons</a>`,
    },
    prism: {
      theme: prismThemes.dracula,
      darkTheme: prismThemes.dracula,
    },
  },
}

export default config
