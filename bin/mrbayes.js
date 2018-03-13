'use strict'

const execa = require('execa')
const tempfile = require('tempfile')
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
function mrbayes(data, argv) {
	argv = argv || {}
	const inputFile = tempfile()
	const outputFile = inputFile + '.con.tre'

	// we can control mrbayes with a "command block"
	data = insertCommandBlock(data)

	fs.writeFileSync(inputFile, data, 'utf-8')

	let mb = '/usr/bin/mb'
	let args = [inputFile]
	let hasMpiRun = false // until we get it working
	if (hasMpiRun) {
		mb = '/usr/local/bin/mpirun'
		// prettier-ignore
		args = [
			'-np', '4',
			'-mca', 'plm', 'isolated',
			'/usr/bin/mb',
			inputFile,
		]
	}

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
