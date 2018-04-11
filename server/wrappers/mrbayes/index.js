'use strict'

const execa = require('execa')
const tempy = require('tempy')
const fs = require('fs')
const os = require('os')
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
async function mrbayes(data) {
	const inputFile = tempy.file()
	const outputFile = inputFile + '.con.tre'

	// we can control mrbayes with a "command block"
	data = insertCommandBlock(data)

	fs.writeFileSync(inputFile, data, 'utf-8')

	// find binary via `which`
	let mb = execa.sync('which', ['mb']).stdout

	let executable = mb
	let args = [inputFile]
	let hasMpiRun = false // until we get it working
	if (hasMpiRun) {
		executable = execa.sync('which', ['mpirun']).stdout
		// prettier-ignore
		args = [
			'-np', '4',
			'-mca', 'plm', 'isolated',
			mb,
			inputFile,
		]
	}

	let result = execa(executable, args, {
		env: {
			TMPDIR: '/tmp/',
		},
	})

	result.stdout.pipe(process.stderr)
	result.stderr.pipe(process.stderr)

	await result

	return fs.readFileSync(outputFile, 'utf-8').replace(os.EOL, '\n')
}
