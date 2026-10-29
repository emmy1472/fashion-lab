import { front } from './front.mjs'
import { dim } from './shared.mjs'

export const frontYoke = {
  name: 'devon.frontYoke',
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
  draft: ({
    points,
    Path,
    paths,
    macro,
    store,
    options,
    Snippet,
    snippets,
    sa,
    complete,
    part,
  }) => {
    macro('rmcutonfold')
    for (const i in paths) {
      if (['frontArmholeComplete', 'frontCollar'].indexOf(i) === -1) delete paths[i]
    }
    paths.frontYokeSeam = new Path()
      .move(points.frontYoke)
      .line(points.frontArmholeYoke)
      .attr('class', 'fabric')

    paths.frontYokeArmhole = paths.frontArmholeComplete.split(points.frontArmholeYoke)[1].hide()

    paths.seam = new Path()
      .move(points.frontArmholeYoke)
      .join(paths.frontYokeArmhole)
      .line(points.s3CollarSplit)
      .join(paths.frontCollar)
      .line(points.frontNeck)
      .line(points.frontYoke)
      .join(paths.frontYokeSeam)
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

    snippets.button1 = new Snippet('button', points.button1)

    if (complete) {
      paths.stitchLine = new Path()
        .move(points.facingYoke)
        .curve(points.facingYokeCp1, points.facingCollarCp2, points.facingCollar)
        .attr('class', 'lining dashed')
        .attr('data-text', 'topStitchLine')
        .attr('data-text-class', 'lining center')
      dim(part, [['h', 'frontNeck', 'button1', 'button1', 0]])
    }

    points.frontEndOfCollar = paths.frontCollar
      .reverse()
      .shiftAlong(store.get('collarLength') * options.collarLengthRatio)
    snippets.frontEndOfCollar = new Snippet('notch', points.frontEndOfCollar)

    points.title = points.s3CollarSplit
      .shiftFractionTowards(points.frontArmholeYoke, 0.4)
      .shiftFractionTowards(points.frontYoke, 0.45)
    macro('title', { nr: 7, title: 'frontYoke', at: points.title })

    points.fyGrainFrom = points.s3CollarSplit.shift(
      330,
      points.s3CollarSplit.dist(points.s3ArmholeSplit) * 0.35
    )
    points.fyGrainTo = points.fyGrainFrom.copy()
    points.fyGrainTo.y = points.frontYoke.y - (points.fyGrainFrom.y - points.s3CollarSplit.y) * 1.5

    macro('grainline', {
      from: points.fyGrainFrom,
      to: points.fyGrainTo,
    })

    dim(part, [
      ['h', 'frontNeck', 's3CollarSplit', 's3CollarSplit', -15],
      ['h', 's3CollarSplit', 's3ArmholeSplit', 's3CollarSplit', -15],
      ['h', 'frontYoke', 'step1frontArmholeYoke', 'frontYoke', 15],
      ['h', 'frontYoke', 'frontEndOfCollar', 'frontNeck', -15],
      ['h', 'step1frontArmholeYoke', 's3ArmholeSplit', 'frontYoke', 15],
      ['v', 'frontNeck', 's3CollarSplit', 'frontNeck', -15],
      ['v', 'frontYoke', 'frontNeck', 'frontNeck', -15],
    ])

    return part
  },
}
