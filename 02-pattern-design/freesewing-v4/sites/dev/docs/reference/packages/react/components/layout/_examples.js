import React from 'react'
import { Markdown } from '@freesewing/react/components/Markdown'
import {
  Layout,
  BaseLayout,
  BaseLayoutLeft,
  BaseLayoutRight,
  BaseLayoutProse,
  BaseLayoutWide,
  NoTitleLayout
} from '@freesewing/react/components/Layout'

export const LayoutExample = () => (
  <Layout description="This is the description" title="This is the title">
    <Content />
  </Layout>
)

export const BaseLayoutExample = () => <BaseLayout><Content /></BaseLayout>
export const BaseLayoutLeftExample = () => <BaseLayoutLeft><Content /></BaseLayoutLeft>
export const BaseLayoutRightExample = () => <BaseLayoutRight><Content /></BaseLayoutRight>
export const BaseLayoutProseExample = () => <BaseLayoutProse><Content /></BaseLayoutProse>
export const BaseLayoutWideExample = () => <BaseLayoutWide><Content /></BaseLayoutWide>
export const NoTitleLayoutExample = () => <NoTitleLayout><Content /></NoTitleLayout>



const Content = () => <Markdown>{md}</Markdown>

const md = `
This is \`props.children\`.

## Some more content

Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
`
