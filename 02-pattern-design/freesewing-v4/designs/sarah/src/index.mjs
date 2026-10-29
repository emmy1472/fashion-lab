import { Design } from '@freesewing/core'
import about from '../about.json' with { type: 'json' }
import { front } from './front.mjs'
import { back } from './back.mjs'
import { base } from './base.mjs'
import { i18n } from '../i18n/index.mjs'

// Setup our new design
const Sarah = new Design({
  data: about,
  parts: [front, back],
})

// Named exports
export { front, back, base, Sarah, i18n, about }
