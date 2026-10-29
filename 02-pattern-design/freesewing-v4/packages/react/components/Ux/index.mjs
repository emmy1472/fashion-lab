import React from 'react'
import { CircleIcon } from '@freesewing/react/components/Icon'

/**
 * A component to display the UX (control) setting
 *
 * @component
 * @param {object} props - All component props
 * @param {number} [props.ux = 0] - The value of the ux/control setting
 * @returns {JSX.Element}
 */
export const Ux = ({ ux = 0 }) => (
  <div className="tw:flex tw:flex-row">
    {[0, 1, 2, 3, 4].map((i) => (
      <CircleIcon
        key={i}
        fill={i < ux ? true : false}
        className={`tw:w-6 tw:h-6 ${i < ux ? 'tw:stroke-secondary tw:fill-secondary' : 'tw:stroke-current'}`}
        fillOpacity={0.3}
      />
    ))}
  </div>
)

/**
 * A component to display a mini version of the UX (control) setting
 *
 * @component
 * @param {object} props - All component props
 * @param {number} [props.ux = 0] - The value of the ux/control setting
 * @returns {JSX.Element}
 */
export const UxMini = ({ ux = 0 }) => (
  <CircleIcon className={`tw:w-6 tw:h-6 tw:stroke-secondary tw:fill-secondary/20`} label={ux} />
)
