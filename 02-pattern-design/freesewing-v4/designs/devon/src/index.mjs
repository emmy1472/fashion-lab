import { Design } from '@freesewing/core'
import { i18n } from '../i18n/index.mjs'
import about from '../about.json' with { type: 'json' }

// Parts
import { base } from './base.mjs'
import { back } from './back.mjs'
import { backPanel } from './backpanel.mjs'
import { backSide } from './backside.mjs'
import { backYoke } from './backyoke.mjs'
import { cuff } from './cuff.mjs'
import { frontFacing } from './frontfacing.mjs'
import { frontInside } from './frontinside.mjs'
import { frontPanel } from './frontpanel.mjs'
import { frontSidePanel } from './frontsidepanel.mjs'
import { frontYoke } from './frontyoke.mjs'
import { pocket } from './pocket.mjs'
import { pocketflap } from './pocketflap.mjs'
import { sleeve } from './sleeve.mjs'
import { topSleeve } from './topsleeve.mjs'
import { underSleeve } from './undersleeve.mjs'
import { underCollar } from './undercollar.mjs'
import { upperCollar } from './uppercollar.mjs'
import { waistband } from './waistband.mjs'

// Create new design
const Devon = new Design({
  data: about,
  parts: [
    base,
    back,
    backPanel,
    backSide,
    backYoke,
    cuff,
    frontFacing,
    frontYoke,
    frontSidePanel,
    frontPanel,
    frontInside,
    pocket,
    pocketflap,
    sleeve,
    topSleeve,
    underSleeve,
    underCollar,
    upperCollar,
    waistband,
  ],
})

// Named exports
export {
  base,
  back,
  backPanel,
  backSide,
  backYoke,
  cuff,
  frontFacing,
  frontInside,
  frontPanel,
  frontSidePanel,
  frontYoke,
  pocket,
  pocketflap,
  sleeve,
  topSleeve,
  underSleeve,
  underCollar,
  upperCollar,
  waistband,
  i18n,
  Devon,
}
