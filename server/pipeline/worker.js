'use strict'

const serializeError = require('serialize-error')

const Cache = require('./cache')
const zip = require('lodash/zip')
const PIPELINES = require('./pipelines')

/////
///// helpers
/////

const logData = msg => console.log(JSON.stringify(msg))
const sendData = msg => process.send(msg)
const send = process.send ? sendData : logData

const error = e => send({ type: 'error', payload: e })
const stageComplete = ({ stage, result, timeTaken, cached }) =>
	send({
		type: 'stage-complete',
		payload: { stage, result, timeTaken, cached },
	})
const stageStart = ({ stage }) =>
	send({ type: 'stage-start', payload: { stage } })
const exit = () => send({ type: 'exit' })

const now = () => {
	let time = process.hrtime()
	return time[0] * 1e3 + time[1] / 1e6
}

/////
///// init
/////

require('loud-rejection/register')

if (process.send) {
	process.on('message', main)
} else {
	console.error('please use `hyb-pipeline` instead')
	process.exit(1)
}

process.on('disconnect', () => {
	console.error('disconnected')
	process.exit(0)
})

/////
///// pipeline
/////

async function startPipeline({ pipeline: pipelineName, filepath, data }) {
	let start = now()

	try {
		let cache = new Cache({ filepath, contents: data })

		let pipeline = PIPELINES[pipelineName]

		for (let step of pipeline) {
			step.output.forEach(key => stageStart({ stage: key }))

			let inputs = step.input.map(key => cache.get(key))
			let outputs = step.output.map(key => [key, cache.get(key)])

			// eslint-disable-next-line no-unused-vars
			if (outputs.filter(([k, v]) => v).length > 0) {
				// If we have cached results, let's just load them into memory and use them
				// instead of re-computing the results
				outputs.forEach(([key, value]) => {
					cache.set(key, value)
					stageComplete({
						stage: key,
						result: value,
						timeTaken: now() - start,
						cached: true,
					})
				})
				start = now()
				continue
			}

			let results = await Promise.all(await step.transform(inputs))

			// assert(results.length === step.output.length)
			zip(step.output, results).forEach(([key, result]) => {
				// store the results in the cache
				cache.set(key, result)

				// send the results over the bridge
				stageComplete({
					stage: key,
					result,
					timeTaken: now() - start,
					cached: false,
				})
			})

			start = now()
		}
	} catch (err) {
		console.error(err)
		error({ error: serializeError(err), timeTaken: now() - start })
	} finally {
		exit()
	}
}

function listPipelines(payload, responseId) {
	send({
		type: responseId ? `response-to-${responseId}` : 'list-pipelines',
		payload: Object.keys(PIPELINES),
	})
}

function listStepsForPipeline({ pipeline }, responseId) {
	send({
		type: responseId ? `response-to-${responseId}` : 'list-steps-for-pipeline',
		payload: JSON.stringify(PIPELINES[pipeline]),
	})
}

function uptime(payload, responseId) {
	// TODO: get server uptime
	send({
		type: responseId ? `response-to-${responseId}` : 'uptime',
		payload: 0,
	})
}

function activeJobs(payload, responseId) {
	send({
		type: responseId ? `response-to-${responseId}` : 'active-jobs',
		payload: 0,
	})
}

function completedJobs(payload, responseId) {
	send({
		type: responseId ? `response-to-${responseId}` : 'completed-jobs',
		payload: [],
	})
}

function watchPipeline(payload, responseId) {
	send({
		type: responseId ? `response-to-${responseId}` : 'completed-jobs',
		payload: {},
	})
}

const RUNNABLES = {
	uptime: uptime,
	'pipeline-list': listPipelines,
	'pipeline-steps': listStepsForPipeline,
	'start-pipeline': startPipeline,
	'watch-pipeline': watchPipeline,
	'active-jobs': activeJobs,
	'completed-jobs': completedJobs,
}

async function main({ type, payload, responseId }) {
	if (!(type in RUNNABLES)) {
		let allowed = Object.keys(RUNNABLES).join(',')
		let message = `${type} is not in the list of allowed commands: ${allowed}`
		error({ message })
	}

	return await RUNNABLES[type](payload, responseId)
}
