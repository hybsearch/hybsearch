#!/usr/bin/env node
'use strict'

const child = require('child_process')
const tempfile = require('tempfile')
const fs = require('fs')
const os = require('os')
const path = require('path')
const getData = require('./lib_get-data')
const minimist = require('minimist')


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

let cmdBlock = `begin mrbayes;
	set autoclose=yes nowarn=yes;
	lset nst=6 rates=invgamma;
	prset topologypr = uniform;
	prset brlenspr = clock:uniform;
	mcmc ngen=20000 samplefreq=100;
	sumt;
end;`

function insertCommandBlock(data, cmd) {
	return data.replace('end;', `end;\n${cmd}\n`)
}

module.exports = mrbayes
function mrbayes(data, argv) {
	argv = argv || {}
	const inputFile = tempfile().replace(' ', '\ ')
	const outputFile = inputFile + '.con.tre'

	// we can control mrbayes with a "command block"
	data = insertCommandBlock(data, cmdBlock)

	fs.writeFileSync(inputFile, data, 'utf-8')

	let mb = 'mpirun -np 4 ./vendor/MrBayes-osx/mb-mpi'
	// let mb = './vendor/MrBayes-osx/mb'
	if (process.platform === 'win32') {
		mb = '.\\vendor\\MrBayes-win\\mrbayes_x64.exe'
	}

	let output = child.execSync(`${mb} ${inputFile}`, {
		encoding: 'utf-8',
		stdio: [undefined, 'pipe', 'pipe'],
	})

	if (!argv.quiet) {
		process.stderr.write(output)
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
