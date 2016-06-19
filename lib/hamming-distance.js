'use strict'

// Calculate the hamming distance between two sequences
function hammingDistance(seq1, seq2) {
	// We want to compare the two individuals to find a Hamming distance
	// between them. That is, how many base pairs differ between the two
	// sequences. To do this, we must compare each base pair, one at a time.

	// Track the number of base pairs that are different.
	let counter = 0

	for (let i = 0; i < seq1.length; i++) {
		if (seq1[i] !== seq2[i]) {
			counter += 1
		}
	}

	// returns number of base pairs that differ
	return counter
}

module.exports = hammingDistance
