import { pocket } from './pocket.mjs'
import { dim } from './shared.mjs'

export const pocketflap = {
  name: 'devon.pocketflap',
  from: pocket,
  hide: {
    self: false,
    from: false,
    inherited: true,
  },
  options: {
    // Constants
    pocketflapHeightRatio: 6.5 / 12,
    pocketflapSideHeightRatio: 3.5 / 12,
    pocketflapMagnifier: 1.01,
    // Parameters
  },
  draft: ({ points, Path, paths, macro, options, store, sa, part }) => {
    const pocketWidth = store.get('pocketWidth')

    points.pocketflapTopLeft = points.pocketTopRight.shiftFractionTowards(
      points.pocketTopLeft,
      options.pocketflapMagnifier
    )
    points.pocketflapTopRight = points.pocketTopLeft.shiftFractionTowards(
      points.pocketTopRight,
      options.pocketflapMagnifier
    )
    points.pocketflapBottomLeft = points.pocketflapTopLeft.shift(
      270,
      pocketWidth * options.pocketflapSideHeightRatio
    )
    points.pocketflapBottomRight = points.pocketflapTopRight.shift(
      270,
      pocketWidth * options.pocketflapSideHeightRatio
    )
    points.pocketflapBottomMiddle = points.pocketflapTopLeft
      .shiftFractionTowards(points.pocketflapTopRight, 0.5)
      .shift(270, pocketWidth * options.pocketflapHeightRatio * options.pocketflapMagnifier)

    paths.seam = new Path()
      .move(points.pocketflapTopLeft)
      .line(points.pocketflapBottomLeft)
      .line(points.pocketflapBottomMiddle)
      .line(points.pocketflapBottomRight)
      .line(points.pocketflapTopRight)
      .line(points.pocketflapTopLeft)
      .close()
      .attr('class', 'fabric')

    // Seam allowance
    if (sa) {
      paths.sa = paths.seam.offset(sa).attr('class', 'fabric sa')
    }

    /*
     * Annotatinos
     */
    macro('rmgrainline')

    store.cutlist.removeCut('fabric')
    store.cutlist.addCut({ cut: 4, from: 'fabric', onFold: false })

    points.title = points.pocketflapTopLeft.shiftFractionTowards(points.pocketflapBottomMiddle, 0.4)
    macro('title', { nr: 11, title: 'pocketflap', at: points.title, scale: 0.5 })

    points.pfGrainTo = points.pocketflapBottomMiddle.copy()
    points.pfGrainTo.y =
      points.pocketflapBottomMiddle.y -
      (points.pocketflapBottomMiddle.y - points.pocketflapBottomLeft.y) * 0.3
    points.pfGrainFrom = points.pfGrainTo.copy()
    points.pfGrainFrom.y =
      points.pocketTopLeft.y -
      (points.pocketflapBottomLeft.y - points.pocketflapBottomMiddle.y) * 0.3

    macro('grainline', {
      from: points.pfGrainFrom,
      to: points.pfGrainTo,
    })

    macro('rmad')

    dim(part, [
      ['h', 'pocketflapTopLeft', 'pocketflapTopRight', 'pocketflapTopLeft', -15],
      ['v', 'pocketflapBottomLeft', 'pocketflapTopLeft', 'pocketflapTopLeft', -15],
      ['v', 'pocketflapBottomMiddle', 'pocketflapTopRight', 'pocketflapTopRight', 15],
    ])

    return part
  },
}
