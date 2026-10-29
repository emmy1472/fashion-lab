import { front } from './front.mjs'

function CreateCollarPoints(
  side,
  Point,
  points,
  collarWaveBackRatio,
  collarWave,
  collarWidth,
  collarLengthBack
) {
  points[side + 'CollarWaveTop'] = points[side + 'CollarTopRight'].shift(270, collarWave)
  // .addCircle(3)
  points[side + 'CollarWaveBottom'] = points[side + 'CollarBottomLeft'].shift(90, collarWave)
  points[side + 'CollarWaveBottomBack'] = points[side + 'CollarBottomRight'].shift(
    90,
    collarWidth * collarWaveBackRatio
  )
  points[side + 'CollarBackShoulder'] = points[side + 'CollarBottomLeft'].shift(0, collarLengthBack)

  let waveWidth = points[side + 'CollarBackShoulder'].dist(points[side + 'CollarBottomRight'])
  points[side + 'CollarBottomWave'] = new Point(
    points[side + 'CollarBackShoulder'].x + waveWidth / 2,
    points[side + 'CollarBottomLeft'].y
  )
  points[side + 'CollarBottomWaveCp1'] = points[side + 'CollarBottomWave'].shift(
    0,
    waveWidth * 0.25
  )
  points[side + 'CollarBottomWaveCp2'] = points[side + 'CollarBottomWave'].shift(
    180,
    waveWidth * 0.25
  )
  points[side + 'CollarWaveBottomCp1'] = new Point(
    points[side + 'CollarBackShoulder'].x,
    points[side + 'CollarWaveBottom'].y
  )

  points[side + 'CollarTopLeftCp2'] = new Point(collarLengthBack, 0)
  points[side + 'CollarTopRight'] = points[side + 'CollarWaveTop'].shift(0, collarWidth * 0.3)
}

export const collar = {
  name: 'devon.collar',
  from: front,
  hide: {
    self: false,
    from: true,
    inherited: true,
  },
  options: {
    // Constants
    collarWidthRatio: 87 / 254,
    underCollarWaveRatio: 0.1,
    upperCollarWaveRatio: 0.05,
    underCollarWaveBackRatio: 0.06,
    upperCollarWaveBackRatio: 0.1,
    upperUnderRatio: 0.02,
    // Parameters
  },
  draft: ({ Point, points, Path, paths, options, store, part }) => {
    for (const i in paths) {
      delete paths[i]
    }
    for (const i in points) {
      delete points[i]
    }

    const collarLength = store.get('collarLength') * (1 - options.collarLengthRatio)
    const collarLengthBack = store.get('collarLengthBack')
    const collarWidth = collarLength * options.collarWidthRatio

    store.set('collarUpperUnderRatio', options.upperUnderRatio + 1)

    points.boxTopLeft = new Point(0, 0)
    points.boxTopRight = new Point(collarLength, 0)
    points.boxBottomLeft = new Point(0, collarWidth)
    points.boxBottomRight = new Point(collarLength, collarWidth)

    points.underCollarTopLeft = points.boxTopLeft.copy()
    points.underCollarTopRight = points.boxTopRight.copy()
    points.underCollarBottomLeft = points.boxBottomLeft.copy()
    points.underCollarBottomRight = points.boxBottomRight.copy()

    points.upperCollarTopLeft = points.boxTopLeft.copy()
    points.upperCollarTopRight = points.boxTopRight.shiftFractionTowards(
      points.boxTopLeft,
      options.upperUnderRatio * -1
    )
    points.upperCollarBottomLeft = points.boxBottomLeft.shiftFractionTowards(
      points.boxTopLeft,
      options.upperUnderRatio * -1
    )
    points.upperCollarBottomRight = points.upperCollarBottomLeft.copy()
    points.upperCollarBottomRight.x = points.upperCollarTopRight.x

    paths.underBox = new Path()
      .move(points.underCollarTopLeft)
      .line(points.underCollarBottomLeft)
      .line(points.underCollarBottomRight)
      .line(points.underCollarTopRight)
      .line(points.underCollarTopLeft)
      .close()
      .attr('class', 'lining')
      .hide()
    paths.upperBox = new Path()
      .move(points.upperCollarTopLeft)
      .line(points.upperCollarBottomLeft)
      .line(points.upperCollarBottomRight)
      .line(points.upperCollarTopRight)
      .line(points.upperCollarTopLeft)
      .close()
      .attr('class', 'canvas')
      .hide()

    CreateCollarPoints(
      'under',
      Point,
      points,
      options.underCollarWaveBackRatio,
      collarWidth * options.underCollarWaveRatio,
      collarWidth,
      collarLengthBack
    )
    CreateCollarPoints(
      'upper',
      Point,
      points,
      options.upperCollarWaveBackRatio,
      collarWidth * options.upperCollarWaveRatio,
      collarWidth,
      collarLengthBack
    )

    return part
  },
}
