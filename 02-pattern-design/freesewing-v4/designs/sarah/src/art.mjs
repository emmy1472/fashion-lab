import { base } from './base.mjs'
import { pathUtilsPlugin } from '@freesewing/plugin-path-utils'

export const art = {
  name: 'sarah.art',
  measurements: ['waist', 'seat', 'waistToSeat', 'waistToFloor'],
  optionalMeasurements: [],
  options: {},
  plugins: [pathUtilsPlugin],
  from: base,
  draft: (params) => {
    const {
      store,
      sa,
      measurements,
      options,
      Point,
      points,
      Path,
      paths,
      Snippet,
      snippets,
      macro,
      part,
    } = params

    points.sfTopp = points.sfTop.flipX(points.cfTop)
    points.sideBottomp = points.sideBottom.flipX(points.cfTop)
    points.sfhTCpp = points.sfhTCp.flipX(points.cfTop)
    points.sfhCpCp = points.sfhCpC.flipX(points.cfTop)
    points.sfhBCpp = points.sfhBCp.flipX(points.cfTop)
    points.sideSeatp = points.sideSeat.flipX(points.cfTop)
    points.frontDartBottomp = points.frontDartBottom.flipX(points.cfTop)
    points.frontDartLeftp = points.frontDartLeft.flipX(points.cfTop)
    points.frontDartRightp = points.frontDartRight.flipX(points.cfTop)
    points.cftCpp = points.cftCp.flipX(points.cfTop)
    points.fdlCpp = points.fdlCp.flipX(points.cfTop)
    points.fdrCpp = points.fdrCp.flipX(points.cfTop)
    points.sftCpp = points.sftCp.flipX(points.cfTop)
    points.sfTopp = points.sfTop.flipX(points.cfTop)

    paths.art = new Path()
      .move(points.sfTop)
      .curve(points.sfhTCp, points.sfhTCp, points.sfhCpC)
      .curve(points.sfhBCp, points.sfhBCp, points.sideSeat)
      .line(points.sideBottom)
      .line(points.sideBottomp)
      .line(points.sideSeatp)
      .curve(points.sfhBCpp, points.sfhBCpp, points.sfhCpCp)
      .curve(points.sfhTCpp, points.sfhTCpp, points.sfTopp)
      .curve(points.sftCpp, points.fdlCpp, points.frontDartLeftp)
      .line(points.frontDartBottomp)
      .line(points.frontDartRightp)
      .curve(points.fdrCpp, points.cftCpp, points.cfTop)
      .curve(points.cftCp, points.fdrCp, points.frontDartRight)
      .line(points.frontDartBottom)
      .line(points.frontDartLeft)
      .curve(points.fdlCp, points.sftCp, points.sfTop)

    points.sfHem = points.sideBottom.shift(90, 10)
    points.sfHemp = points.sfHem.flipX(points.cfTop)

    paths.hem = new Path().move(points.sfHem).line(points.sfHemp)

    return part
  },
}
