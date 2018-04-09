// @flow

import * as React from 'react'
import styled, { keyframes } from 'styled-components'
import prettyMs from 'pretty-ms'

import { ChipSet, Chip, ChipIcon, ChipText } from 'rmwc/Chip'
import { Typography } from 'rmwc/Typography'
import { AppSection } from './components/app-section'
import type { SerializedStage } from '../../server/server/job'

type Props = {
	stages: Map<string, SerializedStage>,
}

export const ProgressSection = ({ stages }: Props) => {
	let stageArray = [...stages.entries()]

	let totalDuration = [...stages.values()]
		.filter(s => s.duration)
		.map(s => s.duration)
		.reduce((acc, time) => acc + time, 0)

	return (
		<AppSection
			expanded={true}
			title={
				<React.Fragment>
					<Typography use="title" tag="h2">
						Progress
					</Typography>
					<ChipSet>
						<Chip>
							<ChipIcon leading use="timer" />
							<ChipText>{prettyMs(totalDuration)}</ChipText>
						</Chip>
					</ChipSet>
				</React.Fragment>
			}
			content={
				<ProgressContainer>
					{stageArray.map(([key, stage]) => (
						<ProgressDot key={key} label={key} stage={stage} />
					))}
				</ProgressContainer>
			}
		/>
	)
}

type DotProps = {
	label: string,
	stage: SerializedStage,
}

const ProgressDot = ({ label, stage }: DotProps) => {
	return (
		<LoadingSegment status={stage.status} cached={stage.wasCached}>
			<LoadingIcon status={stage.status} />
			<LoadingLabel>{label}</LoadingLabel>
			<LoadingTimer>
				{stage.duration ? prettyMs(stage.duration) : null}
			</LoadingTimer>
		</LoadingSegment>
	)
}

const ProgressContainer = styled.div`
	display: flex;
	flex-direction: row;
	flex-wrap: wrap;
`

const LoadingSegment = styled.div`
	flex: 1;

	display: flex;
	flex-direction: column;
	align-items: center;
	color: ${({ status, cached }) =>
		cached
			? 'var(--green)'
			: status === 'errored'
				? 'var(--red)'
				: status === 'completed' ? 'var(--navy)' : 'var(--blue)'};
`

const LoadingIcon = styled.div`
	height: 30px;
	width: 30px;
	border: 2px solid currentColor;
	margin-bottom: 0.5em;
	border-radius: 17px;
	text-align: center;
	display: flex;
	align-items: center;
	justify-content: center;
	position: relative;
	box-sizing: content-box;

	&::before {
		animation: ${({ status }) =>
			status === 'active' ? `${pulse} 2s infinite` : ''};
		content: '';
		background-color: currentColor;
		border-radius: 17px;
		transition: all 0.35s ease-out;
		height: ${({ status }) =>
			status === 'active' ? '16px' : status === 'completed' ? '32px' : '0px'};
		width: ${({ status }) =>
			status === 'active' ? '16px' : status === 'completed' ? '32px' : '0px'};
	}
`

const LoadingLabel = styled.div`
	text-align: center;
`

const LoadingTimer = styled.div`
	font-size: 0.85em;
`

let pulse = keyframes`
	0% {
		transform: scale3d(0.9, 0.9, 0.9);
	}
	50% {
		transform: scale3d(1.3, 1.3, 1.3);
	}
	100% {
		transform: scale3d(0.9, 0.9, 0.9);
	}
`
