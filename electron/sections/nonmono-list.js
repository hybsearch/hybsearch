// @flow

import * as React from 'react'

import { List, ListItem } from './components/material'
import { AppSection } from './components/app-section'

export type NonMonoPair = [string, string]

type Props = {
	nonmonophyly: Array<NonMonoPair>,
}

const SAMPLE = [['Emydura_sub KC155', 'Emydura_Tany KC156']]

const pairToString = (pair: NonMonoPair) => pair.join(' ↔ ')

export const NonmonophylyListSection = ({ nonmonophyly = SAMPLE }: Props) => {
	let listItems = nonmonophyly
		.map(pairToString)
		.map(pair => <ListItem key={pair} meta="arrow_forward" text={pair} />)

	return <AppSection title="Nonmonophyly" content={<List>{listItems}</List>} />
}
