import React from 'react'
import { RoleBlock, UserVisitorContent } from '@freesewing/react/components/Role'

export const RoleBlockExample = () => (
  <RoleBlock role="admin">
    <p>Wow, you are an admin! This content is admin-only.</p>
  </RoleBlock>
)

export const UserVisitorContentExample = () => (
  <UserVisitorContent
    userContent={<p>You are a user. This content is only for users.</p>}
    visitorContent={<p>You are a visitor. This content is only for visitors.</p>}
  />
)
