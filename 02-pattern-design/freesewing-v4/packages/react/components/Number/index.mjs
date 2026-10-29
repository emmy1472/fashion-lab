import React from 'react'

/**
 * A component to display a number or character inside a circle
 *
 * @component
 * @param {object} props - All component props
 * @param {number|string} props.nr - The number to display
 * @param {string} [props.color = secondary] - One of the DaisyUI color names
 * @returns {JSX.Element}
 */
export const NumberCircle = ({ nr, color = 'secondary' }) => (
  <span
    className={`tw:p-2 tw:w-8 tw:h-8 tw:flex tw:flex-col tw:items-center tw:justify-center tw:shrink-0 tw:rounded-full tw:text-center tw:p-0 tw:py-2 tw:bg-${
      color
    } tw:text-${color}-content tw:border-2 tw:border-base-100`}
  >
    {nr}
  </span>
)
