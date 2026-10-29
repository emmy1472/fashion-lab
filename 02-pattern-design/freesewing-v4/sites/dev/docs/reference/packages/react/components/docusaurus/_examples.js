import React from 'react'
import { Popout } from '@freesewing/react/components/Popout'
import ComponentTypes from '@theme-original/NavbarItem/ComponentTypes'
import { NavbarItem as FreeSewingNavbarItem } from '@freesewing/react/components/Docusaurus'
import Link from '@docusaurus/Link'

export const DocusaurusPageExample = () => (
  <Popout note>
    <h4>This is not an example</h4>
    <p>We cannot safely include this example in a page. But <a href="https://freesewing.org/signin/">the sign in page</a> is an example where this component is used.</p>
    <p>Essentially, use this if you want to use the components from <code>@freesewing/react</code> inside Docusaurus, and you do not want the standard <em>docs</em> layout (no sidebar).
    </p>
  </Popout>
)

export const DocusaurusDocExample = () => (
  <Popout type="note">
  </Popout>
)

const NavbarItem = ComponentTypes.default
export const NavbarItemExample = () => (

  <>
    <NavbarItem id="test" label="Default NavbarItem" href="#" />
    <FreeSewingNavbarItem id="account" Default={NavbarItem} label="Custom NavbarItem (account)" href="#" Link={Link} />
  </>
)

