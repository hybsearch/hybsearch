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
	const desiredOutputFile = args.infile
	const tempInputFile = tempfile('.file')
	const outputFile = tempInputFile.replace('.file', '.ph')
	fs.writeFileSync(tempInputFile, data, {encoding: 'utf-8'})

	args.infile = tempInputFile
	const argstring = make_clustal_arguments(args)

	child.execSync(`clustalw2 ${argstring}`)

	if (desiredOutputFile) {
		fs.renameSync(outputFile, `${desiredOutputFile}.ph`)
	}
}

module.exports.clustal = clustal

function main() {
	if (process.argv.length != 3) {
		process.exit(1)
	}
	clustal(fs.readFileSync(process.argv[2]), {tree: true, output: 'FASTA', infile: process.argv[2]})
}

if (require.main === module) {
	main()
}

// genbank-to-fasta
// clustal
