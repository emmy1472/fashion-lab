import React, { useState, useContext } from 'react'
import { ModalContext } from '@freesewing/react/context/Modal'
import { ModalWrapper } from '@freesewing/react/components/Modal'
import { KioskIcon } from '@freesewing/react/components/Icon'

/**
 * A component to render Tabs, typically used for dev examples.
 *
 * Note that children MUST be at least two Tab components.
 *
 * @component
 * @param {object} props - All component props
 * @param {string} props.tabs - The list of tabs
 * @param {number} [props.active = 0] - The index of the active tab
 * @param {JSX.Element} props.children - The component children, will be rendered if props.js is not set
 * @param {bool} [props.withModal = false] - Set to true to load tab content in a modal window when kiosk icon is clicked
 * @returns {JSX.Element}
 */
export const Tabs = ({ tabs = '', active = 0, children, withModal = false }) => {
  const { setModal } = useContext(ModalContext)

  // Keep active tab in state
  const [activeTab, setActiveTab] = useState(active)

  /*
   * Parse tab list
   * Comma-seperated tabs passed as a string are how it works in MDX
   */
  const tablist = Array.isArray(tabs) ? tabs : tabs.split(',').map((tab) => tab.trim())

  if (!tablist) return null

  // Pass down activeTab and tabId for conditional rendering
  const childrenWithTabSetter = children.map((child, tabId) =>
    React.cloneElement(child, { activeTab, tabId, key: tabId })
  )

  return (
    <div className="tw:border tw:border-base-300 tw:rounded-lg tw:pt-2">
      <div className="tw:daisy-tabs tw:daisy-tabs-border" role="tablist">
        {tablist.map((title, tabId) => {
          const btnClasses = `tw:text-lg tw:font-bold tw:capitalize tw:daisy-tab tw:h-auto tw:grow tw:py-1 ${
            activeTab === tabId ? 'tw:daisy-tab-active' : ''
          } tw:border-b-2 tw:border-solid tw:border-x-0 tw:border-t-0 tw:bg-transparent`

          return withModal && activeTab === tabId ? (
            <button
              key={tabId}
              role="tab"
              className={btnClasses}
              onClick={() =>
                setModal(
                  <ModalWrapper
                    flex="col"
                    justify="top tw:lg:justify-center"
                    slideFrom="right"
                    fullWidth
                  >
                    {childrenWithTabSetter}
                  </ModalWrapper>
                )
              }
            >
              <span className="tw:pr-2">{title}</span>
              <KioskIcon className="tw:w-6 tw:h-6 hover:tw:tw:text-secondary" />
            </button>
          ) : (
            <button key={tabId} className={btnClasses} onClick={() => setActiveTab(tabId)}>
              {title}
            </button>
          )
        })}
      </div>
      <div className="tw:p-4 tw:pb-2">{childrenWithTabSetter}</div>
    </div>
  )
}

/**
 * A component to render an individual Tab inside Tabs.
 *
 * You should not use this component directly, or pass any props to it apart from children.
 * Instead, use them as direct children in the Tabs component.
 *
 * @component
 * @param {object} props - All component props
 * @param {number} props.activeTab - The id/index of the active tab (do not set this manually)
 * @param {number} props.tabId - The id/index of this tab (do not set this manually)
 * @param {JSX.Element} props.children - The component children, will be rendered if props.js is not set
 * @returns {JSX.Element}
 */
export const Tab = ({ children, tabId, activeTab }) => (activeTab === tabId ? children : null)
