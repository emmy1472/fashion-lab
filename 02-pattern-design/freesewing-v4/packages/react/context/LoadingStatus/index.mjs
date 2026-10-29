import React, { useState, useEffect, createContext } from 'react'
import { Spinner } from '@freesewing/react/components/Spinner'
import { OkIcon, WarningIcon } from '@freesewing/react/components/Icon'

/*
 * The actual context
 */
export const LoadingStatusContext = createContext([false])

/*
 * Timeout in seconds before the loading status dissapears
 */
const timeout = 2

/*
 * The React component displaying the loading status
 */
const LoadingStatus = ({ loadingStatus }) => {
  const [fade, setFade] = useState('tw:opacity-100')
  const [timer, setTimer] = useState(false)

  useEffect(() => {
    if (loadingStatus[2]) {
      if (timer) clearTimeout(timer)
      setTimer(
        window.setTimeout(
          () => {
            setFade('opacity-0')
          },
          timeout * 1000 - 350
        )
      )
    }
  }, [loadingStatus[2]])

  if (!loadingStatus[0]) return null

  let color = 'secondary'
  let icon = <Spinner />
  if (loadingStatus[2]) {
    color = loadingStatus[3] ? 'success' : 'error'
    icon = loadingStatus[3] ? (
      <OkIcon stroke={4} className="tw:w-8 tw:h-8" />
    ) : (
      <WarningIcon className="tw:w-8 tw:h-8" stroke={2} />
    )
  }

  return (
    <div
      className="tw:fixed tw:bottom-14 tw:md:bottom-auto tw:md:top-28 tw:left-0 tw:z-50 tw:md:px-4 tw:w-full"
      style={{ zIndex: 500 }}
    >
      <div
        className={`tw:w-full tw:md:max-w-2xl tw:m-auto tw:bg-${color} tw:flex tw:flex-row tw:items-center tw:gap-4 tw:p-4 tw:px-4 ${fade}
        tw:transition-opacity tw:delay-[${timeout * 1000 - 400}ms] tw:duration-300
        tw:md:rounded-lg tw:shadow tw:text-secondary-content tw:text-lg tw:lg:text-xl tw:font-medium tw:md:bg-${color}/90`}
      >
        <span className="tw:shrink-0">{icon}</span>
        {loadingStatus[1]}
      </div>
    </div>
  )
}

/*
 * An animated loading state
 */
const LoadingProgress = ({ val = 0, max = 1, msg }) => (
  <div className="tw:flex tw:flex-col tw:gap-2 tw:w-full tw:grow-0">
    {msg}
    <progress className="tw:daisy-progress tw:text-info-content" value={val} max={max}></progress>
  </div>
)

/**
 * The LoadingStatus context provider
 *
 * @component
 * @param {object} props - All component props
 * @param {JSX.Element} props.children - The component children, will be rendered if props.js is not set
 * @returns {JSX.Element}
 */
export const LoadingStatusContextProvider = ({ children }) => {
  /*
   * LoadingStatus should hold an array with 1 to 4 elements:
   * 0 => Show loading status or not (true or false)
   * 1 => Message to show
   * 2 => Set this to true to make the loadingStatus dissapear after 2 seconds
   * 3 => Set this to true to show success, false to show error (only when 2 is true)
   */
  const [timer, setTimer] = useState(false)

  const [__loadingStatus, __setLoadingStatus] = useState({
    status: [false],
    setLoadingStatus,
    loading: false,
    LoadingStatus: () => <LoadingStatus loadingStatus={[false]} />,
    LoadingProgress,
  })

  useEffect(() => {
    if (__loadingStatus.status[2]) {
      if (timer) clearTimeout(timer)
      setTimer(
        window.setTimeout(() => {
          setLoadingStatus([false])
        }, timeout * 1000)
      )
    }
  }, [__loadingStatus.status[2]])

  function setLoadingStatus(newStatus) {
    __setLoadingStatus({
      ...__loadingStatus,
      status: newStatus,
      loading: newStatus[0] || false,
      LoadingStatus: () => <LoadingStatus loadingStatus={newStatus} />,
    })
  }

  return (
    <LoadingStatusContext.Provider value={__loadingStatus}>
      {children}
    </LoadingStatusContext.Provider>
  )
}
