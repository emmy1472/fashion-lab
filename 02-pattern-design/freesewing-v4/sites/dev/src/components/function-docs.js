import React from 'react'
import { Highlight } from '@freesewing/react/components/Highlight'
import { Tabs, Tab } from '@freesewing/react/components/Tab'
import { FingerprintIcon, WarningIcon } from '@freesewing/react/components/Icon'
import { IconButton } from '@freesewing/react/components/Button'
import { MiniNote } from '@freesewing/react/components/Mini'

export const FunctionDocs = ({ docs }) => {
  if (!docs) return <MiniNote>No docs passed in</MiniNote>
  console.log(docs)
  return (
    <>
      <p>{docs.desc}</p>
      <Tabs tabs="Import, Return type & Parameters, Source">
        <Tab>
          <p>
            You can import the <code>{docs.name}</code> function from the <b>{docs.family}</b>{' '}
            family in the <code>@freesewing/react</code> package:
          </p>
          <Highlight language="js">{docs.importAs}</Highlight>
        </Tab>
        <Tab>
          {docs.params ? (
            <p>
              {' '}
              The <code>{docs.name}</code> function returns type{' '}
              <code>{docs.return.map((r) => r.type.names.join()).join('|')}</code> and takes the
              following parameters:
            </p>
          ) : (
            <MiniNote>This function does not take any parameters</MiniNote>
          )}
          {docs.params ? <ParamsTable docs={docs} /> : null}
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

const ParamsTable = ({ docs }) => (
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Name</th>
        <th>Type</th>
        <th>Description</th>
        <th>Optional</th>
        <th>Default Value</th>
      </tr>
    </thead>
    <tbody>
      {(docs.params || []).map((param, i) => (
        <tr key={i}>
          <td>{i + 1}</td>
          <td>{param.name}</td>
          <td>{param.type.names}</td>
          <td>{param.description}</td>
          <td>{param.optional ? 'yes' : 'no'}</td>
          <td>
            <code>
              <DefaultParamValue value={param.defaultvalue} />
            </code>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
)

const DefaultParamValue = ({ value }) => {
  if (value === true) return 'true'
  if (value === false) return 'false'
  if (value === null) return 'null'
  if (typeof value === 'undefined') return 'undefined'

  return value
}
