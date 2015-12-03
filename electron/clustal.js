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

function clustal(data, extension) {
	const tempInputFile = tempfile('.file')
	const outputFile = tempInputFile.replace('.file', extension)
	fs.writeFileSync(tempInputFile, data, 'utf-8')

	const args = {
		align: true,
		pwgapopen: 15,
		pwgapext: 6.66,
		pwdnamatrix: 'IUB',
		transweight: 0.5,
		gapext: 6.66,
		gapopen: 15,
		numiter: 1,
		output: 'FASTA',

		infile: tempInputFile.replace(' ', '\ '),
		outfile: outputFile.replace(' ', '\ '),
	}

	const argString = `clustalw ${make_clustal_arguments(args)}`

	child.execSync(argString)

	return fs.readFileSync(outputFile, 'utf-8')
}

module.exports = clustal


function main() {
	if (process.argv.length < 3) {
		throw Error('usage: node clustal.js <input>')
	}

	console.log(clustal(fs.readFileSync(process.argv[2], 'utf-8'), args, '.aln'))
}

if (require.main === module) {
	main()
}
