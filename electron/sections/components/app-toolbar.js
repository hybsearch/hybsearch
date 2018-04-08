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

import styled from 'styled-components'

type ServerStateEnum = 'up' | 'down'

type Props = {
	servers: Array<{ label: string, value: string }>,
	onServerChange: string => any,
	serverState: ServerStateEnum,
	onReload: () => any,
}

export const AppToolbar = (props: Props) => {
	const { servers, onServerChange, serverState, onReload } = props

	return (
		<RaisedToolbar>
			<ToolbarSection alignStart shrinkToFit>
				<ToolbarTitle>HybSearch</ToolbarTitle>
			</ToolbarSection>

			<ToolbarSection alignStart>
				<Select
					box={true}
					options={servers}
					onChange={ev => onServerChange(ev.currentTarget.value)}
					label="Server"
					className="server-selector"
				/>

				<ChipSet>
					{serverState === 'up' ? (
						<Chip className="server-status">
							<ChipIcon leading use="cloud" />
							<ChipText>Up{/* (3 days)*/}</ChipText>
						</Chip>
					) : (
						<Chip className="server-status">
							<ChipIcon leading use="cloud_off" />
							<ChipText>Down</ChipText>
						</Chip>
					)}
				</ChipSet>
			</ToolbarSection>

			<ToolbarSection alignEnd shrinkToFit>
				<ToolbarIcon use="refresh" onClick={onReload} />
			</ToolbarSection>
		</RaisedToolbar>
	)
}

const FixedToolbar = (props: any) => (
	<Toolbar fixed={true} {...props}>
		<ToolbarRow>{props.children}</ToolbarRow>
	</Toolbar>
)

const RaisedToolbar = styled(FixedToolbar)`
	position: relative;
`
