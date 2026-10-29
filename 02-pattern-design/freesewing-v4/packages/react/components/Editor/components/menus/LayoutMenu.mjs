// Dependencies
import React from 'react'
import { capitalize } from '@freesewing/utils'
import { menuLayoutSettingsStructure } from '../../lib/index.mjs'
// Components
import { PatternIcon } from '@freesewing/react/components/Icon'
import { MenuBoolInput, MenuMmInput, MenuListInput, MenuPctInput } from './Input.mjs'
import { MenuBoolValue, MenuMmValue, MenuPctOptionValue } from './Value.mjs'
import { MenuItemGroup } from './Container.mjs'
import { MenuHighlightValue } from './Value.mjs'

export const LayoutSettingsMenu = ({ update, state, Design }) => {
  const structure = menuLayoutSettingsStructure()

  const drillProps = { Design, state, update }
  const inputs = {
    size: (props) => <MenuListInput {...drillProps} {...props} />,
    orientation: (props) => <MenuListInput {...drillProps} {...props} />,
    margin: (props) => <MenuMmInput {...drillProps} {...props} />,
    coverPage: (props) => <MenuBoolInput {...drillProps} {...props} />,
    iconSize: (props) => <MenuPctInput {...drillProps} {...props} />,
  }
  const values = {
    size: ({ current, changed, config }) => {
      const sizeNames = {
        // non-breaking space character to avoid wrap
        'arch d': 'ARCH\u00A0D',
        'arch e': 'ARCH\u00A0E',
      }
      return (
        <MenuHighlightValue changed={changed}>
          {capitalize(current ? sizeNames[current] || current : config.dflt)}
        </MenuHighlightValue>
      )
    },
    orientation: ({ current, changed }) => (
      <MenuHighlightValue changed={changed}>
        <PatternIcon
          className={`tw:w-6 tw:h-6 tw:text-inherit ${current === 'landscape' ? 'tw:-rotate-90' : ''}`}
        />
      </MenuHighlightValue>
    ),
    margin: MenuMmValue,
    coverPage: MenuBoolValue,
    iconSize: MenuPctOptionValue,
  }

  return (
    <MenuItemGroup
      {...{
        structure,
        ux: state.ui?.ux,
        currentValues: state.ui.layout || {},
        isFirst: true,
        name: 'UI Preferences',
        passProps: {
          ux: state.ui?.ux,
          settings: state?.settings,
          patternConfig: Design.patternConfig,
        },
        updateHandler: (key, val) => update.ui(['layout', key], val),
        isDesignOptionsGroup: false,
        state,
        Design,
        inputs,
        values,
      }}
    />
  )
}
