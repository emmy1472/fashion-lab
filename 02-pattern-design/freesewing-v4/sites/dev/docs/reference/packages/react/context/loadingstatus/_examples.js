import React, { useContext } from 'react'
import { LoadingStatusContext } from '@freesewing/react/context/LoadingStatus'

export const LoadingExamples = () => {
  const { setLoadingStatus, LoadingProgress } = useContext(LoadingStatusContext)

  const progressExample = () => {
    window.setTimeout(
      setLoadingStatus([true, "All done!", true, true]),
      1500
    )
    for (let i=0; i<51; i++) window.setTimeout(
      () => setLoadingStatus([
        true,
        i < 50 ? <LoadingProgress msg="Herding cats" val={i} max={50} /> : 'All done!',
        i < 50 ? false : true,
        true
      ]),
      i*25
    )
  }

  return (
    <div className="tw:flex tw:flex-row tw:flex-wrap tw:items-center tw:gap-2">
      <button
        onClick={() => setLoadingStatus([true, "Success, will fade away", true, true])}
        className="tw:daisy-btn tw:daisy-btn-success"
      >Show Success Example</button>
      <button
        onClick={() => setLoadingStatus([true, "Error, will fade away", true, false])}
        className="tw:daisy-btn tw:daisy-btn-error"
      >Show Error Example</button>
      <button
        onClick={() => setLoadingStatus([true, "I won't go away, but will make way for a different loading status", false, true])}
        className="tw:daisy-btn tw:daisy-btn-secondary"
      >Show Permanent Status</button>
      <button onClick={progressExample} className="tw:daisy-btn tw:daisy-btn-primary">Show Progress Example</button>
    </div>
  )
}
