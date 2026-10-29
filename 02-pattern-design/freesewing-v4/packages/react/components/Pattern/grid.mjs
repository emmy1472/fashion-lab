import React from 'react'

/**
 * A component to render the grid for a paperless FreeSewing pattern' stack
 *
 * @component
 * @param {object} props - All component props
 * @param {Stack} props.stack - The FreeSewing Stack object for the pattern
 * @param {string} props.stackName - The name of the FreeSewing Stack
 * @returns {JSX.Element}
 */
export const Grid = ({ stack, stackName }) => (
  <rect
    x={stack.topLeft.x}
    y={stack.topLeft.y}
    width={stack.width}
    height={stack.height}
    className="grid"
    fill={'url(#grid-' + stackName + ')'}
  />
)
