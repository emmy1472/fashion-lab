import React from 'react'
import { CuratedSet, CuratedSetLineup } from '@freesewing/react/components/CuratedSet'

const CuratedSetExample = () => <CuratedSet id={1} />
const CuratedSetLineupExample = () => <CuratedSetLineup href={() => '#'} />

export  {
  CuratedSetExample,
  CuratedSetLineupExample,
}
