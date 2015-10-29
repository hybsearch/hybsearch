'use strict'

const convert = require('./genbank-to-fasta').convertFiles
const clustal = require('./run-clustal').clustal
const fs = require('fs')

function bannana(file) {
	const output = convert(file)
	clustal(fs.readFileSync(output), {tree: true, output: 'FASTA', infile: output})
}

function main() {
	if (process.argv.length != 3) {
		process.exit(1)
	}
	bannana(process.argv[2])
}

if (require.main === module) {
	main()
}
