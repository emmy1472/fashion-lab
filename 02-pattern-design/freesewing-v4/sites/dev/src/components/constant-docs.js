import React from 'react'
import { Highlight } from '@freesewing/react/components/Highlight'
import { Tabs, Tab } from '@freesewing/react/components/Tab'
import { MiniNote } from '@freesewing/react/components/Mini'

export const ConstantDocs = ({ docs }) => {
  if (!docs) return <MiniNote>No docs passed in</MiniNote>
  return (
    <>
      <p>{docs.desc}</p>
      <Tabs tabs="Import, Source">
        <Tab>
          <p>
            You can import the <code>{docs.name}</code> constant from the <b>{docs.family}</b>{' '}
            family in the <code>@freesewing/react</code> package:
          </p>
          <Highlight language="js">{docs.importAs}</Highlight>
        </Tab>
        <Tab>
          <p>
            The <code>{docs.name}</code> function is defined{' '}
            <a
              href={`https://codeberg.org/freesewing/freesewing/src/branch/develop/${docs.file}#L${docs.line}`}
            >
              on <b>line {docs.line}</b> in <b>{docs.file}</b>
            </a>
            .
          </p>
        </Tab>
      </Tabs>
    </>
  )
}
