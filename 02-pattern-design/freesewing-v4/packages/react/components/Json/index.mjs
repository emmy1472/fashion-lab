import React from 'react'
import { Highlight } from '@freesewing/react/components/Highlight'
import hljs from 'highlight.js/lib/common'

/**
 * A component to code-highlight JSON data
 *
 * @component
 * @param {object} props - All component props
 * @param {object} [props.js = undefined] - An optional Javascript Object to highlight
 * @param {JSX.Element} props.children - The component children, will be rendered if props.js is not set
 * @returns {JSX.Element}
 */
export const Json = (props) => {
  const code = props.js ? JSON.stringify(props.js, null, 2) : props.children

  return (
    <Highlight language="json" raw={hljs.highlight(code, { language: 'json' }).value} copy={code} />
  )
}
