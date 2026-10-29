import React, { useContext, useState } from 'react'
import { copyToClipboard } from '@freesewing/utils'
import { CopyIcon, OkIcon } from '@freesewing/react/components/Icon'
import { LoadingStatusContext } from '@freesewing/react/context/LoadingStatus'

const handleCopied = (content, setCopied, setLoadingStatus, label, handler = false) => {
  copyToClipboard(content)
  setCopied(true)
  setLoadingStatus([
    true,
    label ? `${label} copied to clipboard` : 'Copied to clipboard',
    true,
    true,
  ])
  setTimeout(() => setCopied(false), 1000)
  if (typeof handler === 'function') handler(content, label)
}

/**
 * A component to copy something to the clipboard
 *
 * @component
 * @param {object} props - All component props
 * @param {JSX.element} props.children - The component children
 * @param {string} [props.btnClasses = 'tw:daisy-btn tw:daisy-btn-ghost tw:hover:border-transparent w:hover:border-transparent tw:hover:shadow-none'] - The content that should be copied to the clipboard
 * @param {string} props.content - The content that should be copied to the clipboard
 * @param {string} props.label - The label to show when the content is copied
 * @param {function} [props.onCopy=false] - An optional handler to call after copying to the clipboard, receives content, label as parameters
 * @param {boolean} props.sup - Set this to true to render as superscript (above the line)
 * @returns {JSX.Element}
 */
export const CopyToClipboardButton = ({
  children,
  content,
  label = false,
  sup = false,
  btnClasses = 'tw:daisy-btn tw:daisy-btn-ghost tw:hover:border-transparent w:hover:border-transparent tw:hover:shadow-none',
  onCopy = false,
}) => {
  const [copied, setCopied] = useState(false)
  const { setLoadingStatus } = useContext(LoadingStatusContext)

  const style = sup ? 'tw:w-4 tw:h-4 tw:-mt-4 tw:-ml-1' : 'tw:w-5 tw:h-5'

  return (
    <button
      className={
        (copied ? 'tw:text-success ' : '') +
        btnClasses +
        ' tw:w-full tw:lg:w-auto tw:group tw:flex tw:flex-row tw:justify-between'
      }
      onClick={() => handleCopied(content, setCopied, setLoadingStatus, label, onCopy)}
    >
      {sup ? children : null}
      {copied ? (
        <OkIcon
          className={`${style} tw:text-success-content tw:bg-success tw:rounded-full tw:p-1`}
          stroke={4}
        />
      ) : (
        <CopyIcon className={`${style} tw:text-inherit tw:group-hover:text-secondary`} />
      )}
      {sup ? null : children}
    </button>
  )
}

/**
 * A button with an icon and a label, something which we commonly use across our UI.
 *
 * @component
 * @param {object} props - All component props
 * @param {string} [props.btnProps={}] - Any props to pass to the button
 * @param {string} [props.children=[]] - The button children (content)
 * @param {string} [props.className=''] - Any extra classes to add to the button
 * @param {string} [props.title=''] - The button title
 * @param {string} [props.color='primary'] - The main button color, one of DaisyUI's named colors
 * @param {string} [props.href=false] - Set this to render a link instead of a button
 * @param {function} [props.onClick=false] - Set this to render a button instead of a link
 * @returns {JSX.Element}
 */
export const IconButton = ({
  btnProps = {},
  children = [],
  className = '',
  color = 'primary',
  href = false,
  onClick = false,
  title = '',
}) => {
  const allProps = {
    className: `tw:daisy-btn-${color} hover:tw:text-${color}-content ${className}`,
    title: title,
    ...btnProps,
  }
  if (onClick) allProps.onClick = onClick
  else if (href) allProps.href = href

  return onClick ? (
    <button {...allProps}>
      <div className={`tw:text-${color}-content ${staticLinkClasses}`}>{children}</div>
    </button>
  ) : (
    <a {...allProps}>
      <div className={`tw:text-${color}-content ${staticLinkClasses}`}>{children}</div>
    </a>
  )
}

const staticLinkClasses =
  'tw:flex tw:flex-row tw:gap-2 tw:lg:gap-6 tw:items-center tw:grow ' +
  'tw:justify-between tw:w-full tw:md:w-auto tw:daisy-btn tw:hover:no-underline tw:capitalize'
