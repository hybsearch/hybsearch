#!/usr/bin/env node
'use strict'

const child = require('child_process')
const tempfile = require('tempfile')
const fs = require('fs')
const getData = require('./lib_get-data')
const minimist = require('minimist')

module.exports = seqgen
function seqgen(data, seqLen=300, mutationRate='0.02') {
	const inputFile = tempfile().replace(' ', '\ ')
	const outputFile = tempfile().replace(' ', '\ ')
	fs.writeFileSync(inputFile, data, 'utf-8')

	data = `[${seqLen}, ${mutationRate}]${data}`

	let executable = 'seq-gen'
	let argString = `${executable} -mHKY -n2 -on ${inputFile}`

	let output = child.execSync(argString, {
		encoding: 'utf-8',
		stdio: [undefined, undefined, 'pipe'],
	})

	return output
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
