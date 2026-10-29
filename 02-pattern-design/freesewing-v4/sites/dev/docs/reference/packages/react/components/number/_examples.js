import React from 'react'
import { NumberCircle } from '@freesewing/react/components/Number'

const colors = ['primary', 'secondary', 'accent', 'neutral', 'success', 'warning', 'error', 'info']

export const NumberCircleExample = () => (
  <div className="tw:flex tw:flex-col tw:flex-wrap tw:gap-2 tw:items-start">
    <div className="tw:p-2">
      <b>Default props</b>
      <NumberCircle nr="1" />
    </div>
    {colors.map((c, i) => (
      <div className="tw:p-2" key={i}>
        <b>color = {c}</b>
        <NumberCircle nr={i} color={c}/>
      </div>
    ))}
  </div>
)
