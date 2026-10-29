import React from 'react'
import {
  AnchorLink,
  CardLink,
  Link,
  SuccessLink,
} from '@freesewing/react/components/Link'
import { WarningIcon } from '@freesewing/react/components/Icon'

export const AnchorLinkExample = () => <AnchorLink id="cardlink">This is a AnchorLink</AnchorLink>
export const CardLinkExample = () => (
  <CardLink
    id="cardlink"
    icon={<WarningIcon />}
    href="/"
    title="This is the title"
  >
    This is a CardLink with a WarningIcon
  </CardLink>
)
export const LinkExample = () => <Link href="/">This is a Link</Link>
export const SuccessLinkExample = () => (
  <>
    <SuccessLink href="/">This is a SuccessLink, you should not use it on a regular background</SuccessLink> (there is a link on this line)
    <div className="tw:bg-success tw:p-2 tw:rounded">
      <SuccessLink href="/">This is a SuccessLink on a success background</SuccessLink>
    </div>
  </>
)

