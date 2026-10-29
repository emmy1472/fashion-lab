import React, { useContext } from 'react'
import { measurements as measurementTranslations } from '@freesewing/i18n'
// Context
import { ModalContext } from '@freesewing/react/context/Modal'
// Components
import { MeasurementInput } from '@freesewing/react/components/Input'
import { modalMeasurementHelp } from '@freesewing/react/components/Help'

/**
 * This MeasurementsEditor component allows inline-editing of the measurements
 *
 * @param {object} props - The component's props
 * @param {function} props.Design - The design constructor
 * @param {object} props.state - The ViewWrapper state object
 * @param {object} props.state.settings - The current settings
 * @param {object} props.update - Helper object for updating the ViewWrapper state
 * @return {function} MeasurementsEditor - React component
 */
export const MeasurementsEditor = ({ Design, update, state }) => {
  // Context
  const { setModal, modalContent } = useContext(ModalContext)

  /*
   * Helper method to handle state updates for measurements
   */
  const onUpdate = (m, newVal) => {
    update.settings(['measurements', m], newVal)
  }

  /*
   * Ensure settings is not undefined
   */
  const { settings = {} } = state

  return (
    <div className="tw:max-w-xl tw:w-full tw:mx-auto">
      <h4>Required Measurements</h4>
      {Object.keys(Design.patternConfig.measurements).length === 0 ? (
        <p>This design does not require any measurements.</p>
      ) : (
        <div>
          {Design.patternConfig.measurements.map((m) => (
            <MeasurementInput
              key={m}
              m={m}
              imperial={settings.units === 'imperial' ? true : false}
              original={settings.measurements?.[m]}
              update={(m, newVal) => onUpdate(m, newVal)}
              id={`edit-${m}`}
              label={measurementTranslations[m]}
              help={() => modalMeasurementHelp(m, setModal)}
            />
          ))}
          <br />
        </div>
      )}
      <h4>Optional Measurements</h4>
      {Object.keys(Design.patternConfig.optionalMeasurements).length === 0 ? (
        <p>This design does not use any optional measurements.</p>
      ) : (
        Design.patternConfig.optionalMeasurements.map((m) => (
          <MeasurementInput
            key={m}
            m={m}
            imperial={settings.units === 'imperial' ? true : false}
            original={settings.measurements?.[m]}
            update={(m, newVal) => onUpdate(m, newVal)}
            id={`edit-${m}`}
            help={() => modalMeasurementHelp(m, setModal)}
          />
        ))
      )}
    </div>
  )
}
