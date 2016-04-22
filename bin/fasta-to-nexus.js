#!/usr/bin/env node
'use strict'

const child = require('child_process')
const tempfile = require('tempfile')
const fs = require('fs')
const path = require('path')
const getData = require('./lib_get-data')

module.exports = seqmagick
function seqmagick(data) {
	const inputFile = tempfile().replace(' ', '\ ')
	const outputFile = tempfile().replace(' ', '\ ')
	fs.writeFileSync(inputFile, data, 'utf-8')

	let executable = `python ${path.join('vendor', 'seqmagick', 'cli.py')}`
	child.execSync(`${executable} convert --input-format fasta --output-format nexus --alphabet dna ${inputFile} ${outputFile}`)

	// seqmagick wraps the identifiers in quotes.
	// mrbayes does not like single quotes.
	// remove them.
	let output = fs.readFileSync(outputFile, 'utf-8')
	output = output.replace(/'/g, "")

	return output
}

function main() {
	let file = process.argv[2]

	if (!file && process.stdin.isTTY) {
		console.error('usage: node fasta-to-nexus.js (<input> | -)')
		process.exit(1)
	}

	getData(file)
		.then(seqmagick)
		.then(data => console.log(data))
		.catch(console.error.bind(console))
}

if (require.main === module) {
	main()
}
