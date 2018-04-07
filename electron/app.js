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
	type Stage,
	type Job,
} from './servers'

type Props = {}

type State = {
	server: ?Server,
	serverState: ServerStateEnum,
	nonmonophyly: Array<NonMonoPair>,
	serverPipelines: Array<Pipeline>,
	stages: ?Array<Stage>,
	pipeline: ?Pipeline,
	serverUptime: ?number,
	activeJobs: Array<Job>,
	completedJobs: Array<Job>,
	serverError: ?string,
}

export class App extends React.Component<Props, State> {
	state = {
		server: null,
		serverState: 'down',
		nonmonophyly: [],
		serverPipelines: [],
		serverError: null,
		stages: null,
		pipeline: null,
		serverUptime: null,
		activeJobs: [],
		completedJobs: [],
	}

	handleAppReload = () => {
		window.location.reload()
	}

	receiveServerOnUpOrDown = (isUp: boolean) => {
		this.setState(() => ({ serverState: isUp ? 'up' : 'down' }))
	}

	receiveServerPipelines = (pipelines: Array<Pipeline>) => {
		this.setState(() => ({ serverPipelines: pipelines }))
	}

	receiveServerStages = (pipeline: Pipeline, stages: Array<Stage>) => {
		this.setState(() => ({ stages: stages, pipeline: pipeline }))
	}

	receiveServerStageStateChange = (
		stages: Array<Stage>,
		changedStage: string
	) => {
		this.setState(() => ({ stages: stages }))

		if (changedStage === 'nonmonophyletic-sequences') {
		}
	}

	receiveServerUptime = (uptime: number) => {
		this.setState(() => ({ serverUptime: uptime }))
	}

	receiveServerOngoingJobs = (ongoing: Array<Job>) => {
		this.setState(() => ({ activeJobs: ongoing }))
	}

	receiveServerCompletedJobs = (completed: Array<Job>) => {
		this.setState(() => ({ completedJobs: completed }))
	}

	receiveServerError = ({ error }: { error: string }) => {
		this.setState(() => ({ serverError: error }))
	}

	receiveNonmonophyleticSequences = ({
		nonmonophyly,
	}: {
		nonmonophyly: Array<NonMonoPair>,
	}) => {
		this.setState(() => ({ nonmonophyly: nonmonophyly }))
	}

	handleServerChange = (newServerAddress: string) => {
		this.state.server && this.state.server.destroy()

		let server = new Server(newServerAddress)
		;async () => {
			let pipes = await server.getPipelines()
			let uptime = await server.getUptime()

			let activeJobs = await server.getActiveJobs()
			let completedJobs = await server.getCompletedJobs()

			server.listen('error', this.handleServerError)

			// server.listen('stage-start', this.handleStageStart)
			// server.listen('stage-end', this.handleStageEnd)
			// server.listen('stage-error', this.handleStageError)

			// server.listen('job-start', ({stages}) => this.handleJobStart())

			/////

			server
				.submitJob({ pipeline: 'beast' })
				.then(({ stages, jobId }) => this.handleJob({ stages, jobId }))

			server
				.watchJob({ jobId: 'f45d3a1' })
				.then(({ stages, jobId }) => this.handleJob({ stages, jobId }))

			server.onJobUpdate(({ jobId, changedStage, changedStageIndex }) =>
				this.handleStage({ jobId, changedStage, changedStageIndex })
			)
		}

		server.onError(this.receiveServerError)
		// server.onUpOrDown(this.receiveServerOnUpOrDown)
		// server.onListPipelines(this.receiveServerPipelines)
		// server.onListStages(this.receiveServerStages)
		server.onStageStateChange(this.receiveServerStageStateChange)
		// server.onUptime(this.receiveServerUptime)
		// server.onOngoingJobs(this.receiveServerOngoingJobs)
		// server.onCompletedJobs(this.receiveServerCompletedJobs)
		// server.onNonmonophyleticSequences(this.receiveNonmonophyleticSequences)

		this.setState(() => ({ server: server }))
	}

	handleAppPipelineStart = (args: {
		pipeline: string,
		fileName: string,
		fileContents: string,
	}) => {
		if (!this.state.server) {
			return
		}

		this.state.server.submitJob(args)
	}

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
					<InputSection onStart={this.handleAppPipelineStart} />
					<ProgressSection stages={this.state.stages} />
					<React.Fragment>
						{this.state.serverError ? (
							<ErrorSection error={this.state.serverError} />
						) : null}
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
