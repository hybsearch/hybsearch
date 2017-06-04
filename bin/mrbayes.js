#!/usr/bin/env node
// @ts-check
'use strict'

const execa = require('execa')
const tempfile = require('tempfile')
const fs = require('fs')
const os = require('os')
const path = require('path')
const getData = require('../lib/get-data')
const minimist = require('minimist')
const dedent = require('dedent')


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

function insertCommandBlock(data) {
	let cmdBlock = dedent`
	begin mrbayes;
		set autoclose=yes nowarn=yes;
		lset nst=6 rates=invgamma;
		prset topologypr = uniform;
		prset brlenspr = clock:uniform;
		mcmc ngen=20000 samplefreq=100;
		sumt;
	end;`
	return data.replace('end;', `end;\n${cmdBlock}\n`)
}

module.exports = mrbayes
function mrbayes(data, argv) {
	argv = argv || {}
	const inputFile = tempfile()
	const outputFile = inputFile + '.con.tre'

	// we can control mrbayes with a "command block"
	data = insertCommandBlock(data)

	fs.writeFileSync(inputFile, data, 'utf-8')

	let mb = '/usr/local/bin/mpirun'
	let args = [
		'-np', '4',
		'-mca', 'plm', 'isolated',
		path.join('vendor', 'MrBayes-osx', 'mb-mpi'),
		inputFile,
	]

	let result = execa.sync(mb, args, {
		env: {
			TMPDIR: '/tmp/',
		},
	})

	if (!argv.quiet) {
		process.stderr.write(result.stdout)
		process.stderr.write(result.stderr)
	}

	return fs.readFileSync(outputFile, 'utf-8').replace(os.EOL, '\n')
}

function main() {
	let argv = minimist(process.argv.slice(2))
	let file = argv._[0]

	if (!file && process.stdin.isTTY) {
		console.error('usage: node mrbayes.js (<input> | -) [--quiet]')
		process.exit(1)
	}

	getData(file)
		.then(data => mrbayes(data, argv))
		.then(data => console.log(data))
		.catch(console.error.bind(console))
}

if (require.main === module) {
	main()
}
