'use strict'

const execa = require('execa')
const tempfile = require('tempfile')
const path = require('path')
const fs = require('fs')
const whichOs = require('../lib/which-os')

module.exports = seqgen
function seqgen(data, seqLen = 300, mutationRate = 0.02, generations = 2) {
	const inputFile = tempfile()
	data = `[${seqLen}, ${mutationRate}]${data}`
	fs.writeFileSync(inputFile, data, 'utf-8')

	let seqGen = whichOs.isMac()
		? path.join(__dirname, '..', 'vendor', 'Seq-Gen', 'seq-gen-osx')
		: '/usr/bin/seq-gen'
	let args = ['-mHKY', `-n${generations}`, '-on', inputFile]
	let output = execa.sync(seqGen, args)

	return output.stdout
}
