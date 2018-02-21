#!/usr/bin/env node
'use strict'

const WebSocket = require('ws')
const childProcess = require('child_process')
const path = require('path')

const [port=8080] = process.argv.slice(2)
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

const wss = new WebSocket.Server({port: numericPort})
const workerPath = path.join(__dirname, '..', 'lib', 'worker.js')
const child = childProcess.fork(workerPath)

// listen for new websocket connections
wss.on('connection', ws => {
	console.log('connection initiated')

	ws.on('message', communique => {
		// when we get a message from the GUI
		const [cmd, ...args] = JSON.parse(communique)

		// forward the message to the pipeline
		child.send([cmd, ...args])
	})

	child.on('message', communique => {
		// when we get a message from the pipeline
		const [cmd, ...args] = communique

		// forward the message to the GUI
		ws.send(JSON.stringify([cmd, ...args]))

		// detach ourselves if the pipeline has finished
		if (cmd === 'exit' || cmd === 'error') {
			child.disconnect()
		}
	})
})

console.log(`listening on localhost:${port}`)
