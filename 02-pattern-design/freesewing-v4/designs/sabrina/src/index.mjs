import { Design } from '@freesewing/core'
import { i18n } from '../i18n/index.mjs'
import about from '../about.json' with { type: 'json' }
// Parts
import { base } from './base.mjs'
import { front } from './front.mjs'
import { side } from './side.mjs'
import { back } from './back.mjs'
import { waistband } from './waistband.mjs'

// Create new design
const Sabrina = new Design({
  data: about,
  parts: [base, front, side, back, waistband],
})

// Named exports
export { base, front, side, back, waistband, i18n, Sabrina }
