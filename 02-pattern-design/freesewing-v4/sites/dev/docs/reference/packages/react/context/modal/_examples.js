import React, { useContext } from 'react'
import { ModalContext } from '@freesewing/react/context/Modal'
import { ModalWrapper } from '@freesewing/react/components/Modal'

export const ModalExamples = () => {
  const { setModal, clearModal } = useContext(ModalContext)

  return (
    <div className="tw:flex tw:flex-row tw:flex-wrap tw:items-center tw:gap-2">
      <button
        onClick={() => setModal(<ModalWrapper><h1>Hello, I am modal</h1></ModalWrapper>)}
        className="tw:daisy-btn tw:daisy-btn-primary"
      >Show Example</button>
    </div>
  )
}
