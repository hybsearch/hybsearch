'use strict'

const execa = require('execa')
const tempfile = require('tempfile')
const fs = require('fs')

module.exports = clustal
function clustal(data) {
	const inputFile = tempfile()
	const outputFile = tempfile()
	fs.writeFileSync(inputFile, data, 'utf-8')

	const executable = '/usr/bin/clustalo'

	// prettier-ignore
	const args = [
		'--in', inputFile,
		'--out', outputFile,
		'--outfmt=fasta',
	]

	execa.sync(executable, args)

	return fs.readFileSync(outputFile, 'utf-8')
}
