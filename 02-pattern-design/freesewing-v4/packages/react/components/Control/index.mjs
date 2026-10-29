import React from 'react'
import { controlDesc } from '@freesewing/config'
import { BulletIcon } from '@freesewing/react/components/Icon'

/**
 * A component to render a visualisation of the user's control/UX setting
 *
 * @component
 * @param {object} props - All component props
 * @param {number} props.control - The user's control setting (a number)
 * @returns {JSX.Element}
 */
export const ControlScore = ({ control }) =>
  control ? (
    <div className={`tw:flex tw:flex-row tw:items-center tw:text-base-content`}>
      {Object.keys(controlDesc).map((score) => (
        <BulletIcon
          fill={control >= score ? true : false}
          className="tw:w-6 tw:h-6 tw:-ml-1"
          key={score}
        />
      ))}
    </div>
  ) : null
