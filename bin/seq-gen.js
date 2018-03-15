'use strict'

const execa = require('execa')
const tempfile = require('tempfile')
const fs = require('fs')

module.exports = seqgen
function seqgen(data, seqLen = 300, mutationRate = 0.02, generations = 2) {
	const inputFile = tempfile()
	data = `[${seqLen}, ${mutationRate}]${data}`
	fs.writeFileSync(inputFile, data, 'utf-8')

	// find binary via `which`
	const executable = execa.sync('which', ['seq-gen'])

	let args = ['-mHKY', `-n${generations}`, '-on', inputFile]
	let output = execa.sync(executable, args)

	return output.stdout
}
