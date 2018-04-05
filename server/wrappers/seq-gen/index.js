'use strict'

const execa = require('execa')
const tempy = require('tempy')
const fs = require('fs')

module.exports = seqgen
function seqgen(data, seqLen = 300, mutationRate = 0.02, generations = 2) {
	const inputFile = tempy.file()
	data = `[${seqLen}, ${mutationRate}]${data}`
	fs.writeFileSync(inputFile, data, 'utf-8')

	// find binary via `which`
	const executable = execa.sync('which', ['seq-gen']).stdout

	let args = ['-mHKY', `-n${generations}`, '-on', inputFile]
	let output = execa.sync(executable, args)

	return output.stdout
}
