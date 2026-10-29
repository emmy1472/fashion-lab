import { back } from './back.mjs'
import { dim } from './shared.mjs'

export const backPanel = {
  name: 'devon.backPanel',
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
      delete paths[i]
    }

    paths.seamBase = new Path()
      .move(points.cbHem)
      .line(points.backHemPanel)
      .line(points.backYokePanel)
      .line(points.backYokePanel)
      .line(points.cbYoke)

    paths.seam = paths.seamBase.clone().line(points.cbHem).close().attr('class', 'fabric')

    paths.seamBase.hide()

    // Seam allowance
    if (sa) {
      paths.sa = new Path()
        .move(points.cbHem)
        .join(paths.seamBase.offset(sa))
        .line(points.cbYoke)
        .attr('class', 'fabric sa')
    }

    /*
     * Annotatinos
     */

    // Cut on fold
    macro('cutonfold', {
      from: points.cbYoke,
      to: points.cbHem,
      grainline: true,
    })

    // Cut list
    store.cutlist.addCut({ cut: 1, from: 'fabric', onFold: true })

    points.title = points.backYokePanel.shiftFractionTowards(points.cbChest, 0.6)
    macro('title', { nr: 1, title: 'backPanel', at: points.title, rotation: 90, scale: 0.75 })

    dim(part, [
      ['h', 'cbYoke', 'backYokePanel', 'cbYoke', -15],
      ['h', 'cbHem', 'backHemPanel', 'cbHem', 15],
      ['v', 'cbHem', 'cbYoke', 'cbYoke', -15],
    ])

    return part
  },
}
