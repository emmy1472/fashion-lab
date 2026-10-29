import { base } from './base.mjs'
import { pathUtilsPlugin } from '@freesewing/plugin-path-utils'

export const panel = {
  name: 'sunny.panel',
  measurements: [],
  optionalMeasurements: [],
  plugins: [pathUtilsPlugin],
  from: base,
  options: {},
  draft: ({
    Point,
    points,
    Path,
    paths,
    macro,
    part,
    store,
    expand,
    units,
    sa,
    snippets,
    Snippet,
    complete,
    options,
  }) => {
    const paperlessOffset = options.paperlessOffset
    const hem = store.get('hem')

    if (!expand) {
      const w = store.get('width') + 2 * sa
      const l = store.get('length') + sa + (sa ? hem : 0)

      store.flag.note({
        msg: `sunny:cutPanel`,
        notes: ['flag:partHiddenByExpand'],
        replace: {
          width: units(w),
          length: units(l),
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

    paths.left = new Path().move(points.tl).line(points.bl).hide()

    paths.right = new Path().move(points.br).line(points.tr).hide()

    paths.top = new Path().move(points.tr).line(points.tl).hide()

    paths.fabric = paths.left.join(paths.right).join(paths.top)

    if (complete) {
      paths.upFolds.unhide()
      paths.downFolds.unhide()
    }

    macro('sprinkle', {
      snippet: 'notch',
      on: ['tl', 'tr'],
    })

    if (sa) {
      paths.hem = macro('hem', {
        class: 'fabric',
        path1: 'left',
        path2: 'right',
        hemWidth: hem,
      })
      paths.sa = macro('sa', {
        paths: ['left', { p: 'hem', offset: 0 }, 'right', 'top'],
      })
    }

    macro('sprinkle', {
      snippet: 'notch',
      on: ['rNotch', 'lNotch'],
    })

    macro('hd', {
      id: 'length',
      from: points.tl,
      to: points.tr,
      y: paperlessOffset,
    })

    macro('hd', {
      id: 'pleatA',
      to: points.pleat3_top_down,
      from: points.pleat3_top_up,
      y: paperlessOffset * 2,
    })

    macro('hd', {
      id: 'pleatB',
      from: points.pleat3_top_down,
      to: points.pleat4_top_up,
      y: paperlessOffset * 2,
    })

    macro('vd', {
      id: 'width',
      from: points.tl,
      to: points.bl,
      x: paperlessOffset,
    })

    snippets.logo = new Snippet('logo', points.logo)

    macro('title', {
      at: points.title,
      nr: 1,
      title: 'panel',
      align: 'center',
    })

    return part
  },
}
