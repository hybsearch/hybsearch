#!/usr/bin/env node
'use strict'

const child = require('child_process')
const tempfile = require('tempfile')
const fs = require('fs')
const getData = require('./lib_get-data')

/*
$ mb
> execute {PATH_TO_ALIGNED_NEXUS}
> lset nst=6 rates=invgamma
> prset topologypr = uniform
> prset brlenspr = clock:uniform
> mcmc ngen=20000 samplefreq=100
> no
> sump
> sumt
> quit

# Created consensus tree file: {ORIG_FILENAME}.con.tre
*/

module.exports = mrbayes
function mrbayes(data) {
	const inputFile = tempfile().replace(' ', '\ ')
	const outputFile = inputFile + '.con.tre'
	fs.writeFileSync(inputFile, data, 'utf-8')

	let stdin = [
		`execute ${inputFile}`, // the path to the aligned nexus sequences
		'lset nst=6 rates=invgamma',
		'prset topologypr = uniform',
		'prset brlenspr = clock:uniform',
		'mcmc ngen=20000 samplefreq=100',
		'no',
		'sump',
		'sumt',
		'quit',
	]

	child.execSync('mb', {
		input: stdin.join('\n'),
		encoding: 'utf-8',
	})

	return fs.readFileSync(outputFile, 'utf-8')
}

function main() {
	let file = process.argv[2]

	if (!file && file !== '-') {
		console.error('usage: node mrbayes.js (<input> | -)')
		process.exit(1)
	}

	getData(file)
		.then(mrbayes)
		.then(data => console.log(data))
		.catch(console.error.bind(console))
}

if (require.main === module) {
	main()
}
