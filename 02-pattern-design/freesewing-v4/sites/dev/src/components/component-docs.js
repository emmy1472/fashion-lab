import React from 'react'
import { Highlight } from '@freesewing/react/components/Highlight'
import { Tabs, Tab } from '@freesewing/react/components/Tab'
import { FingerprintIcon, WarningIcon } from '@freesewing/react/components/Icon'
import { IconButton } from '@freesewing/react/components/Button'
import { MiniNote } from '@freesewing/react/components/Mini'

export const ComponentDocs = ({ docs, example }) => {
  if (!docs) return <MiniNote>No docs passed in</MiniNote>
  const Example = example || null
  return (
    <>
      <p>{docs.desc}</p>
      <Tabs tabs="Import, Props, Example, Source">
        <Tab>
          <p>
            You can import the <code>{docs.name}</code> component from the <b>{docs.family}</b>{' '}
            component family in the <code>@freesewing/react</code> package:
          </p>
          <Highlight language="js">{docs.importAs}</Highlight>
        </Tab>
        <Tab>
          {docs.params ? (
            <p>
              {' '}
              The <code>{docs.name}</code> component takes the following props:
            </p>
          ) : (
            <MiniNote>This component does not take any props</MiniNote>
          )}
          {docs.params ? <PropsTable docs={docs} /> : null}
        </Tab>
        <Tab>
          <Example />
        </Tab>
        <Tab>
          <p>
            The <code>{docs.name}</code> component is defined{' '}
            <a
              href={`https://codeberg.org/freesewing/freesewing/src/branch/develop/${docs.file}#L${docs.line}`}
            >
              on{' '}
              <b>
                line{' '}
                {docs.line}
              </b>{' '}
              in <b>{docs.file}</b>
            </a>
            .
          </p>
        </Tab>
      </Tabs>
    </>
  )
}

const PropsTable = ({ docs }) => (
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Type</th>
        <th>Description</th>
        <th>Optional</th>
        <th>Default Value</th>
      </tr>
    </thead>
    <tbody>
      {(docs.params || []).map((prop, i) => (
        <tr key={i}>
          <td>{prop.name}</td>
          <td>{prop.type.names}</td>
          <td>{prop.description}</td>
          <td>{prop.optional ? 'yes' : 'no'}</td>
          <td>
            <code>
              <DefaultPropValue value={prop.defaultvalue} />
            </code>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
)

const DefaultPropValue = ({ value }) => {
  if (value === true) return 'true'
  if (value === false) return 'false'
  if (value === null) return 'null'
  if (typeof value === 'undefined') return 'undefined'

  return value
}
