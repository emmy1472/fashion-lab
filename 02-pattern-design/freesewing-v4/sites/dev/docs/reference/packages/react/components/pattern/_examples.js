import React from 'react'
//import * as all from '@freesewing/react/components/Pattern'
import { MiniNote } from '@freesewing/react/components/Mini'

/*
 * Use this to generate the docs content
export const Test = () => {
  const output = []
  // list
  output.push(...Object.keys(all).sort().map(c => `- [${c}](${c.toLowerCase()})`))

  // docs
  output.push(...Object.keys(all).sort().map(c => `
## ${c}
<ComponentDocs docs={jsdoc.jsdoc${c}} example={Example} />`))

  return <pre>{output.join("\n")}</pre>
}
 */

export const Example = () => (
  <MiniNote>
    Components in the Pattern family are tightly coupled with FreeSewing pattern structure.
    Stand-alone examples are not provided as they are not very relevant.
  </MiniNote>
)
