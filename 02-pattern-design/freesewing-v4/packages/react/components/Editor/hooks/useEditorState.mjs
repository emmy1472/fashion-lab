// Dependenicies
import { atomWithHash } from 'jotai-location'
import { stateUpdateFactory } from '../lib/index.mjs'
// Hooks
import { useAtom } from 'jotai'
import { useMemo, useEffect } from 'react'

/*
 * Set up the atom
 */
const urlAtom = atomWithHash('s', { setHash: 'replaceState' })

/**
 * Url state backend
 *
 * This holds the editor state, using session storage.
 * It also provides helper methods to manipulate state.
 *
 * @params {object} init - Initial pattern settings
 * @params {function} setEphemeralState - Method to set the ephemeral state
 * @params {object] config - The editor config
 * @return {array} return - And array with get, set, and update methods
 */
export const useEditorState = (init = {}, setEphemeralState, config) => {
  const [state, setState] = useAtom(urlAtom)

  const update = useMemo(() => stateUpdateFactory(setState, setEphemeralState, config), [setState])

  /*
   * Set the initial state
   */
  useEffect(() => {
    // Handle state on a hard reload or cold start
    if (typeof URLSearchParams !== 'undefined') {
      try {
        const data = getHashData()
        if (typeof data.s === 'object') setState(data.s)
        else setState(init)
      } catch (err) {
        console.log(err)
        setState(init)
      }
    }
  }, [])

  return [state, setState, update]
}

function getHashData() {
  if (!window) return false

  const hash = window.location.hash
    .slice(1)
    .split('&')
    .map((chunk) => chunk.split('='))
  const data = {}
  for (const [key, val] of hash) {
    data[key] = JSON.parse(decodeURIComponent(decodeURI(val)))
  }

  return data
}
