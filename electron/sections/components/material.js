// @flow

import * as React from 'react'

import styled from 'styled-components'

import { SimpleListItem, List } from 'rmwc/List'

export { List }

export const PlainListItem = SimpleListItem

export const ListItem = styled(SimpleListItem)`
	cursor: pointer;
`
