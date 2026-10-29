import { base } from './base.mjs'

export const back = {
  name: 'devon.back',
  from: base,
  hide: {
    self: true,
    from: true,
    inherited: true,
  },
  options: {
    backYokePanelWidth: 0.66,
    backHemPanelWidth: 0.33,
  },
  draft: ({ measurements, options, store, points, Path, paths, utils, part }) => {
    let maxBack = Math.max(measurements.hips / 2, measurements.waistBack) / 2
    maxBack *= 1 + options.hemEase

    points.hemBackOriginal = points.hem.copy()
    points.hemBack = points.hem.copy()
    let hemCircleIntersect = utils.circlesIntersect(
      points.cbHem,
      maxBack,
      points.armhole,
      points.armhole.dist(points.hem)
    )
    if (hemCircleIntersect[0].x > hemCircleIntersect[1].x) {
      points.hemBack = hemCircleIntersect[0]
    } else {
      points.hemBack = hemCircleIntersect[1]
    }

    // Adapt the shoulder seam according to the relevant options
    // Note: s3 stands for Shoulder Seam Shift
    // Don't bother with less than 10% as that's just asking for trouble
    if (options.s3Collar < 0.1 && options.s3Collar > -0.1) {
      points.s3CollarSplit = points.hps
      paths.backCollar = new Path().move(points.hps).curve_(points.neckCp2, points.cbNeck).hide()
    } else if (options.s3Collar > 0) {
      // Shift shoulder seam forward on the collar side
      points.s3CollarSplit = utils.curveIntersectsY(
        points.hps,
        points.mirroredNeckCp2Front,
        points.mirroredCfNeckCp1,
        points.mirroredCfNeck,
        store.get('s3CollarMaxFront') * -1 * options.s3Collar
      )

      paths.backCollarS3 = new Path()
        .move(points.hps)
        ._curve(points.mirroredNeckCp2Front, points.mirroredCfNeckCp1, points.mirroredCfNeck)
        .split(points.s3CollarSplit)[0]
        .reverse()
        .hide()

      paths.backCollar = new Path()
        .move(points.hps)
        // .join(paths.backCollarS3)
        .join(new Path().move(points.hps).curve_(points.neckCp2, points.cbNeck))
        .hide()

      store.set('sss', paths.backCollarS3.length())
    } else if (options.s3Collar < 0) {
      // Shift shoulder seam backward on the collar side
      points.s3CollarSplit = utils.curveIntersectsY(
        points.hps,
        points.neckCp2,
        points.cbNeck,
        points.cbNeck,
        store.get('s3CollarMaxBack') * -1 * options.s3Collar
      )
      paths.backCollar = new Path()
        .move(points.cbNeck)
        ._curve(points.neckCp2, points.neck)
        .split(points.s3CollarSplit)[0]
        .reverse()
        .hide()
    }
    // Don't bother with less than 10% as that's just asking for trouble
    if (options.s3Armhole < 0.1 && options.s3Armhole > -0.1) {
      points.s3ArmholeSplit = points.shoulder
      paths.backArmhole = new Path()
        .move(points.armholePitch)
        .curve(points.armholePitchCp2, points.shoulderCp1, points.shoulder)
        .hide()
    } else if (options.s3Armhole > 0) {
      // Shift shoulder seam forward on the armhole side
      points.s3ArmholeSplit = utils.curveIntersectsY(
        points.shoulder,
        points.mirroredShoulderCp1,
        points.mirroredFrontArmholePitchCp2,
        points.mirroredFrontArmholePitch,
        store.get('s3ArmholeMax') * -1 * options.s3Armhole + points.shoulder.y
      )
      paths.backArmhole = new Path()
        .move(points.armholePitch)
        .curve(points.armholePitchCp2, points.shoulderCp1, points.shoulder)
        .join(
          new Path()
            .move(points.shoulder)
            .curve(
              points.mirroredShoulderCp1,
              points.mirroredFrontArmholePitchCp2,
              points.mirroredFrontArmholePitch
            )
            .split(points.s3ArmholeSplit)[0]
        )
        .hide()
    } else if (options.s3Armhole < 0) {
      // Shift shoulder seam backward on the armhole side
      points.s3ArmholeSplit = utils.curveIntersectsY(
        points.shoulder,
        points.shoulderCp1,
        points.armholePitchCp2,
        points.armholePitch,
        store.get('s3ArmholeMax') * -1 * options.s3Armhole + points.shoulder.y
      )
      paths.backArmhole = new Path()
        .move(points.armholePitch)
        .curve(points.armholePitchCp2, points.shoulderCp1, points.shoulder)
        .split(points.s3ArmholeSplit)[0]
        .hide()
    }

    paths.backArmholeComplete = new Path()
      .move(points.armhole)
      .curve(points.armholeCp2, points.armholeHollowCp1, points.armholeHollow)
      .curve(points.armholeHollowCp2, points.armholePitchCp1, points.armholePitch)
      .join(paths.backArmhole)
      .hide()

    points.backArmholeYoke = paths.backArmholeComplete.intersectsY(points.cbYoke.y)[0]

    points.backYokePanel = points.cbYoke.shiftFractionTowards(
      points.backArmholeYoke,
      options.backYokePanelWidth
    )
    points.backHemPanel = points.cbHem.shiftFractionTowards(
      points.hemBack,
      options.backHemPanelWidth
    )

    store.set(
      'armholeYokeBack',
      paths.backArmholeComplete.split(points.backArmholeYoke)[0].length()
    )

    return part
  },
}
