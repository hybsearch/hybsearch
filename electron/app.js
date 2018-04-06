// @flow

import * as React from 'react'
import styled from 'styled-components'

import { AppToolbar } from './sections/components/app-toolbar'
import { InputSection } from './sections/input'
import { ProgressSection } from './sections/progress'
import { ErrorSection } from './sections/error'
import {
	NonmonophylyListSection,
	type NonMonoPair,
} from './sections/nonmono-list'
import { PhylogramSection } from './sections/phylogram'

import { SERVER_LIST, type ServerStateEnum } from './servers'

type Props = {}

type State = {
	server: ?WebSocket,
	serverState: ServerStateEnum,
	nonmonophyly: Array<NonMonoPair>,
}

export class App extends React.Component<Props, State> {
	state = {
		server: null,
		serverState: 'down',
		nonmonophyly: [],
	}

	handleAppReload = () => {}

	handleServerChange = (newServerAddress: string) => {}

	render() {
		return (
			<React.Fragment>
				<AppToolbar
					onReload={this.handleAppReload}
					onServerChange={this.handleServerChange}
					serverState={this.state.serverState}
					servers={SERVER_LIST}
				/>

				<Content>
					<InputSection />
					<ProgressSection />
					<React.Fragment>
						<ErrorSection />
						<NonmonophylyListSection nonmonophyly={this.state.nonmonophyly} />
						<PhylogramSection />
					</React.Fragment>
				</Content>
			</React.Fragment>
		)
	}
}

const Content = styled.main`
	padding: 1.5rem;
`
