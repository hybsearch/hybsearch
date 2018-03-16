'use strict'

const combs = require('combinations-generator')
const max = require('lodash/max')
const min = require('lodash/min')
const mean = require('lodash/mean')

const hammingDistance = require('./hamming-distance')
const { parseFasta } = require('../formats')

// TODO: we need a new run of the function for each nonmonophyletic pair
function hamdis(file) {
	// The earlier code works for a file of only two individuals, but we wish
	// to generalize this so that it can be used for multiple pairs of
	// individuals and store the appropriate data.

	// Note that for now, we will assume that all sequences in a single file
	// have the same length.

	// Load the data
	let data = parseFasta(file)

	// Cycle through the pairs and compare them, recording results in `out`.
	let out = []

	let first = true
	for (let [a, b] of combs(data, 2)) {
		if (first) {
			console.log(a.species, ':', a.sequence)
			first = false
		}
		console.log(b.species, ':', b.sequence)
		let distance = hammingDistance(a.sequence, b.sequence)
		console.log('hamming distance:', distance)
		out.push(distance)
	}

	// let seqLength = 527
	let seqLength = data[0].sequence.length

	return {
		avg: mean(out),
		min: min(out),
		max: max(out),
		// 527 is estimated sequence length
		percentDifferent: out[0] / seqLength,
		data: out,
	}
}

module.exports = hamdis
