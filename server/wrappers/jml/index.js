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

// species: ['bla', 'nit', 'fol', 'pal', 'pis', 'gym', 'set', 'mul']
// seqPerSpecies: [44, 8, 6, 12, 8, 10, 2, 2]
const CONTROL = ({species, seqPerSpecies}) => {
	if (species.length !== seqPerSpecies.length) {
		throw new Error('species and seqPerSpecies do not have the same length')
	}

	return `species = ${species.join(' ')}
seqperspecies = ${seqPerSpecies.join(' ')}
locusrate = 0.8762
heredityscalar = 1
seqgencommand = -mHKY -f0.2678,0.1604,0.2031,0.3687 -t1.5161 -i0 -a0.2195 -l810
significancelevel = 0.1
burnin = 0
thinning = 1
seed = -1`
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
