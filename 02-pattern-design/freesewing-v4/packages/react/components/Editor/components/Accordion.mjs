import React, { useState } from 'react'

/*
 * DaisyUI's accordion seems rather unreliable.
 * So instead, we handle this in React state
 */
const getProps = () => ({
  className: `tw:p-0 tw:rounded-lg tw:bg-transparent tw:hover:cursor-pointer
    tw:w-full tw:h-auto tw:content-start tw:text-left tw:list-none`,
})

const getSubProps = () => ({
  className: `tw:p-0 tw:rounded-none tw:bg-transparent tw:w-full tw:h-auto
  tw:content-start tw:text-left tw:list-none`,
})

const components = {
  button: (props) => (
    <li role="button" {...props}>
      {props.children}
    </li>
  ),
  div: (props) => <div {...props}>{props.children}</div>,
}

export const BaseAccordion = ({
  items, // Items in the accordion
  act, // Allows one to preset the active (opened) entry
  propsGetter = getProps, // Method to get the relevant props
  component = 'button',
}) => {
  const [active, setActive] = useState(act)
  const Component = components[component]

  return (
    <>
      {items
        .filter((item) => item[0])
        .map((item, i) =>
          active === item[2] ? (
            <li key={i} {...propsGetter(true)}>
              <div className="tw:flex tw:flex-col tw:w-full tw:active:bg-transparent tw:hover:bg-transparent tw:p-0 tw:m-0">
                <Component
                  onClick={setActive}
                  className="tw:w-full tw:bg-transparent tw:border-0 tw:hover:cursor-pointer tw:active:bg-transparent"
                >
                  {item[0]}
                </Component>
                <div className="tw:pl-4 tw:p-2 tw:flex tw:flex-col tw:flex-nowrap tw:w-full">
                  {item[1]}
                </div>
              </div>
            </li>
          ) : (
            <Component
              key={i}
              {...propsGetter(active === item[2])}
              onClick={() => setActive(item[2])}
            >
              {item[0]}
            </Component>
          )
        )}
    </>
  )
}

export const SubAccordion = (props) => <BaseAccordion {...props} propsGetter={getSubProps} />
export const Accordion = (props) => <BaseAccordion {...props} propsGetter={getProps} />
