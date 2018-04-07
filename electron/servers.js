// @flow

import Emittery from 'emittery'

export type ServerStateEnum = 'up' | 'down'

export const SERVER_LIST = [
	{ label: 'thing3.CS', value: 'ws://thing3.cs.stolaf.edu:80' },
	{ label: 'thing3.CS (dev)', value: 'ws://thing3.cs.stolaf.edu:81' },
	{ label: 'gpu.CS', value: 'ws://gpu.cs.stolaf.edu:8080' },
	{ label: 'localhost (dev)', value: 'ws://localhost:8080' },
]

export type Pipeline = {}
export type Stage = {}
export type Job = {}

export class Server {
	url: ?string = null
	socket: ?WebSocket = null
	emitter: Emittery = new Emittery()

	activePipeline: ?Pipeline = null
	stages: Array<Stage> = []

	constructor(url: string) {
		this.url = url
		this.socket = new WebSocket(this.url)

		// $FlowExpectedError Cannot call this.socket.addEventListener
		this.socket.addEventListener('message', this._socketMessage)
		// $FlowExpectedError Cannot call this.socket.addEventListener
		this.socket.addEventListener('disconnect', this._socketDisconnect)
		// $FlowExpectedError Cannot call this.socket.addEventListener
		this.socket.addEventListener('error', this._socketError)
		// $FlowExpectedError Cannot call this.socket.addEventListener
		this.socket.addEventListener('exit', this._socketExit)

		this.emitter.onAny(console.info.bind(console, `server: ${url}`))
	}

	_socketMessage = ({ data }: MessageEvent) => {
		if (typeof data !== 'string') {
			return
		}

		let parsed = JSON.parse(data)
		try {
			let payload = JSON.parse(parsed.payload)
			switch (parsed.type) {
				case 'stage-start':
				case 'stage-end':
				case 'stage-error': {
					this._updateStages(parsed.type, payload)
					break
				}
				case 'ready': {
					this._requestPipelineList()
					break
				}
				default: {
					this.emitter.emit(parsed.type, payload)
				}
			}
		} catch (err) {
			this.emitter.emit('error', { error: err.message })
		}
	}

	_socketDisconnect = () => {
		this.emitter.emit('exit')
	}

	_socketError = (err: Error) => {
		if (!err) {
			return
		}

		this.emitter.emit('error', err)
	}

	_socketExit = () => {
		this.emitter.emit('exit')
	}

	_socketSend = (packet: { type: string }) => {
		if (!this.socket) {
			return
		}

		if (this.socket.readyState !== 1) {
			throw new Error('socket not ready!')
		}

		this.socket.send(JSON.stringify(packet))
	}

	_requestPipelineList = () => {
		this._socketSend({ type: 'pipeline-list' })
	}

	_requestStepsForPipeline = (pipeline: string) => {
		this._socketSend({ type: 'pipeline-steps', pipeline: pipeline })
	}

	_updateStages = (event: string, updatedStage: Stage) => {
		this.stages[0] = updatedStage
		this.emitter.emit(event, this.stages)
	}

	submitJob = (args: {
		pipeline: string,
		fileName: string,
		fileContents: string,
	}) => {
		const { pipeline, fileName, fileContents } = args
		this._socketSend({
			type: 'start',
			pipeline,
			filepath: fileName,
			data: fileContents,
		})
	}

	destroy = () => {
		this.emitter.clearListeners()
		// $FlowExpectedError Cannot call this.socket.removeEventListener
		this.socket && this.socket.removeEventListener('message', this._dispatch)
		this.socket = null
	}

	onError = (listener: ({ error: string }) => any) => {
		this.emitter.on('error', listener)
	}

	onUpOrDown = (listener: boolean => any) => {
		this.emitter.on('up', listener)
		this.emitter.on('down', listener)
	}

	onListPipelines = (listener: (Array<Pipeline>) => any) => {
		this.emitter.on('list-pipelines', listener)
	}

	onListStages = (listener: (Pipeline, Array<Stage>) => any) => {
		this.emitter.on('list-stages', listener)
	}

	onStageStateChange = (listener: (Array<Stage>) => any) => {
		this.emitter.on('stage-start', listener)
		this.emitter.on('stage-complete', listener)
		this.emitter.on('stage-error', listener)
	}

	onUptime = (listener: number => any) => {
		this.emitter.on('uptime', listener)
	}

	onOngoingJobs = (listener: (Array<Job>) => any) => {
		this.emitter.on('ongoing-jobs', listener)
	}

	onCompletedJobs = (listener: (Array<Job>) => any) => {
		this.emitter.on('completed-jobs', listener)
	}
}
