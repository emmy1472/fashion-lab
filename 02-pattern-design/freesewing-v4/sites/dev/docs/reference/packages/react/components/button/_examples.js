import React from 'react'
import { Highlight } from '@freesewing/react/components/Highlight'
import { FingerprintIcon, WarningIcon } from '@freesewing/react/components/Icon'
import { CopyToClipboardButton, IconButton } from '@freesewing/react/components/Button'
import { MiniNote } from '@freesewing/react/components/Mini'

export const CopyToClipboardButtonExample = () => (
  <>
    <CopyToClipboardButton content="I am the regular example" label="Regular Example">Regular Example</CopyToClipboardButton>
    <CopyToClipboardButton content="I am the sup example" label="Sup Example" sup>Sup Example</CopyToClipboardButton>
  </>
)

export const IconButtonExample = () => (
  <div className="tw:grid tw:gap-2 tw:grid-cols-2">
    <IconButton>
      <FingerprintIcon />
      Primary (default)
    </IconButton>
    <IconButton color="warning">
      <WarningIcon />
      Warning
    </IconButton>
  </div>
)
