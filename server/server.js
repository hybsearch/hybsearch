#!/usr/bin/env node
'use strict'

const WebSocket = require('ws')
const childProcess = require('child_process')
const path = require('path')

const [port = 8080] = process.argv.slice(2)
const numericPort = parseInt(port)

if (port === '-h' || port === '--help') {
	console.error('usage: server.js [PORT=8080]')
	process.exit(1)
}

if (Number.isNaN(numericPort)) {
	console.error('usage: server.js [PORT=8080]')
	console.error('error: given port was not a number')
	process.exit(1)
}

const wss = new WebSocket.Server({ port: numericPort })
const workerPath = path.join(__dirname, 'pipeline', 'worker.js')

// listen for new websocket connections
wss.on('connection', ws => {
	console.log('connection initiated')
	const child = childProcess.fork(workerPath)

	ws.on('message', communique => {
		// when we get a message from the GUI
		const message = JSON.parse(communique)

		console.log(message)

		// forward the message to the pipeline
		child.send(message)
	})

	ws.on('close', () => {
		console.log('connection was closed')

		if (child.connected) {
			child.disconnect()
		}
	})

	child.on('message', communique => {
		// when we get a message from the pipeline
		const message = communique

		console.log(message)

		// forward the message to the GUI
		ws.send(JSON.stringify(message))

		// detach ourselves if the pipeline has finished
		if (message.type === 'exit' || message.type === 'error') {
			if (child.connected) {
				child.disconnect()
			}
		}
	})
})

console.log(`listening on localhost:${port}`)
