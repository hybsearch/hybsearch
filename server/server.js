#!/usr/bin/env node
'use strict'

const STARTED = Date.now()
const WebSocket = require('ws')
const path = require('path')
const http = require('http')
const Koa = require('koa')
const Router = require('koa-router')
const compress = require('koa-compress')
const cors = require('@koa/cors')
const logger = require('koa-logger')
const { trimMessage } = require('./lib/trim-message')
const Job = require('./job')
const getFiles = require('./lib/get-files')
const handler = require('koa-static-server')
const { loadFile } = getFiles

const PORT = parseInt(process.env.PORT, 10) || 8080
const app = new Koa()
const server = http.createServer(app.callback())
const wss = new WebSocket.Server({
	server,
	perMessageDeflate: {},
})

const PIPELINES = require('./pipeline/pipelines')
const router = new Router()

router.get('/', ctx => {
	ctx.body = 'hello, world!'
})

router.get('/pipelines', ctx => {
	ctx.body = { pipelines: Object.keys(PIPELINES) }
})

router.get('/pipeline/:name', ctx => {
	let pipe = PIPELINES[ctx.params.name]
	if (pipe) {
		ctx.body = { steps: pipe.steps, options: pipe.options || {} }
	} else {
		ctx.throw(404, { error: 'pipeline not found' })
	}
})

router.get('/files', async ctx => {
	ctx.body = { files: await getFiles() }
})

router.get('/file/:name', async ctx => {
	ctx.body = { content: await loadFile(ctx.params.name) }
})

router.get('/jobs', async ctx => {
	ctx.body = {
		jobs: [...workers.values()].reverse().map(worker => ({
			pipeline: worker.pipeline,
			filename: path.basename(worker.filepath),
			id: worker.id,
			hash: worker.hash,
			options: worker.options,
			status: worker.status,
			initialClientAddress: worker.initialClientAddress,
			duration: worker.duration,
		})),
	}
})

router.delete('/job/:id', async ctx => {
	let worker = workers.get(ctx.params.id)
	if (worker) {
		worker.stop()
		ctx.body = { stopped: true, id: worker.id }
	} else {
		ctx.throw(500, 'no worker found')
	}
})

router.post('/job/:id', async ctx => {
	let worker = workers.get(ctx.params.id)
	if (worker) {
		worker.restart()
		ctx.body = { started: true, id: worker.id }
	} else {
		ctx.throw(500, 'no worker found')
	}
})

router.get('/uptime', ctx => {
	ctx.body = { uptime: Date.now() - STARTED }
})

app.use(logger())
app.use(cors())
app.use(compress())
app.use(handler({ rootDir: './ui/out', rootPath: '/app' }))
app.use(router.routes())
app.use(router.allowedMethods())

let workers = new Map()

// listen for new websocket connections
wss.on('connection', (ws, req) => {
	let worker
	let ip = req.connection.remoteAddress

	ws.on('message', communique => {
		// when we get a message from the GUI
		const message = JSON.parse(communique)

		console.log(trimMessage(message))

		if (message.type === 'start-pipeline') {
			worker = new Job(message)
			workers.set(worker.id, worker)
			worker.addClient(ws, ip)
		} else if (message.type === 'follow-pipeline') {
			worker = workers.get(message.id)
			worker.addClient(ws, ip)
		}

		// forward the message to the pipeline
		worker.handleClientMessage(message)
	})
})

server.listen(PORT)
console.log(`listening on localhost:${PORT}`)
