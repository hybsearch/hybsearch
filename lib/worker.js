'use strict'

require('loud-rejection/register')
const fs = require('fs')

const serializeError = require('serialize-error')

const genbankToFasta = require('../bin/genbank-fasta')
const clustal = require('../bin/clustal-o')
const fastaToNexus = require('../bin/fasta-to-nexus')
const mrBayes = require('../bin/mrbayes')
const consensusTreeToNewick = require('../bin/consensus-newick')

process.on('disconnect', () => {
	console.error('disconnected')
	process.exit(0)
})

// process.on('message', console.error.bind(console))

const logData = arr => console.log(JSON.stringify(arr))
const sendData = arr => process.send(arr)
const sendFunc = process.send ? sendData : logData
const send = (cmd, msg) => sendFunc([cmd, msg])

const begin = msg => send('begin', msg)
const complete = msg => send('complete', msg)
const error = e => send('error', serializeError(e))
const returnData = data => send('finish', data)
const exit = () => send('exit')

function readFile(path) {
	return new Promise((resolve, reject) => {
		fs.readFile(path, 'utf-8', (err, data) => {
			if (err) {
				reject(err)
			}
			resolve(data)
		})
	})
}

async function runSteps(path, data) {
	begin('process')
	let fasta = data
	if (!/\.fasta$/.test(path)) {
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

	return newickTree
}

async function loadAndEvaluate(path) {
	try {
		let data = await readFile(path)
		let newickTree = await runSteps(path, data)
		returnData(newickTree)
	} catch (err) {
		error(err)
		console.error(err)
	}
	exit()
}

function main(file) {
	if (!file) {
		error('no file given')
		console.error('usage: node worker.js <inputfile>')
		process.exit(1)
	}

	loadAndEvaluate(file).catch(err => {
		error(err)
		console.error(err)
	})
}

if (process.send) {
	process.on('message', main)
} else if (require.main === module) {
	main(process.argv[2])
}
