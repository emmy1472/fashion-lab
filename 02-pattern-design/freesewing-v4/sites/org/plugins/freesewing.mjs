import path from 'node:path'
import { collection } from '@freesewing/collection'

export const plugins = [
  'core-plugins',
  'plugin-annotations',
  'plugin-bin-pack',
  'plugin-bust',
  'plugin-flip',
  'plugin-gore',
  'plugin-i18n',
  'plugin-measurements',
  'plugin-mirror',
  'plugin-ringsector',
  'plugin-round',
  'plugin-sprinkle',
  'plugin-svgattr',
  'plugin-theme',
  'plugin-timing',
  'plugin-versionfree-svg',
]
export const packages = ['core', 'i18n', 'models', 'snapseries']

export function freesewingPlugin() {
  return {
    name: 'fs-loader',
    configureWebpack() {
      const fsConfig = {
        resolve: { alias: {} },
      }
      // Load plugins from source, rather than compiled package
      for (const plugin of plugins) {
        fsConfig.resolve.alias[`@freesewing/${plugin}`] = path.resolve(
          __dirname,
          `../../../plugins/${plugin}/src/index.mjs`
        )
      }
      // Load these from source, rather than compiled package
      for (const pkg of packages) {
        fsConfig.resolve.alias[`@freesewing/${pkg}`] = path.resolve(
          __dirname,
          `../../../packages/${pkg}/src/index.mjs`
        )
      }

      // Load designs from source, rather than compiled package
      for (const design of collection) {
        fsConfig.resolve.alias[`@freesewing/${design}`] = path.resolve(
          __dirname,
          `../../../designs/${design}/src/index.mjs`
        )
      }

      // i18n folder
      fsConfig.resolve.alias[`@i18n`] = path.resolve(__dirname, `../../../i18n`)

      // Yaml loader
      fsConfig.module = {
        rules: [
          {
            test: /\.ya?ml$/,
            use: 'yaml-loader',
          },
        ],
      }

      return fsConfig
    },
  }
}
