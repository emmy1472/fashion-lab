import React from 'react'

export const Tooltip = (props) => {
  const { children, tip, ...rest } = props

  return (
    <div
      {...rest}
      className={`tw:daisy-tooltip tw:daisy-tooltip-bottom tw:before:bg-base-200 tw:before:shadow tw:before:text-base-content`}
      data-tip={tip}
    >
      {children}
    </div>
  )
}
