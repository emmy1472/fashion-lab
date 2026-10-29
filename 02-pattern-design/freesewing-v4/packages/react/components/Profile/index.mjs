// Dependencies
import { cloudflareImageUrl, getSearchParam } from '@freesewing/utils'
// Context
import { ModalContext } from '@freesewing/react/context/Modal'
// Hooks
import React, { useState, useEffect, useContext } from 'react'
import { useAccount } from '@freesewing/react/hooks/useAccount'
import { useBackend } from '@freesewing/react/hooks/useBackend'
// Components
import { ModalWrapper } from '@freesewing/react/components/Modal'
import { Link as WebLink } from '@freesewing/react/components/Link'
import { MiniWarning } from '@freesewing/react/components/Mini'
import { KeyVal } from '@freesewing/react/components/KeyVal'
import Markdown from 'react-markdown'

/**
 * A component for to display the current user's profile.
 *
 * @component
 * @param {object} props - All component props
 * @param {React.FC} [props.Link = false] - An optional framework-specific Link component
 * @param {function} [props.setTitle = false] - An optional method to set the page title
 * @returns {JSX.Element}
 */
export const OwnProfile = (props) => {
  const { account } = useAccount()

  return <UserProfile {...props} uid={account.id} />
}

/**
 * A component for to display a user profile. Either props.uid or props.fromUrl should be set.
 *
 * @component
 * @param {object} props - All component props
 * @param {boolean} [props.fromUrl = false] - Set this to the nbame of the search parameters in the URL to extract the UID from
 * @param {React.FC} [props.Link = false] - An optional framework-specific Link component
 * @param {function} [props.setTitle = false] - An optional method to set the page title
 * @param {number} [props.uid = false] - The user ID for which to show the profile
 * @returns {JSX.Element}
 */
export const UserProfile = ({ Link = false, setTitle = false, uid = false, fromUrl = false }) => {
  if (!uid && !fromUrl)
    return (
      <MiniWarning>
        You must provide either a <code>uid</code> or <code>fromUrl</code> prop
      </MiniWarning>
    )
  if (!Link) Link = WebLink

  const [ruid, setRuid] = useState()

  // Hooks
  const backend = useBackend()

  // State
  const [data, setData] = useState(false)

  // Effect
  useEffect(() => {
    if (uid && uid !== ruid) setRuid(uid)
    if (fromUrl) {
      const urlId = getSearchParam(fromUrl)
      if (urlId && urlId !== ruid) setRuid(urlId)
    }
    if (ruid) loadProfileData(ruid, backend, setData, setTitle)
  }, [uid, fromUrl, ruid])

  return (
    <>
      <div className="tw:w-full tw:flex tw:flex-row tw:flex-wrap tw:items-center tw:gap-4">
        <Avatar ihash={data.ihash} />
        <div className="tw:flex tw:flex-col tw:items-start tw:gap-1">
          <h2>{data.username}</h2>
          <KeyVal k="role" val={data.role} />
        </div>
      </div>
      <div className="tw:my-4 tw:border-l-4 tw:pl-2">
        <b>Permalink: </b>
        <Link href={`/users?id=${ruid}`}>{`freesewing.eu/users?id=${ruid}`}</Link>
      </div>
      <Markdown>{data.bio}</Markdown>
    </>
  )
}

/**
 * A component to render an avatar image
 *
 * @component
 * @param {string} ihash - The ihash of the account
 * @returns {JSX.Element}
 */
export const Avatar = ({ ihash }) => {
  const { setModal } = useContext(ModalContext)

  return (
    <button
      onClick={() =>
        setModal(
          <ModalWrapper>
            <img
              src={cloudflareImageUrl({ id: `uid-${ihash}`, variant: 'public' })}
              className="tw:max-w-full tw:max-h-screen"
            />
          </ModalWrapper>
        )
      }
    >
      <img
        src={cloudflareImageUrl({ id: `uid-${ihash}`, variant: 'sq500' })}
        className="tw:w-32 tw:h-32 tw:rounded-full tw:shadow tw:border-current tw:border-4"
      />
    </button>
  )
}

async function loadProfileData(uid, backend, setData, setTitle = false) {
  const [status, body] = await backend.getUserProfile(uid)
  if (status === 200 && body.result === 'success' && body.profile) {
    setData(body.profile)
    if (typeof setTitle === 'function' && body.profile.username) setTitle(body.profile.username)
  }
}
