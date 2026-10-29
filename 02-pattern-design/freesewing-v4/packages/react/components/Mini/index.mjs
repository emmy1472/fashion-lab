import React from 'react'
import { TipIcon, ChatIcon, WarningIcon } from '@freesewing/react/components/Icon'

/**
 * A component to display a mini tip
 *
 * @component
 * @param {object} props - All component props
 * @param {JSX.Element} props.children - The component children, will be rendered inside the mini tip
 * @returns {JSX.Element}
 */
export const MiniTip = ({ children }) => (
  <div className="tw:flex tw:flex-row tw:border tw:border-success tw:rounded">
    <div className="tw:bg-success tw:text-success-content tw:p-1 tw:rounded-l tw:flex tw:flex-row tw:items-center">
      <TipIcon className="tw:w-6 tw:h-6 tw:text-success-content" />
    </div>
    <div className="tw:p-1 tw:px-2 tw:text-sm tw:font-medium tw:bg-success/10 tw:grow tw:rounded-r mini">
      {children}
    </div>
  </div>
)

/**
 * A component to display a mini note
 *
 * @component
 * @param {object} props - All component props
 * @param {JSX.Element} props.children - The component children, will be rendered inside the mini note
 * @returns {JSX.Element}
 */
export const MiniNote = ({ children }) => (
  <div className="tw:flex tw:flex-row tw:border tw:border-info tw:rounded">
    <div className="tw:bg-info tw:text-info-content tw:p-1 tw:rounded-l tw:flex tw:flex-row tw:items-center">
      <ChatIcon className="tw:w-6 tw:h-6 tw:text-info-content" />
    </div>
    <div className="tw:p-1 tw:px-2 tw:text-sm tw:font-medium tw:bg-info/10 tw:grow tw:rounded-r mini">
      {children}
    </div>
  </div>
)

/**
 * A component to display a mini warning
 *
 * @component
 * @param {object} props - All component props
 * @param {JSX.Element} props.children - The component children, will be rendered inside the mini warning
 * @returns {JSX.Element}
 */
export const MiniWarning = ({ children }) => (
  <div className="tw:flex tw:flex-row tw:border tw:border-warning tw:rounded">
    <div className="tw:bg-warning tw:text-warning-content tw:p-1 tw:rounded-l tw:flex tw:flex-row tw:items-center">
      <WarningIcon className="tw:w-6 tw:h-6 tw:text-warning-content" />
    </div>
    <div className="tw:p-1 tw:px-2 tw:text-sm tw:font-medium tw:bg-warning/10 tw:grow tw:rounded-r mini">
      {children}
    </div>
  </div>
)
