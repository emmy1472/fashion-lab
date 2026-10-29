import React from 'react'

/**
 * A component set CSS classes to make your tables look better
 *
 * @component
 * @param {object} props - All component props
 * @param {JSX.Element} props.children - The table children, same as for a table HTML tag
 * @returns {JSX.Element}
 */
export const Table = ({ children }) => (
  <TableWrapper>
    <table className="tw:table tw:table-auto">{children}</table>
  </TableWrapper>
)

/**
 * A component to help embed tables into a page
 *
 * Tables on mobile will almost always break the layout
 * unless we set the overflow behaviour explicitly.
 * This component takes care of that.
 *
 * @component
 * @param {object} props - All component props
 * @param {object} [props.js = undefined] - An optional Javascript Object to highlight
 * @param {JSX.Element} props.children - The component children, will be rendered if props.js is not set
 * @returns {JSX.Element}
 */
export const TableWrapper = ({ children }) => (
  <div className="tw:max-w-full tw:overflow-x-auto">{children}</div>
)
