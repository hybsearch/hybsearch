'use strict'

const convert = require('./genbank-to-fasta').convertFiles
const clustal = require('./run-clustal').clustal
const fs = require('fs')

function main() {
	if (process.argv.length != 3) {
		process.exit(1)
	}
	const output = convert(process.argv[2])
	clustal(fs.readFileSync(output), {tree: true, output: 'FASTA', infile: output})
}

if (require.main === module) {
	main()
}
