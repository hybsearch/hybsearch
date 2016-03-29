#!/usr/bin/env node
'use strict'

const child = require('child_process')
const tempfile = require('tempfile')
const fs = require('fs')

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
		align: true,
		pwgapopen: 15,
		pwgapext: 6.66,
		pwdnamatrix: 'IUB',
		transweight: 0.5,
		gapext: 6.66,
		gapopen: 15,
		numiter: 1,
		output: 'NEXUS',

		infile: inputFile.replace(' ', '\ '),
		outfile: outputFile.replace(' ', '\ ')
	}

	const argString = `clustalw2 ${makeClustalArguments(args)}`

	child.execSync(argString)

	return fs.readFileSync(outputFile, 'utf-8')
}

function main() {
	if (process.argv.length < 3) {
		console.error('usage: node clustal.js <input>')
		process.exit(1)
	}

	console.log(clustal(fs.readFileSync(process.argv[2], 'utf-8')))
}

if (require.main === module) {
	main()
}
