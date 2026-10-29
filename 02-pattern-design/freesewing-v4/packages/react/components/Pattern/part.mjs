import React, { forwardRef } from 'react'
import { getId, getProps } from './utils.mjs'

/**
 * A component to render an inner FreeSewing Part in a pattern (no group)
 *
 * @component
 * @param {object} props - All component props
 * @param {string} props.stackName - The name of the stack the part belongs to
 * @param {string} props.partName - The name of the part
 * @param {object} props.part - The part object itself
 * @param {object} props.settings - The pattern settings object
 * @param {object} props.components - An object holding the pattern compnents to use
 * @param {object} props.strings - An object holding translations
 * @param {object} props.drillProps - An object holding extra props to pass down (used in Xray mode)
 * @returns {JSX.Element}
 */
export const PartInner = forwardRef(
  ({ stackName, partName, part, settings, components, strings, drillProps }, ref) => {
    const { Group, Path, Point, Snippet } = components

    return (
      <Group ref={ref} id={getId({ settings, stackName, partName, name: 'inner' })}>
        {Object.keys(part.paths).map((pathName) => (
          <Path
            key={pathName}
            path={part.paths[pathName]}
            topLeft={part.topLeft}
            bottomRight={part.bottomRight}
            units={settings[0].units}
            {...{ stackName, partName, pathName, part, settings, components, strings, drillProps }}
          />
        ))}
        {Object.keys(part.points).map((pointName) => (
          <Point
            key={pointName}
            point={part.points[pointName]}
            topLeft={part.topLeft}
            bottomRight={part.bottomRight}
            {...{ stackName, partName, pointName, part, settings, components, strings, drillProps }}
          />
        ))}
        {Object.keys(part.snippets).map((snippetName) => (
          <Snippet
            key={snippetName}
            snippet={part.snippets[snippetName]}
            {...{
              stackName,
              partName,
              snippetName,
              part,
              settings,
              components,
              strings,
              drillProps,
            }}
          />
        ))}
      </Group>
    )
  }
)

PartInner.displayName = 'PartInner'

/**
 * A component to render a FreeSewing Part (group) in a pattern
 *
 * @component
 * @param {object} props - All component props
 * @param {string} props.stackName - The name of the stack the part belongs to
 * @param {string} props.partName - The name of the part
 * @param {object} props.part - The part object itself
 * @param {object} props.settings - The pattern settings object
 * @param {object} props.components - An object holding the pattern compnents to use
 * @param {object} props.strings - An object holding translations
 * @param {object} props.drillProps - An object holding extra props to pass down (used in Xray mode)
 * @returns {JSX.Element}
 */
export const Part = ({ stackName, partName, part, settings, components, strings, drillProps }) => {
  const { Group } = components

  return (
    <Group
      {...getProps(part)}
      id={getId({ settings, stackName, partName })}
      transform={`translate(${-part.anchor.x}, ${-part.anchor.y})`}
    >
      <PartInner {...{ stackName, partName, part, settings, components, strings, drillProps }} />
    </Group>
  )
}
