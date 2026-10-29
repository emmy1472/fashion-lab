import React from 'react'
import { translateStrings } from './utils.mjs'

/**
 * A component to render a tspan tag in a FreeSewing pattern
 *
 * @component
 * @param {object} props - All component props
 * @param {object} props.point - The point that the text is defined on
 * @param {object} strings - The translation strings
 * @returns {JSX.Element}
 */
export const TextSpans = ({ point, strings }) => {
  const translated = translateStrings(point.attributes.list['data-text'], strings)
  const text = []
  if (translated.indexOf('\n') !== -1) {
    // Handle muti-line text
    let key = 0
    let lines = translated.split('\n')
    text.push(<tspan key={'tspan-' + key}>{lines.shift()}</tspan>)
    for (let line of lines) {
      key++
      text.push(
        <tspan
          key={'tspan-' + key}
          x={point.x}
          dy={point.attributes.list['data-text-lineheight']?.[0] || 12}
        >
          {line.toString().replace(/&quot;/g, '"')}
        </tspan>
      )
    }
  } else text.push(<tspan key="tspan">{translated.replace(/&quot;/g, '"')}</tspan>)

  return text
}

/**
 * A component to render a text tag in a FreeSewing pattern
 *
 * @component
 * @param {object} props - All component props
 * @param {object} props.point - The point that the text is defined on
 * @param {object} strings - The translation strings
 * @returns {JSX.Element}
 */
export const Text = ({ point, strings }) => (
  <text x={point.x} y={point.y} {...point.attributes.textProps}>
    <TextSpans point={point} strings={strings} />
  </text>
)

/**
 * A component to render a text along a path in a FreeSewing pattern
 *
 * @component
 * @param {object} props - All component props
 * @param {object} props.path - The path that the text is to be rendered along
 * @param {string} props.pathId - The ID of the path
 * @param {object} strings - The translation strings
 * @returns {JSX.Element}
 */
export const TextOnPath = ({ path, pathId, strings }) => {
  const textPathProps = {
    xlinkHref: '#' + pathId,
    startOffset: '0%',
  }
  const translated = translateStrings(path.attributes.text, strings)
  const align = path.attributes.list['data-text-class']
    ? path.attributes.list['data-text-class'].join(' ')
    : false
  if (align && align.indexOf('center') > -1) textPathProps.startOffset = '50%'
  else if (align && align.indexOf('right') > -1) textPathProps.startOffset = '100%'

  return (
    <text>
      <textPath {...textPathProps}>
        <tspan {...path.attributes.textProps} dangerouslySetInnerHTML={{ __html: translated }} />
      </textPath>
    </text>
  )
}
