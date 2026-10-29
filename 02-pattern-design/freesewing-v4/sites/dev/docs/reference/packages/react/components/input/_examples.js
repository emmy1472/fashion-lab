import React, { useState } from 'react'
import { validateEmail } from '@freesewing/utils'
import {
  ActiveImageInput,
  ButtonFrame,
  DesignInput,
  EmailInput,
  Fieldset,
  FileInput,
  ImageInput,
  ListInput,
  MarkdownInput,
  MeasurementInput,
  MfaInput,
  NumberInput,
  PassiveImageInput,
  PasswordInput,
  StringInput,
  ToggleInput,
} from '@freesewing/react/components/Input'

/*
 * A nonsensical update function
 */
const update = (...params) => console.log('Update method received', params)

export const Docs = () => (
  <pre>
  {Object.keys(components).map(c => `${c}\n`)}
  </pre>
)

export const ActiveImageInputExample = () => (
  <ActiveImageInput
    imgSubid='1'
    imgType='blog'
    imgSlug='docs'
    update={update}
  />
)
export const ButtonFrameExample = () => (
  <ButtonFrame>
    <p>This is inside the ButtonFrame</p>
  </ButtonFrame>
)
export const DesignInputExample = () => (
  <DesignInput
    firstOption="Pick a design (firstOption)"
    update={update}
  />
)
export const EmailInputExample = () => {
  const [email, setEmail] = useState('')

  return <EmailInput update={(val) => setEmail(val)} current={email} />
}
export const FieldsetExample = () => (
  <>
    <p>Regular Fieldset:</p>
    <Fieldset
      legend="Legend (legend)"
      label="Label (label)"
      labelTR="Top-Right (labelTR)"
      labelBL="Bottom-Left (labelBL)"
      labelBR="Bottom-Right (labelBR)"
      forId="example"
      help="#docs"
    >
      <input type="text" className="tw:daisy-input tw:w-full" placeholder="Example input" id="example" />
    </Fieldset>
    <p>Box Fieldset:</p>
    <Fieldset
      legend="Legend (legend)"
      label="Label (label)"
      labelTR="Top-Right (labelTR)"
      labelBL="Bottom-Left (labelBL)"
      labelBR="Bottom-Right (labelBR)"
      forId="example"
      help="#docs"
      box={true}
    >
      <input type="text" className="tw:daisy-input tw:w-full" placeholder="Example input" id="example" />
    </Fieldset>
    <p>No legend:</p>
    <Fieldset
      label="Label (label)"
      labelTR="Top-Right (labelTR)"
      labelBL="Bottom-Left (labelBL)"
      labelBR="Bottom-Right (labelBR)"
      forId="example"
      help="#docs"
    >
      <input type="text" className="tw:daisy-input tw:w-full" placeholder="Example input" id="example" />
    </Fieldset>
  </>
)
export const FileInputExample = () => (
  <FileInput
  />
)
export const ImageInputExample = () => (
  <ImageInput
  />
)
export const ListInputExample = () => {
  const list = [
    { val: 'bananas', label: 'Bananas', desc: 'A type of fruit' },
    { val: 'bandanas', label: 'Bandanas', desc: 'Something to wear on your head' },
  ]
  return (
    <>
      <p>Regular:</p>
      <ListInput list={list} />
      <p>Without desc inside a fieldset with legend:</p>
      <ListInput list={list.map(item => ({ ...item, desc: undefined }))} box legend="Legend here"/>
    </>
  )
}
export const MarkdownInputExample = () => {
  const [md, setMd] = useState('')
  return <MarkdownInput current={md} update={(val) => setMd(val)} />
}
export const MeasurementInputExample = () => (
  <MeasurementInput m='chest'
  />
)
export const MfaInputExample = () => (
  <MfaInput
  />
)
export const NumberInputExample = () => (
  <NumberInput
  />
)
export const PassiveImageInputExample = () => (
  <PassiveImageInput
  />
)
export const PasswordInputExample = () => {
  const [pwd, setPwd] = useState('')
  return <PasswordInput current={pwd} update={(val) => setPwd(val)} />
}
export const StringInputExample = () => {
  const [pwd, setPwd] = useState('')
  return <StringInput current={pwd} update={(val) => setPwd(val)} />
}
export const ToggleInputExample = () => {
  const [val, setVal] = useState(false)
  return <ToggleInput current={val} update={(v) => setVal(v)} labels={['Enabled', 'Disabled']} legend="Toggle" />
}


