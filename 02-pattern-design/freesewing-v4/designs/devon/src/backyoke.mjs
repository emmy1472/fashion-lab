import { back } from './back.mjs'
import { dim } from './shared.mjs'

export const backYoke = {
  name: 'devon.backYoke',
  from: back,
  hide: {
    self: false,
    from: true,
    inherited: true,
  },
  options: {
    // Constants
    // Parameters
  },
  draft: ({ points, Path, paths, macro, sa, store, part }) => {
    macro('rmcutonfold')
    for (const i in paths) {
      if (['backArmholeComplete', 'backCollar', 'backCollarS3'].indexOf(i) === -1) delete paths[i]
    }

    paths.backYokeSeam = new Path()
      .move(points.cbYoke)
      .line(points.backArmholeYoke)
      .attr('class', 'fabric')
      .hide()

    paths.backYokeArmhole = paths.backArmholeComplete.split(points.backArmholeYoke)[1].hide()

    paths.seamBase = new Path()
      .move(points.cbYoke)
      .join(paths.backYokeSeam)
      .join(paths.backYokeArmhole)
      .join(paths.backCollarS3)
      .join(paths.backCollar)
      .hide()

    paths.seam = paths.seamBase.clone().line(points.cbYoke).close().attr('class', 'fabric').unhide()

    // Seam allowance
    if (sa) {
      paths.sa = new Path()
        .move(points.cbYoke)
        .join(paths.seamBase.offset(sa))
        .line(points.cbNeck)
        .attr('class', 'fabric sa')
    }

    /*
     * Annotatinos
     */
    macro('cutonfold', {
      from: points.cbNeck,
      to: points.cbYoke,
      grainline: true,
    })

    store.cutlist.addCut({ cut: 1, from: 'fabric', onFold: true })

    points.title = points.backArmholeYoke
      .shiftFractionTowards(points.cbNeck, 0.7)
      .shiftFractionTowards(points.cbYoke, 0.2)
    macro('title', { nr: 3, title: 'backYoke', at: points.title })

    dim(part, [
      ['h', 'cbYoke', 'backArmholeYoke', 'cbYoke', 15],
      ['h', 'cbNeck', 's3CollarSplit', 's3CollarSplit', -15],
      ['h', 's3CollarSplit', 's3ArmholeSplit', 's3CollarSplit', -15],
      ['v', 'cbYoke', 'cbNeck', 'cbYoke', -15],
      ['v', 'cbNeck', 's3CollarSplit', 'cbNeck', -15],
      ['v', 's3ArmholeSplit', 's3CollarSplit', 's3ArmholeSplit', 15],
      ['v', 'backArmholeYoke', 's3CollarSplit', 's3ArmholeSplit', 15],
    ])

    return part
  },
}
