// Dependencies
import { welcomeSteps } from './shared.mjs'
import { controlDesc } from '@freesewing/config'
// Hooks
import React from 'react'
import { useControl } from '@freesewing/react/hooks/useControl'
// Components
import { RightIcon } from '@freesewing/react/components/Icon'
import { ListInput } from '@freesewing/react/components/Input'
import { ControlScore } from '@freesewing/react/components/Control'
import { IconButton } from '@freesewing/react/components/Button'
import { WelcomeIcons } from './shared.mjs'

/**
 * A component to manage the user's control/UX setting
 *
 * @component
 * @param {object} props - All component props
 * @param {bool} [props.welcome = false] - Set to true to render the welcome/onboarding view
 * @returns {JSX.Element}
 */
export const Control = ({ welcome = false }) => {
  // Hooks
  const { control, setControl } = useControl()

  // Helper to get the link to the next onboarding step
  const nextHref = welcome
    ? welcomeSteps[control].length > 1
      ? '/welcome/' + welcomeSteps[control][1]
      : '/docs/about/'
    : false

  return (
    <div className="tw:w-full">
      <ListInput
        id="account-control"
        label="What user experience do you prefer?"
        list={[1, 2, 3, 4, 5].map((val) => ({
          val,
          label: (
            <div className="tw:flex tw:flex-row tw:items-center tw:w-full tw:justify-between">
              <span>{controlDesc[val].title}</span>
              <ControlScore control={val} />
            </div>
          ),
          desc: controlDesc[val].desc,
        }))}
        current={control}
        update={setControl}
      />
      {welcome ? (
        <>
          <IconButton href={nextHref} className="tw:mt-4">
            <RightIcon stroke={3} /> Continue
          </IconButton>
          {welcomeSteps[control].length > 1 ? (
            <>
              <progress
                className="tw:daisy-progress tw:daisy-progress-primary tw:w-full tw:mt-12"
                value={100 / welcomeSteps[control].length}
                max="100"
              ></progress>
              <span className="tw:pt-4 tw:text-sm tw:font-bold tw:opacity-50">
                1 / {welcomeSteps[control].length}
              </span>
              <WelcomeIcons done={[]} todo={welcomeSteps[control].slice(1)} current="" />
            </>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
