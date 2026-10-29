import { Design } from '@freesewing/core'
import about from '../about.json' with { type: 'json' }
import { panel } from './panel.mjs'
import { binding } from './binding.mjs'
import { waistband } from './waistband.mjs'
import { i18n } from '../i18n/index.mjs'

// Setup our new design
const Sunny = new Design({
  data: about,
  parts: [panel, binding, waistband],
})

// Named exports
export { panel, binding, waistband, Sunny, i18n, about }
