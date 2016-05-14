#!/usr/bin/env node
'use strict'

const execa = require('execa')
const tempfile = require('tempfile')
const fs = require('fs')
const getData = require('../lib/get-data')
const minimist = require('minimist')

module.exports = hammingDistance
function hammingDistance(data) {
	const inputFile = tempfile()
	fs.writeFileSync(inputFile, data, 'utf-8')

	let args = ['lib/hamdis.r', 'calculate', inputFile, 'something']
	let output = execa.sync('Rscript', args)

	return output.stdout
}

function main() {
	let argv = minimist(process.argv.slice(2))
	let file = argv['_'][0]

	if (!file && process.stdin.isTTY) {
		console.error('usage: node hamming-distance-for-file.js (<input> | -)')
		process.exit(1)
	}

	getData(file)
		.then(hammingDistance)
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
