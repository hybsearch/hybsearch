#!/usr/bin/env node
// @flow
'use strict'

//
// prepare for command-line use
//

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

//
// import everything we need
//

const WebSocket = require('ws')
const {
	startPipeline,
	watchPipeline,
	cancelPipeline,
	getActiveJobs,
	getCompletedJobs,
	getPipelines,
	uptime,
} = require('./server/messages')
const Job = require('./server/job')
import type { Message } from './server/messages'

//
// set up the server
//

const server = new WebSocket.Server({ port: numericPort })
const allJobs: Map<string, Job> = new Map()

//
// listen for new websocket connections
//

server.on('connection', (client, req) => {
	// start it up
	let clientId = req.connection.remoteAddress
	console.log(`connection initiated with ${clientId}`)

	// attach the client IP to the object
	client.ipAddr = req.connection.remoteAddress

	// gives us a single place to send data to the client, which
	// lets us automatically stringify it
	let send = (msg: { type: string, payload?: Object }) => {
		console.log('<resp<', msg)
		client.send(JSON.stringify(msg))
	}

	// handy function for easily replying to requests
	let sendResponse = (requestId: string) => (payload: Object) => {
		send({ type: `resp-${requestId}`, payload })
	}

	// send error messages back to the client
	let sendError = msg => {
		send({ type: 'error', payload: { message: msg } })
	}

	// handle messages from the client
	client.on('message', communique => {
		// when we get a message from the GUI
		const message: Message = JSON.parse(communique)

		// log it
		console.log('>', message)

		// bind the first half of the responder function
		let respond = sendResponse(message.requestId)

		switch (message.type) {
			case 'start-pipeline': {
				startPipeline({ message, respond, client, allJobs })
				break
			}
			case 'watch-pipeline': {
				watchPipeline({ message, respond, client, allJobs })
				break
			}
			case 'cancel-pipeline': {
				cancelPipeline({ message, respond, client, allJobs })
				break
			}
			case 'get-active-jobs': {
				getActiveJobs({ message, respond, client, allJobs })
				break
			}
			case 'get-completed-jobs': {
				getCompletedJobs({ message, respond, client, allJobs })
				break
			}
			case 'get-pipelines': {
				getPipelines({ message, respond, client, allJobs })
				break
			}
			case 'get-uptime': {
				uptime({ message, respond, client, allJobs })
				break
			}
			default: {
				sendError(`${message.type} is not an allowed type`)
				break
			}
		}
	})

	client.on('close', () => {
		console.log('connection was closed')

		Array.from(allJobs.values())
			.filter(job => job.hasClient(clientId))
			.forEach(job => job.removeClient(clientId))
	})
})

console.log(`listening on localhost:${port}`)
