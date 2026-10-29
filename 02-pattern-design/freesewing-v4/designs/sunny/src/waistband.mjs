import { base } from './base.mjs'

export const waistband = {
  name: 'sunny.waistband',
  measurements: [],
  optionalMeasurements: [],
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
    paperless,
  }) => {
    const paperlessOffset = options.paperlessOffset
    const l = store.get('waistbandLength')
    const w = store.get('waistbandWidth')

    if (!options.fabricWaistband) {
      return part.hide()
    }

    if (!expand) {
      store.flag.note({
        msg: `sunny:cutWaistband`,
        notes: ['flag:saUnused', 'flag:partHiddenByExpand'],
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

    paths.waistband = new Path()
      .move(points.tl)
      .line(points.wbl)
      .line(points.wbr)
      .line(points.wtr)
      .line(points.tl)
      .close()

    if (!complete) {
      return part
    }

    paths.fold1 = new Path()
      .move(points.wfold1tr)
      .line(points.wfold1tl)
      .move(points.wfold1br)
      .line(points.wfold1bl)
      .addClass('fabric dashed stroke-sm')

    paths.fold2 = new Path()
      .move(points.wfold2r)
      .line(points.wfold2l)
      .addClass('fabric lashed stroke-sm')

    macro('hd', {
      id: 'length',
      from: points.tl,
      to: points.wtr,
      y: paperlessOffset,
    })

    macro('hd', {
      id: 'waistNotch1',
      from: points.wfold1tl,
      to: points.wtlNotch,
      y: points.wfold1tl.y + paperlessOffset,
    })

    macro('hd', {
      id: 'waistNotch2',
      to: points.wfold1tr,
      from: points.wtrNotch,
      y: points.wfold1tr.y + paperlessOffset,
    })

    macro('vd', {
      id: 'width',
      from: points.tl,
      to: points.wbl,
      x: paperlessOffset,
    })

    macro('vd', {
      id: 'wfold',
      from: points.wtr,
      to: points.wfold1tr,
      x: points.wtr.x - paperlessOffset,
    })

    store.cutlist.addCut({ cut: 2, identical: true })

    macro('sprinkle', {
      snippet: 'notch',
      on: ['wtlNotch', 'wtrNotch', 'wblNotch', 'wbrNotch'],
    })

    macro('title', {
      at: points.title,
      nr: options.fabricBinding ? 3 : 2,
      title: 'waistband',
      align: 'center',
    })

    return part
  },
}
