'use strict'

const child = require('child_process')
const tempfile = require('tempfile')
const fs = require('fs')

function make_clustal_arguments(args) {
	let argString = ''
	for (let arg in args) {
		if (args.hasOwnProperty(arg)) {
			if (args[arg] === true) {
				argString += `-${arg}`
			}
			else {
				argString += `-${arg}=${args[arg]}`
			}
			argString += ' '
		}
	}
	return argString
}

function clustal(data, args) {
	const tempInputFile = tempfile('.file')
	const outputFile = tempInputFile.replace('.file', '.ph')
	fs.writeFileSync(tempInputFile, data, {encoding: 'utf-8'})

	args.infile = tempInputFile
	const argstring = make_clustal_arguments(args)

	child.execSync(`clustalw ${argstring}`)

	return fs.readFileSync(outputFile, {encoding: 'utf-8'})
}

module.exports = clustal
