import React from 'react'
import { getId, getProps } from './utils.mjs'

/**
 * A component to render a FreeSewing Path in a pattern
 *
 * @component
 * @param {object} props - All component props
 * @param {string} props.stackName - The name of the stack the part belongs to
 * @param {string} props.partName - The name of the part
 * @param {string} props.pathName - The name of the path
 * @param {object} props.path - The path object itself
 * @param {object} props.settings - The pattern settings object
 * @param {object} props.components - An object holding the pattern compnents to use
 * @param {object} props.strings - An object holding translations
 * @returns {JSX.Element}
 */
export const Path = ({ stackName, pathName, path, partName, settings, components, strings }) => {
  // Don't render hidden paths
  if (path.hidden) return null

  // Get potentially swizzled components
  const { TextOnPath } = components

  const pathId = getId({ settings, stackName, partName, pathName })

  return (
    <>
      <path id={pathId} d={path.d} {...getProps(path)} />
      {path.attributes.text && path.attributes.text.length > 0 ? (
        <TextOnPath {...{ path, pathId, strings }} />
      ) : null}
    </>
  )
}
