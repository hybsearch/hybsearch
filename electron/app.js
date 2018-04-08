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
	type Stage,
	type Job,
} from './servers'

type Props = {}

type State = {
	server: ?Server,
	serverState: ServerStateEnum,
	nonmonophyly: Array<NonMonoPair>,
	newick: any,
	pipelines: Array<Pipeline>,
	stages: ?Array<Stage>,
	pipeline: ?Pipeline,
	uptime: ?number,
	activeJobs: Array<Job>,
	completedJobs: Array<Job>,
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

	receiveServerOnUpOrDown = (status: 'up' | 'down') => {
		this.setState(() => ({ serverState: status }))
	}

	handleServerError = ({ error }: { error: string }) => {
		this.setState(() => ({ serverError: error }))
	}

	handleJob = ({
		stages,
		jobId,
	}: {
		stages: Array<Stage>,
		jobId: string,
	}) => {
		this.setState(() => ({ jobId, stages, running: true }))
	}

	handleStage = (args: {
		changedStage: Stage,
		changedStageIndex: number,
	}) => {
		let { changedStage, changedStageIndex } = args

		this.setState(state => {
			let editedStages = [...(state.stages || [])]
			editedStages[changedStageIndex] = changedStage
			return { stages: editedStages }
		})
	}

	handleServerChange = async (newServerAddress: string) => {
		this.state.server && this.state.server.destroy()

		let server = new Server(newServerAddress)

		server.onReady(this.setupNewServer)
	}

	setupNewServer = async (server: Server) => {
		// now fetch a bunch of stuff in parallel
		let [pipelines, uptime, activeJobs, completedJobs] = await Promise.all([
			server.getPipelines(),
			server.getUptime(),
			server.getActiveJobs(),
			server.getCompletedJobs(),
		])

		/////

		server.onError(this.handleServerError)
		server.onUpOrDown(this.receiveServerOnUpOrDown)
		server.onJobUpdate(this.handleStage)

		// server
		// 	.submitJob({ pipeline: 'beast', fileName: '', fileContents: '' })
		// 	.then(({ stages, jobId }) => this.handleJob({ stages, jobId }))
		//
		// server
		// 	.watchJob({ jobId: 'f45d3a1' })
		// 	.then(({ stages, jobId }) => this.handleJob({ stages, jobId }))

		// server.onJobUpdate(({ jobId, changedStage, changedStageIndex }) =>
		// 	this.handleStage({ jobId, changedStage, changedStageIndex })
		// )

		this.setState(() => ({
			pipelines,
			uptime,
			activeJobs,
			completedJobs,
			server,
		}))
	}

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
					<InputSection
						onSubmit={this.handleAppPipelineStart}
						onChoose={this.handleAppPipelineWatch}
						shouldClose={this.state.running}
					/>

					{this.state.stages ? (
						<ProgressSection stages={this.state.stages} />
					) : null}

					{this.state.serverError ? (
						<ErrorSection error={this.state.serverError} />
					) : null}
					{this.state.nonmonophyly ? (
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
