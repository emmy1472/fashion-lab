import { useAtom } from 'jotai'
import { atomWithHash } from 'jotai-location'

const filterAtom = atomWithHash('filter', {})

export const useFilter = () => useAtom(filterAtom)
