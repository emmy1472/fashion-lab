import React from 'react'
import { CopyToClipboardButton } from '@freesewing/react/components/Button'

const defaultTitles = {
  js: 'Javascript',
  bash: 'Bash commands',
  sh: 'Shell commands',
  json: 'JSON',
  yaml: 'YAML',
}

/**
 * A React component to highlight code
 *
 * @component
 * @param {object} props - All React props
 * @param {string} [props.language = 'txt'] - The language to highlight
 * @param {JSX.Element} props.children - The React children (this is the code to highlight)
 * @param {bool} [props.raw = false] - Set this to true to not escape tags
 * @param {string} [props.title = false] - Title for the highlight. When
 * language is js, bash, sh, json, or yaml the title will be set accordingly
 * (but you can still pass in a custom one)
 * @param {string} [props.copy = props.children] - Content for the copy to clipboard button, by default this will use props.children
 * @param {bool} [props.noCopy = false]  - Set this to true to not add the copy to clipboard button
 * @returns {JSX.Element}
 */
export const Highlight = ({
  language = 'txt',
  children,
  raw = false,
  title = false,
  copy = false,
  noCopy = false,
}) => {
  if (children?.props?.className) {
    language = children.props.className.split('-').pop()
  }

  const preProps = {
    className: `language-${language} hljs tw:text-base tw:lg:text-lg tw:whitespace-break-spaces tw:overflow-scroll tw:pr-4`,
    // We have to force the background to override the ifm-pre-backround var
    style: {
      backgroundColor: 'var(--code-background-color)',
    },
  }
  if (raw) preProps.dangerouslySetInnerHTML = { __html: raw }

  const label = title ? title : defaultTitles[language] ? defaultTitles[language] : language

  return (
    <div className="hljs tw:my-4">
      <div
        className={`
        tw:flex tw:flex-row tw:justify-between tw:items-center tw:text-xs tw:font-medium tw:text-warning
        tw:mt-1 tw:border-b tw:border-neutral-content tw:border-opacity-25 tw:px-4 tw:py-1 tw:mb-2 tw:lg:text-sm
      `}
      >
        <span>{label}</span>
        {noCopy ? null : <CopyToClipboardButton content={copy ? copy : children} label={label} />}
      </div>
      <pre {...preProps}>{children}</pre>
    </div>
  )
}
