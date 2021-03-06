'use strict'

const execa = require('execa')
const tempy = require('tempy')
const path = require('path')
const fs = require('fs')
const fromPairs = require('lodash/fromPairs')
const toPairs = require('lodash/toPairs')
const generateControlFile = require('./ctl')
const { highlightSignificantResults } = require('./highlight')
const revertHashedIdentifiers = require('./revert-hashed-identifiers')

const readFileOr = (filepath, orValue) => {
	try {
		return fs.readFileSync(filepath, 'utf-8')
	} catch (err) {
		if (err.code === 'ENOENT') {
			return orValue
		}
	}
}

const readJmlOutputFile = filepath => {
	return readFileOr(filepath, '')
		.split('\n')
		.map(l => l.trim())
		.join('\n')
}

module.exports = jml
async function jml({ phylipData, trees, phylipMapping, config }) {
	let workDir = tempy.directory()

	let phylipFile = path.join(workDir, 'input.phy')
	fs.writeFileSync(phylipFile, phylipData, 'utf-8')

	let treesFile = path.join(workDir, 'input.species.trees')
	fs.writeFileSync(treesFile, trees, 'utf-8')

	let controlFile = path.join(workDir, 'jml.input.ctl')
	let controlData = generateControlFile(phylipData, config)
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

	// process.stderr.write(execa.sync('ls', ['-l', workDir]).stdout)

	let distributions = readJmlOutputFile(path.join(workDir, 'Distributions.txt'))
	let probabilities = readJmlOutputFile(path.join(workDir, 'Probabilities.txt'))
	let results = readJmlOutputFile(path.join(workDir, 'Results.txt'))

	let {
		distributions: distObj,
		probabilities: probObj,
		results: resObj,
	} = revertHashedIdentifiers({
		distributions,
		probabilities,
		results,
		phylipMapping,
	})

	resObj = resObj.map(highlightSignificantResults)

	// remove the 'Sp Comparison' key from jml results, since it's duplicated
	// in the seq1/seq2 columns
	resObj = resObj.map(item =>
		fromPairs(toPairs(item).filter(([key]) => key !== 'Sp Comparison'))
	)

	return { distributions: distObj, probabilities: probObj, results: resObj }
}
