// Context
import { LoadingStatusContext } from '@freesewing/react/context/LoadingStatus'
// Hooks
import { useState, useContext } from 'react'
import { useAccount } from '@freesewing/react/hooks/useAccount'
import { useBackend } from '@freesewing/react/hooks/useBackend'

/**
 * Control can be updated from many places in the UI.
 * So this shared state handler keeps this DRY
 */
export const useControl = () => {
  // Hooks
  const backend = useBackend()
  const { account, setAccount, token } = useAccount()
  const { setLoadingStatus } = useContext(LoadingStatusContext)

  // State
  const [control, __setControl] = useState(account.control)

  /*
   * Legacy method to update the control setting
   * Deprecated because its naming is inconsistent with other hooks
   */
  const updateControl = async (newControl) => {
    console.warn('The updateControl method is deprecated. Use setControl instead.')
    return setControl(newControl)
  }

  // Method to set the control setting
  const setControl = async (newControl) => {
    if (newControl !== control) {
      if (token) {
        setLoadingStatus([true, 'Updating preferences'])
        const [status, body] = await backend.updateAccount({ control: newControl })
        if (status === 200) {
          __setControl(newControl)
          setAccount(body.account)
          setLoadingStatus([true, 'Preferences updated', true, true])
        } else
          setLoadingStatus([true, 'Failed to update preferences. Please report this', true, true])
      } else {
        /*
         * Control is used even when people are not logged in
         * So this ensures control is always available, even if people are not authenticated
         */
        setAccount({ ...account, control: newControl })
        __setControl(newControl)
      }
    }
  }

  return { control, setControl, updateControl }
}
