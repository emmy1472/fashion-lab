import React from 'react'
import { Table, TableWrapper } from '@freesewing/react/components/Table'

export const TableExample = () => (
  <Table>
    <thead>
      <tr>
        <th>Color</th>
        <th>Shape</th>
        <th>Size</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Orange</td>
        <td>Round</td>
        <td>Small</td>
      </tr>
      <tr>
        <td>Pink</td>
        <td>Square</td>
        <td>Tiny</td>
      </tr>
      <tr>
        <td>Purple</td>
        <td>Round</td>
        <td>Large</td>
      </tr>
    </tbody>
  </Table>
)
export const TableWrapperExample = () => <TableWrapper><TableExample /></TableWrapper>
