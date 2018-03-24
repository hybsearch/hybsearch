'use strict'

const serializeError = require('serialize-error')

const Cache = require('./cache')
const zip = require('lodash/zip')
const ent = require('../ent')
const { consensusTreeToNewick, parse: parseNewick } = require('../newick')
const { genbankToFasta, fastaToNexus } = require('../formats')
const { pruneOutliers } = require('../lib/prune-newick')
const clustal = require('../wrappers/clustal')
const mrBayes = require('../wrappers/mrbayes')

/////
///// helpers
/////

const logData = msg => console.log(JSON.stringify(msg))
const sendData = msg => process.send(msg)
const send = process.send ? sendData : logData

const error = e =>
	send({ type: 'error', payload: { error: serializeError(e) } })
const stageComplete = ({ stage, result, timeTaken }) =>
	send({ type: 'stage-complete', payload: { stage, result, timeTaken } })
const stageStart = ({ stage }) =>
	send({ type: 'stage-start', payload: { stage } })
const exit = () => send({ type: 'exit' })

function removeCircularLinks(obj) {
	return JSON.parse(
		JSON.stringify(obj, function(key, val) {
			if (['parent', 'nmInner', 'nmOuter'].includes(key)) {
				return undefined
			}
			return val
		})
	)
}

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

const hybridizationSearch = [
	{
		// the first step: ensures that the input is converted to FASTA
		input: ['source'],
		transform: ([{ filepath, contents }]) =>
			filepath.endsWith('.fasta') ? [contents] : [genbankToFasta(contents)],
		output: ['initial-fasta'],
	},
	{
		// aligns the FASTA sequences
		input: ['initial-fasta'],
		transform: ([data]) => [clustal(data)],
		output: ['aligned-fasta'],
	},
	{
		// converts the aligned FASTA into Nexus
		input: ['aligned-fasta'],
		transform: ([data]) => [fastaToNexus(data)],
		output: ['aligned-nexus'],
	},
	{
		// does whatever mrbayes does
		input: ['aligned-nexus'],
		transform: ([data]) => [mrBayes(data)],
		output: ['consensus-tree'],
	},
	{
		// turns MrBayes' consensus tree into a Newick tree
		input: ['consensus-tree'],
		transform: ([data]) => [consensusTreeToNewick(data)],
		output: ['newick-tree'],
	},
	{
		// turns the Newick tree into a JSON object
		input: ['newick-tree'],
		transform: ([data]) => [parseNewick(data)],
		output: ['newick-json:1'],
	},
	{
		input: ['newick-json:1', 'aligned-fasta'],
		transform: ([newickJson, alignedFasta]) => {
			let { removedData, prunedNewick } = pruneOutliers(
				newickJson,
				alignedFasta
			)
			return [prunedNewick, removedData]
		},
		output: ['newick-json:2', 'pruned-identifiers'],
	},
	{
		// identifies the non-monophyletic sequences
		input: ['newick-json:2', 'aligned-fasta'],
		transform: ([newickJson, alignedFasta]) => [
			removeCircularLinks(ent.strictSearch(newickJson, alignedFasta)),
			removeCircularLinks(newickJson),
		],
		output: ['nonmonophyletic-sequences', 'newick-json:3'],
	},
]

const parseNewickFile = [
	{
		// turns the Newick tree into a JSON object
		input: ['source'],
		transform: ([data]) => [parseNewick(data)],
		output: ['newick-json:1'],
	},
]

const PIPELINES = {
	search: hybridizationSearch,
	'parse-newick': parseNewickFile,
}

// eslint-disable-next-line no-unused-vars
async function main({ pipeline: pipelineName, filepath, data }) {
	let start = now()

	try {
		let cache = new Cache({ filepath, contents: data })

		let pipeline = PIPELINES[pipelineName]

		for (let step of pipeline) {
			step.output.forEach(key => stageStart({ stage: key }))

			let inputs = step.input.map(key => cache.get(key))

			let results = await step.transform(inputs)

			// assert(results.length === step.output.length)
			zip(step.output, results).forEach(([key, result]) => {
				// store the results in the cache
				cache.set(key, result)

				// send the results over the bridge
				stageComplete({ stage: key, result, timeTaken: now() - start })
			})

			start = now()
		}
	} catch (err) {
		console.error(err)
		error({ error: err, timeTaken: now() - start })
	} finally {
		exit()
	}
}
