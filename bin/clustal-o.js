#!/usr/bin/env node
'use strict'

const execa = require('execa')
const tempfile = require('tempfile')
const fs = require('fs')
const path = require('path')
const getData = require('../lib/get-data')
const minimist = require('minimist')

module.exports = clustal
function clustal(data) {
	const inputFile = tempfile()
	const outputFile = tempfile()
	fs.writeFileSync(inputFile, data, 'utf-8')

	let executable = process.platform === 'win32'
		? path.join('vendor', 'clustalo-win64', 'clustalo.exe')
		: path.join('vendor', 'clustalo-osx')
	let args = [
		'--in', inputFile,
		'--out', outputFile,
		'--outfmt=fasta',
	]
	execa.sync(executable, args)

	return fs.readFileSync(outputFile, 'utf-8')
}

function main() {
	let argv = minimist(process.argv.slice(2))
	let file = argv['_'][0]

	if (!file && process.stdin.isTTY) {
		console.error('usage: node clustal-o.js (<input> | -) [output]')
		process.exit(1)
	}

	getData(file)
		.then(clustal)
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
