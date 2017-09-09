#!/usr/bin/env node
'use strict'

// Calculate the hamming distance between two sequences
const hammingDistance = require('../lib/hamming-distance')
const readFile = require('../lib/get-data').readFile

function main() {
	let seqfile1 = process.argv[2]
	let seqfile2 = process.argv[3]

	if (!seqfile1 || !seqfile2) {
		console.error('usage: node hamming-distance.js <seqfile> <seqfile>')
		process.exit(1)
	}

	return Promise.all([readFile(seqfile1), readFile(seqfile2)])
		.then(([seq1, seq2]) => hammingDistance(seq1, seq2))
		.then(console.log.bind(console))
		.catch(console.error.bind(console))
}

if (require.main === module) {
	main()
}

