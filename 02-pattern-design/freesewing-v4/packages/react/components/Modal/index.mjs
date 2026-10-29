import React, { useState, useEffect, useContext } from 'react'
import { ModalContext } from '@freesewing/react/context/Modal'
import { CloseIcon } from '@freesewing/react/components/Icon'

const slideClasses = {
  left: 'tw:-translate-x-full',
  right: 'tw:translate-x-full',
  top: 'tw:-translate-y-full',
  bottom: 'tw:translate-y-full',
}

/**
 * This component wraps modal content, making sure the layout is ok and handling transitions
 *
 * @component
 * @param {object} props - All component props
 * @param {JSX.Element} props.children - The component children, will be rendered inside the mini tip
 * @param {string} [props.flex = row] - Flexbox direction (row or col)
 * @param {string} [props.justify = center] - Flexbox justify value
 * @param {string} [props.items = center] - Flexbox items value
 * @param {string} [props.bg = neutral] - Background color (one of the DaisyUI named colors)
 * @param {string} [props.bgOpacity = 70] - Background opacity
 * @param {bool} [props.bare = false] - Set true to not handle layout within the wrapper
 * @param {bool} [keepOpenOnClick = false] - Set to true to prevent a click in the modal content from closing the modal
 * @param {string} [slideFrom = left] - Direction to slide in from on mobile
 * @param {bool} [fullWidth = false] - Set to true to not constrain the width
 * @param {bool} [wide = false] - Set to true to not set a wide max width
 * @returns {JSX.Element}
 */
export const ModalWrapper = ({
  children = null,
  flex = 'row',
  justify = 'center',
  items = 'center',
  bg = 'neutral',
  bgOpacity = '70',
  bare = false,
  keepOpenOnClick = false,
  slideFrom = 'left',
  fullWidth = false,
  wide = false,
}) => {
  const { clearModal } = useContext(ModalContext)
  const [animate, setAnimate] = useState('in')

  const close = (evt) => {
    // Only process the first event
    if (evt?.event) evt.event.stopPropagation()
    setAnimate('out')
    window.setTimeout(clearModal, 150)
  }

  useEffect(() => {
    // only turn off animation if it's animating in
    if (animate === 'in') setAnimate(false)
  }, [animate])

  // CSS classes for animation
  const animation = animate
    ? `tw:lg:opacity-0 ${slideClasses[slideFrom]} tw:lg:translate-x-0 tw:lg:translate-y-0`
    : 'tw:opacity-100 tw:translate-none'

  const stopClick = (evt) => {
    /*
     * Do not keep modal open for links (with a href)
     * but do keep it open for buttons (like a new modal context)
     */
    if (!evt.target.attributes.href) evt.stopPropagation()
  }

  return (
    <div
      className={`tw:fixed tw:top-0 tw:left-0 tw:m-0 tw:p-0 tw:shadow tw:w-full tw:h-screen
        tw:transform-all tw:duration-150 ${animation}
        tw:bg-${bg}/${bgOpacity} tw:hover:cursor-pointer
        tw:flex tw:flex-${flex} tw:justify-${justify} tw:items-${items} tw:lg:p-12 tw:backdrop-blur-md`}
      onClick={close}
      style={{ zIndex: 250 }}
    >
      {bare ? (
        children
      ) : (
        <div
          onClick={keepOpenOnClick ? stopClick : null}
          className={`tw:z-30 tw:bg-base-100 tw:p-4 tw:lg:px-8 tw:lg:rounded-lg tw:lg:shadow-lg tw:max-h-full tw:overflow-auto tw:hover:cursor-default ${
            fullWidth ? 'tw:w-full' : ''
          } ${wide ? 'tw:max-w-5xl tw:w-full' : ''} `}
        >
          {children}
          <button
            className="tw:fixed tw:bottom-2 tw:right-2 tw:daisy-btn tw:daisy-btn-neutral tw:daisy-btn-circle tw:lg:hidden"
            onClick={close}
          >
            <CloseIcon className="tw:w-8 tw:h-8" />
          </button>
        </div>
      )}
    </div>
  )
}
