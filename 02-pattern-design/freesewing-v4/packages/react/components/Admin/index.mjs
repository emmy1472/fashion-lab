// Dependencies
import { userAvatarUrl } from '@freesewing/utils'
// Hooks
import React, { useState, useContext } from 'react'
import { useAccount } from '@freesewing/react/hooks/useAccount'
import { useBackend } from '@freesewing/react/hooks/useBackend'
// Context
import { LoadingStatusContext } from '@freesewing/react/context/LoadingStatus'
import { ModalContext } from '@freesewing/react/context/Modal'
// Components
import { Spinner } from '@freesewing/react/components/Spinner'
//import { Hits } from 'shared/components/admin.mjs'
import { Link as WebLink } from '@freesewing/react/components/Link'
import { SearchIcon } from '@freesewing/react/components/Icon'
import { KeyVal } from '@freesewing/react/components/KeyVal'
import { ModalWrapper } from '@freesewing/react/components/Modal'
import { AccountStatus, UserRole } from '@freesewing/react/components/Account'

/**
 * A component to manage FreeSewing newsletter subscribers (requires admin role)
 *
 * @component
 * @returns {JSX.Element}
 */
export const SubscriberAdministration = () => {
  const [subscribers, setSubscribers] = useState()
  const [q, setQ] = useState()
  const [hits, setHits] = useState([])
  const backend = useBackend()

  const loadSubscribers = async () => {
    const [status, body] = await backend.adminLoadSubscribers()
    if (status === 200 && body.subscribers) setSubscribers(body.subscribers)
  }

  const search = async () => {
    if (!subscribers) await loadSubscribers()
    const found = []
    for (const lang in subscribers) {
      found.push(
        ...subscribers[lang]
          .filter((sub) => sub.email.toLowerCase().includes(q.toLowerCase()))
          .map((sub) => ({ ...sub, lang }))
      )
    }
    setHits(found)
  }

  const unsubscribe = async (ehash) => {
    await backend.newsletterUnsubscribe(ehash)
    await loadSubscribers()
    await search()
  }

  return (
    <>
      {subscribers ? (
        <>
          <h5>Search subscribers</h5>
          <div className="tw:flex tw:flex-row tw:gap-2 tw:items-center">
            <input
              autoFocus
              value={q}
              onChange={(evt) => setQ(evt.target.value)}
              className="tw:daisy-input tw:w-full tw:daisy-input-bordered tw:flex tw:flex-row"
              type="text"
              placeholder="Username, ID, or E-mail address"
            />
            <button onClick={search} className="tw:daisy-btn tw:daisy-btn-primary">
              <SearchIcon />
            </button>
          </div>
          <table className="tw:table tw:my-4">
            <thead>
              <tr>
                <th className="tw:text-right">Email</th>
                <th className="tw:w-12">Language</th>
                <th>Unsubscribe</th>
              </tr>
            </thead>
            <tbody>
              {hits.map((hit, i) => (
                <tr key={i}>
                  <td className="tw:text-right">
                    <b>{hit.email}</b>
                  </td>
                  <td className="tw:w-12">{hit.lang.toUpperCase()}</td>
                  <td className="tw:w-full">
                    <button
                      className="tw:daisy-btn tw:daisy-btn-link"
                      onClick={() => unsubscribe(hit.ehash)}
                    >
                      Unsubscribe
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <button
          className="tw:daisy-btn tw:daisy-btn-primary tw:daisy-btn-lg"
          onClick={loadSubscribers}
        >
          Load Subscribers
        </button>
      )}
    </>
  )
}

/**
 * A component to manage FreeSewing users (requires the admin role)
 *
 * @component
 * @param {object} props - All component props
 * @param {React.Component} props.Link - A framework specific Link component for client-side routing
 * @returns {JSX.Element}
 */
export const UserAdministration = ({ Link = false }) => {
  const backend = useBackend()

  const [q, setQ] = useState('')
  const [results, setResults] = useState()
  const [loading, setLoading] = useState(false)

  const search = async () => {
    /*
     * Search backend
     */
    setLoading(true)
    const [status, body] = await backend.adminSearchUsers(q)
    if (status === 200 && body.result === 'success' && body.users) {
      setResults(body.users)
    }
    setLoading(false)
  }

  return (
    <>
      <div className="tw:flex tw:flex-row tw:gap-8 tw:items-start tw:w-full">
        <div className="tw:grow">
          <h5>Search users</h5>
          <div className="tw:flex tw:flex-row tw:gap-2 tw:items-center">
            <input
              autoFocus
              value={q}
              onChange={(evt) => setQ(evt.target.value)}
              className="tw:daisy-input tw:w-full tw:daisy-input-bordered tw:flex tw:flex-row"
              type="text"
              placeholder="Username, ID, or E-mail address"
            />
            <button
              onClick={search}
              className="tw:daisy-btn tw:daisy-btn-primary"
              disabled={q.length < 3}
            >
              <SearchIcon />
            </button>
          </div>
          {loading ? <Spinner /> : <Hits {...{ backend, results, Link }} />}
        </div>
      </div>
    </>
  )
}

const Hits = ({ results, Link = false }) => {
  if (!Link) Link = WebLink

  return (
    <>
      {results && results.username && results.username.length > 0 && (
        <>
          <h2>Results based on username</h2>
          {results.username.map((user) => (
            <User user={user} key={user.id} Link={Link} />
          ))}
        </>
      )}
      {results && results.email && results.email.length > 0 && (
        <>
          <h2>Results based on E-mail address</h2>
          {results.email.map((user) => (
            <User user={user} key={user.id} Link={Link} />
          ))}
        </>
      )}
    </>
  )
}

const User = ({ user, Link }) => {
  const { setModal } = useContext(ModalContext)
  const { setLoadingStatus } = useContext(LoadingStatusContext)
  const backend = useBackend()

  /*
   * We had a bug with the signUp flow where consent was
   * not set. Users cannot get out of this, so this allows
   * admins to grant consent on their behalf.
   */
  const setConsent = async () => {
    setLoadingStatus([true, 'Contacting backend'])
    const [status, body] = await backend.adminUpdateUser({ id: user.id, data: { consent: 2 } })
    if (status === 200 && body.result === 'success') {
      setLoadingStatus([true, 'Consent updated', true, true])
    } else setLoadingStatus([true, 'An error occured', true, false])
  }

  /*
   * Unfreeze accounts for those users who froze themselves
   */
  const unfreezeAccount = async () => {
    setLoadingStatus([true, 'Contacting backend'])
    const [status, body] = await backend.adminUpdateUser({ id: user.id, data: { status: 1 } })
    if (status === 200 && body.result === 'success') {
      setLoadingStatus([true, 'Status updated', true, true])
    } else setLoadingStatus([true, 'An error occured', true, false])
  }

  /*
   * Disable MFA for users who locked themselves out
   */
  const disableMfa = async () => {
    setLoadingStatus([true, 'Contacting backend'])
    const [status, body] = await backend.adminUpdateUser({
      id: user.id,
      data: { mfaEnabled: false },
    })
    if (status === 200 && body.result === 'success') {
      setLoadingStatus([true, 'MFA disabled', true, true])
    } else setLoadingStatus([true, 'An error occured', true, false])
  }

  return (
    <div className="tw:flex tw:flex-row tw:w-full tw:gap-4 tw:my-2">
      <button
        className="tw:w-24 tw:h-24 tw:bg-base-100 tw:rounded-lg tw:shadow tw:shrink-0"
        onClick={() =>
          setModal(
            <ModalWrapper>
              <img src={userAvatarUrl({ ihash: user.ihash, variant: 'public' })} />
            </ModalWrapper>
          )
        }
        style={{
          backgroundImage: `url(${userAvatarUrl({ ihash: user.ihash, variant: 'sq500' })})`,
          backgroundSize: 'cover',
          backgroundColor: '#ccc',
        }}
      ></button>
      <div className="tw:w-full tw:flex tw:flex-col tw:gap-1">
        <div className="tw:w-full tw:flex tw:flex-row tw:flex-wrap tw:gap-1">
          <Link href={`/users/?id=${user.id}`}>{user.username}</Link>
          <KeyVal k="id" val={user.id} />
        </div>
        <div className="tw:w-full tw:flex tw:flex-row tw:flex-wrap tw:gap-1">
          <UserRole role={user.role} />
          <AccountStatus status={user.status} />
        </div>
        <div className="tw:w-full tw:flex tw:flex-row tw:flex-wrap tw:gap-1">
          <button
            className="tw:daisy-btn tw:daisy-btn-primary tw:daisy-btn-sm tw:daisy-btn-outline"
            onClick={() =>
              setModal(
                <ModalWrapper>
                  <pre>{JSON.stringify(user, null, 2)}</pre>
                </ModalWrapper>
              )
            }
          >
            Details
          </button>
          <ImpersonateButton userId={user.id} />
          {user.mfaEnabled ? (
            <button
              className="tw:daisy-btn tw:daisy-btn-warning tw:daisy-btn-sm"
              onClick={disableMfa}
            >
              Disable MFA
            </button>
          ) : null}

          {user.consent < 1 ? (
            <button
              className="tw:daisy-btn tw:daisy-btn-warning tw:daisy-btn-sm"
              onClick={setConsent}
            >
              Grant Consent
            </button>
          ) : null}

          {user.status === -1 ? (
            <button
              className="tw:daisy-btn tw:daisy-btn-warning tw:daisy-btn-sm"
              onClick={unfreezeAccount}
            >
              Unfreeze Account
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

const ImpersonateButton = ({ userId }) => {
  const backend = useBackend()
  const { setLoadingStatus } = useContext(LoadingStatusContext)
  const { impersonate } = useAccount()

  if (!userId) return null

  const impersonateUser = async () => {
    setLoadingStatus([true, 'Contacting backend'])
    const [status, body] = await backend.adminImpersonateUser(userId)
    if (status === 200 && body.result === 'success') {
      impersonate(body)
      setLoadingStatus([true, 'Now impersonating', true, true])
    } else setLoadingStatus([true, 'An error occured', true, false])
  }

  return (
    <button
      className="tw:daisy-btn tw:daisy-btn-primary tw:daisy-btn-sm tw:daisy-btn-outline"
      onClick={impersonateUser}
    >
      Impersonate
    </button>
  )
}
