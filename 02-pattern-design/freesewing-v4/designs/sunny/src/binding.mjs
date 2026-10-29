import { base } from './base.mjs'
import { pathUtilsPlugin } from '@freesewing/plugin-path-utils'

export const binding = {
  name: 'sunny.binding',
  measurements: [],
  optionalMeasurements: [],
  plugins: [pathUtilsPlugin],
  from: base,
  draft: ({
    Point,
    points,
    Path,
    paths,
    macro,
    part,
    options,
    expand,
    store,
    units,
    snippets,
    Snippet,
    complete,
    sa,
  }) => {
    const paperlessOffset = options.paperlessOffset
    const l = store.get('width')
    const w = store.get('bindingWidth')

    if (!options.fabricBinding) {
      return part.hide()
    }

    if (!expand) {
      store.flag.note({
        msg: `sunny:cutBinding`,
        notes: ['flag:saUnused', 'flag:partHiddenByExpand'],
        replace: {
          width: units(w),
          length: units(l + 2 * sa),
        },
        suggest: {
          text: 'flag:show',
          icon: 'expand',
          update: {
            settings: ['expand', 1],
          },
        },
      })

      return part.hide()
    }

    if (complete) {
      paths.bfold1 = new Path()
        .move(points.bfold1tr)
        .line(points.bfold1tl)
        .move(points.bfold1br)
        .line(points.bfold1bl)
        .addClass('fabric dashed stroke-sm')

      paths.bfold2 = new Path()
        .move(points.bfold2r)
        .line(points.bfold2l)
        .addClass('fabric lashed stroke-sm')
    }

    paths.bLeft = new Path().move(points.tl).line(points.bbl).hide()

    paths.bRight = new Path().move(points.bbr).line(points.btr).hide()

    paths.bTop = new Path().move(points.btr).line(points.tl).hide()

    paths.bBottom = new Path().move(points.bbl).line(points.bbr).hide()

    paths.binding = paths.bLeft.clone().join(paths.bBottom).join(paths.bRight).join(paths.bTop)

    if (sa) {
      paths.sa = macro('sa', {
        paths: ['bLeft', { p: 'bBottom', offset: 0 }, 'bRight', { p: 'bTop', offset: 0 }],
      })
    }

    macro('hd', {
      id: 'length',
      from: points.tl,
      to: points.btr,
      y: 10,
    })

    macro('vd', {
      id: 'width',
      from: points.tl,
      to: points.bbl,
      x: 10,
    })

    macro('sprinkle', {
      snippet: 'notch',
      on: ['tl', 'btr', 'bbl', 'bbr'],
    })

    macro('vd', {
      id: 'bfold',
      from: points.btr,
      to: points.bfold1tr,
      x: points.btr.x - paperlessOffset,
    })

    store.cutlist.addCut({ cut: 2, identical: true })

    macro('title', {
      at: points.title,
      nr: 2,
      title: 'binding',
      align: 'center',
    })

    return part
  },
}
