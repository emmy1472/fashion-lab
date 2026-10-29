// Dependencies
import {
  capitalize,
  cloudflareImageUrl,
  measurementAsMm,
  measurementAsUnits,
  distanceAsMm,
  validateEmail,
} from '@freesewing/utils'
import { collection } from '@freesewing/collection'
import { measurements as measurementsTranslations } from '@freesewing/i18n'
// Context
import { LoadingStatusContext } from '@freesewing/react/context/LoadingStatus'
// Hooks
import React, { useState, useCallback, useContext } from 'react'
import { useDropzone } from 'react-dropzone'
import { useBackend } from '@freesewing/react/hooks/useBackend'
// Components
import { Link as WebLink } from '@freesewing/react/components/Link'
import { TrashIcon, ResetIcon, UploadIcon, HelpIcon } from '@freesewing/react/components/Icon'
import { isDegreeMeasurement } from '@freesewing/config'
import { Tabs, Tab } from '@freesewing/react/components/Tab'
import Markdown from 'react-markdown'

/*
 * A helper component to render the help link in formcontrol
 *
 * @param {string|function| help - The help href of onClick method
 * @param {React.component} Link - An optional framework-specific link component
 */
const HelpLink = ({ help, Link = false }) => {
  if (!Link) Link = WebLink

  if (typeof help === 'function')
    return (
      <button onClick={help} title="Show help">
        <HelpIcon className="tw:w-5 tw:h-5 tw:text-secondary tw:hover:cursor-pointer" />
      </button>
    )

  if (typeof help === 'string')
    return (
      <Link href={help} target="_BLANK" rel="nofollow" title="Show help">
        <HelpIcon className="tw:w-5 tw:h-5" />
      </Link>
    )

  return null
}

/**
 * A component for a fieldset, which wraps form elements and providers labels.
 *
 * @component
 * @param {object} props - All component props
 * @param {React.Component} [props.Link = undefined] - A framework specific Link component for client-side routing
 * @param {boolean} [props.box = undefined] - Set this to true to render a boxed fieldset
 * @param {JSX.Element} props.children - The component children
 * @param {string} [props.label = false] - The (top-left) label
 * @param {string} [props.labelBL = false] - The bottom-left) label
 * @param {string} [props.labelBR = false] - The bottom-right) label
 * @param {string} [props.labelTR = false] - The top-right label
 * @param {string} [props.legend = false] - The fieldset legend
 * @param {string} [props.forId = ''] - Id of the HTML element we are wrapping
 * @param {string|function} [props.help = false] - An optional URL/method to link/show help or docs
 * @returns {JSX.Element}
 */
export const Fieldset = ({
  Link = false,
  box = false,
  children,
  label = false,
  labelBL = false,
  labelBR = false,
  labelTR = false,
  legend = false,
  forId = '',
  help = false,
}) => (
  <fieldset
    className={`tw:daisy-fieldset tw:w-full tw:mt-2 ${box ? 'tw:bg-base-200 tw:border-base-300 tw:rounded-box tw:border tw:p-4' : ''}`}
  >
    {legend ? (
      <legend className="tw:daisy-fieldset-legend tw:px-2 tw:pb-1">
        {legend}
        <HelpLink {...{ help, Link }} />
      </legend>
    ) : null}
    <div className="tw:flex tw:flex-row tw:justify-between tw:px-2">
      {label ? (
        <label className="tw:daisy-label" htmlFor={forId}>
          {label}
        </label>
      ) : null}
      {labelTR ? (
        <label className="tw:daisy-label" htmlFor={forId}>
          {labelTR}
        </label>
      ) : null}
    </div>
    {children}
    <div className="tw:flex tw:flex-row tw:justify-between tw:px-2">
      {labelBL ? (
        <label className="tw:daisy-label" htmlFor={forId}>
          {labelBL}
        </label>
      ) : null}
      {labelBR ? (
        <label className="tw:daisy-label" htmlFor={forId}>
          {labelBR}
        </label>
      ) : null}
    </div>
  </fieldset>
)

/**
 * A component to wrap content in a button
 *
 * @component
 * @param {object} props - All component props
 * @param {boolean} [props.active = false] - Set this to true to render the button as active/selected
 * @param {JSX.Element} props.children - The component children
 * @param {boolean} [props.dense = false] - Set this to render a more compact variant
 * @param {boolean} [props.noBg = false] - Set this to true to not use a background color in active state
 * @param {function} props.onClick - The button's onClick handler
 * @returns {JSX.Element}
 */
export const ButtonFrame = ({ active, children, dense, noBg, onClick }) => (
  <button
    className={`
    tw:daisy-btn tw:daisy-btn-ghost tw:h-fit
    tw:w-full ${dense ? 'tw:mt-1 tw:daisy-btn-sm tw:font-light' : 'tw:mt-2 tw:py-4 tw:h-auto tw:content-start'}
    tw:border-2 tw:border-secondary tw:text-left tw:bg-secondary/20
    ${noBg ? 'tw:hover:bg-transparent' : 'tw:hover:bg-secondary/10'}
    tw:hover:border-secondary tw:hover:border-solid tw:hover:border-2
    ${active ? 'tw:border-solid' : 'tw:border-dotted'}
    ${active && !noBg ? 'tw:bg-secondary' : 'tw:bg-transparent'}
    `}
    onClick={onClick}
  >
    {children}
  </button>
)

/**
 * A component to handle input of numbers
 *
 * @component
 * @param {object} props - All component props
 * @param {boolean} [props.box = false] - Set this to true to render a boxed fieldset
 * @param {number} props.current - The current value, to manage the state of this input
 * @param {string|function} [props.help = false] - An optional URL/method to link/show help or docs
 * @param {string} [props.inputMode = 'decimal'] - The inputMode of the input
 * @param {string} [props.label = false] - The (top-left) label
 * @param {string} [props.labelBL = false] - The bottom-left) label
 * @param {string} [props.labelBR = false] - The bottom-right) label
 * @param {string} [props.labelTR = false] - The top-right label
 * @param {string} [props.id = ''] - Id of the HTML element to link the fieldset labels
 * @param {string} [props.legend = false] - The fieldset legend
 * @param {number} [props.max = 225] - The maximum value
 * @param {number} [props.min = 0] - The minimum value
 * @param {number} props.original - The original value, which detects whether it was changed
 * @param {string} props.placeholder - The placeholder text
 * @param {number} [props.step = 1] - The input step
 * @param {function} props.update - The onChange handler
 * @param {function} props.valid - A function that should return whether the value is valid or not
 * @returns {JSX.Element}
 */
export const NumberInput = ({
  box = false,
  current,
  help = false,
  inputMode = 'decimal',
  label = false,
  labelBL = false,
  labelBR = false,
  labelTR = false,
  id = '',
  legend = false,
  max = 225,
  min = 0,
  original,
  placeholder,
  step = 1,
  update,
  valid,
}) => (
  <Fieldset {...{ box, help, label, labelBL, labelBR, labelTR, legend }} forId={id}>
    <input
      id={id}
      type="text"
      inputMode={inputMode}
      placeholder={placeholder}
      value={current}
      onChange={(evt) => update(evt.target.value)}
      className={`tw:daisy-input tw:w-full tw:daisy-input-bordered ${
        current === original
          ? 'tw:daisy-input-secondary'
          : valid(current)
            ? 'tw:daisy-input-success'
            : 'tw:daisy-input-error'
      }`}
      {...{ max, min, step }}
    />
  </Fieldset>
)

/**
 * A component to handle input of strings (single-line text)
 *
 * @component
 * @param {object} props - All component props
 * @param {boolean} [props.box = false] - Set this to true to render a boxed fieldset
 * @param {number} props.current - The current value, to manage the state of this input
 * @param {string|function} [props.help = false] - An optional URL/method to link/show help or docs
 * @param {string} [props.label = false] - The (top-left) label
 * @param {string} [props.labelBL = false] - The bottom-left) label
 * @param {string} [props.labelBR = false] - The bottom-right) label
 * @param {string} [props.labelTR = false] - The top-right label
 * @param {string} [props.id = ''] - Id of the HTML element to link the fieldset labels
 * @param {string} [props.legend = false] - The fieldset legend
 * @param {number} props.original - The original value, which detects whether it was changed
 * @param {string} props.placeholder - The placeholder text
 * @param {function} props.update - The onChange handler
 * @param {function} [props.valid = () => true] - A function that should return whether the value is valid or not
 * @returns {JSX.Element}
 */
export const StringInput = ({
  box = false,
  current,
  help = false,
  label = false,
  labelBL = false,
  labelBR = false,
  labelTR = false,
  id = '',
  legend = false,
  original,
  placeholder,
  update,
  valid = () => true,
}) => (
  <Fieldset {...{ box, help, label, labelBL, labelBR, labelTR, legend }} forId={id}>
    <input
      id={id}
      type="text"
      placeholder={placeholder}
      value={current}
      onChange={(evt) => update(evt.target.value)}
      className={`tw:daisy-input tw:w-full tw:daisy-input-bordered tw:text-current ${
        current === original
          ? 'tw:daisy-input-secondary'
          : valid(current)
            ? 'tw:daisy-input-success'
            : 'tw:daisy-input-error'
      }`}
    />
  </Fieldset>
)

/**
 * A component to handle input of MFA codes. Essentially a NumberInput with some default props set.
 *
 * @component
 * @param {object} props - All component props
 * @param {boolean} [props.box = false] - Set this to true to render a boxed fieldset
 * @param {number} props.current - The current value, to manage the state of this input
 * @param {string|function} [props.help = false] - An optional URL/method to link/show help or docs
 * @param {string} [props.label = false] - The (top-left) label
 * @param {string} [props.labelBL = false] - The bottom-left) label
 * @param {string} [props.labelBR = false] - The bottom-right) label
 * @param {string} [props.labelTR = false] - The top-right label
 * @param {string} [props.id = 'mfa'] - Id of the HTML element to link the fieldset labels
 * @param {string} [props.inputMode = 'numeric'] - The input mode of the input
 * @param {string} [props.legend = false] - The fieldset legend
 * @param {string} [props.placeholder = 'MFA Code'] - The placeholder text
 * @param {function} props.update - The onChange handler
 * @param {function} props.valid - A function that should return whether the value is valid or not
 * @returns {JSX.Element}
 */
export const MfaInput = ({
  box = false,
  current,
  help = false,
  label = false,
  labelBL = false,
  labelBR = false,
  labelTR = false,
  id = 'mfa',
  inputMode = 'numeric',
  legend = false,
  placeholder = 'MFA Code',
  update,
  valid = (val) => val.length > 4,
}) => (
  <NumberInput
    {...{
      box,
      current,
      help,
      label,
      labelBL,
      labelBR,
      labelTR,
      id,
      inputMode,
      legend,
      placeholder,
      update,
      valid,
    }}
  />
)

/**
 * A component to handle input of passwords
 *
 * @component
 * @param {object} props - All component props
 * @param {boolean} [props.box = false] - Set this to true to render a boxed fieldset
 * @param {number} props.current - The current value, to manage the state of this input
 * @param {string|function} [props.help = false] - An optional URL/method to link/show help or docs
 * @param {string} [props.label = false] - The (top-left) label
 * @param {string} [props.labelBL = false] - The bottom-left) label
 * @param {string} [props.labelTR = false] - The top-right label
 * @param {string} [props.id = 'password'] - Id of the HTML element to link the fieldset labels
 * @param {string} [props.legend = false] - The fieldset legend
 * @param {string} [placeholder = '¯\\_(ツ)_/¯' - The placeholder text
 * @param {function} props.update - The onChange handler
 * @param {function} [props.valid = () => true] - A function that should return whether the value is valid or not
 * @param {function} [props.onKeyDown = false] - An optional handler to capture keypresses (like enter)
 * @returns {JSX.Element}
 */
export const PasswordInput = ({
  box = false,
  current,
  help = false,
  label = false,
  labelBL = false,
  labelTR = false,
  id = 'password',
  legend = false,
  placeholder = '¯\\_(ツ)_/¯',
  update,
  valid = () => true,
  onKeyDown = false,
}) => {
  const [reveal, setReveal] = useState(false)

  const extraProps = onKeyDown ? { onKeyDown } : {}

  return (
    <Fieldset
      {...{ help, label, labelBL, labelTR, legend, box }}
      forId={id}
      labelBL={labelBL || ' '}
      labelBR={
        <button
          className="tw:btn tw:btn-primary tw:btn-ghost tw:btn-xs tw:-mt-2 tw:hover:cursor-pointer"
          onClick={() => setReveal(!reveal)}
        >
          {reveal ? 'Hide Password' : 'Reveal Password'}
        </button>
      }
    >
      <input
        id={id}
        type={reveal ? 'text' : 'password'}
        placeholder={placeholder}
        value={current}
        onChange={(evt) => update(evt.target.value)}
        className={`tw:daisy-input tw:w-full tw:daisy-input-bordered ${
          valid(current) ? 'input-success' : 'input-error'
        }`}
        {...extraProps}
      />
    </Fieldset>
  )
}

/**
 * A component to handle input of email addresses
 *
 * @component
 * @param {object} props - All component props
 * @param {boolean} [props.box = false] - Set this to true to render a boxed fieldset
 * @param {number} props.current - The current value, to manage the state of this input
 * @param {string|function} [props.help = false] - An optional URL/method to link/show help or docs
 * @param {string} [props.id = ''] - Id of the HTML element to link the fieldset labels
 * @param {string} [props.label = false] - The (top-left) label
 * @param {string} [props.labelBL = false] - The bottom-left) label
 * @param {string} [props.labelBR = false] - The bottom-right) label
 * @param {string} [props.labelTR = false] - The top-right label
 * @param {string} [props.legend = false] - The fieldset legend
 * @param {number} [props.original = ''] - The original value, which detects whether it was changed
 * @param {string} [props.placeholder = 'Email Address'] - The placeholder text
 * @param {function} props.update - The onChange handler
 * @param {function} [props.valid = @freesewing/utils.validateEmail] - A function that should return whether the value is valid or not
 * @returns {JSX.Element}
 */
export const EmailInput = ({
  box = false,
  current,
  help = false,
  id = 'email',
  label = false,
  labelBL = false,
  labelBR = false,
  labelTR = false,
  legend = false,
  original = '',
  update,
  placeholder = 'Email Address',
  valid = validateEmail,
}) => (
  <Fieldset {...{ box, help, label, labelTR, labelBL, labelBR, legend }} forId={id}>
    <input
      id={id}
      type="email"
      placeholder={placeholder}
      value={current}
      onChange={(evt) => update(evt.target.value)}
      className={`tw:daisy-input tw:w-full tw:daisy-input-bordered ${
        current === original
          ? 'tw:daisy-input-secondary'
          : valid(current)
            ? 'tw:daisy-input-success'
            : 'tw:daisy-input-error'
      }`}
    />
  </Fieldset>
)

/**
 * A component to handle input of a design name (a select)
 *
 * @component
 * @param {object} props - All component props
 * @param {boolean} [props.box = false] - Set this to true to render a boxed fieldset
 * @param {number} props.current - The current value, to manage the state of this input
 * @param {string} [props.firstOption = false] - An optional first option to add to the select
 * @param {string|function} [props.help = false] - An optional URL/method to link/show help or docs
 * @param {string} [props.id = 'design'] - Id of the HTML element to link the fieldset labels
 * @param {string} [props.label = false] - The (top-left) label
 * @param {string} [props.labelBL = false] - The bottom-left) label
 * @param {string} [props.labelBR = false] - The bottom-right) label
 * @param {string} [props.labelTR = false] - The top-right label
 * @param {string} [props.legend = false] - The fieldset legend
 * @param {function} props.update - The onChange handler
 * @returns {JSX.Element}
 */
export const DesignInput = ({
  box = false,
  current,
  firstOption = false,
  help = false,
  id = 'design',
  label = false,
  labelBL = false,
  labelBR = false,
  labelTR = false,
  legend = false,
  update,
}) => (
  <Fieldset {...{ box, help, label, labelTR, labelBL, labelBR, legend }} forId={id}>
    <select
      id={id}
      className="tw:daisy-select tw:w-full"
      onChange={(evt) => update(evt.target.value)}
      value={current}
    >
      {firstOption ? <option disabled={true}>{firstOption}</option> : null}
      {collection.map((design) => (
        <option key={design} value={design}>
          {capitalize(design)}
        </option>
      ))}
    </select>
  </Fieldset>
)

/**
 * A component to handle input of an image
 *
 * @component
 * @param {object} props - All component props
 * @param {boolean} [props.active = false] - Set this to true to automatically upload the image
 * @param {boolean} [props.box = false] - Set this to true to render a boxed fieldset
 * @param {number} props.current - The current value, to manage the state of this input
 * @param {string|function} [props.help = false] - An optional URL/method to link/show help or docs
 * @param {string} [props.id = 'image'] - Id of the HTML element to link the fieldset labels
 * @param {string} [props.imgType = 'showcase'] - The type of image. One of 'showcase' or 'blog'
 * @param {string} props.imgSlug - The slug of the image, which is the foldername holding the blog or showcase post
 * @param {string} props.imgSubid - Set this id to upload non-main images, should be unique per post (1,2,3,...)
 * @param {string} [props.label = false] - The (top-left) label
 * @param {string} [props.labelBL = false] - The bottom-left) label
 * @param {string} [props.labelBR = false] - The bottom-right) label
 * @param {string} [props.labelTR = false] - The top-right label
 * @param {string} [props.legend = false] - The fieldset legend
 * @param {number} props.original - The original value, which allows a reset
 * @param {function} props.update - The onChange handler
 * @returns {JSX.Element}
 */
export const ImageInput = ({
  active = false,
  box = false,
  current,
  help = false,
  id = 'image',
  imgSlug,
  imgSubid,
  imgType = 'showcase',
  label = false,
  labelBL = false,
  labelBR = false,
  labelTR = false,
  legend = false,
  update,
  original,
}) => {
  const backend = useBackend()
  const { setLoadingStatus } = useContext(LoadingStatusContext)
  const [url, setUrl] = useState(false)
  const [uploadedId, setUploadedId] = useState(false)

  const upload = async (img, fromUrl = false) => {
    setLoadingStatus([true, 'uploadingImage'])
    const data = {
      type: imgType,
      subId: imgSubid,
      slug: imgSlug,
    }
    if (fromUrl) data.url = img
    else data.img = img
    const [status, body] = await backend.uploadImageAnon(data)
    setLoadingStatus([true, 'allDone', true, true])
    if (status === 200 && body.result === 'success') {
      update(body.imgId)
      setUploadedId(body.imgId)
    } else setLoadingStatus([true, 'backendError', true, false])
  }

  const onDrop = useCallback(
    (acceptedFiles) => {
      const reader = new FileReader()
      reader.onload = async () => {
        if (active) upload(reader.result)
        else update(reader.result)
      }
      acceptedFiles.forEach((file) => reader.readAsDataURL(file))
    },
    [current]
  )

  const { getRootProps, getInputProps } = useDropzone({ onDrop })

  if (current)
    return (
      <Fieldset {...{ box, help, label, labelTR, labelBL, labelBR, legend }} forId={id}>
        <div
          className="tw:bg-base-100 tw:w-full tw:h-36 tw:mb-2 tw:mx-auto tw:flex tw:flex-col tw:items-center tw:text-center tw:justify-center"
          style={{
            backgroundImage: `url(${
              uploadedId ? cloudflareImageUrl({ type: 'public', id: uploadedId }) : current
            })`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: '50%',
          }}
        >
          <button
            className="tw:daisy-btn tw:daisy-btn-neutral tw:daisy-btn-circle tw:opacity-50 tw:hover:opacity-100"
            onClick={() => update(original)}
          >
            <ResetIcon />
          </button>
        </div>
      </Fieldset>
    )

  return (
    <Fieldset {...{ box, help, label, labelTR, labelBL, labelBR, legend }} forId={id}>
      <div
        {...getRootProps()}
        className={`
        tw:flex tw:rounded-lg tw:w-full tw:flex-col tw:items-center tw:justify-center
        tw:lg:p-6 tw:lg:border-4 tw:lg:border-secondary tw:lg:border-dashed
      `}
      >
        <input {...getInputProps()} />
        <p className="tw:hidden tw:lg:block tw:p-0 tw:m-0">Drag and drop and image here</p>
        <p className="tw:hidden tw:lg:block tw:p-0 tw:my-2">or</p>
        <button
          className={`tw:daisy-btn tw:daisy-btn-secondary tw:daisy-btn-outline tw:mt-4 tw:px-8`}
        >
          Select an image to use
        </button>
      </div>
      <p className="tw:p-0 tw:my-2 tw:text-center">or</p>
      <div className="tw:flex tw:flex-row tw:items-center">
        <input
          id={id}
          type="url"
          className="tw:daisy-input tw:daisy-input-secondary tw:w-full tw:daisy-input-bordered"
          placeholder="Paste an image URL here"
          value={current}
          onChange={active ? (evt) => setUrl(evt.target.value) : (evt) => update(evt.target.value)}
        />
        {active && (
          <button
            className="tw:daisy-btn tw:daisy-btn-secondary tw:ml-2 tw:capitalize"
            disabled={!url || url.length < 1}
            onClick={() => upload(url, true)}
          >
            <UploadIcon /> Upload
          </button>
        )}
      </div>
    </Fieldset>
  )
}

/**
 * A component to handle input of an image and upload it (active)
 *
 * @component
 * @param {object} props - All component props
 * @param {boolean} [props.box = false] - Set this to true to render a boxed fieldset
 * @param {number} props.current - The current value, to manage the state of this input
 * @param {string|function} [props.help = false] - An optional URL/method to link/show help or docs
 * @param {string} [props.id = 'image'] - Id of the HTML element to link the fieldset labels
 * @param {string} [props.imgType = 'showcase'] - The type of image. One of 'showcase' or 'blog'
 * @param {string} props.imgSlug - The slug of the image, which is the foldername holding the blog or showcase post
 * @param {string} props.imgSubid - Set this id to upload non-main images, should be unique per post (1,2,3,...)
 * @param {string} [props.label = false] - The (top-left) label
 * @param {string} [props.labelBL = false] - The bottom-left) label
 * @param {string} [props.labelBR = false] - The bottom-right) label
 * @param {string} [props.labelTR = false] - The top-right label
 * @param {string} [props.legend = false] - The fieldset legend
 * @param {number} props.original - The original value, which allows a reset
 * @param {function} props.update - The onChange handler
 * @returns {JSX.Element}
 */
export const ActiveImageInput = (props) => <ImageInput {...props} active={true} />

/**
 * A component to handle input of an image and not upload it (inactive)
 *
 * @component
 * @param {object} props - All component props
 * @param {boolean} [props.box = false] - Set this to true to render a boxed fieldset
 * @param {number} props.current - The current value, to manage the state of this input
 * @param {string|function} [props.help = false] - An optional URL/method to link/show help or docs
 * @param {string} [props.id = 'image'] - Id of the HTML element to link the fieldset labels
 * @param {string} [props.imgType = 'showcase'] - The type of image. One of 'showcase' or 'blog'
 * @param {string} props.imgSlug - The slug of the image, which is the foldername holding the blog or showcase post
 * @param {string} props.imgSubid - Set this id to upload non-main images, should be unique per post (1,2,3,...)
 * @param {string} [props.label = false] - The (top-left) label
 * @param {string} [props.labelBL = false] - The bottom-left) label
 * @param {string} [props.labelBR = false] - The bottom-right) label
 * @param {string} [props.labelTR = false] - The top-right label
 * @param {string} [props.legend = false] - The fieldset legend
 * @param {number} props.original - The original value, which allows a reset
 * @param {function} props.update - The onChange handler
 * @returns {JSX.Element}
 */
export const PassiveImageInput = (props) => <ImageInput {...props} active={false} />

/**
 * A component to handle input of list of items to pick from
 *
 * @component
 * @param {object} props - All component props
 * @param {boolean} [props.box = false] - Set this to true to render a boxed fieldset
 * @param {number} props.current - The current value, to manage the state of this input
 * @param {string|function} [props.help = false] - An optional URL/method to link/show help or docs
 * @param {string} [props.id = ''] - Id of the HTML element to link the fieldset labels
 * @param {string} [props.label = false] - The (top-left) label
 * @param {string} [props.labelBL = false] - The bottom-left) label
 * @param {string} [props.labelBR = false] - The bottom-right) label
 * @param {string} [props.labelTR = false] - The top-right label
 * @param {string} [props.legend = false] - The fieldset legend
 * @param {array} props.list - An array of { val, label, desc } objects to populate the list
 * @param {function} props.update - The onChange handler
 * @returns {JSX.Element}
 */
export const ListInput = ({
  box = false,
  current,
  help = false,
  id = '',
  label = false,
  labelBL = false,
  labelBR = false,
  labelTR = false,
  legend = false,
  list,
  update,
}) => (
  <Fieldset {...{ box, help, label, labelTR, labelBL, labelBR, legend }} forId={id}>
    {list.map((item, i) => (
      <ButtonFrame key={i} active={item.val === current} onClick={() => update(item.val)}>
        <div className="tw:w-full tw:flex tw:flex-col tw:gap-2">
          <div className="tw:w-full tw:text-lg tw:leading-5">{item.label}</div>
          {item.desc ? (
            <div className="tw:w-full tw:text-normal tw:font-normal tw:normal-case tw:pt-1 tw:leading-5">
              {item.desc}
            </div>
          ) : null}
        </div>
      </ButtonFrame>
    ))}
  </Fieldset>
)

/**
 * A component to handle input of markdown content
 *
 * @component
 * @param {object} props - All component props
 * @param {boolean} [props.box = false] - Set this to true to render a boxed fieldset
 * @param {number} props.current - The current value, to manage the state of this input
 * @param {string|function} [props.help = false] - An optional URL/method to link/show help or docs
 * @param {string} [props.id = ''] - Id of the HTML element to link the fieldset labels
 * @param {string} [props.label = false] - The (top-left) label
 * @param {string} [props.labelBL = 'This field supports markdown'] - The bottom-left) label
 * @param {string} [props.labelBR = false] - The bottom-right) label
 * @param {string} [props.labelTR = false] - The top-right label
 * @param {string} [props.legend = false] - The fieldset legend
 * @param {function} props.update - The onChange handler
 * @param {string} [props.placeholder = ''] - The placeholder text
 * @returns {JSX.Element}
 */
export const MarkdownInput = ({
  box = false,
  current,
  help = false,
  id = '',
  label = false,
  labelBL = 'This field supports markdown',
  labelBR = false,
  labelTR = false,
  legend = false,
  update,
  placeholder = '',
}) => (
  <Fieldset {...{ box, help, label, labelTR, labelBL, labelBR, legend }} forId={id}>
    <Tabs tabs={['edit', 'preview']}>
      <Tab key="edit">
        <div className="tw:flex tw:flex-row tw:items-center tw:mt-2">
          <textarea
            id={id}
            rows="5"
            className="tw:daisy-textarea tw:daisy-textarea-bordered tw:daisy-textarea-lg tw:w-full"
            value={current}
            placeholder={placeholder}
            onChange={(evt) => update(evt.target.value)}
          />
        </div>
      </Tab>
      <Tab key="preview">
        <div className="mdx markdown">
          <Markdown>{current}</Markdown>
        </div>
      </Tab>
    </Tabs>
  </Fieldset>
)

/**
 * A component to handle input of markdown content
 *
 * @component
 * @param {object} props - All component props
 * @param {boolean} [props.box = false] - Set this to true to render a boxed fieldset
 * @param {string|function} [props.help = false] - An optional URL/method to link/show help or docs
 * @param {string} [props.id = ''] - Id of the HTML element to link the fieldset labels
 * @param {boolean} [props.imperial = false] - Set this to true to render imperial units
 * @param {string} [props.labelBR = false] - The bottom-right) label
 * @param {string} [props.labelTR = false] - The top-right label
 * @param {string} [props.legend = false] - The fieldset legend
 * @param {string} props.m - The measurement ID (name)
 * @param {function} props.update - The onChange handler
 * @param {number} props.original - The original value, which allows a reset
 * @param {string} [props.placeholder = ''] - The placeholder text
 * @returns {JSX.Element}
 */
export const MeasurementInput = ({
  box = false,
  help = false,
  id = '',
  imperial = false,
  labelBR = false,
  labelTR = false,
  legend = false,
  m,
  update,
  original,
  placeholder = '',
}) => {
  const isDegree = isDegreeMeasurement(m)
  const units = imperial ? 'imperial' : 'metric'

  const [localVal, setLocalVal] = useState(
    typeof original === 'undefined'
      ? original
      : isDegree
        ? Number(original)
        : measurementAsUnits(original, units)
  )
  const [validatedVal, setValidatedVal] = useState(measurementAsUnits(original, units))
  const [valid, setValid] = useState(null)

  // Update onChange
  const localUpdate = (newVal) => {
    setLocalVal(newVal)
    const parsedVal = isDegree ? Number(newVal) : distanceAsMm(newVal, imperial)
    if (parsedVal) {
      update(m, isDegree ? parsedVal : measurementAsMm(parsedVal, units))
      setValid(true)
      setValidatedVal(parsedVal)
    } else if (newVal === undefined) {
      update(m, '__UNSET__')
    } else setValid(false)
  }

  // Clear value
  const clearValue = () => {
    localUpdate(undefined)
    setLocalVal('')
  }

  if (!m) return null

  // Various visual indicators for validating the input
  let inputClasses = 'daisy-input-secondary'
  let bottomLeftLabel = null
  if (valid === true) {
    inputClasses = 'daisy-input-success tw:outline-success'
    const val = `${validatedVal}${isDegree ? '°' : imperial ? '"' : 'cm'}`
    bottomLeftLabel = (
      <span className="tw:font-medium tw:text-base tw:text-success tw:-mt-2 tw:block">{val}</span>
    )
  } else if (valid === false) {
    inputClasses = 'daisy-input-error'
    bottomLeftLabel = (
      <span className="tw:font-medium tw:text-error tw:text-base tw:-mt-2 tw:block">
        ¯\_(ツ)_/¯
      </span>
    )
  }

  /*
   * I'm on the fence here about using a text input rather than number
   * Obviously, number is the more correct option, but when the user enter
   * text, it won't fire an onChange event and thus they can enter text and it
   * will not be marked as invalid input.
   * See: https://github.com/facebook/react/issues/16554
   */
  return (
    <Fieldset
      {...{ box, help, labelTR, labelBR, legend }}
      forId={id}
      legend={measurementsTranslations[m] + (isDegree ? ' (°)' : '')}
      labelBL={bottomLeftLabel}
    >
      <label
        className={`tw:daisy-input tw:flex tw:items-center tw:gap-2 tw:border ${inputClasses} tw:mb-1 tw:outline tw:outline-base-300 tw:bg-transparent tw:outline-2 tw:outline-offset-2 tw:w-full`}
      >
        <input
          id={id}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder={placeholder}
          value={localVal}
          onChange={(evt) => localUpdate(evt.target.value)}
          className={`tw:border-0 tw:grow-2 tw:w-full`}
        />
        {isDegree ? '°' : imperial ? 'inch' : 'cm'}
        <label>
          <button className="tw:text-warning tw:hover:text-error" onClick={clearValue}>
            <TrashIcon className="tw:w-5 tw:h-5 tw:-mb-1" />
          </button>
        </label>
      </label>
    </Fieldset>
  )
}

/**
 * A component to handle input of file (upload)
 *
 * @component
 * @param {object} props - All component props
 * @param {boolean} [props.box = false] - Set this to true to render a boxed fieldset
 * @param {number} props.current - The current value, to manage the state of this input
 * @param {number} [props.dropzoneConfig = {}] - The configuration for react-dropzone
 * @param {string|function} [props.props.help = false] - An optional URL/method to link/show help or docs
 * @param {string} [props.id = ''] - Id of the HTML element to link the fieldset labels
 * @param {string} [props.label = false] - The label
 * @param {string} [props.labelBL = false] - The bottom-left) label
 * @param {string} [props.labelBR = false] - The bottom-right) label
 * @param {string} [props.labelTR = false] - The top-right label
 * @param {string} [props.legend = false] - The fieldset legend
 * @param {function} props.update - The onChange handler
 * @param {number} props.original - The original value, which allows a reset
 * @returns {JSX.Element}
 */
export const FileInput = ({
  box = false,
  current,
  dropzoneConfig = {},
  help = false,
  id = '',
  label = false,
  labelBL = false,
  labelBR = false,
  labelTR = false,
  legend = false,
  update,
  original,
}) => {
  /*
   * Ondrop handler
   */
  const onDrop = useCallback(
    (acceptedFiles) => {
      const reader = new FileReader()
      reader.onload = async () => update(reader.result)
      acceptedFiles.forEach((file) => reader.readAsDataURL(file))
    },
    [update]
  )

  /*
   * Dropzone hook
   */
  const { getRootProps, getInputProps } = useDropzone({ onDrop, ...dropzoneConfig })

  /*
   * If we have a current file, return this
   */
  if (current)
    return (
      <Fieldset {...{ box, help, label, labelTR, labelBL, labelBR, legend }} forId={id}>
        <div className="tw:bg-base-100 tw:w-full tw:h-36 tw:mb-2 tw:mx-auto tw:flex tw:flex-col tw:items-center tw:text-center tw:justify-center">
          <button
            className="tw:daisy-btn tw:daisy-btn-neutral tw:daisy-btn-circle tw:opacity-50 tw:hover:opacity-100"
            onClick={() => update(original)}
          >
            <ResetIcon />
          </button>
        </div>
      </Fieldset>
    )

  /*
   * Return upload form
   */
  return (
    <Fieldset {...{ box, help, label, labelTR, labelBL, labelBR, legend }} forId={id}>
      <div
        {...getRootProps()}
        className={`
        tw:flex tw:rounded-lg tw:w-full tw:flex-col tw:items-center tw:justify-center
        tw:sm:p-6 tw:sm:border-4 tw:sm:border-secondary tw:sm:border-dashed
      `}
      >
        <input {...getInputProps()} />
        <p className="tw:hidden tw:lg:block tw:p-0 tw:m-0">Drag and drop your file here</p>
        <button
          className={`tw:daisy-btn tw:daisy-btn-secondary tw:daisy-btn-outline tw:mt-4 tw:px-8`}
        >
          Browse...
        </button>
      </div>
    </Fieldset>
  )
}

/*
 * Input for booleans
 */
/**
 * A component to handle input of booleans (yes/no or on/off)
 *
 * @component
 * @param {object} props - All component props
 * @param {boolean} [props.box = false] - Set this to true to render a boxed fieldset
 * @param {number} props.current - The current value, to manage the state of this input
 * @param {boolean} [props.disabled = false] - Set this to true to render a disabled input
 * @param {string|function} [props.help = false] - An optional URL/method to link/show help or docs
 * @param {string} [props.id = ''] - Id of the HTML element to link the fieldset labels
 * @param {string} [props.label = false] - The label
 * @param {string} [props.labelBL = false] - The bottom-left) label
 * @param {string} [props.labelBR = false] - The bottom-right) label
 * @param {string} [props.labelTR = false] - The top-right label
 * @param {array} [props.labels = ['Yes', 'No'] - An array of labels for the values
 * @param {string} [props.legend = false] - The fieldset legend
 * @param {array} [props.list = [true, false] - An array of values to choose between
 * @param {function} props.update - The onChange handler
 * @param {any} [props.on = true] - The value that should show the toggle in the 'on' state
 * @returns {JSX.Element}
 */
export const ToggleInput = ({
  box = false,
  current,
  disabled = false,
  help = false,
  id = '',
  label = false,
  labelBL = false,
  labelBR = false,
  labelTR = false,
  labels = ['Yes', 'No'],
  legend = false,
  list = [true, false],
  update,
  on = true,
}) => (
  <Fieldset {...{ box, help, labelTR, labelBL, labelBR, legend }} forId={id}>
    <label className="tw:daisy-label">
      <input
        id={id}
        disabled={disabled}
        type="checkbox"
        value={current}
        onChange={() => update(list.indexOf(current) === 0 ? list[1] : list[0])}
        className="tw:daisy-toggle tw:my-3 tw:daisy-toggle-primary"
        checked={list.indexOf(current) === 0 ? true : false}
      />
      {label
        ? `${label} (${current === on ? labels[0] : labels[1]})`
        : `${current === on ? labels[0] : labels[1]}`}
    </label>
  </Fieldset>
)
