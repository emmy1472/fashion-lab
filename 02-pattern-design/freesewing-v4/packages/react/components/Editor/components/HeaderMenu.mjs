// Dependencies
import { missingMeasurements, flattenFlags } from '../lib/index.mjs'
// Hooks
import React, { useState, useEffect } from 'react'
import { useBackend } from '@freesewing/react/hooks/useBackend'
import { useAccount } from '@freesewing/react/hooks/useAccount'
import { useDesignTranslation } from '@freesewing/react/hooks/useDesignTranslation'
// Components
import { Null } from '@freesewing/react/components/Null'
import { ViewIcon, viewLabels } from './views/index.mjs'
import { Tooltip } from './Tooltip.mjs'
import {
  AsideIcon,
  CompactIcon,
  DetailIcon,
  ExpandIcon,
  ExportIcon,
  FixmeIcon,
  FlagIcon,
  MeasurementsIcon,
  OptionsIcon,
  PaperlessIcon,
  PrintIcon,
  ResetAllIcon,
  ResetIcon,
  RightIcon,
  RocketIcon,
  SaIcon,
  SaveAsIcon,
  SaveIcon,
  SettingsIcon,
  TrashIcon,
  UiIcon,
  UndoIcon,
  UnitsIcon,
} from '@freesewing/react/components/Icon'
import { ButtonFrame } from '@freesewing/react/components/Input'
import { DesignOptionsMenu } from './menus/DesignOptionsMenu.mjs'
import { CoreSettingsMenu } from './menus/CoreSettingsMenu.mjs'
import { UiPreferencesMenu } from './menus/UiPreferencesMenu.mjs'
import { LayoutSettingsMenu } from './menus/LayoutMenu.mjs'
import { TestOptionsMenu, TestMeasurementsMenu } from './menus/TestMenu.mjs'
import { FlagsAccordionEntries } from './Flag.mjs'
import { UndoStep } from './views/UndosView.mjs'

/*
 * Lookup object for header menu icons
 */
const headerMenuIcons = {
  flag: FlagIcon,
  options: OptionsIcon,
  right: RightIcon,
  settings: SettingsIcon,
  ui: UiIcon,
  layout: PrintIcon,
  measurements: MeasurementsIcon,
}

export const HeaderMenuIcon = (props) => {
  const { name, extraClasses = '' } = props
  const Icon = headerMenuIcons[name] || FixmeIcon

  // FIXME: Remove this when ready
  if (!headerMenuIcons[name]) console.log('FIXME: Add headerMenuIcon for ', name)

  return <Icon {...props} className={`tw:h-5 tw:w-5 ${extraClasses}`} />
}

export const HeaderMenuDraftView = (props) => {
  const i18n = useDesignTranslation(props.Design.designConfig.data.id)
  const flags = props.pattern?.setStores?.[0]?.plugins?.['plugin-annotations']?.flags

  return (
    <>
      <div className="tw:flex tw:flex-row tw:items-center tw:gap-0.5 tw:lg:gap-1">
        <HeaderMenuDraftViewDesignOptions {...props} i18n={i18n} />
        <HeaderMenuDraftViewCoreSettings {...props} i18n={i18n} />
        <HeaderMenuDraftViewUiPreferences {...props} i18n={i18n} />
        {flags ? <HeaderMenuDraftViewFlags {...props} flags={flags} i18n={i18n} /> : null}
      </div>
      <HeaderMenuDraftViewIcons {...props} />
      <HeaderMenuUndoIcons {...props} />
      <HeaderMenuSaveIcons {...props} />
    </>
  )
}

export const HeaderMenuTestView = (props) => {
  const i18n = useDesignTranslation(props.Design.designConfig.data.id)

  return (
    <>
      <HeaderMenuTestViewDesignOptions {...props} i18n={i18n} />
      <HeaderMenuTestViewDesignMeasurements {...props} />
      <HeaderMenuTestIcons {...props} i18n={i18n} />
    </>
  )
}

export const HeaderMenuTestViewDesignOptions = (props) => {
  return (
    <HeaderMenuDropdown
      {...props}
      id="designOptions"
      tooltip="See how design options influence the pattern being generated."
      toggle={
        <>
          <HeaderMenuIcon name="options" extraClasses="tw:text-secondary" />
          <span className="tw:hidden tw:lg:inline">Test Options</span>
        </>
      }
    >
      <TestOptionsMenu {...props} />
    </HeaderMenuDropdown>
  )
}

export const HeaderMenuTestViewDesignMeasurements = (props) => {
  return (
    <HeaderMenuDropdown
      {...props}
      id="designMeasurements"
      tooltip="See how changes to a measurement influence the pattern being generated."
      toggle={
        <>
          <HeaderMenuIcon name="measurements" extraClasses="tw:text-secondary" />
          <span className="tw:hidden tw:lg:inline">Test Measurements</span>
        </>
      }
    >
      <TestMeasurementsMenu {...props} />
    </HeaderMenuDropdown>
  )
}

export const HeaderMenuDropdown = (props) => {
  const { toggle, open, setOpen, id } = props
  const [localOpen, setLocalOpen] = useState(false)

  useEffect(() => {
    if (open) {
      if (open === id) setLocalOpen(true)
      else setLocalOpen(false)
    }
  }, [open, id])

  /*
   * New DaisyUI 5 implementation
   */
  return props.disabled ? (
    <button
      disabled
      data-component="Editor/HeaderMenuDropdown"
      tabIndex={0}
      role="button"
      className={`tw:daisy-btn tw:daisy-btn-ghost tw:hover:bg-secondary/20 tw:hover:border-solid tw:hover:border-2 tw:hover:border-secondary tw:border tw:border-secondary tw:border-2 tw:border-dotted tw:daisy-btn-sm tw:px-2 tw:z-20 tw:relative`}
    >
      {toggle}
    </button>
  ) : (
    <>
      <details
        className="tw:daisy-dropdown"
        open={localOpen}
        data-component="Editor/HeaderMenuDropdown"
      >
        <summary className="tw:daisy-btn tw:m-1" onClick={() => setOpen(id)}>
          {toggle}
        </summary>
        <ul
          className="tw:daisy-menu tw:daisy-dropdown-content tw:flex-nowrap tw:bg-base-200 tw:rounded-box tw:z-1 tw:w-screen tw:md:max-w-md tw:overflow-y-scroll tw:m-0 tw:p-0 tw:pl-0"
          style={{ padding: 0, maxHeight: 'calc(100vh - 8rem)' }}
        >
          {props.children}
        </ul>
      </details>
      {localOpen && (
        <div
          className="tw:w-screen tw:h-screen tw:fixed tw:top-10 tw:left-0 tw:opacity-100"
          style={{ width: '200vw', transform: 'translateX(-100vw)' }}
          onClick={() => {
            setOpen(false)
            setLocalOpen(false)
          }}
        ></div>
      )}
    </>
  )
}

export const HeaderMenuDraftViewDesignOptions = (props) => (
  <HeaderMenuDropdown
    {...props}
    id="designOptions"
    tooltip="These options are specific to this design. You can use them to customize your pattern in a variety of ways."
    toggle={
      <>
        <HeaderMenuIcon name="options" extraClasses="tw:text-secondary" />
        <span className="tw:hidden tw:lg:inline tw:capitalize">
          {props.state.design ? props.state.design : 'Design'} Options
        </span>
      </>
    }
  >
    <DesignOptionsMenu {...props} />
  </HeaderMenuDropdown>
)

export const HeaderMenuDraftViewCoreSettings = (props) => {
  return (
    <HeaderMenuDropdown
      {...props}
      tooltip="These settings are not specific to the design, but instead allow you to customize various parameters of the FreeSewing core library, which generates the design for you."
      id="coreSettings"
      toggle={
        <>
          <HeaderMenuIcon name="settings" extraClasses="tw:text-secondary" />
          <span className="tw:hidden tw:lg:inline">Core Settings</span>
        </>
      }
    >
      <CoreSettingsMenu {...props} />
    </HeaderMenuDropdown>
  )
}

export const HeaderMenuDraftViewUiPreferences = (props) => {
  return (
    <HeaderMenuDropdown
      {...props}
      tooltip="These preferences control the UI (User Interface) of the pattern editor"
      id="uiPreferences"
      toggle={
        <>
          <HeaderMenuIcon name="ui" extraClasses="tw:text-secondary" />
          <span className="tw:hidden tw:lg:inline">UI Preferences</span>
        </>
      }
    >
      <UiPreferencesMenu {...props} />
    </HeaderMenuDropdown>
  )
}

export const HeaderMenuDraftViewFlags = (props) => {
  const flatFlags = flattenFlags(props.flags)
  const count = Object.keys(flatFlags).length

  return (
    <HeaderMenuDropdown
      {...props}
      tooltip="Some issues about your current pattern need your attention."
      id="flags"
      toggle={
        <>
          <HeaderMenuIcon name="flag" extraClasses="tw:text-secondary" />
          <span className="tw:hidden tw:lg:inline">
            Flags
            <NumberBadge
              value={count}
              color={
                Object.values(flatFlags).some((it) => it.type === 'error') ? 'error' : 'secondary'
              }
            />
          </span>
        </>
      }
    >
      <FlagsAccordionEntries {...props} />
    </HeaderMenuDropdown>
  )
}

const NumberBadge = ({ value, color = 'secondary', className = '' }) => {
  return (
    <div
      className={`tw:ml-2 tw:inline-flex tw:items-center tw:justify-center tw:rounded-full tw:bg-${color} tw:text-${color}-content tw:text-xs tw:w-5 tw:h-5 tw:leading-none tw:font-semibold ${className}`}
      style={{ lineHeight: '1rem' }}
    >
      {value}
    </div>
  )
}

export const HeaderMenuDraftViewIcons = (props) => {
  const { update, state } = props
  const { settings = {} } = state // Guard against undefined settings
  const { account } = useAccount() // we need to know the user's preferred units
  const accountUnits = account.imperial ? 'imperial' : 'metric'
  const Button = HeaderMenuButton
  const size = 'tw:w-5 tw:h-5'
  const ux = state.ui.ux
  const levels = {
    ...props.config.uxLevels.core,
    ...props.config.uxLevels.ui,
  }

  // Visual indication between default and non-default settings
  const style = {
    dflt: 'tw:text-current tw:opacity-50',
    custom: 'tw:text-accent',
  }

  return (
    <div className="tw:hidden tw:lg:flex tw:flex-row tw:items-center tw:min-h-12  tw:flex-wrap tw:items-center tw:justify-center tw:px-0.5 tw:lg:px-1">
      {ux >= levels.sa ? (
        <Button
          lgOnly
          updateHandler={update.toggleSa}
          tooltip="Turns Seam Allowance on or off (see Core Settings)"
        >
          <SaIcon className={`${size} ${settings.sabool ? style.custom : style.dflt}`} />
        </Button>
      ) : null}
      {ux >= levels.units ? (
        <Button
          lgOnly
          updateHandler={() =>
            update.settings('units', settings.units === 'imperial' ? 'metric' : 'imperial')
          }
          tooltip="Switches Units between metric and imperial (see Core Settings)"
        >
          <UnitsIcon
            className={`${size} ${settings.units === accountUnits || typeof settings.units === 'undefined' ? style.dflt : style.custom}`}
          />
        </Button>
      ) : null}
      {ux >= levels.paperless ? (
        <Button
          lgOnly
          updateHandler={() => update.settings('paperless', settings.paperless ? 0 : 1)}
          tooltip="Turns Paperless on or off (see Core Settings)"
        >
          <PaperlessIcon className={`${size} ${settings.paperless ? style.custom : style.dflt}`} />
        </Button>
      ) : null}
      {ux >= levels.complete ? (
        <Button
          lgOnly
          updateHandler={() =>
            update.settings('complete', [false, 0, '0'].includes(settings.complete) ? 1 : 0)
          }
          tooltip="Turns Details on or off (see Core Settings)"
        >
          <DetailIcon
            className={`${size} ${[false, 0, '0'].includes(settings.complete) ? style.custom : style.dflt}`}
          />
        </Button>
      ) : null}
      {ux >= levels.expand ? (
        <Button
          lgOnly
          updateHandler={() =>
            update.settings('expand', [false, 0, '0'].includes(settings.expand) ? 1 : 0)
          }
          tooltip="Turns Expand on or off (see Core Settings)"
        >
          {[false, 0, '0'].includes(settings.expand) ? (
            <CompactIcon className={`${size} ${style.custom}`} />
          ) : (
            <ExpandIcon className={`${size} ${style.dflt}`} />
          )}
        </Button>
      ) : null}
      <HeaderMenuIconSpacer />
      {ux >= levels.aside ? (
        <Button
          lgOnly
          updateHandler={() => update.ui('aside', state.ui.aside ? 0 : 1)}
          tooltip="Toggles the side menu (see UI Preferences)"
        >
          <AsideIcon className={`${size} ${state.ui.aside ? style.custom : style.dflt}`} />
        </Button>
      ) : null}
      {ux >= levels.renderer ? (
        <Button
          lgOnly
          updateHandler={() =>
            update.ui('renderer', state.ui.renderer === 'react' ? 'svg' : 'react')
          }
          tooltip="Switches the Render Engine between React and SVG (see UI Preferences)"
        >
          <RocketIcon
            className={`${size} ${state.ui.renderer === 'svg' ? style.custom : style.dflt}`}
          />
        </Button>
      ) : null}
    </div>
  )
}

export const HeaderMenuUndoIcons = (props) => {
  const { update, state, Design } = props
  const Button = HeaderMenuButton
  const size = 'tw:w-5 tw:h-5'
  const undos = state._?.undos && state._.undos.length > 0 ? state._.undos : false

  return (
    <div className="tw:flex tw:flex-row tw:items-center tw:min-h-12 tw:flex-wrap tw:items-center tw:justify-center tw:px-0.5 tw:lg:px-1">
      <Button
        lgOnly
        updateHandler={() => update.restore(0, state._)}
        tooltip="Undo the most recent change"
        disabled={undos ? false : true}
      >
        <UndoIcon className={`${size} ${undos ? 'tw:text-secondary' : ''}`} text="1" />
      </Button>
      <Button
        lgOnly
        updateHandler={() => update.restore(undos.length - 1, state._)}
        tooltip="Undo all changes since the last save point"
        disabled={undos ? false : true}
      >
        <UndoIcon className={`${size} ${undos ? 'tw:text-secondary' : ''}`} text="A" />
      </Button>
      <HeaderMenuDropdown
        end
        {...props}
        tooltip={viewLabels.undos.t}
        id="undos"
        disabled={undos ? false : true}
        toggle={
          <>
            <UndoIcon className="tw:w-4 tw:h-4" stroke={3} />
            <span className="tw:hidden tw:lg:inline">Undo</span>
          </>
        }
      >
        {undos ? (
          <>
            {undos.slice(0, 9).map((step, index) => (
              <li key={index}>
                <UndoStep {...{ step, update, state, Design, index }} compact />
              </li>
            ))}
            <li key="view">
              <ButtonFrame dense onClick={() => update.view('undos')}>
                <div className="tw:flex tw:flex-row tw:items-center tw:align-center tw:justify-between tw:gap-2 tw:w-full">
                  <div className="tw:flex tw:flex-row tw:items-center tw:align-start tw:gap-2 tw:grow">
                    <UndoIcon className="tw:w-5 tw:h-5 tw:text-secondary" />
                    {viewLabels.undos.t}
                  </div>
                  {undos.length}
                </div>
              </ButtonFrame>
            </li>
          </>
        ) : null}
      </HeaderMenuDropdown>
      <Button
        updateHandler={update.clearPattern}
        tooltip="Reset all settings, but keep the design and measurements"
      >
        <TrashIcon className={`${size} tw:text-secondary`} />
      </Button>
      <Button updateHandler={update.clearAll} tooltip="Reset the editor completely">
        <ResetAllIcon className={`${size} tw:text-secondary`} />
      </Button>
    </div>
  )
}

export const HeaderMenuTestIcons = (props) => {
  const { update } = props
  const Button = HeaderMenuButton

  return (
    <div className="tw:flex tw:flex-row tw:flex-wrap tw:items-center tw:justify-center tw:px-0.5 tw:lg:px-1 tw:items-center">
      <Button
        updateHandler={() => update.settings('sample', undefined)}
        tooltip="Clear the test so you can select another"
      >
        <ResetIcon /> <span className="tw:hidden tw:lg:inline">Clear Test</span>
      </Button>
    </div>
  )
}

export const HeaderMenuSaveIcons = (props) => {
  const { update, state } = props
  const { settings = {} } = state // Guard against undefined settings
  const backend = useBackend()
  const Button = HeaderMenuButton
  const size = 'tw:w-5 tw:h-5'
  const saveable = state._?.undos && state._.undos.length > 0

  /*
   * Save or Save As, depending on state.pattern
   */
  const savePattern = async () => {
    const pid = state.pid || false
    if (pid) {
      const loadingId = 'savePattern'
      update.startLoading(loadingId)
      const patternData = { settings }
      const result = await backend.updatePattern(pid, patternData)
      if (result[0] === 200) {
        update.stopLoading(loadingId)
        update.view('draft')
        update.notifySuccess('Pattern saved')
      } else update.notifyFailure('oops', loadingId)
    } else update.view('save')
  }

  return (
    <div className="tw:flex tw:flex-row tw:items-center tw:min-h-12 tw:flex-wrap tw:items-center tw:justify-center tw:px-2">
      <Button updateHandler={savePattern} tooltip="Save pattern" disabled={saveable ? false : true}>
        <SaveIcon className={`${size} ${saveable ? 'tw:text-success' : ''}`} />
      </Button>
      <Button updateHandler={() => update.view('save')} tooltip="Save pattern as...">
        <SaveAsIcon className={`${size} tw:text-secondary`} />
      </Button>
      <Button updateHandler={() => update.view('export')} tooltip="Export pattern">
        <ExportIcon className={`${size} tw:text-secondary`} />
      </Button>
    </div>
  )
}

export const HeaderMenuIconSpacer = () => (
  <span className="tw:hidden tw:lg:inline tw:px-1 tw:font-bold tw:opacity-30">|</span>
)

export const HeaderMenuButton = ({
  updateHandler,
  children,
  tooltip,
  lgOnly = false,
  disabled = false,
}) => (
  <Tooltip tip={tooltip}>
    <button
      className={`${lgOnly ? 'tw:hidden tw:lg:inline' : ''} tw:daisy-btn tw:daisy-btn-ghost tw:my-1 tw:px-1 tw:disabled:bg-transparent`}
      onClick={updateHandler}
      disabled={disabled}
    >
      {children}
    </button>
  </Tooltip>
)

export const HeaderMenuSpacer = () => <li></li>

export const HeaderMenuViewMenu = (props) => {
  const { config, update, state } = props
  const output = []
  let i = 1
  for (const viewName of [
    'spacer',
    ...config.mainViews,
    'spacer',
    ...config.extraViews,
    'spacerOver3',
    ...config.devViews,
    'spacer',
    'picker',
  ]) {
    if (viewName === 'spacer') output.push(<HeaderMenuSpacer key={i} />)
    else if (viewName === 'spacerOver3')
      output.push(state.ui.ux > 3 ? <HeaderMenuSpacer key={i} /> : null)
    else if (
      state.ui.ux >= config.uxLevels.views[viewName] &&
      (config.measurementsFreeViews.includes(viewName) || state._.missingMeasurements.length < 1)
    )
      output.push(
        <li
          key={i}
          className="tw:mb-1 tw:flex tw:flex-row tw:items-center tw:justify-between tw:w-full"
        >
          <a
            className={`tw:w-full tw:text-base-content
            tw:flex tw:flex-row tw:items-center tw:gap-2 tw:md:gap-4 tw:p-2 tw:px-4
            tw:hover:cursor-pointer tw:hover:text-base-content tw:hover:cursor-pointer`}
            onClick={() => update.view(viewName)}
          >
            <ViewIcon
              view={viewName}
              className={`tw:w-6 tw:h-6 tw:grow-0 ${viewName === state.view ? 'tw:text-secondary' : 'tw:text-base-content'}`}
            />
            <span className="tw:text-left tw:grow tw:font-medium tw:text-base-content">
              {viewLabels[viewName]?.t || viewName}
            </span>
          </a>
        </li>
      )
    i++
  }

  return (
    <HeaderMenuDropdown
      {...props}
      tooltip="Choose between the main views of the pattern editor"
      id="views"
      toggle={
        <>
          <HeaderMenuIcon name="right" stroke={3} extraClasses="tw:text-secondary tw:rotate-90" />
          <span className="tw:hidden tw:lg:inline">
            {viewLabels[state.view] ? viewLabels[state.view].t : 'Views'}
          </span>
        </>
      }
    >
      {output}
    </HeaderMenuDropdown>
  )
}

export const HeaderMenuLayoutView = (props) => (
  <div className="tw:flex tw:flex-row tw:items-center">
    <HeaderMenuDropdown
      {...props}
      id="layoutOptions"
      tooltip="These options are specific to this design. You can use them to customize your pattern in a variety of ways."
      toggle={
        <>
          <HeaderMenuIcon name="layout" extraClasses="tw:text-secondary" />
          <span className="tw:hidden tw:lg:inline">Print Settings</span>
        </>
      }
    >
      <LayoutSettingsMenu {...props} />
    </HeaderMenuDropdown>
    <HeaderMenuLayoutViewIcons {...props} />
  </div>
)

export const HeaderMenuLayoutViewIcons = (props) => {
  const { pattern, update, state } = props
  const { settings = {} } = state // Guard against undefined settings
  const [tweaks, setTweaks] = useState(0)

  // Is the current custom layout an actual layout?
  const layoutValid =
    typeof state.ui.layout === 'object' &&
    state.ui.layout.width &&
    state.ui.layout.height &&
    state.ui.layout.stacks

  useEffect(() => {
    // Handle layout update on drag end
    if (layoutValid) applyLayout()
    setTweaks(tweaks + 1)
  }, [state.ui.layout])

  const applyLayout = () => {
    setTweaks(-1)
    // Do not apply layout if it is not valid
    if (layoutValid) update.settings('layout', state.ui.layout)
    else update.notify({ msg: 'First create a custom layout', icon: 'tip' })
  }
  const resetLayout = () => {
    setTweaks(-1)
    update.ui('layout', true)
    update.settings('layout', true)
  }

  const pages = pattern.setStores[0].get('pages', {})
  const { cols, rows, count } = pages
  const blank = cols * rows - count

  return (
    <>
      <Tooltip tip="Number of pages required for the current layout">
        <span className="tw:px-1 tw:font-bold tw:text-sm tw:block tw:h-8 tw:py-1 tw:opacity-80">
          <span className="">
            {count} pages
            <span className="tw:pl-1 tw:text-xs tw:font-medium">
              ({cols}x{rows}, {blank} blank)
            </span>
          </span>
        </span>
      </Tooltip>
      <Tooltip tip="Generate a PDF that you can print">
        <button
          className="tw:daisy-btn tw:daisy-btn-ghost tw:daisy-btn-sm tw:px-1 tw:disabled:bg-transparent tw:text-secondary"
          onClick={() => update.view('export')}
        >
          <PrintIcon />
        </button>
      </Tooltip>
      <Tooltip tip="Reset the custom layout">
        <button
          className="tw:daisy-btn tw:daisy-btn-ghost tw:daisy-btn-sm tw:px-1 tw:disabled:bg-transparent tw:text-secondary"
          onClick={resetLayout}
        >
          <ResetIcon />
        </button>
      </Tooltip>
    </>
  )
}

const headerMenus = {
  draft: HeaderMenuDraftView,
  inspect: HeaderMenuDraftView,
  test: HeaderMenuTestView,
  layout: HeaderMenuLayoutView,
  timing: HeaderMenuDraftView,
}

export const HeaderMenu = ({ config, Design, pattern, state, update, strings }) => {
  const [open, setOpen] = useState()

  /*
   * Guard views that require measurements agains missing measurements
   * and make sure there's a view-specific header menu
   */
  const ViewSpecificMenu =
    !missingMeasurements(state) && headerMenus[state.view] ? headerMenus[state.view] : Null

  return (
    <div
      className={`tw:flex tw:sticky tw:top-0 ${
        state.ui.kiosk ? 'tw:z-50' : 'tw:z-20'
      } tw:transition-[top] tw:duration-300 tw:ease-in-out`}
    >
      <div
        className={`tw:flex tw:flex-row tw:items-center tw:flex-wrap tw:gap-0.5 tw:lg:gap-1 tw:w-full tw:items-start tw:justify-center tw:py-1 tw:md:py-1.5`}
      >
        <HeaderMenuViewMenu {...{ config, state, update, open, setOpen, strings }} />
        <ViewSpecificMenu {...{ config, state, update, Design, pattern, open, setOpen, strings }} />
      </div>
    </div>
  )
}
