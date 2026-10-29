import { sleeve } from './sleeve.mjs'
import { dim } from './shared.mjs'
import { back } from './back.mjs'

export const topSleeve = {
  name: 'devon.topSleeve',
  from: sleeve,
  after: back,
  draft: ({ macro, points, Path, paths, snippets, Snippet, sa, store, complete, part }) => {
    // Extract seamline from sleeve
    delete paths.us
    delete paths.underSleeve
    paths.seam = paths.topSleeve.clone().attr('class', 'fabric', true)
    delete paths.ts
    delete paths.topSleeve

    // Seam allowance
    if (sa) {
      paths.sa = paths.seam.offset(sa).addClass('fabric sa')
    }

    /*
     * Annotations
     */
    // Cut list
    store.cutlist.addCut({ cut: 2, from: 'fabric' })

    // Scalebox
    macro('scalebox', { at: points.elbowCenter })

    // Logo
    snippets.logo = new Snippet('logo', points.elbowCenter.shift(90, 50))

    // Title
    macro('title', {
      at: points.armCenter.shiftFractionTowards(points.top, 0.5),
      nr: 8,
      title: 'topSleeve',
      rotation: 90,
    })

    points.tsGrainFrom = points.usTip.copy()
    points.tsGrainTo = points.tsGrainFrom.copy()
    points.tsGrainTo.y = points.tsSlitRight.y

    macro('grainline', {
      from: points.tsGrainFrom,
      to: points.tsGrainTo,
    })

    if (complete) {
      paths.topSleeveText = new Path()
        .move(points.top)
        .curve(points.topCpLeft, points.frontPitchPointCpTop, points.frontPitchPoint)
        .curve(points.frontPitchPointCpBottom, points.tsLeftEdgeCpRight, points.tsLeftEdge)
        .attr('class', 'hidden')
        .attr('data-text', 'front')
        .attr('data-text-class', 'note center')

      points.s3 = paths.topSleeveText.shiftAlong(store.get('sss'))

      snippets.s3 = new Snippet('notch', points.s3)
    }

    dim(part, [
      ['h', 'tsLeftEdge', 'backPitchPoint', 'top', -30],
      ['h', 'tsLeftEdge', 'elbowRight', 'tsCuffRight', 60],
      ['h', 'tsLeftEdge', 'top', 'top', -15],
      ['h', 'tsLeftEdge', 'tsCuffLeft', 'tsCuffRight', 30],
      ['h', 'tsLeftEdge', 'tsCuffRight', 'tsCuffRight', 45],
      ['h', 'tsLeftEdge', 'tsElbowLeft', 'tsCuffRight', 15],
      ['h', 'tsLeftEdge', 'tsRightEdge', 'top', -45],
      ['v', 'tsCuffLeft', 'tsLeftEdge', 'tsLeftEdge', -30],
      ['v', 'tsCuffRight', 'tsLeftEdge', 'tsLeftEdge', -45],
      ['v', 'tsElbowLeft', 'tsLeftEdge', 'tsLeftEdge', -15],
      ['v', 'tsLeftEdge', 'top', 'tsLeftEdge', -15],
      ['v', 'tsRightEdge', 'backPitchPoint', 'tsRightEdge', 15],
      ['l', 'tsCuffLeft', 'tsCuffRight', 'tsCuffRight', 15],
      ['l', 'tsElbowLeft', 'elbowRight', 'elbowRight', 0],
      ['l', 'tsLeftEdge', 'tsRightEdge', 'tsRightEdge', 0],
    ])
    if (sa) {
      dim(part, [
        ['l', 'tsSlit', 'tsSlitRight', 'tsSlitRight', -15],
        ['l', 'tsCuffRight', 'tsSlitRight', 'tsSlitRight', -15],
      ])
    }

    return part
  },
}
