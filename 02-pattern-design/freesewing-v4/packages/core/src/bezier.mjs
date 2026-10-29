import { Bezier as UpstreamBezier } from 'bezier-js'

/*
 * The BezierJS library has an issue where it does not find
 * the intersection of two paths under some circumstances.
 * See: https://github.com/Pomax/bezierjs/issues/203
 *
 * A PR was submitted to address this by Jonathan Haas
 * See: https://github.com/Pomax/bezierjs/pull/219
 *
 * However, that PR does not get any attention, and in general
 * the library seems to be rather unmaintained. The maintainer
 * (Pomax) says as much in the README.
 *
 * That being said, BezierJS is a great library and this stuff
 * is just hard because there is no closed-form integral solution
 * for this, so a lot of this is trial an error.
 *
 * Rather than maintain a fork, we extend the Bezier class and
 * implement our own reduce method.
 *
 * The changes to the reduce method where written by Jonathan <3
 */

/*
 * Extend the upstream Bezier class with a custom reduce method
 */
class Bezier extends UpstreamBezier {
  reduce() {
    const utils = this.getUtils()
    const EPSILON = 0.001

    if (!(this.length() > 0)) {
      return []
    }

    function reduceStep(bezier) {
      const splitTs = []
      let t1 = 0

      // This is a inverted to return [] on NaN _tX values
      // since NaN compared with something is always false
      if (!(bezier._t2 - bezier._t1 >= EPSILON)) {
        // very short, ignore
        return []
      }

      if (bezier.simple()) {
        // already simple
        return [bezier]
      }

      while (t1 < 1) {
        // Check if the rest of the curve is already simple
        const remaining = bezier.split(t1, 1)
        if (remaining.simple()) {
          break
        }

        // Binary search to find the furthest simple segment
        let low = t1 + EPSILON
        let high = 1
        let best = t1 + EPSILON

        if (low > high) {
          break
        }

        for (let i = 0; i < 20; i++) {
          // limit to 20 iterations max
          const mid = (low + high) / 2
          const segment = bezier.split(t1, mid)

          if (segment.simple()) {
            best = mid
            low = mid
          } else {
            high = mid
          }

          if (t1 !== best && i >= 5) {
            // we have found a good split location, don't need to be super exact
            break
          }
        }

        splitTs.push(best)

        t1 = best
      }

      // endpoint
      splitTs.push(1)

      // Split the curve using the collected t values
      const parts = []
      let prevT = 0

      for (const t of splitTs) {
        const segment = bezier.split(prevT, t)
        segment._t1 = utils.map(prevT, 0, 1, bezier._t1, bezier._t2)
        segment._t2 = utils.map(t, 0, 1, bezier._t1, bezier._t2)
        parts.push(segment)
        prevT = t
      }

      return parts
    }

    // Vars we'll use
    let i,
      t1,
      t2 = 0,
      segment,
      pass1 = [],
      pass2 = []

    // First pass: split on extrema
    let extrema = this.extrema().values
    // remove extrema very close to 1 or 0
    while (extrema[0] < EPSILON) {
      extrema.shift()
    }
    while (extrema[extrema.length - 1] > 1 - EPSILON) {
      extrema.shift()
    }
    // add 1 and 0
    extrema.unshift(0)
    extrema.push(1)

    for (t1 = extrema[0], i = 1; i < extrema.length; i++) {
      t2 = extrema[i]
      segment = this.split(t1, t2)
      segment._t1 = t1
      segment._t2 = t2
      pass1.push(segment)
      t1 = t2
    }

    // second pass: further reduce these segments to simple segments
    pass1.forEach(function (p1) {
      pass2.push(...reduceStep(p1))
    })
    return pass2
  }
}

export { Bezier }
