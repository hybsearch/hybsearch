'use strict'

const serializeError = require('serialize-error')

const ent = require('../ent')
const { consensusTreeToNewick, parse: parseNewick } = require('../newick')
const { genbankToFasta, fastaToNexus } = require('../formats')
const clustal = require('../wrappers/clustal')
const mrBayes = require('../wrappers/mrbayes')

/////
///// helpers
/////

const logData = arr => console.log(JSON.stringify(arr))
const sendData = arr => process.send(arr)
const sendFunc = process.send ? sendData : logData
const send = (cmd, msg) => sendFunc([cmd, msg])

const begin = msg => send('begin', msg)
const complete = msg => send('complete', msg)
const error = e => send('error', serializeError(e))
const returnData = (phase, data) => send('data', { phase: phase, data: data })
const exit = () => send('exit')

function removeCircularLinks(obj) {
	return JSON.parse(
		JSON.stringify(obj, function(key, val) {
			if (key == 'parent' || key == 'nm_inner' || key == 'nm_outer')
				return undefined
			return val
		})
	)
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

// eslint-disable-next-line no-unused-vars
async function main([command, filepath, data]) {
	try {
		begin('process')
		let fasta = data
		if (!/\.fasta$/.test(filepath)) {
			fasta = await genbankToFasta(data)
		}
		complete('process')

		begin('align')
		let aligned = await clustal(fasta)
		complete('align')

		begin('convert')
		let nexus = await fastaToNexus(aligned)
		complete('convert')

		begin('generate')
		let tree = await mrBayes(nexus)
		complete('generate')

		begin('condense')
		let newickTree = consensusTreeToNewick(tree)
		complete('condense')

		begin('newick')
		let jsonNewickTree = parseNewick(newickTree)
		returnData('newick', jsonNewickTree)
		complete('newick')

		begin('ent')
		let nmResults = removeCircularLinks(ent.strictSearch(jsonNewickTree))
		// Have to return newick again because apparently `strictSearch`
		// actually modifies the data
		returnData('newick', removeCircularLinks(jsonNewickTree))
		returnData('ent', nmResults)
		complete('ent')

		// begin('hamdis')
		// end('hamdis')

		// begin('seqgen')
		// end('seqgen')
	} catch (err) {
		error(err)
		console.error(err)
	}
	exit()
}
