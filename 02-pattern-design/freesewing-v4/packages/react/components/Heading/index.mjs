import React from 'react'

/**
 * A component to renderd a styled H1 tag.
 *
 * Because of the TailwindCSS reset, common tags are unstyled.
 * When you need to render a H1 tag outside of a context where it is
 * automatically styled (such as inside markdown) you can use this.
 * Alternatively, you can wrap your content in div.prose which will apply the
 * styles in CSS.
 *
 * @component
 * @param {object} props - All component props
 * @param {JSX.element} props.children - The component children
 * @returns {JSX.Element}
 */
export const H1 = ({ children }) => (
  <h1 className="tw:text-5xl tw:pt-5 tw:pb-4 tw:font-thin tw:tracking-tighter tw:lg:text-6xl">
    {children}
  </h1>
)

/**
 * A component to renderd a styled H2 tag.
 *
 * Because of the TailwindCSS reset, common tags are unstyled.
 * When you need to render a H2 tag outside of a context where it is
 * automatically styled (such as inside markdown) you can use this.
 * Alternatively, you can wrap your content in div.prose which will apply the
 * styles in CSS.
 *
 * @component
 * @param {object} props - All component props
 * @param {JSX.element} props.children - The component children
 * @returns {JSX.Element}
 */
export const H2 = ({ children }) => (
  <h2 className="tw:text-3xl tw:pt-4 tw:pb-3 tw:font-black tw:tracking-tighter tw:m-0 tw:lg:text-4xl">
    {children}
  </h2>
)

/**
 * A component to renderd a styled H3 tag.
 *
 * Because of the TailwindCSS reset, common tags are unstyled.
 * When you need to render a H3 tag outside of a context where it is
 * automatically styled (such as inside markdown) you can use this.
 * Alternatively, you can wrap your content in div.prose which will apply the
 * styles in CSS.
 *
 * @component
 * @param {object} props - All component props
 * @param {JSX.element} props.children - The component children
 * @returns {JSX.Element}
 */
export const H3 = ({ children }) => (
  <h3 className="tw:text-2xl tw:pt-3 tw:pb-2 tw:font-extrabold tw:m-0 tw:tracking-tighter tw:lg:text-3xl">
    {children}
  </h3>
)

/**
 * A component to renderd a styled H4 tag.
 *
 * Because of the TailwindCSS reset, common tags are unstyled.
 * When you need to render a H4 tag outside of a context where it is
 * automatically styled (such as inside markdown) you can use this.
 * Alternatively, you can wrap your content in div.prose which will apply the
 * styles in CSS.
 *
 * @component
 * @param {object} props - All component props
 * @param {JSX.element} props.children - The component children
 * @returns {JSX.Element}
 */
export const H4 = ({ children }) => (
  <h4 className="tw:text-xl tw:pt-2 tw:pb-1 tw:font-bold tw:m-0 tw:tracking-tighter tw:lg:text-2xl">
    {children}
  </h4>
)

/**
 * A component to renderd a styled H5 tag.
 *
 * Because of the TailwindCSS reset, common tags are unstyled.
 * When you need to render a H5 tag outside of a context where it is
 * automatically styled (such as inside markdown) you can use this.
 * Alternatively, you can wrap your content in div.prose which will apply the
 * styles in CSS.
 *
 * @component
 * @param {object} props - All component props
 * @param {JSX.element} props.children - The component children
 * @returns {JSX.Element}
 */
export const H5 = ({ children }) => (
  <h5 className="tw:text-lg tw:py-1 tw:font-semibold tw:m-0 tw:tracking-tight tw:lg:text-xl">
    {children}
  </h5>
)

/**
 * A component to renderd a styled H6 tag.
 *
 * Because of the TailwindCSS reset, common tags are unstyled.
 * When you need to render a H6 tag outside of a context where it is
 * automatically styled (such as inside markdown) you can use this.
 * Alternatively, you can wrap your content in div.prose which will apply the
 * styles in CSS.
 *
 * @component
 * @param {object} props - All component props
 * @param {JSX.element} props.children - The component children
 * @returns {JSX.Element}
 */
export const H6 = ({ children }) => (
  <h6 className="tw:text-base tw:py-1 tw:font-medium tw:italic tw:m-0 tw:tracking-tight tw:lg:text-lg">
    {children}
  </h6>
)
