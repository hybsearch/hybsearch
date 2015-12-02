'use strict'

const child = require('child_process')
const tempfile = require('tempfile')
const fs = require('fs')
const _ = require('lodash')

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

function clustal(data, args, extension) {
	const tempInputFile = tempfile('.file')
	const outputFile = tempInputFile.replace('.file', extension)
	fs.writeFileSync(tempInputFile, data, {encoding: 'utf-8'})

	args.infile = tempInputFile.replace(' ', '\ ')
	args.outfile = outputFile.replace(' ', '\ ')
	const argString = `clustalw ${make_clustal_arguments(args)}`

	child.execSync(argString)

	return fs.readFileSync(outputFile, {encoding: 'utf-8'})
}

module.exports = clustal
