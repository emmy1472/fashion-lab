import { frontSidePanel } from './frontsidepanel.mjs'
import { dim } from './shared.mjs'

export const waistband = {
  name: 'devon.waistband',
  after: frontSidePanel,
  hide: {
    self: false,
    from: true,
    inherited: true,
  },
  options: {
    // Constants
    // Parameters
  },
  draft: ({ Point, points, Path, paths, Snippet, snippets, macro, sa, store, complete, part }) => {
    for (const i in paths) {
      delete paths[i]
    }
    for (const i in points) {
      delete points[i]
    }

    const hemLength = store.get('hemLength')
    const waistbandWidth = store.get('waistbandWidth')
    const frontAdd = store.get('waistbandWidth') * 0.5

    points.midLeft = new Point(0, 0)
    points.midRight = new Point(hemLength, 0)
    points.topLeft = new Point(0, waistbandWidth * -1)
    points.topRight = new Point(hemLength, waistbandWidth * -1)
    points.bottomLeft = new Point(0, waistbandWidth)
    points.bottomRight = new Point(hemLength, waistbandWidth)

    points.button5 = new Point(frontAdd, waistbandWidth * -0.5)

    paths.seamBase = new Path()
      .move(points.topRight)
      .line(points.topLeft)
      .line(points.bottomLeft)
      .line(points.bottomRight)
      .hide()

    paths.seam = new Path()
      .move(points.topRight)
      .join(paths.seamBase)
      .line(points.topRight)
      .close()
      .attr('class', 'fabric')

    // Seam allowance
    if (sa) {
      paths.sa = new Path()
        .move(points.topRight)
        .join(paths.seamBase.offset(sa))
        .line(points.bottomRight)
        .attr('class', 'fabric sa')
    }

    /*
     * Annotatinos
     */

    // Cut on fold
    macro('cutonfold', {
      from: points.bottomRight,
      to: points.topRight,
      grainline: false,
    })

    if (complete) {
      paths.foldLine = new Path()
        .move(points.midLeft)
        .line(points.midRight)
        .attr('class', 'note dashed')
        .attr('data-text', 'foldLine')
        .attr('data-text-class', 'note')
    }

    snippets.button5 = new Snippet('button', points.button5)

    store.cutlist.removeCut('fabric')
    store.cutlist.addCut({ cut: 1, from: 'fabric', onFold: true })

    points.title = points.topLeft.shiftFractionTowards(points.bottomRight, 0.5)
    macro('title', { nr: 13, title: 'waistband', at: points.title })

    points.wbGrainFrom = points.topLeft.shift(335, points.topLeft.dist(points.topRight) * 0.1)
    points.wbGrainTo = points.wbGrainFrom.copy()
    points.wbGrainTo.y = points.bottomLeft.y - (points.wbGrainFrom.y - points.topLeft.y)

    macro('grainline', {
      from: points.wbGrainFrom,
      to: points.wbGrainTo,
    })

    dim(part, [
      ['h', 'topLeft', 'topRight', 'topLeft', -15],
      ['v', 'bottomLeft', 'topLeft', 'topLeft', -15],
    ])

    return part
  },
}
