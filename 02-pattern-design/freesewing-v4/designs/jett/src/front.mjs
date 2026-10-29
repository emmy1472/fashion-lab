import { front as brianFront } from '@freesewing/brian'
import { hidePresets } from '@freesewing/core'

function draftfront({
  options,
  Point,
  Path,
  points,
  paths,
  Snippet,
  snippets,
  sa,
  macro,
  part,
  measurements,
  store,
  log,
  utils,
}) {
  store.set('Test', 'test')

  macro('rmCutOnFold', 'cutonfold')

  //Change default Brian to respect hip measurement and hip ease
  points.hem.x = (measurements.hips * (1 + options.hipsEase)) / 4

  // Shorten body to take ribbing into account
  if (options.ribbing) {
    const rh = options.ribbingHeight * (measurements.hpsToWaistBack + measurements.waistToHips)
    for (let p of ['hem', 'cfHem']) points[p] = points[p].shift(90, rh)
    store.set('ribbingHeight', rh)
  } else store.set('ribbingHeight', 0)

  //Shift the neck forward slightly from Brian default
  points.cfNeck = points.cfNeck.shift(-90, measurements.neck * options.neckShiftForward)
  points.cfNeckCp1 = points.cfNeckCp1.shift(-90, measurements.neck * options.neckShiftForward)
  points.frontNeckCpEdge = points.frontNeckCpEdge.shift(
    -90,
    measurements.neck * options.neckShiftForward
  )
  points.neckCp2Front = points.neckCp2Front.shift(-90, measurements.neck * options.neckShiftForward)

  // Adapt the shoulder line according to the relevant options
  // Don't bother with less than 10% as that's just asking for trouble
  if (options.s3Collar < 0.1 && options.s3Collar > -0.1) {
    points.s3CollarSplit = points.hps
    paths.frontCollar = new Path()
      .move(points.hps)
      .curve(points.neckCp2Front, points.cfNeckCp1, points.cfNeck)
      .hide()
  } else if (options.s3Collar > 0) {
    // Shift shoulder seam forward on the collar side
    points.s3CollarSplit = utils.curveIntersectsY(
      points.hps,
      points.neckCp2Front,
      points.cfNeckCp1,
      points.cfNeck,
      store.get('s3CollarMaxFront') * options.s3Collar
    )
    paths.frontCollar = new Path()
      .move(points.hps)
      .curve(points.neckCp2Front, points.cfNeckCp1, points.cfNeck)
      .split(points.s3CollarSplit)[1]
      .hide()
  } else if (options.s3Collar < 0) {
    // Shift shoulder seam backward on the collar side
    points.s3CollarSplit = utils.curveIntersectsY(
      points.mirroredCbNeck,
      points.mirroredCbNeck,
      points.mirroredNeckCp2,
      points.hps,
      store.get('s3CollarMaxBack') * options.s3Collar
    )
    paths.frontCollar = new Path()
      .move(points.hps)
      .curve_(points.mirroredNeckCp2, points.mirroredCbNeck)
      .split(points.s3CollarSplit)[0]
      .reverse()
      .join(new Path().move(points.hps).curve(points.neckCp2Front, points.cfNeckCp1, points.cfNeck))
      .hide()
  }

  let placketwidth = measurements.chest * (1 + options.chestEase) * options.placketwidth
  store.set('placketWidth', placketwidth)

  //Create points for placket
  points.innerPlacketTop = points.cfNeck.shift(0, placketwidth / 2)
  points.innerPlacketBottom = points.cfHem.shift(0, placketwidth / 2)

  points.centerPlacketTop = points.cfNeck.shift(180, placketwidth / 2)
  points.centerPlacketBottom = points.cfHem.shift(180, placketwidth / 2)

  points.outerPlacketTop = points.cfNeck.shift(180, placketwidth * 1.5)
  points.outerPlacketBottom = points.cfHem.shift(180, placketwidth * 1.5)

  //Save the current side seam width and waist width?

  paths.sideSeam = new Path().move(points.armhole).line(points.hem).hide()
  let sideseamlength = paths.sideSeam.length()

  let waistOriginal = 0
  if (points.waist.y < points.hem.y) {
    points.waist = points.waist.shift(0, measurements.hips * 0.2)
    paths.waist = new Path().move(points.cfWaist).line(points.waist) //.hide()

    points.waist = paths.waist.intersects(paths.sideSeam)[0]
    paths.waist = new Path().move(points.cfWaist).line(points.waist).setClass('lining').hide()
  } else {
    points.waist = points.hem
    //points.waist.y = points.waist.y * 0.95
    paths.waist = new Path().move(points.cfHem).line(points.hem).setClass('lining').hide()
  }
  waistOriginal = points.waist.x
  log.info('pre-adjustment waist X: ' + waistOriginal)
  log.info('pre-adjustment side seam: ' + sideseamlength)

  //apply the full bust adjustment
  if (options.bustDart && options.draftForHighBust) {
    points.bustpoint = new Point(measurements.bustSpan / 2, measurements.hpsToBust)
    let sideseamangle = points.hem.angle(points.armhole)
    snippets.bustpoint = new Snippet('notch', points.bustpoint)

    paths.sideSeam = new Path().move(points.armhole).line(points.hem)

    points.FBA_cut_A_end = points.bustpoint.shift(
      sideseamangle - 90 * options.sideCutAngle,
      measurements.bust / 4
    )
    paths.FBA_cut_A = new Path()
      .move(points.bustpoint)
      .line(points.FBA_cut_A_end)
      .setClass('sa lining')
      .hide()

    if (paths.sideSeam.intersects(paths.FBA_cut_A).length == 0) {
      points.sideSeamIntercept = paths.sideSeam.shiftFractionAlong(options.bustDartHeight)
    } else {
      points.sideSeamIntercept = paths.sideSeam.intersects(paths.FBA_cut_A)[0]
    }
    points.FBA_cut_B_end = points.bustpoint.shift(
      -90,
      (measurements.hpsToWaistFront + measurements.waistToHips - measurements.hpsToBust) *
        1.1 *
        (1 + options.lengthBonus)
    )
    paths.FBA_cut_B = new Path()
      .move(points.bustpoint)
      .line(points.FBA_cut_B_end)
      .setClass('sa lining')
      .hide()
    points.bottomHemIntercept = paths.FBA_cut_B.intersectsY(points.hem.y)[0]

    const armCutAngle =
      points.bustpoint.angle(
        points.armholeHollow.shiftFractionTowards(points.frontArmholePitch, 0.5)
      ) * options.armCutAngle

    points.FBA_cut_C_end = points.bustpoint.shift(armCutAngle, measurements.hpsToBust)
    paths.FBA_cut_C = new Path()
      .move(points.bustpoint)
      .line(points.FBA_cut_C_end)
      .setClass('sa lining')
      .hide()

    points.armholeIntercept = paths.FBA_cut_C.intersects(paths.seam)[0]
    points.bustPointRotated = new Point(points.bustpoint.x, points.bustpoint.y)

    let rotated = [
      'bottomHemIntercept',
      'hem',
      'sideSeamIntercept',
      'FBA_cut_A_end',
      'armhole',
      'armholeCp2',
      '_tmp1',
      '_tmp2',
      '_tmp3',
      'armholeHollowCp1',
      'armholeHollow',
      'bustPointRotated',
    ]

    let bustDifferential =
      measurements.bust * (1 + options.fullBustEase) -
      measurements.highBust * (1 + options.chestEase)
    let anglemoved = 0
    while (points.bustpoint.dx(points.bustPointRotated) < bustDifferential) {
      //log.info("dx: " + points.bustpoint.dx(points.bustPointRotated) )
      for (let p of rotated) {
        points[p] = points[p].rotate(1, points.armholeIntercept)
      }
      anglemoved += 1
    }
    log.info('Angle moved: ' + anglemoved)

    paths.armCutRotated = new Path()
      .move(points.armholeIntercept)
      .line(points.bustPointRotated)
      .setClass('sa lining')
      .hide()

    points.hem = points.hem.rotate(-anglemoved, points.bustPointRotated)
    points.sideSeamInterceptOld = points.sideSeamIntercept
    points.sideSeamIntercept = points.sideSeamIntercept.rotate(-anglemoved, points.bustPointRotated)

    let hemlower = ['outerPlacketBottom', 'centerPlacketBottom', 'cfHem', 'innerPlacketBottom']

    for (let p of hemlower) {
      points[p] = new Point(points[p].x, points.hem.y)
    }

    points.dartTopEdge = points.sideSeamInterceptOld
    points.dartBottomEdge = points.sideSeamIntercept
    points.dartPoint = points.bustpoint.shiftFractionTowards(
      points.sideSeamIntercept.shiftFractionTowards(points.sideSeamInterceptOld, 0.5),
      options.bustDartOffset
    )

    //Make sure dart legs are equal
    if (options.dartLegsTruing) {
      const sideSeamRatio =
        points.armhole.dist(points.dartTopEdge) / points.hem.dist(points.dartBottomEdge)
      log.info('side seam ratio is ' + sideSeamRatio)

      let dartBottomLength = points.dartPoint.dist(points.dartBottomEdge)
      let dartTopLength = points.dartPoint.dist(points.dartTopEdge)
      let topDartRotateAngle = 0
      log.info('Dart bottom length ' + dartBottomLength + ', dart top length ' + dartTopLength)
      while (dartBottomLength > dartTopLength && topDartRotateAngle < 30) {
        log.info('Bust dart bottom leg is longer by ' + (dartBottomLength - dartTopLength))
        points.dartTopEdge = points.dartTopEdge.rotate(1 - sideSeamRatio, points.armhole)
        points.dartBottomEdge = points.dartBottomEdge.rotate(sideSeamRatio, points.hem)

        dartTopLength = points.dartPoint.dist(points.dartTopEdge)
        dartBottomLength = points.dartPoint.dist(points.dartBottomEdge)
        topDartRotateAngle += 1
      }
      log.info('Dart bottom length ' + dartBottomLength + ', dart top length ' + dartTopLength)
    }

    //Draw lines now that all the point manipulations are over
    paths.bustDart = new Path()
      .move(points.dartTopEdge)
      .line(points.dartPoint)
      .line(points.dartBottomEdge)

    paths.sideSeam = new Path()
      .move(points.hem)
      .line(points.dartBottomEdge)
      .line(points.dartTopEdge)
      .line(points.armhole)
      .hide()
  } else {
    log.info('No bust adjustment')
    paths.sideSeam = new Path().move(points.hem).line(points.armhole).hide()
  }

  //Apply full belly adjustment if it's needed
  if (options.useBellyAdjustment) {
    log.info('Full belly adjustment is enabled')

    let waistTarget = (measurements.waist * (1 + options.waistEase) - 2 * waistOriginal) / 2

    /*
    points.waistTargetBottom = new Point(waistTarget, points.hem.y*1.2)
    points.waistTargetTop = new Point(waistTarget, points.armhole.y)
    paths.waistTarget = new Path()
      .move(points.waistTargetBottom)
      .line(points.waistTargetTop)
      .setClass('lining')
    paths.originalSeamOutline = new Path() 
      .move(points.cfHem)
      .line(points.hem)
      .line(points.armhole)
      .setClass('lining')
    */

    let waistY = points.waist.y

    if (points.sideSeamIntercept) points.rotatePoint = points.sideSeamIntercept
    else points.rotatePoint = points.armhole

    let sideseamangle2 = points.rotatePoint.angle(points.hem)
    points.sideSeamExtension = points.hem.shift(sideseamangle2, points.hem.y * 0.1)
    snippets['extension_button'] = new Snippet('button', points.sideSeamExtension)

    paths.sideTarget = new Path().move(points.rotatePoint).line(points.sideSeamExtension).hide()

    points.waistIntersect = paths.sideTarget.intersectsY(waistY)[0]

    log.info(
      'Waist front target is ' +
        waistTarget +
        ', waist front current is ' +
        points.waistIntersect.x +
        '. starting rotation'
    )

    let totalAngle = 0

    points.bellyEdge = points.cfHem.shiftFractionTowards(points.hem, options.bellyAdjustmentX)

    while (waistTarget > points.waistIntersect.x && totalAngle < 30) {
      log.info('Rotation loop ' + totalAngle)
      points.hem = points.hem.rotate(1, points.rotatePoint)
      points.sideSeamExtension = points.sideSeamExtension.rotate(1, points.rotatePoint)
      points.bellyEdge = points.bellyEdge.rotate(1, points.rotatePoint)

      totalAngle++

      paths.sideTarget = new Path().move(points.rotatePoint).line(points.sideSeamExtension).hide()

      points.waistIntersect = paths.sideTarget.intersectsY(waistY)[0]
    }
    log.info(
      'Waist front target is ' +
        waistTarget +
        ', waist front current is ' +
        points.waistIntersect.x +
        ', angle ' +
        totalAngle
    )
    points.outerPlacketBottom.y = points.bellyEdge.y
    points.cfHem.y = points.bellyEdge.y

    if (!options.bustDart) {
      paths.sideSeam = new Path().move(points.hem).line(points.armhole).hide()
    } else {
      paths.sideSeam = new Path()
        .move(points.hem)
        .line(points.dartBottomEdge)
        .line(points.dartTopEdge)
        .line(points.armhole)
        .hide()
    }
  }

  //Draw vertical guidelines for placket
  paths.innerPlacketLine = new Path()
    .move(points.innerPlacketTop)
    .line(points.innerPlacketBottom)
    .setClass('sa')

  paths.centerPlacketLine = new Path()
    .move(points.centerPlacketTop)
    .line(points.centerPlacketBottom)
    .setClass('sa')
    .setClass('lining')
  //.hide()
  paths.edgePlacketLine = new Path()
    .move(points.outerPlacketTop)
    .line(points.outerPlacketBottom)
    .setClass('sa')

  //Draw the buttons
  paths.centerLine = new Path().move(points.cfNeck).line(points.cfHem).setClass('sa').hide()
  let j = options.closureCount
  j--
  let closurePoints = []

  points.topButton = points.cfNeck.shiftTowards(points.cfHem, placketwidth / 2)
  snippets['top_button'] = new Snippet('button', points.topButton)
  for (let i = 1; i < j; i++) {
    closurePoints.push(points.topButton.shiftFractionTowards(points.cfHem, i / j))
  }
  for (let b in closurePoints) {
    snippets[b + '_button'] = new Snippet('button', closurePoints[b])
  }

  //Redefine base seam and seam allowance to respect placket
  paths.saBase = new Path().move(points.outerPlacketBottom)
  if (options.useBellyAdjustment) {
    paths.saBase = paths.saBase.line(points.bellyEdge)
  }
  paths.saBase = paths.saBase
    .line(points.hem)
    .join(paths.sideSeam)
    .curve(points.armholeCp2, points.armholeHollowCp1, points.armholeHollow)

  if (options.bustDart && options.draftForHighBust) {
    paths.saBase = paths.saBase.line(points.armholeIntercept)
  } else {
    paths.saBase = paths.saBase.curve(
      points.armholeHollowCp2,
      points.armholePitchCp1,
      points.armholePitch
    )
  }
  paths.saBase = paths.saBase
    //.curve(points.armholeHollowCp2, points.armholePitchCp1, points.armholePitch)
    .join(paths.frontArmhole)
    .line(points.s3CollarSplit)
    .join(paths.frontCollar)
    .line(points.outerPlacketTop)
    .line(points.outerPlacketBottom)
    .close()

  //Seam allowance
  if (sa) {
    paths.sa = paths.saBase.offset(sa).setClass('fabric sa')
    paths.sa.line(paths.sa.start())
  }

  paths.seam = paths.saBase

  //Draw the pocket
  if (options.frontWeltPockets) {
    points.pocketBottom = points.cfHem.shiftFractionTowards(points.hem, options.pocketBottomX)
    points.pocketBottom.y = points.pocketBottom.shiftFractionTowards(
      points.hps,
      options.pocketBottomY
    ).y

    points.pocketTop = points.cfHem.shiftFractionTowards(points.hem, options.pocketTopX)
    points.pocketTop.y = points.pocketTop.shiftFractionTowards(points.hps, options.pocketTopY).y

    let pocketslope =
      -(points.pocketBottom.y - points.pocketTop.y) / (points.pocketBottom.x - points.pocketTop.x)
    let pocketangle = (Math.atan(pocketslope) * 180) / 3.14159

    paths.pocketLine = new Path().move(points.pocketTop).line(points.pocketBottom).hide()

    let pocketWeltOffset = (options.pocketWeltWidth * measurements.hips) / 10

    store.set('pocketLength', paths.pocketLine.length())

    log.info('Pocket length is ' + paths.pocketLine.length())

    store.set('pocketWidth', pocketWeltOffset * 2)

    points.pocketTopInner = points.pocketTop.shift(pocketangle - 90, pocketWeltOffset)
    points.pocketTopOuter = points.pocketTop.shift(pocketangle + 90, pocketWeltOffset)

    points.pocketBottomInner = points.pocketBottom.shift(pocketangle - 90, pocketWeltOffset)
    points.pocketBottomOuter = points.pocketBottom.shift(pocketangle + 90, pocketWeltOffset)

    paths.pocketOutline = new Path()
      .move(points.pocketTopInner)
      .line(points.pocketTopOuter)
      .line(points.pocketBottomOuter)
      .line(points.pocketBottomInner)
      .close()
      .setClass('sa')

    log.info('Pocket angle is ' + pocketangle)
  }

  store.set('frontWaistLength', points.cfHem.dist(points.hem))

  macro('rmtitle')
  store.cutlist.addCut({ cut: false })
  store.cutlist.addCut({ cut: 2, from: 'fabric', identical: false })
  store.cutlist.addCut({ cut: 2, from: 'lining', identical: false })

  points.title = points.outerPlacketTop.shiftFractionTowards(points.hem, 0.5)
  points.title.y = points.title.shiftFractionTowards(points.hem, 0.5).y
  macro('title', { at: points.title, nr: 1, title: 'front' })

  //Remove unneeded paperless macros
  macro('rmVd', 'hTotal')
  macro('rmVd', 'hHemToArmholePitch')
  macro('rmVd', 'hHemToShoulder')
  macro('rmVd', 'hHemToArmhole')
  macro('rmVd', 'hHemToWaist')
  macro('rmVd', 'hHemToNeckOpeningBottom')

  //make new macros

  const widestX = points.armhole.x > points.hem.x ? points.armhole.x : points.hem.x

  macro('hd', {
    id: 'wHem',
    from: points.cfHem,
    to: points.hem,
    y: points.cfHem.y + sa + 15,
  })
  macro('hd', {
    id: 'wChest',
    from: points.cfHem,
    to: points.armhole,
    y: points.armhole.y,
  })
  macro('hd', {
    id: 'wArmhole',
    from: points.cfHem,
    to: points.frontArmholePitch,
    y: points.frontArmholePitch.y,
  })
  macro('hd', {
    id: 'wPlacket',
    from: points.outerPlacketTop,
    to: points.cfNeck,
    y: points.cfNeck.y - sa - 15,
  })
  macro('hd', {
    id: 'wGreen',
    from: points.outerPlacketTop,
    to: points.centerPlacketTop,
    y: points.cfNeck.y + 15,
  })
  macro('hd', {
    id: 'wGreenOffset',
    from: points.centerPlacketTop,
    to: points.innerPlacketTop,
    y: points.cfNeck.y + 15,
  })
  macro('hd', {
    id: 'wGreenBottom',
    from: points.outerPlacketTop,
    to: points.centerPlacketTop,
    y: points.cfHem.y - 15,
  })
  macro('vd', {
    id: 'hNeck',
    from: points.cfNeck,
    to: points.s3CollarSplit,
    x: points.cfNeck.x,
  })
  macro('vd', {
    id: 'hTotal',
    from: points.cfHem,
    to: points.s3CollarSplit,
    x: widestX + sa + 30,
  })
  macro('vd', {
    id: 'hHemToWaist',
    from: points.hem,
    to: points.armhole,
    x: widestX + sa + 15,
  })

  if (!options.bustDart || options.draftForHighBust == false) {
    macro('ld', {
      id: 'sideSeam',
      from: points.armhole,
      to: points.hem,
      d: -10,
    })
  } else {
    macro('ld', {
      id: 'sideSeamTop',
      from: points.armhole,
      to: points.dartTopEdge,
      d: -10,
    })
    macro('ld', {
      id: 'sideSeamBottom',
      from: points.dartBottomEdge,
      to: points.hem,
      d: -10,
    })
    macro('vd', {
      id: 'bustDartHeight',
      from: points.hem,
      to: points.sideSeamIntercept,
      x: points.sideSeamIntercept.x - 30,
    })

    macro('vd', {
      id: 'dartPointHeight',
      from: points.dartPoint,
      to: points.armhole,
      x: points.dartPoint.x,
    })

    macro('hd', {
      id: 'bustDartWidth',
      from: points.cfHem,
      to: points.sideSeamIntercept,
      y: points.sideSeamIntercept.y,
    })
    macro('hd', {
      id: 'bustPointWidth',
      from: points.cfHem,
      to: points.dartPoint,
      y: points.dartPoint.y,
    })
    macro('ld', {
      id: 'bustDartEdges',
      from: points.dartTopEdge,
      to: points.dartBottomEdge,
    })
  }

  macro('vd', {
    id: 'hChestToArmHollow',
    from: points.armhole,
    to: points.backArmholePitch,
    x: points.armhole.x + sa + 15,
  })
  macro('vd', {
    id: 'hArmHollowToShoulder',
    from: points.backArmholePitch,
    to: points.s3ArmholeSplit,
    x: points.armhole.x + sa + 15,
  })
  macro('vd', {
    id: 'hShoulderSlope',
    from: points.s3ArmholeSplit,
    to: points.s3CollarSplit,
    x: points.s3ArmholeSplit.x + sa + 15,
  })

  macro('pd', {
    id: 'lArmhole',
    path: new Path()
      .move(points.armhole)
      .curve(points.armholeCp2, points.armholeHollowCp1, points.armholeHollow)
      .curve(points.armholeHollowCp2, points.armholePitchCp1, points.armholePitch)
      .reverse(),
    d: sa + 15,
  })

  if (options.frontWeltPockets) {
    macro('ld', {
      id: 'pocketLength',
      from: points.pocketTopOuter,
      to: points.pocketBottomOuter,
    })
    macro('ld', {
      id: 'pocketWidth',
      to: points.pocketTopOuter.shiftFractionTowards(points.pocketBottomOuter, 0.5),
      from: points.pocketTopInner.shiftFractionTowards(points.pocketBottomInner, 0.5),
    })
    macro('vd', {
      id: 'pocketBottomHeight',
      to: points.cfHem,
      from: points.pocketBottom,
      x: points.pocketBottom.x,
    })
    macro('hd', {
      id: 'pocketBottomX',
      from: points.cfHem,
      to: points.pocketBottom,
      y: points.pocketBottom.y,
    })
    macro('vd', {
      id: 'pocketTopHeight',
      to: points.cfHem,
      from: points.pocketTop,
      x: points.pocketTop.x - 15,
    })
    macro('hd', {
      id: 'pocketTopX',
      from: points.cfHem,
      to: points.pocketTop,
      y: points.pocketTop.y,
    })
  }

  return part
}

export const front = {
  name: 'jett.front',
  from: brianFront,
  measurements: [
    'chest',
    'highBust',
    'hips',
    'waistToHips',
    'hpsToWaistBack',
    'hpsToWaistFront',
    'bustSpan',
    'hpsToBust',
    'waist',
  ],
  hide: hidePresets.HIDE_TREE,
  options: {
    hipsEase: { pct: 8, min: 0, max: 50, menu: 'fit' },
    chestEase: { pct: 15, min: 0, max: 50, menu: 'fit' },

    placketwidth: { pct: 3, min: 0, max: 10, menu: 'style.placket' },
    neckShiftForward: { pct: 0, min: 0, max: 40, menu: 'style' },
    collarEase: { pct: 2, min: 0, max: 50, menu: 'fit' },

    draftForHighBust: { bool: false, menu: 'fit.bust' },
    bustDart: { bool: false, menu: 'fit.bust' },
    bustDartOffset: { pct: 25, min: 5, max: 90, menu: 'fit.bust' },
    bustDartHeight: { pct: 20, min: 5, max: 95, menu: 'fit.bust.advanced' },
    fullBustEase: { pct: 10, min: 0, max: 50, menu: 'fit.bust' },
    armCutAngle: { pct: 100, min: 75, max: 125, menu: 'fit.bust.advanced' },
    sideCutAngle: { pct: 100, min: 80, max: 120, menu: 'fit.bust.advanced' },
    dartLegsTruing: { bool: true, menu: 'fit.bust.advanced' },

    ribbing: { bool: true, menu: 'construction' },
    ribbingHeight: { pct: 10, min: 5, max: 15, menu: 'style' },

    frontWeltPockets: { bool: true, menu: 'style.pocket' },
    pocketBottomX: { pct: 70, min: 40, max: 95, menu: 'style.pocket' },
    pocketTopX: { pct: 60, min: 40, max: 95, menu: 'style.pocket' },
    pocketBottomY: { pct: 7, min: 0, max: 20, menu: 'style.pocket' },
    pocketTopY: { pct: 30, min: 20, max: 50, menu: 'style.pocket' },

    pocketWeltWidth: { pct: 7, min: 0, max: 20, menu: 'style.pocket' },

    closureCount: { count: 7, min: 3, max: 12, menu: 'style.placket' },

    waistEase: { pct: 10, min: 0, max: 50, menu: 'fit.belly' },
    bellyAdjustmentX: { pct: 40, min: 5, max: 95, menu: 'fit.belly' },
    useBellyAdjustment: { bool: false, menu: 'fit.belly' },
  },
  draft: draftfront,
}
