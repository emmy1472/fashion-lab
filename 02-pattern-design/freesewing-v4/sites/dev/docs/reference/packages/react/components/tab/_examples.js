import React from 'react'
import { Tab, Tabs } from '@freesewing/react/components/Tab'
import { MiniNote } from '@freesewing/react/components/Mini'

export const TabExample = () => <MiniNote>Do not use a Tab component on its own, but only as direct children of a Tabs component.</MiniNote>
export const TabsExample = () => (
  <Tabs tabs="Apple, Banana, Coconut">
    <Tab>Apple tab</Tab>
    <Tab>Banana tab</Tab>
    <Tab>Coconut tab</Tab>
  </Tabs>
)
