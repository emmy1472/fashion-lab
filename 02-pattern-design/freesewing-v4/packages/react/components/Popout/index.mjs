import React, { useState } from 'react'
import { CloseIcon } from '@freesewing/react/components/Icon'

/*
 * Resist the urge to DRY this up by contructing classNames dynamically
 * as doing so will cause them to be dropped from the production bundle
 */
const types = {
  comment: {
    bg: 'tw:bg-success/5',
    border: 'tw:border-success',
    text: 'tw:text-success',
  },
  error: {
    bg: 'tw:bg-error/5',
    border: 'tw:border-error',
    text: 'tw:text-error',
  },
  fixme: {
    bg: 'tw:bg-neutral/5',
    border: 'tw:border-neutral',
    text: 'tw:text-error',
  },
  link: {
    bg: 'tw:bg-secondary/5',
    border: 'tw:border-secondary',
    text: 'tw:text-secondary',
  },
  note: {
    bg: 'tw:bg-primary/5',
    border: 'tw:border-primary',
    text: 'tw:text-primary',
  },
  related: {
    bg: 'tw:bg-info/5',
    border: 'tw:border-info',
    text: 'tw:text-info',
  },
  tip: {
    bg: 'tw:bg-accent/5',
    border: 'tw:border-accent',
    text: 'tw:text-accent',
  },
  warning: {
    bg: 'tw:bg-warning/5',
    border: 'tw:border-warning',
    text: 'tw:text-warning',
  },
}

/**
 * This popout component is a way to make some content stand out
 *
 * @component
 * @param {object} props - All React props
 * @param {string} [props.by = false] - When type is comment, this will be used to show who made the comment
 * @param {JSX.Element} props.children - The component children, will be rendered if props.js is not set
 * @param {boolean} [props.compact = false] - Set this to render a compact style
 * @param {boolean} [props.dense = false] - Set this to render a dense style (only for compact view)
 * @param {boolean} [props.hideable = false] - Set this to make the popout hideable/dismissable
 * @param {string} [props.type = note] - One of the available types: comment, error, fixme, link, note, related, tip, warning
 * @param {string} [props.title = false] - Set this to use a custom title
 * @returns {JSX.Element}
 */
export const Popout = ({
  by = false,
  children = null,
  compact = false,
  dense = false,
  hideable = false,
  type = 'note',
  title = false,
}) => {
  // Make this hideable/dismissable
  const [hide, setHide] = useState(false)

  if (hide) return null

  return compact ? (
    <CompactPopout {...{ by, compact, dense, hideable, type, title, setHide }}>
      {children}
    </CompactPopout>
  ) : (
    <RegularPopout {...{ by, hideable, type, title, setHide }}>{children}</RegularPopout>
  )
}

const RegularPopout = ({ by, children, hideable, type, title, setHide }) => (
  <div className={`tw:relative tw:my-8 tw:-ml-4 tw:-mr-4 tw:sm:ml-0 tw:sm:mr-0 ${types[type].bg}`}>
    <div
      className={`
        tw:border-y-4 tw:border-x-0 tw:sm:border-0 tw:sm:border-l-4 tw:px-6 tw:sm:px-8 tw:py-4 tw:sm:py-2
        tw:shadow tw:text-base ${types[type].border} tw:border-solid
      `}
    >
      <PopoutTitle {...{ by, hideable, setHide, title, type }} />
      <div className="tw:py-1 tw:first:mt-0 tw:popout-content">{children}</div>
      {type === 'comment' && (
        <div className={`tw:font-bold tw:italic ${types[type].text}`}>{by}</div>
      )}
    </div>
  </div>
)

const CompactPopout = ({ by, children, compact, dense, hideable, type, title, setHide }) => (
  <div
    className={`tw:relative ${
      dense ? 'tw:my-1' : 'tw:my-8'
    } ${types[type].bg} tw:-ml-4 tw:-mr-4 tw:sm:ml-0 tw:sm:mr-0`}
  >
    <div
      className={`
        tw:border-y-4 tw:sm:border-0 tw:sm:border-l-4 tw:px-4
        tw:shadow tw:text-base ${types[type].border}
        tw:flex tw:flex-row tw:items-center
        ${dense ? 'tw:py-1' : 'tw:py-2'}
      `}
    >
      <PopoutTitle {...{ by, compact, hideable, setHide, title, type }} />
      <div className="popout-content">{children}</div>
    </div>
  </div>
)

const PopoutTitle = ({ by, compact, hideable, setHide, title, type }) => (
  <div className={`tw:font-bold tw:flex tw:flex-row tw:gap-1 tw:items-end tw:justify-between`}>
    <div>
      <span className={`tw:font-bold tw:uppercase ${types[type].text}`}>
        {title ? title : types[type].title ? types[type].title : type.toUpperCase()}
        {compact ? <span className="tw:px-2">|</span> : null}
      </span>
      {type === 'comment' && by && (
        <span className={`tw:font-normal tw:text-base tw:pr-2 ${types[type].text}`}>
          {' '}
          by <b>{by}</b>
        </span>
      )}
    </div>
    {hideable && (
      <button
        onClick={() => setHide(true)}
        className={`${types[type].text} tw:hover:text-neutral tw:hover:cursor-pointer`}
        title="Close"
      >
        <CloseIcon />
      </button>
    )}
  </div>
)
