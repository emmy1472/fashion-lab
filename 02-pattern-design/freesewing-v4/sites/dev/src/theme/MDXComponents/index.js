// Ejected Docusaurus components
import React from 'react'
import Head from '@docusaurus/Head'
import MDXCode from '@theme/MDXComponents/Code'
import MDXA from '@theme/MDXComponents/A'
import MDXPre from '@theme/MDXComponents/Pre'
import MDXDetails from '@theme/MDXComponents/Details'
import MDXHeading from '@theme/MDXComponents/Heading'
import MDXLi from '@theme/MDXComponents/Li'
import MDXImg from '@theme/MDXComponents/Img'
import Admonition from '@theme/Admonition'
import Mermaid from '@theme/Mermaid'
// Other Docusaurus components
import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
// Custom FreeSewing components
import { Example } from './example.mjs'
import { ReadMore } from './readmore.js'
import { Term } from './term.js'
// Components
import { SearchIcon } from '@freesewing/react/components/Icon'

export const PropsTable = ({ props, params = false, returns = false }) => (
  <table className="tw:table">
    <thead>
      <tr>
        <th>{params ? 'Parameter' : 'Prop'}</th>
        <th>Type</th>
        <th>Default</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>
      {Object.entries(props).map(([name, obj]) => (
        <PropRow {...{ name, ...obj }} />
      ))}
    </tbody>
    {returns ? (
      <>
        <thead>
          <tr>
            <th>Return Type</th>
            <th colspan="3">Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{returns.type}</td>
            <td colspan="3">{returns.desc}</td>
          </tr>
        </tbody>
      </>
    ) : null}
  </table>
)
export const ParamsTable = ({ params, returns }) => (
  <PropsTable props={params} params={true} returns={returns} />
)

export const PropRow = ({ name, type, dflt, desc }) => (
  <tr>
    <td>{name}</td>
    <td>{type}</td>
    <td>
      <code>{dflt}</code>
    </td>
    <td>{desc}</td>
  </tr>
)

const MDXComponents = {
  // Ejected Docusaurus components
  Head,
  details: MDXDetails,
  Details: MDXDetails,
  code: MDXCode,
  a: MDXA,
  pre: MDXPre,
  li: MDXLi,
  img: MDXImg,
  h1: (props) => <MDXHeading as="h1" {...props} />,
  h2: (props) => <MDXHeading as="h2" {...props} />,
  h3: (props) => <MDXHeading as="h3" {...props} />,
  h4: (props) => <MDXHeading as="h4" {...props} />,
  h5: (props) => <MDXHeading as="h5" {...props} />,
  h6: (props) => <MDXHeading as="h6" {...props} />,
  admonition: Admonition,
  mermaid: Mermaid,
  Tabs,
  TabItem,
  PropsTable,
  ParamsTable,
  // Custom FreeSewing components
  em: Term,
  Example,
  ReadMore,
  ConsoleButton: ({ data }) => (
    <button
      className="tw:hidden tw:md:flex tw:daisy-btn tw:daisy-btn-secondary tw:flex-row tw:gap-2"
      onClick={() => console.log(data)}
    >
      <SearchIcon /> Show in browser console
    </button>
  ),
  // Prose styles
  ul: (props) => <ul className="tw:list tw:list-inside tw:list-disc tw:ml-2">{props.children}</ul>,
  ol: (props) => (
    <ul className="tw:list tw:list-inside tw:list-decimal tw:ml-2">{props.children}</ul>
  ),
}

export default MDXComponents
