// @flow

import * as React from 'react'

import {
	Toolbar,
	ToolbarRow,
	ToolbarSection,
	ToolbarTitle,
	ToolbarIcon,
} from 'rmwc/Toolbar'
import { ChipSet, Chip, ChipIcon, ChipText } from 'rmwc/Chip'
import { Select } from 'rmwc/Select'
import prettyMs from 'pretty-ms'

import styled from 'styled-components'

type ServerStateEnum = 'up' | 'down'

type Props = {
	servers: Array<{ label: string, value: string }>,
	onServerChange: string => any,
	serverState: ServerStateEnum,
	onReload: () => any,
	serverUptime: ?number,
}

export const AppToolbar = (props: Props) => {
	const { servers, onServerChange, serverState, onReload, serverUptime } = props

	let uptime = prettyMs(serverUptime || 0, { verbose: true })
		.split(' ')
		.slice(0, 2)
		.join(' ')

	return (
		<Toolbar>
			<ToolbarRow>
				<ToolbarSection alignStart shrinkToFit>
					<ToolbarTitle>HybSearch</ToolbarTitle>
				</ToolbarSection>

				<ServerSection alignStart>
					<ServerSelect
						box={true}
						options={servers}
						onChange={ev => onServerChange(ev.currentTarget.value)}
						label="Server"
					/>

					<ChipSet>
						{serverState === 'up' ? (
							<ServerStatusChip>
								<ChipIcon leading use="cloud" />
								<ChipText>Up ({uptime})</ChipText>
							</ServerStatusChip>
						) : (
							<ServerStatusChip>
								<ChipIcon leading use="cloud_off" />
								<ChipText>Down</ChipText>
							</ServerStatusChip>
						)}
					</ChipSet>
				</ServerSection>

				<ToolbarSection alignEnd shrinkToFit>
					<ToolbarIcon use="refresh" onClick={onReload} />
				</ToolbarSection>
			</ToolbarRow>
		</Toolbar>
	)
}

const ServerSection = styled(ToolbarSection)`
	align-items: center;
	padding-left: 12px;
	padding-top: 8px;
	padding-bottom: 8px;
`

const ServerSelect = styled(Select)`
	& select {
		background-color: var(--mdc-theme-background);
		border-radius: 4px !important;
	}

	& .mdc-select__bottom-line {
		display: none;
	}
`

const ServerStatusChip = styled(Chip)`
	background-color: var(--mdc-theme-background) !important;
`
