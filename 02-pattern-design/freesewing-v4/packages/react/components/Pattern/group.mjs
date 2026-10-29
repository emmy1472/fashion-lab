import React, { forwardRef } from 'react'

/**
 * A component to render an SVG group
 *
 * @component
 * @param {object} props - All component props
 * @param {JSX.Element} props.children - The component children, will be rendered inside the group
 * @returns {JSX.Element}
 */
export const Group = forwardRef((props, ref) => (
  <g {...props} ref={ref}>
    {props.children}
  </g>
))

Group.displayName = 'Group'
