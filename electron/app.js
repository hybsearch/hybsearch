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

import {
	Server,
	SERVER_LIST,
	type ServerStateEnum,
	type Pipeline,
} from './servers'
import type { SerializedStage, SerializedJob } from '../server/server/job'

type Props = {}

type State = {
	server: ?Server,
	serverState: ServerStateEnum,
	nonmonophyly: Array<NonMonoPair>,
	newick: any,
	pipelines: Array<Pipeline>,
	stages: ?Map<string, SerializedStage>,
	pipeline: ?Pipeline,
	uptime: ?number,
	activeJobs: Array<SerializedJob>,
	completedJobs: Array<SerializedJob>,
	serverError: ?string,
	jobId: ?string,
	running: boolean,
}

export class App extends React.Component<Props, State> {
	state = {
		server: null,
		serverState: 'down',
		nonmonophyly: [],
		pipelines: [],
		serverError: null,
		stages: null,
		pipeline: null,
		uptime: null,
		activeJobs: [],
		completedJobs: [],
		jobId: null,
		newick: null,
		running: false,
	}

	componentDidMount() {
		this.handleServerChange(SERVER_LIST[0].value)
	}

	// TODO: how to extract nonmonophyly / newick data into named keys

	handleAppReload = () => {
		window.location.reload()
	}

	//
	//
	//

	handleServerOnUpOrDown = (status: 'up' | 'down') => {
		this.setState(() => ({ serverState: status }))
	}

	handleServerError = ({ error }: { error: string }) => {
		this.setState(() => ({ serverError: error }))
	}

	handleJob = (args: {
		stages: Map<string, SerializedStage>,
		jobId: string,
	}) => {
		let { stages, jobId } = args

		this.setState(() => ({ jobId, running: true, stages: stages }))
	}

	handleStage = (stage: SerializedStage) => {
		this.setState(state => {
			let stages = new Map(state.stages)
			stages.set(stage.key, stage)
			return { stages: stages }
		})
	}

	//
	//
	//

	setupNewServer = async (server: Server) => {
		this.setState(() => ({ serverState: 'up' }))

		// hook up the listeners
		server.onError(this.handleServerError)
		server.onUpOrDown(this.handleServerOnUpOrDown)
		server.onJobUpdate(this.handleStage)

		// now fetch a bunch of stuff in parallel
		let [
			{ pipelines },
			{ uptime },
			{ jobs: activeJobs },
			{ jobs: completedJobs },
		] = await Promise.all([
			server.getPipelines(),
			server.getUptime(),
			server.getActiveJobs(),
			server.getCompletedJobs(),
		])

		// stick everything into state
		this.setState(() => ({
			serverState: 'up',
			pipelines,
			uptime,
			activeJobs,
			completedJobs,
		}))
	}

	//
	//
	//

	handleServerChange = async (newServerAddress: string) => {
		if (this.state.server) {
			this.state.server.destroy()

			this.setState(() => ({
				serverState: 'down',
				pipelines: [],
				uptime: null,
				activeJobs: [],
				completedJobs: [],
				server: null,
			}))
		}

		let server = new Server(newServerAddress)
		global.__server = server

		this.setState(() => ({ server: server }))

		server.onReady(this.setupNewServer)
	}

	//
	//
	//

	handleAppPipelineStart = (args: {
		pipeline: string,
		fileName: string,
		fileContents: string,
	}) => {
		if (!this.state.server) {
			return
		}

		this.state.server.submitJob(args).then(this.handleJob)
	}

	handleAppPipelineWatch = (args: { jobId: string }) => {
		if (!this.state.server) {
			return
		}

		this.state.server.watchJob(args).then(this.handleJob)
	}

	//
	//
	//

	render() {
		return (
			<React.Fragment>
				<AppToolbar
					onReload={this.handleAppReload}
					onServerChange={this.handleServerChange}
					serverState={this.state.serverState}
					serverUptime={this.state.uptime}
					servers={SERVER_LIST}
				/>

				<Content>
					<InputSection
						activeJobs={this.state.activeJobs}
						completedJobs={this.state.completedJobs}
						onSubmit={this.handleAppPipelineStart}
						onChoose={this.handleAppPipelineWatch}
						shouldClose={this.state.running}
						pipelines={this.state.pipelines}
					/>

					{this.state.stages ? (
						<ProgressSection stages={this.state.stages} />
					) : null}

					{this.state.serverError ? (
						<ErrorSection error={this.state.serverError} />
					) : null}

					{this.state.nonmonophyly.length ? (
						<NonmonophylyListSection
							nonmonophyly={this.state.nonmonophyly}
						/>
					) : null}

					{this.state.newick ? (
						<PhylogramSection newickData={this.state.newick} />
					) : null}
				</Content>
			</React.Fragment>
		)
	}
}

const Content = styled.main`
	padding: 1.5rem;
`
