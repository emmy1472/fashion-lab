import { Point, pctBasedOn, cbqc } from '@freesewing/core'

export function pctWaistline() {
  return {
    toAbs: (val, { measurements }, mergeOptions) => {
      return (
        val *
        (measurements.waist + mergeOptions.waistDrop * (measurements.hips - measurements.waist))
      )
    },
    fromAbs: (val, { measurements }, mergeOptions) => {
      return (
        Math.round(10000 * val) /
        (measurements.waist + mergeOptions.waistDrop * (measurements.hips - measurements.waist)) /
        10000
      )
    },
  }
}

export function pctWaistlineSeatDiff() {
  return {
    toAbs: (val, { measurements }, mergeOptions) => {
      return (
        val *
        (measurements.waist +
          mergeOptions.waistDrop * (measurements.hips - measurements.waist) -
          measurements.seat)
      )
    },
    fromAbs: (val, { measurements }, mergeOptions) => {
      return (
        Math.round(10000 * val) /
        (measurements.waist +
          mergeOptions.waistDrop * (measurements.hips - measurements.waist) -
          measurements.seat) /
        10000
      )
    },
  }
}

export function pctWaistlineToSeat() {
  return {
    toAbs: (val, { measurements }, mergeOptions) => {
      return val * (measurements.waistToSeat - mergeOptions.waistDrop * measurements.waistToHips)
    },
    fromAbs: (val, { measurements }, mergeOptions) => {
      return (
        Math.round(10000 * val) /
        (measurements.waistToSeat - mergeOptions.waistDrop * measurements.waistToHips) /
        10000
      )
    },
  }
}

/**
 * Shifts this Point distance in the direction of that Point
 *
 * @param {Point} that - The Point to short towards
 * @param {float} dist - The distance to shift
 * @param (float) [theta=0] Additional rotation around this
 * @return {Point} shifted - The new shifted Point instance
 */
Point.prototype.shiftTowardsA = function (that, dist, theta) {
  // dist = __asNumber(dist, 'dist', 'Point.shiftTowards', this.log)
  // if (that instanceof Point !== true)
  //   this.log.warn('Called `Point.shiftTowards(that, distance)` but `that` is not a `Point` object')
  theta += this.angle(that)

  return this.shift(theta, dist)
}

function draftBase({ Path, Point, paths, points, measurements, options, part, store, sa }) {
  const waistline =
    measurements.waist - options.waistDrop * (measurements.hips - measurements.waist)
  const waist = (1 + options.extraWaistEase) * waistline
  const seat = (1 + options.extraSeatEase) * measurements.seat
  const seatWaistDiff = measurements.seat - waistline
  const seatEase = seatWaistDiff * options.seatEase
  const waistEaseFront = options.waistEaseFront * seatWaistDiff
  const waistToSeat = measurements.waistToSeat - options.waistDrop * measurements.waistToHips
  const frontDartWidth = waistEaseFront
  const frontDartHalf = frontDartWidth / 2
  const waistEaseBack = options.waistEaseBack * seatWaistDiff
  const waistRise = options.waistRise * seatWaistDiff
  const backDartHalf = waistEaseBack / 4
  const backOutsideDartLength = options.backOutsideDartLength * waistToSeat
  const backInsideDartLength = options.backInsideDartLength * waistToSeat
  const frontDartLength = options.frontDartLength * waistToSeat
  const sLength = options.length * measurements.waistToFloor
  const sideSeamCurveOffset = options.sideSeamCurveOffset * seatWaistDiff
  const hem = options.hem * (sa ? sa : 10)

  store.set('sarah.hem', hem)
  const qWaistBack = waist / 4 + waistEaseBack
  const qWaistFront = waist / 4 + waistEaseFront

  points.cbTop = new Point(0, 0)
  points.cbSeat = points.cbTop.shift(270, waistToSeat)
  points.cbBottom = points.cbTop.shift(270, sLength)

  points.sideBottom = points.cbBottom.shift(0, seat / 4 + seatEase)
  points.sideSeat = points.cbSeat.shift(0, seat / 4 + seatEase)

  points.sbWaist = new Point(qWaistBack, 0)
  points.sbTop = points.sbWaist.shift(90, waistRise)

  points.backInsideDartCenter = points.cbTop.shiftFractionTowards(points.sbTop, 1 / 3)
  points.backInsideDartBottom = points.backInsideDartCenter.shiftTowardsA(
    points.cbTop,
    backInsideDartLength,
    90
  )

  points.backOutsideDartCenter = points.cbTop.shiftFractionTowards(points.sbTop, 2 / 3)
  points.backOutsideDartBottom = points.backOutsideDartCenter.shiftTowardsA(
    points.cbTop,
    backOutsideDartLength,
    90
  )

  points.backInsideDartLeft = points.backInsideDartCenter.shiftTowards(points.cbTop, backDartHalf)
  points.backInsideDartRight = points.backInsideDartCenter.shiftTowards(points.sbTop, backDartHalf)
  points.backOutsideDartLeft = points.backOutsideDartCenter.shiftTowards(points.cbTop, backDartHalf)
  points.backOutsideDartRight = points.backOutsideDartCenter.shiftTowards(
    points.sbTop,
    backDartHalf
  )

  const cbt2bidl = points.cbTop.dist(points.backInsideDartLeft)
  const bidr2bodl = points.backInsideDartRight.dist(points.backOutsideDartLeft)
  const bodr2sbt = points.backOutsideDartRight.dist(points.sbTop)

  points.cbTopCp = points.cbTop.shiftTowards(points.sbWaist, cbt2bidl * 0.5 * cbqc)
  points.bidLCp = points.backInsideDartLeft.shiftTowardsA(
    points.backInsideDartBottom,
    cbt2bidl * 0.5 * cbqc,
    -90
  )
  points.bidRCp = points.backInsideDartRight.shiftTowardsA(
    points.backInsideDartBottom,
    bidr2bodl * 0.5 * cbqc,
    90
  )
  points.bodLCp = points.backOutsideDartLeft.shiftTowardsA(
    points.backOutsideDartBottom,
    bidr2bodl * 0.5 * cbqc,
    -90
  )
  points.bodRCp = points.backOutsideDartRight.shiftTowardsA(
    points.backOutsideDartBottom,
    bodr2sbt * 0.5 * cbqc,
    90
  )
  points.sbtCp = points.sbTop.shiftTowardsA(points.sideSeat, bodr2sbt * 0.5 * cbqc, -90)

  points.ssh = points.sbTop.shiftFractionTowards(points.sideSeat, 0.5)
  const sbt2ssh = points.sbTop.dist(points.ssh)
  points.sshCpC = points.ssh.shiftTowardsA(points.sbTop, sideSeamCurveOffset, 270)
  points.sshTCp = points.sshCpC.shiftTowardsA(
    points.ssh,
    points.sbTop.dist(points.ssh) * 0.5 * cbqc,
    270
  )
  points.sshBCp = points.sshCpC.shiftTowardsA(
    points.ssh,
    points.ssh.dist(points.sideSeat) * 0.5 * cbqc,
    90
  )

  points.cfTop = points.cbTop.shift(0, measurements.seat / 2 + seatEase)
  points.cfSeat = points.cfTop.shift(-90, waistToSeat)
  points.cfBottom = points.cfTop.shift(-90, sLength)
  points.sfWaist = points.cfTop.shiftTowards(points.cbTop, qWaistFront)
  points.sfTop = points.sfWaist.shift(90, waistRise)

  points.frontDartCenter = points.sfTop.shiftFractionTowards(points.cfTop, 1 / 3)
  points.frontDartBottom = points.frontDartCenter.shiftTowardsA(points.cfTop, frontDartLength, -90)

  points.frontDartRight = points.frontDartCenter.shiftTowards(points.cfTop, frontDartHalf)
  points.frontDartLeft = points.frontDartCenter.shiftTowards(points.sfTop, frontDartHalf)

  const sft2fdl = points.sfTop.dist(points.frontDartLeft)
  const cft2fdr = points.cfTop.dist(points.frontDartRight)

  points.fdrCp = points.frontDartRight.shiftTowardsA(
    points.frontDartBottom,
    cft2fdr * 0.5 * cbqc,
    90
  )
  points.sftCp = points.sfTop.shiftTowardsA(points.sideSeat, sft2fdl * 0.5 * cbqc, 90)
  points.fdlCp = points.frontDartLeft.shiftTowardsA(
    points.frontDartBottom,
    sft2fdl * 0.5 * cbqc,
    -90
  )
  points.cftCp = points.cfTop.shiftTowards(points.sfWaist, cft2fdr * 0.5 * cbqc)

  points.sfh = points.sideSeat.shiftFractionTowards(points.sfTop, 0.5)
  points.sfhCpC = points.sfh.shiftTowardsA(points.sideSeat, sideSeamCurveOffset, -90)
  points.sfhTCp = points.sfhCpC.shiftTowardsA(
    points.sfh,
    points.sfh.dist(points.sfTop) * 0.5 * cbqc,
    90
  )
  points.sfhBCp = points.sfhCpC.shiftTowardsA(
    points.sfh,
    points.sfh.dist(points.sideSeat) * 0.5 * cbqc,
    -90
  )
  return part
}

export const base = {
  name: 'sarah.base',
  draft: draftBase,
  hide: { self: true },
  measurements: ['waist', 'seat', 'waistToSeat', 'waistToFloor', 'hips', 'waistToHips'],
  options: {
    paperlessOffset: 15,
    cutFrontOnFold: {
      bool: true,
      menu: 'style',
    },
    cutBackOnFold: {
      bool: true,
      menu: 'style',
    },
    waistDrop: {
      pct: 0,
      min: 0,
      max: 100,
      menu: 'style',
    },
    seatEase: {
      pct: 6.25,
      min: 0,
      max: 20,
      ...pctWaistlineSeatDiff(),
      menu: 'fit',
    },
    waistEaseFront: {
      pct: 10,
      min: 0,
      max: 20,
      ...pctWaistlineSeatDiff(),
      menu: 'fit',
    },
    waistEaseBack: {
      pct: 17,
      min: 0,
      max: 30,
      ...pctWaistlineSeatDiff(),
      menu: 'fit',
    },
    extraSeatEase: {
      pct: 0,
      min: -20,
      max: 20,
      ...pctBasedOn('seat'),
      menu: 'advanced',
    },
    extraWaistEase: {
      pct: 0,
      min: -20,
      max: 20,
      ...pctWaistline(),
      menu: 'advanced',
    },
    waistRise: {
      pct: 6,
      min: 0,
      max: 10,
      ...pctWaistlineSeatDiff(),
      menu: 'advanced',
    },
    sideSeamCurveOffset: {
      pct: 2.5,
      min: 0,
      max: 5,
      ...pctWaistlineSeatDiff(),
      menu: 'advanced',
    },
    backOutsideDartLength: {
      pct: 63,
      min: 50,
      max: 75,
      ...pctWaistlineToSeat(),
      menu: 'advanced',
    },
    backInsideDartLength: {
      pct: 68,
      min: 50,
      max: 75,
      ...pctWaistlineToSeat(),
      menu: 'advanced',
    },
    frontDartLength: { pct: 58, min: 40, max: 80, ...pctWaistlineToSeat(), menu: 'advanced' },
    length: { pct: 100, min: 25, max: 100, ...pctBasedOn('waistToFloor'), menu: 'style' },
    hem: {
      pct: 300,
      min: 100,
      max: 900,
      fromAbs: function (mm, settings) {
        return mm / (settings.sa ? settings.sa : 10)
      },
      toAbs: function (pct, settings) {
        return pct * (settings.sa ? settings.sa : 10)
      },
      menu: (sa) => (sa ? 'style' : null),
    },
  },
}
