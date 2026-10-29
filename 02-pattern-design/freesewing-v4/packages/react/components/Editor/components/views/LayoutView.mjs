// Dependencies
import React from 'react'
import { defaultPrintSettings } from '../../lib/export/index.mjs'
import { tilerPlugin } from '../../lib/export/plugin-tiler.mjs'
import { get } from '@freesewing/utils'
import { bundlePatternTranslations, draft } from '../../lib/index.mjs'
// Components
import { PatternLayout } from '../PatternLayout.mjs'
import { MovablePattern } from '../MovablePattern.mjs'
import { DraftErrorHandler } from './DraftErrorHandler.mjs'

export const LayoutView = (props) => {
  const { config, state, update, Design } = props
  const { settings } = state
  const defaultSettings = defaultPrintSettings(settings?.units)

  // Settings for the tiler plugin
  const pageSettings = {
    ...defaultSettings,
    ...get(state.ui, 'layout', {}),
  }

  /*
   * Now draft the pattern
   */
  const { pattern, failure, errors } = draft(Design, settings, [tilerPlugin(pageSettings)])

  /*
   * Create object holding strings for translation
   */
  const strings = bundlePatternTranslations(pattern.designConfig.data.id)

  const output = (
    <>
      <DraftErrorHandler {...{ failure, errors }} />
      <MovablePattern
        {...{
          update,
          renderProps: pattern.getRenderProps(),
          immovable: ['pages'],
          strings: strings,
          state,
        }}
      />
    </>
  )

  return <PatternLayout {...{ update, Design, output, state, pattern, config }} />
}
