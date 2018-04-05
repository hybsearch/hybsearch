'use strict'

const execa = require('execa')
const tempy = require('tempy')
const fs = require('fs')

module.exports = clustal
function clustal(data) {
	const inputFile = tempy.file()
	const outputFile = tempy.file()
	fs.writeFileSync(inputFile, data, 'utf-8')

	// find binary via `which`
	const executable = execa.sync('which', ['clustalo']).stdout

	// prettier-ignore
	const args = [
		'--in', inputFile,
		'--out', outputFile,
		'--outfmt=fasta',
	]

	execa.sync(executable, args)

	return fs.readFileSync(outputFile, 'utf-8')
}
