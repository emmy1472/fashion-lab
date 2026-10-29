// import { front as brianFront } from '@freesewing/brian'
import { front } from './front.mjs'
import { dim } from './shared.mjs'

export const frontInside = {
  name: 'devon.frontInside',
  from: front,
  hide: {
    self: false,
    from: true,
    inherited: true,
  },
  options: {
    // Constants
    // Parameters
  },
  draft: ({ points, Path, paths, Snippet, snippets, macro, store, sa, complete, part }) => {
    macro('rmcutonfold')
    for (const i in paths) {
      delete paths[i]
    }

    const waistbandWidth = store.get('waistbandWidth')
    points.stitchTop = points.frontYoke.shift(0, waistbandWidth)
    points.stitchBottom = points.frontHem.shift(0, waistbandWidth)

    paths.seam = new Path()
      .move(points.frontHemPanel)
      .line(points.frontYokePanel)
      .line(points.frontYoke)
      .line(points.frontHem)
      .line(points.frontHemPanel)
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

    snippets.button2 = new Snippet('button', points.button2)
    snippets.button3 = new Snippet('button', points.button3)
    snippets.button4 = new Snippet('button', points.button4)

    if (sa) {
      points.pocketSnip = points.pocketTopLeft
        .shiftFractionTowards(points.frontYokePanel, 0.5)
        .shift(270, sa * 0.5)
      snippets.pocketSnip = new Snippet('notch', points.pocketSnip)
    }

    if (complete) {
      paths.pocketTopStitch = new Path()
        .move(points.pocketPanelLeft)
        .line(points.pocketBottomLeft)
        .line(points.pocketTopLeft)
        .attr('class', 'lining dashed')
        .attr('data-text', 'topStitchLine')
        .attr('data-text-class', 'lining center')

      paths.stitchLine = new Path()
        .move(points.stitchTop)
        .line(points.stitchBottom)
        .attr('class', 'lining dashed')
        .attr('data-text', 'topStitchLine')
        .attr('data-text-class', 'lining center')
      dim(part, [['h', 'stitchTop', 'frontYokePanel', 'frontYoke', -25]])
    }

    points.title = points.stitchTop.shiftFractionTowards(points.stitchBottom, 0.25)
    macro('title', { nr: 4, title: 'frontInside', at: points.title, rotation: 90, scale: 0.75 })

    macro('grainline', {
      from: points.frontYoke.shiftFractionTowards(points.stitchTop, 0.25),
      to: points.frontHem.shiftFractionTowards(points.stitchBottom, 0.25),
    })

    dim(part, [
      ['h', 'frontYoke', 'frontYokePanel', 'frontYoke', -15],
      ['h', 'frontHem', 'frontHemPanel', 'frontHem', 15],
      ['h', 'frontYokePanel', 'frontHemPanel', 'frontYoke', -15],
      ['v', 'frontHem', 'frontYoke', 'frontYoke', -15],
      ['v', 'frontHemPanel', 'frontYokePanel', 'frontHemPanel', 15],
      ['v', 'frontHem', 'frontHemPanel', 'frontHemPanel', 15],
    ])

    return part
  },
}
