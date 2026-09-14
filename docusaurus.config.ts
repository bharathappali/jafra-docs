import type {Config} from '@docusaurus/types';
import type {Options, ThemeConfig} from '@docusaurus/preset-classic';
import {themes as prismThemes} from 'prism-react-renderer';
import versions from './versions.json';

const latestVersion = versions[0];
const versionOptions = Object.fromEntries(
  versions.map((version, index) => [
    version,
    {
      label: `v${version}`,
      path: index === 0 ? '' : version,
      banner: 'none' as const,
    },
  ]),
);

const config: Config = {
  title: 'Jafra',
  tagline: 'Automated JVM flight recording and JMC analysis',
  favicon: 'imgs/logo/favicon_io/favicon-32x32.png',
  url: 'https://docs.jafra.io',
  baseUrl: '/',
  organizationName: 'bharathappali',
  projectName: 'jafra-docs',
  onBrokenLinks: 'throw',
  staticDirectories: ['static', 'assets'],
  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },
  themes: [
    '@docusaurus/theme-mermaid',
    [
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: true,
        indexDocs: true,
        indexBlog: false,
        docsRouteBasePath: '/',
      },
    ],
  ],
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          includeCurrentVersion: false,
          lastVersion: latestVersion,
          onlyIncludeVersions: versions,
          versions: versionOptions,
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
        sitemap: false,
      } satisfies Options,
    ],
  ],
  themeConfig: {
    navbar: {
      title: 'Jafra Docs',
      logo: {
        alt: 'Jafra',
        src: 'imgs/logo/favicon_io/android-chrome-192x192.png',
      },
      items: [
        {
          type: 'dropdown',
          label: `v${latestVersion}`,
          position: 'right',
          items: versions.map((version, index) => ({
            label: `v${version}`,
            to: index === 0 ? '/' : `/${version}/`,
          })),
        },
        {
          href: 'https://github.com/bharathappali/jafra-io',
          label: 'jafra-io',
          position: 'right',
          className: 'github-repo-chip',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {label: 'About Jafra', to: '/'},
            {label: 'Get started', to: '/getting-started/quick-start'},
            {label: 'Troubleshooting', to: '/operations/troubleshooting'},
          ],
        },
        {
          title: 'Source',
          items: [
            {label: 'Jafra umbrella repository', href: 'https://github.com/bharathappali/jafra-io'},
            {label: 'Documentation repository', href: 'https://github.com/bharathappali/jafra-docs'},
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Jafra contributors. Apache-2.0.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'java', 'protobuf'],
    },
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: false,
    },
  } satisfies ThemeConfig,
};

export default config;
