import { pctBasedOn } from '@freesewing/core'

function pctWaistSeatDiff() {
  return {
    toAbs: (val, { measurements }, mergeOptions) => {
      return val * (measurements.waist - measurements.seat)
    },
    fromAbs: (val, { measurements }, mergeOptions) => {
      return Math.round(10000 * val) / (measurements.waist - measurements.seat) / 10000
    },
  }
}

export const base = {
  name: 'sunny.base',
  measurements: ['waist', 'waistToSeat', 'seat'],
  optionalMeasurements: [],
  options: {
    paperlessOffset: 15,
    waistEase: {
      pct: 20,
      min: -30,
      max: 30,
      ...pctWaistSeatDiff(),
      menu: 'fit',
    },
    pleatOverlap: {
      pct: 0,
      min: 0,
      max: 50,
      menu: 'style',
    },
    sideOpeningLength: {
      pct: 75,
      min: 0,
      max: 100,
      ...pctBasedOn('waistToSeat'),
      menu: 'fit',
    },
    length: {
      pct: 100,
      min: 25,
      max: 400,
      ...pctBasedOn('waist'),
      menu: 'style',
    },
    waistbandWidth: {
      pct: 25,
      min: 10,
      max: 100,
      ...pctBasedOn('waistToSeat'),
      menu: (mergedOptions) => (mergedOptions.fabricWaistband ? 'style' : false),
    },
    bindingWidth: {
      pct: 25,
      min: 10,
      max: 100,
      ...pctBasedOn('waistToSeat'),
      menu: (mergedOptions) => (mergedOptions.fabricBinding ? 'style' : false),
    },
    fabricWaistband: {
      bool: false,
      menu: 'style',
    },
    fabricBinding: {
      bool: true,
      menu: 'style',
    },
    numPleats: {
      count: 10,
      min: 5,
      max: 25,
      menu: 'style',
    },
    waistbandLength: {
      pct: 150,
      min: 100,
      max: 500,
      ...pctBasedOn('waist'),
      menu: 'style',
    },
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
  draft: ({
    Point,
    points,
    Path,
    paths,
    macro,
    part,
    measurements,
    options,
    store,
    expand,
    units,
    sa,
    complete,
    snippets,
    Snippet,
    paperless,
  }) => {
    const waist = measurements.waist
    const waistEase = measurements.waistToSeat * options.waistEase
    const hWaist = (waistEase + waist) / 2
    const l = options.length * measurements.waist
    store.set('length', l)
    const w = (hWaist / (1 - options.pleatOverlap)) * 3
    store.set('width', w)

    const b = options.waistbandLength * measurements.waist
    store.set('waistbandLength', b)

    const o = options.sideOpeningLength * measurements.waistToSeat
    const h = hWaist + waistEase / 2

    if (expand) {
      store.flag.preset('expandIsOn')
    }

    const hem = options.hem * (sa ? sa : 10)
    store.set('hem', hem)
    const waistbandWidth = options.waistbandWidth * 4 * measurements.waistToSeat
    store.set('waistbandWidth', waistbandWidth)

    const bindingWidth = options.bindingWidth * 4 * measurements.waistToSeat
    store.set('bindingWidth', bindingWidth)

    if (options.fabricWaistband) {
      store.flag.note({
        msg: 'sunny:fabricWaistbandSelected',
      })
      points.wbl = new Point(0, waistbandWidth)
      points.wtr = new Point(b, 0)
      points.wbr = new Point(b, waistbandWidth)
    } else {
      store.flag.note({
        msg: 'sunny:ribbonLength',
        replace: {
          waistbandLength: units(b),
        },
      })
    }

    /*
     * Create the points
     */
    points.tl = new Point(0, 0)
    points.bl = new Point(0, l)
    points.br = new Point(w, l)
    points.tr = new Point(w, 0)

    if (complete) {
      points.lNotch = new Point(0, o)
      points.rNotch = new Point(w, o)

      if (options.fabricWaistband) {
        points.wfold1tr = points.wtr.shift(-90, waistbandWidth / 4)
        points.wfold1tl = points.tl.shift(-90, waistbandWidth / 4)
        points.wfold1br = points.wbr.shift(90, waistbandWidth / 4)
        points.wfold1bl = points.wbl.shift(90, waistbandWidth / 4)

        points.wfold2r = points.wtr.shift(-90, waistbandWidth / 2)
        points.wfold2l = points.tl.shift(-90, waistbandWidth / 2)

        points.wtlNotch = new Point(b / 2 - h / 2, waistbandWidth / 4)
        points.wtrNotch = new Point(b / 2 + h / 2, waistbandWidth / 4)
        points.wblNotch = new Point(b / 2 - h / 2, (waistbandWidth / 4) * 3)
        points.wbrNotch = new Point(b / 2 + h / 2, (waistbandWidth / 4) * 3)
      }

      if (options.fabricBinding) {
        points.bbl = new Point(0, bindingWidth)
        points.btr = new Point(h, 0)
        points.bbr = new Point(h, bindingWidth)
        points.bfold1tr = points.btr.shift(-90, bindingWidth / 4)
        points.bfold1tl = points.tl.shift(-90, bindingWidth / 4)
        points.bfold1br = points.bbr.shift(90, bindingWidth / 4)
        points.bfold1bl = points.bbl.shift(90, bindingWidth / 4)

        points.bfold2r = points.btr.shift(-90, bindingWidth / 2)
        points.bfold2l = points.tl.shift(-90, bindingWidth / 2)
      }

      const pps = options.numPleats
      const ws = (measurements.waist + waistEase) / 2
      const pleatWidth = ws / options.numPleats
      const pleatInterval = pleatWidth * (3 - options.pleatOverlap)

      // pleat
      for (let i = 0; i < pps; i++) {
        // up/down
        for (let j = 0; j < 2; j++) {
          // top/bottom
          for (let k = 0; k < 2; k++) {
            points[`pleat${i + 1}_${k ? 'top' : 'bottom'}_${j ? 'up' : 'down'}`] = points[
              k ? 'tl' : 'bl'
            ].shift(0, pleatWidth * (2 - j) + pleatInterval * i)
          }
        }
      }

      paths.upFolds = new Path().hide().addClass('lashed')
      paths.downFolds = new Path().hide().addClass('dashed')
      for (let i = pps; i > 0; i--) {
        paths.upFolds.move(points[`pleat${i}_top_up`]).line(points[`pleat${i}_bottom_up`])
        paths.downFolds.move(points[`pleat${i}_top_down`]).line(points[`pleat${i}_bottom_down`])
      }
    }

    points.text = new Point(25, 50)
    points.title = points.text.shift(0, 100)
    points.logo = points.title.shift(0, 100)

    snippets.logo = new Snippet('logo', points.logo)

    if (!paperless && complete) {
      points.miniscale = points.title.shift(-90, options.paperlessOffset + 32)

      macro('miniscale', { at: points.miniscale })
    }

    return part.hide()
  },
}
