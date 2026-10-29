import { collar } from './collar.mjs'
import { dim } from './shared.mjs'

export const upperCollar = {
  name: 'devon.upperCollar',
  from: collar,
  hide: {
    self: false,
    from: true,
    inherited: true,
  },
  options: {
    // Constants
    // Parameters
  },
  draft: ({ points, Path, paths, macro, store, sa, snippets, Snippet, complete, part }) => {
    paths.seamBase = new Path()
      .move(points.upperCollarWaveBottom)
      .curve(
        points.upperCollarWaveBottomCp1,
        points.upperCollarBottomWaveCp2,
        points.upperCollarBottomWave
      )
      .curve(
        points.upperCollarBottomWaveCp1,
        points.upperCollarWaveBottomBack,
        points.upperCollarWaveBottomBack
      )
      .line(points.upperCollarTopRight)
      .curve(points.upperCollarTopRight, points.upperCollarTopLeftCp2, points.upperCollarTopLeft)
      .hide()

    paths.seam = new Path()
      .move(points.upperCollarWaveBottom)
      .join(paths.seamBase)
      .line(points.upperCollarWaveBottom)
      .close()
      .attr('class', 'fabric')

    // Seam allowance
    if (sa) {
      paths.sa = new Path()
        .move(points.upperCollarWaveBottom)
        .join(paths.seamBase.offset(sa))
        .line(points.upperCollarWaveBottom)
        .attr('class', 'fabric sa')
    }

    /*
     * Annotations
     */
    points.title = points.upperCollarTopLeft.shiftFractionTowards(
      points.upperCollarBottomRight,
      0.5
    )
    macro('title', { nr: 15, title: 'upperCollar', at: points.title })

    // Cut on fold
    macro('cutonfold', {
      from: points.upperCollarTopLeft,
      to: points.upperCollarWaveBottom,
      grainline: true,
    })

    // Cut list
    store.cutlist.addCut({ cut: 1, from: 'fabric', onFold: true })

    dim(part, [
      ['h', 'upperCollarTopLeft', 'upperCollarTopRight', 'upperCollarTopLeft', -15],
      ['h', 'upperCollarWaveBottom', 'upperCollarWaveBottomBack', 'upperCollarWaveBottomBack', 15],
      ['v', 'upperCollarWaveBottom', 'upperCollarTopLeft', 'upperCollarTopLeft', -15],
    ])
    points.title = points.upperCollarTopLeft.shiftFractionTowards(
      points.upperCollarBottomRight,
      0.5
    )
    macro('title', { nr: 15, title: 'upperCollar', at: points.title, scale: 0.5 })

    points.shoulderMarking = paths.seamBase.shiftAlong(
      store.get('collarLengthBack') * store.get('collarUpperUnderRatio')
    )
    snippets.shoulderMarking = new Snippet('notch', points.shoulderMarking)
    points.facingMarking = paths.seamBase.shiftAlong(
      store.get('facingLengthFromBack') * store.get('collarUpperUnderRatio')
    )
    snippets.facingMarking = new Snippet('bnotch', points.facingMarking)
    if (complete) {
      dim(part, [
        ['h', 'upperCollarBottomLeft', 'facingMarking', 'upperCollarWaveBottomBack', 25],
        ['h', 'upperCollarBottomLeft', 'shoulderMarking', 'upperCollarWaveBottomBack', 35],
      ])
    }

    return part
  },
}
