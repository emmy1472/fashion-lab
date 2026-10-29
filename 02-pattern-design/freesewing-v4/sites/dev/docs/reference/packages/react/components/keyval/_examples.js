import React from 'react'
import { KeyVal } from '@freesewing/react/components/KeyVal'

const colors = ['primary', 'secondary', 'accent', 'neutral', 'success', 'warning', 'error', 'info']

export const KeyValExample = () => (
  <>
    <b>Default</b>
    <br />
    <KeyVal k="key" val="value" />
    <br />
    <b>Colors</b>
    <div className="tw:flex tw:flex-row tw:flex-wrap tw:gap-1">
      {colors.map(c => <KeyVal key={c} k="color" val={c} color={c}/>)}
    </div>
    <b>Small</b>
    <div className="tw:flex tw:flex-row tw:flex-wrap tw:gap-1">
      {colors.map(c => <KeyVal key={c} k="color" val={c} color={c} small/>)}
    </div>
  </>
)
