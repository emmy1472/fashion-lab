import { sleeve } from './sleeve.mjs'
import { dim } from './shared.mjs'

export const cuff = {
  name: 'devon.cuff',
  after: sleeve,
  hide: {
    self: false,
    from: true,
    inherited: true,
  },
  options: {
    // Constants
    // Parameters
  },
  draft: ({ Point, points, Path, paths, Snippet, snippets, macro, sa, complete, store, part }) => {
    for (const i in paths) {
      delete paths[i]
    }
    for (const i in points) {
      delete points[i]
    }

    const cuffLength = store.get('cuffLength')
    const cuffWidth = store.get('cuffWidth')

    points.topLeft = new Point(0, 0)
    points.topRight = new Point(cuffLength * 0.5, 0)
    points.bottomLeft = new Point(0, cuffWidth * 2)
    points.bottomRight = new Point(cuffLength * 0.5, cuffWidth * 2)

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

    points.button = points.topLeft.shift(0, cuffWidth * 0.5).shift(270, cuffWidth * 0.5)
    snippets.button = new Snippet('button', points.button)

    store.cutlist.addCut({ cut: 2, from: 'fabric', onFold: true })

    points.title = points.topLeft.shiftFractionTowards(points.bottomRight, 0.5)
    macro('title', { nr: 14, title: 'cuff', at: points.title, scale: 0.4 })

    points.cGrainFrom = points.topLeft.shift(335, points.topLeft.dist(points.topRight) * 0.3)
    points.cGrainTo = points.cGrainFrom.copy()
    points.cGrainTo.y = points.bottomLeft.y - (points.cGrainFrom.y - points.topLeft.y)

    macro('grainline', {
      from: points.cGrainFrom,
      to: points.cGrainTo,
    })

    if (complete) {
      points.midLeft = points.topLeft.shift(270, cuffWidth)
      points.midRight = points.topRight.shift(270, cuffWidth)
      paths.foldLine = new Path()
        .move(points.midLeft)
        .line(points.midRight)
        .attr('class', 'note dashed')
        .attr('data-text', 'foldLine')
        .attr('data-text-class', 'note')
    }

    dim(part, [
      ['h', 'topLeft', 'topRight', 'topLeft', -15],
      ['v', 'bottomLeft', 'topLeft', 'topLeft', -15],
    ])

    return part
  },
}
