'use strict'

const execa = require('execa')
const tempfile = require('tempfile')
const fs = require('fs')

module.exports = seqmagick
function seqmagick(data) {
	const inputFile = tempfile().replace(' ', ' ')
	const outputFile = tempfile().replace(' ', ' ')
	fs.writeFileSync(inputFile, data, 'utf-8')

	// prettier-ignore
	let args = [
		'/usr/bin/seqmagick',
		'convert',
		'--input-format', 'fasta',
		'--output-format', 'nexus',
		'--alphabet', 'dna',
		inputFile,
		outputFile,
	]

	execa.sync('python', args)

	// seqmagick wraps the identifiers in quotes.
	// mrbayes does not like single quotes.
	// remove them.
	let output = fs.readFileSync(outputFile, 'utf-8')
	output = output.replace(/'/g, '')

	return output
}
