import React from 'react'
import { forwardRef } from 'react'

/**
 * A component to render an SVG tag to hold a FreeSewing pattern
 *
 * @component
 * @param {object} props - All component props
 * @param {JSX.Element} props.children - The component children, will be rendered inside the SVG tag
 * @param {strign} [props.className = 'freesewing pattern'] - The CSS classes to apply to the SVG tag
 * @param {string} [props.embed = true] - Set this to false to output SVG suitable for printing rather than auto-scaled SVG
 * @param {number} props.heigth - The pattern height in mm
 * @param {string} [props.locale = en] - The locale/language to use
 * @param {object} [props.style = {}] - Any additional style to apply to the SVG tag
 * @param {object} [props.viewBox = false] - Set this to use a custom viewBox attribute rather than the default  0 0 width height
 * @param {number} props.width - The pattern width in mm
 * @returns {JSX.Element}
 */
export const Svg = forwardRef(
  (
    {
      embed = true,
      locale = 'en',
      className = 'freesewing pattern',
      style = {},
      viewBox = false,
      width,
      height,
      children,
    },
    ref
  ) => {
    if (width < 1) width = 1000
    if (height < 1) height = 1000
    let attributes = {
      xmlns: 'http://www.w3.org/2000/svg',
      'xmlns:svg': 'http://www.w3.org/2000/svg',
      xmlnsXlink: 'http://www.w3.org/1999/xlink',
      xmlLang: locale,
      viewBox: viewBox || `0 0 ${width} ${height}`,
      className,
      style,
    }

    if (!embed) {
      attributes.width = width + 'mm'
      attributes.height = height + 'mm'
    }

    return (
      <svg {...attributes} ref={ref}>
        {children}
      </svg>
    )
  }
)

Svg.displayName = 'Svg'
