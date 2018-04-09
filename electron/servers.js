// @flow

import Emittery from 'emittery'
import uuid from 'uuid/v4'
import isDev from 'electron-is-dev'

export type ServerStateEnum = 'up' | 'down'

export const SERVER_LIST = [
	{ label: 'thing3.CS', value: 'ws://thing3.cs.stolaf.edu:80' },
	{ label: 'thing3.CS (dev)', value: 'ws://thing3.cs.stolaf.edu:81' },
	{ label: 'gpu.CS', value: 'ws://gpu.cs.stolaf.edu:8080' },
	{ label: 'localhost (dev)', value: 'ws://localhost:8080' },
]
if (isDev) {
	SERVER_LIST.reverse()
}

export type Pipeline = {
	name: string,
	pipeline: Array<Stage>,
}

export type Stage = {
	key: string,
	value?: string,
	cached?: boolean,
	timeTaken?: number,
}

export type Job = {
	id: string,
	name: ?string,
	hidden: boolean,
	status: string,
	pipeline: Pipeline,
	started: string,
	duration: number | null,
}

export class Server {
	url: ?string = null
	socket: ?WebSocket = null
	emitter: Emittery = new Emittery()

	pipeline: ?Pipeline = null

	constructor(url: string) {
		this.url = url
		this.socket = new WebSocket(this.url)

		let socket = (this.socket: any)
		socket.addEventListener('message', this.handleMessage)
		socket.addEventListener('disconnect', this.handleDisconnect)
		socket.addEventListener('error', this.handleError)
		socket.addEventListener('exit', this.handleExit)

		this.emitter.onAny(console.info.bind(console, `${url} <`))
	}

	//
	//
	//

	handleMessage = ({ data }: MessageEvent) => {
		if (typeof data !== 'string') {
			console.warn("dropping message because it wasn't a string", data)
			return
		}

		let parsed = JSON.parse(data)
		try {
			let payload = parsed.payload
			this.emitter.emit(parsed.type, payload)
		} catch (err) {
			this.emitter.emit('error', { error: err.message })
		}
	}

	handleDisconnect = () => {
		this.emitter.emit('exit')
	}

	handleError = (err: Error) => {
		if (!err) {
			return
		}

		this.emitter.emit('error', err)
	}

	handleExit = () => {
		this.emitter.emit('exit')
	}

	//
	//
	//

	sendMessage = (packet: { type: string }) => {
		if (!this.socket) {
			return
		}

		if (this.socket.readyState !== 1) {
			throw new Error('socket not ready!')
		}

		this.socket.send(JSON.stringify(packet))
	}

	waitForResponse = (packet: { type: string }) => {
		let id = uuid()

		let promise = this.emitter.once(`resp-${id}`)

		// send the request
		let requestWithId = Object.assign({}, packet, { requestId: id })
		this.sendMessage(requestWithId)

		return promise
	}

	//
	//
	//

	destroy = () => {
		this.emitter.clearListeners()

		if (this.socket) {
			this.socket.close()

			let s = (this.socket: any)
			s.removeEventListener('message', this.handleMessage)
			s.removeEventListener('disconnect', this.handleDisconnect)
			s.removeEventListener('error', this.handleError)
			s.removeEventListener('exit', this.handleExit)
		}

		this.socket = null
		this.emitter = null
	}

	onReady = (listener: Server => any) => {
		this.emitter.on('open', () => listener(this))
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

	onJobUpdate = (listener: Stage => any) => {
		this.emitter.on('stage-start', listener)
		this.emitter.on('stage-complete', listener)
		this.emitter.on('stage-error', listener)
	}

	//
	//
	//

	getPipelines = (): Promise<{ pipelines: Array<Pipeline> }> => {
		return this.waitForResponse({ type: 'get-pipelines' })
	}

	getUptime = (): Promise<{ uptime: number }> => {
		return this.waitForResponse({ type: 'get-uptime' })
	}

	getActiveJobs = (): Promise<{ jobs: Array<Job> }> => {
		return this.waitForResponse({ type: 'get-active-jobs' })
	}

	getCompletedJobs = (): Promise<{ jobs: Array<Job> }> => {
		return this.waitForResponse({ type: 'get-completed-jobs' })
	}

	submitJob = (args: {
		pipeline: string,
		fileName: string,
		fileContents: string,
	}): Promise<{ stages: Array<string>, jobId: string }> => {
		const { pipeline, fileName, fileContents } = args

		return this.waitForResponse({
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
	}): Promise<{ exists: boolean, stages: Array<string>, jobId: string }> => {
		const { jobId } = args

		return this.waitForResponse({
			type: 'watch-pipeline',
			payload: { jobId: jobId },
		})
	}

	cancelJob = (args: {
		jobId: string,
	}): Promise<{ exists: boolean, cancelled: boolean, jobId: string }> => {
		const { jobId } = args

		return this.waitForResponse({
			type: 'cancel-pipeline',
			payload: { jobId: jobId },
		})
	}
}
