import React from 'react'

/**
 * A component to render breadcrumbs
 *
 * This is a pure render component, you need to pass in the data.
 *
 * @component
 * @param {object} props - All component props
 * @param {React.Component} props.Link - A framework specific Link component for client-side routing
 * @param {array} [props.crumbs = []] - The crumbs, an array with objects with href & label properties
 * @param {text} title - The title of the current (final) page the breadcrumbs lead to
 * @returns {JSX.Element}
 */
export const Breadcrumbs = ({ crumbs = [], title, Link = false }) => {
  if (Link === false) Link = RegularLink

  return (
    <div className="tw:tailwind-container tw:p-0">
      <ul
        className="tw:flex tw:flex-row tw:items-center tw:gap-2 tw:m-0 tw:py-4"
        style={{ paddingLeft: 0 }}
      >
        <li className="tw:inline">
          <Link href="/">
            <b>Home</b>
          </Link>
        </li>
        <Spacer />
        {crumbs.map((crumb, i) => (
          <React.Fragment key={i}>
            <li key={i} className="tw:inline">
              <Link href={crumb.href}>{crumb.label}</Link>
            </li>
            <li key={i} className="tw:inline">
              <Spacer />
            </li>
          </React.Fragment>
        ))}
        <li className="tw:inline">{title}</li>
      </ul>
    </div>
  )
}

/*
 * People can pass in a custom Link component,
 * which is useful when using one from your framework.
 * If not, we use a regular a tag
 */
const RegularLink = ({ href, children }) => <a href={href}>{children}</a>

/*
 * This goes between breadcrumbs
 */
const Spacer = () => <li className="tw:inline">&raquo;</li>
