import React from 'react'
import { FreeSewingLogo } from '@freesewing/react/components/Logo'
import { Highlight } from '@freesewing/react/components/Highlight'

export const FreeSewingLogoExample = () => (
  <>
    <div className="tw:flex tw:flex-row tw:flex-wrap tw:gap-4">
      <div>
        <h4>Default</h4>
        <div className="tw:flex tw:flex-row tw:flex-wrap tw:gap-4">
          <FreeSewingLogo />
          <div style={{
            background: `repeating-linear-gradient(45deg, #000 0px, #000 10px, #FFF 10px, #FFF 20px)`
          }}>
            <FreeSewingLogo />
          </div>
        </div>
        <small className="tw:block tw:mx-auto tw:leading-4 tw:text-center">the busy background<br />reveals the stroke</small>
      </div>
      <div className="tw:grow"><Highlight language="JSX">{`<FreeSewingLogo />`}</Highlight></div>
    </div>
    <div className="tw:flex tw:flex-row tw:flex-wrap tw:gap-4">
      <div>
        <h4>Different color/size</h4>
        <FreeSewingLogo className="tw:w-36 tw:h-36 tw:text-primary" />
      </div>
      <div className="tw:grow">
        <Highlight language="JSX">{`<FreeSewingLogo className="tw:w-36 tw:h-36 tw:text-primary" />`}</Highlight>
      </div>
    </div>
    <div className="tw:flex tw:flex-row tw:flex-wrap tw:gap-4">
      <div>
        <h4>Different stroke</h4>
        <FreeSewingLogo stroke="red"/>
      </div>
      <div className="tw:grow">
        <Highlight language="JSX">{`<FreeSewingLogo stroke="red" />`}</Highlight>
      </div>
    </div>
  </>
)
