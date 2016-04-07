'use strict'

const fs = require('fs')

const serializeError = require('serialize-error')
const fileExt = require('file-extension')

const genbankToFasta = require('./bin/genbank-fasta')
const sanitizeFasta = require('./bin/sanitize-fasta')
const clustal = require('./bin/clustal-o')
const fastaToNexus = require('./bin/fasta-to-nexus')
const mrBayes = require('./bin/mrbayes')
const consensusTreeToNewick = require('./bin/consensus-newick')

process.on('disconnected', () => {
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
		return fs.readFile(path, 'utf-8', (err, data) => {
			if (err) {
				reject(err)
			}
			resolve(data)
		})
	})
}

function loadAndEvaluate(path) {
	return readFile(path)
		.then(data => {
			begin('process')
			let fasta = data
			if (fileExt(path) !== 'fasta') {
				fasta = genbankToFasta(data)
			}
			else if (data.indexOf('>gi|') > -1) {
				fasta = sanitizeFasta(data)
			}
			return fasta
		}).then(fasta => {
			complete('process')
			begin('align')
			return clustal(fasta)
		}).then(aligned => {
			complete('align')
			begin('convert')
			return fastaToNexus(aligned)
		}).then(nexus => {
			complete('convert')
			begin('generate')
			return mrBayes(nexus)
		}).then(tree => {
			complete('generate')
			begin('condense')
			return consensusTreeToNewick(tree)
		}).then(newickTree => {
			complete('condense')
			returnData(newickTree)
			exit()
		}).catch(err => {
			error(err)
			console.error(err)
		})
}

function main(file) {
	file = file || process.argv[2]

	if (!file) {
		error('no file given')
		console.error('usage: node worker.js <inputfile>')
		process.exit(1)
	}

	loadAndEvaluate(file)
}


if (process.send) {
	process.on('message', main)
}
else if (require.main === module) {
	main()
}
