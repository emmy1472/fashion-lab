import React from 'react'
import * as _echarts from 'echarts'
import ReactECharts from 'echarts-for-react'
import { Popout } from '@freesewing/react/components/Popout'

/**
 * Re-export of Apache Echarts
 *
 * @public
 * @constant
 */
export const echarts = _echarts

echarts.registerTheme('light', {
  backgroundColor: 'transparent',
})
echarts.registerTheme('dark', {
  backgroundColor: 'transparent',
})

/**
 * A component to provide Echart functionality.
 *
 * This is a wrapper around Apache Echarts. The option prop is for echarts.
 *
 * @component
 * @param {object} props - All component props
 * @param {object} [props.option = false] - The Echarts option object. This is
 * marked as optional because this component will show a loading message when
 * option is not an object. However, that is intended for use-cases where
 * option relies on async code. This component is pointless if you do not
 * (eventually) pass it an option prop.
 * @param {string} [props.theme = 'light'] - The theme to use for echarts. Supports 'light' and 'dark'.
 * @param {number} [props.h = 400] - The height of the chart, in pixels. Charts
 * are rendered as SVG, we need to set a height because without a height, some
 * browsers will not properly render the SVG element. This is an Echart
 * limitation.
 * @returns {JSX.Element}
 */
export const ChartWrapper = ({ option = false, theme = 'light', h = 400 }) => {
  return option ? (
    <ReactECharts option={option} className="class_2" theme={theme} style={{ height: h }} />
  ) : (
    <Popout loading>Loading chart...</Popout>
  )
}
