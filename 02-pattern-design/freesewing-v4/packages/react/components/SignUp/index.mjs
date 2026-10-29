// Dependencies
import { validateEmail, validateTld, getSearchParam } from '@freesewing/utils'

// Hooks
import React, { useState, useContext, useEffect } from 'react'
import { useBackend } from '@freesewing/react/hooks/useBackend'

// Context
import { LoadingStatusContext } from '@freesewing/react/context/LoadingStatus'
import { ModalContext } from '@freesewing/react/context/Modal'

// Components
import { Link } from '@freesewing/react/components/Link'
import { LeftIcon, HelpIcon, KeyIcon, EmailIcon } from '@freesewing/react/components/Icon'
import { ModalWrapper } from '@freesewing/react/components/Modal'
import { EmailInput } from '@freesewing/react/components/Input'
import { IconButton } from '@freesewing/react/components/Button'
import { Spinner } from '@freesewing/react/components/Spinner'
import { Consent } from '@freesewing/react/components/Account'
import { Popout } from '@freesewing/react/components/Popout'

/**
 * The SignUp component holds the entire sign-up form
 *
 * @component
 * @param {object} props - All component props
 * @param {boolean} [props.embed = false] - Set this tot rue to use a H2 level heading instead of H1 so the form can be embedded in an existing page
 * @returns {JSX.Element}
 */
export const SignUp = ({ embed = false }) => {
  // State
  const [email, setEmail] = useState('')
  const [emailValid, setEmailValid] = useState(false)
  const [result, setResult] = useState(false)

  // Hooks
  const backend = useBackend()

  // Context
  const { setModal } = useContext(ModalContext)
  const { setLoadingStatus } = useContext(LoadingStatusContext)

  const updateEmail = (value) => {
    setEmail(value)
    const valid = (validateEmail(value) && validateTld(value)) || false
    setEmailValid(valid === true ? true : false)
  }

  const signupHandler = async (evt) => {
    evt.preventDefault()
    if (!emailValid) {
      setLoadingStatus([true, 'Please provide a valid email address', true, false])
      return
    }
    const [status, body] = await backend.signUp({ email })
    if (status === 201 && body.result === 'created') setResult('success')
    else {
      setModal(
        <ModalWrapper bg="tw:base-100 tw:lg:bg-base-300">
          <div className="tw:bg-base-100 tw:rounded-lg tw:p-4 tw:lg:px-8 tw:max-w-xl tw:lg:shadow-lg">
            <h3>An error occured while trying to process your request</h3>
            <p className="tw:text-lg">
              Unfortunately, we cannot recover from this error, we need a human being to look into
              this.
            </p>
            <p className="tw:text-lg">
              Feel free to try again, or reach out to support so we can assist you.
            </p>
            <div className="tw:flex tw:flex-row tw:gap-4 tw:items-center tw:justify-center tw:p-8 tw:flex-wrap">
              <IconButton onClick={() => setResult(false)}>
                <LeftIcon />
                Back
              </IconButton>
              <IconButton href="/support" className="tw:daisy-btn-outline">
                <HelpIcon />
                Contact support
              </IconButton>
            </div>
          </div>
        </ModalWrapper>
      )
    }
  }

  const Heading = embed
    ? ({ children }) => <h2 className="tw:text-inherit">{children}</h2>
    : ({ children }) => <h1 className="tw:text-inherit">{children}</h1>

  return (
    <div className="tw:w-full">
      <Heading className="tw:text-inherit">
        {result ? (
          result === 'success' ? (
            <span>Now check your inbox</span>
          ) : (
            <span>An error occured while trying to process your request</span>
          )
        ) : (
          <span>Create a FreeSewing account</span>
        )}
      </Heading>

      {result ? (
        result === 'success' ? (
          <>
            <p className="tw:text-inherit tw:text-lg">
              Go check your inbox for an email from <b>FreeSewing.org</b>
            </p>
            <p className="tw:text-inherit tw:text-lg">
              Click your personal signup link in that email to create your FreeSewing account.
            </p>
            <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-2">
              <IconButton onClick={() => setResult(false)}>
                <LeftIcon />
                Back
              </IconButton>
              <IconButton href="/support" className="tw:daisy-btn-outline">
                <HelpIcon />
                Contact support
              </IconButton>
            </div>
          </>
        ) : (
          <>
            robot here
            <p className="tw:text-inherit tw:text-lg">
              Unfortunately, we cannot recover from this error, we need a human being to look into
              this.
            </p>
            <p className="tw:text-inherit tw:text-lg">
              Feel free to try again, or reach out to support so we can assist you.
            </p>
            <div className="tw:flex tw:flex-row tw:gap-4 tw:items-center tw:justify-center tw:p-8">
              <button className="tw:daisy-btn tw:daisy-btn-ghost" onClick={() => setResult(false)}>
                Back
              </button>
              <Link href="/support" className="tw:daisy-btn tw:daisy-btn-ghost">
                Contact support
              </Link>
            </div>
          </>
        )
      ) : (
        <>
          <fieldset className="tw:daisy-fieldset tw:border-base-300 tw:border tw:rounded-box tw:p-4 tw:mb-4">
            <legend className="tw:daisy-fieldset-legend">Sign up for FreeSewing</legend>
            <form onSubmit={signupHandler}>
              <EmailInput
                id="signup-email"
                label="Email address"
                current={email}
                original={''}
                valid={() => emailValid}
                placeholder="Email address"
                update={updateEmail}
              />
              <IconButton
                onClick={signupHandler}
                btnProps={{ type: 'submit' }}
                className="tw:lg:w-full tw:grow tw:mt-2"
              >
                <EmailIcon />
                Email me a sign-up link
              </IconButton>
            </form>
          </fieldset>
          <IconButton color="neutral" href="/signin" className="tw:daisy-btn-lg tw:mt-4">
            <span className="tw:hidden tw:md:block tw:text-neutral-content">
              <KeyIcon className="tw:h-8 tw:w-8" />
            </span>
            <span className="tw:text-neutral-content">Sign in here</span>
          </IconButton>
        </>
      )}
    </div>
  )
}

/**
 * A component to handle the confirmation URL for a passwordless signup link (aka magic link).
 *
 * @component
 * @param {object} props - All component props
 * @returns {JSX.Element}
 */
export const SignUpConfirmation = () => {
  // State
  const [id, setId] = useState()
  const [error, setError] = useState(false)
  const [check, setCheck] = useState()

  // Effects
  useEffect(() => {
    const newId = getSearchParam('id')
    if (!newId) setError('noId')
    const newCheck = getSearchParam('check')
    if (newId !== id) setId(newId)
    if (newCheck !== check) setCheck(newCheck)
  }, [id, check])

  // Short-circuit errors
  if (error === 'noId')
    return (
      <Popout type="error" title="Invalid Sign Up URL">
        You seem to have arrived on this page in a way that is not supported
      </Popout>
    )
  // If we do not (yet) have the data, show a loader
  if (!id || !check)
    return (
      <>
        <h1>One moment pleae</h1>
        <Spinner className="tw:w-8 tw:h-8 tw:m-auto tw:animate-spin" />
      </>
    )

  return (
    <>
      <h1>One more thing</h1>
      <Consent signUp={id} />
    </>
  )
}
