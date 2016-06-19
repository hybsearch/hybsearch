#!/usr/bin/env node
'use strict'

const getData = require('../lib/get-data')
const range = require('lodash/range')
const max = require('lodash/max')
const min = require('lodash/min')
const mean = require('lodash/mean')



// [something something] estimate the number of generations for a species from
// some pieces of information about the species
const estimateGenerations = require('../lib/estimate-generations')



// Calculate the hamming distance between two sequences
const hammingDistance = require('../lib/hamming-distance')



const parseFasta = require('../lib/parse-fasta')
const paired = require('../lib/pair-array')

function doThings(file) {
	// The earlier code works for a file of only two individuals, but we wish
	// to generalize this so that it can be used for multiple pairs of
	// individuals and store the appropriate data.

	// Note that for now, we will assume that all sequences in a single file
	// have the same length.

	// load the data
	let data = parseFasta(file)

	// We create a for loop to cycle through the pairs and compare
	// each one. The loop will record its findings in a list called `out`.
	let out = []

	for (let [a, b] of paired(data)) {
		let taxon1 = a.seq
		let taxon2 = b.seq //.substr(0, taxon1.length)
		// console.log(taxon1)
		// console.log(taxon2)
		out.push(hammingDistance(taxon1, taxon2))
	}

	return {
		avg: mean(out),
		min: min(out),
		max: max(out),
		percent: avgOfRange / data.length,
		data: out,
	}
}


function main() {
	let seqfile1 = process.argv[2]

	// if (!seqfile1) {
	// 	console.error('usage: node hamming-distance-for-pair.js <seqfile> <seqfile>')
	// 	process.exit(1)
	// }

	getData(seqfile1)
		.then(doThings)
		.then(console.log.bind(console))
		// .catch(console.error.bind(console))
}

if (require.main === module) {
	main()
}
