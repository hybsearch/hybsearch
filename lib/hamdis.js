'use strict'

const combs = require('combinations-generator')
const max = require('lodash/max')
const min = require('lodash/min')
const mean = require('lodash/mean')

const estimateGenerations = require('../lib/estimate-generations')
const hammingDistance = require('../lib/hamming-distance')

const parseFasta = require('../lib/parse-fasta')
const paired = require('../lib/pair-array')

// TODO: we need a new run of the function for each nonmonophyletic pair
function hamdis(file) {
	// The earlier code works for a file of only two individuals, but we wish
	// to generalize this so that it can be used for multiple pairs of
	// individuals and store the appropriate data.

	// Note that for now, we will assume that all sequences in a single file
	// have the same length.

	// Load the data
	let data = [...parseFasta(file)]

	// Cycle through the pairs and compare them, recording results in `out`.
	let out = []

	// TODO: replace with combinatorics function
	let first = true
	for (let [a, b] of combs(data, 2)) {
		if (first) {
			console.log(a.species, ':', a.seq)
			first = false
		}
		console.log(b.species, ':', b.seq)
		let distance = hammingDistance(a.seq, b.seq)
		console.log('hamming distance:', distance)
		out.push(distance)
	}

	// let seqLength = 527
	let seqLength = data[0].seq.length

	return {
		avg: mean(out),
		min: min(out),
		max: max(out),
		// 527 is estimated seq. length
		percentDifferent: out[0] / seqLength,
		data: out,
	}
}

module.exports = hamdis
