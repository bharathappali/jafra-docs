import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  jafraSidebar: [
    'introduction',
    'concepts/architecture',
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'getting-started/requirements',
        'getting-started/quick-start',
        'getting-started/openshift-quick-start',
        'use/profile-workload',
      ],
    },
    {
      type: 'category',
      label: 'Components',
      items: [
        'reference/controller',
        'reference/agent',
        'reference/analyzer',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      items: [
        'build/build-images',
        'deploy/kind-install',
        'deploy/openshift-install',
        'deploy/openshift-security',
        'deploy/manual-components',
        'use/analyzer-api',
      ],
    },
    {
      type: 'category',
      label: 'Operations',
      items: [
        'operations/validate',
        'operations/troubleshooting',
        'operations/teardown-and-limitations',
      ],
    },
    {
      type: 'category',
      label: 'Technical Reference',
      items: [
        'concepts/storage-and-durability',
        'concepts/ingest-protocol',
      ],
    },
  ],
};

export default sidebars;
