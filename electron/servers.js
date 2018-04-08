// @flow

import Emittery from 'emittery'
import uuid from 'uuid/v4'

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
		this.socket.addEventListener('message', this.socketMessage)
		// $FlowExpectedError Cannot call this.socket.addEventListener
		this.socket.addEventListener('disconnect', this.socketDisconnect)
		// $FlowExpectedError Cannot call this.socket.addEventListener
		this.socket.addEventListener('error', this.socketError)
		// $FlowExpectedError Cannot call this.socket.addEventListener
		this.socket.addEventListener('exit', this.socketExit)

		this.emitter.onAny(console.info.bind(console, `server: ${url}`))
	}

	onReady = (listener: Server => any) => {
		// $FlowExpectedError Cannot call this.socket.addEventListener
		return this.socket.addEventListener('open', () => listener(this))
	}

	socketMessage = ({ data }: MessageEvent) => {
		if (typeof data !== 'string') {
			return
		}

		let parsed = JSON.parse(data)
		try {
			let payload = JSON.parse(parsed.payload)
			this.emitter.emit(parsed.type, payload)
		} catch (err) {
			this.emitter.emit('error', { error: err.message })
		}
	}

	socketDisconnect = () => {
		this.emitter.emit('exit')
	}

	socketError = (err: Error) => {
		if (!err) {
			return
		}

		this.emitter.emit('error', err)
	}

	socketExit = () => {
		this.emitter.emit('exit')
	}

	socketSend = (packet: { type: string }) => {
		if (!this.socket) {
			return
		}

		if (this.socket.readyState !== 1) {
			throw new Error('socket not ready!')
		}

		this.socket.send(JSON.stringify(packet))
	}

	socketSendPromise = (packet: { type: string }) => {
		let id = uuid()

		// $FlowExpectedError Missing type annotation for R.
		let promise = new Promise(resolve =>
			this.emitter.once(`response-to-${id}`, resolve)
		)

		// send the request
		this.socketSend(Object.assign({}, packet, { requestId: id }))

		return promise
	}

	getPipelines = (): Promise<Array<Pipeline>> => {
		return this.socketSendPromise({ type: 'pipeline-list' })
	}

	getUptime = (): Promise<number> => {
		return this.socketSendPromise({ type: 'uptime' })
	}

	getActiveJobs = (): Promise<Array<Job>> => {
		return this.socketSendPromise({ type: 'active-jobs' })
	}

	getCompletedJobs = (): Promise<Array<Job>> => {
		return this.socketSendPromise({ type: 'completed-jobs' })
	}

	submitJob = (args: {
		pipeline: string,
		fileName: string,
		fileContents: string,
	}): Promise<{ stages: Array<Stage>, jobId: string }> => {
		const { pipeline, fileName, fileContents } = args

		return this.socketSendPromise({
			type: 'start-pipeline',
			payload: {
				pipeline: pipeline,
				filepath: fileName,
				data: fileContents,
			},
		})
	}

	watchJob = (args: {
		jobId: string,
	}): Promise<{ stages: Array<Stage>, jobId: string }> => {
		const { jobId } = args

		return this.socketSendPromise({
			type: 'watch-pipeline',
			payload: { jobId: jobId },
		})
	}

	destroy = () => {
		this.emitter.clearListeners()

		let s = this.socket

		// $FlowExpectedError Cannot call this.socket.removeEventListener
		s && s.removeEventListener('message', this.socketMessage)
		// $FlowExpectedError Cannot call this.socket.removeEventListener
		s && s.removeEventListener('disconnect', this.socketDisconnect)
		// $FlowExpectedError Cannot call this.socket.removeEventListener
		s && s.removeEventListener('error', this.socketError)
		// $FlowExpectedError Cannot call this.socket.removeEventListener
		s && s.removeEventListener('exit', this.socketExit)

		this.socket = null
	}

	onError = (listener: ({ error: string }) => any) => {
		this.emitter.on('error', listener)
	}

	onUpOrDown = (listener: ('up' | 'down') => any) => {
		this.emitter.on('up', () => listener('up'))
		this.emitter.on('ready', () => listener('up'))
		this.emitter.on('down', () => listener('down'))
		this.emitter.on('exit', () => listener('down'))
	}

	onJobUpdate = (
		listener: ({
			jobId: string,
			changedStage: Stage,
			changedStageIndex: number,
		}) => any
	) => {
		this.emitter.on('stage-start', listener)
		this.emitter.on('stage-complete', listener)
		this.emitter.on('stage-error', listener)
	}
}
