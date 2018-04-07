'use strict'

const execa = require('execa')
const tempy = require('tempy')
const path = require('path')
const fs = require('fs')

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

	const distributions = fs.readFileSync(path.join(dir, 'Distributions.txt'), 'utf-8')
	const probabilities = fs.readFileSync(path.join(dir, 'Probabilities.txt'), 'utf-8')
	const results = fs.readFileSync(path.join(dir, 'Results.txt'), 'utf-8')

	return { distributions, probabilities, results }
}
