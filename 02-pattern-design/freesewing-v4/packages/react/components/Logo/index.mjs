import React from 'react'
import { logoPath } from '@freesewing/config'

/**
 * The FreeSewing logo, aka Skully, as a React component
 *
 * @component
 * @param {object} props - All component props
 * @param {string} [props.className = "tw:w-20 tw:h-20"] - Custom CSS classes to apply
 * @param {string} [props.stroke = undefined] - Set this explicitly to use a different stroke color
 * @returns {JSX.Element}
 */
export const FreeSewingLogo = ({ className = 'tw:w-20 tw:h-20', stroke }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="1 0 25 25" className={className}>
    <defs>
      <path id="react-logo" d={logoPath} />
    </defs>
    <use
      xlinkHref="#react-logo"
      fill="none"
      strokeWidth="0.5"
      style={{ stroke: stroke ? stroke : 'var(--color-base-100)' }}
    />
    <use xlinkHref="#react-logo" fill="currentColor" stroke="none" />
  </svg>
)
