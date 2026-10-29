import React from 'react'
import { getProps } from './utils.mjs'

/**
 * A component to render a FreeSewing Stack inside a pattern
 *
 * @component
 * @param {object} props - All component props
 * @param {string} props.stackName - The name of the stack the part belongs to
 * @param {object} props.stack - The stack object itself
 * @param {object} props.settings - The pattern settings object
 * @param {object} props.components - An object holding the pattern components to use
 * @param {object} props.strings - An object holding translations
 * @param {object} props.drillProps - An object holding extra props to pass down (used in Xray mode)
 * @returns {JSX.Element}
 */
export const Stack = ({ stackName, stack, settings, components, strings, drillProps }) => {
  const { Group, Part, Grid } = components

  return (
    <Group {...getProps(stack)}>
      {settings[0].paperless ? <Grid {...{ stack, stackName }} /> : null}
      {[...stack.parts].map((part, key) => (
        <Part {...{ settings, components, part, stackName, strings, drillProps }} key={key} />
      ))}
    </Group>
  )
}
