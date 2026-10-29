import React from 'react'
import { Legend as LegendDesign } from '@freesewing/legend'
import { Pattern } from '@freesewing/react/components/Pattern'
import { i18n as pluginI18n } from '@freesewing/core-plugins'

export const Legend = ({ part = '' }) => {
  const settings = {
    only: [`legend.${part}`],
    measurements: {
      head: 370,
    },
  }
  const pattern = new LegendDesign(settings).draft()

  const patternProps = {
    renderProps: pattern.getRenderProps(),
    logs: pattern.getLogs(),
    strings: pluginI18n.en,
  }

  return (
    <figure className="shadow p-2">
      <Pattern {...patternProps} />
    </figure>
  )
}
