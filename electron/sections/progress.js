// @flow

import * as React from 'react'

import { ChipSet, Chip, ChipIcon, ChipText } from 'rmwc/Chip'
import { Typography } from 'rmwc/Typography'
import { AppSection } from './components/app-section'
import { type Stage } from '../servers'

export const ProgressSection = ({ stages }: { stages: Map<string, Stage> }) => (
	<AppSection
		title={
			<React.Fragment>
				<Typography use="title" tag="h2">
					Progress
				</Typography>
				<ChipSet>
					<Chip>
						<ChipIcon leading use="timer" />
						<ChipText>29 minutes 15 seconds</ChipText>
					</Chip>
				</ChipSet>
			</React.Fragment>
		}
		content={<React.Fragment>{JSON.stringify(stages)}</React.Fragment>}
	/>
)
