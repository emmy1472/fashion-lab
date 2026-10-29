import React from 'react'
import { withinPartBounds } from './utils.mjs'

/**
 * A component to render a FreeSewing Point in a pattern
 *
 * @component
 * @param {object} props - All component props
 * @param {string} props.stackName - The name of the stack the part belongs to
 * @param {string} props.partName - The name of the part
 * @param {string} props.pointName - The name of the point
 * @param {object} props.point - The point object itself
 * @param {object} props.components - An object holding the pattern compnents to use
 * @param {object} props.strings - An object holding translations
 * @returns {JSX.Element}
 */
export const Point = ({ stackName, partName, pointName, part, point, components, strings }) => {
  /*
   * Don't include points outside the part bounding box
   * Unless the `data-render-always` attribute is set
   *
   * FIXME: This is undocumented
   */
  if (!withinPartBounds(point, part) && !point.attributes.list['data-render-always']) return null

  // Get potentially swizzled components
  const { Circle, Text } = components

  return point.attributes ? (
    <>
      {point.attributes.text ? (
        <Text {...{ point, pointName, partName, stackName, strings }} />
      ) : null}
      {point.attributes.circle ? <Circle point={point} /> : null}
    </>
  ) : null
}
