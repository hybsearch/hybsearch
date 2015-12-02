const fs = require('fs')
const clustal = require('./clustal.js')

const aligned = clustal(fs.readFileSync(process.argv[2]), {
		align: true,
		pwgapopen: 15,
		pwgapext: 6.66,
		pwdnamatrix: 'IUB',
		transweight: 0.5,
		gapext: 6.66,
		gapopen: 15,
		// gapdist: 5,
		numiter: 1,
	}, '.aln')

console.log(aligned)
