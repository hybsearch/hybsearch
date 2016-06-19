#!/usr/bin/env node
'use strict'

const execa = require('execa')
const tempfile = require('tempfile')
const fs = require('fs')
const getData = require('../lib/get-data')
const minimist = require('minimist')

module.exports = seqgen
function seqgen(data, seqLen=300, mutationRate=0.02, generations=2) {
	const inputFile = tempfile()
	data = `[${seqLen}, ${mutationRate}]${data}`
	fs.writeFileSync(inputFile, data, 'utf-8')

	let args = ['-mHKY', `-n${generations}`, '-on', inputFile]
	let output = execa.sync('seq-gen', args)

	return output.stdout
}

function main() {
	let argv = minimist(process.argv.slice(2))

	// TODO: I don't understand what the input files is supposed to be.
	let file = argv['_'][0]
	let seqLen = argv['sequence-length']
	let mutationRate = argv['mutation-rate']
	let generations = argv['generations']

	if (!file && process.stdin.isTTY) {
		console.error([
			'usage:',
			'node seq-gen.js (<inputFile> | -) [arguments]',
			'',
			'optional arguments:',
			'  --sequence-length 300',
			'  --mutation-rate 0.02',
			'  --generations 2',
		].join('\n'))
		process.exit(1)
	}

	getData(file)
		.then(data => seqgen(data, seqLen, mutationRate, generations))
		.then(console.log.bind(console))
		.catch(console.error.bind(console))
}

if (require.main === module) {
	main()
}
