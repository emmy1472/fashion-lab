import React from 'react'
import { Highlight } from '@freesewing/react/components/Highlight'
import hljs from 'highlight.js/lib/common'
import yaml from 'js-yaml'

/**
 * A component to code-highlight YAML data
 *
 * @component
 * @param {object} props - All component props
 * @param {JSX.Element} props.children - Use this if you are not using props.json or props.js to pass the YAML data
 * @param {object} [props.js = undefined] - Use this to pass the YAML data as Javascript Object
 * @param {string} [props.json = undefined] - Use this to pass the YAML data as JSON
 * @param {bool} [props.noCopy = false]  - Set this to true to not add the copy to clipboard button
 * @param {string} [props.title = "YAML"] - Title for the highlight
 * @returns {JSX.Element}
 */
export const Yaml = (props) => {
  let code
  if (props.json) code = yaml.dump(JSON.parse(props.json))
  else if (props.js) code = yaml.dump(props.js)
  else code = props.children

  return (
    <Highlight
      language="yaml"
      {...props}
      raw={hljs.highlight(code, { language: 'yaml' }).value}
      copy={code}
    />
  )
}
