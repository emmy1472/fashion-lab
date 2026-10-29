import { sleeve as bentSleeve } from '@freesewing/bent'
import { front } from './front.mjs'

export const sleeve = {
  name: 'devon.sleeve',
  from: bentSleeve,
  after: front,
  hide: {
    self: true,
    from: true,
    inherited: true,
  },
  measurements: ['shoulderToElbow'],
  options: {
    sleeveSlit: 9 / 63,

    sleeveLengthBonus: { pct: 3, min: -10, max: 10, menu: 'style' },
  },
  draft: ({ measurements, options, store, points, Path, paths, utils, sa, part }) => {
    const cuffWidth = options.cuffWidth * measurements.shoulderToWrist
    const sleeveSlit = options.sleeveSlit * measurements.shoulderToWrist
    store.set('cuffWidth', cuffWidth)
    store.set('sleeveSlit', sleeveSlit)

    points.tsOriginalWristRight = points.tsWristRight.copy()
    points.usOriginalWristRight = points.usWristRight.copy()
    points.tsWristRight = points.tsWristRight.shift(
      points.tsWristLeft.angle(points.tsWristRight),
      cuffWidth * 0.5
    )
    points.usWristRight = points.usWristRight.shift(
      points.usWristLeft.angle(points.usWristRight),
      cuffWidth * 0.5
    )
    const tsAngle = points.tsWristLeft.angle(points.tsWristRight) + 90
    const usAngle = points.usWristLeft.angle(points.usWristRight) + 90
    points.tsHelperLeft = points.tsWristLeft.shift(tsAngle, cuffWidth)
    points.tsHelperRight = points.tsWristRight.shift(tsAngle, cuffWidth)
    points.usHelperLeft = points.usWristLeft.shift(usAngle, cuffWidth)
    points.usHelperRight = points.usWristRight.shift(usAngle, cuffWidth)
    points.tsCuffLeft = utils.beamsIntersect(
      points.tsWristLeft,
      points.tsElbowLeft,
      points.tsHelperLeft,
      points.tsHelperRight
    )
    points.tsCuffRight = utils.beamsIntersect(
      points.tsOriginalWristRight,
      points.elbowRight,
      points.tsHelperLeft,
      points.tsHelperRight
    )
    points.usCuffLeft = utils.beamsIntersect(
      points.usWristLeft,
      points.usElbowLeft,
      points.usHelperLeft,
      points.usHelperRight
    )
    points.usCuffRight = utils.beamsIntersect(
      points.usOriginalWristRight,
      points.elbowRight,
      points.usHelperLeft,
      points.usHelperRight
    )

    points.usSlit = points.usCuffRight.shiftTowards(points.elbowRight, sleeveSlit)
    points.tsSlit = points.tsCuffRight.shiftTowards(points.elbowRight, sleeveSlit)

    if (sa) {
      points.usSlitRight = points.usSlit.shift(points.usSlit.angle(points.elbowRight) - 90, sa * 2)
      points.tsSlitRight = points.tsSlit.shift(points.tsSlit.angle(points.elbowRight) - 90, sa)
    } else {
      points.usSlitRight = points.usSlit.copy()
      points.tsSlitRight = points.tsSlit.copy()
    }
    points.usCuffRight = utils.beamsIntersect(
      points.usWristRight,
      points.usSlit,
      points.usCuffLeft,
      points.usCuffRight
    )
    points.tsCuffRight = utils.beamsIntersect(
      points.tsWristRight,
      points.tsSlit,
      points.tsCuffLeft,
      points.tsCuffRight
    )

    store.set(
      'cuffLength',
      points.tsCuffLeft.dist(points.tsCuffRight) + points.usCuffLeft.dist(points.usCuffRight) + sa
    )

    if (sa) {
      points.tsCuffRight = points.tsCuffLeft.shiftOutwards(points.tsCuffRight, sa)
      points.usCuffRight = points.usCuffLeft.shiftOutwards(points.usCuffRight, sa * 2)
    }

    paths.topSleeve = new Path()
      .move(points.tsCuffRight)
      .line(points.tsSlitRight)
      .line(points.tsSlit)
      .line(points.elbowRight)
      .curve(points.elbowRightCpTop, points.tsRightEdgeCpBottom, points.tsRightEdge)
      .curve_(points.tsRightEdgeCpTop, points.backPitchPoint)
      .curve(points.backPitchPoint, points.topCpRight, points.top)
      .curve(points.topCpLeft, points.frontPitchPointCpTop, points.frontPitchPoint)
      .curve(points.frontPitchPointCpBottom, points.tsLeftEdgeCpRight, points.tsLeftEdge)
      .curve(points.tsLeftEdge, points.tsElbowLeftCpTop, points.tsElbowLeft)
      .line(points.tsCuffLeft)
      .line(points.tsCuffRight)
      .close()
      .attr('class', 'lining')

    paths.underSleeve = new Path()
      .move(points.usCuffRight)
      .line(points.usSlitRight)
      .line(points.usSlit)
      .line(points.elbowRight)
      .curve(points.elbowRightCpTop, points.usRightEdgeCpBottom, points.usRightEdge)
      .curve_(points.usRightEdgeCpTop, points.usTip)
      .curve(points.usTipCpBottom, points.usLeftEdgeCpRight, points.usLeftEdgeRight)
      .line(points.usLeftEdge)
      .curve(points.usLeftEdge, points.usElbowLeftCpTop, points.usElbowLeft)
      .line(points.usCuffLeft)
      .line(points.usCuffRight)
      .close()
      .attr('class', 'interfacing')

    return part.hide()
  },
}
