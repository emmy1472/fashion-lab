import { back } from './back.mjs'
import { dim } from './shared.mjs'

export const backSide = {
  name: 'devon.backSide',
  from: back,
  hide: {
    self: false,
    from: true,
    inherited: true,
  },
  options: {
    // Constants
    backArmholeShift: 0.02,
    // Parameters
  },
  draft: ({ points, Path, paths, options, macro, sa, store, part }) => {
    macro('rmcutonfold')
    for (const i in paths) {
      if (['backArmholeComplete'].indexOf(i) === -1) delete paths[i]
    }

    const downShift = options.backArmholeShift * points.cbYoke.dist(points.backArmholeYoke)

    paths.backYokeArmhole = paths.backArmholeComplete
      .split(points.backArmholeYoke)[0]
      .translate(0, downShift)
      .hide()

    const trans = ['hem', 'backArmholeYoke']
    for (let p of trans) {
      points[p] = points[p].translate(0, downShift)
    }

    points.backYokePanelCp1 = points.backYokePanel.shift(
      0,
      points.backYokePanel.dist(points.backArmholeYoke) * 0.5
    )

    points.backYokeArmhole = paths.backYokeArmhole.start()

    paths.seam = new Path()
      .move(points.backArmholeYoke)
      .curve(points.backArmholeYoke, points.backYokePanelCp1, points.backYokePanel)
      .line(points.backHemPanel)
      .line(options.waistAdjustment ? points.hemBack : points.hemBackOriginal)
      .join(paths.backYokeArmhole)
      .close()
      .attr('class', 'fabric')

    // Seam allowance
    if (sa) {
      paths.sa = paths.seam.offset(sa).attr('class', 'fabric sa')
    }

    /*
     * Annotatinos
     */

    store.cutlist.addCut({ cut: 2, from: 'fabric', onFold: false })

    points.title = points.backYokePanel.shiftFractionTowards(points.hem, 0.3)
    macro('title', { nr: 2, title: 'backSide', at: points.title, rotation: 90, scale: 0.75 })
    points.bsGrainFrom = points.backYokePanel.shift(
      315,
      points.backYokePanel.dist(points.backArmholeYoke) * 0.1
    )
    points.bsGrainTo = points.bsGrainFrom.copy()
    points.bsGrainTo.y = points.backHemPanel.y - (points.backYokePanel.y - points.bsGrainFrom.y)

    macro('grainline', {
      from: points.bsGrainFrom,
      to: points.bsGrainTo,
    })

    dim(part, [
      ['h', 'backHemPanel', 'backYokePanel', 'backYokePanel', -15],
      ['h', 'backYokePanel', 'backArmholeYoke', 'backYokePanel', -15],
      ['h', 'backArmholeYoke', 'backYokeArmhole', 'backYokePanel', -15],
      ['v', 'backHemPanel', 'backYokePanel', 'backHemPanel', -15],
      ['v', 'backArmholeYoke', 'backYokePanel', 'backYokePanel', -15],
      ['v', 'backYokeArmhole', 'backYokePanel', 'backYokeArmhole', 15],
    ])
    if (options.waistAdjustment) {
      dim(part, [
        ['h', 'backHemPanel', 'hemBack', 'backHemPanel', 15],
        ['h', 'hemBack', 'backYokeArmhole', 'hemBack', 15],
      ])
    } else {
      dim(part, [
        ['h', 'backHemPanel', 'hemBackOriginal', 'backHemPanel', 15],
        ['h', 'hemBackOriginal', 'backYokeArmhole', 'hemBackOriginal', 15],
      ])
    }
    store.set(
      'hemBackLength',
      points.cbHem.dist(options.waistAdjustment ? points.hemBack : points.hemBackOriginal)
    )

    return part
  },
}
