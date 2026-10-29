import React from 'react'
import { Popout } from '@freesewing/react/components/Popout'

const types = [ 'comment', 'error', 'fixme', 'link', 'note', 'related', 'tip', 'warning' ]

export const PopoutExample = () => (
  <>
    {types.map(type => <Popout key={type} type={type}>This is a {type}</Popout>)}
    {types.map(type => <Popout key={type} type={type} title="Custom title here">This is a {type} with a custom title</Popout>)}
    {types.map(type => <Popout key={type} type={type} compact>This is a compact {type}</Popout>)}
    {types.map(type => <Popout key={type} type={type} title="Custom title here" compact>This is a compact {type} with a custom title</Popout>)}
    {types.map(type => <Popout key={type} type={type} compact dense>This is a compact & dense {type}</Popout>)}
    <Popout type="comment" by="Joost">This is a comment with a <code>by</code> prop to indicate the author</Popout>
    <Popout type="comment" by="Joost" compact>This is a compact comment with a <code>by</code> prop to indicate the author</Popout>
    <Popout type="comment" by="Joost" compact dense>This is a compact & dense comment with a <code>by</code> prop to indicate the author</Popout>
    <Popout type="tip" hideable>This is a <code>hideable</code> tip</Popout>
  </>
)
