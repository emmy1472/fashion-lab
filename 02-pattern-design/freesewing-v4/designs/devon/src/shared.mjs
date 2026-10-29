export function dim(part, d) {
  let { macro, points, sa } = part.shorthand()

  d.forEach((e) => {
    const id = e[0] + e[1] + e[2]
    const s = sa * (e[4] > 0 ? 1 : -1)
    macro(e[0] + 'd', {
      id: id,
      from: points[e[1]],
      to: points[e[2]],
      y: points[e[3]].y + s + e[4],
      x: points[e[3]].x + s + e[4],
      d: s + e[4],
    })
  })
}
