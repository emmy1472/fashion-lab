// React needs to be in scope for JSX in Docusaurus
import React from 'react'

/*
 * Because of the CSS reset by Tailwind and other interactions
 * between Docusaurus, TailwindCSS, and DaisyUI, some 'prose'
 * tags (simple things like p, ul, ol, and so on) are not
 * properly styled.
 *
 * These are MDX components to fix that.
 * They are not intended to be used elsewhere but in MDX.
 */

export const prose = {
  ul: (props) => <ul className="tw:list tw:list-inside tw:list-disc tw:ml-2">{props.children}</ul>,
  ol: (props) => (
    <ul className="tw:list tw:list-inside tw:list-decimal tw:ml-2">{props.children}</ul>
  ),
}
