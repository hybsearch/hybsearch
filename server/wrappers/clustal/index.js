'use strict'

const execa = require('execa')
const tempy = require('tempy')
const fs = require('fs')

module.exports = clustal
async function clustal(data) {
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

	let result = execa(executable, args)

	result.stdout.pipe(process.stderr)
	result.stderr.pipe(process.stderr)

	await result

	return fs.readFileSync(outputFile, 'utf-8')
}
