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

// In R, this was the "LoadDataFromFile" function.
// It needs one more parameter, but I don't remember what that one is
// used for.

// TODO: we need a new run of the function for each nonmonophyletic pair
function doThings(file) {
	// The earlier code works for a file of only two individuals, but we wish
	// to generalize this so that it can be used for multiple pairs of
	// individuals and store the appropriate data.

	// Note that for now, we will assume that all sequences in a single file
	// have the same length.

	// Load the data
	let data = parseFasta(file)

	// Cycle through the pairs and compare them, recording results in `out`.
	let out = []

	// TODO: replace with combinatorics function
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
	// I don't know what otherArg is supposed to be
	let otherArg = process.argv[3]

	getData(seqfile1)
		.then(data => doThings(data, otherArg))
		.then(console.log.bind(console))
		.catch(console.error.bind(console))
}

if (require.main === module) {
	main()
}
