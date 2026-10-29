import React, { useState, useContext } from 'react'
import { copyToClipboard } from '@freesewing/utils'
import { LoadingStatusContext } from '@freesewing/react/context/LoadingStatus'

/**
 * A component to display key/value pairs
 *
 * @component
 * @param {object} props - All component props
 * @param {boolean} [props.small = false] - Set this to render a small version
 * @param {string} [props.color = primary] - The DaisyUI color to apply
 * @param {boolean} [props.href = false] - Set this to make this a link
 * @param {string} props.k - The key to display (key is a reserved react prop, so we use k)
 * @param {boolean} [props.onClick = false] - Set this to make this a button
 * @param {string} props.val - The value to display
 * @returns {JSX.Element}
 */
export const KeyVal = ({
  k,
  val,
  color = 'primary',
  small = false,
  href = false,
  onClick = false,
}) => {
  const setCopied = useState(false)[1]
  const { setLoadingStatus } = useContext(LoadingStatusContext)

  let colorClasses1 = primaryClasses1
  if (color === 'secondary') colorClasses1 = secondaryClasses1
  else if (color === 'neutral') colorClasses1 = neutralClasses1
  else if (color === 'accent') colorClasses1 = accentClasses1
  else if (color === 'info') colorClasses1 = infoClasses1
  else if (color === 'warning') colorClasses1 = warningClasses1
  else if (color === 'success') colorClasses1 = successClasses1
  else if (color === 'error') colorClasses1 = errorClasses1
  let colorClasses2 = primaryClasses2
  if (color === 'secondary') colorClasses2 = secondaryClasses2
  else if (color === 'neutral') colorClasses2 = neutralClasses2
  else if (color === 'accent') colorClasses2 = accentClasses2
  else if (color === 'info') colorClasses2 = infoClasses2
  else if (color === 'warning') colorClasses2 = warningClasses2
  else if (color === 'success') colorClasses2 = successClasses2
  else if (color === 'error') colorClasses2 = errorClasses2

  if (href) return <LinkKeyVal {...{ k, val, color, small, href, colorClasses1, colorClasses2 }} />

  const inner = (
    <>
      <span
        className={`${sharedClasses} ${small ? 'tw:rounded-l' : 'tw:rounded-l-lg'} ${colorClasses1} ${small ? 'tw:text-xs' : ''} tw:pr-0.5`}
      >
        {k}
      </span>
      <span
        className={`${sharedClasses} ${small ? 'tw:rounded-r' : 'tw:rounded-r-lg'} ${colorClasses2} ${small ? 'tw:text-xs' : ''} tw:pl-0.5`}
      >
        {val}
      </span>
    </>
  )

  return onClick === false ? (
    <button
      className="tw:daisy-btn-ghost tw:p-0"
      onClick={() => {
        copyToClipboard(val)
        handleCopied(setCopied, setLoadingStatus, k)
      }}
    >
      {inner}
    </button>
  ) : (
    <button
      className="tw:daisy-btn-ghost tw:p-0"
      onClick={typeof onClick === 'function' ? onClick : null}
    >
      {inner}
    </button>
  )
}

const LinkKeyVal = ({
  k,
  val,
  small = false,
  href = false,
  colorClasses1,
  colorClasses2,
  Link = false,
}) => {
  const inner = (
    <>
      <span
        className={`${sharedClasses} ${small ? 'tw:rounded-l' : 'tw:rounded-l-lg'} ${colorClasses1} ${small ? 'tw:text-xs' : ''} tw:pr-0.5`}
      >
        {k}
      </span>
      <span
        className={`${sharedClasses} ${small ? 'tw:rounded-r' : 'tw:rounded-r-lg'} ${colorClasses2} ${small ? 'tw:text-xs' : ''} tw:pl-0.5`}
      >
        {val}
      </span>
    </>
  )
  const linkProps = {
    className: 'tw:daisy-btn-ghost tw:p-0 tw:hover:no-underline tw:hover:bg-transparent',
    href: href,
  }

  return Link ? <Link {...linkProps}>{inner}</Link> : <a {...linkProps}>{inner}</a>
}

/*
 * If we configure the tailwind classes dynamically, they won't be picked up
 * So let's create a component for each color
 */
const sharedClasses = `tw:px-1 tw:text-sm tw:font-medium tw:whitespace-nowrap tw:border-2 tw:border-solid`
const primaryClasses1 = `tw:text-primary-content tw:bg-primary tw:border-primary`
const primaryClasses2 = `tw:text-primary tw:border-primary`
const secondaryClasses1 = `tw:text-secondary-content tw:bg-secondary tw:border-secondary`
const secondaryClasses2 = `tw:text-secondary tw:border-secondary`
const neutralClasses1 = `tw:text-neutral-content tw:bg-neutral tw:border-neutral`
const neutralClasses2 = `tw:text-neutral tw:border-neutral`
const accentClasses1 = `tw:text-accent-content tw:bg-accent tw:border-accent`
const accentClasses2 = `tw:text-accent tw:border-accent`
const infoClasses1 = `tw:text-info-content tw:bg-info tw:border-info`
const infoClasses2 = `tw:text-info tw:border-info`
const warningClasses1 = `tw:text-warning-content tw:bg-warning tw:border-warning`
const warningClasses2 = `tw:text-warning tw:border-warning`
const successClasses1 = `tw:text-warning-content tw:bg-success tw:border-success`
const successClasses2 = `tw:text-success tw:border-success`
const errorClasses1 = `tw:text-error-content tw:bg-error tw:border-error`
const errorClasses2 = `tw:text-error tw:border-error`

const handleCopied = (setCopied, setLoadingStatus, label) => {
  setCopied(true)
  setLoadingStatus([
    true,
    label ? `${label} copied to clipboard` : 'Copied to clipboard',
    true,
    true,
  ])
  setTimeout(() => setCopied(false), 1000)
}
