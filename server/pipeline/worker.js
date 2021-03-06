'use strict'

const serializeError = require('serialize-error')

const Cache = require('./cache')
const zip = require('lodash/zip')
const PIPELINES = require('./pipelines')
const { loadFile } = require('../lib/get-files')
const fromPairs = require('lodash/fromPairs')
const toPairs = require('lodash/toPairs')

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

async function main({ pipeline: pipelineName, filepath, data, options }) {
	let start = now()

	try {
		if (!data) {
			data = await loadFile(filepath)
		}

		let { steps, options: defaults } = PIPELINES[pipelineName]
		defaults = fromPairs(
			toPairs(defaults).map(([key, value]) => [key, value.default])
		)
		options = { ...defaults, ...options }

		let cache = new Cache({ filepath, contents: data, pipelineName, options })

		for (let step of steps) {
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

			let results = await Promise.all(await step.transform(inputs, options))

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
