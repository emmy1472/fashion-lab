// import { utils } from 'mocha'
import { backSide } from './backside.mjs'
import { front } from './front.mjs'
import { frontPanel } from './frontpanel.mjs'
import { dim } from './shared.mjs'

export const frontSidePanel = {
  name: 'devon.frontSidePanel',
  from: front,
  after: [frontPanel, backSide],
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
    store,
    options,
    utils,
    sa,
    complete,
    part,
  }) => {
    macro('rmcutonfold')
    for (const i in paths) {
      if (['frontSidePanelArmhole'].indexOf(i) === -1) delete paths[i]
    }

    const upShift = store.get('frontSidePanelUpshift')
    const sidePanelLength = store.get('sidePanelLength')
    const useFBA = store.get('useFBA')
    let angleFBA = 0

    points.frontYokeSidePanelCP1 = points.frontYokeSidePanel.shift(
      0,
      points.frontYokeSidePanel.dist(points.frontArmholeYoke) * 0.5
    )
    if (useFBA) {
      points.frontYokeSidePanelCp2 = points.frontYokeSidePanel.shiftFractionTowards(
        points.frontSidePanelBustPoint1,
        1.1
      )
      points.frontHemSidePanelCp1 = points.frontHemSidePanelSaved.shiftFractionTowards(
        points.frontSidePanelBustPoint1,
        1.1
      )
      angleFBA =
        points.frontHemSidePanelSaved.angle(
          new Path()
            .move(points.frontHemSidePanelSaved)
            .curve(
              points.frontHemSidePanelCp1,
              points.frontYokeSidePanelCp2,
              points.frontYokeSidePanel
            )
            .shiftAlong(2)
        ) - points.frontHemSidePanel.angle(points.frontYokeSidePanel)

      points.frontHemSidePanelCp2 = points.frontHemSidePanelSaved.shift(
        angleFBA,
        points.frontHemSidePanelSaved.dist(points.hem) * 0.3
      )
    }

    paths.frontSidePanelArmhole = paths.frontSidePanelArmhole.translate(0, upShift)
    points.armhole = points.armhole.translate(0, upShift)
    points.hem = points.hem.translate(0, upShift)
    points.frontArmholeYoke = points.frontArmholeYoke.translate(0, upShift)

    let iter = 0
    let diff = 0
    let angle = 1.5
    do {
      points.frontYokeSidePanel = points.frontYokeSidePanel.rotate(angle, points.hem)
      if (useFBA) {
        diff =
          sidePanelLength -
          new Path()
            .move(points.frontYokeSidePanel)
            .curve(
              points.frontYokeSidePanelCp2,
              points.frontHemSidePanelCp1,
              points.frontHemSidePanelSaved
            )
            .length()
      } else {
        diff = sidePanelLength - points.frontYokeSidePanel.dist(points.frontHemSidePanelSaved)
      }
      if (diff > 0) {
        angle = Math.abs(angle) * -0.7
      } else angle = Math.abs(angle) * 0.6
    } while (iter++ < 100 && (diff > 1 || diff < -1))

    if (useFBA) {
      paths.sidePanelHem = new Path()
        .move(points.frontYokeSidePanel)
        .curve(
          points.frontYokeSidePanelCp2,
          points.frontHemSidePanelCp1,
          points.frontHemSidePanelSaved
        )
        .hide()

      const pocketPanelRightLength = points.pocketPanelRight.dist(points.frontYokeSidePanel)

      points.pocketPanelRight = paths.sidePanelHem.shiftFractionAlong(
        pocketPanelRightLength / points.frontYokeSidePanel.dist(points.frontHemSidePanel)
      )
      let pTemp = points.pocketPanelRight.shift(
        points.pocketBottomMiddle.angle(points.pocketBottomRight) +
          270 -
          points.frontYokeSidePanel.angle(points.frontHemSidePanel) +
          paths.sidePanelHem.angleAt(points.pocketPanelRight) +
          90,
        200
      )
      points.pocketBottomRight = utils.beamIntersectsCircle(
        points.pocketTopRight,
        points.pocketTopRight.dist(points.pocketBottomRight),
        points.pocketPanelRight,
        pTemp
      )[0]

      points.panelPocketTop = paths.sidePanelHem
        .reverse()
        .shiftAlong(options.pocketHeight * sidePanelLength)
      points.cfPocketBottom = points.cfHem.rotate(angleFBA, points.frontHemSidePanelSaved)
      points.cfPocketTop = points.cfPocketBottom.shift(
        90 + angleFBA,
        points.cfHem.dist(points.cfYoke) * options.pocketHeight
      )

      if (options.frontPocket) {
        paths.sidePanelHem = paths.sidePanelHem.split(points.panelPocketTop)[0]
        paths.pocket = new Path()
          .move(points.panelPocketTop)
          .line(points.cfPocketTop)
          .line(points.cfPocketBottom)
          .line(points.frontHemSidePanelSaved)
      } else {
        paths.pocket = new Path().move(points.frontHemSidePanelSaved).hide()
      }

      paths.seam = new Path()
        .move(points.frontHemSidePanelSaved)
        .curve(points.frontHemSidePanelCp2, points.hem, points.hem)
        .line(points.armhole)
        .join(paths.frontSidePanelArmhole)
        .curve(points.frontArmholeYoke, points.frontYokeSidePanelCP1, points.frontYokeSidePanel)
        .join(paths.sidePanelHem)
        .join(paths.pocket)
        .close()
        .attr('class', 'fabric')

      points.sidePanelLeft = paths.sidePanelHem.edge('left')
    } else {
      points.panelPocketTop = points.frontHemSidePanelSaved.shiftFractionTowards(
        points.frontYokeSidePanel,
        options.pocketHeight
      )
      points.cfPocketBottom = points.cfHem.copy()
      points.cfPocketTop = points.cfPocketBottom.shiftFractionTowards(
        points.cfYoke,
        options.pocketHeight
      )

      if (options.frontPocket) {
        paths.pocket = new Path()
          .move(points.panelPocketTop)
          .line(points.cfPocketTop)
          .line(points.cfPocketBottom)
          .line(points.frontHemSidePanelSaved)
          .hide()
      } else {
        paths.pocket = new Path()
          .move(points.panelPocketTop)
          .line(points.frontHemSidePanelSaved)
          .hide()
      }

      paths.seam = new Path()
        .move(points.panelPocketTop)
        .join(paths.pocket)
        .line(options.waistAdjustment ? points.hem : points.hemOriginal)
        // .line(points.hem)
        .line(points.armhole)
        .join(paths.frontSidePanelArmhole)
        .curve(points.frontArmholeYoke, points.frontYokeSidePanelCP1, points.frontYokeSidePanel)
        .line(points.panelPocketTop)
        .close()
        .attr('class', 'fabric')
    }

    // Seam allowance
    if (sa) {
      paths.sa = paths.seam.offset(sa).attr('class', 'fabric sa')
    }

    /*
     * Annotatinos
     */
    store.cutlist.addCut({ cut: 2, from: 'fabric', onFold: false })

    points.title = points.frontYokeSidePanel.shiftFractionTowards(points.hem, 0.3)
    macro('title', { nr: 6, title: 'frontSidePanel', at: points.title, rotation: 90, scale: 0.75 })

    points.fsGrainFrom = points.frontYokeSidePanel.shift(
      315,
      points.frontYokePanel.dist(points.step1frontArmholeYoke) * 0.5
    )
    points.fsGrainTo = points.fsGrainFrom.copy()
    points.fsGrainTo.y =
      points.frontHemPanel.y - (points.fsGrainFrom.y - points.frontYokeSidePanel.y)

    macro('grainline', {
      from: points.fsGrainFrom,
      to: points.fsGrainTo,
    })

    points.frontPanelSnippet = points.frontHemSidePanelSaved.copy()
    snippets.frontPanel = new Snippet('notch', points.frontPanelSnippet)

    if (sa) {
      points.pocketSnip = points.pocketTopRight
        .shiftFractionTowards(points.frontYokeSidePanel, 0.5)
        .shift(270, sa * 0.5)
      snippets.pocketSnip = new Snippet('notch', points.pocketSnip)
    }

    if (complete) {
      paths.pocketTopStitch = new Path()
        .move(points.pocketPanelRight)
        .line(points.pocketBottomRight)
        .line(points.pocketTopRight)
        .attr('class', 'lining dashed')
        .attr('data-text', 'topStitchLine')
        .attr('data-text-class', 'lining center')
    }

    dim(part, [
      ['h', 'frontYokeSidePanel', 'frontArmholeYoke', 'frontYokeSidePanel', -15],
      ['h', 'frontArmholeYoke', 'armhole', 'frontYokeSidePanel', -15],
      ['h', 'frontHemSidePanelSaved', 'frontYokeSidePanel', 'frontYokeSidePanel', -15],
      ['v', 'frontHemSidePanelSaved', 'frontYokeSidePanel', 'frontHemSidePanelSaved', -15],
      ['v', 'armhole', 'frontArmholeYoke', 'armhole', 15],
      ['v', 'frontArmholeYoke', 'frontYokeSidePanel', 'armhole', 15],
    ])
    console.log({ hemBackLength: store.get('hemBackLength') })
    if (options.waistAdjustment) {
      dim(part, [
        ['h', 'frontHemSidePanelSaved', 'hem', 'frontHemSidePanelSaved', 15],
        ['h', 'hem', 'armhole', 'frontHemSidePanelSaved', 15],
        ['v', 'hem', 'armhole', 'armhole', 15],
        ['v', 'frontHemSidePanelSaved', 'hem', 'armhole', 15],
      ])
      store.set(
        'hemLength',
        points.frontHemSidePanelSaved.dist(points.hem) +
          points.frontHemSidePanelSaved.dist(points.frontHem) +
          store.get('hemBackLength')
      )
    } else {
      dim(part, [
        ['h', 'frontHemSidePanelSaved', 'hemOriginal', 'frontHemSidePanelSaved', 15],
        ['v', 'hemOriginal', 'armhole', 'armhole', 15],
      ])
      store.set('hemLength', points.hemOriginal.dist(points.frontHem) + store.get('hemBackLength'))
      console.log({
        f1: points.hemOriginal.dist(points.frontHem),
        f2: store.get('hemBackLength'),
      })
    }
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
          ['l', 'frontPocketTopSnippet', 'frontPocketBottomSnippet', 'frontPocketTopSnippet', 15],
          ['l', 'frontPocketBottomSnippet', 'frontHemSidePanelSaved', 'frontPocketTopSnippet', 15],
        ])
      }
      dim(part, [
        ['h', 'frontHemSidePanelSaved', 'panelPocketTop', 'panelPocketTop', 15],
        ['l', 'cfPocketTop', 'panelPocketTop', 'cfPocketTop', 15],
        ['l', 'cfPocketBottom', 'frontHemSidePanelSaved', 'frontHemSidePanelSaved', 15],
        ['l', 'cfPocketBottom', 'cfPocketTop', 'cfPocketTop', 15],
        ['l', 'frontHemSidePanelSaved', 'panelPocketTop', 'frontHemSidePanelSaved', 0],
      ])
    }
    if (useFBA) {
      dim(part, [
        ['h', 'sidePanelLeft', 'frontYokeSidePanel', 'frontYokeSidePanel', -15],
        ['v', 'frontHemSidePanelSaved', 'frontYokeSidePanel', 'sidePanelLeft', -15],
        ['v', 'frontHemSidePanelSaved', 'sidePanelLeft', 'sidePanelLeft', -30],
      ])
    }

    return part
  },
}
