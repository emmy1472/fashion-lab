import { front } from './front.mjs'

function draftJettWaistbandEnds({
  options,
  Point,
  Path,
  points,
  paths,
  Snippet,
  snippets,
  sa,
  macro,
  part,
  measurements,
  store,
}) {
  if (!options.ribbing) return part.hide()

  let rh = store.get('ribbingHeight') * 2

  //When the store works and the full belly adjustment is in place,
  // define this as a percentage of the total hip circumference
  //for now, it's just relative to hip
  let width = measurements.hips * (1 + options.hipsEase) * options.ribbingEndsPercentage

  points.topLeft = new Point(0, 0)
  points.topRight = new Point(width, 0)
  points.bottomRight = new Point(width, rh)
  points.bottomLeft = new Point(0, rh)

  points.centerLeft = new Point(0, rh / 2)
  points.centerRight = new Point(width, rh / 2)

  paths.seam = new Path()
    .move(points.topLeft)
    .line(points.topRight)
    .line(points.bottomRight)
    .line(points.bottomLeft)
    .line(points.topLeft)
    .reverse()

  if (sa) {
    paths.sa = paths.seam.offset(sa).setClass('fabric sa')
    paths.sa.line(paths.sa.start())
  }

  paths.foldMark = new Path().move(points.centerLeft).line(points.centerRight).setClass('fabric sa')

  store.cutlist.setCut({ cut: 2, from: 'fabric' })
  points.title = points.topLeft.shiftFractionTowards(points.bottomRight, 0.5)
  points.title = points.title.shift(180, width / 4)

  macro('title', {
    at: points.title,
    nr: 8,
    title: 'waistband_ends',
    scale: 0.6,
  })

  macro('hd', {
    id: 'wTotal',
    from: points.topLeft,
    to: points.topRight,
    y: points.bottomLeft.y + sa + 15,
  })

  macro('vd', {
    id: 'hTotal',
    from: points.topLeft,
    to: points.bottomLeft,
    x: points.bottomLeft.x - sa - 15,
  })

  let placketWidth = store.get('placketWidth')

  points.buttonPoint = new Point(placketWidth / 2, (rh * 3) / 4)
  snippets['bottom_button'] = new Snippet('button', points.buttonPoint)

  return part
}

export const waistband_ends = {
  name: 'jett.waistband_ends',

  after: front,
  options: {
    ribbingEndsPercentage: { pct: 5, min: 0, max: 20, menu: 'style' },
  },
  draft: draftJettWaistbandEnds,
}
