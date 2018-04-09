'use strict'

const execa = require('execa')
const tempy = require('tempy')
const path = require('path')
const fs = require('fs')

const readFileOr = (filepath, orValue) => {
	try {
		return fs.readFileSync(filepath, 'utf-8')
	} catch (err) {
		if (err.code === 'ENOENT') {
			return orValue
		}
	}
}

module.exports = jml
async function jml(data, argv = {}) {
	const dir = tempy.directory()

	const inputFile = tempy.file()
	fs.writeFileSync(inputFile, data, 'utf-8')

	// find binary via `which`
	const executable = execa.sync('which', ['jml']).stdout

	// prettier-ignore
	const args = [
		inputFile,
	]

	let result = execa(executable, args)

	if (!argv.quiet) {
		result.stdout.pipe(process.stderr)
		result.stderr.pipe(process.stderr)
	}

	await result

	// process.stderr.write(execa.sync('ls', ['-l', dir]).stdout)

	const distributions = readFileOr(path.join(dir, 'Distributions.txt'), '')
	const probabilities = readFileOr(path.join(dir, 'Probabilities.txt'), '')
	const results = readFileOr(path.join(dir, 'Results.txt'), '')

	return { distributions, probabilities, results }
}
