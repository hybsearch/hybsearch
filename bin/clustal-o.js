#!/usr/bin/env node
'use strict'

const execa = require('execa')
const tempfile = require('tempfile')
const fs = require('fs')
const path = require('path')
const getData = require('../lib/get-data')

module.exports = clustal
function clustal(data) {
	const inputFile = tempfile()
	const outputFile = tempfile()
	fs.writeFileSync(inputFile, data, 'utf-8')

	let executable = path.join(__dirname, '..', 'vendor', 'clustalo-osx')
	let args = [
		'--in', inputFile,
		'--out', outputFile,
		'--outfmt=fasta',
	]
	execa.sync(executable, args)

	return fs.readFileSync(outputFile, 'utf-8')
}

function main() {
	let argv = process.argv.slice(2)
	let file = argv[0]

	if (!file && process.stdin.isTTY) {
		console.error('usage: node clustal-o.js (<input> | -) [output]')
		process.exit(1)
	}

	return getData(file)
		.then(clustal)
		.then(output => {
			if (argv[1]) {
				fs.writeFileSync(argv[1], output, 'utf-8')
			} else {
				console.log(output)
			}
		})
		.catch(console.error.bind(console))
}

if (require.main === module) {
	main()
}
