// Dependencies
import React, { useContext } from 'react'
import { bundlePatternTranslations, draft, missingMeasurements } from '../../lib/index.mjs'
import { colors, darkColors } from '@freesewing/plugin-theme'
// Context
import { ModalContext } from '@freesewing/react/context/Modal'
// Hooks
import { useColorMode } from '@docusaurus/theme-common'
// Components
import { Null } from '@freesewing/react/components/Null'
import { ZoomablePattern } from '../ZoomablePattern.mjs'
import { PatternLayout } from '../PatternLayout.mjs'
import { DraftErrorHandler } from './DraftErrorHandler.mjs'
import { i18nPlugin } from '@freesewing/plugin-i18n'
import { themePlugin } from '@freesewing/plugin-theme'
import { svgAttrPlugin } from '@freesewing/plugin-svgattr'
import { translateStrings } from '../../../Pattern/index.mjs'

/**
 * The draft view allows users to tweak their pattern
 *
 * @param (object) props - All the props
 * @param {function} props.config - The editor configuration
 * @param {function} props.Design - The design constructor
 * @param {array} props.missingMeasurements - List of missing measurements for the current design
 * @param {object} props.state - The ViewWrapper state object
 * @param {object} props.state.settings - The current settings
 * @param {object} props.update - Helper object for updating the ViewWrapper state
 * @param {React.component} props.plugins - Any (extra) plugins to load in the pattern
 * @param {React.component} props.PluginOutput - An optional component to display plugin-specific output
 * @return {function} DraftView - React component
 */
export const DraftView = ({ Design, state, update, config, plugins = [], PluginOutput = Null }) => {
  const { modalContent } = useContext(ModalContext)
  /*
   * We need to manipulate the theme for SVG in the browser
   */
  const { colorMode } = useColorMode()
  /*
   * Don't trust that we have all measurements
   *
   * We do not need to change the view here. That is done in the central
   * ViewWrapper componenet. However, checking the measurements against
   * the design takes a brief moment, so this component will typically
   * render before that happens, and if measurements are missing it will
   * throw and error.
   *
   * So when measurements are missing, we just return here and the view
   * will switch on the next render loop.
   */
  if (missingMeasurements(state)) return <Null />

  /*
   * First, attempt to draft
   */
  const { pattern, failure, errors } = draft(Design, state.settings, plugins, (pattern) => {
    if (state.ui?.renderer === 'svg') {
      const strings = bundlePatternTranslations(pattern.designConfig.data.id)
      pattern.use(i18nPlugin, (t) => translateStrings([t], strings))
      pattern.use(themePlugin)
      pattern.use(svgAttrPlugin, {
        class: `freesewing pattern tw:w-full ${state.ui.rotate ? 'tw:-rotate-90' : ''}`,
      })
    }
  })

  /*
   * Create object holding strings for translation
   */
  const strings = bundlePatternTranslations(pattern.designConfig.data.id)

  let output = null
  let renderProps = false
  if (state.ui?.renderer === 'svg') {
    try {
      let __html = pattern.render()
      if (colorMode === 'dark') {
        for (const color of Object.keys(colors))
          __html = __html.replaceAll(`: ${colors[color]};`, `: ${darkColors[color]};`)
      }
      output = (
        <>
          <DraftErrorHandler {...{ failure, errors }} />
          <PluginOutput {...{ pattern, Design, state, update, config }} />
          <ZoomablePattern update={update}>
            <div
              className="tw:w-full tw:h-full tw:text-base-content"
              dangerouslySetInnerHTML={{ __html }}
            />
          </ZoomablePattern>
        </>
      )
    } catch (err) {
      console.log(err)
    }
  } else {
    renderProps = pattern.getRenderProps()
    output = (
      <>
        <DraftErrorHandler {...{ failure, errors }} />
        <PluginOutput {...{ pattern, Design, state, update, config, strings }} />
        <ZoomablePattern
          renderProps={renderProps}
          patternLocale={state.locale || 'en'}
          strings={strings}
          rotate={state.ui.rotate}
          update={update}
        />
        {modalContent}
      </>
    )
  }

  return <PatternLayout {...{ update, Design, output, state, pattern, config, strings }} />
}
