'use strict'

const childProcess = require('child_process')
const path = require('path')
const hasha = require('hasha')
const hashObj = require('hash-obj')
const { trimMessage } = require('./lib/trim-message')

const workerPath = path.join(__dirname, 'pipeline', 'worker.js')

class Job {
	constructor(payload) {
		this.initialPayload = payload
		let { pipeline, data, filepath, options = {}, ip } = payload

		this.status = 'inactive'
		this.clients = new Set()
		this.workerMessages = []
		this.startTime = null
		this.endTime = null
		this.duration = 0

		this.pipeline = pipeline
		this.data = data
		this.options = options
		this.dataHash = hasha(data)
		this.optionsHash = hashObj(options)
		this.hash = hasha([this.dataHash, this.optionsHash])
		this.filepath = filepath
		this.id = this.hash.substr(0, 32)
		this.initialClientAddress = ip

		this.addClient = this.addClient.bind(this)
		this.removeClient = this.removeClient.bind(this)
		this.handleClientMessage = this.handleClientMessage.bind(this)
		this.handleWorkerMessage = this.handleWorkerMessage.bind(this)
		this.broadcast = this.broadcast.bind(this)
		this.complete = this.complete.bind(this)
		this.stop = this.stop.bind(this)
		this.restart = this.restart.bind(this)

		this.initChild()
	}

	initChild() {
		this.child = childProcess.fork(workerPath)
		this.child.on('message', this.handleWorkerMessage)
	}

	addClient(socket, ip) {
		socket.__ip = ip
		console.log('added client', ip)

		socket.on('message', this.handleClientMessage)
		socket.on('close', () => this.removeClient(socket))

		this.clients.add(socket)
		this.workerMessages.forEach(serialized => socket.send(serialized))
	}

	removeClient(socket) {
		console.log('removed client', socket.__ip)
		this.clients.delete(socket)
	}

	handleClientMessage(msg) {
		switch (msg.type) {
			case 'follow-pipeline': {
				break
			}
			case 'start-pipeline': {
				this.status = 'active'
				this.startTime = Date.now()
				this.child.send(msg)
				break
			}
			default: {
				this.child.send(msg)
			}
		}
	}

	handleWorkerMessage(msg) {
		console.log(trimMessage(msg))

		let serialized = JSON.stringify(msg)
		this.workerMessages.push(serialized)
		this.broadcast(serialized)

		if (msg.type === 'exit' || msg.type === 'error') {
			this.complete()
		}
	}

	complete() {
		if (this.child.connected) {
			this.child.disconnect()
		}
		this.status = 'completed'
		this.endTime = Date.now()
		this.duration = this.endTime - this.startTime
	}

	stop() {
		if (this.child.connected) {
			this.child.disconnect()
		}
		this.status = 'stopped'
		this.endTime = Date.now()
		this.duration = this.endTime - this.startTime
	}

	restart() {
		this.initChild()
		this.status = 'inactive'
		this.endTime = null
		this.duration = 0
		this.handleClientMessage(this.initialPayload)
	}

	broadcast(serialized) {
		this.clients.forEach(socket => socket.send(serialized))
	}
}

module.exports = Job
