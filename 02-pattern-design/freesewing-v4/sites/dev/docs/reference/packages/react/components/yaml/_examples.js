import React from 'react'
import { Yaml } from '@freesewing/react/components/Yaml'

export const YamlExample = () => <Yaml js={{
  some: 'yaml',
  data: 'here',
  more: {
    things: {
      like: ['an', 'array'],
      or: {
        a: {
          number: 12
        }
      }
    }
  }
}} />

