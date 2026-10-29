import React from 'react'
import { linkClasses } from '@freesewing/utils'

/**
 * An anchor link component
 *
 * @component
 * @param {object} props - All component props
 * @param {JSX.Element} props.children - The component children, will be rendered inside the link
 * @param {string} [props.id = ''] - The ID of the anchor to link to
 * @param {string} [props.title = false] - An optional link title
 * @returns {JSX.Element}
 */
export const AnchorLink = ({ children, id = '', title = false }) => (
  <a href={`#${id}`} className={linkClasses} title={title ? title : ''}>
    {children}
  </a>
)

/**
 * A regular link component
 *
 * @component
 * @param {object} props - All component props
 * @param {JSX.Element} props.children - The component children, will be rendered inside the link
 * @param {string} [props.className = @freesewing/utils/linkClasses] - Any non-default CSS classes to apply
 * @param {string} props.href - The URL to link to
 * @param {object} [props.style = {}] - Any non-default styles to apply
 * @param {string} [props.target = undefined] - An optional link title
 * @param {string} [props.title = false] - An optional link title
 * @returns {JSX.Element}
 */
export const Link = ({
  children,
  className = linkClasses,
  href,
  style = {},
  target,
  title = false,
}) => (
  <a href={href} target={target} className={className} title={title ? title : ''} style={style}>
    {children}
  </a>
)

const BaseLink = Link

/**
 * A regular link, but intended to be used on a success background
 *
 * @component
 * @param {object} props - All component props
 * @param {JSX.Element} props.children - The component children, will be rendered inside the link
 * @param {string} props.href - The URL to link to
 * @param {string} [props.title = false] - An optional link title
 * @param {React.FC} [Link = undefined] - An optional framework-specific Link component
 * @returns {JSX.Element}
 */
export const SuccessLink = ({ children, href, title = false, Link }) =>
  Link ? (
    <Link href={href} className={linkClasses} title={title ? title : ''}>
      <span className="tw:text-success-content tw:hover:text-success-content">{children}</span>
    </Link>
  ) : (
    <a href={href} className={linkClasses} title={title ? title : ''}>
      <span className="tw:text-success-content tw:hover:text-success-content">{children}</span>
    </a>
  )

/**
 * A link styled as a card
 *
 * @component
 * @param {object} props - All component props
 * @param {JSX.Element} props.children - The component children, will be rendered inside the link
 * @param {string} [props.className = @freesewing/utils/linkClasses + "tw:text-success-content tw:hover:text-success-content"] - Any non-default CSS classes to apply
 * @param {string} props.href - The URL to link to
 * @param {string} [props.title = false] - An optional link title
 * @param {JSX.Element} props.icon - An icon to render
 * @param {React.FC} [Link = undefined] - An optional framework-specific Link component
 * @returns {JSX.Element}
 */
export const CardLink = ({
  children,
  className = 'tw:bg-base-200 tw:text-base-content',
  href,
  title,
  icon,
  Link,
}) => {
  if (!Link) Link = BaseLink

  return (
    <Link
      href={href}
      className={`tw:px-8 tw:py-10 tw:rounded-lg tw:block ${className}
      tw:hover:bg-secondary/5 tw:shadow-lg tw:bg-base-200
      tw:transition-color tw:duration-300 grow tw:hover:no-underline no-hover-decoration`}
    >
      <h2 className="tw:mb-4 tw:text-base-content tw:flex tw:flex-row tw:gap-4 tw:justify-between tw:items-center">
        <span className="tw:text-base-content">{title}</span>
        <span className="tw:shrink-0 tw:text-base-content">{icon}</span>
      </h2>
      <div className="tw:text-base-content">{children}</div>
    </Link>
  )
}
