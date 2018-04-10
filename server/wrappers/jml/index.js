'use strict'

const execa = require('execa')
const tempy = require('tempy')
const path = require('path')
const fs = require('fs')
const toPairs = require('lodash/toPairs')
const escape = require('lodash/escapeRegExp')
const generateControlFile = require('./ctl')
const csv = require('comma-separated-values')

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
async function jml({ phylipData, trees, phylipMapping }) {
	let workDir = tempy.directory()

	let phylipFile = path.join(workDir, 'input.phy')
	fs.writeFileSync(phylipFile, phylipData, 'utf-8')

	let treesFile = path.join(workDir, 'input.species.trees')
	fs.writeFileSync(treesFile, trees, 'utf-8')

	let controlFile = path.join(workDir, 'jml.input.ctl')
	let controlData = generateControlFile(phylipData)
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

	let distributions = readJmlOutputFile(path.join(workDir, 'Distributions.txt'))
	let probabilities = readJmlOutputFile(path.join(workDir, 'Probabilities.txt'))
	let results = readJmlOutputFile(path.join(workDir, 'Results.txt'))

	for (let [hashed, unhashed] of toPairs(phylipMapping)) {
		hashed = hashed.split('x')[0]
		unhashed = unhashed.split('__')[0]
		let regex = new RegExp(escape(hashed), 'g')
		distributions = distributions.replace(regex, unhashed)
		probabilities = probabilities.replace(regex, unhashed)
		results = results.replace(regex, unhashed)
	}

	let distObj = csv.parse(distributions, { header: true, cellDelimiter: '\t' })
	let probObj = csv.parse(probabilities, { header: true, cellDelimiter: '\t' })
	let resObj = csv.parse(results, { header: true, cellDelimiter: '\t' })

	return { distributions: distObj, probabilities: probObj, results: resObj }
}
