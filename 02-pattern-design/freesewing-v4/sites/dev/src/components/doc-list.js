import React from 'react'
import Link from '@docusaurus/Link'

const DocList = ({ items }) => {
  const links = []
  for (const item of items) {
    if (['link', 'category'].includes(item.type)) {
      links.push(
        <li key={item.docId}>
          <Link href={item.href}>{item.label}</Link>
        </li>
      )
    }
  }

  return <ul className="tw:list tw:list-inside tw:list-disc tw:ml-2">{links}</ul>
}

export default DocList
