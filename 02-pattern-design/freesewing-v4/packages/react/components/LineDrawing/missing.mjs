import React from 'react'
import { LineDrawingWrapper, regular } from './shared.mjs'

/**
 * A linedrawing component for designs that do not (yet) have their own
 *
 * @component
 * @param {object} props - All component props
 * @param {string} props.className - Any CSS classes to apply
 * @param {number} props.stroke - The stroke width to apply
 * @returns {JSX.Element}
 */
export const MissingLinedrawing = ({ className, stroke = 1 }) => (
  <LineDrawingWrapper viewBox="0 0 100 100" {...{ className }}>
    <path
      key="stitches"
      {...regular(stroke * 3)}
      d="m 20 20 L 80 80 M 20 80 L 80 20"
      style={{ opacity: 0.6 }}
    />
    <text
      fill="currentColor"
      stroke="none"
      textAnchor="middle"
      style={{ fontSize: '7px', opacity: '0.6' }}
    >
      <tspan x="50" y="90">
        No line drawing (yet)
      </tspan>
    </text>
  </LineDrawingWrapper>
)
