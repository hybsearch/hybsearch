#!/usr/bin/env node
'use strict'

const child = require('child_process')
const tempfile = require('tempfile')
const fs = require('fs')

function clustal(data) {
	const inputFile = tempfile().replace(' ', '\ ')
	const outputFile = tempfile().replace(' ', '\ ')
	fs.writeFileSync(inputFile, data, 'utf-8')

	const argString = `clustalo --in ${inputFile} --out ${outputFile} --outfmt=phylip`

	child.execSync(argString)

	return fs.readFileSync(outputFile, 'utf-8')
}

module.exports = clustal


function main() {
	if (process.argv.length < 3) {
		console.error('usage: node clustal-o.js <input> [output]')
		process.exit(1)
	}

	let output = clustal(fs.readFileSync(process.argv[2], 'utf-8'))

	if (process.argv.length === 4) {
		fs.writeFileSync(process.argv[3], output, 'utf-8')
	}
	else {
		console.log(output)
	}
}

if (require.main === module) {
	main()
}
