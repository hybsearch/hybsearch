'use strict'

const WebSocket = require('ws')
const childProcess = require('child_process')
const path = require('path')

if (process.argv.length < 3) {
	console.error('usage: server.js [PORT]')
	process.exit(1)
}

const port = parseInt(process.argv[2]) || 8080

const wss = new WebSocket.Server({port: port})

const child = childProcess.fork(path.join(__dirname, '..', 'lib', 'worker.js'))

wss.on('connection', ws => {
	ws.on('message', communique => {
		let [cmd, filepath, data] = JSON.parse(communique)

		if (cmd === 'start') {
			child.send(['start', filepath, data])
		}

		console.log('got', communique)
	})
})

child.on('message', communique => {
	let [cmd, msg] = communique

	child.send(JSON.stringify([cmd, msg]))

	console.log('sent', communique)

	if (cmd === 'exit' || cmd === 'error') {
		child.disconnect()
	}
})

console.log(`listening on localhost:${port}`)
