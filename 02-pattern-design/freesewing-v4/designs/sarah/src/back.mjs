import { base } from './base.mjs'
import { pathUtilsPlugin } from '@freesewing/plugin-path-utils'

export const back = {
  name: 'sarah.back',
  measurements: ['waist', 'seat', 'waistToSeat', 'waistToFloor'],
  optionalMeasurements: [],
  options: {},
  plugins: [pathUtilsPlugin],
  from: base,
  draft: ({
    points,
    Point,
    Path,
    paths,
    options,
    sa,
    macro,
    part,
    store,
    snippets,
    Snippet,
    complete,
    paperless,
  }) => {
    const paperlessOffset = options.paperlessOffset

    paths.centerBack = new Path().move(points.cbTop).line(points.cbBottom).hide()

    paths.sideBack = new Path()
      .move(points.sideBottom)
      .line(points.sideSeat)
      .curve(points.sshBCp, points.sshBCp, points.sshCpC)
      .curve(points.sshTCp, points.sshTCp, points.sbTop)
      .hide()

    paths.backTopNoDarts = new Path()
      .move(points.sbTop)
      .curve(points.sbtCp, points.bodRCp, points.backOutsideDartRight)
      .noop('backOutsideDart')
      .curve(points.bodLCp, points.bidRCp, points.backInsideDartRight)
      .noop('backInsideDart')
      .curve(points.bidLCp, points.cbTopCp, points.cbTop)
      .hide()

    if (complete) {
      paths.backTop = paths.backTopNoDarts
        .clone()
        .insop(
          'backOutsideDart',
          new Path().line(points.backOutsideDartBottom).line(points.backOutsideDartLeft)
        )
        .insop(
          'backInsideDart',
          new Path().line(points.backInsideDartBottom).line(points.backInsideDartLeft)
        )
    } else {
      paths.backTop = paths.backTopNoDarts
        .insop(
          'backOutsideDart',
          new Path().move(points.backOutsideDartRight).line(points.backOutsideDartLeft)
        )
        .insop(
          'backInsideDart',
          new Path().move(points.backInsideDartRight).line(points.backInsideDartLeft)
        )
    }

    paths.fabric = paths.centerBack
      .clone()
      .join(paths.sideBack)
      .join(paths.backTop)
      .addClass('fabric')

    if (sa) {
      const hem = store.get('sarah.hem')
      if (options.cutBackOnFold) {
        paths.hem = macro('hem', {
          class: 'fabric',
          path1: 'centerBack',
          path2: 'sideBack',
          hemWidth: hem,
          offset1: 0,
        }).hide()

        paths.sa = macro('sa', {
          paths: [
            { p: 'centerBack', offset: 0 },
            { p: 'hem', offset: 0 },
            'sideBack',
            'backTopNoDarts',
          ],
        })
      } else {
        paths.hem = macro('hem', {
          class: 'fabric',
          path1: 'centerBack',
          path2: 'sideBack',
          hemWidth: hem,
        }).hide()

        paths.sa = macro('sa', {
          paths: ['centerBack', { p: 'hem', offset: 0 }, 'sideBack', 'backTopNoDarts'],
        })
      }
    }

    if (options.cutBackOnFold) {
      store.cutlist.addCut({ cut: 1, onFold: true })
      macro('cutOnFold', {
        from: points.cbTop,
        to: points.cbBottom,
        grainline: true,
      })
    } else {
      store.cutlist.addCut({ cut: 2, onFold: false })
      points.gtop = points.cbTop.shift(0, options.paperlessOffset)
      points.gbottom = points.cbBottom.shift(0, options.paperlessOffset)
      macro('grainline', {
        from: points.gtop,
        to: points.gbottom,
        grainline: true,
      })
    }

    macro('vd', {
      id: 'centerBack',
      from: points.cbTop,
      to: points.cbBottom,
      x: -paperlessOffset - sa,
    })

    macro('vd', {
      id: 'waistRise',
      to: points.sbTop,
      from: points.sbWaist,
      x: points.sbTop.x + paperlessOffset + sa,
    })

    macro('ld', {
      id: 'cb2insideDart',
      from: points.cbTop,
      to: points.backInsideDartLeft,
      d: sa + paperlessOffset,
    })

    macro('ld', {
      id: 'insideDart2outsideDart',
      from: points.backInsideDartRight,
      to: points.backOutsideDartLeft,
      d: sa + paperlessOffset,
    })

    macro('ld', {
      id: 'outsideDart2side',
      from: points.backOutsideDartRight,
      to: points.sbTop,
      d: sa + paperlessOffset,
    })

    macro('ld', {
      id: 'insideDartLength',
      from: points.backInsideDartCenter,
      to: points.backInsideDartBottom,
      d: paperlessOffset,
    })

    macro('ld', {
      id: 'insideDart',
      to: points.backInsideDartRight,
      from: points.backInsideDartLeft,
      d: sa + paperlessOffset * 2,
      noStartMarker: true,
      noEndMarker: true,
    })

    macro('ld', {
      id: 'outsideDart',
      to: points.backOutsideDartRight,
      from: points.backOutsideDartLeft,
      d: sa + paperlessOffset * 2,
      noStartMarker: true,
      noEndMarker: true,
    })

    macro('ld', {
      id: 'outsideDartLength',
      from: points.backOutsideDartCenter,
      to: points.backOutsideDartBottom,
      d: paperlessOffset,
    })

    macro('hd', {
      id: 'waist',
      from: points.cbTop,
      to: points.sbWaist,
      y: points.sbWaist.y + paperlessOffset,
    })

    macro('hd', {
      id: 'hem',
      from: points.cbBottom,
      to: points.sideBottom,
      y: points.sideBottom.y + paperlessOffset,
    })

    points.title = points.cbSeat
      .shiftFractionTowards(points.sideSeat, 0.5)
      .shift(270, points.cbSeat.dist(points.cbBottom) / 2)

    points.logo = points.title.shift(90, 100)
    snippets.logo = new Snippet('logo', points.logo)

    /*
     * Add the title
     */
    macro('title', {
      at: points.title,
      nr: 1,
      title: 'back',
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
