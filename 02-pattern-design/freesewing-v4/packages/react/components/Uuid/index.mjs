import React from 'react'
import { shortUuid } from '@freesewing/utils'
import { Link as WebLink } from '@freesewing/react/components/Link'
import { CopyToClipboardButton } from '@freesewing/react/components/Button'

/**
 * A component to display a short version of a (v4) UUID
 *
 * @component
 * @param {object} props - All component props
 * @param {React.FC} [props.Link = false] - An optional framework-specific Link component
 * @param {string} props.uuid - The UUID
 * @param {string} [props.href = false] - An optional href to make this into a link
 * @param {string} [props.label = false] - An optional label to pass to the CopyToClipboardButton
 * @returns {JSX.Element}
 */
export const Uuid = ({ uuid, href = false, label = 'UUID', Link = false }) => {
  if (!Link) Link = WebLink

  if (href === false)
    return (
      <span className="flex flex-row items-center">
        <span className="daisy-badge daisy-badge-secondary font-mono">{shortUuid(uuid)}</span>
        <CopyToClipboardButton content={uuid} label={label} sup />
      </span>
    )

  return (
    <span className="flex flex-row items-center">
      <Link href={href} title={uuid}>
        <span className="daisy-badge daisy-badge-secondary font-mono">{shortUuid(uuid)}</span>
      </Link>
      <CopyToClipboardButton content={uuid} label={label} sup />
    </span>
  )
}
