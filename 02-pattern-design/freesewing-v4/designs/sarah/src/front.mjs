import { base } from './base.mjs'
import { pathUtilsPlugin } from '@freesewing/plugin-path-utils'

export const front = {
  name: 'sarah.front',
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
      complete,
      paperless,
    } = params

    const paperlessOffset = options.paperlessOffset
    paths.sideFront = new Path()
      .move(points.sfTop)
      .curve(points.sfhTCp, points.sfhTCp, points.sfhCpC)
      .curve(points.sfhBCp, points.sfhBCp, points.sideSeat)
      .line(points.sideBottom)
      .hide()

    paths.centerFront = new Path().move(points.cfBottom).line(points.cfTop).hide()

    paths.frontTopNoDart = new Path()
      .move(points.cfTop)
      .curve(points.cftCp, points.fdrCp, points.frontDartRight)
      .noop('frontDart')
      .curve(points.fdlCp, points.sftCp, points.sfTop)
      .hide()

    if (complete) {
      paths.frontTop = paths.frontTopNoDart
        .clone()
        .insop(
          'frontDart',
          new Path()
            .move(points.frontDartRight)
            .line(points.frontDartBottom)
            .line(points.frontDartLeft)
        )
    } else {
      paths.frontTop = paths.frontTopNoDart
        .clone()
        .insop('frontDart', new Path().move(points.frontDartRight).line(points.frontDartLeft))
    }

    paths.frontTopSa = new Path().move(points.cfTop).line(points.sfTop).hide()

    paths.fabric = paths.sideFront.clone().join(paths.centerFront).join(paths.frontTop)

    if (options.cutFrontOnFold) {
      store.cutlist.addCut({ cut: 1, onFold: true })
      macro('cutOnFold', {
        from: points.cfTop,
        to: points.cfBottom,
        grainline: true,
        offset: -paperlessOffset,
      })
    } else {
      points.gftop = points.cfTop.shift(0, -options.paperlessOffset)
      points.gfbottom = points.cfBottom.shift(0, -options.paperlessOffset)
      macro('grainline', {
        from: points.gftop,
        to: points.gfbottom,
        grainline: true,
      })
      store.cutlist.addCut({ cut: 2, onFold: false })
    }

    macro('vd', {
      id: 'centerFront',
      from: points.cfTop,
      to: points.cfBottom,
      x: points.cfTop.x + paperlessOffset + sa,
    })

    macro('vd', {
      id: 'waistRise',
      to: points.sfTop,
      from: points.sfWaist,
      x: points.sbTop.x + paperlessOffset + sa,
    })

    macro('ld', {
      id: 'sf2frontDart',
      from: points.sfTop,
      to: points.frontDartLeft,
      d: sa + paperlessOffset,
    })

    macro('ld', {
      id: 'frontDart2centerFront',
      from: points.frontDartRight,
      to: points.cfTop,
      d: sa + paperlessOffset,
    })

    macro('ld', {
      id: 'frontDart',
      to: points.frontDartRight,
      from: points.frontDartLeft,
      d: sa + paperlessOffset * 2,
      noStartMarker: true,
      noEndMarker: true,
    })

    macro('ld', {
      id: 'frontDartLength',
      from: points.frontDartCenter,
      to: points.frontDartBottom,
      d: paperlessOffset,
    })

    macro('hd', {
      id: 'waist',
      from: points.cfTop,
      to: points.sfWaist,
      y: points.sfWaist.y + paperlessOffset,
    })

    macro('hd', {
      id: 'hem',
      to: points.cfBottom,
      from: points.sideBottom,
      y: points.sideBottom.y + paperlessOffset,
    })

    if (sa) {
      const hem = store.get('sarah.hem')
      if (options.cutFrontOnFold) {
        paths.hem = macro('hem', {
          class: 'fabric',
          path2: 'centerFront',
          path1: 'sideFront',
          hemWidth: hem,
          offset2: 0,
        }).hide()

        paths.sa = macro('sa', {
          paths: [
            'sideFront',
            { p: 'hem', offset: 0 },
            { p: 'centerFront', offset: 0 },
            'frontTopSa',
          ],
        })
      } else {
        paths.hem = macro('hem', {
          class: 'fabric',
          path2: 'centerFront',
          path1: 'sideFront',
          hemWidth: hem,
        }).hide()

        paths.sa = macro('sa', {
          paths: ['sideFront', { p: 'hem', offset: 0 }, 'centerFront', 'frontTopSa'],
        })
      }
    }

    points.title = points.cfSeat
      .shiftFractionTowards(points.sideSeat, 0.5)
      .shift(270, points.cfSeat.dist(points.cfBottom) / 2)

    points.logo = points.title.shift(90, 100)
    snippets.logo = new Snippet('logo', points.logo)

    macro('title', {
      at: points.title,
      nr: 2,
      title: 'front',
      align: 'center',
      scale: 0.8,
    })

    if (!paperless && complete) {
      points.miniscale = points.__macro_title_title_notes.shift(-90, options.paperlessOffset)

      macro('miniscale', { at: points.miniscale })
    }

    return part
  },
}
