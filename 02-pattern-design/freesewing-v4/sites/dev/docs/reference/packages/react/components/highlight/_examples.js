import React from 'react'
import { Highlight } from '@freesewing/react/components/Highlight'

export const HighlightExample = () => (
  <Highlight language="js">{[
    `import { Highlight } from '@freesewing/react/components/Highlight'`,
    ``,
    `<Highlight language="js">This is an example</Highlight>`,
  ].join("\n")}</Highlight>
)

