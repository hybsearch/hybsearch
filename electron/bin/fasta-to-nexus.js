#!/usr/bin/env node
'use strict'

const child = require('child_process')
const tempfile = require('tempfile')
const fs = require('fs')
const getData = require('./lib_get-data')

function makeClustalArguments(args) {
	let argString = ''
	for (let arg in args) {
		if (args.hasOwnProperty(arg)) {
			if (args[arg] === true) {
				argString += `-${arg}`
			} else {
				argString += `-${arg}=${args[arg]}`
			}
			argString += ' '
		}
	}
	return argString
}

module.exports = clustal
function clustal(data) {
	const inputFile = tempfile().replace(' ', '\ ')
	const outputFile = tempfile().replace(' ', '\ ')
	fs.writeFileSync(inputFile, data, 'utf-8')

	const args = {
		output: 'NEXUS',

		infile: inputFile.replace(' ', '\ '),
		outfile: outputFile.replace(' ', '\ ')
	}

	const argString = `clustalw2 ${makeClustalArguments(args)}`

	child.execSync(argString)

	return fs.readFileSync(outputFile, 'utf-8')
}

function main() {
	let file = process.argv[2]

	if (!file && file !== '-') {
		console.error('usage: node clustal.js (<input> | -)')
		process.exit(1)
	}

	getData(file)
		.then(clustal)
		.then(data => console.log(data))
}

if (require.main === module) {
	main()
}
