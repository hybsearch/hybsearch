#!/usr/bin/env node
'use strict'

const execa = require('execa')
const tempfile = require('tempfile')
const fs = require('fs')
const getData = require('./lib_get-data')
const minimist = require('minimist')

module.exports = seqgen
function seqgen(data, seqLen=300, mutationRate='0.02') {
	const inputFile = tempfile()
	data = `[${seqLen}, ${mutationRate}]${data}`
	fs.writeFileSync(inputFile, data, 'utf-8')

	let args = ['-mHKY', '-n2', '-on', inputFile]
	let output = execa.sync('seq-gen', args)

	return output.stdout
}

function main() {
	let argv = minimist(process.argv.slice(2))
	let file = argv['_'][0]

	if (!file && process.stdin.isTTY) {
		console.error('usage: node seq-gen.js (<input> | -) [output]')
		process.exit(1)
	}

	getData(file)
		.then(seqgen)
		.then(output => {
			if (argv['_'][1] === 2) {
				fs.writeFileSync(argv['_'][1], output, 'utf-8')
			} else {
				console.log(output)
			}
		})
		.catch(console.error.bind(console))
}

if (require.main === module) {
	main()
}
