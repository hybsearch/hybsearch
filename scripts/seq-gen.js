#!/usr/bin/env node
'use strict'

const USAGE = `usage:
node seq-gen.js (<inputFile> | -) [arguments]

optional arguments:
  --sequence-length 300
  --mutation-rate 0.02
  --generations 2
`

const getData = require('./lib/get-data')
const minimist = require('minimist')

const seqgen = require('../bin/seq-gen')

function main() {
	let argv = minimist(process.argv.slice(2))

	// TODO: I don't understand what the input files are supposed to be.
	let file = argv['_'][0]
	let seqLen = argv['sequence-length']
	let mutationRate = argv['mutation-rate']
	let generations = argv['generations']

	if (!file && process.stdin.isTTY) {
		console.error(USAGE)
		process.exit(1)
	}

	return getData(file)
		.then(data => seqgen(data, seqLen, mutationRate, generations))
		.then(console.log.bind(console))
		.catch(console.error.bind(console))
}

if (require.main === module) {
	main()
}
