import React from 'react'
import { ZoomContextProvider } from './ZoomablePattern.mjs'
import { HeaderMenu } from './HeaderMenu.mjs'
import { DesignOptionsMenu } from './menus/DesignOptionsMenu.mjs'
import { CoreSettingsMenu } from './menus/CoreSettingsMenu.mjs'
import { UiPreferencesMenu } from './menus/UiPreferencesMenu.mjs'
import { LayoutSettingsMenu } from './menus/LayoutMenu.mjs'
import { TestOptionsMenu, TestMeasurementsMenu } from './menus/TestMenu.mjs'
import { useDesignTranslation } from '@freesewing/react/hooks/useDesignTranslation'

/**
 * A layout for views that include a drafted pattern
 *
 * @param {object} config - The editor configuration
 * @param {object} settings - The pattern settings/state
 * @param {object} ui - The UI settings/state
 * @param {object} update - Object holding methods to manipulate state
 * @param {function} Design - The Design contructor
 * @param {object] pattern - The drafted pattern
 */
export const PatternLayout = (props) => {
  const { Design, pattern, update, config } = props
  const i18n = useDesignTranslation(Design.designConfig.data.id)

  return (
    <ZoomContextProvider>
      <div className="tw:flex tw:flex-col tw:h-full">
        <HeaderMenu
          state={props.state}
          {...{ update, Design, pattern, config, strings: props.strings }}
        />
        <div className="tw:flex tw:lg:flex-row tw:grow tw:lg:max-h-[90vh] tw:max-h-[calc(100vh-3rem)] tw:h-full tw:py-2 tw:lg:mt-2">
          <div className="tw:lg:w-2/3 tw:flex tw:flex-col tw:h-full tw:grow tw:p-2 tw:shadow tw:mx-2">
            {props.output}
          </div>
          <PatternAsideMenu {...props} i18n={i18n} />
        </div>
      </div>
    </ZoomContextProvider>
  )
}

const PatternAsideMenu = (props) => {
  if (!props.state.ui?.aside) return null
  if (props.state.view === 'draft' || props.state.view === 'inspect')
    return (
      <PatternAsideWrapper>
        <h5 className="tw:capitalize">{props.pattern.designConfig.data.id} Options</h5>
        <SideMenuUl>
          <DesignOptionsMenu {...props} />
        </SideMenuUl>
        <h5>Core Settings</h5>
        <SideMenuUl>
          <CoreSettingsMenu {...props} />
        </SideMenuUl>
        <h5>UI Preferences</h5>
        <SideMenuUl>
          <UiPreferencesMenu {...props} />
        </SideMenuUl>
      </PatternAsideWrapper>
    )
  if (props.state.view === 'layout')
    return (
      <PatternAsideWrapper>
        <h5>Layout Settings</h5>
        <SideMenuUl>
          <LayoutSettingsMenu {...props} />
        </SideMenuUl>
      </PatternAsideWrapper>
    )
  if (props.state.view === 'test')
    return (
      <PatternAsideWrapper>
        <h5>Test Design Options</h5>
        <SideMenuUl>
          <TestOptionsMenu {...props} />
        </SideMenuUl>
        <h5>Test Measurements</h5>
        <SideMenuUl>
          <TestMeasurementsMenu {...props} />
        </SideMenuUl>
      </PatternAsideWrapper>
    )

  return null
}

const PatternAsideWrapper = ({ children }) => (
  <div
    className={`tw:hidden tw:md:block tw:w-1/3 tw:shrink tw:grow-0 tw:lg:p-4 tw:max-w-2xl tw:h-full tw:overflow-scroll`}
  >
    {children}
  </div>
)

export const SideMenuUl = ({ children }) => (
  <ul
    className="tw:daisy-menu tw:daisy-dropdown-content tw:flex-nowrap tw:bg-base-200 tw:rounded-box tw:z-50 tw:w-full tw:p-0 tw:pl-0"
    style={{ padding: 0 }}
  >
    {children}
  </ul>
)
