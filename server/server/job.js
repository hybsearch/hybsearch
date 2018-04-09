// @flow
'use strict'

const childProcess = require('child_process')
const path = require('path')
const hashString = require('../lib/hash-string')
const pipelines = require('./pipelines')
const flatten = require('lodash/flatten')
const uniq = require('lodash/uniq')

const WORKER_PATH = path.join(__dirname, 'worker', 'index.wrapper.js')

import { typeof WebSocket } from 'ws'
import type { SerializedPipelineRecord } from './pipelines/types'
import type {
	WorkerMessage,
	StageStarted,
	StageCompleted,
	ErrorMessage as WorkerErrorMessage,
} from './worker'

type Args = {
	pipeline: string,
	filepath: ?string,
	data: string,
}

type JobStatusEnum = 'inactive' | 'active' | 'completed' | 'error'

export type SerializedJob = {|
	id: string,
	name: ?string,
	hidden: boolean,
	status: string,
	pipeline: SerializedPipelineRecord,
	started: string,
	duration: number | null,
|}

export type SerializedStage = {
	key: string,
	value: mixed,
	error: ?string,
	wasCached: null | boolean,
	duration: null | number,
	status: 'active' | 'completed' | 'error' | 'inactive',
}

type ErrorMessage = {
	type: 'error',
	payload: { message: string },
}

type ExitMessage = {
	type: 'exit',
	payload: { code: number, signal: string },
}

export type MessageForClient =
	| StageCompleted
	| StageStarted
	| ErrorMessage
	| WorkerErrorMessage
	| ExitMessage

module.exports = class Job {
	id: string
	name: ?string
	process: childProcess.ChildProcess
	pipeline: SerializedPipelineRecord
	started: number = new Date()
	duration: number | null = null
	hidden: boolean = false
	connectedClients: Array<{ socket: WebSocket, id: string }> = []
	status: JobStatusEnum = 'inactive'
	messages: Array<MessageForClient> = []
	stages: Map<string, SerializedStage> = new Map()

	constructor(messagePayload: Args) {
		this.id = hashString(messagePayload.data)
		this.name = messagePayload.filepath

		// record the pipeline that we'll be using
		let destinationPipeline = pipelines.get(messagePayload.pipeline)
		this.pipeline = JSON.parse(JSON.stringify(destinationPipeline))
		this.stages = this.initStageMap()

		// set up the worker process
		this.process = childProcess.fork(WORKER_PATH)

		// listen to the worker
		this.process.on('message', this.handleMessage)
		this.process.on('error', this.handleError)
		this.process.on('exit', this.handleExit)

		// kick it off
		this.status = 'active'
		this.process.send(messagePayload)
	}

	//
	//
	//

	// stages = () => {
	// 	return uniq(flatten(this.pipeline.pipeline.map(stage => stage.output)))
	// }

	initStageMap = () => {
		let stages: Map<string, SerializedStage> = new Map()
		let stageNames = uniq(
			flatten(this.pipeline.pipeline.map(s => s.output))
		)
		stageNames.forEach(name =>
			stages.set(name, {
				key: name,
				value: null,
				wasCached: null,
				duration: null,
				error: null,
				status: 'inactive',
			})
		)
		return stages
	}

	serialize = (): SerializedJob => {
		return JSON.parse(
			JSON.stringify({
				id: this.id,
				name: this.name,
				hidden: this.hidden,
				status: this.status,
				pipeline: this.pipeline,
				started: this.started,
				duration: this.duration,
			})
		)
	}

	//
	//
	//

	addClient = (client: WebSocket, clientId: string) => {
		this.connectedClients = [
			...this.connectedClients,
			{ socket: client, id: clientId },
		]

		// catch the new client up with the old messages
		this.messages.forEach(msg => client.send(JSON.stringify(msg)))
	}

	hasClient = (clientId: string): boolean => {
		return this.connectedClients.some(client => client.id === clientId)
	}

	removeClient = (clientId: string) => {
		this.connectedClients = this.connectedClients.filter(
			client => client.id !== clientId
		)
	}

	messageClients = (message: MessageForClient) => {
		let stringified = JSON.stringify(message)
		this.connectedClients.forEach(client => client.socket.send(stringified))
	}

	//
	//
	//

	handleMessage = (message: WorkerMessage) => {
		// The 'message' event is triggered when a child process uses
		// process.send() to send messages.

		let affectedStages =
			message.type === 'stage-errored' ? [] : [message.payload.key]

		switch (message.type) {
			case 'stage-started': {
				let { key } = message.payload
				this.stages.set(message.payload.key, {
					key,
					value: null,
					wasCached: null,
					duration: null,
					error: null,
					status: 'active',
				})
				break
			}
			case 'stage-completed': {
				let { key, value, wasCached, duration } = message.payload
				this.stages.set(message.payload.key, {
					key,
					value,
					wasCached,
					duration,
					error: null,
					status: 'completed',
				})
				break
			}
			case 'stage-errored': {
				let activeStages = [...this.stages.values()].filter(
					v => v.status === 'active'
				)

				affectedStages = activeStages.map(s => s.key)

				for (let stage of activeStages) {
					this.stages.set(
						stage.key,
						Object.assign({}, stage, {
							status: 'error',
							error: message.payload.message,
							duration: message.payload.duration,
						})
					)
				}

				break
			}
			default:
				;(message.type: empty)
		}

		for (let key of affectedStages) {
			let messageToSend: any = {
				type: message.type,
				payload: this.stages.get(key),
			}

			// store the message locally so we can replay to new clients
			this.messages.push(messageToSend)

			// log it
			console.log(
				'<job<',
				JSON.parse(
					JSON.stringify(messageToSend, (key, val) => {
						if (typeof val === 'string' && val.length > 100) {
							return val.substr(0, 99) + '…'
						}
						return val
					})
				)
			)

			// forward the message to the GUI
			this.messageClients(messageToSend)
		}

		// if the pipeline has finished, detach ourselves so the
		// child_process can exit
		if (message.type === 'stage-errored') {
			this.terminate()
		}
	}

	handleError = (error: Error) => {
		// The 'error' event is emitted whenever:
		// 1. The process could not be spawned, or
		// 2. The process could not be killed, or
		// 3. Sending a message to the child process failed.
		this.status = 'error'
		this.messageClients({
			type: 'error',
			payload: { message: error.message },
		})
		this.terminate()
	}

	handleExit = (code: number, signal: string) => {
		// The 'exit' event is emitted after the child process ends. If the
		// process exited, code is the final exit code of the process,
		// otherwise null. If the process terminated due to receipt of a
		// signal, signal is the string name of the signal, otherwise null.
		// One of the two will always be non-null.
		this.status = 'completed'
		this.messageClients({
			type: 'exit',
			payload: { code, signal },
		})
		this.duration = Date.now() - this.started
	}

	//
	//
	//

	terminate = () => {
		if (this.process.connected) {
			this.process.kill()
			this.process.disconnect()
		}
		this.duration = Date.now() - this.started
	}
}
