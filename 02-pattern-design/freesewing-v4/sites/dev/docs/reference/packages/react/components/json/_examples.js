import React from 'react'
import { Json } from '@freesewing/react/components/Json'

export const JsonExample = () => (
  <Json js={{
    pizzas: [
      {
        size: 'lg',
        toppings: ['tomato', 'pineapple', 'chorizo', 'mozarella'],
        crust: 'classic'
      },
      {
        size: 'lg',
        toppings: ['tomato', 'pineapple', 'cupped_chorizo', 'mozarella'],
        crust: 'cheesy'
      },
    ],
    pickup: false
  }} />
)
