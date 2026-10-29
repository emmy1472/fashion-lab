// Dependencies
import { clone } from '@freesewing/utils'
import yaml from 'yaml'
// Hooks
import React, { useState } from 'react'
import { useStateObject } from '@freesewing/react/hooks/useStateObject'
import { useColorMode } from '@docusaurus/theme-common'
// Components
import { H1, H4 } from '@freesewing/react/components/Heading'
import { DiffViewer, diffCheck } from '@freesewing/react/components/DiffViewer'
import { HeaderMenu } from '../HeaderMenu.mjs'
import { ResetIcon, OkIcon } from '@freesewing/react/components/Icon'
import CodeMirror from '@uiw/react-codemirror'
import { basicDark, basicLight } from '@uiw/codemirror-themes-all'
import { yaml as yamlLang } from '@codemirror/lang-yaml'

/**
 * This is the editSettings view
 *
 * @param {Object} props - All the props
 * @param {Function} props.config - The editor configuration
 * @param {Object} props.state - The editor state object
 * @param {Object} props.update - Helper object for updating the editor state
 */
export const EditSettingsView = (props) => {
  const { state, config, update } = props

  return (
    <>
      <HeaderMenu state={state} {...{ config, update }} />
      <div className="tw:m-auto tw:mt-8 tw:max-w-4xl tw:px-4 tw:mb-8">
        <H1>Edit settings by hand</H1>
        <p className="tw:mb-4">
          You can hand-edit your pattern settings below.
          <br />
          The changes will not take effect until you click the <b>Save Settings</b> button at the
          bottom.
        </p>
        <PrimedSettingsEditor {...props} />
      </div>
    </>
  )
}

/**
 * This is the React component for the settings editor itself
 */
export const PrimedSettingsEditor = (props) => {
  const { colorMode } = useColorMode()
  const editorTheme = colorMode === 'dark' ? basicDark : basicLight

  /*
   * Destructure props
   */
  const { state } = props
  const stateSettings = state.settings || {} // Guard against undefined settings

  /*
   * React state
   */
  /* eslint-disable-next-line no-unused-vars */
  const [settings, update, setSettings] = useStateObject(stateSettings) // Holds the settings
  const [showDelta, setShowDelta] = useState(false)
  const [localYaml, setLocalYaml] = useState(yaml.stringify(stateSettings)) // Holds the settings as YAML

  /*
   * Method to revert to the settings in the editor state
   */
  const revert = () => {
    setSettings(clone(stateSettings))
    setLocalYaml(yaml.stringify(stateSettings))
  }

  /*
   * Method to save to the settings into the editor state
   */
  const save = () => {
    props.update.state('settings', yaml.parse(localYaml))
  }

  if (!settings) return null

  /*
   * Handle settings delta
   */
  const delta =
    diffCheck(yaml.stringify(stateSettings), yaml.stringify(settings)).length > 1 ? true : false

  const onChangeYaml = (input) => {
    let newSettings
    try {
      newSettings = yaml.parse(input)
      if (newSettings) {
        setLocalYaml(input)
        setSettings(newSettings)
      }
    } catch (err) {
      console.log(err)
    }
  }

  return (
    <>
      <CodeMirror
        value={localYaml}
        height="50vh"
        onChange={onChangeYaml}
        extensions={[yamlLang()]}
        theme={editorTheme}
      />
      {delta ? (
        <>
          <H4>You have made changes</H4>
          <p>Your settings have been edited, and are now different from the editor settings.</p>
          <div className="tw:grid tw:grid-cols-1 tw:lg:grid-cols-3 tw:gap-2 tw:w-full">
            <button
              className="tw:daisy-btn tw:daisy-btn-primary tw:daisy-btn-outline"
              onClick={() => setShowDelta(!showDelta)}
            >
              {showDelta ? 'Hide' : 'Show'} Changes
            </button>
            <button
              className="tw:daisy-btn tw:daisy-btn-primary tw:flex tw:flex-row tw:items-center tw:justify-between"
              onClick={save}
            >
              <OkIcon stroke={3} />
              Save Settings
            </button>
            <button
              className="tw:daisy-btn tw:daisy-btn-error tw:daisy-btn-outline tw:flex tw:flex-row tw:items-center tw:justify-between"
              onClick={revert}
            >
              <ResetIcon />
              Revert Settings
            </button>
          </div>
          {showDelta ? (
            <div className="tw:my-4 tw:w-full tw:overflow-scroll">
              <DiffViewer
                oldValue={yaml.stringify(stateSettings)}
                newValue={yaml.stringify(settings)}
                extraLinesSurroundingDiff="1"
                fromTitle="Currently deployed settings"
                toTitle="Your edits"
              />
            </div>
          ) : null}
        </>
      ) : null}
    </>
  )
}
