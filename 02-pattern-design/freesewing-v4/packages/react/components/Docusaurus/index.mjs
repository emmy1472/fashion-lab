import React, { useState, useEffect, useContext } from 'react'
import { useAccount } from '@freesewing/react/hooks/useAccount'
import {
  LoadingStatusContext,
  LoadingStatusContextProvider,
} from '@freesewing/react/context/LoadingStatus'
import { ModalContext, ModalContextProvider } from '@freesewing/react/context/Modal'
import {
  ChatIcon,
  DesignIcon,
  DocsIcon,
  HelpIcon,
  ShowcaseIcon,
  RssIcon,
  LockIcon,
  UserIcon,
} from '@freesewing/react/components/Icon'
import { Layout as DefaultLayout } from '@freesewing/react/components/Layout'

/**
 * This component should be the top level of a Docusaurus page where you want access to context.
 *
 * This sets up the various context providers before
 * passing all props down to the InnerPageWrapper.
 * This is required because the context providers need to
 * be set up for the modal and loading state work.
 * We also re-use the Docusaurus Layout component here, which needs to be at
 * the top level of the page.
 *
 * @component
 * @param {object} props - All component props
 * @param {React.Component} props.DocusaurusLayout - The docusaurus layout to apply
 * @param {React.Component} props.Layout - The layout to apply inside docusaurus
 * @param {JSX.Element} props.children - The component children
 * @param {array} props.crumbs - The page breadcrumbs
 * @param {string} props.description - The page description
 * @param {string} props.title - The page title
 * @returns {JSX.Element}
 */
export const DocusaurusPage = (props) => {
  const DocusaurusLayout = props.DocusaurusLayout
  return DocusaurusLayout ? (
    <DocusaurusLayout title={props.title} description={props.description}>
      <ModalContextProvider>
        <LoadingStatusContextProvider>
          <InnerDocusaurusPage {...props} />
        </LoadingStatusContextProvider>
      </ModalContextProvider>
    </DocusaurusLayout>
  ) : (
    <p>You need to pass in the DocusaurusLayout component</p>
  )
}

/**
 * This component should be the top level of any Docusaurus content that's not
 * a full page where you want access to context (typically account pages and so on).
 *
 * This sets up the various context providers before
 * passing all props down to the InnerPageWrapper.
 * This is required because the context providers need to
 * be setup for the modal and loading state work we do in the InnerPageWrapper
 *
 * @component
 * @param {object} props - All component props
 * @param {React.Component} props.Layout - The layout to apply inside docusaurus
 * @param {JSX.Element} props.children - The component children
 * @param {array} props.crumbs - The page breadcrumbs
 * @param {string} props.description - The page description
 * @param {string} props.title - The page title
 * @returns {JSX.Element}
 */
export const DocusaurusDoc = (props) => (
  <ModalContextProvider>
    <LoadingStatusContextProvider>
      <InnerDocusaurusPage {...props} Layout={false} />
    </LoadingStatusContextProvider>
  </ModalContextProvider>
)

/*
 * This component needs to be a child of the ContextWrapper
 *
 * @param {object} props - All React props
 * @param {function} Layout - A specific React component to use for a non-default Layout
 * @param {array} children - Child components / content
 * @param {array} crumbs - An array to construct breadcrumbs from
 * @param {string} description - Description for the page metadata
 * @param {string} title - Description for the page title
 */
const InnerDocusaurusPage = ({
  Layout = DefaultLayout,
  children = [],
  crumbs = [],
  description = 'Free Bespoke Sewing Patterns',
  title = 'FreeSewing',
}) => {
  /*
   * Set up contexts
   */
  const { modalContent } = useContext(ModalContext)
  const { LoadingStatus } = useContext(LoadingStatusContext)

  /*
   * Return inner page wrapper
   */
  return (
    <div className="tailwind-container">
      <LoadingStatus />
      {Layout ? <Layout {...{ title, description, crumbs }}>{children}</Layout> : children}
      {typeof modalContent === 'function' ? modalContent() : modalContent}
    </div>
  )
}

/**
 * A component to render (some) custom navbar items in Docusaurus
 *
 * This can be used to swizzle the default NavbarItem in Docusaurus.
 * You should pass it in the default NavbarItem and it will use that
 * for all but the following: account, designs, docs, blog, showcase, forum
 *
 * @component
 * @param {object} props - All component props
 * @param {string} props.id - The navbar item ID
 * @param {React.Component} props.Default - The default NavbarItem component to use
 * @returns {JSX.Element}
 */
export const NavbarItem = (props) => {
  const { id, Default } = props

  const Component = navbarItems[id] ? navbarItems[id] : Default

  return <Component {...props} />
}

const AccountNavbarItem = ({ Link }) => {
  const [loggedIn, setLoggedIn] = useState(false)
  const { account } = useAccount()

  useEffect(() => {
    if (account?.username) setLoggedIn(true)
  }, [account])

  const itemProps =
    loggedIn && account.username
      ? { Link, label: account.username, Icon: UserIcon, href: '/account/' }
      : { Link, label: 'Sign In', Icon: LockIcon, href: '/signin/' }

  return <SimpleNavbarItem {...itemProps} />
}

const SimpleNavbarItem = ({ label, Icon, href, Link }) => (
  <Link
    className="tw:daisy-btn tw:daisy-btn-ghost tw:hover:no-underline tw:hover:text-base-content custom-navbar-item no-hover-decoration"
    href={href}
  >
    <div className="tw:flex tw:flex-row tw:gap-2 tw:items-center">
      <Icon className="tw:w-6 tw:h-6 tw:text-base-content" />
      <span className="tw:text-lg tw:text-base-content">{label}</span>
    </div>
  </Link>
)

/*
 * A selection of custom navbar items
 */
const navbarItems = {
  account: AccountNavbarItem,
  designs: (props) => (
    <SimpleNavbarItem label="Designs" href="/designs/" Icon={DesignIcon} Link={props.Link} />
  ),
  docs: (props) => (
    <SimpleNavbarItem label="Docs" href="/docs/" Icon={DocsIcon} Link={props.Link} />
  ),
  showcase: (props) => (
    <SimpleNavbarItem label="Showcase" href="/showcase/" Icon={ShowcaseIcon} Link={props.Link} />
  ),
  blog: (props) => <SimpleNavbarItem label="Blog" href="/blog/" Icon={RssIcon} Link={props.Link} />,
  forum: (props) => (
    <SimpleNavbarItem
      label="Forum"
      href="https://forum.freesewing.eu/"
      Icon={ChatIcon}
      Link={props.Link}
    />
  ),
  support: (props) => (
    <SimpleNavbarItem label="Support" href="/support/" Icon={HelpIcon} Link={props.Link} />
  ),
}
