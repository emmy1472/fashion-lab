// Hooks
import { useAccount } from '@freesewing/react/hooks/useAccount'

/**
 * A component to display the current user's ID
 *
 * @component
 * @param {object} props - All component props
 * @returns {JSX.Element}
 */
export const UserId = () => {
  // Hooks
  const { account } = useAccount()

  return account.id || null
}
