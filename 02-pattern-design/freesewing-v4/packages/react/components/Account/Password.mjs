// Context
import { LoadingStatusContext } from '@freesewing/react/context/LoadingStatus'
// Hooks
import React, { useState, useContext } from 'react'
import { useAccount } from '@freesewing/react/hooks/useAccount'
import { useBackend } from '@freesewing/react/hooks/useBackend'
// Components
import { Link as WebLink } from '@freesewing/react/components/Link'
import { RightIcon, SaveIcon } from '@freesewing/react/components/Icon'
import { PasswordInput } from '@freesewing/react/components/Input'
import { Popout } from '@freesewing/react/components/Popout'

/**
 * A component to manage the user's password
 *
 * @component
 * @param {object} props - All component props
 * @param {bool} [props.welcome = false] - Set to true to render the welcome/onboarding view
 * @param {React.Component} props.Link - A framework specific Link component for client-side routing
 * @returns {JSX.Element}
 */
export const Password = ({ Link = false }) => {
  if (!Link) Link = WebLink
  // Hooks
  const backend = useBackend()
  const { account, setAccount } = useAccount()
  const { setLoadingStatus } = useContext(LoadingStatusContext)

  // State
  const [password, setPassword] = useState('')

  // Helper method to save password to account
  const save = async () => {
    setLoadingStatus([true, 'Updating password'])
    const [status, body] = await backend.updateAccount({ password })
    if (status === 200 && body.result === 'success') {
      setAccount(body.account)
      setLoadingStatus([true, 'Password updated', true, true])
    } else setLoadingStatus([true, 'Something went wrong. Please report this', true, true])
  }

  return (
    <div className="tw:w-full">
      <PasswordInput
        id="account-password"
        label="Something only you know"
        current={password}
        update={setPassword}
        valid={(val) => val.length > 0}
        placeholder="Tip: use a password manager"
      />
      <button
        className={`tw:flex tw:flex-row tw:gap-2 tw:items-center tw:daisy-btn tw:justify-between tw:daisy-btn-primary tw:w-full tw:md:w-auto tw:w-full`}
        onClick={save}
        disabled={password.length < 4}
      >
        <SaveIcon /> Save
      </button>
      {!account.mfaEnabled && (
        <Popout type="tip">
          <h5>Please consider enabling Two-Factor Authentication</h5>
          <p>
            We do not enforce a password policy, but we do recommend you enable Two-Factor
            Authentication to keep your FreeSewing account safe.
          </p>
          <p className="tw:text-right tw:m-0 tw:pt-0">
            <Link className="tw:daisy-btn tw:daisy-btn-accent" href="/account/security/mfa">
              Two-Factor Authentication <RightIcon className="tw:h-6 tw:w-6 tw:ml-2" />
            </Link>
          </p>
        </Popout>
      )}
    </div>
  )
}
