'use strict'

const execa = require('execa')
const tempy = require('tempy')
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
	const inputFile = tempy.file().replace(' ', ' ')
	const outputFile = tempy.file().replace(' ', ' ')
	fs.writeFileSync(inputFile, data, 'utf-8')

	// find binary via `which`
	const executable = execa.sync('which', ['seqmagick']).stdout

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
