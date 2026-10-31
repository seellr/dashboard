import type { StorybookConfig } from '@storybook/nextjs-vite'

const config: StorybookConfig = {
  stories: ['../stories/**/*.stories.@(ts|tsx)'],
  addons: [],
  framework: { name: '@storybook/nextjs-vite', options: {} },
  typescript: { reactDocgen: 'react-docgen-typescript' },
}

export default config
