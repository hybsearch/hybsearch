'use strict'

const execa = require('execa')
const tempy = require('tempy')
const path = require('path')
const fs = require('fs')

const crypto = require('crypto')
let makeHash = str => {
	let hash = crypto.createHash('sha256')
	hash.update(str)
	return hash.digest('base64')
}

// TODO:
// - take aligned fasta filepath
// - hash sequence identifiers with sha256.substr(0, 10) for phylip
// 		- keep the (a) sequence identifier in the phylip hashed ident
// - fasta-to-phylip
// - modify species names in nexus species.trees file to match hashed files
// - fill out ctl file with hashed names
// - run jml
// - read output files
// - reverse hashed names in output files
// - return useful data from files

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
function makeControlData({ species, seqPerSpecies }) {
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

function computeSpecies({ phylip, trees }) {
	// compute species and seqPerSpecies to pass to `makeControlData`
	return makeControlData({ species, seqPerSpecies })
}

module.exports = jml
async function jml({ phylipData, trees, phylipMapping }) {
	let workDir = tempy.directory()

	let phylipFile = path.join(workDir, 'input.phy')
	fs.writeFileSync(phylipFile, phylipData, 'utf-8')

	let treesFile = path.join(workDir, 'input.species.trees')
	fs.writeFileSync(treesFile, trees, 'utf-8')

	let controlFile = path.join(workDir, 'jml.input.ctl')
	let controlData = computeSpecies({ phylip: phylipData, trees: trees })
	fs.writeFileSync(controlFile, controlData, 'utf-8')

	// find binary via `which`
	let executable = execa.sync('which', ['jml']).stdout

	// prettier-ignore
	let args = [
		'-c', controlFile,
		'-t', treesFile,
		'-d', phylipFile,
	]

	let result = execa(executable, args, {
		cwd: workDir,
	})

	result.stdout.pipe(process.stderr)
	result.stderr.pipe(process.stderr)

	await result

	process.stderr.write(execa.sync('ls', ['-l', workDir]).stdout)

	let distributions = readFileOr(path.join(workDir, 'Distributions.txt'), '')
	let probabilities = readFileOr(path.join(workDir, 'Probabilities.txt'), '')
	let results = readFileOr(path.join(workDir, 'Results.txt'), '')

	return { distributions, probabilities, results }

	// yield [
	// 	{
	// 		species: ['lup', 'lap'],
	// 		sequences: ['lup1', 'lap1'],
	// 		distance: 0.0162455,
	// 		probability: 0.0434783,
	// 	}
	// ]
}
