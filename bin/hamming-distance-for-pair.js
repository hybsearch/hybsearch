#!/usr/bin/env node
'use strict'


const readFile = require('../lib/get-data').readFile

module.exports = hammingDistance
function hammingDistance(x, y) {
	// We want to compare the two individuals to find a Hamming distance
	// between them. That is, how many base pairs differ between the two
	// sequences. To do this, we must compare each base pair, one at a time.

	// Track the number of base pairs that are different.
	let counter = 0

	for (let i = 0; i < x.length; i++) {
		if (x[i] != y[i]) {
			counter += 1
		}
	}

	// returns number of base pairs that differ
	return counter
}


function main() {
	let seqfile1 = process.argv[2]
	let seqfile2 = process.argv[3]

	if (!seqfile1 || !seqfile2) {
		console.error('usage: node hamming-distance-for-pair.js <seqfile> <seqfile>')
		process.exit(1)
	}

	Promise.all([readFile(seqfile1), readFile(seqfile2)])
		.then(([seq1, seq2]) => hammingDistance(seq1, seq2))
		.then(console.log.bind(console))
		.catch(console.error.bind(console))
}

if (require.main === module) {
	main()
}

