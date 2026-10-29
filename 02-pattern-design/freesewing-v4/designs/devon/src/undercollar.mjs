import { collar } from './collar.mjs'
import { dim } from './shared.mjs'

export const underCollar = {
  name: 'devon.underCollar',
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
      .move(points.underCollarWaveBottom)
      .curve(
        points.underCollarWaveBottomCp1,
        points.underCollarBottomWaveCp2,
        points.underCollarBottomWave
      )
      .curve(
        points.underCollarBottomWaveCp1,
        points.underCollarWaveBottomBack,
        points.underCollarWaveBottomBack
      )
      .line(points.underCollarTopRight)
      .curve(points.underCollarTopRight, points.underCollarTopLeftCp2, points.underCollarTopLeft)
      .hide()

    paths.seam = new Path()
      .move(points.underCollarWaveBottom)
      .join(paths.seamBase)
      .line(points.underCollarTopLeft)
      .close()
      .attr('class', 'fabric')

    // Seam allowance
    if (sa) {
      paths.sa = new Path()
        .move(points.underCollarWaveBottom)
        .join(paths.seamBase.offset(sa))
        .line(points.underCollarWaveBottom)
        .attr('class', 'fabric sa')
    }

    /*
     * Annotations
     */
    // Cut on fold
    macro('cutonfold', {
      from: points.underCollarTopLeft,
      to: points.underCollarWaveBottom,
      grainline: true,
    })

    // Cut list
    store.cutlist.addCut({ cut: 1, from: 'fabric', onFold: true })

    points.title = points.underCollarTopLeft.shiftFractionTowards(
      points.underCollarBottomRight,
      0.5
    )
    macro('title', { nr: 16, title: 'underCollar', at: points.title, scale: 0.5 })

    dim(part, [
      ['h', 'underCollarTopLeft', 'underCollarTopRight', 'underCollarTopLeft', -15],
      ['h', 'underCollarWaveBottom', 'underCollarWaveBottomBack', 'underCollarWaveBottomBack', 15],
      ['v', 'underCollarWaveBottom', 'underCollarTopLeft', 'underCollarTopLeft', -15],
    ])

    points.shoulderMarking = paths.seamBase.shiftAlong(store.get('collarLengthBack'))
    snippets.shoulderMarking = new Snippet('notch', points.shoulderMarking)
    points.facingMarking = paths.seamBase.shiftAlong(store.get('facingLengthFromBack'))
    snippets.facingMarking = new Snippet('bnotch', points.facingMarking)
    if (complete) {
      dim(part, [
        ['h', 'underCollarBottomLeft', 'facingMarking', 'underCollarWaveBottomBack', 25],
        ['h', 'underCollarBottomLeft', 'shoulderMarking', 'underCollarWaveBottomBack', 35],
      ])
    }

    return part
  },
}
