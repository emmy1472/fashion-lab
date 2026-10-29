import about from '../about.json' with { type: 'json' }

export const plugin = {
  name: about.id,
  version: about.version,
  hooks: {
    preRender: function (svg) {
      for (const key in svg.attributes.list) {
        if (key.toLowerCase().slice(0, 10) === 'freesewing') delete svg.attributes.list[key]
      }
    },
  },
}

// More specifically named exports
export const versionfreeSvgPlugin = plugin
export const pluginVersionfreeSvg = plugin
