'use strict'

const execa = require('execa')
const tempfile = require('tempfile')
const fs = require('fs')

module.exports = seqmagick
function seqmagick({
	data,
	inputFormat,
	outputFormat,
	alphabet = 'dna',
	removeQuotes = true,
}) {
	// TODO: why does this replace spaces with spaces?
	const inputFile = tempfile().replace(' ', ' ')
	const outputFile = tempfile().replace(' ', ' ')
	fs.writeFileSync(inputFile, data, 'utf-8')

	// find binary via `which`
	const executable = execa.sync('which', ['seqmagick'])

	// prettier-ignore
	const args = [
		'convert',
		'--input-format', inputFormat,
		'--output-format', outputFormat,
		'--alphabet', alphabet,
		inputFile,
		outputFile,
	]

	execa.sync(executable, args)

	let output = fs.readFileSync(outputFile, 'utf-8')

	if (removeQuotes) {
		// seqmagick wraps the identifiers in quotes.
		// mrbayes does not like single quotes.
		// remove them.
		output = output.replace(/'/g, '')
	}

	return output
}
