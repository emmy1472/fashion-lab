import React from 'react'
import { LineDrawingWrapper } from './shared.mjs'

/*
 * This strokeScale factor is used to normalize the stroke across
 * designs so we have a consistent look when showing our collection
 */
const strokeScale = 0.5

/**
 * A linedrawing component for Jane
 *
 * @component
 * @param {object} props - All component props
 * @param {string} props.className - Any CSS classes to apply
 * @param {number} props.stroke - The stroke width to apply
 * @returns {JSX.Element}
 */
export const Jane = ({ className, stroke = 1 }) => (
  <LineDrawingWrapper viewBox="0 0 1052.0441 2409.9082" {...{ stroke, className }}>
    <Front stroke={stroke * strokeScale} />
    <Back stroke={stroke * strokeScale} />
  </LineDrawingWrapper>
)

/**
 * A linedrawing component for the front of Jane
 *
 * @component
 * @param {object} props - All component props
 * @param {string} props.className - Any CSS classes to apply
 * @param {number} props.stroke - The stroke width to apply
 * @returns {JSX.Element}
 */
export const JaneFront = ({ className, stroke = 1 }) => (
  <LineDrawingWrapper viewBox="0 0 1052.0441 1204.9541" {...{ className }}>
    <Front stroke={stroke * strokeScale} />
  </LineDrawingWrapper>
)

/**
 * A linedrawing component for the back of Jane
 *
 * @component
 * @param {object} props - All component props
 * @param {string} props.className - Any CSS classes to apply
 * @param {number} props.stroke - The stroke width to apply
 * @returns {JSX.Element}
 */
export const JaneBack = ({ className, stroke = 1 }) => (
  <LineDrawingWrapper viewBox="0 0 1052.0441 1204.9541" {...{ className }}>
    <Back stroke={stroke * strokeScale} />
  </LineDrawingWrapper>
)

/*
 * SVG elements for the front
 */
const Front = () => (
  <>
    <path
      key="outline"
      d="m -608.63339,510.96724 h -147.87 l 147.87,-566.09998 M 87.116607,510.96724 H 234.98661 L 87.116607,-55.13274 m -212.969997,-566.1 c 0,44.64 -58.03,55.8 -134.91,55.8 -76.88,0 -134.89,-11.16 -134.89,-55.8 M -557.43723,-253.48707 -694.2189,-484.8963 m 730.16227,231.40586 136.78167,-231.40921 m -681.72351,48.36666 -277.64445,-72.49634 48.22547,-184.69252 277.66408,72.48911 m 448.245079,184.69975 277.644441,-72.49634 -48.22547,-184.69252 -277.664069,72.48911 m -334.900001,0 h -65.09998 L -608.63339,-55.132739 V 510.96724 H 87.116607 V -55.132739 L -60.753389,-621.23274 h -65.100001 m 0,0 c 0,76.88 -58.03,96.1 -134.91,96.1 -76.88,0 -134.89,-19.22 -134.89,-96.1"
      transform="translate(786.77542,693.85435)"
    />
  </>
)

/*
 * SVG elements for the back
 */
const Back = () => (
  <>
    <path
      key="outline"
      d="M -608.63339,510.96724 H -756.5034 L -608.63339,-55.132743 M 87.116607,510.96724 H 234.98661 L 87.116607,-55.13274 m -212.969997,-566.1 c 0,44.64 -58.03,55.8 -134.91,55.8 -76.88,0 -134.89,-11.16 -134.89,-55.8 M -557.43723,-253.48707 -694.2189,-484.8963 m 730.16227,231.40586 136.78167,-231.40921 m -681.72351,48.36666 -277.64445,-72.49634 48.22547,-184.69252 277.66408,72.48911 m 448.245079,184.69975 277.644441,-72.49634 -48.22547,-184.69252 -277.664069,72.48911 m -334.900001,0 h -65.09998 L -608.63339,-55.132739 V 510.96724 H 87.116607 V -55.132739 L -60.753389,-621.23274 h -65.100001"
      transform="translate(786.77542,693.85435)"
    />
  </>
)
