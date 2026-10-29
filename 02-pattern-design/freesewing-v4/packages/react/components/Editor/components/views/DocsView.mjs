// Dependencies
import { linkClasses } from '@freesewing/utils'
// Context
import { ModalContext } from '@freesewing/react/context/Modal'
// Hooks
import React, { useContext } from 'react'
// Components
import { H1, H2 } from '@freesewing/react/components/Heading'
import { modalDocsHelp } from '@freesewing/react/components/Help'
import { HeaderMenu } from '../HeaderMenu.mjs'
import { Popout } from '@freesewing/react/components/Popout'

/**
 * This is the docs view, it just shows content
 *
 * @param {Object} props - All the props
 * @param {Function} props.config - The editor configuration
 * @param {Object} props.state - The editor state object
 * @param {Object} props.update - Helper object for updating the editor state
 */
export const DocsView = ({ state, config, update }) => {
  const { setModal, modalContent } = useContext(ModalContext)

  return (
    <>
      <HeaderMenu state={state} {...{ config, update }} />
      <div className="tw:m-auto tw:mt-8 tw:max-w-2xl tw:px-4 tw:mb-8">
        <H1>Documentation</H1>
        {state?.design ? (
          <>
            <H2>Design Documentation</H2>
            <Popout type="link" compact dense>
              <div className="tw:font-bold tw:py-1">
                <a
                  className={linkClasses}
                  href={`https://freesewing.eu/docs/designs/${state.design}`}
                >{`FreeSewing.eu/docs/designs/${state.design}`}</a>
              </div>
            </Popout>
            <button
              className="tw:daisy-btn tw:daisy-btn-secondary tw:daisy-btn-outline tw:mt-4"
              onClick={() => modalDocsHelp(`docs/designs/${state.design}`, setModal)}
            >
              Open without leaving the Editor
            </button>
          </>
        ) : null}
        <H2>Editor Documentation</H2>
        <Popout type="link" compact dense>
          <div className="tw:font-bold tw:py-1">
            <a
              className={linkClasses}
              href="https://freesewing.eu/docs/editor"
            >{`FreeSewing.eu/docs/editor`}</a>
          </div>
        </Popout>
        <button
          className="tw:daisy-btn tw:daisy-btn-secondary tw:daisy-btn-outline tw:mt-4"
          onClick={() => modalDocsHelp(`docs/editor`, setModal)}
        >
          Open without leaving the Editor
        </button>
        <H2>Developer Documentation</H2>
        <Popout type="link" compact>
          <b>
            <a className={linkClasses} href="https://freesewing.dev/">{`FreeSewing.dev`}</a>
          </b>
        </Popout>
      </div>
      {modalContent}
    </>
  )
}
