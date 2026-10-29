import React from 'react'
import { Breadcrumbs } from '@freesewing/react/components/Breadcrumbs'

export const BreadcrumbsExample = () => (
  <Breadcrumbs
    title="Breadcrumbs"
    crumbs={[
      { href: '/reference/', label: 'Reference' },
      { href: '/reference/packages/', label: 'Packages' },
      { href: '/reference/packages/@freesewing/react/', label: '@freesewing/react' },
      { href: '/reference/packages/@freesewing/react/components/', label: 'React Components' },
    ]}
  />
)

