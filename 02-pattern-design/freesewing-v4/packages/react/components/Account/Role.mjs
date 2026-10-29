import React from 'react'
import { KeyVal } from '@freesewing/react/components/KeyVal'

/**
 * A component to display the user's role
 *
 * @component
 * @param {object} props - All component props
 * @param {string} props.role - The user role, either user or admin
 * @returns {JSX.Element}
 */
export const UserRole = ({ role }) => {
  if (role === 'user') return <RoleUser />
  if (role === 'admin') return <RoleAdmin />

  return <b>fixme</b>
}

const RoleUser = () => <KeyVal k="role" val="user" color="success" />
const RoleAdmin = () => <KeyVal k="role" val="admin" color="error" />
