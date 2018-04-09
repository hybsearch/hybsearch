// @flow
'use strict'

const Cache = require('../cache')
const zip = require('lodash/zip')
const PIPELINES = require('../pipelines')

/////
///// helpers
/////

export type ErrorMessage = {
	type: 'stage-errored',
	payload: { message: string, duration: number },
}

export type StageCompleted = {
	type: 'stage-completed',
	payload: {
		key: string,
		value: mixed,
		duration: number,
		wasCached: boolean,
	},
}

export type StageStarted = {
	type: 'stage-started',
	payload: {
		key: string,
	},
}

export type WorkerMessage = StageStarted | StageCompleted | ErrorMessage

const logData = (msg: WorkerMessage) => console.log(JSON.stringify(msg))
const sendData = (msg: WorkerMessage) => (process: any).send(msg)
const send = process.send ? sendData : logData

const error = e => send({ type: 'stage-errored', payload: e })

const stageComplete = ({ key, value, duration, wasCached }) =>
	send({
		type: 'stage-completed',
		payload: { key, value, duration, wasCached },
	})

const stageStart = ({ key }) =>
	send({ type: 'stage-started', payload: { key } })

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
	console.error('<worker> disconnected')
	process.exit(0)
})

/////
///// pipeline
/////

async function main({ pipeline: pipelineName, filepath, data }) {
	let start = now()

	try {
		let cache = new Cache({ filepath, contents: data })

		let pipeline = PIPELINES.get(pipelineName)

		if (!pipeline) {
			throw new Error(`${pipelineName} is not a known pipeline!`)
		}

		for (let step of pipeline.pipeline) {
			step.output.forEach(key => stageStart({ key }))

			let inputs = step.input.map(key => cache.get(key))
			let outputs = step.output.map(key => [key, cache.get(key)])

			// eslint-disable-next-line no-unused-vars
			if (outputs.filter(([k, v]) => v).length > 0) {
				// If we have cached results, let's just load them into memory and use them
				// instead of re-computing the results
				outputs.forEach(([key, value]) => {
					cache.set(key, value)
					stageComplete({
						key,
						value,
						duration: now() - start,
						wasCached: true,
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
					key,
					value: result,
					duration: now() - start,
					wasCached: false,
				})
			})

			start = now()
		}
	} catch (err) {
		console.error(err)
		error({ message: err.message, duration: now() - start })
	} finally {
		process.exit(0)
	}
}
