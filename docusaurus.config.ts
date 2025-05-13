import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'dotenv/config';

const config: Config = {
  title: 'zkVerify Documentation',
  tagline: 'The Proof Verification Chain',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://docs.zkverify.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',
  trailingSlash: false,

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          remarkPlugins: [remarkMath],
          rehypePlugins: [rehypeKatex],
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl: 'https://github.com/zkVerify/zkVerify-docs/tree/main',
          routeBasePath: '/',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
        gtag: {
          trackingID: 'G-H58EEGJ4ZT',
          anonymizeIP: true,
        },
      } satisfies Preset.Options,
    ],
  ],
  stylesheets: [
    {
      href: 'https://cdn.jsdelivr.net/npm/katex@0.13.24/dist/katex.min.css',
      type: 'text/css',
      integrity:
        'sha384-odtC+0UGzzFL/6PNoE8rX/SPcQDXBJ+uRepguP4QkPCm2LBxH3FA3y+fKSiJ+AmM',
      crossorigin: 'anonymous',
    },
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/meta-image.png',
    navbar: {
      // title: 'zkVerify',
      logo: {
        alt: 'zkVerify',
        src: 'img/logo.svg',
        srcDark: 'img/logo-dark.svg'
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: '🛠️ Build',
        },
        {
          type: 'docSidebar',
          sidebarId: 'archSidebar',
          position: 'left',
          label: '📖 Learn',
        },
        {
          type: 'docSidebar',
          sidebarId: 'nodeSidebar',
          position: 'left',
          label: '⚙️ Operators',
        },
        {
          type: 'docSidebar',
          sidebarId: 'incentivizedTestnetSidebar',
          position: 'left',
          label: '🎖️ Incentivized Testnet',
        },
        {
          type: 'doc',
          docId: 'faq',
          to: 'docs/faq.md',
          position: 'left',
          label: '🤔 FAQ',
        },
        {
          href: 'https://github.com/zkVerify/zkVerify-docs',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      copyright: `Copyright © ${new Date().getFullYear()} zkVerify Documentation.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['solidity'],
    },
    algolia: {
      appId: process.env.ALGOLIA_APP_ID,
      apiKey: process.env.ALGOLIA_API_KEY,
      indexName: process.env.ALGOLIA_INDEX_NAME,
    }
  } satisfies Preset.ThemeConfig,
};

export default config;
