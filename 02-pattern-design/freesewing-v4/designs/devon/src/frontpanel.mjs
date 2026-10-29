// import { front as brianFront } from '@freesewing/brian'
import { front } from './front.mjs'
import { dim } from './shared.mjs'

export const frontPanel = {
  name: 'devon.frontPanel',
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
    Snippet,
    snippets,
    macro,
    options,
    sa,
    store,
    complete,
    part,
  }) => {
    macro('rmcutonfold')
    for (const i in paths) {
      delete paths[i]
    }

    points.panelPocketTop = points.frontHemSidePanel.shiftFractionTowards(
      points.frontYokeSidePanel,
      options.pocketHeight
    )
    points.cfPocketBottom = points.cfHem.copy()
    points.cfPocketTop = points.cfPocketBottom.shiftFractionTowards(
      points.cfYoke,
      options.pocketHeight
    )

    macro('mirror', {
      clone: true,
      mirror: [points.frontHemSidePanel, points.frontYokeSidePanel],
      points: ['cfPocketBottom', 'cfPocketTop'],
    })

    if (options.frontPocket) {
      if (complete) {
        points.frontPocketTopSnippet = points.panelPocketTop.copy()
        points.frontPocketBottomSnippet = points.panelPocketTop.shiftFractionTowards(
          points.frontHemSidePanelSaved,
          options.frontPocketOpening
        )
        snippets.frontPocketTop = new Snippet('notch', points.frontPocketTopSnippet)
        snippets.frontPocketBottom = new Snippet('notch', points.frontPocketBottomSnippet)
        dim(part, [
          ['l', 'frontPocketTopSnippet', 'frontPocketBottomSnippet', 'frontPocketTopSnippet', -15],
          ['l', 'frontPocketBottomSnippet', 'frontHemSidePanelSaved', 'frontPocketTopSnippet', -15],
        ])
      }
      paths.pocket = new Path()
        .move(points.frontHemSidePanel)
        .line(points.mirroredCfPocketBottom)
        .line(points.mirroredCfPocketTop)
        .line(points.panelPocketTop)
        .hide()
    } else {
      paths.pocket = new Path().move(points.frontHemSidePanel).line(points.panelPocketTop).hide()
    }
    paths.seam = new Path()
      .move(points.frontHemSidePanel)
      .join(paths.pocket)
      .line(points.frontYokeSidePanel)
      .line(points.frontYokePanel)
      .line(points.frontHemPanel)
      .line(points.frontHemSidePanel)
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

    points.title = points.frontYokePanel
      .shiftFractionTowards(points.frontYokeSidePanel, 0.4)
      .shiftFractionTowards(
        points.frontHemPanel.shiftFractionTowards(points.frontHemSidePanel, 0.35),
        0.4
      )
    macro('title', { nr: 5, title: 'frontPanel', at: points.title, rotation: 90, scale: 0.75 })

    macro('grainline', {
      from: points.frontYokePanelMiddle,
      to: points.frontHemPanelMiddle,
    })

    points.frontPanelSnippet = points.frontHemSidePanelSaved.copy()
    snippets.frontPanel = new Snippet('notch', points.frontPanelSnippet)

    if (complete) {
      paths.pocketTopStitch = new Path()
        .move(points.pocketPanelLeft)
        .line(points.pocketBottomMiddle)
        .line(points.pocketPanelRight)
        .attr('class', 'lining dashed')
        .attr('data-text', 'topStitchLine')
        .attr('data-text-class', 'lining center')
    }

    dim(part, [
      ['h', 'frontYokePanel', 'frontYokeSidePanel', 'frontYokePanel', -15],
      ['h', 'frontHemPanel', 'frontHemSidePanel', 'frontHemPanel', 15],
      ['h', 'frontYokePanel', 'frontHemPanel', 'frontHemPanel', 15],
      ['h', 'frontHemSidePanel', 'frontYokeSidePanel', 'frontHemPanel', 15],
      ['v', 'frontHemPanel', 'frontYokePanel', 'frontYokePanel', -15],
      ['v', 'frontHemSidePanel', 'frontYokeSidePanel', 'frontYokeSidePanel', 15],
      ['v', 'frontHemPanel', 'frontHemSidePanel', 'frontYokeSidePanel', 15],
      ['v', 'frontHemPanel', 'frontHemSidePanel', 'frontYokeSidePanel', 15],
    ])
    if (options.frontPocket) {
      dim(part, [
        ['l', 'frontHemSidePanel', 'mirroredCfPocketBottom', 'mirroredCfPocketBottom', 15],
        ['l', 'mirroredCfPocketBottom', 'mirroredCfPocketTop', 'mirroredCfPocketBottom', -15],
        ['l', 'panelPocketTop', 'mirroredCfPocketTop', 'panelPocketTop', -15],
      ])
    }
    return part
  },
}
