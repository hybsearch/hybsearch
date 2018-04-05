'use strict'

const execa = require('execa')
const tempy = require('tempy')
const path = require('path')
const fs = require('fs')

module.exports = beast
function beast(data, argv={}) {
	const dir = tempy.directory()

	const inputName = 'input'
	const inputFile = path.join(dir, `${inputName}.xml`)
	fs.writeFileSync(inputFile, data, 'utf-8')

	// find binary via `which`
	const executable = execa.sync('which', ['beast']).stdout

	// prettier-ignore
	const args = [
		// use as many threads as possible
		'-threads', -1,
		// change to the working directory of the input file
		'-working',
		// something something
		'-instances', 10,
		// use beagle if possible
		// '-beagle',
		// provide the input file path
		inputFile,
	]

	let result = execa.sync(executable, args)

	if (!argv.quiet) {
		process.stderr.write(result.stdout)
		process.stderr.write(result.stderr)
	}

	// process.stderr.write(execa.sync('ls', ['-l', dir]).stdout)

	const log = fs.readFileSync(path.join(dir, 'data.log'), 'utf-8')
	const trees = fs.readFileSync(path.join(dir, 'data.trees'), 'utf-8')
	const species = fs.readFileSync(path.join(dir, 'species.trees'), 'utf-8')

	return {log, trees, species}
}
