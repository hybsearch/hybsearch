// @ts-check
'use strict'

require('loud-rejection/register')
const fs = require('fs')

const serializeError = require('serialize-error')

const genbankToFasta = require('../bin/genbank-fasta')
const clustal = require('../bin/clustal-o')
const fastaToNexus = require('../bin/fasta-to-nexus')
const mrBayes = require('../bin/mrbayes')
const consensusTreeToNewick = require('../bin/consensus-newick')
const { parse: parseNewick } = require('../vendor/newick')

process.on('disconnect', () => {
	console.error('disconnected')
	process.exit(0)
})

const logData = arr => console.log(JSON.stringify(arr))
const sendData = arr => process.send(arr)
const sendFunc = process.send ? sendData : logData
const send = (cmd, msg) => sendFunc([cmd, msg])

const begin = msg => send('begin', msg)
const complete = msg => send('complete', msg)
const error = e => send('error', serializeError(e))
const returnData = (phase, data) => send('data', [data])
const exit = () => send('exit')

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
		let jsonNewickTree = parseNewick(data)
		returnData('newick', jsonNewickTree)
		end('newick')

		begin('ent')
		let nmResults = ent.strictSearch(jsonNewickTree)
		returnData('ent', nmResults)
		end('ent')

		begin('hamdis')
		end('hamdis')

		begin('seqgen')
		end('seqgen')

	} catch (err) {
		error(err)
		console.error(err)
	}
	exit()
}

if (process.send) {
	process.on('message', main)
} else {
	console.error('please use scripts/worker-runner.js instead')
	process.exit(1)
}
