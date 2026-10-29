import React, { useContext } from 'react'
import { ModalContext } from '@freesewing/react/context/Modal'
import { ModalWrapper } from '@freesewing/react/components/Modal'
import { MiniTip } from '@freesewing/react/components/Mini'

export const ModalWrapperExample = () => {
  const { setModal, clearModal } = useContext(ModalContext)

  return (
    <div className="tw:flex tw:flex-row tw:gap-2 tw:flex-wrap">
      <button
        className="tw:daisy-btn tw:daisy-btn-primary"
        onClick={() => setModal(<ModalWrapper><Content /></ModalWrapper>)}
      >default props</button>
      <button
        className="tw:daisy-btn tw:daisy-btn-primary"
        onClick={() => setModal(<ModalWrapper justify='end'><Content /></ModalWrapper>)}
      >justify = end</button>
      <button
        className="tw:daisy-btn tw:daisy-btn-primary"
        onClick={() => setModal(<ModalWrapper items='end'><Content /></ModalWrapper>)}
      >items = end</button>
      <button
        className="tw:daisy-btn tw:daisy-btn-primary"
        onClick={() => setModal(<ModalWrapper bg='warning'><Content /></ModalWrapper>)}
      >bg = warning</button>
      <button
        className="tw:daisy-btn tw:daisy-btn-primary"
        onClick={() => setModal(<ModalWrapper bgOpacity={25}><Content /></ModalWrapper>)}
      >bgOpacity = 25</button>
      <button
        className="tw:daisy-btn tw:daisy-btn-primary"
        onClick={() => setModal(<ModalWrapper bare><Content /></ModalWrapper>)}
      >bare</button>
      <button
        className="tw:daisy-btn tw:daisy-btn-primary"
        onClick={() => setModal(<ModalWrapper bare flex="col"><Content /></ModalWrapper>)}
      >bare & flex = col</button>
      <button
        className="tw:daisy-btn tw:daisy-btn-primary"
        onClick={() => setModal(<ModalWrapper fullWidth><Content /></ModalWrapper>)}
      >fullWidth</button>
      <button
        className="tw:daisy-btn tw:daisy-btn-primary"
        onClick={() => setModal(<ModalWrapper keepOpenOnClick>
          <Content />
          <MiniTip>Click outside the modal content to close this.</MiniTip>
        </ModalWrapper>)}
      >keepOpenOnClick</button>
      <button
        className="tw:daisy-btn tw:daisy-btn-primary"
        onClick={() => setModal(<ModalWrapper slideFrom="bottom"><Content /></ModalWrapper>)}
      >slideFrom = bottom (mobile only)</button>
    </div>
  )
}

const Content = () => (
  <>
    <div>
      <h4>Title 1</h4>
      <p>Some modal content here</p>
    </div>
    <div>
      <h4>Title 2</h4>
      <p>Some modal content here</p>
    </div>
    <div>
      <h4>Title 3</h4>
      <p>Some modal content here</p>
    </div>
  </>
)
