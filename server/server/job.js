// @flow
'use strict'

const childProcess = require('child_process')
const path = require('path')
const serializeError = require('serialize-error')
const hashString = require('../lib/hash-string')
const pipelines = require('./pipelines')

const WORKER_PATH = path.join(__dirname, 'pipeline', 'worker.js')

import { typeof WebSocket } from 'ws'
import type { SerializedPipelineRecord } from './pipelines/types'

type Args = {
	pipeline: string,
	filepath: ?string,
	data: string,
}

module.exports = class Job {
	id: string
	connectedClients: Array<{ socket: WebSocket, id: string }>
	status: 'inactive' | 'active' | 'completed' | 'error'
	process: childProcess.ChildProcess
	pipeline: SerializedPipelineRecord

	constructor(messagePayload: Args) {
		this.id = hashString(messagePayload.data)
		this.connectedClients = []
		this.status = 'inactive'

		// record the pipeline that we'll be using
		let destinationPipeline = pipelines.get(messagePayload.pipeline)
		this.pipeline = JSON.parse(JSON.stringify(destinationPipeline))

		// set up the worker process
		this.process = childProcess.fork(WORKER_PATH)

		// listen to the worker
		this.process.on('message', this.handleMessage)
		this.process.on('error', this.handleError)
		this.process.on('exit', this.handleExit)

		// kick it off
		this.process.send(messagePayload)
	}

	serialize = () => {
		return JSON.stringify({
			id: this.id,
			status: this.status,
			pipeline: this.pipeline,
		})
	}

	addClient = (client: WebSocket, clientId: string) => {
		return [...this.connectedClients, { socket: client, id: clientId }]
	}

	hasClient = (clientId: string): boolean => {
		return this.connectedClients.some(client => client.id === clientId)
	}

	removeClient = (clientId: string) => {
		this.connectedClients = this.connectedClients.filter(
			client => client.id !== clientId
		)
	}

	messageClients = (message: mixed) => {
		let stringified = JSON.stringify(message)
		this.connectedClients.forEach(client => client.socket.send(stringified))
	}

	handleMessage = (message: { [key: string]: any, type: string }) => {
		// The 'message' event is triggered when a child process uses
		// process.send() to send messages.

		// log it
		console.log('<', message)

		// forward the message to the GUI
		this.messageClients(message)

		// if the pipeline has finished, detach ourselves so the child_process
		// can exit
		if (message.type === 'error') {
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
			payload: { error: serializeError(error) },
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
	}

	terminate = () => {
		if (this.process.connected) {
			this.process.kill()
			this.process.disconnect()
		}
	}
}